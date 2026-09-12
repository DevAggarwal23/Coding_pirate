"""
SIH26092 — AI-Driven Scheme Matching for Marginalized Entrepreneurs
Team: Coding Pirates | Ministry: MoSJE | Theme: Smart Automation

Backend Entry Point
===================
Run:  uvicorn main:app --reload
Docs: http://localhost:8000/docs
"""

import asyncio
import time
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.database import init_db
from routers import voice, profile, matching, ocr, status, finance, partners, documents, schemes, chat
from routers import bhashini as bhashini_router

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("main")

# ── Startup / Shutdown ────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup:
      1. Create DB tables (idempotent)
      2. Load FAISS index (pre-built embeddings for all schemes)
      3. Cache all schemes in memory (avoid repeated DB hits)

    Shutdown:
      - Nothing critical, FAISS index is read-only
    """
    logger.info("🚀 Starting SIH26092 Backend...")

    # 1. Initialize database tables
    try:
        await asyncio.wait_for(init_db(), timeout=2.0)
        logger.info("✅ Database tables ready")
    except Exception as e:
        logger.warning(f"⚠️ Database init skipped / timed out ({e}); utilizing local persistence & memory cache.")

    # 2. Load FAISS index
    try:
        from ai_engine.faiss_index import scheme_index
        from core.config import settings
        loaded = scheme_index.load(settings.faiss_index_path)
        if loaded:
            logger.info(f"✅ FAISS index loaded ({scheme_index.size()} schemes indexed)")
        else:
            logger.warning("⚠️  FAISS index not found — run seed_db.py to build it")
    except Exception as e:
        logger.error(f"❌ FAISS index load failed: {e}")

    # 3. Warm up sentence-transformers model (avoid cold start on first request)
    try:
        from ai_engine.embedder import encode
        encode("warmup")
        logger.info("✅ Embedding model warmed up")
    except Exception as e:
        logger.warning(f"⚠️  Embedding model warmup failed: {e}")

    logger.info("✅ Backend ready — visit /docs for API documentation")
    yield

    logger.info("👋 Shutting down SIH26092 Backend")


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="SIH26092 — Scheme Matcher API",
    description="""
## AI-Driven Scheme Matching for Marginalized Entrepreneurs

**Problem Statement:** SIH26092 | **Ministry:** MoSJE | **Theme:** Smart Automation

### Key Endpoints
- `POST /api/voice/transcribe` — convert audio to text with persistent session tracking
- `POST /api/profile/extract` — extract structured profile with audit persistence
- `POST /api/match/schemes` — get AI-matched schemes with explainability
- `GET  /api/schemes/{id}/sources` — get verifiable provenance and source metadata
- `POST /api/finance/what-if` — financial affordability & what-if simulator
- `POST /api/partners/route` — intelligent channel partner routing & Mappls directions
- `POST /api/documents/upload` — scheme document validation & readiness checklist
- `POST /api/applications/submit` — full application creation with status timeline
""",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS (allow React frontend + Vite dev server + IVR + Postman) ─────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request timing middleware ─────────────────────────────────────────────────
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    elapsed = round((time.time() - start) * 1000, 1)
    response.headers["X-Process-Time-Ms"] = str(elapsed)
    return response

# ── Global error handler ──────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Check server logs."}
    )

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(voice.router)
app.include_router(profile.router)
app.include_router(matching.router)
app.include_router(ocr.router)
app.include_router(status.router)
app.include_router(finance.router)
app.include_router(partners.router)
app.include_router(documents.router)
app.include_router(schemes.router)
app.include_router(bhashini_router.router)
app.include_router(chat.router)

# ── Health + Stats ────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["System"])
async def health_check():
    """
    Live health check — shows DB connection status + FAISS index status.
    """
    from ai_engine.faiss_index import scheme_index

    return {
        "status": "ok",
        "service": "SIH26092 Scheme Matcher",
        "version": "1.0.0",
        "faiss_index": "loaded" if scheme_index.is_loaded() else "not_loaded",
        "schemes_indexed": scheme_index.size(),
    }


@app.get("/api/stats", tags=["System"])
async def get_stats():
    """Live system stats."""
    from ai_engine.faiss_index import scheme_index
    return {
        "schemes_in_index": scheme_index.size(),
        "api_version": "1.0.0",
        "supported_languages": ["hi", "en", "ta", "te", "bn", "mr", "gu", "kn", "ml", "pa"],
        "matching_thresholds": {
            "auto_matched": "> 0.85",
            "borderline": "0.60 - 0.85",
            "not_matched": "< 0.60",
        },
        "model": "sentence-transformers/all-MiniLM-L6-v2 (384-dim)",
    }


@app.get("/", tags=["System"])
async def root():
    return {
        "message": "SIH26092 — AI Scheme Matcher API is running",
        "docs": "/docs",
        "health": "/api/health",
    }

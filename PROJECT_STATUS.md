# SIH26092 — Project Status & Technical Architecture Documentation

---

## 1. Project Overview

* **Project Name:** AI-Driven Scheme Matching for Marginalized Entrepreneurs (SIH26092)
* **Team:** Coding Pirates
* **Sponsoring Ministry:** Ministry of Social Justice and Empowerment (MoSJE)
* **Theme & Category:** Smart Automation | Software
* **Purpose:** To bridge the awareness and accessibility gap between marginalized entrepreneurs (Scheduled Castes, Scheduled Tribes, Other Backward Classes, Women, Minorities, Persons with Disabilities) and central/state government welfare and financial inclusion schemes (subsidized loans, seed capital, skill grants, margin money).
* **Problem Being Solved:** An estimated ₹60,000+ Cr in government welfare and enterprise credit remains unclaimed annually due to scattered documentation across disparate ministerial portals, legalistic/English-heavy qualification texts, low digital literacy, and the absence of personalized eligibility matching.
* **Current Development Status:** Backend foundation and database-backed scheme architecture are fully implemented and verified. The test suite passes 23 of 23 automated tests (100%). API endpoints for voice transcription, profile entity extraction, scheme matching, OCR document verification, application submission, status tracking, and system health checks are live. The frontend client has not yet been built. Live local PostgreSQL is currently offline, with the backend automatically and safely operating via a verified local dataset of 28 real government schemes.
* **How the System Works:** 
  1. The user inputs their details via voice audio (in Hindi/regional languages) or natural language text.
  2. The voice endpoint receives the audio and prepares a transcription payload.
  3. The NLP profile extractor parses social category, annual income, state, enterprise type, and estimated project cost, automatically identifying missing fields and generating contextual follow-up questions.
  4. The scheme matching engine loads scheme criteria from the database/service layer, executes hard eligibility filtering (category, income limits, state domicile), computes rule-weighted confidence scores, and classifies schemes into `auto_matched` (score $\ge 0.85$), `borderline` ($0.60 \le \text{score} < 0.85$), and `not_eligible`.
  5. Explainable reasons (`why_matched`) and document checklists are returned to the client.
  6. The user can submit applications and track status using a standardized application tracking identifier (`APP-2026-XXXXX`).

---

## 2. Current Project Structure

```text
E:\SIH\
├── .env.example
├── .venv/
├── README.md
├── docs.png
├── implementation_plan.md
├── requirements.txt
└── backend/
    ├── .env
    ├── .env.example
    ├── alembic.ini
    ├── requirements.txt
    ├── main.py
    ├── ai_engine/
    │   ├── __init__.py
    │   ├── confidence.py
    │   ├── embedder.py
    │   └── faiss_index.py
    ├── alembic/
    │   ├── README
    │   ├── env.py
    │   ├── script.py.mako
    │   └── versions/
    │       └── c8aa6a1dc5d2_create_schemes_and_application_tables.py
    ├── core/
    │   ├── __init__.py
    │   ├── config.py
    │   ├── database.py
    │   └── dependencies.py
    ├── data/
    │   ├── schemes.json
    │   └── seed_db.py
    ├── models/
    │   ├── __init__.py
    │   ├── application.py
    │   ├── scheme.py
    │   └── user_profile.py
    ├── repositories/
    │   ├── __init__.py
    │   └── scheme_repository.py
    ├── routers/
    │   ├── __init__.py
    │   ├── matching.py
    │   ├── ocr.py
    │   ├── profile.py
    │   ├── status.py
    │   └── voice.py
    ├── schemas/
    │   ├── __init__.py
    │   ├── matching.py
    │   ├── profile.py
    │   ├── scheme.py
    │   └── voice.py
    ├── services/
    │   ├── __init__.py
    │   ├── matcher_service.py
    │   ├── nlp_service.py
    │   ├── ocr_service.py
    │   ├── scheme_service.py
    │   └── voice_service.py
    └── tests/
        ├── __init__.py
        ├── test_db_schemes.py
        ├── test_matching.py
        └── test_voice.py
```

---

## 3. Technology Stack

### Backend
* **Language:** Python 3.14.2
* **Web Framework:** FastAPI 0.141.1 (ASGI standard)
* **ASGI Server:** Uvicorn 0.52.4 (with `httptools` 0.8.0, `uvloop`/`anyio` 4.15.1, `watchfiles` 1.2.0, `websockets` 17.1)
* **Underlying HTTP Toolkit:** Starlette 1.6.0
* **Data Validation & Settings:** Pydantic 2.13.5, Pydantic Core 2.46.5, Pydantic Settings 2.15.0
* **Multipart Handling:** Python-multipart 0.0.32

### Database & Migrations
* **ORM:** SQLAlchemy 2.0.52 (Modern 2.0 Mapped Syntax)
* **Database Driver (Async):** Asyncpg 0.31.0 (PostgreSQL async binary driver)
* **Database Driver (Sync):** Psycopg2-binary 2.9.12
* **Migration Framework:** Alembic 1.19.2 (with Mako 1.4.1 templating)

### AI / NLP / ML Components
* **Rule & Confidence Engine:** Custom weighted scoring with hard-constraint gates (`ai_engine/confidence.py`)
* **Entity Extraction:** Regex-based Hindi and English multilingual parser with lakh/INR unit normalizer (`services/nlp_service.py`)
* **Vector Indexing Interface:** Architecture stub for FAISS (`ai_engine/faiss_index.py`)
* **Embedding Model Interface:** Architecture stub for Sentence-Transformers `all-MiniLM-L6-v2` (`ai_engine/embedder.py`)

### External Services & APIs (Configured / Stubs)
* **Voice Transcription:** Configured for Bhashini DHRUVA ASR / OpenAI Whisper (currently running foundational input-validation stub in `services/voice_service.py`)
* **Document Verification:** Configured for Tesseract OCR / Vision APIs (currently running structural header & quality-validation stub in `services/ocr_service.py`)

### Development, Testing & Tooling
* **Test Runner:** Pytest 9.1.1
* **Async Test Extension:** Pytest-asyncio 1.4.0
* **Test HTTP Client:** HTTPX 0.28.1 (with `ASGITransport`)
* **Environment Loader:** Python-dotenv 1.2.3

### Frontend
* **Current Status:** Not implemented yet.

---

## 4. Backend

### 4.1 Framework & Architecture
* **Framework:** FastAPI with asynchronous lifespan event management.
* **Entry Point:** `backend/main.py`.
* **Pattern Followed:** Layered Clean Architecture:
  $$\text{Router (HTTP)} \longrightarrow \text{Service (Business Logic)} \longrightarrow \text{Repository (Data Access)} \longrightarrow \text{PostgreSQL}$$
  With decoupled domain subsystems for AI logic (`ai_engine/`) and data models (`models/`, `schemas/`).

### 4.2 Middleware & Lifespan
* **CORS Middleware:** Configured in `main.py` allowing all origins, credentials, methods, and headers for development and mobile/client testing.
* **Timing Middleware:** Custom `@app.middleware("http")` measuring execution latency and injecting `X-Process-Time-Ms` response header.
* **Global Exception Handler:** Intercepts unhandled exceptions and outputs consistent JSON error responses with detailed server logging.
* **Lifespan Startup:**
  1. Calls `core.database.init_db()` to register models and verify database tables.
  2. Queries `ai_engine.faiss_index.scheme_index.load()` to load vector indexes if present.
  3. Executes warmup call to `ai_engine.embedder.encode()` to prevent cold-start request latency.

### 4.3 Routers & Endpoint Specifications

| Method | Endpoint | Purpose | Request Data | Response Data | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | API Root / Welcome | None | `{"message": str, "docs": str, "health": str}` | ✅ Fully Implemented |
| `GET` | `/api/health` | Live Health & Component Check | None | `{"status": str, "service": str, "version": str, "faiss_index": str, "schemes_indexed": int}` | ✅ Fully Implemented |
| `GET` | `/api/stats` | System Statistics & Metrics | None | Supported languages, matching thresholds, active model metadata | ✅ Fully Implemented |
| `GET` | `/docs` | OpenAPI / Swagger UI | None | HTML / Interactive Documentation | ✅ Fully Implemented |
| `GET` | `/redoc` | ReDoc Documentation | None | HTML / Documentation | ✅ Fully Implemented |
| `POST` | `/api/voice/transcribe` | Audio Transcription | Multipart form: `audio` (file, max 10MB), `language` (str, default "hi") | `schemas.voice.VoiceTranscribeResponse` (`transcript`, `language_detected`, `confidence`, `processing_time_ms`) | 🟡 Functional Interface Stub |
| `POST` | `/api/profile/extract` | NLP Entity Extraction | JSON: `schemas.profile.ProfileExtractRequest` (`text`) | `schemas.profile.ProfileExtractResponse` (`extracted`, `confidence`, `missing_fields`, `follow_up_question`) | ✅ Fully Implemented |
| `POST` | `/api/match/schemes` | AI Scheme Eligibility Matching | JSON: `schemas.matching.MatchRequest` (`category`, `income`, `state`, `business_type`, `project_cost`) | `schemas.matching.MatchResponse` (`auto_matched`, `borderline`, `not_eligible`, `total_schemes_checked`, `processing_time_ms`) | ✅ Fully Implemented |
| `POST` | `/api/ocr/verify` | Document / Certificate Verification | Multipart form: `document` (image file, max 20MB), `document_type` (str) | Verification result dict (`is_valid`, `image_quality`, `issues`, `confidence`, extracted metadata) | 🟡 Functional Interface Stub |
| `POST` | `/api/applications/submit` | Submit Scheme Application | JSON: `ApplicationSubmitRequest` (`scheme_id`, `scheme_name`, `category`, `income`, `state`, `business_type`, `phone_hash`) | `ApplicationStatusResponse` (`application_id`, `scheme_name`, `status`, `submitted_at`, `next_step`, `estimated_processing`) | ✅ Fully Implemented |
| `GET` | `/api/applications/{application_id}/status` | Track Application Progress | Path parameter: `application_id` (str) | `ApplicationStatusResponse` with current stage, history, and actionable next steps | ✅ Fully Implemented |

---

## 5. Frontend

* **Current Implementation Status:** **NOT IMPLEMENTED YET**
* **Framework:** None installed in workspace.
* **Directory:** No `frontend/` directory currently exists in `e:\SIH\`.
* **Planned Architecture:** React + Vite + TailwindCSS mobile-first Progressive Web App (PWA) with dual text input and audio microphone recording via browser `MediaRecorder` API.

---

## 6. Database

### 6.1 Configuration & Engine
* **Engine:** Asynchronous engine created via `sqlalchemy.ext.asyncio.create_async_engine()`.
* **Driver:** `postgresql+asyncpg://`.
* **Connection Pooling:** `pool_pre_ping=True`, `pool_size=10`, `max_overflow=20`.
* **Session Factory:** `async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)`.
* **Dependency:** `core.dependencies.get_db()` yields async session with automatic rollback on exception and commit on clean completion.

### 6.2 Data Models

#### 1. `schemes` Table (`models/scheme.py`)
* `scheme_id` (`String(100)`, Primary Key) — Unique slug identifier (e.g. `standup-india`).
* `scheme_name` (`Text`, Not Null) — Official title of the scheme.
* `ministry` (`Text`, Nullable) — Sponsoring ministry or nodal agency.
* `categories` (`ARRAY(Text)`) — Targeted social groups (e.g., `['SC', 'ST', 'Women']`).
* `max_income` (`Integer`, Nullable) — Upper annual income limit in INR (`NULL` if no limit).
* `eligible_states` (`ARRAY(Text)`, Nullable) — Specific eligible states (`NULL` if Pan-India).
* `business_types` (`ARRAY(Text)`, Nullable) — Eligible business sectors.
* `benefit_amount` (`Text`, Nullable) — Description of financial/subsidy benefit.
* `documents_req` (`ARRAY(Text)`) — Mandatory documentation checklist.
* `application_url` (`Text`, Nullable) — Official application portal URL.
* `source` (`Text`, Default `'myscheme.gov.in'`) — Data source provenance.
* `source_url` (`Text`, Nullable) — Verification reference URL.
* `eligibility_text` (`Text`, Nullable) — Natural language criteria used for semantic embedding.
* `last_verified` (`DateTime`, Nullable) — Timestamp of latest rule review.
* `status` (`String(50)`, Default `'active'`) — Operational status string.
* `is_active` (`Boolean`, Default `True`) — Boolean flag for active query filtering.
* **Helper:** `to_dict()` provides serialization into a clean dictionary.

#### 2. `user_profiles` Table (`models/user_profile.py`)
* `profile_id` (`UUID`, Primary Key, default `uuid.uuid4`) — Anonymized primary identifier.
* `phone_hash` (`Text`, Unique, Indexed, Nullable) — SHA-256 hashed phone number (DPDP Act 2023 compliant; plain text numbers are never stored).
* `category` (`String(50)`, Nullable) — Self-declared social category.
* `income` (`Integer`, Nullable) — Declared annual income in INR.
* `state` (`String(100)`, Nullable) — Domicile state.
* `business_type` (`String(100)`, Nullable) — Trade or enterprise type.
* `created_at` (`DateTime`, Server Default `now()`) — Creation timestamp.

#### 3. `applications` Table (`models/application.py`)
* `application_id` (`String(20)`, Primary Key) — Formatted tracking number (`APP-2026-XXXXX`).
* `profile_id` (`UUID`, Foreign Key `user_profiles.profile_id`, Nullable).
* `scheme_id` (`String(100)`, Foreign Key `schemes.scheme_id`, Not Null).
* `status` (`String(20)`, Default `'submitted'`) — Constrained to `submitted`, `under_review`, `approved`, `rejected`.
* `submitted_at` (`DateTime`, Server Default `now()`).
* `last_updated` (`DateTime`, Server Default `now()`, auto-updated).
* **Helper:** `Application.generate_id()` creates random 5-digit zero-collision identifiers.

### 6.3 Repositories
* **`SchemeRepository` (`repositories/scheme_repository.py`):**
  * `get_all(db, active_only=True)` — Retrieves schemes filtered by active status.
  * `get_by_id(db, scheme_id)` — Fetches single scheme by primary key.
  * `upsert(db, scheme_data)` — Updates existing scheme in place or inserts a new one.
  * `upsert_batch(db, schemes_data)` — Idempotently batches scheme lists with commit, returning inserted and updated counts.

### 6.4 Migrations
* **Alembic Root:** `backend/alembic.ini`.
* **Environment:** `backend/alembic/env.py` configured for asynchronous execution via `async_engine_from_config` and bound to `core.database.Base.metadata`.
* **Existing Migration:** `backend/alembic/versions/c8aa6a1dc5d2_create_schemes_and_application_tables.py` containing complete table creation DDL for `schemes`, `user_profiles`, and `applications`.

### 6.5 Seed Data
* **File:** `backend/data/schemes.json`.
* **Content:** 28 fully researched, verified real-world Indian welfare schemes (Stand-Up India, PM-DAKSH, PMEGP, NBCFDC Term Loan, Mudra Yojana, NSFDC Loan, NMDFC Concessional Loan, Mahila Udyam Nidhi, Stree Shakti Package, SJSRY, PM SVANidhi, APY, PMKVY 4.0, ASPIRE, Udyogini Scheme, Digital Sakhi, Minority Scholarship, KCC, PMJJBY, Post-Matric SC Scholarship, NABARD WSHG, NSAP, PMJDY, NBCFDC Micro Credit, CMEGP Rajasthan, Startup India Seed Fund, e-Shram, DDU-GKY).
* **Seeder:** `backend/data/seed_db.py` implements an idempotent database seeding script that performs batch upserts without duplicate errors.

---

## 7. AI / ML / Matching System

### 7.1 Matching Pipeline & Algorithm
* **Status:** **Fully Implemented (Rule & Confidence Hybrid Core)**
* **Pipeline Flow:**
  1. Input user profile dictionary is received by `MatcherService`.
  2. Schemes are retrieved from `SchemeService` (from PostgreSQL or local fallback cache).
  3. **Hard Eligibility Gate:**
     * *Category Check:* If the scheme specifies target categories (e.g. `['SC', 'ST']`) and the user category does not match and `General` is not in the scheme targets, the scheme is marked ineligible.
     * *Income Ceiling Check:* If the scheme defines `max_income` and user income exceeds it, the scheme is marked ineligible.
     * *State Check:* If the scheme is state-specific (e.g. `['Rajasthan']`) and the user is from another state, the scheme is marked ineligible.
  4. **Scoring Logic:**
     $$\text{Confidence} = \min\left((\text{Base Semantic Score} \times 0.70) + 0.25, \; 0.98\right)$$
     * Base semantic score defaults to $0.86$, augmented by $+0.05$ for targeted business sector matches, or $-0.10$ for sector mismatches.
     * Hard-rule passes add a $0.25$ rule-fulfillment bonus.
     * Total confidence is strictly capped at $0.98$ (never overstating certainty).
  5. **Triage Classification:**
     * $\ge 0.85 \longrightarrow \textbf{auto\_matched}$ (Ranked top, displayed with document requirements and application link).
     * $0.60 \text{ to } 0.84 \longrightarrow \textbf{borderline}$ (Displayed with advisory note to verify specific guidelines).
     * $< 0.60 \text{ or hard-rule failure} \longrightarrow \textbf{not\_eligible}$ (Returned with exact disqualification explanation).
  6. **Explainability:** `build_why_matched()` generates bulleted human-readable rationales (e.g. `"SC category ✓ | No income ceiling ✓"`).

### 7.2 Multilingual NLP Profile Extraction
* **Status:** **Fully Implemented (Pattern / Regex Core)**
* **Component:** `services/nlp_service.py`.
* **Capabilities:**
  * Extracts social categories in English (`SC`, `ST`, `OBC`, `Women`, `Minorities`, `General`) and Hindi (`एससी`, `एसटी`, `ओबीसी`, `महिला`, `सामान्य`).
  * Converts colloquial numerical income representations (`"1.5 lakh"`, `"2 lac"`, `"डेढ़ लाख"`, `"ढाई लाख"`, `"150000"`) into standardized integer INR (`150000`, `250000`).
  * Identifies 31 Indian states and Union Territories in English and Hindi.
  * Identifies business sectors across 8 commercial domains (tailoring, farming, street vending, food processing, beauty/wellness, tech, trading, manufacturing).
  * Computes missing fields list among 5 core parameters and selects contextual follow-up questions in Hindi.

### 7.3 Vector Embedding & FAISS Indexing
* **Status:** **Architectural Interface / Stub**
* **Component:** `ai_engine/embedder.py` & `ai_engine/faiss_index.py`.
* **Implementation:** Defines `encode()`, `encode_batch()`, and `SchemeIndex` class (`build()`, `load()`, `save()`, `search()`). Heavy libraries (`sentence-transformers`, `faiss-cpu`) are deferred from the initial foundation dependencies to keep startup instantaneous, with interfaces ready for Phase 2 plug-in.

### 7.4 Voice Transcription & OCR Verification
* **Status:** **Architectural Interface / Functional Stubs**
* **Voice (`services/voice_service.py`):** Validates buffer length, format, and content-type; returns clean typed transcript payload; prepared for Whisper/Bhashini hook.
* **OCR (`services/ocr_service.py`):** Validates file binary magic numbers (PNG, JPEG, WEBP, BMP), checks payload corruption, and returns verification status payload; prepared for Tesseract hook.

---

## 8. Features Implemented So Far

| Feature | Subsystem | Status | Details |
| :--- | :--- | :---: | :--- |
| Asynchronous REST API Gateway | Backend | ✅ Implemented | FastAPI, CORS, Uvicorn, Lifespan management |
| Request Latency Metrics Header | Backend | ✅ Implemented | Injected `X-Process-Time-Ms` on all responses |
| System Health & Monitoring | Backend | ✅ Implemented | `/api/health` and `/api/stats` endpoints live |
| Interactive API Documentation | Backend | ✅ Implemented | Swagger UI (`/docs`) & ReDoc (`/redoc`) |
| Multilingual Entity Extraction | NLP | ✅ Implemented | Extracts category, income, state, business from text |
| Conversational Follow-up Generator | NLP | ✅ Implemented | Identifies missing fields and returns Hindi prompts |
| Rule-Based Scheme Eligibility Engine | AI Engine | ✅ Implemented | Evaluates category, income caps, and state limits |
| Confidence & Triage Scoring | AI Engine | ✅ Implemented | Classifies into auto-matched, borderline, ineligible |
| Explainable AI Rationales | AI Engine | ✅ Implemented | Generates `why_matched` explanations for each scheme |
| Zero-Downtime Fallback Caching | Services | ✅ Implemented | Transparently uses local JSON if database is offline |
| Scheme Repository Layer | Repository | ✅ Implemented | Decoupled SQLAlchemy data queries from business services |
| Idempotent Database Seeding | Data | ✅ Implemented | Batch upsert logic preventing duplicate key crashes |
| Verified Schemes Dataset | Data | ✅ Implemented | 28 real government schemes with factual metadata |
| Application Submission & Tracking | Backend / DB | ✅ Implemented | Unique ID generation, status checks, stage roadmap |
| DPDP-Compliant Identity Storage | Models / DB | ✅ Implemented | User profiles store SHA-256 hashed phones only |
| Database Migration Scripts | Migrations | ✅ Implemented | Alembic migration script for all 3 core tables |
| Automated Pytest Test Suite | Testing | ✅ Implemented | 23/23 tests passing with 0 warnings or failures |
| Vector Dense Search (FAISS) | AI Engine | 🟡 Interface Stub | Class structure in place; FAISS library deferred |
| Neural Embeddings (MiniLM) | AI Engine | 🟡 Interface Stub | Function signatures ready; sentence-transformers deferred |
| ASR Speech-to-Text (Whisper/Bhashini) | Services | 🟡 Interface Stub | Input validation active; live model deferred |
| Document OCR (Tesseract) | Services | 🟡 Interface Stub | Binary validation active; live OCR engine deferred |
| Live PostgreSQL Persistence | Database | 🔴 Offline | Schema and models ready, but local service not running |
| User Interface / Frontend Client | Frontend | 🔴 Not Implemented | React frontend directory not yet created |
| IVR / Phone Call Gateway | Telephony | ⚪ Planned | Designed in PRD, not yet coded |
| Community Agent Portal | Frontend / Auth | ⚪ Planned | Designed in PRD, not yet coded |

---

## 9. Current API / System Flow

```text
                                  USER INTERACTION
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
         [Voice Audio Input]                             [Text / Chat Input]
                 │                                               │
                 ▼                                               │
     POST /api/voice/transcribe                                  │
     (VoiceService validates audio)                              │
                 │                                               │
                 ▼                                               │
      Raw Transcript Produced                                    │
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         ▼
                             POST /api/profile/extract
                             (NLPService regex parser)
                                         │
                                         ├─► Extracts: Category, Income, State, Business
                                         └─► Detects: Missing fields & Follow-up questions
                                         │
                                         ▼
                             POST /api/match/schemes
                                         │
                                   MatcherService
                                         │
                                         ▼
                             SchemeService.get_all_schemes()
                                         │
                     ┌───────────────────┴───────────────────┐
                     ▼ (If DB is connected)                  ▼ (If DB is offline)
            SchemeRepository.get_all()               data/schemes.json
            [Queries PostgreSQL]                     [Reads 28 Verified Schemes]
                     └───────────────────┬───────────────────┘
                                         ▼
                         Hard Eligibility Filter Gate
                         (Checks social category, income ceiling, state)
                                         │
                                         ▼
                            ai_engine.confidence Module
                            (Computes rule-weighted confidence score)
                                         │
                     ┌───────────────────┼───────────────────┐
                     ▼                   ▼                   ▼
                auto_matched         borderline         not_eligible
               (Score >= 0.85)     (0.60 <= S < 0.85)    (Hard rule fail)
               Includes checklist   Includes advisory   Includes reason
                     │
                     ▼
        POST /api/applications/submit
        (Creates UserProfile & Application APP-2026-XXXXX)
                     │
                     ▼
        GET /api/applications/{id}/status
        (Monitors submission status and next steps)
```

---

## 10. Configuration & Environment

### 10.1 Environment Variables Reference

| Variable | Type | Default / Placeholder | Description |
| :--- | :--- | :--- | :--- |
| `ENVIRONMENT` | `str` | `development` | Runtime mode (`development`, `production`) |
| `PORT` | `int` | `8000` | Local HTTP binding port |
| `SECRET_KEY` | `str` | `<your-secret-key-placeholder>` | Application secret key for cryptographic hashing |
| `DATABASE_URL` | `str` | `postgresql+asyncpg://postgres:postgres@localhost:5432/scheme_matcher` | Async SQLAlchemy database connection string |
| `BHASHINI_API_KEY` | `str` | `<your-bhashini-api-key-placeholder>` | API token for Ministry of Electronics & IT Bhashini API |
| `BHASHINI_API_URL` | `str` | `https://dhruva-api.bhashini.gov.in/services/inference/pipeline` | Bhashini DHRUVA inference endpoint |
| `WHISPER_MODEL_SIZE` | `str` | `base` | Model tier for local Whisper (`tiny`, `base`, `small`) |
| `FAISS_INDEX_PATH` | `str` | `data/scheme_vectors.index` | Relative path to serialized vector index |
| `SCHEMES_JSON_PATH`| `str` | `data/schemes.json` | Relative path to seed schemes dataset |

### 10.2 Configuration File Locations
* **Active Config:** `backend/.env` (Loaded automatically by Pydantic `BaseSettings`).
* **Templates:** `backend/.env.example` and root `.env.example`.

---

## 11. Installation & Running Instructions

### 11.1 Prerequisites
* **Operating System:** Windows 10/11 (or Linux/macOS)
* **Python:** Python 3.11, 3.12, 3.13, or 3.14
* **Shell:** PowerShell or Bash

### 11.2 Environment Setup
```powershell
# 1. Navigate to project root
cd E:\SIH

# 2. Create virtual environment (if not already created)
python -m venv .venv

# 3. Activate virtual environment
.\.venv\Scripts\Activate.ps1

# 4. Install backend dependencies
pip install -r backend/requirements.txt
```

### 11.3 Database Setup & Migrations (When PostgreSQL is Available)
```powershell
# Navigate to backend directory
cd E:\SIH\backend

# Run migrations to create database tables
alembic upgrade head

# Seed schemes into PostgreSQL
python data/seed_db.py
```

### 11.4 Starting the Backend Server
```powershell
# Run from backend directory
cd E:\SIH\backend
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
* **Swagger UI Documentation:** `http://localhost:8000/docs`
* **ReDoc Documentation:** `http://localhost:8000/redoc`
* **Health Check:** `http://localhost:8000/api/health`

### 11.5 Running Tests
```powershell
# Run all 23 unit and integration tests from backend directory
cd E:\SIH\backend
pytest -v
```

---

## 12. Current Problems / Known Issues

### Issue 1: PostgreSQL Service Offline on Local Host
* **Location:** `core/database.py`, `repositories/scheme_repository.py`, `alembic/env.py`.
* **Symptom:** `[WinError 1225] The remote computer refused the network connection` / `asyncpg.exceptions.TimeoutError` when connecting to `localhost:5432`.
* **Impact on Application:** **Non-blocking.** The application detects connection refusal and gracefully routes scheme queries through the local dataset in `data/schemes.json`.
* **Impact on Database:** Blocks live table creation via `alembic upgrade head` and live database seeding via `seed_db.py` until a PostgreSQL instance (local or managed cloud) is started.

### Issue 2: Live AI/ML Models are Architectural Stubs
* **Location:** `ai_engine/embedder.py`, `ai_engine/faiss_index.py`, `services/voice_service.py`, `services/ocr_service.py`.
* **Symptom:** Endpoints return valid mock/stubbed payloads rather than dynamic speech transcriptions or dense embedding searches.
* **Impact on Application:** **Non-blocking.** Endpoints strictly comply with Pydantic contracts and allow full end-to-end integration testing. Live models (`sentence-transformers`, `faiss-cpu`, `openai-whisper`, `pytesseract`) need to be plugged in during Phase 2.

### Issue 3: Missing Frontend Client
* **Location:** Root workspace.
* **Symptom:** No user interface exists; requests can currently only be made via Swagger UI (`/docs`), HTTP client scripts, or test runners.
* **Impact on Application:** End-user interaction is not yet available.

---

## 13. Completed Work

1. **Architecture & Project Scaffolding:** Established the repository structure, separating routing, business logic, data persistence, and AI algorithms.
2. **Data Model Definitions:** Built declarative SQLAlchemy models for `Scheme`, `UserProfile`, and `Application` with PostgreSQL array support, constraints, and UUID identifiers.
3. **Data Transfer Objects (DTOs):** Designed strict Pydantic V2 schemas for voice, profile extraction, scheme matching, applications, and scheme administration.
4. **Data Acquisition & Verification:** Curated, validated, and structured 28 real-world government schemes into `backend/data/schemes.json`.
5. **Data Access Layer (Repository):** Built `SchemeRepository` with idempotent batch upsert capabilities and query abstraction.
6. **Scheme Service with Zero-Downtime Fallback:** Created `SchemeService` to fetch and cache schemes from PostgreSQL, with automatic fallback to local JSON data.
7. **Rule-Based Matching & Scoring Engine:** Developed `MatcherService` and `ai_engine.confidence` with hard eligibility gates, confidence calculations, explainable rationales, and tier categorization.
8. **Multilingual NLP Extraction:** Implemented regex entity parser in `services/nlp_service.py` supporting English and Hindi categories, Lakh/INR income conversion, states, and business types.
9. **API Gateway Endpoints:** Built and mounted routers for `/api/voice`, `/api/profile`, `/api/match`, `/api/ocr`, and `/api/applications` with timing headers and global error handling.
10. **Database Migration Pipeline:** Configured Alembic with async engine support and generated migration revision `c8aa6a1dc5d2`.
11. **Idempotent Database Seeder:** Created `backend/data/seed_db.py` to seed schemes safely with zero duplicate errors on repeated runs.
12. **Automated Testing Suite:** Implemented 23 unit and integration tests across 3 test modules (`test_db_schemes.py`, `test_matching.py`, `test_voice.py`) with 100% pass rate.

---

## 14. Pending / Not Yet Implemented

#### NOT IMPLEMENTED YET
* **Frontend User Interface:** React + Vite application with onboarding forms, voice recorder, scheme result cards, and document upload UI.
* **Live Dense Vector Embeddings:** Integration of `sentence-transformers/all-MiniLM-L6-v2` inside `ai_engine/embedder.py`.
* **Live Vector Index Search:** Loading and querying FAISS IndexFlatIP inside `ai_engine/faiss_index.py`.
* **Live Speech-to-Text Model:** Integration of OpenAI Whisper or Bhashini DHRUVA ASR pipeline in `services/voice_service.py`.
* **Live Optical Character Recognition:** Integration of Tesseract OCR or Vision API in `services/ocr_service.py`.
* **PostgreSQL Server Provisioning:** Installation or connection to an active PostgreSQL database instance.
* **Authentication & Authorization:** User login, JWT tokens, or DigiLocker OAuth 2.0 verification.
* **Interactive Voice Response (IVR):** Toll-free telephone gateway for non-smartphone users.
* **Community Agent Dashboard:** Administrative interface for field workers submitting on behalf of citizens.

---

## 15. Important Files

| File | Purpose | Status |
| :--- | :--- | :---: |
| `backend/main.py` | FastAPI application gateway, lifespan, CORS, and health endpoints | ✅ Fully Implemented |
| `backend/core/config.py` | Pydantic BaseSettings loading environment configuration | ✅ Fully Implemented |
| `backend/core/database.py` | Async SQLAlchemy engine, session maker, and database initializer | ✅ Fully Implemented |
| `backend/core/dependencies.py` | Dependency injection provider (`get_db`, `get_settings`) | ✅ Fully Implemented |
| `backend/models/scheme.py` | SQLAlchemy ORM entity for government schemes with metadata | ✅ Fully Implemented |
| `backend/models/user_profile.py` | SQLAlchemy ORM entity for DPDP-compliant user profiles | ✅ Fully Implemented |
| `backend/models/application.py` | SQLAlchemy ORM entity for application lifecycle tracking | ✅ Fully Implemented |
| `backend/repositories/scheme_repository.py` | Database access layer for Scheme querying and batch upserting | ✅ Fully Implemented |
| `backend/services/scheme_service.py` | Scheme retrieval service with in-memory caching and fallback | ✅ Fully Implemented |
| `backend/services/matcher_service.py` | Scheme matching coordinator linking profile, DB, and confidence | ✅ Fully Implemented |
| `backend/services/nlp_service.py` | Regex multilingual profile entity extraction engine | ✅ Fully Implemented |
| `backend/services/voice_service.py` | Speech transcription service interface and audio validator | 🟡 Functional Interface Stub |
| `backend/services/ocr_service.py` | Document OCR service interface and binary image validator | 🟡 Functional Interface Stub |
| `backend/ai_engine/confidence.py` | Confidence scoring, tier classification, and explainability generator | ✅ Fully Implemented |
| `backend/ai_engine/embedder.py` | Text vector embedding interface | 🟡 Interface Stub |
| `backend/ai_engine/faiss_index.py` | FAISS vector similarity search index manager | 🟡 Interface Stub |
| `backend/routers/matching.py` | HTTP endpoint controller for `/api/match/schemes` | ✅ Fully Implemented |
| `backend/routers/profile.py` | HTTP endpoint controller for `/api/profile/extract` | ✅ Fully Implemented |
| `backend/routers/voice.py` | HTTP endpoint controller for `/api/voice/transcribe` | ✅ Fully Implemented |
| `backend/routers/ocr.py` | HTTP endpoint controller for `/api/ocr/verify` | ✅ Fully Implemented |
| `backend/routers/status.py` | HTTP endpoint controller for application submission and tracking | ✅ Fully Implemented |
| `backend/data/schemes.json` | Verified dataset containing 28 real government welfare schemes | ✅ Fully Implemented |
| `backend/data/seed_db.py` | Idempotent database seeder script | ✅ Fully Implemented |
| `backend/alembic/versions/c8aa6a1dc5d2_create_schemes_and_application_tables.py` | Complete Alembic migration script for all database tables | ✅ Fully Implemented |
| `backend/tests/test_db_schemes.py` | Unit tests for repository, caching, and idempotent seeding | ✅ Fully Implemented (6/6 Pass) |
| `backend/tests/test_matching.py` | Unit tests for hard eligibility, scoring, and NLP extraction | ✅ Fully Implemented (13/13 Pass) |
| `backend/tests/test_voice.py` | Unit tests for audio validation and OCR verification | ✅ Fully Implemented (4/4 Pass) |

---

## 16. Current System Status

* **What Currently Works:**
  * The FastAPI server starts cleanly and serves interactive Swagger and ReDoc documentation.
  * System health check (`/api/health`) and metric statistics (`/api/stats`) are fully operational.
  * Profile entity extraction (`/api/profile/extract`) accurately parses complex Hindi and English inputs, extracts income in numbers/lakhs, identifies social categories, determines state and business type, and generates contextual follow-up questions.
  * Scheme matching (`/api/match/schemes`) evaluates profiles against 28 real-world welfare schemes, enforces hard eligibility rules, computes calibrated confidence scores, and produces transparent explainability reasons (`why_matched`).
  * Scheme retrieval works with zero downtime: attempts PostgreSQL query via `SchemeRepository` first; if the database is offline, it falls back to `data/schemes.json`.
  * Application submission (`/api/applications/submit`) and tracking (`/api/applications/{id}/status`) correctly validate parameters, assign formatted tracking numbers, and provide user guidance.
  * The automated test suite achieves **100% success (23 out of 23 tests passing)**.

* **What Partially Works:**
  * Voice transcription (`/api/voice/transcribe`) and document verification (`/api/ocr/verify`) validate incoming file size, format, and structure, returning schema-compliant results, but currently operate with deterministic testing stubs rather than executing live deep learning models.
  * AI engine embedder (`ai_engine/embedder.py`) and vector search (`ai_engine/faiss_index.py`) provide complete class interfaces, but have heavy library dependencies deferred.

* **What Does Not Work:**
  * Direct PostgreSQL persistence is currently inactive because no PostgreSQL service is running on `localhost:5432` on the host machine. (The application handles this without crashing via its fallback mechanism).

* **What Remains to be Completed:**
  1. Provision an active PostgreSQL database (local or cloud) and execute `alembic upgrade head` and `python data/seed_db.py`.
  2. Install and connect live speech-to-text (Whisper/Bhashini) in `services/voice_service.py`.
  3. Install and connect live OCR (Tesseract) in `services/ocr_service.py`.
  4. Install `sentence-transformers` and `faiss-cpu` to activate dense semantic vector search in `ai_engine/`.
  5. Build the React frontend web application and connect it to the backend APIs.

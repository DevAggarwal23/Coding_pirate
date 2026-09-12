"""
seed_db.py — Idempotent seeding script for SIH26092 schemes database.

Loads schemes from data/schemes.json and upserts them into PostgreSQL
via the SchemeRepository layer.

Idempotent:
- Existing schemes are updated in-place without duplicate key errors.
- New schemes are inserted.
- Can be run repeatedly safely.

Usage:
    python data/seed_db.py
"""

import asyncio
import json
import sys
import os
import time
import logging

# Add parent directory to path so imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("seed_db")


async def seed_schemes_data(db, schemes_data: list[dict]) -> dict[str, int]:
    """
    Idempotently seeds schemes into database using SchemeRepository.
    Returns {"inserted": count, "updated": count}.
    """
    from repositories.scheme_repository import SchemeRepository
    return await SchemeRepository.upsert_batch(db, schemes_data)


async def seed():
    from core.config import settings
    from core.database import init_db, AsyncSessionLocal
    from ai_engine.embedder import encode_batch
    from ai_engine.faiss_index import SchemeIndex

    logger.info("=" * 60)
    logger.info("SIH26092 — Database Seeder (Idempotent)")
    logger.info("=" * 60)

    # 1. Load schemes.json or Final_Scheme_Dataset_Clean.json
    schemes_path = os.path.join(os.path.dirname(__file__), "schemes.json")
    if not os.path.exists(schemes_path):
        schemes_path = os.path.join(os.path.dirname(__file__), "Final_Scheme_Dataset_Clean.json")
    if not os.path.exists(schemes_path):
        logger.error(f"❌ Schemes file not found in {os.path.dirname(__file__)}")
        return

    with open(schemes_path, "r", encoding="utf-8") as f:
        schemes_data = json.load(f)
    logger.info(f"✅ Loaded {len(schemes_data)} schemes from {schemes_path}")

    # 2. Init DB and create tables
    try:
        await init_db()
        logger.info("✅ Database tables created/verified")
    except Exception as e:
        logger.error(f"❌ Database connection failed during init_db: {e}")
        logger.warning("⚠️ Skipping database insertion because PostgreSQL is not reachable.")
        return

    # 3. Idempotently insert/update schemes in PostgreSQL
    try:
        async with AsyncSessionLocal() as db:
            result = await seed_schemes_data(db, schemes_data)
            logger.info(
                f"✅ PostgreSQL Seeding complete: {result['inserted']} inserted, "
                f"{result['updated']} updated (Total: {len(schemes_data)})"
            )
    except Exception as e:
        logger.error(f"❌ Database insertion failed: {e}")
        return

    # 4. Build FAISS index
    logger.info("🔄 Building FAISS vector index...")
    t0 = time.time()

    texts = [s.get("eligibility_text", "") for s in schemes_data]
    scheme_ids = [s["scheme_id"] for s in schemes_data]

    embeddings = encode_batch(texts)
    index = SchemeIndex()
    index.build(scheme_ids, embeddings)
    index.save(settings.faiss_index_path)

    elapsed = round(time.time() - t0, 2)
    logger.info(f"✅ FAISS index updated at {settings.faiss_index_path} ({elapsed}s)")

    logger.info("=" * 60)
    logger.info("✅ Seeding process completed successfully!")
    logger.info("=" * 60)


if __name__ == "__main__":
    asyncio.run(seed())

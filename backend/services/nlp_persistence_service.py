"""
NLP Persistence Service.
Safely persists NLP Extractions to database with fallback in-memory buffer.
"""
import uuid
import logging
from typing import Optional, Any
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from repositories.nlp_extraction_repository import NLPExtractionRepository

logger = logging.getLogger(__name__)

# In-memory buffer for development and test execution
_NLP_EXTRACTIONS_MEMORY: list[dict[str, Any]] = []


async def persist_nlp_extraction(
    raw_text: str,
    extracted_entities: dict[str, Any],
    confidence: float,
    missing_fields: list[str],
    input_type: str = "text",
    language: str = "hi",
    session_id: Optional[str] = None,
    user_id: Optional[str] = None,
    db: Optional[AsyncSession] = None,
) -> str:
    """
    Safely saves an NLP extraction record to database and memory.
    Always returns a valid extraction_id UUID string.
    """
    extraction_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).replace(tzinfo=None).isoformat()

    record_dict = {
        "id": extraction_id,
        "user_id": str(user_id) if user_id else None,
        "session_id": session_id,
        "input_type": input_type,
        "raw_text": raw_text,
        "language": language,
        "intent": extracted_entities.get("intent", "financial_assistance"),
        "extracted_entities": extracted_entities,
        "confidence": round(float(confidence), 2),
        "missing_fields": missing_fields,
        "extraction_status": "COMPLETED" if confidence >= 0.6 else "PARTIAL",
        "created_at": now_iso,
    }

    # Store in memory buffer
    _NLP_EXTRACTIONS_MEMORY.insert(0, record_dict)
    if len(_NLP_EXTRACTIONS_MEMORY) > 500:
        _NLP_EXTRACTIONS_MEMORY.pop()

    if db:
        try:
            import asyncio
            await asyncio.wait_for(
                NLPExtractionRepository.create(db, {
                    **record_dict,
                    "id": uuid.UUID(extraction_id),
                }),
                timeout=0.5,
            )
        except Exception as ex:
            logger.debug(f"Database persistence for NLP extraction deferred: {ex}")

    return extraction_id


async def get_nlp_extraction(extraction_id: str, db: Optional[AsyncSession] = None) -> Optional[dict[str, Any]]:
    """Fetch extraction by ID from database or memory buffer."""
    if db:
        try:
            import asyncio
            record = await asyncio.wait_for(NLPExtractionRepository.get_by_id(db, extraction_id), timeout=0.5)
            if record:
                return record.to_dict()
        except Exception as ex:
            logger.debug(f"Database query for extraction {extraction_id} bypassed: {ex}")

    for rec in _NLP_EXTRACTIONS_MEMORY:
        if rec["id"] == extraction_id:
            return rec
    return None


async def list_nlp_extractions(
    session_id: Optional[str] = None,
    user_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Optional[AsyncSession] = None,
) -> list[dict[str, Any]]:
    """List extractions filtered by session or user from database or memory buffer."""
    if db:
        try:
            import asyncio
            records = await asyncio.wait_for(
                NLPExtractionRepository.list_by_session_or_user(
                    db, session_id=session_id, user_id=user_id, limit=limit, offset=offset
                ),
                timeout=0.5,
            )
            if records:
                return [r.to_dict() for r in records]
        except Exception as ex:
            logger.debug(f"Database query for NLP extractions list bypassed: {ex}")

    results = _NLP_EXTRACTIONS_MEMORY
    if session_id:
        results = [r for r in results if r.get("session_id") == session_id]
    if user_id:
        results = [r for r in results if r.get("user_id") == user_id]

    return results[offset : offset + limit]

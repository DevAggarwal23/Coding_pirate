"""
NLP Extraction Repository.
Handles all database queries and persistence for NLP Extractions.
"""
import uuid
import logging
from typing import Optional, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from models.nlp_extraction import NLPExtraction

logger = logging.getLogger(__name__)


class NLPExtractionRepository:
    """Repository handling database operations for NLP Extractions."""

    @staticmethod
    async def create(db: AsyncSession, extraction_data: dict[str, Any]) -> NLPExtraction:
        """Create and persist an NLPExtraction record."""
        user_uuid = None
        if extraction_data.get("user_id"):
            try:
                user_uuid = uuid.UUID(str(extraction_data["user_id"]))
            except (ValueError, TypeError):
                user_uuid = None

        record = NLPExtraction(
            id=extraction_data.get("id") or uuid.uuid4(),
            user_id=user_uuid,
            session_id=extraction_data.get("session_id"),
            input_type=extraction_data.get("input_type", "text"),
            raw_text=extraction_data.get("raw_text", ""),
            language=extraction_data.get("language", "hi"),
            intent=extraction_data.get("intent", "financial_assistance"),
            extracted_entities=extraction_data.get("extracted_entities", {}),
            confidence=float(extraction_data.get("confidence", 0.0)),
            missing_fields=extraction_data.get("missing_fields", []),
            extraction_status=extraction_data.get("extraction_status", "COMPLETED"),
        )
        db.add(record)
        await db.commit()
        await db.refresh(record)
        return record

    @staticmethod
    async def get_by_id(db: AsyncSession, extraction_id: uuid.UUID | str) -> Optional[NLPExtraction]:
        """Fetch extraction record by primary key."""
        if isinstance(extraction_id, str):
            try:
                extraction_id = uuid.UUID(extraction_id)
            except ValueError:
                return None
        stmt = select(NLPExtraction).where(NLPExtraction.id == extraction_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def list_by_session_or_user(
        db: AsyncSession,
        session_id: Optional[str] = None,
        user_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> list[NLPExtraction]:
        """List extractions filtered by session_id or user_id."""
        stmt = select(NLPExtraction)
        if session_id:
            stmt = stmt.where(NLPExtraction.session_id == session_id)
        if user_id:
            try:
                user_uuid = uuid.UUID(user_id)
                stmt = stmt.where(NLPExtraction.user_id == user_uuid)
            except ValueError:
                pass
        stmt = stmt.order_by(NLPExtraction.created_at.desc()).limit(limit).offset(offset)
        result = await db.execute(stmt)
        return list(result.scalars().all())

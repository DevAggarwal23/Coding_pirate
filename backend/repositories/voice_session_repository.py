"""
Voice Session Repository.
Handles all database queries and persistence for Voice Sessions.
"""
import uuid
import logging
from typing import Optional, Any
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from models.voice_session import VoiceSession, VoiceProcessingStatus

logger = logging.getLogger(__name__)


class VoiceSessionRepository:
    """Repository handling database operations for voice interactions."""

    @staticmethod
    async def create(db: AsyncSession, session_data: dict[str, Any]) -> VoiceSession:
        """Create and persist a new VoiceSession."""
        user_uuid = None
        if session_data.get("user_id"):
            try:
                user_uuid = uuid.UUID(str(session_data["user_id"]))
            except (ValueError, TypeError):
                user_uuid = None

        record = VoiceSession(
            id=session_data.get("id") or uuid.uuid4(),
            session_id=session_data.get("session_id") or str(uuid.uuid4()),
            user_id=user_uuid,
            language=session_data.get("language", "hi"),
            input_format=session_data.get("input_format"),
            duration_seconds=session_data.get("duration_seconds"),
            transcript=session_data.get("transcript"),
            transcription_confidence=session_data.get("transcription_confidence"),
            processing_status=session_data.get("processing_status", VoiceProcessingStatus.CREATED.value),
            provider=session_data.get("provider", "bhashini_asr"),
            error_code=session_data.get("error_code"),
        )
        db.add(record)
        await db.commit()
        await db.refresh(record)
        return record

    @staticmethod
    async def get_by_session_id_or_id(db: AsyncSession, identifier: str) -> Optional[VoiceSession]:
        """Fetch voice session by session_id or UUID primary key."""
        # Check by session_id first
        stmt = select(VoiceSession).where(VoiceSession.session_id == identifier)
        result = await db.execute(stmt)
        session = result.scalar_one_or_none()
        if session:
            return session

        # Try by UUID
        try:
            record_id = uuid.UUID(identifier)
            stmt2 = select(VoiceSession).where(VoiceSession.id == record_id)
            result2 = await db.execute(stmt2)
            return result2.scalar_one_or_none()
        except ValueError:
            return None

    @staticmethod
    async def update_status(
        db: AsyncSession,
        session_id_or_id: str,
        processing_status: str,
        transcript: Optional[str] = None,
        confidence: Optional[float] = None,
        language: Optional[str] = None,
        duration_seconds: Optional[float] = None,
        error_code: Optional[str] = None,
    ) -> Optional[VoiceSession]:
        """Update voice session state upon completion or failure."""
        session = await VoiceSessionRepository.get_by_session_id_or_id(db, session_id_or_id)
        if not session:
            return None

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        session.processing_status = processing_status
        if transcript is not None:
            session.transcript = transcript
        if confidence is not None:
            session.transcription_confidence = confidence
        if language is not None:
            session.language = language
        if duration_seconds is not None:
            session.duration_seconds = duration_seconds
        if error_code is not None:
            session.error_code = error_code
        if processing_status in (VoiceProcessingStatus.COMPLETED.value, VoiceProcessingStatus.FAILED.value):
            session.completed_at = now

        await db.commit()
        await db.refresh(session)
        return session

    @staticmethod
    async def list_sessions(
        db: AsyncSession,
        user_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> list[VoiceSession]:
        """List voice sessions with optional user_id filter."""
        stmt = select(VoiceSession)
        if user_id:
            try:
                user_uuid = uuid.UUID(user_id)
                stmt = stmt.where(VoiceSession.user_id == user_uuid)
            except ValueError:
                pass
        stmt = stmt.order_by(VoiceSession.created_at.desc()).limit(limit).offset(offset)
        result = await db.execute(stmt)
        return list(result.scalars().all())

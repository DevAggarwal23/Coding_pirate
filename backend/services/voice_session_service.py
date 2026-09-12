"""
Voice Session Persistence Service.
Tracks voice sessions, processing state, transcripts, and confidence scores with in-memory buffer.
"""
import uuid
import logging
from typing import Optional, Any
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from repositories.voice_session_repository import VoiceSessionRepository
from models.voice_session import VoiceProcessingStatus

logger = logging.getLogger(__name__)

# In-memory buffer for voice sessions
_VOICE_SESSIONS_MEMORY: dict[str, dict[str, Any]] = {}


async def create_voice_session(
    language: str = "hi",
    input_format: Optional[str] = None,
    session_id: Optional[str] = None,
    user_id: Optional[str] = None,
    provider: str = "bhashini_asr",
    db: Optional[AsyncSession] = None,
) -> str:
    """Creates a new voice session record."""
    actual_session_id = session_id or str(uuid.uuid4())
    record_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).replace(tzinfo=None).isoformat()

    session_dict = {
        "id": record_id,
        "session_id": actual_session_id,
        "user_id": str(user_id) if user_id else None,
        "language": language,
        "input_format": input_format,
        "duration_seconds": None,
        "transcript": None,
        "transcription_confidence": None,
        "processing_status": VoiceProcessingStatus.PROCESSING.value,
        "provider": provider,
        "error_code": None,
        "created_at": now_iso,
        "completed_at": None,
    }
    _VOICE_SESSIONS_MEMORY[actual_session_id] = session_dict

    if db:
        try:
            import asyncio
            await asyncio.wait_for(
                VoiceSessionRepository.create(db, {
                    **session_dict,
                    "id": uuid.UUID(record_id),
                }),
                timeout=0.5,
            )
        except Exception as ex:
            logger.debug(f"Database create voice session deferred: {ex}")

    return actual_session_id


async def complete_voice_session(
    session_id: str,
    transcript: str,
    confidence: float = 0.95,
    language: str = "hi",
    duration_seconds: Optional[float] = None,
    db: Optional[AsyncSession] = None,
) -> None:
    """Updates voice session with transcript and marks COMPLETED."""
    now_iso = datetime.now(timezone.utc).replace(tzinfo=None).isoformat()
    if session_id in _VOICE_SESSIONS_MEMORY:
        _VOICE_SESSIONS_MEMORY[session_id].update({
            "transcript": transcript,
            "transcription_confidence": round(float(confidence), 2),
            "language": language,
            "duration_seconds": duration_seconds,
            "processing_status": VoiceProcessingStatus.COMPLETED.value,
            "completed_at": now_iso,
        })

    if db:
        try:
            import asyncio
            await asyncio.wait_for(
                VoiceSessionRepository.update_status(
                    db,
                    session_id_or_id=session_id,
                    processing_status=VoiceProcessingStatus.COMPLETED.value,
                    transcript=transcript,
                    confidence=confidence,
                    language=language,
                    duration_seconds=duration_seconds,
                ),
                timeout=0.5,
            )
        except Exception as ex:
            logger.debug(f"Database complete voice session deferred: {ex}")


async def fail_voice_session(
    session_id: str,
    error_code: str = "TRANSCRIPTION_ERROR",
    db: Optional[AsyncSession] = None,
) -> None:
    """Updates voice session with error status."""
    now_iso = datetime.now(timezone.utc).replace(tzinfo=None).isoformat()
    if session_id in _VOICE_SESSIONS_MEMORY:
        _VOICE_SESSIONS_MEMORY[session_id].update({
            "processing_status": VoiceProcessingStatus.FAILED.value,
            "error_code": error_code,
            "completed_at": now_iso,
        })

    if db:
        try:
            import asyncio
            await asyncio.wait_for(
                VoiceSessionRepository.update_status(
                    db,
                    session_id_or_id=session_id,
                    processing_status=VoiceProcessingStatus.FAILED.value,
                    error_code=error_code,
                ),
                timeout=0.5,
            )
        except Exception as ex:
            logger.debug(f"Database fail voice session deferred: {ex}")


async def get_voice_session(session_id: str, db: Optional[AsyncSession] = None) -> Optional[dict[str, Any]]:
    """Retrieve voice session by ID."""
    if db:
        try:
            import asyncio
            record = await asyncio.wait_for(
                VoiceSessionRepository.get_by_session_id_or_id(db, session_id),
                timeout=0.5,
            )
            if record:
                return record.to_dict()
        except Exception as ex:
            logger.debug(f"Database query for voice session {session_id} bypassed: {ex}")

    return _VOICE_SESSIONS_MEMORY.get(session_id)


async def list_voice_sessions(
    user_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Optional[AsyncSession] = None,
) -> list[dict[str, Any]]:
    """List voice sessions with optional user filter."""
    if db:
        try:
            import asyncio
            records = await asyncio.wait_for(
                VoiceSessionRepository.list_sessions(
                    db, user_id=user_id, limit=limit, offset=offset
                ),
                timeout=0.5,
            )
            if records:
                return [r.to_dict() for r in records]
        except Exception as ex:
            logger.debug(f"Database query for voice sessions list bypassed: {ex}")

    results = list(_VOICE_SESSIONS_MEMORY.values())
    if user_id:
        results = [r for r in results if r.get("user_id") == user_id]

    results.sort(key=lambda x: x.get("created_at") or "", reverse=True)
    return results[offset : offset + limit]

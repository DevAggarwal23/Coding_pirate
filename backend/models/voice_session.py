"""
Voice Session SQLAlchemy Model.
Persists voice interaction metadata, transcripts, processing state, and confidence scores.
Never stores raw audio bytes permanently.
"""
import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import String, Float, DateTime, Text, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from core.database import Base


class VoiceProcessingStatus(str, Enum):
    CREATED = "CREATED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class VoiceSession(Base):
    __tablename__ = "voice_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_profiles.profile_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    language: Mapped[str] = mapped_column(String(20), default="hi", nullable=False)
    input_format: Mapped[str | None] = mapped_column(String(50), nullable=True)
    duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    transcript: Mapped[str | None] = mapped_column(Text, nullable=True)
    transcription_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    processing_status: Mapped[str] = mapped_column(
        String(50), default=VoiceProcessingStatus.CREATED.value, nullable=False, index=True
    )
    provider: Mapped[str] = mapped_column(String(100), default="bhashini_asr", nullable=False)
    error_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False, index=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "session_id": self.session_id,
            "user_id": str(self.user_id) if self.user_id else None,
            "language": self.language,
            "input_format": self.input_format,
            "duration_seconds": self.duration_seconds,
            "transcript": self.transcript,
            "transcription_confidence": self.transcription_confidence,
            "processing_status": self.processing_status,
            "provider": self.provider,
            "error_code": self.error_code,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }

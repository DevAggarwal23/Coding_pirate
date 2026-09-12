"""
NLP Extraction SQLAlchemy Model.
Persists raw user input, language, intent, extracted entities, and missing fields.
"""
import uuid
from datetime import datetime
from sqlalchemy import String, Float, DateTime, Text, ForeignKey, func, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from core.database import Base


class NLPExtraction(Base):
    __tablename__ = "nlp_extractions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_profiles.profile_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    session_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    input_type: Mapped[str] = mapped_column(String(50), default="text", nullable=False)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String(20), default="hi", nullable=False)
    intent: Mapped[str | None] = mapped_column(String(100), default="financial_assistance", nullable=True)
    extracted_entities: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    missing_fields: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    extraction_status: Mapped[str] = mapped_column(String(50), default="COMPLETED", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False, index=True
    )

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "user_id": str(self.user_id) if self.user_id else None,
            "session_id": self.session_id,
            "input_type": self.input_type,
            "raw_text": self.raw_text,
            "language": self.language,
            "intent": self.intent,
            "extracted_entities": self.extracted_entities or {},
            "confidence": round(float(self.confidence), 2),
            "missing_fields": self.missing_fields or [],
            "extraction_status": self.extraction_status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

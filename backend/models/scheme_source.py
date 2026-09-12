"""
Scheme Source / Provenance SQLAlchemy Model.
Tracks provenance, verification status, official source URLs, and audit metadata for government schemes.
"""
import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import String, Boolean, DateTime, Text, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from core.database import Base


class SourceType(str, Enum):
    OFFICIAL_GOVERNMENT = "OFFICIAL_GOVERNMENT"
    AUTHORIZED_PARTNER = "AUTHORIZED_PARTNER"
    VERIFIED_REFERENCE = "VERIFIED_REFERENCE"
    DEMO_SYNTHETIC = "DEMO_SYNTHETIC"


class VerificationStatus(str, Enum):
    VERIFIED = "VERIFIED"
    PENDING = "PENDING"
    EXPIRED = "EXPIRED"
    DEMO = "DEMO"


class SchemeSource(Base):
    __tablename__ = "scheme_sources"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    scheme_id: Mapped[str] = mapped_column(
        String(100),
        ForeignKey("schemes.scheme_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    source_organization: Mapped[str | None] = mapped_column(String(200), nullable=True)
    source_type: Mapped[str] = mapped_column(
        String(50), default=SourceType.OFFICIAL_GOVERNMENT.value, nullable=False
    )
    verification_status: Mapped[str] = mapped_column(
        String(50), default=VerificationStatus.VERIFIED.value, nullable=False
    )
    verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_checked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    data_version: Mapped[str | None] = mapped_column(String(50), default="1.0", nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "scheme_id": self.scheme_id,
            "source_url": self.source_url,
            "source_name": self.source_name or "Official Government Scheme Portal",
            "source_organization": self.source_organization or "Ministry of Social Justice & Empowerment",
            "source_type": self.source_type,
            "verification_status": self.verification_status,
            "verified_at": self.verified_at.isoformat() if self.verified_at else None,
            "last_checked_at": self.last_checked_at.isoformat() if self.last_checked_at else None,
            "data_version": self.data_version or "1.0",
            "is_primary": self.is_primary,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

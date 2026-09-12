import random
import string
import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from core.database import Base


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft','documents_pending','ready_for_submission','submitted','under_review','action_required','approved','rejected','disbursed')",
            name="valid_status"
        ),
    )

    application_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_profiles.profile_id"), nullable=True
    )
    scheme_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("schemes.scheme_id"), nullable=False
    )
    partner_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="draft")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_updated: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    status_history = relationship(
        "ApplicationStatusHistory",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="ApplicationStatusHistory.created_at.asc()",
    )

    @classmethod
    def generate_id(cls) -> str:
        """Generate APP-2026-XXXXX style application ID."""
        suffix = "".join(random.choices(string.digits, k=5))
        return f"APP-2026-{suffix}"


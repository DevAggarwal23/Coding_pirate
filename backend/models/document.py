import random
import string
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Boolean, Text, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from core.database import Base


class ApplicationDocument(Base):
    __tablename__ = "application_documents"
    __table_args__ = (
        CheckConstraint(
            "status IN ('required','missing','uploaded','validating','valid','invalid','rejected')",
            name="valid_doc_status"
        ),
    )

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    application_id: Mapped[Optional[str]] = mapped_column(
        String(20), ForeignKey("applications.application_id"), nullable=True
    )
    requirement_id: Mapped[str] = mapped_column(String(100), nullable=False)
    scheme_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    document_name: Mapped[str] = mapped_column(String(255), nullable=False)
    document_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="uploaded")
    validation_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    validation_method: Mapped[str] = mapped_column(String(50), default="format_check")
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    @classmethod
    def generate_id(cls) -> str:
        """Generate DOC-2026-XXXXX style document ID."""
        suffix = "".join(random.choices(string.digits, k=6))
        return f"DOC-2026-{suffix}"


class SchemeDocumentRequirement(Base):
    __tablename__ = "scheme_document_requirements"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    scheme_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("schemes.scheme_id", ondelete="CASCADE"), nullable=False, index=True
    )
    document_name: Mapped[str] = mapped_column(String(255), nullable=False)
    document_type: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    why_required: Mapped[str] = mapped_column(Text, nullable=False)
    mandatory: Mapped[bool] = mapped_column(Boolean, default=True)
    accepted_formats: Mapped[Optional[str]] = mapped_column(String(255), default="pdf,jpg,jpeg,png,webp")
    max_file_size_mb: Mapped[int] = mapped_column(Integer, default=20)
    source: Mapped[str] = mapped_column(String(255), default="official_guidelines")
    verification_status: Mapped[str] = mapped_column(String(50), default="VERIFIED")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


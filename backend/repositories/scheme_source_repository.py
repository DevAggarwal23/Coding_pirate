"""
Scheme Source Repository.
Handles all database queries and persistence for Scheme Sources / Provenance records.
"""
import uuid
import logging
from typing import Optional, Any
from datetime import datetime, timezone
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from models.scheme_source import SchemeSource, SourceType, VerificationStatus

logger = logging.getLogger(__name__)


class SchemeSourceRepository:
    """Repository handling database operations for scheme provenance sources."""

    @staticmethod
    async def get_by_scheme_id(db: AsyncSession, scheme_id: str) -> list[SchemeSource]:
        """Fetch all sources for a given scheme ID."""
        stmt = select(SchemeSource).where(SchemeSource.scheme_id == scheme_id).order_by(SchemeSource.is_primary.desc(), SchemeSource.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_primary_by_scheme_id(db: AsyncSession, scheme_id: str) -> Optional[SchemeSource]:
        """Fetch the primary canonical source for a scheme."""
        stmt = (
            select(SchemeSource)
            .where(SchemeSource.scheme_id == scheme_id)
            .order_by(SchemeSource.is_primary.desc(), SchemeSource.created_at.desc())
            .limit(1)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_id(db: AsyncSession, source_id: uuid.UUID | str) -> Optional[SchemeSource]:
        """Fetch a specific scheme source record by UUID."""
        if isinstance(source_id, str):
            try:
                source_id = uuid.UUID(source_id)
            except ValueError:
                return None
        stmt = select(SchemeSource).where(SchemeSource.id == source_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, source_data: dict[str, Any]) -> SchemeSource:
        """Create and persist a new SchemeSource record."""
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        
        is_primary = source_data.get("is_primary", True)
        if is_primary:
            # If this is marked primary, demote existing primary sources for this scheme
            await db.execute(
                update(SchemeSource)
                .where(SchemeSource.scheme_id == source_data["scheme_id"])
                .values(is_primary=False)
            )

        new_source = SchemeSource(
            id=source_data.get("id") or uuid.uuid4(),
            scheme_id=source_data["scheme_id"],
            source_url=source_data.get("source_url"),
            source_name=source_data.get("source_name") or "Official Government Scheme Portal",
            source_organization=source_data.get("source_organization") or "Ministry of Social Justice & Empowerment",
            source_type=source_data.get("source_type", SourceType.OFFICIAL_GOVERNMENT.value),
            verification_status=source_data.get("verification_status", VerificationStatus.VERIFIED.value),
            verified_at=source_data.get("verified_at") or (now if source_data.get("verification_status") == VerificationStatus.VERIFIED.value else None),
            last_checked_at=source_data.get("last_checked_at") or now,
            data_version=source_data.get("data_version", "1.0"),
            is_primary=is_primary,
            notes=source_data.get("notes"),
        )
        db.add(new_source)
        await db.commit()
        await db.refresh(new_source)
        return new_source

    @staticmethod
    async def update(db: AsyncSession, source_id: uuid.UUID | str, update_data: dict[str, Any]) -> Optional[SchemeSource]:
        """Update fields of an existing SchemeSource."""
        source = await SchemeSourceRepository.get_by_id(db, source_id)
        if not source:
            return None

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        for field, val in update_data.items():
            if hasattr(source, field) and val is not None:
                setattr(source, field, val)

        if "verification_status" in update_data and update_data["verification_status"] == VerificationStatus.VERIFIED.value:
            if not getattr(source, "verified_at", None):
                source.verified_at = now

        source.last_checked_at = now
        await db.commit()
        await db.refresh(source)
        return source

    @staticmethod
    async def list_all(
        db: AsyncSession,
        verification_status: Optional[str] = None,
        source_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> list[SchemeSource]:
        """List all sources with optional filtering."""
        stmt = select(SchemeSource)
        if verification_status:
            stmt = stmt.where(SchemeSource.verification_status == verification_status)
        if source_type:
            stmt = stmt.where(SchemeSource.source_type == source_type)
        stmt = stmt.order_by(SchemeSource.created_at.desc()).limit(limit).offset(offset)
        result = await db.execute(stmt)
        return list(result.scalars().all())

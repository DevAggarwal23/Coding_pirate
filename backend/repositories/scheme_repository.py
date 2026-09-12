"""
Scheme Repository.
Handles all database queries and persistence operations for Scheme entities.
Follows Repository pattern: Service -> Repository -> Database.
"""
import logging
from typing import Optional, Any
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from models.scheme import Scheme

logger = logging.getLogger(__name__)


class SchemeRepository:
    """Repository handling persistence operations for Schemes."""

    @staticmethod
    async def get_all(db: AsyncSession, active_only: bool = True) -> list[Scheme]:
        """Fetch all schemes from the database, optionally filtered by active status."""
        stmt = select(Scheme)
        if active_only:
            stmt = stmt.where(Scheme.is_active == True)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_by_id(db: AsyncSession, scheme_id: str) -> Optional[Scheme]:
        """Fetch a single scheme by its primary key ID."""
        stmt = select(Scheme).where(Scheme.scheme_id == scheme_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def upsert(db: AsyncSession, scheme_data: dict[str, Any]) -> tuple[Scheme, bool]:
        """
        Idempotent insert or update for a scheme.
        Returns tuple of (Scheme, is_created: bool).
        """
        scheme_id = scheme_data["scheme_id"]
        existing = await SchemeRepository.get_by_id(db, scheme_id)

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        documents = scheme_data.get("documents_required") or scheme_data.get("documents_req") or []

        if existing:
            existing.scheme_name = scheme_data.get("scheme_name", existing.scheme_name)
            existing.ministry = scheme_data.get("ministry", existing.ministry)
            existing.categories = scheme_data.get("categories", existing.categories)
            existing.max_income = scheme_data.get("max_income", existing.max_income)
            existing.eligible_states = scheme_data.get("eligible_states", existing.eligible_states)
            existing.business_types = scheme_data.get("business_types", existing.business_types)
            existing.benefit_amount = scheme_data.get("benefit_amount", existing.benefit_amount)
            existing.documents_req = documents
            existing.application_url = scheme_data.get("application_url", existing.application_url)
            existing.source = scheme_data.get("source", existing.source or "myscheme.gov.in")
            existing.source_url = scheme_data.get("source_url") or scheme_data.get("application_url") or existing.source_url
            existing.eligibility_text = scheme_data.get("eligibility_text", existing.eligibility_text)
            existing.last_verified = now
            existing.status = scheme_data.get("status", existing.status or "active")
            existing.is_active = scheme_data.get("is_active", True)
            return existing, False
        else:
            new_scheme = Scheme(
                scheme_id=scheme_id,
                scheme_name=scheme_data["scheme_name"],
                ministry=scheme_data.get("ministry"),
                categories=scheme_data.get("categories", []),
                max_income=scheme_data.get("max_income"),
                eligible_states=scheme_data.get("eligible_states"),
                business_types=scheme_data.get("business_types"),
                benefit_amount=scheme_data.get("benefit_amount"),
                documents_req=documents,
                application_url=scheme_data.get("application_url"),
                source=scheme_data.get("source", "myscheme.gov.in"),
                source_url=scheme_data.get("source_url") or scheme_data.get("application_url"),
                eligibility_text=scheme_data.get("eligibility_text"),
                last_verified=now,
                status=scheme_data.get("status", "active"),
                is_active=scheme_data.get("is_active", True),
            )
            db.add(new_scheme)
            return new_scheme, True

    @staticmethod
    async def upsert_batch(db: AsyncSession, schemes_data: list[dict[str, Any]]) -> dict[str, int]:
        """
        Idempotent batch seed / sync of schemes.
        Returns count of inserted and updated records.
        """
        inserted_count = 0
        updated_count = 0

        for s in schemes_data:
            _, is_created = await SchemeRepository.upsert(db, s)
            if is_created:
                inserted_count += 1
            else:
                updated_count += 1

        await db.commit()
        return {"inserted": inserted_count, "updated": updated_count}

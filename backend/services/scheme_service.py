"""
Scheme Database and Caching Service.
Fetches scheme records from PostgreSQL via SchemeRepository with fallback to local JSON dataset.
Follows clean layered architecture: Router -> Service -> Repository -> PostgreSQL.
"""
import os
import json
import logging
from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from repositories.scheme_repository import SchemeRepository
from core.config import settings

logger = logging.getLogger(__name__)

_SCHEMES_CACHE: list[dict[str, Any]] = []


def _normalize_scheme(s: dict[str, Any]) -> dict[str, Any]:
    """Ensure standard keys across different dataset naming conventions."""
    cats = s.get("categories") or s.get("category") or []
    if isinstance(cats, str):
        cats = [cats]

    states = s.get("eligible_states") or s.get("supported_states") or []
    if isinstance(states, str):
        states = [states]

    btypes = s.get("business_types")
    if not btypes:
        bt = s.get("business_type")
        btypes = [bt] if bt else ["general"]
    elif isinstance(btypes, str):
        btypes = [btypes]

    docs = s.get("documents_req") or s.get("documents_required") or []
    if isinstance(docs, str):
        docs = [docs]

    app_url = s.get("application_url") or s.get("application_link") or "https://www.myscheme.gov.in"

    benefit = s.get("benefit_amount") or s.get("benefit_summary")
    if not benefit:
        mla = s.get("max_loan_amount")
        benefit = f"₹{int(mla):,}" if mla else "Government Financial Assistance / Subsidy"

    return {
        "scheme_id": s.get("scheme_id", ""),
        "scheme_name": s.get("scheme_name", ""),
        "ministry": s.get("ministry") or s.get("sponsoring_level") or "Central Government",
        "categories": cats,
        "category": cats,
        "max_income": s.get("max_income"),
        "max_loan_amount": s.get("max_loan_amount"),
        "eligible_states": states,
        "supported_states": states,
        "business_types": btypes,
        "business_type": btypes[0] if btypes else "general",
        "benefit_amount": benefit,
        "benefit_summary": benefit,
        "documents_req": docs,
        "documents_required": docs,
        "application_url": app_url,
        "application_link": app_url,
        "source": s.get("source") or "myscheme.gov.in",
        "source_url": app_url,
        "eligibility_text": s.get("eligibility_text") or s.get("search_text") or "",
        "search_text": s.get("search_text") or s.get("eligibility_text") or "",
        "tags": s.get("tags") or [],
        "status": s.get("status", "active"),
        "is_active": s.get("is_active", True),
    }


def _load_schemes_from_json() -> list[dict[str, Any]]:
    """Fallback loader for data/schemes.json and data/Final_Scheme_Dataset_Clean.json."""
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
    possible_paths = [
        settings.schemes_json_path,
        os.path.join(data_dir, "schemes.json"),
        os.path.join(data_dir, "Final_Scheme_Dataset_Clean.json"),
        os.path.join(os.path.dirname(__file__), "..", "data", "schemes.json"),
        os.path.join(os.path.dirname(__file__), "..", "data", "Final_Scheme_Dataset_Clean.json"),
    ]
    for path in possible_paths:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    raw_data = json.load(f)
                    if isinstance(raw_data, list) and len(raw_data) > 0:
                        normalized = [_normalize_scheme(item) for item in raw_data]
                        logger.info(f"Loaded {len(normalized)} normalized schemes from {path}")
                        return normalized
            except Exception as e:
                logger.error(f"Error loading schemes from {path}: {e}")
    return []



async def get_all_schemes(db: Optional[AsyncSession] = None) -> list[dict[str, Any]]:
    """
    Retrieve all active schemes from the database via SchemeRepository.
    Falls back to local JSON data when database connection is not established.
    """
    if db:
        try:
            schemes = await SchemeRepository.get_all(db, active_only=True)
            if schemes:
                logger.info(f"Retrieved {len(schemes)} schemes from PostgreSQL database.")
                return [s.to_dict() for s in schemes]
        except Exception as e:
            logger.warning(f"Database query failed ({e}); falling back to local schemes data.")

    return _load_schemes_from_json()


async def get_scheme_by_id(scheme_id: str, db: Optional[AsyncSession] = None) -> Optional[dict[str, Any]]:
    """Retrieve single scheme by ID from database or fallback cache."""
    if db:
        try:
            scheme = await SchemeRepository.get_by_id(db, scheme_id)
            if scheme:
                return scheme.to_dict()
        except Exception as e:
            logger.warning(f"Database query for scheme {scheme_id} failed ({e}).")

    all_schemes = await get_all_schemes_cached(db)
    for s in all_schemes:
        if s.get("scheme_id") == scheme_id:
            return s
    return None


async def get_all_schemes_cached(db: Optional[AsyncSession] = None, force_refresh: bool = False) -> list[dict[str, Any]]:
    """
    Retrieve all active schemes using in-memory cache to avoid repeated queries.
    """
    global _SCHEMES_CACHE
    if not _SCHEMES_CACHE or force_refresh:
        _SCHEMES_CACHE = await get_all_schemes(db)
    return _SCHEMES_CACHE


def invalidate_schemes_cache() -> None:
    """Clear in-memory cache to force refresh from database."""
    global _SCHEMES_CACHE
    _SCHEMES_CACHE = []

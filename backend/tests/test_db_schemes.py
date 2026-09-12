"""
Unit tests for database-backed scheme architecture, repository, and idempotent seeding.
Run: pytest tests/test_db_schemes.py -v
"""
import pytest
import sys
import os
import json
from unittest.mock import AsyncMock, MagicMock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.scheme import Scheme
from repositories.scheme_repository import SchemeRepository
from services.scheme_service import get_all_schemes, get_scheme_by_id, invalidate_schemes_cache
from data.seed_db import seed_schemes_data


SAMPLE_RAW_SCHEMES = [
    {
        "scheme_id": "test-scheme-1",
        "scheme_name": "Test Scheme One",
        "ministry": "Ministry of Social Justice",
        "categories": ["SC", "ST"],
        "max_income": 300000,
        "eligible_states": ["Bihar"],
        "business_types": ["tailoring"],
        "benefit_amount": "₹50,000 grant",
        "documents_required": ["Aadhaar", "Caste Certificate"],
        "application_url": "https://example.gov.in/1",
        "source": "myscheme.gov.in",
        "source_url": "https://example.gov.in/1",
        "eligibility_text": "Grant for SC ST individuals in Bihar.",
        "status": "active",
        "is_active": True,
    },
    {
        "scheme_id": "test-scheme-2",
        "scheme_name": "Test Scheme Two",
        "ministry": "Ministry of MSME",
        "categories": ["Women", "OBC"],
        "max_income": 500000,
        "eligible_states": None,
        "business_types": ["manufacturing"],
        "benefit_amount": "₹2 Lakh loan",
        "documents_required": ["Aadhaar"],
        "application_url": "https://example.gov.in/2",
        "source": "myscheme.gov.in",
        "source_url": "https://example.gov.in/2",
        "eligibility_text": "Loan for women and OBC entrepreneurs.",
        "status": "active",
        "is_active": True,
    },
]


class TestDatabaseSchemeArchitecture:

    @pytest.mark.asyncio
    async def test_repository_get_all_returns_schemes(self):
        """SchemeRepository.get_all executes select statement and returns Scheme models."""
        mock_db = AsyncMock()
        mock_scheme = Scheme(
            scheme_id="s1",
            scheme_name="Stand-Up India",
            categories=["SC", "ST", "Women"],
            is_active=True,
        )
        mock_result = MagicMock()
        mock_result.scalars().all.return_value = [mock_scheme]
        mock_db.execute.return_value = mock_result

        schemes = await SchemeRepository.get_all(mock_db)
        assert len(schemes) == 1
        assert schemes[0].scheme_id == "s1"
        assert schemes[0].scheme_name == "Stand-Up India"

    @pytest.mark.asyncio
    async def test_repository_get_by_id(self):
        """SchemeRepository.get_by_id returns specific scheme."""
        mock_db = AsyncMock()
        mock_scheme = Scheme(scheme_id="s1", scheme_name="Stand-Up India")
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_scheme
        mock_db.execute.return_value = mock_result

        scheme = await SchemeRepository.get_by_id(mock_db, "s1")
        assert scheme is not None
        assert scheme.scheme_id == "s1"

    @pytest.mark.asyncio
    async def test_scheme_service_delegates_to_repository(self):
        """SchemeService retrieves schemes from repository and serializes to dict."""
        mock_db = AsyncMock()
        mock_scheme = Scheme(
            scheme_id="s1",
            scheme_name="Stand-Up India",
            categories=["SC", "ST"],
            is_active=True,
        )
        mock_result = MagicMock()
        mock_result.scalars().all.return_value = [mock_scheme]
        mock_db.execute.return_value = mock_result

        invalidate_schemes_cache()
        schemes = await get_all_schemes(mock_db)
        assert len(schemes) == 1
        assert isinstance(schemes[0], dict)
        assert schemes[0]["scheme_id"] == "s1"
        assert "source" in schemes[0]
        assert "status" in schemes[0]

    @pytest.mark.asyncio
    async def test_scheme_service_fallback_on_db_error(self):
        """SchemeService falls back to local data if DB connection fails."""
        mock_db = AsyncMock()
        mock_db.execute.side_effect = ConnectionRefusedError("Database offline")

        invalidate_schemes_cache()
        schemes = await get_all_schemes(mock_db)
        assert isinstance(schemes, list)
        assert len(schemes) >= 400  # Loads from fallback data/schemes.json
        assert all(isinstance(s.get("scheme_id"), str) and len(s.get("scheme_id")) > 0 for s in schemes[:10])


class TestIdempotentSeeding:

    @pytest.mark.asyncio
    async def test_seed_schemes_idempotent_insert_and_update(self):
        """
        Verify seeding is duplicate-safe:
        First run inserts. Second run updates without failing or duplicating.
        """
        stored_schemes = {}

        mock_db = AsyncMock()

        async def fake_get_by_id(db, scheme_id):
            return stored_schemes.get(scheme_id)

        original_get_by_id = SchemeRepository.get_by_id
        SchemeRepository.get_by_id = fake_get_by_id

        def fake_add(scheme):
            stored_schemes[scheme.scheme_id] = scheme

        mock_db.add = MagicMock(side_effect=fake_add)

        try:
            # 1. First seeding run -> all inserted
            result_1 = await seed_schemes_data(mock_db, SAMPLE_RAW_SCHEMES)
            assert result_1["inserted"] == 2
            assert result_1["updated"] == 0
            assert len(stored_schemes) == 2

            # 2. Second seeding run with same data -> all updated (0 duplicates)
            result_2 = await seed_schemes_data(mock_db, SAMPLE_RAW_SCHEMES)
            assert result_2["inserted"] == 0
            assert result_2["updated"] == 2
            assert len(stored_schemes) == 2

        finally:
            SchemeRepository.get_by_id = original_get_by_id


class TestSchemesDataIntegrity:

    def test_all_schemes_in_json_have_factual_metadata(self):
        """Verify data/schemes.json contains all required metadata and factual integrity."""
        json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "schemes.json")
        assert os.path.exists(json_path), "data/schemes.json must exist"

        with open(json_path, "r", encoding="utf-8") as f:
            schemes = json.load(f)

        assert len(schemes) >= 28, f"Expected at least 28 schemes, found {len(schemes)}"

        scheme_ids = set()
        for s in schemes:
            # Uniqueness check
            sid = s.get("scheme_id")
            assert sid, "Each scheme must have a scheme_id"
            assert sid not in scheme_ids, f"Duplicate scheme_id found: {sid}"
            scheme_ids.add(sid)

            # Core factual attributes
            assert s.get("scheme_name"), f"Scheme {sid} missing scheme_name"
            assert isinstance(s.get("categories"), list), f"Scheme {sid} categories must be a list"
            assert s.get("eligibility_text"), f"Scheme {sid} missing eligibility_text"
            assert s.get("application_url"), f"Scheme {sid} missing application_url"

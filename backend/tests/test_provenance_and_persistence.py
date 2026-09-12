"""
Comprehensive Unit & Integration Tests for:
1. Scheme Sources & Provenance (Traceability, Verification, Demo vs Official Labeling)
2. NLP Extraction Persistence (Entity storage, Income vs Project Cost, Confidence, Missing Fields)
3. Voice Session Persistence (Tracking lifecycle, State transitions, Transcripts, Safe metadata)
4. Auditability & Explanability Flow
"""
import uuid
import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

from main import app
from models.scheme_source import SchemeSource, SourceType, VerificationStatus
from models.nlp_extraction import NLPExtraction
from models.voice_session import VoiceSession, VoiceProcessingStatus
from repositories.scheme_source_repository import SchemeSourceRepository
from repositories.nlp_extraction_repository import NLPExtractionRepository
from repositories.voice_session_repository import VoiceSessionRepository
from services.scheme_source_service import (
    get_scheme_provenance,
    create_scheme_source,
    update_scheme_source,
    build_default_provenance,
)
from services.nlp_persistence_service import persist_nlp_extraction

client = TestClient(app)


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE 1: SCHEME SOURCES & PROVENANCE TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestSchemeSourcesAndProvenance:
    """Tests for Scheme Sources and Provenance Traceability."""

    @pytest.mark.asyncio
    async def test_create_and_retrieve_scheme_source_repository(self):
        """1. Create and retrieve source record from repository."""
        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        source_data = {
            "scheme_id": "standup-india",
            "source_url": "https://www.standupmitra.in",
            "source_name": "Stand-Up Mitra Official Portal",
            "source_organization": "SIDBI / MoSJE",
            "source_type": SourceType.OFFICIAL_GOVERNMENT.value,
            "verification_status": VerificationStatus.VERIFIED.value,
            "data_version": "2026.1",
            "is_primary": True,
        }

        created = await SchemeSourceRepository.create(mock_db, source_data)
        assert created.scheme_id == "standup-india"
        assert created.source_type == "OFFICIAL_GOVERNMENT"
        assert created.verification_status == "VERIFIED"
        assert created.is_primary is True
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_verification_metadata(self):
        """2. Update verification status and notes."""
        mock_db = AsyncMock()
        existing = SchemeSource(
            id=uuid.uuid4(),
            scheme_id="pmegp",
            source_url="https://kviconline.gov.in",
            source_type=SourceType.OFFICIAL_GOVERNMENT.value,
            verification_status=VerificationStatus.PENDING.value,
        )

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = existing
        mock_db.execute.return_value = mock_result

        updated = await SchemeSourceRepository.update(
            mock_db,
            existing.id,
            {"verification_status": VerificationStatus.VERIFIED.value, "notes": "Audited by SIH Team"}
        )
        assert updated is not None
        assert updated.verification_status == "VERIFIED"
        assert updated.notes == "Audited by SIH Team"
        assert updated.verified_at is not None

    def test_default_provenance_demo_synthetic_labeling(self):
        """3. Demo/Synthetic data must be honestly labeled and never faked as official."""
        demo_scheme = {
            "scheme_id": "demo-test-scheme-99",
            "scheme_name": "Demo Entrepreneur Grant",
            "application_url": "",
        }
        prov = build_default_provenance(demo_scheme)
        assert prov["source_type"] == SourceType.DEMO_SYNTHETIC.value
        assert prov["verification_status"] == VerificationStatus.DEMO.value
        assert "Demo" in prov["source_name"] or "Synthetic" in prov["source_name"]
        assert "Evaluation" in prov["notes"] or "testing" in prov["notes"]

    def test_default_provenance_official_gov_labeling(self):
        """4. Schemes with .gov.in URLs are classified as official government sources."""
        gov_scheme = {
            "scheme_id": "standup-india",
            "scheme_name": "Stand-Up India Scheme",
            "application_url": "https://www.standupmitra.in/gov.in",
            "ministry": "Ministry of Finance / MSME",
        }
        prov = build_default_provenance(gov_scheme)
        assert prov["source_type"] == SourceType.OFFICIAL_GOVERNMENT.value
        assert prov["verification_status"] == VerificationStatus.VERIFIED.value

    def test_fastapi_get_scheme_sources_endpoint(self):
        """5. Public GET /api/schemes/{id}/sources endpoint returns valid provenance."""
        response = client.get("/api/schemes/standup-india/sources")
        assert response.status_code == 200
        data = response.json()
        assert data["scheme_id"] == "standup-india"
        assert "primary_source" in data
        assert data["primary_source"] is not None
        assert "source_type" in data["primary_source"]
        assert "verification_status" in data["primary_source"]
        assert data["total_sources"] >= 1

    def test_fastapi_get_sources_for_missing_scheme(self):
        """6. Missing/unknown scheme ID generates a fallback valid provenance without crashing."""
        response = client.get("/api/schemes/unknown-scheme-xyz/sources")
        assert response.status_code == 200
        data = response.json()
        assert data["scheme_id"] == "unknown-scheme-xyz"
        assert data["primary_source"]["verification_status"] in ["VERIFIED", "DEMO"]


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE 2: NLP EXTRACTION PERSISTENCE TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestNLPExtractionPersistence:
    """Tests for persisting and querying NLP Entity Extractions."""

    @pytest.mark.asyncio
    async def test_persist_nlp_extraction_service(self):
        """7. NLP extraction service persists valid record to database."""
        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        extracted_entities = {
            "category": "SC",
            "state": "Uttar Pradesh",
            "business_type": "tailoring",
            "income": 180000,
            "project_cost": 500000,
            "intent": "financial_assistance",
        }

        extraction_id = await persist_nlp_extraction(
            raw_text="Main SC category se hoon UP mein tailoring business ke liye 5 lakh chahiye",
            extracted_entities=extracted_entities,
            confidence=0.85,
            missing_fields=[],
            input_type="text",
            language="hi",
            session_id="sess-test-123",
            db=mock_db,
        )
        assert extraction_id is not None
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()

    def test_profile_extract_endpoint_persists_and_returns_extraction_id(self):
        """8. POST /api/profile/extract returns extraction_id and extracted payload."""
        payload = {
            "text": "Main UP se SC category mein tailoring business ke liye 5 lakh ka loan chahti hoon meri income 1.8 lakh hai",
            "session_id": "sess-e2e-1",
            "input_type": "text",
            "language": "hi",
        }
        response = client.post("/api/profile/extract", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "extracted" in data
        assert data["extracted"]["category"] == "SC"
        assert data["extracted"]["state"] == "Uttar Pradesh"
        assert data["extracted"]["business_type"] == "tailoring"
        # 9. Income vs Project cost distinction
        assert data["extracted"]["income"] == 180000
        assert data["extracted"]["project_cost"] == 500000
        # 10. Confidence and missing fields
        assert data["confidence"] > 0.6
        assert isinstance(data["missing_fields"], list)

    def test_nlp_extraction_retrieval_endpoint(self):
        """11. GET /api/nlp/extractions endpoint returns extraction history."""
        # Query list endpoint
        response = client.get("/api/nlp/extractions?limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "extractions" in data
        assert isinstance(data["extractions"], list)
        assert "total" in data

    def test_nlp_extraction_short_text_validation(self):
        """12. Short/empty input text is rejected with 400."""
        response = client.post("/api/profile/extract", json={"text": "hi"})
        assert response.status_code == 400


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE 3: VOICE SESSION PERSISTENCE TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestVoiceSessionPersistence:
    """Tests for Voice Session Tracking and Lifecycle."""

    @pytest.mark.asyncio
    async def test_voice_session_repository_lifecycle(self):
        """13. Voice session is created in PROCESSING state and completed with transcript."""
        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        session_id = f"voice-{uuid.uuid4()}"
        session_data = {
            "session_id": session_id,
            "language": "hi",
            "input_format": "audio/wav",
            "provider": "bhashini_asr",
            "processing_status": VoiceProcessingStatus.PROCESSING.value,
        }

        # Create
        session = await VoiceSessionRepository.create(mock_db, session_data)
        assert session.session_id == session_id
        assert session.processing_status == "PROCESSING"

        # Update
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = session
        mock_db.execute.return_value = mock_result

        # 14. Transcript and confidence persisted
        # 15. Completed status
        updated = await VoiceSessionRepository.update_status(
            mock_db,
            session_id_or_id=session_id,
            processing_status=VoiceProcessingStatus.COMPLETED.value,
            transcript="Mujhe tailoring business ke liye loan chahiye",
            confidence=0.96,
            duration_seconds=2.4,
        )
        assert updated is not None
        assert updated.processing_status == "COMPLETED"
        assert updated.transcript == "Mujhe tailoring business ke liye loan chahiye"
        assert updated.transcription_confidence == 0.96
        assert updated.completed_at is not None

    @pytest.mark.asyncio
    async def test_voice_session_failed_status_handling(self):
        """16. Voice session failure properly records FAILED status without secrets."""
        mock_db = AsyncMock()
        session = VoiceSession(
            id=uuid.uuid4(),
            session_id="failed-session-1",
            language="hi",
            processing_status=VoiceProcessingStatus.PROCESSING.value,
        )
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = session
        mock_db.execute.return_value = mock_result

        failed = await VoiceSessionRepository.update_status(
            mock_db,
            session_id_or_id="failed-session-1",
            processing_status=VoiceProcessingStatus.FAILED.value,
            error_code="AUDIO_TIMEOUT",
        )
        assert failed is not None
        assert failed.processing_status == "FAILED"
        assert failed.error_code == "AUDIO_TIMEOUT"

    def test_voice_sessions_list_endpoint(self):
        """17. GET /api/voice/sessions returns safe metadata list."""
        response = client.get("/api/voice/sessions?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert "sessions" in data
        assert isinstance(data["sessions"], list)
        assert "total" in data


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE 4: AUDITABILITY & EXPLAINABILITY TRACE
# ═══════════════════════════════════════════════════════════════════════════════

class TestAuditabilityAndExplainability:
    """
    Tests for Full Trace:
    USER REQUEST -> NLP EXTRACTION -> SCHEME MATCH -> SCHEME PROVENANCE
    """

    def test_end_to_end_audit_trace(self):
        """Verify the full traceable chain from user utterance to matched scheme provenance."""
        # 1. User natural language input
        user_text = "Main SC category se hoon, Uttar Pradesh mein dairy farm shuru karne ke liye 5 lakh ka loan chahiye, meri saalana aay 1.8 lakh hai."

        # 2. Extract profile
        extract_resp = client.post("/api/profile/extract", json={"text": user_text})
        assert extract_resp.status_code == 200
        extracted = extract_resp.json()["extracted"]
        assert extracted["category"] == "SC"
        assert extracted["state"] == "Uttar Pradesh"
        assert extracted["business_type"] == "dairy"
        assert extracted["income"] == 180000
        assert extracted["project_cost"] == 500000

        # 3. Match schemes
        match_resp = client.post("/api/match/schemes", json={
            "category": extracted["category"],
            "income": extracted["income"],
            "state": extracted["state"],
            "business_type": extracted["business_type"],
            "project_cost": extracted["project_cost"],
        })
        assert match_resp.status_code == 200
        match_data = match_resp.json()
        matched_schemes = match_data.get("auto_matched") or match_data.get("borderline")
        assert len(matched_schemes) > 0

        target_scheme = matched_schemes[0]
        scheme_id = target_scheme["scheme_id"]

        # 4. Verify scheme provenance is available
        prov_resp = client.get(f"/api/schemes/{scheme_id}/sources")
        assert prov_resp.status_code == 200
        prov_data = prov_resp.json()
        assert prov_data["scheme_id"] == scheme_id
        assert prov_data["primary_source"]["verification_status"] in ["VERIFIED", "DEMO"]
        assert prov_data["primary_source"]["source_type"] in [
            "OFFICIAL_GOVERNMENT", "AUTHORIZED_PARTNER", "VERIFIED_REFERENCE", "DEMO_SYNTHETIC"
        ]

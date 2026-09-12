"""
Tests for Financial Calculator, Channel Partner Routing, and Document Readiness.
Run: pytest tests/test_finance_and_partners.py -v
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.finance_service import calculate_emi
from services.partner_service import get_channel_partners
from services.document_service import check_document_readiness


# ── Financial Calculator Tests ────────────────────────────────────────────────

class TestFinancialCalculator:

    def test_normal_emi_calculation(self):
        """Standard loan: ₹5,00,000 at 8.5% for 60 months."""
        result = calculate_emi(principal=500000, annual_interest_rate=8.5, tenure_months=60)
        assert result["is_valid"] is True
        assert result["principal"] == 500000.0
        # Expected EMI around ₹10,258
        assert 10200 < result["monthly_emi"] < 10300
        assert result["total_repayment"] > 500000.0
        assert result["total_interest"] > 0

    def test_zero_interest_grant_subsidy(self):
        """0% concessional government loan: ₹1,20,000 for 12 months -> EMI = 10,000."""
        result = calculate_emi(principal=120000, annual_interest_rate=0.0, tenure_months=12)
        assert result["is_valid"] is True
        assert result["monthly_emi"] == 10000.0
        assert result["total_interest"] == 0.0
        assert result["total_repayment"] == 120000.0

    def test_invalid_negative_principal(self):
        """Negative principal should be rejected gracefully."""
        result = calculate_emi(principal=-50000, annual_interest_rate=8.5, tenure_months=36)
        assert result["is_valid"] is False
        assert result["monthly_emi"] == 0.0

    def test_invalid_zero_tenure(self):
        """Zero tenure should be rejected gracefully."""
        result = calculate_emi(principal=500000, annual_interest_rate=8.5, tenure_months=0)
        assert result["is_valid"] is False
        assert result["monthly_emi"] == 0.0

    def test_invalid_negative_interest_rate(self):
        """Negative interest rate should be rejected gracefully."""
        result = calculate_emi(principal=500000, annual_interest_rate=-2.0, tenure_months=24)
        assert result["is_valid"] is False

    def test_scheme_max_limit_warning_when_exceeded(self):
        """When loan amount exceeds scheme ceiling (e.g. KG0014 max ₹7,50,000), flag limit."""
        result = calculate_emi(principal=1000000, annual_interest_rate=8.0, tenure_months=60, scheme_id="KG0014")
        assert result["is_valid"] is True
        assert result["exceeds_scheme_limit"] is True
        assert result["scheme_max_limit"] == 750000.0
        assert "exceeds" in result["warning"].lower()

    def test_scheme_max_limit_within_bounds(self):
        """When loan amount is within scheme ceiling, exceeds_scheme_limit should be False."""
        result = calculate_emi(principal=500000, annual_interest_rate=8.0, tenure_months=60, scheme_id="KG0014")
        assert result["is_valid"] is True
        assert result["exceeds_scheme_limit"] is False
        assert result["scheme_max_limit"] == 750000.0

    def test_principal_and_interest_percentage_breakdown(self):
        """Verify principal and interest percentage breakdown calculation."""
        result = calculate_emi(principal=500000, annual_interest_rate=8.0, tenure_months=60)
        assert result["is_valid"] is True
        assert result["principal_percentage"] > 0
        assert result["interest_percentage"] > 0
        assert round(result["principal_percentage"] + result["interest_percentage"], 1) == 100.0

    def test_fastapi_calculate_emi_endpoints(self):
        """Test FastAPI router endpoints for calculate-emi and calculate."""
        from fastapi.testclient import TestClient
        from main import app
        client = TestClient(app)

        payload = {
            "principal": 500000,
            "annual_interest_rate": 8.0,
            "tenure_months": 60,
            "scheme_id": "KG0014"
        }
        res1 = client.post("/api/finance/calculate-emi", json=payload)
        assert res1.status_code == 200
        data1 = res1.json()
        assert data1["monthly_emi"] > 0
        assert data1["scheme_max_limit"] == 750000.0
        assert data1["exceeds_scheme_limit"] is False

        # Test alias endpoint
        res2 = client.post("/api/finance/calculate", json=payload)
        assert res2.status_code == 200
        assert res2.json()["monthly_emi"] == data1["monthly_emi"]


# ── Channel Partner Routing Tests ─────────────────────────────────────────────

class TestChannelPartnerRouting:

    def test_haversine_distance_standard(self):
        """Standard Haversine calculation between Lucknow and Varanasi (~260-290 km)."""
        from services.partner_service import haversine_distance_km
        lucknow = (26.8467, 80.9462)
        varanasi = (25.3176, 82.9739)
        dist = haversine_distance_km(lucknow, varanasi)
        assert 250.0 < dist < 320.0

    def test_haversine_same_coordinates_zero_km(self):
        """Identical coordinates must yield exact 0.0 km."""
        from services.partner_service import haversine_distance_km
        pt = (27.4924, 77.6737)
        assert haversine_distance_km(pt, pt) == 0.0

    def test_haversine_invalid_coordinates_raises_error(self):
        """Coordinates exceeding [-90, 90] or [-180, 180] should raise ValueError."""
        from services.partner_service import haversine_distance_km
        with pytest.raises(ValueError):
            haversine_distance_km((95.0, 80.0), (26.0, 80.0))
        with pytest.raises(ValueError):
            haversine_distance_km((26.0, -190.0), (26.0, 80.0))

    def test_partners_for_standup_india_in_up(self):
        """Recommend relevant channel partners for Stand-Up India in Uttar Pradesh."""
        partners = get_channel_partners(scheme_id="standup-india", state="Uttar Pradesh")
        assert len(partners) > 0
        for p in partners:
            assert "partner_name" in p
            assert "location" in p
            assert "supported_schemes" in p
            assert "reason" in p
            assert "DEMO" in p["data_status"].upper()

    def test_dairy_scheme_prioritizes_agri_or_rural_partner(self):
        """Dairy schemes should match banks/RRBs with dairy support."""
        partners = get_channel_partners(scheme_id="dairy-entrepreneurship", state="Uttar Pradesh")
        assert len(partners) > 0
        partner_names = [p["partner_name"] for p in partners]
        assert any("Aryavart" in name or "NABARD" in name or "State Bank" in name or "Punjab" in name for name in partner_names)

    def test_intelligent_routing_scoring_and_primary_partner(self):
        """Test route_channel_partners returns structured primary and alternative partners."""
        from services.partner_service import route_channel_partners
        res = route_channel_partners(
            scheme_id="standup-india",
            district="Lucknow",
            state="Uttar Pradesh",
            category="SC",
        )
        assert res["success"] is True
        assert res["primary_partner"] is not None
        assert res["primary_partner"]["routing_score"] > 0
        assert len(res["alternative_partners"]) > 0
        assert "reasons" in res["primary_partner"]
        assert len(res["primary_partner"]["reasons"]) > 0

    def test_sc_category_boosts_specialized_sca(self):
        """SC category should give specialized bonus to UPSCFDC."""
        from services.partner_service import route_channel_partners
        res_sc = route_channel_partners(
            scheme_id="nsfdc-loan",
            district="Lucknow",
            state="Uttar Pradesh",
            category="SC",
        )
        primary = res_sc["primary_partner"]
        assert "UPSCFDC" in primary["partner_name"] or "Scheduled Castes" in primary["partner_name"]

    def test_inactive_partner_filtered_by_default(self):
        """Inactive pilot partners should be excluded by default."""
        from services.partner_service import route_channel_partners
        res = route_channel_partners(include_inactive=False)
        partner_ids = [p["partner_id"] for p in res["partners"]]
        assert "inactive-pilot-partner" not in partner_ids

    def test_inactive_partner_included_when_flagged(self):
        """Inactive pilot partners should appear when include_inactive=True."""
        from services.partner_service import route_channel_partners
        res = route_channel_partners(include_inactive=True)
        partner_ids = [p["partner_id"] for p in res["partners"]]
        assert "inactive-pilot-partner" in partner_ids

    def test_radius_filtering_with_fallback(self):
        """Radius filter with fallback when no partners exist within tiny radius."""
        from services.partner_service import route_channel_partners
        # 1 km radius around Delhi
        res = route_channel_partners(
            district="Delhi",
            state="Delhi",
            radius_km=1.0,
        )
        assert res["success"] is True
        assert len(res["partners"]) > 0

    def test_data_provenance_demo_metadata(self):
        """Data provenance metadata must explicitly label demo status and unavailable live fund feeds."""
        from services.partner_service import route_channel_partners
        res = route_channel_partners(scheme_id="standup-india")
        prov = res["data_provenance"]
        assert prov["mode"] == "demo"
        assert prov["source"] == "synthetic_demo"
        assert prov["fund_status"] == "unavailable"
        assert "unavailable" in prov["fund_status_note"].lower()

    def test_fastapi_partners_route_and_nearby_endpoints(self):
        """Test FastAPI POST /api/partners/route and GET /api/partners/nearby."""
        from fastapi.testclient import TestClient
        from main import app
        client = TestClient(app)

        # POST /api/partners/route
        payload = {
            "scheme_id": "standup-india",
            "district": "Mathura",
            "state": "Uttar Pradesh",
            "category": "SC",
            "radius_km": 100.0,
        }
        res1 = client.post("/api/partners/route", json=payload)
        assert res1.status_code == 200
        data1 = res1.json()
        assert data1["success"] is True
        assert data1["primary_partner"] is not None
        assert data1["primary_partner"]["distance_km"] >= 0
        assert data1["data_provenance"]["mode"] == "demo"

        # GET /api/partners/nearby
        res2 = client.get("/api/partners/nearby?district=Varanasi&state=Uttar+Pradesh&scheme_id=pmegp")
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["success"] is True
        assert len(data2["partners"]) > 0

    def test_application_submission_with_partner_id(self):
        """Test submitting application with partner_id and partner_name."""
        from fastapi.testclient import TestClient
        from main import app
        client = TestClient(app)

        payload = {
            "scheme_id": "KG0001",
            "scheme_name": "Stand-Up India",
            "category": "SC",
            "income": 300000,
            "state": "Uttar Pradesh",
            "business_type": "Dairy Farm",
            "partner_id": "up-sc-finance-corp",
            "partner_name": "UP Scheduled Castes Finance & Development Corporation (UPSCFDC)",
        }
        res = client.post("/api/applications/submit", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["application_id"].startswith("APP-2026-")
        assert data["partner_id"] == "up-sc-finance-corp"
        assert data["partner_name"] == "UP Scheduled Castes Finance & Development Corporation (UPSCFDC)"


# ── Document Readiness Tests ──────────────────────────────────────────────────

class TestDocumentReadiness:

    def test_all_documents_provided(self):
        """All required documents provided -> 100% readiness."""
        req = ["Aadhaar Card", "Caste Certificate", "Project Report"]
        prov = ["Aadhaar Card", "Caste Certificate", "Project Report"]
        result = check_document_readiness(required_documents=req, provided_documents=prov)
        assert result["readiness_percentage"] == 100.0
        assert result["is_ready_to_submit"] is True
        assert len(result["missing_documents"]) == 0

    def test_partial_documents_provided(self):
        """1 of 2 documents provided -> 50% readiness."""
        req = ["Aadhaar Card", "Caste Certificate"]
        prov = ["Aadhaar Card"]
        result = check_document_readiness(required_documents=req, provided_documents=prov)
        assert result["readiness_percentage"] == 50.0
        assert result["is_ready_to_submit"] is False
        assert "Caste Certificate" in result["missing_documents"]

    def test_scheme_dynamic_required_documents(self):
        """Retrieve required documents dynamically for a real dataset scheme."""
        from services.document_service import get_scheme_required_documents
        docs = get_scheme_required_documents("KG0003")
        assert len(docs) > 0
        assert any("signature" in d.lower() or "enlistment" in d.lower() or "order" in d.lower() for d in docs)

    def test_fastapi_document_readiness_and_requirements_endpoints(self):
        """Test FastAPI document readiness and required-documents endpoints."""
        from fastapi.testclient import TestClient
        from main import app
        client = TestClient(app)

        # GET required documents
        res1 = client.get("/api/finance/required-documents?scheme_id=KG0003")
        assert res1.status_code == 200
        data1 = res1.json()
        assert data1["total_required"] > 0
        assert len(data1["required_documents"]) > 0

        # POST document readiness
        res2 = client.post("/api/finance/document-readiness", json={
            "scheme_id": "KG0003",
            "provided_documents": [data1["required_documents"][0]]
        })
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["readiness_percentage"] > 0
        assert len(data2["missing_documents"]) < data2["total_required"] if "total_required" in data2 else True


# ── OCR & Document Verification Tests ─────────────────────────────────────────

class TestDocumentVerificationAndOCR:

    def test_valid_pdf_document_upload(self):
        """Valid PDF header should pass structural verification."""
        from services.ocr_service import verify_document
        pdf_bytes = b"%PDF-1.4 sample pdf file content for testing purposes" + b"A" * 100
        res = verify_document(pdf_bytes, "project_proposal", filename="proposal.pdf")
        assert res["is_valid"] is True
        assert res["status"] == "uploaded"
        assert res["file_format"] == "PDF Document"
        assert res["file_size_bytes"] > 100

    def test_valid_jpeg_document_upload(self):
        """Valid JPEG header should pass structural verification."""
        from services.ocr_service import verify_document
        jpeg_bytes = b"\xff\xd8\xff\xe0" + b"\x00" * 150
        res = verify_document(jpeg_bytes, "aadhaar_card", filename="aadhaar.jpg")
        assert res["is_valid"] is True
        assert res["file_format"] == "JPEG Image"

    def test_valid_png_document_upload(self):
        """Valid PNG header should pass structural verification."""
        from services.ocr_service import verify_document
        png_bytes = b"\x89PNG\r\n\x1a\n" + b"\x00" * 150
        res = verify_document(png_bytes, "caste_certificate", filename="caste.png")
        assert res["is_valid"] is True
        assert res["file_format"] == "PNG Image"

    def test_empty_or_corrupt_file_rejected(self):
        """Corrupt or empty file (<100 bytes) should be rejected gracefully."""
        from services.ocr_service import verify_document
        res = verify_document(b"too small", "aadhaar_card")
        assert res["is_valid"] is False
        assert res["status"] == "error"

    def test_unsupported_file_format_rejected(self):
        """Executable or random text file signature should be rejected."""
        from services.ocr_service import verify_document
        res = verify_document(b"Random plain text content without valid image or pdf header " * 5, "aadhaar_card")
        assert res["is_valid"] is False
        assert res["status"] == "error"

    def test_fastapi_ocr_verify_endpoint(self):
        """Test multipart/form-data upload to POST /api/ocr/verify and /api/ocr/upload."""
        from fastapi.testclient import TestClient
        from main import app
        import io
        client = TestClient(app)

        dummy_pdf = io.BytesIO(b"%PDF-1.5 test document header and content" + b"X" * 150)
        res = client.post(
            "/api/ocr/verify",
            data={"document_type": "Income Certificate", "scheme_id": "KG0003"},
            files={"document": ("income_cert.pdf", dummy_pdf, "application/pdf")},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["is_valid"] is True
        assert data["status"] == "uploaded"
        assert data["file_format"] == "PDF Document"


# ── What-If Financial Simulator Tests ─────────────────────────────────────────

class TestWhatIfFinancialSimulator:

    def test_what_if_lower_loan_amount(self):
        """Comparing base ₹5L to scenario ₹4L should lower EMI and total interest."""
        from services.finance_service import simulate_what_if
        result = simulate_what_if(
            base={"loan_amount": 500000, "annual_interest_rate": 8.5, "tenure_months": 60},
            scenario={"loan_amount": 400000, "annual_interest_rate": 8.5, "tenure_months": 60},
        )
        assert result["success"] is True
        assert result["base"]["monthly_emi"] > result["scenario"]["monthly_emi"]
        assert result["difference"]["emi"] < 0
        assert result["difference"]["total_interest"] < 0
        assert "Lowers monthly EMI" in result["difference"]["narrative"]

    def test_what_if_higher_loan_amount(self):
        """Comparing base ₹5L to scenario ₹6L should increase EMI and total interest."""
        from services.finance_service import simulate_what_if
        result = simulate_what_if(
            base={"loan_amount": 500000, "annual_interest_rate": 8.5, "tenure_months": 60},
            scenario={"loan_amount": 600000, "annual_interest_rate": 8.5, "tenure_months": 60},
        )
        assert result["success"] is True
        assert result["scenario"]["monthly_emi"] > result["base"]["monthly_emi"]
        assert result["difference"]["emi"] > 0
        assert "Increases monthly EMI" in result["difference"]["narrative"]

    def test_what_if_longer_tenure(self):
        """Extending tenure (60m -> 84m) lowers monthly EMI but increases overall interest."""
        from services.finance_service import simulate_what_if
        result = simulate_what_if(
            base={"loan_amount": 500000, "annual_interest_rate": 8.5, "tenure_months": 60},
            scenario={"loan_amount": 500000, "annual_interest_rate": 8.5, "tenure_months": 84},
        )
        assert result["success"] is True
        assert result["scenario"]["monthly_emi"] < result["base"]["monthly_emi"]
        assert result["scenario"]["total_interest"] > result["base"]["total_interest"]
        assert result["difference"]["emi"] < 0
        assert result["difference"]["total_interest"] > 0

    def test_what_if_shorter_tenure(self):
        """Shortening tenure (60m -> 36m) increases monthly EMI but saves total interest."""
        from services.finance_service import simulate_what_if
        result = simulate_what_if(
            base={"loan_amount": 500000, "annual_interest_rate": 8.5, "tenure_months": 60},
            scenario={"loan_amount": 500000, "annual_interest_rate": 8.5, "tenure_months": 36},
        )
        assert result["success"] is True
        assert result["scenario"]["monthly_emi"] > result["base"]["monthly_emi"]
        assert result["scenario"]["total_interest"] < result["base"]["total_interest"]
        assert result["difference"]["emi"] > 0
        assert result["difference"]["total_interest"] < 0

    def test_what_if_zero_interest_subsidy(self):
        """Comparing standard interest (8.5%) to 0% interest grant subsidy."""
        from services.finance_service import simulate_what_if
        result = simulate_what_if(
            base={"loan_amount": 120000, "annual_interest_rate": 8.5, "tenure_months": 12},
            scenario={"loan_amount": 120000, "annual_interest_rate": 0.0, "tenure_months": 12},
        )
        assert result["success"] is True
        assert result["scenario"]["monthly_emi"] == 10000.0
        assert result["scenario"]["total_interest"] == 0.0
        assert result["difference"]["total_interest"] < 0

    def test_what_if_scheme_max_limit_flagged(self):
        """When What-If scenario exceeds scheme limit (KG0014 max ₹7.5L), flag limit violation."""
        from services.finance_service import simulate_what_if
        result = simulate_what_if(
            scheme_id="KG0014",
            base={"loan_amount": 500000, "annual_interest_rate": 8.0, "tenure_months": 60},
            scenario={"loan_amount": 1000000, "annual_interest_rate": 8.0, "tenure_months": 60},
        )
        assert result["success"] is True
        assert result["base"]["exceeds_scheme_limit"] is False
        assert result["scenario"]["exceeds_scheme_limit"] is True
        assert result["scenario"]["scheme_max_limit"] == 750000.0

    def test_what_if_financial_readiness_comparison(self):
        """When applicant income/expenses are provided, compute readiness for both scenarios."""
        from services.finance_service import simulate_what_if
        result = simulate_what_if(
            base={"loan_amount": 600000, "annual_interest_rate": 9.0, "tenure_months": 48},
            scenario={"loan_amount": 300000, "annual_interest_rate": 6.0, "tenure_months": 60},
            financial_profile={
                "monthly_income": 35000,
                "monthly_expenses": 15000,
                "existing_emi": 2000,
            }
        )
        assert result["success"] is True
        assert result["base"]["readiness"] is not None
        assert result["scenario"]["readiness"] is not None
        assert result["scenario"]["readiness"]["emi_to_income_ratio"] < result["base"]["readiness"]["emi_to_income_ratio"]
        assert result["scenario"]["readiness"]["disposable_income"] > result["base"]["readiness"]["disposable_income"]

    def test_what_if_without_financial_profile(self):
        """Without financial profile, readiness should be None gracefully."""
        from services.finance_service import simulate_what_if
        result = simulate_what_if(
            base={"loan_amount": 500000, "annual_interest_rate": 8.5, "tenure_months": 60},
            scenario={"loan_amount": 400000, "annual_interest_rate": 8.5, "tenure_months": 60},
            financial_profile=None,
        )
        assert result["base"]["readiness"] is None
        assert result["scenario"]["readiness"] is None

    def test_what_if_invalid_inputs_handled(self):
        """Invalid negative values in scenario should return is_valid=False without crashing."""
        from services.finance_service import simulate_what_if
        result = simulate_what_if(
            base={"loan_amount": 500000, "annual_interest_rate": 8.5, "tenure_months": 60},
            scenario={"loan_amount": -100000, "annual_interest_rate": 8.5, "tenure_months": 0},
        )
        assert result["success"] is True
        assert result["scenario"]["is_valid"] is False

    def test_fastapi_what_if_endpoints(self):
        """Test FastAPI POST /api/finance/what-if and /api/finance/simulate-what-if."""
        from fastapi.testclient import TestClient
        from main import app
        client = TestClient(app)

        payload = {
            "scheme_id": "standup-india",
            "base": {
                "loan_amount": 500000,
                "annual_interest_rate": 8.5,
                "tenure_months": 60
            },
            "scenario": {
                "loan_amount": 400000,
                "annual_interest_rate": 8.5,
                "tenure_months": 60
            },
            "financial_profile": {
                "monthly_income": 40000,
                "monthly_expenses": 15000,
                "existing_emi": 0
            }
        }
        res1 = client.post("/api/finance/what-if", json=payload)
        assert res1.status_code == 200
        data1 = res1.json()
        assert data1["success"] is True
        assert data1["base"]["monthly_emi"] > 0
        assert data1["scenario"]["monthly_emi"] > 0
        assert data1["difference"]["emi"] < 0
        assert data1["base"]["readiness"]["status"] is not None

        # Test alias endpoint
        res2 = client.post("/api/finance/simulate-what-if", json=payload)
        assert res2.status_code == 200
        assert res2.json()["difference"]["emi"] == data1["difference"]["emi"]


# ── Financial Readiness Assessment Tests ───────────────────────────────────────

class TestFinancialReadinessAssessment:

    def test_comfortable_readiness(self):
        """Income ₹50,000, expenses ₹20,000, existing EMI ₹2,000, loan EMI ₹10,000 (total debt ₹12k = 24% <= 30%)."""
        from services.finance_service import assess_financial_readiness
        res = assess_financial_readiness(
            monthly_income=50000,
            monthly_household_expenses=20000,
            existing_emi=2000,
            estimated_emi=10000,
        )
        assert res["is_valid"] is True
        assert res["status"] == "comfortable"
        assert res["status_label"] == "Comfortable"
        assert res["metrics"]["emi_burden_percentage"] == 24.0
        assert res["metrics"]["disposable_income_after_emi"] == 18000.0
        assert "manageable" in res["explanation"]

    def test_moderate_readiness(self):
        """Income ₹40,000, expenses ₹18,000, existing EMI ₹0, loan EMI ₹14,000 (total debt ₹14k = 35% -> 30-40% range)."""
        from services.finance_service import assess_financial_readiness
        res = assess_financial_readiness(
            monthly_income=40000,
            monthly_household_expenses=18000,
            existing_emi=0,
            estimated_emi=14000,
        )
        assert res["is_valid"] is True
        assert res["status"] == "moderate"
        assert res["status_label"] == "Moderate"
        assert res["metrics"]["emi_burden_percentage"] == 35.0
        assert res["metrics"]["disposable_income_after_emi"] == 8000.0
        assert len(res["recommendations"]) > 0

    def test_high_repayment_burden_ratio_exceeded(self):
        """Income ₹30,000, expenses ₹10,000, existing EMI ₹0, loan EMI ₹15,000 (50% ratio > 40%)."""
        from services.finance_service import assess_financial_readiness
        res = assess_financial_readiness(
            monthly_income=30000,
            monthly_household_expenses=10000,
            existing_emi=0,
            estimated_emi=15000,
        )
        assert res["is_valid"] is True
        assert res["status"] == "high_repayment_burden"
        assert res["status_label"] == "High Repayment Burden"
        assert res["metrics"]["emi_burden_percentage"] == 50.0
        assert "substantial portion" in res["explanation"].lower() or "obligations" in res["explanation"].lower()

    def test_critical_edge_case_negative_disposable_income(self):
        """
        Critical edge case from specification:
        income = ₹30,000, expenses = ₹18,000, existing EMI = ₹3,000, new EMI = ₹10,138
        30,000 - 18,000 - 3,000 - 10,138 = -1,138
        Must strictly identify high_repayment_burden, never producing a false comfortable result.
        """
        from services.finance_service import assess_financial_readiness
        res = assess_financial_readiness(
            monthly_income=30000,
            monthly_household_expenses=18000,
            existing_emi=3000,
            estimated_emi=10138,
        )
        assert res["is_valid"] is True
        assert res["status"] == "high_repayment_burden"
        assert res["metrics"]["disposable_income_before_emi"] == 9000.0
        assert res["metrics"]["disposable_income_after_emi"] == -1138.0
        assert res["metrics"]["total_monthly_debt"] == 13138.0
        assert res["metrics"]["emi_burden_percentage"] == 43.8
        assert "exceed the available disposable income" in res["explanation"]

    def test_existing_emi_included_in_total_debt(self):
        """Existing EMI must be properly aggregated with new EMI."""
        from services.finance_service import assess_financial_readiness
        res = assess_financial_readiness(
            monthly_income=60000,
            monthly_household_expenses=20000,
            existing_emi=8000,
            estimated_emi=10000,
        )
        assert res["metrics"]["total_monthly_debt"] == 18000.0
        assert res["metrics"]["emi_burden_percentage"] == 30.0
        assert res["status"] == "comfortable"

    def test_missing_income_returns_insufficient_information(self):
        """Missing income should gracefully return insufficient_information."""
        from services.finance_service import assess_financial_readiness
        res = assess_financial_readiness(
            monthly_income=None,
            monthly_household_expenses=15000,
            estimated_emi=8000,
        )
        assert res["is_valid"] is False
        assert res["status"] == "insufficient_information"
        assert "need your monthly income" in res["explanation"]

    def test_missing_expenses_returns_insufficient_information(self):
        """Missing expenses should gracefully return insufficient_information."""
        from services.finance_service import assess_financial_readiness
        res = assess_financial_readiness(
            monthly_income=40000,
            monthly_household_expenses=None,
            estimated_emi=8000,
        )
        assert res["is_valid"] is False
        assert res["status"] == "insufficient_information"

    def test_zero_or_negative_income_handled_safely(self):
        """Zero or negative income should not cause division-by-zero crash."""
        from services.finance_service import assess_financial_readiness
        res_zero = assess_financial_readiness(
            monthly_income=0,
            monthly_household_expenses=15000,
            estimated_emi=8000,
        )
        assert res_zero["status"] == "insufficient_information"

        res_neg = assess_financial_readiness(
            monthly_income=-25000,
            monthly_household_expenses=15000,
            estimated_emi=8000,
        )
        assert res_neg["status"] == "insufficient_information"

    def test_invalid_negative_expenses_handled_safely(self):
        """Negative expenses should return insufficient_information."""
        from services.finance_service import assess_financial_readiness
        res = assess_financial_readiness(
            monthly_income=40000,
            monthly_household_expenses=-5000,
            estimated_emi=8000,
        )
        assert res["status"] == "insufficient_information"

    def test_emi_calculation_integration_with_loan_parameters(self):
        """Readiness calculation should compute EMI live from loan parameters when estimated_emi is omitted."""
        from services.finance_service import assess_financial_readiness
        res = assess_financial_readiness(
            monthly_income=50000,
            monthly_household_expenses=20000,
            existing_emi=0,
            requested_loan_amount=500000,
            annual_interest_rate=8.5,
            tenure_months=60,
        )
        assert res["is_valid"] is True
        assert res["metrics"]["estimated_new_emi"] > 10000
        assert res["metrics"]["total_monthly_debt"] > 10000

    def test_exact_threshold_boundary_cases(self):
        """Exact 30% boundary -> comfortable; exact 40% boundary -> moderate."""
        from services.finance_service import assess_financial_readiness
        # Total debt = 3000 on 10000 income -> exactly 30%
        res_30 = assess_financial_readiness(
            monthly_income=10000,
            monthly_household_expenses=4000,
            existing_emi=0,
            estimated_emi=3000,
        )
        assert res_30["status"] == "comfortable"

        # Total debt = 4000 on 10000 income -> exactly 40%
        res_40 = assess_financial_readiness(
            monthly_income=10000,
            monthly_household_expenses=4000,
            existing_emi=0,
            estimated_emi=4000,
        )
        assert res_40["status"] == "moderate"

    def test_fastapi_financial_readiness_endpoints(self):
        """Test FastAPI POST /api/finance/readiness and /api/finance/financial-readiness."""
        from fastapi.testclient import TestClient
        from main import app
        client = TestClient(app)

        payload = {
            "monthly_income": 45000,
            "monthly_household_expenses": 18000,
            "existing_emi": 2500,
            "requested_loan_amount": 400000,
            "annual_interest_rate": 8.0,
            "tenure_months": 60,
            "scheme_id": "standup-india"
        }
        res1 = client.post("/api/finance/readiness", json=payload)
        assert res1.status_code == 200
        data1 = res1.json()
        assert data1["is_valid"] is True
        assert data1["status"] in ["comfortable", "moderate", "high_repayment_burden"]
        assert data1["metrics"]["monthly_income"] == 45000.0
        assert data1["metrics"]["estimated_new_emi"] > 0
        assert len(data1["disclaimer"]) > 0

        # Test alias endpoint
        res2 = client.post("/api/finance/financial-readiness", json=payload)
        assert res2.status_code == 200
        assert res2.json()["metrics"]["total_monthly_debt"] == data1["metrics"]["total_monthly_debt"]



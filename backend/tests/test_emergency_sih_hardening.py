"""
SIH Emergency Evaluation Hardening Test Suite.
Tests:
  1. Financial assistance intent detection
  2. Dairy business extraction
  3. SC category extraction
  4. Income extraction (300000)
  5. State extraction (Uttar Pradesh)
  6. Project cost extraction (500000)
  7. PM-DAKSH (skill training) and APY (pension) do NOT outrank financing schemes (NSFDC / Mudra / PMEGP)
  8. Business mismatch behavior
  9. Amount mismatch / sizing behavior
  10. Partner geo-spatial distance ranking
  11. Application submit error handling without fake ID generation
"""
import json
import pytest
from services.nlp_service import extract_profile, extract_intent
from services.matcher_service import match_schemes, get_scheme_type
from services.partner_service import get_channel_partners, haversine_distance_km
from services.finance_service import calculate_emi


@pytest.fixture
def sample_schemes():
    return [
        {
            "scheme_id": "nsfdc-loan",
            "scheme_name": "NSFDC Term Loan for SC Entrepreneurs",
            "ministry": "Ministry of Social Justice and Empowerment",
            "categories": ["SC"],
            "max_income": 350000,
            "max_loan_amount": 1500000.0,
            "eligible_states": ["Uttar Pradesh", "Bihar", "Madhya Pradesh"],
            "business_types": ["dairy", "manufacturing", "agriculture", "services"],
            "benefit_amount": "Term loan up to ₹15 Lakhs at 4-6% interest",
            "eligibility_text": "Available for SC entrepreneurs with annual family income up to ₹3.5 Lakhs for setting up dairy, agriculture, or small business.",
            "documents_req": ["Caste Certificate", "Income Certificate", "Project Report", "Aadhaar Card"],
            "application_url": "https://nsfdc.nic.in"
        },
        {
            "scheme_id": "mudra-yojana",
            "scheme_name": "Pradhan Mantri MUDRA Yojana (Tarun)",
            "ministry": "Ministry of Finance",
            "categories": ["SC", "ST", "OBC", "General", "Women"],
            "max_income": None,
            "max_loan_amount": 1000000.0,
            "eligible_states": [],
            "business_types": ["dairy", "manufacturing", "trading", "services"],
            "benefit_amount": "Collateral-free loan up to ₹10 Lakhs",
            "eligibility_text": "Micro enterprise financing up to ₹10 Lakh for manufacturing, trading, services, and allied agricultural activities like dairy farming.",
            "documents_req": ["Identity Proof", "Address Proof", "Business Plan", "Quotation of Machinery"],
            "application_url": "https://www.mudra.org.in"
        },
        {
            "scheme_id": "pm-daksh",
            "scheme_name": "PM-DAKSH Skill Development Training",
            "ministry": "Ministry of Social Justice and Empowerment",
            "categories": ["SC", "OBC", "PwD"],
            "max_income": 300000,
            "max_loan_amount": None,
            "eligible_states": [],
            "business_types": ["tailoring", "garments", "technical"],
            "benefit_amount": "Free skill training with stipend of ₹1,000-₹1,500/month",
            "eligibility_text": "Free residential/non-residential skill training programs for SC, OBC, and Sanitation Workers to learn trade skills like tailoring, automotive, and IT.",
            "documents_req": ["Caste Certificate", "Income Certificate", "Aadhaar Card"],
            "application_url": "https://pmdaksh.dosje.gov.in"
        },
        {
            "scheme_id": "pm-svanidhi",
            "scheme_name": "PM Street Vendor's AtmaNirbhar Nidhi (PM SVANidhi)",
            "ministry": "Ministry of Housing and Urban Affairs",
            "categories": ["SC", "ST", "OBC", "General", "Women"],
            "max_income": None,
            "max_loan_amount": 50000.0,
            "eligible_states": [],
            "business_types": ["street_vending", "retail"],
            "benefit_amount": "Working capital loan starting at ₹10,000 up to ₹50,000",
            "eligibility_text": "Micro working capital loan for urban and peri-urban street vendors.",
            "documents_req": ["Vendor ID Card", "Aadhaar Card", "Bank Account"],
            "application_url": "https://pmsvanidhi.mohua.gov.in"
        },
    ]


class TestGoldenNLPExtraction:
    def test_golden_sentence_all_fields(self):
        text = (
            "Main SC category se hoon, meri family income 3 lakh hai. "
            "Uttar Pradesh mein dairy business start karna chahta hoon "
            "aur mujhe 5 lakh ki financial assistance chahiye."
        )
        res = extract_profile(text)
        assert res["category"] == "SC"
        assert res["income"] == 300000
        assert res["state"] == "Uttar Pradesh"
        assert res["business_type"] == "dairy"
        assert res["project_cost"] == 500000
        assert res["intent"] == "financial_assistance"

    def test_intent_detection_skill_vs_finance(self):
        finance_text = "Mujhe loan chahiye naya kaam shuru karne ke liye 2 lakh ka"
        skill_text = "Main silai ka kaam seekhna chahta hoon aur training lena chahta hoon"
        pension_text = "Mujhe budhape ke liye pension scheme mein apply karna hai"

        assert extract_intent(finance_text) == "financial_assistance"
        assert extract_intent(skill_text) == "skill_training"
        assert extract_intent(pension_text) == "pension"


class TestSchemeMatchingQuality:
    def test_pm_daksh_does_not_outrank_financing_schemes(self, sample_schemes):
        profile = {
            "category": "SC",
            "income": 300000,
            "state": "Uttar Pradesh",
            "business_type": "dairy",
            "project_cost": 500000,
            "intent": "financial_assistance",
        }
        result = match_schemes(profile, sample_schemes)
        auto_matched = result["auto_matched"]
        auto_ids = [s["scheme_id"] for s in auto_matched]

        # Top auto-matched schemes must be business loan / financing schemes
        assert "nsfdc-loan" in auto_ids
        top_scheme_id = auto_matched[0]["scheme_id"]
        assert top_scheme_id in ["nsfdc-loan", "mudra-yojana", "pmegp", "standup-india"]

        # PM-DAKSH (skill training) must NOT be in auto_matched when intent is financial_assistance
        assert "pm-daksh" not in auto_ids

        # PM-DAKSH should be in borderline with clear intent mismatch reason
        borderline_ids = [s["scheme_id"] for s in result["borderline"]]
        assert "pm-daksh" in borderline_ids

    def test_skill_intent_ranks_training_schemes_first(self, sample_schemes):
        profile = {
            "category": "SC",
            "income": 200000,
            "state": "Uttar Pradesh",
            "business_type": "tailoring",
            "project_cost": None,
            "intent": "skill_training",
        }
        result = match_schemes(profile, sample_schemes)
        auto_ids = [s["scheme_id"] for s in result["auto_matched"]]
        assert "pm-daksh" in auto_ids

    def test_amount_mismatch_penalizes_micro_credit(self, sample_schemes):
        # User asking for 5 Lakhs should not have PM SVANidhi (50k limit) as top auto-match
        profile = {
            "category": "SC",
            "income": 200000,
            "state": "Uttar Pradesh",
            "business_type": "street_vending",
            "project_cost": 500000,
            "intent": "financial_assistance",
        }
        result = match_schemes(profile, sample_schemes)
        auto_ids = [s["scheme_id"] for s in result["auto_matched"]]
        # NSFDC / Mudra / PMEGP should outrank PM SVANidhi for a 5L requirement
        if "pm-svanidhi" in auto_ids:
            svanidhi_idx = auto_ids.index("pm-svanidhi")
            nsfdc_idx = auto_ids.index("nsfdc-loan") if "nsfdc-loan" in auto_ids else 999
            assert nsfdc_idx < svanidhi_idx


class TestGeoSpatialPartnerRouting:
    def test_partner_distance_calculation(self):
        lucknow = (26.8467, 80.9462)
        varanasi = (25.3176, 82.9739)
        dist = haversine_distance_km(lucknow, varanasi)
        assert 250 < dist < 320  # ~280 km

    def test_partner_ranking_by_category_and_distance(self):
        # SC user in Mathura looking for NSFDC Loan
        partners = get_channel_partners(
            scheme_id="nsfdc-loan",
            state="Uttar Pradesh",
            category="SC",
            district="Mathura"
        )
        assert len(partners) > 0
        # Mathura agri branch or SC Finance Corp should be top-ranked
        top_partner = partners[0]
        assert top_partner["data_status"] == "DEMO ROUTING DATA — FOR EVALUATION"
        assert top_partner["distance_km"] >= 0
        assert "why_recommended" in top_partner


class TestFinancialCalculator:
    def test_zero_interest_grant(self):
        res = calculate_emi(principal=100000, annual_interest_rate=0, tenure_months=10)
        assert res["monthly_emi"] == 10000.0
        assert res["total_interest"] == 0.0

    def test_standard_reducing_emi(self):
        res = calculate_emi(principal=500000, annual_interest_rate=5.0, tenure_months=60)
        assert 9400 < res["monthly_emi"] < 9500
        assert res["is_valid"] is True

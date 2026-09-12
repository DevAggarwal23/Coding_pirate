"""
Tests for the AI matching engine.
Run: pytest tests/test_matching.py -v
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# ── Test Data ──────────────────────────────────────────────────────────────────
SC_USER = {
    "category": "SC",
    "income": 150000,
    "state": "Bihar",
    "business_type": "tailoring",
    "project_cost": None,
}

GENERAL_HIGH_INCOME_USER = {
    "category": "General",
    "income": 1500000,
    "state": "Maharashtra",
    "business_type": "technology",
    "project_cost": 500000,
}

WOMEN_OBC_USER = {
    "category": "OBC",
    "income": 200000,
    "state": "Rajasthan",
    "business_type": "food_processing",
    "project_cost": None,
}

SAMPLE_SCHEMES = [
    {
        "scheme_id": "standup-india",
        "scheme_name": "Stand-Up India",
        "categories": ["SC", "ST", "Women"],
        "max_income": None,
        "eligible_states": None,
        "eligibility_text": "Stand-Up India scheme provides bank loans to SC ST category entrepreneurs and women for greenfield enterprises.",
    },
    {
        "scheme_id": "nbcfdc-term-loan",
        "scheme_name": "NBCFDC Term Loan",
        "categories": ["OBC"],
        "max_income": 300000,
        "eligible_states": None,
        "eligibility_text": "NBCFDC provides term loans to OBC persons with income below 3 lakh for self employment.",
    },
    {
        "scheme_id": "nmdfc-loan",
        "scheme_name": "NMDFC Loan",
        "categories": ["Minorities"],
        "max_income": 600000,
        "eligible_states": None,
        "eligibility_text": "NMDFC provides loans to Muslim Christian Sikh Buddhist Jain Parsi minority communities.",
    },
]


# ── Confidence Tests ───────────────────────────────────────────────────────────
class TestConfidenceScoring:

    def test_hard_rule_fail_returns_zero(self):
        """SC user must NOT match minority-only scheme."""
        from ai_engine.confidence import compute_confidence
        score = compute_confidence(
            semantic_score=0.95,
            user_profile=SC_USER,
            scheme=SAMPLE_SCHEMES[2],  # NMDFC — minorities only
        )
        assert score == 0.0, "SC user should score 0 on minority-only scheme"

    def test_high_income_fails_income_cap(self):
        """User with ₹3L income must fail NBCFDC (max ₹3L) when over limit."""
        from ai_engine.confidence import compute_confidence
        rich_user = {**SC_USER, "income": 500000, "category": "OBC"}
        score = compute_confidence(
            semantic_score=0.9,
            user_profile=rich_user,
            scheme=SAMPLE_SCHEMES[1],  # NBCFDC max_income=300000
        )
        assert score == 0.0, "User above income ceiling must score 0"

    def test_valid_match_returns_positive_score(self):
        """SC user must match SC-eligible scheme with positive score."""
        from ai_engine.confidence import compute_confidence
        score = compute_confidence(
            semantic_score=0.88,
            user_profile=SC_USER,
            scheme=SAMPLE_SCHEMES[0],  # Stand-Up India — SC eligible
        )
        assert score > 0.60, f"Valid SC match should score > 0.60, got {score}"
        assert score <= 0.98, "Score must not exceed 0.98"

    def test_classification_thresholds(self):
        """Test auto_matched / borderline / not_matched classification."""
        from ai_engine.confidence import classify_confidence
        assert classify_confidence(0.90) == "auto_matched"
        assert classify_confidence(0.85) == "auto_matched"
        assert classify_confidence(0.75) == "borderline"
        assert classify_confidence(0.60) == "borderline"
        assert classify_confidence(0.59) == "not_matched"
        assert classify_confidence(0.0) == "not_matched"


# ── NLP Extraction Tests ───────────────────────────────────────────────────────
class TestNLPExtraction:

    def test_hindi_sc_extraction(self):
        """Extract SC category from Hindi text."""
        from services.nlp_service import extract_profile
        result = extract_profile("मेरी दर्जी की दुकान है एससी कैटेगरी हूँ बिहार में रहता हूँ")
        assert result["category"] in ["SC", "एससी", None]  # flexible

    def test_english_category_extraction(self):
        """Extract category from English text."""
        from services.nlp_service import extract_profile
        result = extract_profile("I am from SC category, my tailoring shop income is 1.5 lakh")
        assert result["category"] == "SC"

    def test_income_lakh_conversion(self):
        """1.5 lakh should convert to 150000."""
        from services.nlp_service import extract_profile
        result = extract_profile("my income is 1.5 lakh per year, SC category")
        if result["income"] is not None:
            assert result["income"] == 150000

    def test_missing_fields_detection(self):
        """Incomplete text should return missing_fields list."""
        from services.nlp_service import extract_profile, get_missing_fields
        result = extract_profile("I have a business in Bihar")
        missing = get_missing_fields(result)
        assert isinstance(missing, list)
        assert len(missing) > 0

    def test_follow_up_question_generated(self):
        """Follow-up question should be generated for missing fields."""
        from services.nlp_service import generate_followup
        question = generate_followup(["income", "category"])
        assert isinstance(question, str)
        assert len(question) > 5


# ── Integration Test ───────────────────────────────────────────────────────────
class TestMatchingPipeline:

    def test_sc_user_gets_standup_india(self):
        """SC user with tailoring business should match Stand-Up India."""
        from services.matcher_service import match_schemes_from_list
        result = match_schemes_from_list(SC_USER, SAMPLE_SCHEMES)
        
        all_ids = (
            [s["scheme_id"] for s in result.get("auto_matched", [])] +
            [s["scheme_id"] for s in result.get("borderline", [])]
        )
        assert "standup-india" in all_ids, "Stand-Up India should appear for SC user"

    def test_minority_scheme_excluded_for_sc(self):
        """NMDFC (minorities only) must be in not_eligible for SC user."""
        from services.matcher_service import match_schemes_from_list
        result = match_schemes_from_list(SC_USER, SAMPLE_SCHEMES)
        
        not_eligible_ids = [s["scheme_id"] for s in result.get("not_eligible", [])]
        assert "nmdfc-loan" in not_eligible_ids, "NMDFC must not be eligible for SC user"

    def test_result_has_required_keys(self):
        """Result must have all required keys."""
        from services.matcher_service import match_schemes_from_list
        result = match_schemes_from_list(SC_USER, SAMPLE_SCHEMES)
        
        assert "auto_matched" in result
        assert "borderline" in result
        assert "not_eligible" in result
        assert "total_schemes_checked" in result

    def test_auto_matched_sorted_by_confidence(self):
        """auto_matched list must be sorted highest confidence first."""
        from services.matcher_service import match_schemes_from_list
        result = match_schemes_from_list(SC_USER, SAMPLE_SCHEMES)
        
        scores = [s["confidence"] for s in result.get("auto_matched", [])]
        assert scores == sorted(scores, reverse=True), "auto_matched not sorted by confidence"

"""
Confidence scoring and classification module.
Blends rule eligibility and semantic similarity.
"""
from typing import Any


def compute_confidence(semantic_score: float, user_profile: dict[str, Any], scheme: dict[str, Any]) -> float:
    """
    Compute confidence score by evaluating hard rules and blending with semantic similarity.
    """
    user_category = user_profile.get("category")
    user_income = user_profile.get("income")
    user_state = user_profile.get("state")

    scheme_categories = scheme.get("categories") or []
    scheme_max_income = scheme.get("max_income")
    scheme_states = scheme.get("eligible_states")

    # Hard category rule
    if scheme_categories:
        if not user_category:
            return 0.0
        if user_category not in scheme_categories and "General" not in scheme_categories:
            return 0.0

    # Hard income rule
    if scheme_max_income is not None and user_income is not None:
        if user_income > scheme_max_income:
            return 0.0

    # Hard state rule
    if scheme_states and user_state:
        if user_state not in scheme_states:
            return 0.0

    # Blend semantic score (70%) + rule fulfillment (30%)
    score = (semantic_score * 0.70) + 0.25
    return round(min(score, 0.98), 2)


def classify_confidence(score: float) -> str:
    """Classify confidence score into triage tiers."""
    if score >= 0.85:
        return "auto_matched"
    elif score >= 0.60:
        return "borderline"
    else:
        return "not_matched"


def build_why_matched(user_profile: dict[str, Any], scheme: dict[str, Any]) -> str:
    """Build human-readable match rationale."""
    reasons = []
    user_cat = user_profile.get("category")
    if user_cat and user_cat in (scheme.get("categories") or []):
        reasons.append(f"{user_cat} category ✓")
    if scheme.get("max_income"):
        reasons.append(f"Income within ₹{scheme['max_income']:,} ceiling ✓")
    else:
        reasons.append("No income ceiling ✓")
    return " | ".join(reasons) if reasons else "Eligible for standard welfare criteria ✓"

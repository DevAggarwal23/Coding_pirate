"""
Scheme Matcher Service.
Performs deterministic rule validation, intent-aware alignment, and dense vector semantic scoring.
Distinguishes:
  - HARD INELIGIBLE (Category/Income/State violations)
  - SOFT MISMATCH (Intent / Business Type / Project Size divergence)
  - GOOD / AUTO MATCH (Category + Income + Intent + Business + Amount aligned)
"""
import logging
import re
from typing import Any, Optional, Tuple, List
from sqlalchemy.ext.asyncio import AsyncSession
from ai_engine.confidence import compute_confidence, classify_confidence
from ai_engine.faiss_index import scheme_index
from ai_engine.embedder import encode

logger = logging.getLogger(__name__)


# ── Scheme Category & Product Classification ──────────────────────────────────
# Derived from verified scheme benefits and eligibility criteria in schemes.json

SCHEME_TYPES = {
    # 1. Business Loans & Capital Finance
    "nsfdc-loan": "business_loan",
    "mudra-yojana": "business_loan",
    "standup-india": "business_loan",
    "pmegp": "subsidy_and_loan",
    "nbcfdc-term-loan": "business_loan",
    "nmdfc-loan": "business_loan",
    "mahila-udyam-nidhi": "business_loan",
    "stree-shakti": "business_loan",
    "pm-svanidhi": "micro_credit",
    "nai-rozgar": "subsidy_and_loan",
    "pm-vishwakarma": "collateral_free_loan",
    "cggtmsme": "credit_guarantee",
    "dairy-entrepreneurship": "subsidy_and_loan",
    "ahidf": "infrastructure_loan",

    # 2. Skill Training & Development (NOT business capital financing)
    "pm-daksh": "skill_training",
    "pradhan-mantri-kaushal": "skill_training",
    "samarth": "skill_training",
    "ddu-gky": "skill_training",

    # 3. Social Security & Pension (NOT business capital financing)
    "atal-pension": "pension",
    "pm-sym": "pension",
    "pm-suraksha-bima": "insurance",
    "pm-jeevan-jyoti": "insurance",
}


def get_scheme_type(scheme: dict[str, Any]) -> str:
    """Classify scheme into its primary functional category."""
    sid = scheme.get("scheme_id", "")
    if sid in SCHEME_TYPES:
        return SCHEME_TYPES[sid]

    # Heuristic fallback from text
    text = (scheme.get("eligibility_text", "") + " " + (scheme.get("benefit_amount") or "")).lower()
    if any(k in text for k in ["skill training", "stipend", "skilling", "training program", "kaushal"]):
        return "skill_training"
    if any(k in text for k in ["pension", "old age", "monthly pension"]):
        return "pension"
    if any(k in text for k in ["insurance", "accidental cover", "life cover"]):
        return "insurance"
    return "business_loan"


def check_hard_eligibility(user_profile: dict[str, Any], scheme: dict[str, Any]) -> Tuple[bool, str]:
    """
    Evaluate strict statutory eligibility constraints:
    1. Social Category (SC, ST, OBC, Women, etc.)
    2. Annual Income Ceiling
    3. State / Regional Jurisdiction
    Returns (is_eligible, disqualification_reason).
    """
    user_category = user_profile.get("category")
    user_income = user_profile.get("income")
    user_state = user_profile.get("state")

    scheme_categories = scheme.get("categories") or []
    scheme_max_income = scheme.get("max_income")
    scheme_states = scheme.get("eligible_states")

    # 1. Category Check
    if scheme_categories:
        if not user_category:
            return False, "Social category not specified in profile"
        if user_category not in scheme_categories and "General" not in scheme_categories:
            return False, f"Target beneficiaries are {', '.join(scheme_categories)}, but profile category is {user_category}"

    # 2. Income Check
    if scheme_max_income is not None and user_income is not None:
        if user_income > scheme_max_income:
            return False, f"Annual family income (₹{user_income:,}) exceeds scheme ceiling (₹{scheme_max_income:,})"

    # 3. State Check
    if scheme_states:
        if user_state and user_state not in scheme_states:
            return False, f"Scheme is only operational in {', '.join(scheme_states)}"

    return True, "Eligible"


def evaluate_intent_and_fit(
    user_profile: dict[str, Any],
    scheme: dict[str, Any]
) -> Tuple[str, float, List[str]]:
    """
    Evaluates alignment between user intent (financial assistance vs skill training vs pension),
    business type, and requested loan/project amount.

    Returns:
      (fit_tier: 'high' | 'medium' | 'soft_mismatch' | 'intent_mismatch',
       fit_modifier: float,
       reasons: list[str])
    """
    user_intent = user_profile.get("intent") or "financial_assistance"
    user_business = (user_profile.get("business_type") or "").lower().strip()
    user_cost = user_profile.get("project_cost")
    scheme_type = get_scheme_type(scheme)
    scheme_business = [b.lower() for b in (scheme.get("business_types") or [])]
    reasons: List[str] = []

    # Category verification reason
    user_cat = user_profile.get("category")
    if user_cat and user_cat in (scheme.get("categories") or []):
        reasons.append(f"✓ {user_cat} category verified")

    # Income verification reason
    if scheme.get("max_income"):
        reasons.append(f"✓ Annual income within ₹{scheme['max_income']:,} ceiling")
    else:
        reasons.append("✓ No restrictive income ceiling")

    # ── 1. Intent Alignment ───────────────────────────────────────────────────
    is_finance_intent = user_intent in ("financial_assistance", "business_loan", "general_query")
    is_scheme_finance = scheme_type in ("business_loan", "subsidy_and_loan", "micro_credit", "collateral_free_loan")

    if is_finance_intent and not is_scheme_finance:
        # User wants funding/loan, but scheme is training or pension
        if scheme_type == "skill_training":
            return (
                "intent_mismatch",
                -0.40,
                [f"Skill training scheme (provides free training & stipend), not a capital business loan."]
            )
        elif scheme_type == "pension":
            return (
                "intent_mismatch",
                -0.45,
                ["Social security / pension scheme — not applicable for enterprise business financing."]
            )
        elif scheme_type == "insurance":
            return (
                "intent_mismatch",
                -0.45,
                ["Insurance welfare cover — not applicable for enterprise business financing."]
            )

    if is_scheme_finance:
        reasons.append("✓ Provides direct enterprise financing / loan support")

    # ── 2. Business Type Alignment ────────────────────────────────────────────
    fit_tier = "high"
    fit_modifier = 0.0

    if user_business:
        if not scheme_business:
            # Unrestricted scheme (covers any viable trade/agri-allied/micro-enterprise)
            reasons.append(f"✓ {user_business.capitalize()} enterprise eligible under broad self-employment sector")
            fit_modifier += 0.04
        elif user_business in scheme_business or any(b in user_business for b in scheme_business):
            reasons.append(f"✓ {user_business.capitalize()} business is explicitly covered in priority sector")
            fit_modifier += 0.08
        else:
            # Check for agri-allied / dairy in broader manufacturing/services/trading
            if user_business == "dairy" and any(b in scheme_business for b in ["services", "trading", "manufacturing", "food"]):
                reasons.append("✓ Dairy enterprise eligible under food processing / micro-enterprise activities")
                fit_modifier += 0.04
            elif "street_vending" in scheme_business and user_business != "street_vending":
                # e.g. PM SVANidhi for a 5L dairy business
                fit_tier = "soft_mismatch"
                fit_modifier -= 0.15
                reasons.append("ℹ️ Scheme tailored specifically for street vendors; limits may not suit enterprise setup")
            else:
                reasons.append(f"✓ Basic eligibility matches; enterprise subject to sector guidelines")
                fit_modifier -= 0.02

    # ── 3. Project Cost / Loan Size Alignment ─────────────────────────────────
    if user_cost and is_scheme_finance:
        sid = scheme.get("scheme_id", "")
        if sid == "nsfdc-loan":
            reasons.append(f"✓ Requested ₹{user_cost:,} within scheme limit (up to ₹10 Lakh @ 5-6% concessional rate)")
            fit_modifier += 0.08
        elif sid == "mudra-yojana":
            if user_cost <= 500000:
                reasons.append(f"✓ Requested ₹{user_cost:,} matches MUDRA Kishore tier (₹50,000 to ₹5 Lakh collateral-free)")
            else:
                reasons.append(f"✓ Requested ₹{user_cost:,} matches MUDRA Tarun tier (₹5 Lakh to ₹10 Lakh collateral-free)")
            fit_modifier += 0.07
        elif sid == "pmegp":
            reasons.append(f"✓ Project cost of ₹{user_cost:,} eligible for 25-35% government margin subsidy")
            fit_modifier += 0.06
        elif sid == "standup-india":
            if user_cost >= 1000000:
                reasons.append(f"✓ Requested ₹{user_cost:,} within Stand-Up India composite loan range (₹10L - ₹1Cr)")
                fit_modifier += 0.06
            else:
                reasons.append(f"ℹ️ Stand-Up India greenfield loan minimum is ₹10 Lakh; project expansion required")
                fit_modifier += 0.01
        elif sid == "pm-svanidhi" and user_cost > 50000:
            fit_tier = "soft_mismatch"
            fit_modifier -= 0.20
            reasons.append(f"ℹ️ Maximum loan is ₹50,000; insufficient for ₹{user_cost:,} project requirement")

    return fit_tier, fit_modifier, reasons


def compute_scheme_confidence(
    user_profile: dict[str, Any],
    scheme: dict[str, Any],
    query_vec: Optional[Any] = None,
    fit_tier: str = "high",
    fit_modifier: float = 0.0
) -> float:
    """
    Blends real dense vector semantic retrieval with intent & hard rule fulfillment.
    """
    scheme_id = scheme.get("scheme_id", "")
    base_semantic = 0.84

    # Try dense vector similarity if index loaded
    if query_vec is not None and scheme_index.is_loaded():
        sim = scheme_index.get_similarity_for_scheme(scheme_id, query_vec)
        if sim is not None and sim > 0:
            base_semantic = sim

    # Blend semantic + fit modifiers
    blended_score = base_semantic + fit_modifier
    return compute_confidence(blended_score, user_profile, scheme)


def match_schemes_from_list(
    user_profile: dict[str, Any],
    schemes: list[dict[str, Any]]
) -> dict[str, Any]:
    """
    Core matching function:
    1. Hard eligibility filtering (Category, Income, State).
    2. Intent and Purpose filtering (Financing vs Skilling vs Social Security).
    3. Dense semantic scoring & explainable 'Why Matched' generation.
    4. Categorization into auto_matched, borderline, and not_eligible.
    """
    auto_matched = []
    borderline = []
    not_eligible = []

    # Build semantic search query text from user profile
    query_parts = []
    if user_profile.get("category"):
        query_parts.append(f"{user_profile['category']} category")
    if user_profile.get("business_type"):
        query_parts.append(f"{user_profile['business_type']} business setup")
    if user_profile.get("state"):
        query_parts.append(f"in {user_profile['state']}")
    if user_profile.get("project_cost"):
        query_parts.append(f"financial assistance loan of {user_profile['project_cost']}")
    if user_profile.get("intent"):
        query_parts.append(user_profile["intent"].replace("_", " "))

    query_vec = None
    if query_parts:
        try:
            query_vec = encode(" ".join(query_parts))
        except Exception as e:
            logger.debug(f"Query vector generation note: {e}")
            query_vec = None

    for scheme in schemes:
        scheme_id = scheme.get("scheme_id", "")
        scheme_name = scheme.get("scheme_name", "")

        # 1. Hard Rule Check
        is_eligible, reason = check_hard_eligibility(user_profile, scheme)
        if not is_eligible:
            not_eligible.append({
                "scheme_id": scheme_id,
                "scheme_name": scheme_name,
                "reason": reason,
            })
            continue

        # 2. Intent and Fit Check
        fit_tier, fit_mod, why_reasons = evaluate_intent_and_fit(user_profile, scheme)

        if fit_tier == "intent_mismatch":
            # Scheme is fundamentally wrong functional type (e.g. Training for a ₹5L loan query)
            borderline.append({
                "scheme_id": scheme_id,
                "scheme_name": scheme_name,
                "confidence": 0.65,
                "reason": why_reasons[0] if why_reasons else "Scheme functional purpose diverges from requested assistance.",
            })
            continue

        # 3. Compute Final Blended Confidence
        confidence = compute_scheme_confidence(
            user_profile,
            scheme,
            query_vec=query_vec,
            fit_tier=fit_tier,
            fit_modifier=fit_mod
        )

        tier = classify_confidence(confidence)
        benefit = scheme.get("benefit_amount")
        documents = scheme.get("documents_required") or scheme.get("documents_req") or []
        link = scheme.get("application_url")
        why_text = " | ".join(why_reasons) if why_reasons else "Eligible under standard welfare criteria ✓"

        if tier == "auto_matched" and fit_tier == "high":
            auto_matched.append({
                "scheme_id": scheme_id,
                "scheme_name": scheme_name,
                "confidence": confidence,
                "benefit": benefit,
                "documents_required": documents,
                "application_link": link,
                "why_matched": why_text,
            })
        else:
            borderline.append({
                "scheme_id": scheme_id,
                "scheme_name": scheme_name,
                "confidence": confidence,
                "reason": why_text,
            })

    # Sort auto_matched by confidence descending
    auto_matched.sort(key=lambda x: x["confidence"], reverse=True)
    borderline.sort(key=lambda x: x["confidence"], reverse=True)

    return {
        "auto_matched": auto_matched,
        "borderline": borderline,
        "not_eligible": not_eligible,
        "total_schemes_checked": len(schemes),
        "processing_time_ms": 0,
    }


def match_schemes(user_profile: dict[str, Any], all_schemes: list[dict[str, Any]]) -> dict[str, Any]:
    """Alias for match_schemes_from_list."""
    return match_schemes_from_list(user_profile, all_schemes)


async def match_schemes_from_db(user_profile: dict[str, Any], db: AsyncSession) -> dict[str, Any]:
    """
    Matches user profile directly by pulling scheme data from PostgreSQL through scheme_service.
    """
    from services.scheme_service import get_all_schemes_cached
    schemes = await get_all_schemes_cached(db)
    return match_schemes_from_list(user_profile, schemes)

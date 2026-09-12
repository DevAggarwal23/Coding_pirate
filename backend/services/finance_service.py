"""
Financial Calculation Service.
Provides standard EMI, interest breakdown, and repayment calculations for loan schemes.
Includes scheme-aware loan ceiling validation and concessional zero-interest calculations.
"""
import logging
from typing import Optional, Dict, Any
from services.scheme_service import _load_schemes_from_json

logger = logging.getLogger(__name__)


def calculate_emi(
    principal: float,
    annual_interest_rate: float,
    tenure_months: int,
    scheme_id: Optional[str] = None,
) -> dict:
    """
    Calculate standard loan EMI, total interest, and total repayment breakdown.

    Formula:
      EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
      where:
        P = principal
        r = monthly interest rate (annual_interest_rate / 12 / 100)
        n = tenure_months

    Handles:
      - Zero interest (e.g. 0% interest government grants/subsidies)
      - Scheme maximum loan ceiling validation
      - Invalid inputs (negative numbers, zero tenure/principal, non-numeric values)
    """
    try:
        principal = float(principal)
        annual_interest_rate = float(annual_interest_rate)
        tenure_months = int(tenure_months)
    except (ValueError, TypeError):
        return {
            "principal": 0.0,
            "annual_interest_rate": 0.0,
            "tenure_months": 0,
            "monthly_emi": 0.0,
            "total_interest": 0.0,
            "total_repayment": 0.0,
            "principal_percentage": 100.0,
            "interest_percentage": 0.0,
            "is_valid": False,
            "message": "Please enter valid numeric values for loan amount, interest rate, and tenure.",
            "scheme_id": scheme_id,
            "scheme_max_limit": None,
            "exceeds_scheme_limit": False,
        }

    if principal <= 0:
        return {
            "principal": max(0.0, principal),
            "annual_interest_rate": max(0.0, annual_interest_rate),
            "tenure_months": max(0, tenure_months),
            "monthly_emi": 0.0,
            "total_interest": 0.0,
            "total_repayment": 0.0,
            "principal_percentage": 100.0,
            "interest_percentage": 0.0,
            "is_valid": False,
            "message": "Loan amount must be greater than zero.",
            "scheme_id": scheme_id,
            "scheme_max_limit": None,
            "exceeds_scheme_limit": False,
        }

    if tenure_months <= 0 or tenure_months > 360:
        return {
            "principal": round(principal, 2),
            "annual_interest_rate": max(0.0, annual_interest_rate),
            "tenure_months": max(0, tenure_months),
            "monthly_emi": 0.0,
            "total_interest": 0.0,
            "total_repayment": 0.0,
            "principal_percentage": 100.0,
            "interest_percentage": 0.0,
            "is_valid": False,
            "message": "Loan tenure must be between 1 and 360 months (up to 30 years).",
            "scheme_id": scheme_id,
            "scheme_max_limit": None,
            "exceeds_scheme_limit": False,
        }

    if annual_interest_rate < 0 or annual_interest_rate > 100:
        return {
            "principal": round(principal, 2),
            "annual_interest_rate": max(0.0, annual_interest_rate),
            "tenure_months": tenure_months,
            "monthly_emi": 0.0,
            "total_interest": 0.0,
            "total_repayment": 0.0,
            "principal_percentage": 100.0,
            "interest_percentage": 0.0,
            "is_valid": False,
            "message": "Annual interest rate must be between 0% and 100%.",
            "scheme_id": scheme_id,
            "scheme_max_limit": None,
            "exceeds_scheme_limit": False,
        }

    # Scheme maximum limit check
    scheme_max_limit: Optional[float] = None
    exceeds_scheme_limit = False
    scheme_warning = None

    if scheme_id:
        try:
            all_schemes = _load_schemes_from_json()
            for s in all_schemes:
                if s.get("scheme_id") == scheme_id:
                    mla = s.get("max_loan_amount")
                    if mla is not None and float(mla) > 0:
                        scheme_max_limit = float(mla)
                        if principal > scheme_max_limit:
                            exceeds_scheme_limit = True
                            scheme_warning = (
                                f"Requested amount (₹{int(principal):,}) exceeds the maximum loan amount "
                                f"(₹{int(scheme_max_limit):,}) available under this scheme."
                            )
                    break
        except Exception as ex:
            logger.debug(f"Scheme limit lookup skipped: {ex}")



    # Case 1: Zero interest (e.g. 0% interest subsidy or interest-free grant)
    if annual_interest_rate == 0.0:
        monthly_emi = round(principal / tenure_months, 2)
        total_repayment = round(principal, 2)
        return {
            "principal": round(principal, 2),
            "annual_interest_rate": 0.0,
            "tenure_months": tenure_months,
            "monthly_emi": monthly_emi,
            "total_interest": 0.0,
            "total_repayment": total_repayment,
            "principal_percentage": 100.0,
            "interest_percentage": 0.0,
            "is_valid": True,
            "message": scheme_warning or "Zero-interest concessional / grant calculation.",
            "warning": scheme_warning,
            "scheme_id": scheme_id,
            "scheme_max_limit": scheme_max_limit,
            "exceeds_scheme_limit": exceeds_scheme_limit,
        }

    # Case 2: Standard reducing-balance EMI formula
    monthly_rate = (annual_interest_rate / 100.0) / 12.0
    factor = (1.0 + monthly_rate) ** tenure_months
    monthly_emi = round((principal * monthly_rate * factor) / (factor - 1.0), 2)
    total_repayment = round(monthly_emi * tenure_months, 2)
    total_interest = round(max(0.0, total_repayment - principal), 2)

    principal_pct = round((principal / total_repayment) * 100.0, 1) if total_repayment > 0 else 100.0
    interest_pct = round(max(0.0, 100.0 - principal_pct), 1)

    return {
        "principal": round(principal, 2),
        "annual_interest_rate": round(annual_interest_rate, 2),
        "tenure_months": tenure_months,
        "monthly_emi": monthly_emi,
        "total_interest": total_interest,
        "total_repayment": total_repayment,
        "principal_percentage": principal_pct,
        "interest_percentage": interest_pct,
        "is_valid": True,
        "message": scheme_warning or "Standard reducing-balance EMI calculation.",
        "warning": scheme_warning,
        "scheme_id": scheme_id,
        "scheme_max_limit": scheme_max_limit,
        "exceeds_scheme_limit": exceeds_scheme_limit,
    }


# ── Financial Readiness Thresholds (Configurable Educational Heuristic) ────────
COMFORTABLE_BURDEN_THRESHOLD = 0.30  # <= 30% of monthly income
MODERATE_BURDEN_THRESHOLD = 0.40     # <= 40% of monthly income


def assess_financial_readiness(
    monthly_income: Optional[float] = None,
    monthly_household_expenses: Optional[float] = None,
    monthly_expenses: Optional[float] = None,
    existing_emi: Optional[float] = 0.0,
    requested_loan_amount: Optional[float] = None,
    principal: Optional[float] = None,
    annual_interest_rate: float = 8.5,
    tenure_months: int = 60,
    scheme_id: Optional[str] = None,
    estimated_emi: Optional[float] = None,
) -> dict:
    """
    Assess whether a proposed loan repayment appears manageable based on applicant cashflows.
    Calculates disposable income before/after EMI, total monthly debt, and burden ratio.
    Educational heuristic — NOT an official loan approval, credit score, or sanction decision.
    """
    # 1. Resolve loan principal & calculate EMI if not directly supplied
    loan_p = requested_loan_amount if requested_loan_amount is not None else principal
    if estimated_emi is None:
        if loan_p is not None and loan_p > 0:
            emi_calc = calculate_emi(
                principal=loan_p,
                annual_interest_rate=annual_interest_rate,
                tenure_months=tenure_months,
                scheme_id=scheme_id,
            )
            calc_emi = emi_calc["monthly_emi"] if emi_calc["is_valid"] else 0.0
        else:
            calc_emi = 0.0
    else:
        calc_emi = max(0.0, float(estimated_emi))

    # 2. Resolve expenses and other obligations
    exp_val = monthly_household_expenses if monthly_household_expenses is not None else monthly_expenses
    other_emi = max(0.0, float(existing_emi or 0.0))

    # 3. Guard against missing or non-positive financial inputs
    if (
        monthly_income is None
        or monthly_income <= 0
        or exp_val is None
        or exp_val < 0
    ):
        return {
            "status": "insufficient_information",
            "status_label": "Insufficient Information",
            "metrics": {
                "monthly_income": float(monthly_income) if monthly_income is not None and monthly_income > 0 else None,
                "monthly_household_expenses": float(exp_val) if exp_val is not None and exp_val >= 0 else None,
                "existing_emi": other_emi,
                "estimated_new_emi": round(calc_emi, 2),
                "total_monthly_debt": round(other_emi + calc_emi, 2),
                "disposable_income_before_emi": None,
                "disposable_income_after_emi": None,
                "emi_burden_ratio": None,
                "emi_burden_percentage": None,
            },
            "explanation": "We need your monthly income and household expenses to estimate repayment readiness.",
            "recommendations": [
                "Provide your monthly income and household expenses to calculate your cashflow buffer."
            ],
            "disclaimer": (
                "This is an illustrative educational financial assessment, not a loan approval, "
                "credit score, or sanction decision. Final terms are determined by the authorized "
                "Channel Partner under MoSJE & MSME guidelines."
            ),
            "is_valid": False,
        }

    # 4. Perform complete cashflow and burden calculations
    income = float(monthly_income)
    expenses = float(exp_val)
    total_monthly_debt = round(other_emi + calc_emi, 2)
    disposable_before = round(income - expenses - other_emi, 2)
    disposable_after = round(income - expenses - other_emi - calc_emi, 2)
    burden_ratio = round(total_monthly_debt / income, 4) if income > 0 else 0.0
    burden_pct = round(burden_ratio * 100.0, 1)

    # 5. Transparent classification logic
    if disposable_after < 0:
        status = "high_repayment_burden"
        status_label = "High Repayment Burden"
        explanation = (
            "The estimated monthly obligations exceed the available disposable income. "
            "Consider a lower loan amount, longer tenure, or review financial assumptions."
        )
        recommendations = [
            "Consider requesting a lower loan amount to reduce monthly obligations",
            "Compare a longer repayment tenure to decrease the monthly EMI",
            "Review monthly household expenses and existing debt before taking on new obligations",
        ]
    elif burden_ratio <= COMFORTABLE_BURDEN_THRESHOLD:
        status = "comfortable"
        status_label = "Comfortable"
        explanation = (
            "Based on the information provided, the estimated monthly repayment appears manageable "
            "relative to the stated income."
        )
        recommendations = [
            "Your repayment burden is within standard comfortable bounds",
            "Proceed to check required documents and connect with an authorized Channel Partner",
        ]
    elif burden_ratio <= MODERATE_BURDEN_THRESHOLD:
        status = "moderate"
        status_label = "Moderate"
        explanation = (
            "The estimated repayment represents a moderate portion of the stated monthly income. "
            "Consider comparing a longer tenure or lower loan amount."
        )
        recommendations = [
            "Compare a longer tenure in the What-If Simulator to improve cashflow buffer",
            "Test a lower loan amount to increase your monthly disposable safety margin",
        ]
    else:
        status = "high_repayment_burden"
        status_label = "High Repayment Burden"
        explanation = (
            f"The estimated monthly debt obligations consume {burden_pct}% of monthly income. "
            "Consider a lower loan amount, longer tenure, or review financial assumptions."
        )
        recommendations = [
            "Consider requesting a lower loan amount to reduce monthly obligations",
            "Compare a longer repayment tenure to decrease the monthly EMI",
        ]

    return {
        "status": status,
        "status_label": status_label,
        "metrics": {
            "monthly_income": income,
            "monthly_household_expenses": expenses,
            "existing_emi": other_emi,
            "estimated_new_emi": round(calc_emi, 2),
            "total_monthly_debt": total_monthly_debt,
            "disposable_income_before_emi": disposable_before,
            "disposable_income_after_emi": disposable_after,
            "emi_burden_ratio": burden_ratio,
            "emi_burden_percentage": burden_pct,
        },
        "explanation": explanation,
        "recommendations": recommendations,
        "disclaimer": (
            "This is an illustrative educational financial assessment, not a loan approval, "
            "credit score, or sanction decision. Final terms are determined by the authorized "
            "Channel Partner under MoSJE & MSME guidelines."
        ),
        "is_valid": True,
    }


def compute_financial_readiness(
    monthly_emi: float,
    monthly_income: Optional[float] = None,
    monthly_expenses: Optional[float] = None,
    existing_emi: Optional[float] = None,
) -> Optional[dict]:
    """
    Calculate applicant repayment comfort / financial readiness.
    Compares total debt obligations with household/business monthly income.
    """
    if monthly_income is None or monthly_income <= 0:
        return None

    res = assess_financial_readiness(
        monthly_income=monthly_income,
        monthly_household_expenses=monthly_expenses,
        existing_emi=existing_emi,
        estimated_emi=monthly_emi,
    )
    if not res["is_valid"]:
        return None

    m = res["metrics"]
    return {
        "status": res["status_label"],
        "status_code": res["status"],
        "emi_to_income_ratio": m["emi_burden_percentage"],
        "monthly_income": m["monthly_income"],
        "monthly_expenses": m["monthly_household_expenses"],
        "existing_emi": m["existing_emi"],
        "total_obligations": m["total_monthly_debt"],
        "disposable_income": m["disposable_income_after_emi"],
        "disposable_income_before_emi": m["disposable_income_before_emi"],
        "reason": res["explanation"],
        "recommendations": res["recommendations"],
    }


def simulate_what_if(
    base: dict,
    scenario: Optional[dict] = None,
    scenarios: Optional[list[dict]] = None,
    scheme_id: Optional[str] = None,
    financial_profile: Optional[dict] = None,
) -> dict:
    """
    Compare a BASE financial loan scenario against one or more WHAT-IF scenarios.
    Calculates differences in monthly EMI, total interest, and total repayment.
    """
    # 1. Scheme info lookup
    scheme_info = None
    if scheme_id:
        try:
            all_schemes = _load_schemes_from_json()
            for s in all_schemes:
                if s.get("scheme_id") == scheme_id or str(s.get("scheme_id")).lower() == str(scheme_id).lower():
                    scheme_info = {
                        "id": s.get("scheme_id"),
                        "name": s.get("scheme_name"),
                        "max_loan_amount": s.get("max_loan_amount"),
                    }
                    break
        except Exception as ex:
            logger.debug(f"What-If scheme lookup error: {ex}")

    if not scheme_info and scheme_id:
        scheme_info = {"id": scheme_id, "name": scheme_id, "max_loan_amount": None}

    # 2. Extract and calculate BASE scenario
    p_base = base.get("loan_amount") if base.get("loan_amount") is not None else base.get("principal", 500000)
    rate_base = base.get("annual_interest_rate", 8.5)
    tenure_base = base.get("tenure_months")
    if tenure_base is None:
        years_base = base.get("tenure_years", 5)
        tenure_base = int(years_base * 12)

    base_calc = calculate_emi(
        principal=p_base,
        annual_interest_rate=rate_base,
        tenure_months=tenure_base,
        scheme_id=scheme_id,
    )

    # Base Financial Readiness
    f_profile = financial_profile or {}
    base_readiness = compute_financial_readiness(
        monthly_emi=base_calc["monthly_emi"],
        monthly_income=f_profile.get("monthly_income"),
        monthly_expenses=f_profile.get("monthly_expenses"),
        existing_emi=f_profile.get("existing_emi"),
    )

    base_result = {
        "loan_amount": base_calc["principal"],
        "annual_interest_rate": base_calc["annual_interest_rate"],
        "tenure_months": base_calc["tenure_months"],
        "tenure_years": round(base_calc["tenure_months"] / 12.0, 1),
        "monthly_emi": base_calc["monthly_emi"],
        "total_interest": base_calc["total_interest"],
        "total_repayment": base_calc["total_repayment"],
        "principal_percentage": base_calc["principal_percentage"],
        "interest_percentage": base_calc["interest_percentage"],
        "is_valid": base_calc["is_valid"],
        "warning": base_calc.get("warning"),
        "message": base_calc.get("message"),
        "exceeds_scheme_limit": base_calc.get("exceeds_scheme_limit", False),
        "scheme_max_limit": base_calc.get("scheme_max_limit"),
        "readiness": base_readiness,
    }

    # 3. Process SCENARIOS
    sc_items = scenarios if scenarios is not None else ([scenario] if scenario is not None else [])
    scenario_results = []

    for sc in sc_items:
        p_sc = sc.get("loan_amount") if sc.get("loan_amount") is not None else sc.get("principal", p_base)
        rate_sc = sc.get("annual_interest_rate", rate_base)
        tenure_sc = sc.get("tenure_months")
        if tenure_sc is None:
            years_sc = sc.get("tenure_years", tenure_base / 12.0)
            tenure_sc = int(years_sc * 12)

        sc_calc = calculate_emi(
            principal=p_sc,
            annual_interest_rate=rate_sc,
            tenure_months=tenure_sc,
            scheme_id=scheme_id,
        )

        sc_readiness = compute_financial_readiness(
            monthly_emi=sc_calc["monthly_emi"],
            monthly_income=f_profile.get("monthly_income"),
            monthly_expenses=f_profile.get("monthly_expenses"),
            existing_emi=f_profile.get("existing_emi"),
        )

        scenario_results.append({
            "loan_amount": sc_calc["principal"],
            "annual_interest_rate": sc_calc["annual_interest_rate"],
            "tenure_months": sc_calc["tenure_months"],
            "tenure_years": round(sc_calc["tenure_months"] / 12.0, 1),
            "monthly_emi": sc_calc["monthly_emi"],
            "total_interest": sc_calc["total_interest"],
            "total_repayment": sc_calc["total_repayment"],
            "principal_percentage": sc_calc["principal_percentage"],
            "interest_percentage": sc_calc["interest_percentage"],
            "is_valid": sc_calc["is_valid"],
            "warning": sc_calc.get("warning"),
            "message": sc_calc.get("message"),
            "exceeds_scheme_limit": sc_calc.get("exceeds_scheme_limit", False),
            "scheme_max_limit": sc_calc.get("scheme_max_limit"),
            "readiness": sc_readiness,
        })

    # 4. Compute primary difference against first scenario (if exists)
    primary_scenario = scenario_results[0] if scenario_results else None
    diff_data = None

    if primary_scenario and base_result["is_valid"] and primary_scenario["is_valid"]:
        emi_diff = round(primary_scenario["monthly_emi"] - base_result["monthly_emi"], 2)
        interest_diff = round(primary_scenario["total_interest"] - base_result["total_interest"], 2)
        repayment_diff = round(primary_scenario["total_repayment"] - base_result["total_repayment"], 2)

        emi_pct = (
            round((emi_diff / base_result["monthly_emi"]) * 100.0, 1)
            if base_result["monthly_emi"] > 0
            else 0.0
        )
        int_pct = (
            round((interest_diff / base_result["total_interest"]) * 100.0, 1)
            if base_result["total_interest"] > 0
            else 0.0
        )

        # Build accessible narrative
        if emi_diff < 0:
            emi_str = f"Lowers monthly EMI by ₹{abs(int(emi_diff)):,} ({abs(emi_pct)}% reduction)"
        elif emi_diff > 0:
            emi_str = f"Increases monthly EMI by ₹{int(emi_diff):,} (+{emi_pct}%)"
        else:
            emi_str = "Monthly EMI remains unchanged"

        if interest_diff < 0:
            int_str = f"saves ₹{abs(int(interest_diff)):,} in total interest"
        elif interest_diff > 0:
            int_str = f"increases total interest paid by ₹{int(interest_diff):,}"
        else:
            int_str = "total interest paid is identical"

        narrative = f"{emi_str}, and {int_str} over the loan duration."

        diff_data = {
            "emi": emi_diff,
            "total_interest": interest_diff,
            "total_repayment": repayment_diff,
            "emi_percentage_change": emi_pct,
            "interest_percentage_change": int_pct,
            "narrative": narrative,
        }

    return {
        "success": True,
        "scheme": scheme_info,
        "base": base_result,
        "scenario": primary_scenario,
        "scenarios": scenario_results,
        "difference": diff_data,
        "disclaimer": "Illustrative EMI estimate. Final loan terms, interest rates, and sanction are determined by the authorized Channel Partner under MoSJE & MSME guidelines.",
    }



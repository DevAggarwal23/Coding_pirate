"""
Finance & Channel Partner Router.
Provides endpoints for EMI calculation, partner routing, and document readiness.
"""
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query
from pydantic import BaseModel, Field
from services.finance_service import (
    calculate_emi,
    simulate_what_if,
    compute_financial_readiness,
    assess_financial_readiness,
)
from services.partner_service import get_channel_partners
from services.document_service import check_document_readiness, get_scheme_required_documents
import logging

router = APIRouter(prefix="/api/finance", tags=["Finance & Advisory"])
logger = logging.getLogger(__name__)


# ── Schemas ───────────────────────────────────────────────────────────────────

class EMICalculateRequest(BaseModel):
    principal: float = Field(..., gt=0, description="Loan principal amount in INR")
    annual_interest_rate: float = Field(default=8.5, ge=0, le=100, description="Annual interest rate in % (e.g. 8.5 for 8.5%)")
    tenure_months: int = Field(default=60, gt=0, le=360, description="Loan repayment tenure in months")
    scheme_id: Optional[str] = Field(default=None, description="Optional target Scheme ID for maximum loan limit verification")


class EMICalculateResponse(BaseModel):
    principal: float
    annual_interest_rate: float
    tenure_months: int
    monthly_emi: float
    total_interest: float
    total_repayment: float
    principal_percentage: float = 100.0
    interest_percentage: float = 0.0
    is_valid: bool
    message: Optional[str] = None
    warning: Optional[str] = None
    scheme_id: Optional[str] = None
    scheme_max_limit: Optional[float] = None
    exceeds_scheme_limit: bool = False


# ── What-If Simulator Schemas ──────────────────────────────────────────────────

class ScenarioParam(BaseModel):
    loan_amount: Optional[float] = Field(default=None, description="Loan principal in INR")
    principal: Optional[float] = Field(default=None, description="Alias for loan_amount")
    annual_interest_rate: float = Field(default=8.5, ge=0, le=100, description="Annual interest rate in %")
    tenure_months: Optional[int] = Field(default=None, description="Loan tenure in months")
    tenure_years: Optional[float] = Field(default=None, description="Loan tenure in years")
    moratorium_months: Optional[int] = Field(default=0, description="Optional moratorium period in months")


class FinancialProfileInput(BaseModel):
    monthly_income: Optional[float] = Field(default=None, ge=0, description="Applicant monthly income")
    monthly_expenses: Optional[float] = Field(default=None, ge=0, description="Applicant monthly expenses")
    existing_emi: Optional[float] = Field(default=None, ge=0, description="Applicant existing ongoing EMI")


class WhatIfRequest(BaseModel):
    scheme_id: Optional[str] = Field(default=None, description="Target scheme ID")
    base: ScenarioParam = Field(..., description="Base reference loan scenario")
    scenario: Optional[ScenarioParam] = Field(default=None, description="What-if alternative scenario")
    scenarios: Optional[List[ScenarioParam]] = Field(default=None, description="Multiple alternative scenarios")
    financial_profile: Optional[FinancialProfileInput] = Field(default=None, description="Applicant financial profile")


class ScenarioReadiness(BaseModel):
    status: str
    emi_to_income_ratio: float
    monthly_income: float
    monthly_expenses: float = 0.0
    existing_emi: float = 0.0
    total_obligations: float
    disposable_income: float
    reason: str


class ScenarioResult(BaseModel):
    loan_amount: float
    annual_interest_rate: float
    tenure_months: int
    tenure_years: float
    monthly_emi: float
    total_interest: float
    total_repayment: float
    principal_percentage: float = 100.0
    interest_percentage: float = 0.0
    is_valid: bool
    warning: Optional[str] = None
    message: Optional[str] = None
    exceeds_scheme_limit: bool = False
    scheme_max_limit: Optional[float] = None
    readiness: Optional[ScenarioReadiness] = None


class ScenarioDifference(BaseModel):
    emi: float
    total_interest: float
    total_repayment: float
    emi_percentage_change: float
    interest_percentage_change: float
    narrative: str


class WhatIfResponse(BaseModel):
    success: bool = True
    scheme: Optional[Dict[str, Any]] = None
    base: ScenarioResult
    scenario: Optional[ScenarioResult] = None
    scenarios: Optional[List[ScenarioResult]] = None
    difference: Optional[ScenarioDifference] = None
    disclaimer: str = (
        "Illustrative EMI estimate. Final terms and loan sanction are determined by the "
        "authorized Channel Partner under MoSJE & MSME guidelines."
    )


class DocumentReadinessRequest(BaseModel):
    scheme_id: Optional[str] = None
    required_documents: Optional[list[str]] = None
    provided_documents: list[str] = Field(default_factory=list)


class DocumentReadinessResponse(BaseModel):
    scheme_id: Optional[str] = None
    required_documents: list[str]
    provided_documents: list[str]
    missing_documents: list[str]
    readiness_percentage: float
    is_ready_to_submit: bool


# ── Financial Readiness Assessment Schemas ─────────────────────────────────────

class FinancialReadinessRequest(BaseModel):
    monthly_income: Optional[float] = Field(default=None, description="Applicant monthly household/business income")
    monthly_household_expenses: Optional[float] = Field(default=None, description="Monthly living & household expenses")
    monthly_expenses: Optional[float] = Field(default=None, description="Alias for monthly_household_expenses")
    existing_emi: Optional[float] = Field(default=0.0, description="Ongoing monthly debt/loan payments")
    requested_loan_amount: Optional[float] = Field(default=None, description="Target loan principal in INR")
    principal: Optional[float] = Field(default=None, description="Alias for requested_loan_amount")
    annual_interest_rate: float = Field(default=8.5, ge=0, le=100, description="Annual interest rate in %")
    tenure_months: int = Field(default=60, gt=0, le=360, description="Loan repayment tenure in months")
    scheme_id: Optional[str] = Field(default=None, description="Optional target Scheme ID")


class FinancialReadinessMetrics(BaseModel):
    monthly_income: Optional[float] = None
    monthly_household_expenses: Optional[float] = None
    existing_emi: float = 0.0
    estimated_new_emi: float = 0.0
    total_monthly_debt: float = 0.0
    disposable_income_before_emi: Optional[float] = None
    disposable_income_after_emi: Optional[float] = None
    emi_burden_ratio: Optional[float] = None
    emi_burden_percentage: Optional[float] = None


class FinancialReadinessResponse(BaseModel):
    status: str
    status_label: str
    metrics: FinancialReadinessMetrics
    explanation: str
    recommendations: List[str] = Field(default_factory=list)
    disclaimer: str = (
        "This is an illustrative educational financial assessment, not a loan approval, "
        "credit score, or sanction decision. Final terms are determined by the authorized "
        "Channel Partner under MoSJE & MSME guidelines."
    )
    is_valid: bool = True


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/calculate-emi", response_model=EMICalculateResponse)
@router.post("/calculate", response_model=EMICalculateResponse)
async def calculate_loan_emi(request: EMICalculateRequest):
    """
    Calculate monthly EMI, interest, and total repayment breakdown.
    Supports concessional zero-interest government loan schemes and scheme loan limit checks.
    """
    result = calculate_emi(
        principal=request.principal,
        annual_interest_rate=request.annual_interest_rate,
        tenure_months=request.tenure_months,
        scheme_id=request.scheme_id,
    )
    return EMICalculateResponse(**result)


@router.get("/partners")
async def list_recommended_partners(
    scheme_id: Optional[str] = Query(None, description="Matched scheme ID (e.g. standup-india, nsfdc-loan)"),
    state: Optional[str] = Query(None, description="Applicant resident state (e.g. Uttar Pradesh)"),
    category: Optional[str] = Query(None, description="Applicant social category (e.g. SC, ST, OBC)"),
    district: Optional[str] = Query(None, description="Applicant district / city (e.g. Mathura, Lucknow)"),
):
    """
    Retrieve recommended nodal channel partners (Banks, DIC, State Corporations).
    Ranked by scheme compatibility, category priority, and geo-spatial proximity.
    Transparently marks demo / sample partner directories for evaluation.
    """
    partners = get_channel_partners(
        scheme_id=scheme_id or "",
        state=state,
        category=category,
        district=district,
    )
    return {
        "scheme_id": scheme_id,
        "state": state,
        "category": category,
        "district": district,
        "total_partners": len(partners),
        "disclaimer": "DEMO ROUTING DATA — FOR EVALUATION",
        "partners": partners,
    }


@router.post("/document-readiness", response_model=DocumentReadinessResponse)
async def evaluate_document_readiness(request: DocumentReadinessRequest):
    """
    Evaluate applicant document readiness against scheme mandatory checklist.
    Returns completion percentage and missing documents.
    """
    result = check_document_readiness(
        scheme_id=request.scheme_id,
        required_documents=request.required_documents,
        provided_documents=request.provided_documents,
    )
    return DocumentReadinessResponse(**result)


@router.get("/required-documents")
async def get_required_documents_for_scheme(
    scheme_id: Optional[str] = Query(None, description="Target scheme ID to look up mandatory documents"),
):
    """
    Retrieve official or standard required documents for a scheme.
    """
    docs = get_scheme_required_documents(scheme_id=scheme_id)
    return {
        "scheme_id": scheme_id,
        "required_documents": docs,
        "total_required": len(docs),
    }


@router.post("/what-if", response_model=WhatIfResponse)
@router.post("/simulate-what-if", response_model=WhatIfResponse)
async def simulate_what_if_scenarios(request: WhatIfRequest):
    """
    Simulate and compare loan scenarios (Base vs What-If).
    Calculates differences in monthly EMI, total interest, and repayment burden.
    Includes financial readiness analysis if applicant income/expenses are provided.
    """
    base_dict = request.base.model_dump()
    scenario_dict = request.scenario.model_dump() if request.scenario else None
    scenarios_list = [s.model_dump() for s in request.scenarios] if request.scenarios else None
    financial_dict = request.financial_profile.model_dump() if request.financial_profile else None

    result = simulate_what_if(
        base=base_dict,
        scenario=scenario_dict,
        scenarios=scenarios_list,
        scheme_id=request.scheme_id,
        financial_profile=financial_dict,
    )
    return WhatIfResponse(**result)


@router.post("/readiness", response_model=FinancialReadinessResponse)
@router.post("/financial-readiness", response_model=FinancialReadinessResponse)
async def evaluate_financial_readiness(request: FinancialReadinessRequest):
    """
    Assess whether a proposed loan repayment appears manageable based on applicant cashflows.
    Calculates disposable income before/after EMI, total monthly debt obligations, and burden ratio.
    Educational heuristic — NOT an official loan approval, credit score, or sanction decision.
    """
    result = assess_financial_readiness(
        monthly_income=request.monthly_income,
        monthly_household_expenses=request.monthly_household_expenses or request.monthly_expenses,
        existing_emi=request.existing_emi,
        requested_loan_amount=request.requested_loan_amount or request.principal,
        annual_interest_rate=request.annual_interest_rate,
        tenure_months=request.tenure_months,
        scheme_id=request.scheme_id,
    )
    return FinancialReadinessResponse(**result)




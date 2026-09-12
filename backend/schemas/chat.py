"""
SIH26092 — Advanced Context-Aware AI Chatbot Schemas.
Structured models for multi-turn chat, rich multi-domain context, and action suggestions.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ChatHistoryItem(BaseModel):
    role: str = Field(..., description="Role: 'user' or 'assistant'")
    content: str = Field(..., description="Message text content")


class ProfileContext(BaseModel):
    category: Optional[str] = Field(default=None, description="Applicant category: SC/ST/OBC/Women/PwD/General")
    income: Optional[float] = Field(default=None, description="Annual family income in INR")
    state: Optional[str] = Field(default=None, description="Applicant domicile state / UT")
    business_type: Optional[str] = Field(default=None, description="Enterprise activity or sector")
    project_cost: Optional[float] = Field(default=None, description="Estimated total project / enterprise cost")
    education: Optional[str] = Field(default=None, description="Educational attainment if provided")


class SchemeContext(BaseModel):
    scheme_id: Optional[str] = Field(default=None, description="Unique Scheme ID")
    scheme_name: Optional[str] = Field(default=None, description="Full scheme title")
    ministry: Optional[str] = Field(default=None, description="Nodal Government Ministry or Department")
    benefit: Optional[str] = Field(default=None, description="Financial benefit / subsidy summary")
    loan_limit: Optional[str] = Field(default=None, description="Maximum loan / credit ceiling")
    interest: Optional[str] = Field(default=None, description="Interest rate or subvention terms")
    tenure: Optional[str] = Field(default=None, description="Repayment tenure in years")
    eligibility_summary: Optional[str] = Field(default=None, description="Summary of eligibility criteria")
    is_synthetic: Optional[bool] = Field(default=False, description="Whether scheme record is synthetic/demo")


class FinanceContext(BaseModel):
    requested_loan: Optional[float] = Field(default=None, description="Proposed loan amount in INR")
    interest_rate: Optional[float] = Field(default=None, description="Annual interest rate %")
    tenure_years: Optional[int] = Field(default=None, description="Loan tenure in years")
    monthly_emi: Optional[float] = Field(default=None, description="Calculated monthly EMI in INR")
    total_interest: Optional[float] = Field(default=None, description="Total interest over tenure in INR")
    total_payment: Optional[float] = Field(default=None, description="Total repayment amount in INR")
    financial_readiness_score: Optional[float] = Field(default=None, description="Financial readiness score out of 100")
    debt_burden_ratio: Optional[float] = Field(default=None, description="Calculated Debt Burden Ratio")
    is_financially_ready: Optional[bool] = Field(default=None, description="Whether financial readiness meets benchmark")


class DocumentContext(BaseModel):
    required_documents: Optional[List[str]] = Field(default=None, description="Mandatory document titles")
    uploaded_documents: Optional[List[str]] = Field(default=None, description="Uploaded and validated document titles")
    missing_documents: Optional[List[str]] = Field(default=None, description="Missing mandatory document titles")
    completed_required_documents: Optional[int] = Field(default=None, description="Count of verified required documents")
    total_required_documents: Optional[int] = Field(default=None, description="Total required documents count")
    completion_percentage: Optional[float] = Field(default=None, description="Document readiness score %")
    is_ready_to_submit: Optional[bool] = Field(default=None, description="Whether mandatory document checklist is satisfied")


class PartnerContext(BaseModel):
    partner_id: Optional[str] = Field(default=None, description="Selected channel partner ID")
    partner_name: Optional[str] = Field(default=None, description="Channel partner institution / branch name")
    partner_type: Optional[str] = Field(default=None, description="Partner category: PSU Bank / RRB / NBFC / Nodal Center")
    address: Optional[str] = Field(default=None, description="Branch address / location")
    distance_km: Optional[float] = Field(default=None, description="Distance from beneficiary in km")


class ApplicationContext(BaseModel):
    application_id: Optional[str] = Field(default=None, description="Formatted tracking ID (APP-2026-XXXXX)")
    status: Optional[str] = Field(default=None, description="Current state machine status")
    status_label: Optional[str] = Field(default=None, description="Human-readable status label")
    submitted_at: Optional[str] = Field(default=None, description="Submission timestamp")
    partner_name: Optional[str] = Field(default=None, description="Assigned Nodal Channel Partner")
    next_step: Optional[str] = Field(default=None, description="Recommended actionable next step")


class ChatContext(BaseModel):
    profile: Optional[ProfileContext] = None
    selected_scheme: Optional[SchemeContext] = None
    finance: Optional[FinanceContext] = None
    documents: Optional[DocumentContext] = None
    partner: Optional[PartnerContext] = None
    application: Optional[ApplicationContext] = None


class SuggestedAction(BaseModel):
    action_type: str = Field(..., description="Action identifier: find_schemes | view_scheme | calculate_emi | upload_documents | view_documents | find_partner | view_application | contact_support")
    label: str = Field(..., description="User-facing button text")
    description: Optional[str] = Field(default=None, description="Contextual hint for the action")
    payload: Optional[Dict[str, Any]] = Field(default=None, description="Parameters for frontend navigation")


class MatchedSchemeBrief(BaseModel):
    scheme_id: str
    scheme_name: str
    ministry: Optional[str] = None
    benefit: Optional[str] = None
    confidence: Optional[float] = None
    categories: Optional[List[str]] = None
    application_url: Optional[str] = None


class ChatRequest(BaseModel):
    message: str = Field(..., description="Beneficiary user query or message text")
    language: str = Field(default="en", description="Selected language code: hi/en/bn/ta/mr/te")
    context: Optional[ChatContext] = Field(default=None, description="Multi-domain session and journey context")
    history: Optional[List[ChatHistoryItem]] = Field(default=None, description="Recent multi-turn conversation history")
    session_id: Optional[str] = Field(default=None, description="Client conversation session identifier")


class ChatResponse(BaseModel):
    reply: str = Field(..., description="Context-aware AI assistant answer")
    suggested_actions: List[SuggestedAction] = Field(default_factory=list, description="Contextual next action recommendations")
    matched_schemes: List[MatchedSchemeBrief] = Field(default_factory=list, description="Referenced or matched schemes")
    language: str = Field(default="en", description="Response language code")
    session_id: str = Field(..., description="Conversation session identifier")
    provider: str = Field(default="groq_ai", description="Engine provider: groq_ai | context_synthesizer")
    model_used: Optional[str] = Field(default=None, description="LLM model name if cloud API used")
    processing_time_ms: int = Field(default=0, description="Roundtrip processing time in milliseconds")
    source_attribution: Optional[str] = Field(default=None, description="Data source or provenance attribution")

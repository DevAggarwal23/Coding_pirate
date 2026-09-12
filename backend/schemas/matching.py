"""Scheme matching request and response schemas."""
from typing import Optional
from pydantic import BaseModel, Field


class MatchRequest(BaseModel):
    category: Optional[str] = Field(None, description="Social/caste category (e.g. SC, ST, OBC, Women, General)")
    income: Optional[int] = Field(None, description="Annual income in INR")
    state: Optional[str] = Field(None, description="State of residence")
    business_type: Optional[str] = Field(None, description="Type of business/enterprise")
    project_cost: Optional[int] = Field(None, description="Estimated project cost in INR")
    intent: Optional[str] = Field(None, description="User intent: financial_assistance, business_loan, skill_training, etc.")


class MatchedScheme(BaseModel):
    scheme_id: str = Field(..., description="Unique scheme identifier")
    scheme_name: str = Field(..., description="Official name of scheme")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Match confidence score")
    benefit: Optional[str] = Field(None, description="Summary of scheme benefit/subsidy/loan amount")
    documents_required: list[str] = Field(default_factory=list, description="List of required documents")
    application_link: Optional[str] = Field(None, description="Portal URL to apply")
    why_matched: Optional[str] = Field(None, description="Explainable reasoning for match")


class BorderlineScheme(BaseModel):
    scheme_id: str = Field(..., description="Unique scheme identifier")
    scheme_name: str = Field(..., description="Official name of scheme")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Borderline confidence score")
    reason: Optional[str] = Field(None, description="Reason why match is borderline/requires verification")


class NotEligibleScheme(BaseModel):
    scheme_id: str = Field(..., description="Unique scheme identifier")
    scheme_name: str = Field(..., description="Official name of scheme")
    reason: Optional[str] = Field(None, description="Disqualification rule/reason")


class MatchResponse(BaseModel):
    auto_matched: list[MatchedScheme] = Field(default_factory=list, description="Schemes with high confidence match")
    borderline: list[BorderlineScheme] = Field(default_factory=list, description="Borderline matching schemes")
    not_eligible: list[NotEligibleScheme] = Field(default_factory=list, description="Schemes user does not qualify for")
    total_schemes_checked: int = Field(default=0, description="Total schemes evaluated")
    processing_time_ms: int = Field(default=0, description="Processing duration in milliseconds")

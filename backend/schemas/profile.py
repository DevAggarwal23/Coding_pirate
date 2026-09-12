"""User profile extraction schemas."""
from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class ProfileExtractRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Raw input text or voice transcript")
    session_id: Optional[str] = Field(None, description="Client session or voice session tracking ID")
    user_id: Optional[str] = Field(None, description="Authenticated user profile ID if available")
    input_type: Optional[str] = Field(default="text", description="Input modality: text | voice_transcript | ivr")
    language: Optional[str] = Field(default="hi", description="Input language code: hi | en | mr | ta | etc.")


class ExtractedProfile(BaseModel):
    category: Optional[str] = Field(None, description="Social/caste category (e.g., SC, ST, OBC, Women, General)")
    income: Optional[int] = Field(None, description="Annual income in INR")
    state: Optional[str] = Field(None, description="Resident state/UT")
    business_type: Optional[str] = Field(None, description="Type of business or occupation")
    project_cost: Optional[int] = Field(None, description="Estimated project cost in INR")
    intent: Optional[str] = Field(None, description="User intent: financial_assistance, business_loan, skill_training, etc.")


class ProfileExtractResponse(BaseModel):
    extracted: Any = Field(..., description="Extracted profile dictionary or object")
    confidence: float = Field(default=0.0, ge=0.0, le=1.0, description="Extraction completeness/confidence")
    missing_fields: list[str] = Field(default_factory=list, description="List of profile fields still missing")
    follow_up_question: Optional[str] = Field(None, description="Suggested follow-up question for conversational flow")
    extraction_id: Optional[str] = Field(None, description="Persisted extraction audit ID")


class NLPExtractionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    input_type: str
    raw_text: str
    language: str
    intent: Optional[str] = None
    extracted_entities: dict = Field(default_factory=dict)
    confidence: float
    missing_fields: list[str] = Field(default_factory=list)
    extraction_status: str
    created_at: Optional[datetime] = None


class NLPExtractionsListResponse(BaseModel):
    extractions: list[NLPExtractionResponse] = Field(default_factory=list)
    total: int = 0

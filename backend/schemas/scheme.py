"""Scheme entity and administration schemas."""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class SchemeBase(BaseModel):
    scheme_id: str = Field(..., description="Unique scheme identifier")
    scheme_name: str = Field(..., description="Name of the government scheme")
    ministry: Optional[str] = Field(None, description="Sponsoring ministry or nodal agency")
    categories: list[str] = Field(default_factory=list, description="Target eligible beneficiary categories")
    max_income: Optional[int] = Field(None, description="Upper annual income ceiling in INR")
    eligible_states: Optional[list[str]] = Field(None, description="List of eligible states/UTs, or None if Pan-India")
    business_types: Optional[list[str]] = Field(None, description="List of eligible business sectors")
    benefit_amount: Optional[str] = Field(None, description="Summary of benefit/loan/subsidy amount")
    documents_required: list[str] = Field(default_factory=list, description="Mandatory documents for application")
    application_url: Optional[str] = Field(None, description="Official portal URL")
    eligibility_text: Optional[str] = Field(None, description="Full natural language eligibility description")
    is_active: bool = Field(default=True, description="Whether scheme is currently open")


class SchemeCreate(SchemeBase):
    pass


class SchemeResponse(SchemeBase):
    model_config = ConfigDict(from_attributes=True)
    last_verified: Optional[datetime] = None

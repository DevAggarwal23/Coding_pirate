"""
Pydantic Schemas for Scheme Sources & Provenance.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from models.scheme_source import SourceType, VerificationStatus


class SchemeSourceBase(BaseModel):
    source_url: Optional[str] = Field(None, description="Official portal or verified source URL")
    source_name: Optional[str] = Field(None, description="Name of the source authority/portal")
    source_organization: Optional[str] = Field(None, description="Nodal Ministry, Department or Organization")
    source_type: str = Field(default=SourceType.OFFICIAL_GOVERNMENT.value, description="OFFICIAL_GOVERNMENT | AUTHORIZED_PARTNER | VERIFIED_REFERENCE | DEMO_SYNTHETIC")
    verification_status: str = Field(default=VerificationStatus.VERIFIED.value, description="VERIFIED | PENDING | EXPIRED | DEMO")
    data_version: Optional[str] = Field(default="1.0", description="Data version string")
    is_primary: bool = Field(default=True, description="Whether this is the primary canonical source")
    notes: Optional[str] = Field(None, description="Auditor/verification notes")


class SchemeSourceCreate(SchemeSourceBase):
    scheme_id: str = Field(..., description="Target scheme ID")
    verified_at: Optional[datetime] = None
    last_checked_at: Optional[datetime] = None


class SchemeSourceUpdate(BaseModel):
    source_url: Optional[str] = None
    source_name: Optional[str] = None
    source_organization: Optional[str] = None
    source_type: Optional[str] = None
    verification_status: Optional[str] = None
    verified_at: Optional[datetime] = None
    last_checked_at: Optional[datetime] = None
    data_version: Optional[str] = None
    is_primary: Optional[bool] = None
    notes: Optional[str] = None


class SchemeSourceResponse(SchemeSourceBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    scheme_id: str
    verified_at: Optional[datetime] = None
    last_checked_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class SchemeSourcesListResponse(BaseModel):
    scheme_id: str
    primary_source: Optional[SchemeSourceResponse] = None
    sources: list[SchemeSourceResponse] = Field(default_factory=list)
    total_sources: int = 0

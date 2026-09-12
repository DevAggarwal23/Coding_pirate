"""
SIH26092 — Admin Dashboard Pydantic Schemas.
Models for admin authentication, operational metrics, scheme/source management,
document requirement rules, partner directory, privileged application transitions,
and audit logs.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    email: Optional[str] = Field(default=None, description="Admin email")
    username: Optional[str] = Field(default=None, description="Admin username")
    password: str = Field(..., description="Admin login password")


class AdminUserInfo(BaseModel):
    email: str = "admin@schemesaathi.gov.in"
    username: str = "admin@schemesaathi.gov.in"
    role: str = "super_admin"
    name: str = "System Administrator"
    is_authenticated: bool = True

    def __getitem__(self, item):
        return getattr(self, item)

    def get(self, item, default=None):
        return getattr(self, item, default)


class AdminLoginResponse(BaseModel):
    token: str
    access_token: str
    token_type: str = "bearer"
    email: str
    username: str
    role: str = "super_admin"
    name: str = "System Administrator"
    expires_in_hours: int = 24


class AdminProfileResponse(BaseModel):
    email: str
    username: str
    role: str
    name: str
    is_authenticated: bool = True


class AdminMetricsResponse(BaseModel):
    total_schemes: int
    active_schemes: int
    total_partners: int
    total_channel_partners: int
    total_applications: int
    pending_applications: int
    under_review_applications: int
    approved_applications: int
    rejected_applications: int
    disbursed_applications: int
    avg_document_readiness: float
    applications_by_status: Dict[str, int]
    status_distribution: Dict[str, int]
    category_distribution: Dict[str, int]
    state_distribution: Dict[str, int]
    recent_applications: List[Dict[str, Any]]
    recent_audit_logs: List[Dict[str, Any]]
    system_health: str = "HEALTHY"


class AdminSchemeItem(BaseModel):
    scheme_id: str
    scheme_name: str
    ministry: str
    categories: List[str]
    benefit_amount: str
    max_income: Optional[int] = None
    eligible_states: Optional[List[str]] = None
    is_active: bool = True
    verification_status: str = "VERIFIED"
    sources_count: int = 1
    requirements_count: int = 0
    application_url: Optional[str] = None


class AdminSchemeListResponse(BaseModel):
    schemes: List[AdminSchemeItem]
    total: int
    total_count: int
    page: int = 1
    page_size: int = 50


class AdminSchemeUpdateRequest(BaseModel):
    scheme_name: Optional[str] = None
    ministry: Optional[str] = None
    benefit_amount: Optional[str] = None
    max_income: Optional[int] = None
    is_active: Optional[bool] = None
    eligibility_text: Optional[str] = None
    categories: Optional[List[str]] = None
    eligible_states: Optional[List[str]] = None
    application_url: Optional[str] = None


class AdminDocRequirementItem(BaseModel):
    doc_type: str
    title: str
    mandatory: bool = True
    description: Optional[str] = None
    valid_formats: List[str] = ["jpg", "png", "pdf"]
    ocr_validation_fields: List[str] = []
    max_size_mb: int = 10


class AdminDocRequirementUpdate(BaseModel):
    requirements: List[AdminDocRequirementItem]


class AdminPartnerItem(BaseModel):
    partner_id: str
    name: str
    partner_type: str
    state: str
    district: str
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    is_active: bool = True
    active_applications_count: int = 0


class AdminPartnerListResponse(BaseModel):
    partners: List[AdminPartnerItem]
    total: int
    total_count: int


class AdminApplicationItem(BaseModel):
    application_id: str
    scheme_id: str
    scheme_name: str
    applicant_name: str
    phone_masked: str
    state: str
    category: str
    partner_id: Optional[str] = None
    partner_name: Optional[str] = None
    status: str
    status_label: str
    document_readiness_score: float = 100.0
    documents_count: int = 0
    created_at: str
    submitted_at: Optional[str] = None
    sanctioned_amount: Optional[float] = None


class AdminApplicationListResponse(BaseModel):
    applications: List[AdminApplicationItem]
    total: int
    total_count: int


class AdminApplicationDetailResponse(BaseModel):
    application_id: str
    scheme_id: str
    scheme_name: str
    ministry: Optional[str] = None
    applicant_name: str
    phone_masked: str
    state: str
    district: Optional[str] = None
    category: str
    business_type: Optional[str] = None
    requested_amount: Optional[float] = None
    sanctioned_amount: Optional[float] = None
    partner_id: Optional[str] = None
    partner_name: Optional[str] = None
    status: str
    status_label: str
    document_readiness_score: float = 100.0
    documents: List[Dict[str, Any]] = []
    timeline: List[Dict[str, Any]] = []
    created_at: str
    submitted_at: Optional[str] = None
    last_updated: Optional[str] = None


class AdminStatusTransitionRequest(BaseModel):
    to_status: Optional[str] = None
    new_status: Optional[str] = None
    remarks: Optional[str] = None
    note: Optional[str] = None
    sanctioned_amount: Optional[float] = None
    rejection_reason: Optional[str] = None


class AdminStatusTransitionResponse(BaseModel):
    success: bool
    application_id: str
    previous_status: str
    current_status: str
    status_label: str
    message: str
    sanctioned_amount: Optional[float] = None
    updated_at: str


class AuditLogItem(BaseModel):
    id: str
    actor_email: str
    actor_role: str
    action: str
    entity_type: str
    entity_id: str
    details: Optional[Dict[str, Any]] = None
    result: str = "SUCCESS"
    timestamp: str


class AdminAuditLogsResponse(BaseModel):
    logs: List[AuditLogItem]
    total: int
    total_count: int

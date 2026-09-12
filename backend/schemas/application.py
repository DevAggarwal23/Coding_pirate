from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

STATUS_LABELS = {
    'draft': 'Draft Application',
    'documents_pending': 'Documents Pending',
    'ready_for_submission': 'Ready for Submission',
    'submitted': 'Submitted to Nodal Partner',
    'under_review': 'Under Review by Partner',
    'action_required': 'Action Required',
    'approved': 'Approved by Nodal Authority',
    'rejected': 'Rejected',
    'disbursed': 'Funds Disbursed',
}

STATUS_MESSAGES = {
    'draft': 'Your application has been created as a draft.',
    'documents_pending': 'Some required documents are still missing.',
    'ready_for_submission': 'All required documents are ready. You can submit your application.',
    'submitted': 'Your application has been submitted to the selected Channel Partner.',
    'under_review': 'Your application is currently under review by the nodal partner.',
    'action_required': 'Additional information or documents are required.',
    'approved': 'Your application has been approved by the authorized nodal partner.',
    'rejected': 'Application was not approved this cycle. Contact the helpdesk.',
    'disbursed': 'Loan / grant disbursement has been recorded.',
}

class StatusHistoryItem(BaseModel):
    id: Optional[str] = None
    application_id: str
    old_status: Optional[str] = None
    new_status: str
    status_label: str
    changed_by: str = 'applicant'
    note: Optional[str] = None
    created_at: str

class ApplicationCreateRequest(BaseModel):
    scheme_id: str
    scheme_name: Optional[str] = None
    partner_id: Optional[str] = None
    partner_name: Optional[str] = None
    user_id: Optional[str] = None
    category: Optional[str] = None
    income: Optional[int] = None
    state: Optional[str] = None
    business_type: Optional[str] = None
    project_cost: Optional[int] = None
    phone_hash: Optional[str] = None
    notes: Optional[str] = None

class ApplicationSubmitRequest(BaseModel):
    scheme_id: Optional[str] = None
    scheme_name: Optional[str] = None
    user_id: Optional[str] = None
    category: Optional[str] = None
    income: Optional[int] = None
    state: Optional[str] = None
    business_type: Optional[str] = None
    phone_hash: Optional[str] = None
    partner_id: Optional[str] = None
    partner_name: Optional[str] = None
    notes: Optional[str] = None

class ApplicationStatusTransitionRequest(BaseModel):
    new_status: str
    changed_by: Optional[str] = 'applicant'
    note: Optional[str] = None

class ApplicationStatusResponse(BaseModel):
    application_id: str
    user_id: Optional[str] = None
    scheme_id: Optional[str] = None
    scheme_name: Optional[str] = None
    partner_id: Optional[str] = None
    partner_name: Optional[str] = None
    status: str
    status_label: str
    message: str
    next_step: str
    created_at: Optional[str] = None
    submitted_at: Optional[str] = None
    last_updated: str
    estimated_processing: str = '15-30 working days'
    timeline: List[StatusHistoryItem] = Field(default_factory=list)

class ApplicationDetailResponse(BaseModel):
    application_id: str
    user_id: Optional[str] = None
    scheme_id: str
    scheme_name: Optional[str] = None
    partner_id: Optional[str] = None
    partner_name: Optional[str] = None
    status: str
    status_label: str
    notes: Optional[str] = None
    created_at: str
    submitted_at: Optional[str] = None
    last_updated: str
    document_readiness: Optional[Dict[str, Any]] = None
    timeline: List[StatusHistoryItem] = Field(default_factory=list)

class ApplicationHistoryResponse(BaseModel):
    application_id: str
    current_status: str
    status_label: str
    history: List[StatusHistoryItem]

class ApplicationListResponse(BaseModel):
    applications: List[ApplicationDetailResponse]
    total_count: int

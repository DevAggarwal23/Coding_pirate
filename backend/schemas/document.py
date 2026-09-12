"""
Pydantic Schemas for Document Management & Application Readiness.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class DocumentRequirementItem(BaseModel):
    id: Optional[str] = Field(default=None, description="Identifier for requirement (e.g. req-aadhaar)")
    requirement_id: str = Field(..., description="Unique identifier for the requirement")
    scheme_id: Optional[str] = Field(default=None, description="Associated Scheme ID")
    document_name: str = Field(..., description="Official title of the required document")
    document_type: str = Field(..., description="Normalized document type (e.g. identity_proof, caste_certificate)")
    description: Optional[str] = Field(default=None, description="Detailed guidance on accepted issuing authorities")
    why_required: str = Field(
        default="Required for application verification. Exact purpose should be confirmed with the authorized Channel Partner.",
        description="Clear, non-fabricated justification of why this document is required"
    )
    mandatory: bool = Field(default=True, description="True if document is mandatory for application submission")
    required: bool = Field(default=True, description="Backward compatible alias for mandatory")
    accepted_formats: List[str] = Field(default_factory=lambda: ["pdf", "jpg", "jpeg", "png", "webp"])
    max_file_size_mb: int = Field(default=20, description="Max allowed file size in MB")
    source: Any = Field(default="official_guidelines", description="Provenance source of document requirement")
    verification_status: str = Field(default="VERIFIED", description="Verification status of the requirement (VERIFIED | DEMO)")
    last_verified_at: str = Field(default="2026-03-01", description="Last date requirement was verified")


class DocumentCompletionSummary(BaseModel):
    required: int = 0
    uploaded: int = 0
    remaining: int = 0
    ready: bool = False


class SchemeChecklistResponse(BaseModel):
    scheme_id: Optional[str] = None
    scheme_name: Optional[str] = None
    total_documents: int
    total_documents_count: Optional[int] = None
    required_count: int
    optional_count: int
    checklist: List[DocumentRequirementItem]
    documents: List[DocumentRequirementItem] = Field(default_factory=list)
    required_documents: List[DocumentRequirementItem]
    optional_documents: List[DocumentRequirementItem]
    completion: DocumentCompletionSummary = Field(default_factory=DocumentCompletionSummary)
    data_mode: Optional[str] = "demo"
    provenance_notice: Optional[str] = None
    data_provenance: Dict[str, Any] = Field(default_factory=lambda: {
        "mode": "demo",
        "source": "scheme_dataset",
        "notice": "Demo document requirements for SIH evaluation. Official requirements subject to nodal partner verification."
    })


class DocumentUploadResponse(BaseModel):
    document_id: str
    id: Optional[str] = None
    application_id: Optional[str] = None
    requirement_id: str
    scheme_id: Optional[str] = None
    document_name: str
    document_type: str
    original_filename: str
    file_format: str
    file_size_bytes: int
    file_size: Optional[int] = None
    file_size_formatted: str
    status: str
    is_valid: bool
    validation_message: str
    validation_method: str = "format_check"
    uploaded_at: str
    download_url: Optional[str] = None


class ApplicationReadinessMetrics(BaseModel):
    scheme_id: Optional[str] = None
    status: str = Field(..., description="'ready' | 'incomplete' | 'validation_pending' | 'requirements_unavailable'")
    completion_percentage: float = Field(..., ge=0.0, le=100.0)
    readiness_percentage: Optional[float] = None
    required_documents: int
    completed_required_documents: int
    missing_required_documents: Any = 0
    missing_document_names: List[str] = Field(default_factory=list)
    missing_optional_documents: List[str] = Field(default_factory=list)
    invalid_required_documents: int = 0
    validation_pending: int = 0
    optional_documents: int = 0
    completed_optional_documents: int = 0
    is_ready_to_submit: bool
    next_action: str
    data_mode: Optional[str] = "demo"
    provenance_notice: Optional[str] = None


class DocumentReadinessEvaluationRequest(BaseModel):
    scheme_id: Optional[str] = None
    application_id: Optional[str] = None
    required_documents: Optional[List[str]] = None
    provided_documents: List[str] = Field(default_factory=list)
    uploaded_requirements: Optional[List[str]] = None


class ApplicationDocumentItemResponse(BaseModel):
    id: str
    document_id: Optional[str] = None
    application_id: Optional[str] = None
    requirement_id: str
    scheme_id: Optional[str] = None
    document_name: str
    document_type: str
    original_filename: str
    content_type: str
    file_size: int
    file_size_formatted: Optional[str] = None
    status: str
    validation_message: Optional[str] = None
    validation_method: str = "format_check"
    uploaded_at: str
    download_url: Optional[str] = None


class ApplicationDocumentsListResponse(BaseModel):
    application_id: str
    scheme_id: Optional[str] = None
    documents: List[ApplicationDocumentItemResponse] = Field(default_factory=list)
    readiness: ApplicationReadinessMetrics


class DocumentStatusResponse(BaseModel):
    application_id: Optional[str] = None
    scheme_id: Optional[str] = None
    documents: List[Dict[str, Any]] = Field(default_factory=list)
    readiness: ApplicationReadinessMetrics


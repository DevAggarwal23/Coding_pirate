import os
import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File, Form, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.dependencies import get_db, get_optional_user
from schemas.auth import UserResponse
from schemas.application import (
    ApplicationCreateRequest,
    ApplicationSubmitRequest,
    ApplicationStatusTransitionRequest,
    ApplicationStatusResponse,
    ApplicationDetailResponse,
    ApplicationHistoryResponse,
    ApplicationListResponse,
)
from schemas.document import (
    DocumentUploadResponse,
    ApplicationReadinessMetrics,
    ApplicationDocumentsListResponse,
    ApplicationDocumentItemResponse,
)
from services import application_service
from services.document_service import (
    save_uploaded_document,
    calculate_application_readiness,
    delete_uploaded_document,
    _IN_MEMORY_DOCUMENTS,
)

router = APIRouter(prefix="/api/applications", tags=["Applications"])
logger = logging.getLogger(__name__)


@router.post("", response_model=ApplicationDetailResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ApplicationDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_application_endpoint(
    request: ApplicationCreateRequest,
    current_user: Optional[UserResponse] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Creates a new draft application and records initial status history.
    Associates the application with the authenticated user if logged in.
    """
    if current_user and not request.user_id:
        request.user_id = current_user.id

    try:
        return await application_service.create_application(request, db=db)
    except Exception as e:
        logger.error(f"Failed to create application: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create application: {str(e)}",
        )


@router.post("/submit", response_model=ApplicationStatusResponse)
async def submit_application_legacy(
    request: ApplicationSubmitRequest,
    current_user: Optional[UserResponse] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Submits an application (creates or transitions to 'submitted' state).
    Provides backwards compatibility for earlier frontend and test suites.
    """
    if current_user and not request.user_id:
        request.user_id = current_user.id

    try:
        return await application_service.submit_application(request=request, db=db)
    except Exception as e:
        logger.error(f"Failed to submit application: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit application: {str(e)}",
        )


@router.post("/{application_id}/submit", response_model=ApplicationStatusResponse)
async def submit_application_by_id(
    application_id: str,
    request: Optional[ApplicationSubmitRequest] = None,
    current_user: Optional[UserResponse] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Submits a specific application to the selected Channel Partner.
    Transitions status to 'submitted', records timestamp and creates history record.
    """
    if current_user and request and not request.user_id:
        request.user_id = current_user.id

    try:
        return await application_service.submit_application(
            application_id=application_id, request=request, db=db
        )
    except Exception as e:
        logger.error(f"Failed to submit application {application_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit application {application_id}: {str(e)}",
        )


@router.post("/{application_id}/transition", response_model=ApplicationStatusResponse)
async def transition_status_endpoint(
    application_id: str,
    request: ApplicationStatusTransitionRequest,
    current_user: Optional[UserResponse] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Transitions application status with validation and permission checks.
    Applicants cannot transition to 'approved', 'rejected', or 'disbursed' (HTTP 403).
    """
    if current_user and current_user.role == "applicant":
        request.changed_by = "applicant"

    try:
        # Check ownership if applicant
        if current_user and current_user.role == "applicant":
            detail = await application_service.get_application_detail(application_id, db=db)
            if detail.user_id and str(detail.user_id) != str(current_user.id):
                raise PermissionError("Access denied: You cannot modify an application belonging to another user.")

        return await application_service.transition_application_status(
            application_id=application_id, request=request, db=db
        )
    except PermissionError as pe:
        logger.warning(f"Permission denied transitioning {application_id}: {pe}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(pe),
        )
    except ValueError as ve:
        logger.warning(f"Invalid transition request for {application_id}: {ve}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application {application_id} not found.",
        )
    except Exception as e:
        logger.error(f"Error transitioning status for {application_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/{application_id}/history", response_model=ApplicationHistoryResponse)
async def get_application_history_endpoint(
    application_id: str,
    current_user: Optional[UserResponse] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves chronological status history and timeline for an application.
    """
    try:
        if current_user and current_user.role == "applicant":
            detail = await application_service.get_application_detail(application_id, db=db)
            if detail.user_id and str(detail.user_id) != str(current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: You cannot view status history of another user's application.",
                )

        return await application_service.get_application_history(application_id, db=db)
    except HTTPException:
        raise
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application {application_id} not found.",
        )
    except Exception as e:
        logger.error(f"Error retrieving history for {application_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/{application_id}/status", response_model=ApplicationStatusResponse)
async def get_application_status_endpoint(
    application_id: str,
    current_user: Optional[UserResponse] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Track status of an application. Returns status, timeline, and next step.
    """
    try:
        if current_user and current_user.role == "applicant":
            detail = await application_service.get_application_detail(application_id, db=db)
            if detail.user_id and str(detail.user_id) != str(current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: You cannot view status of another user's application.",
                )

        return await application_service.get_application_status_response(application_id, db=db)
    except HTTPException:
        raise
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application {application_id} not found.",
        )
    except Exception as e:
        logger.error(f"Error retrieving status for {application_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/{application_id}", response_model=ApplicationDetailResponse)
async def get_application_detail_endpoint(
    application_id: str,
    current_user: Optional[UserResponse] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves full details of an application including document readiness and timeline.
    Enforces ownership isolation: Applicant cannot inspect another applicant's application.
    """
    try:
        detail = await application_service.get_application_detail(application_id, db=db)
        if current_user and current_user.role == "applicant":
            if detail.user_id and str(detail.user_id) != str(current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: You do not have permission to view this application.",
                )
        return detail
    except HTTPException:
        raise
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application {application_id} not found.",
        )
    except Exception as e:
        logger.error(f"Error retrieving application {application_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("", response_model=ApplicationListResponse)
@router.get("/", response_model=ApplicationListResponse)
async def list_applications_endpoint(
    current_user: Optional[UserResponse] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Lists applications. If authenticated as an applicant, lists only their own applications.
    If administrator, lists all applications.
    """
    try:
        user_id_filter = current_user.id if (current_user and current_user.role == "applicant") else None
        return await application_service.list_user_applications(user_id=user_id_filter, db=db)
    except Exception as e:
        logger.error(f"Error listing applications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/{application_id}/documents", response_model=DocumentUploadResponse)
async def upload_application_document(
    application_id: str = Path(..., description="Target Application ID"),
    file: Optional[UploadFile] = File(None, description="Document file payload"),
    document: Optional[UploadFile] = File(None, description="Alternative document file payload"),
    requirement_id: Optional[str] = Form(default=None, description="Requirement ID (e.g. req-aadhaar)"),
    document_name: Optional[str] = Form(default=None, description="Name of the document"),
    document_type: Optional[str] = Form(default="general_document", description="Document type category"),
    scheme_id: Optional[str] = Form(default=None, description="Optional associated Scheme ID"),
    current_user: Optional[UserResponse] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a required or supporting document directly attached to an application.
    """
    if current_user and current_user.role == "applicant":
        try:
            detail = await application_service.get_application_detail(application_id, db=db)
            if detail.user_id and str(detail.user_id) != str(current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: You cannot upload documents to another user's application.",
                )
        except KeyError:
            pass

    target_file = file or document
    if not target_file:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided in request.")

    clean_filename = target_file.filename or "document.pdf"
    ext = os.path.splitext(clean_filename)[1].lower()

    if ext not in {".pdf", ".jpg", ".jpeg", ".png", ".webp", ".bmp"}:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file format '{ext}'. Accepted formats: PDF, JPEG, PNG, WEBP."
        )

    try:
        file_bytes = await target_file.read()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Could not read uploaded file: {str(e)}")

    if len(file_bytes) < 100:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty or corrupted (<100 bytes).")

    if len(file_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File too large. Maximum allowed size is 20MB.")

    try:
        doc_record = save_uploaded_document(
            file_bytes=file_bytes,
            filename=clean_filename,
            requirement_id=requirement_id,
            document_name=document_name,
            document_type=document_type,
            application_id=application_id,
            scheme_id=scheme_id,
        )
        return DocumentUploadResponse(**doc_record)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as ex:
        logger.error(f"Application document upload processing failed: {ex}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to process document upload: {str(ex)}")


@router.get("/{application_id}/documents", response_model=ApplicationDocumentsListResponse)
async def get_application_documents_endpoint(
    application_id: str = Path(..., description="Target Application ID"),
    scheme_id: Optional[str] = Query(None, description="Optional associated Scheme ID"),
    current_user: Optional[UserResponse] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve all uploaded documents and computed readiness for a given application.
    """
    if current_user and current_user.role == "applicant":
        try:
            detail = await application_service.get_application_detail(application_id, db=db)
            if detail.user_id and str(detail.user_id) != str(current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: You cannot view documents attached to another user's application.",
                )
        except KeyError:
            pass

    docs = [
        ApplicationDocumentItemResponse(
            id=d["id"],
            document_id=d.get("document_id"),
            application_id=d.get("application_id"),
            requirement_id=d.get("requirement_id", ""),
            scheme_id=d.get("scheme_id"),
            document_name=d.get("document_name", ""),
            document_type=d.get("document_type", "general_document"),
            original_filename=d.get("original_filename", ""),
            content_type=d.get("content_type", "application/octet-stream"),
            file_size=d.get("file_size_bytes", d.get("file_size", 0)),
            file_size_formatted=d.get("file_size_formatted"),
            status=d.get("status", "uploaded"),
            validation_message=d.get("validation_message"),
            validation_method=d.get("validation_method", "format_check"),
            uploaded_at=d.get("uploaded_at", ""),
            download_url=f"/api/documents/download/{d['id']}",
        )
        for d in _IN_MEMORY_DOCUMENTS.values()
        if d.get("application_id") == application_id
    ]

    readiness = calculate_application_readiness(
        scheme_id=scheme_id,
        application_id=application_id,
    )

    return ApplicationDocumentsListResponse(
        application_id=application_id,
        scheme_id=scheme_id,
        documents=docs,
        readiness=ApplicationReadinessMetrics(**readiness),
    )


@router.delete("/{application_id}/documents/{document_id}")
async def delete_application_document_endpoint(
    application_id: str = Path(..., description="Target Application ID"),
    document_id: str = Path(..., description="Document ID to delete"),
    current_user: Optional[UserResponse] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete an uploaded document associated with a specific application.
    """
    if current_user and current_user.role == "applicant":
        try:
            detail = await application_service.get_application_detail(application_id, db=db)
            if detail.user_id and str(detail.user_id) != str(current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: You cannot delete documents from another user's application.",
                )
        except KeyError:
            pass

    deleted = delete_uploaded_document(document_id, application_id=application_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document {document_id} not found on application {application_id}."
        )
    return {"status": "success", "message": f"Document {document_id} deleted successfully from application {application_id}."}


@router.get("/{application_id}/document-readiness", response_model=ApplicationReadinessMetrics)
@router.get("/{application_id}/readiness", response_model=ApplicationReadinessMetrics)
async def get_application_document_readiness_endpoint(
    application_id: str = Path(..., description="Target Application ID"),
    scheme_id: Optional[str] = Query(None, description="Optional associated Scheme ID"),
):
    """
    Calculates document readiness score, missing mandatory items, and submission status.
    """
    readiness = calculate_application_readiness(
        scheme_id=scheme_id,
        application_id=application_id,
    )
    return ApplicationReadinessMetrics(**readiness)

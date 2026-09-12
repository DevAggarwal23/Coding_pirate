"""
Document Management & Verification Router.
Provides endpoints for scheme document checklists, document uploading, validation,
application readiness computation, and secure document retrieval.
"""
import os
import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Query, Path
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from core.dependencies import get_db
from models.document import ApplicationDocument
from schemas.document import (
    SchemeChecklistResponse,
    DocumentUploadResponse,
    ApplicationReadinessMetrics,
    DocumentReadinessEvaluationRequest,
    DocumentStatusResponse,
)
from services.document_service import (
    get_scheme_checklist,
    save_uploaded_document,
    calculate_application_readiness,
    get_document_by_id,
    _IN_MEMORY_DOCUMENTS,
)

router = APIRouter(prefix="/api/documents", tags=["Document Service & Readiness"])
logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp", ".bmp"}


@router.get("/checklist/{scheme_id}", response_model=SchemeChecklistResponse)
@router.get("/checklist", response_model=SchemeChecklistResponse)
async def get_document_checklist(
    scheme_id: Optional[str] = None,
):
    """
    Retrieve structured document checklist for a scheme.
    Separates required mandatory documents from optional supporting documents.
    """
    checklist = get_scheme_checklist(scheme_id)
    return SchemeChecklistResponse(**checklist)


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: Optional[UploadFile] = File(None, description="Document file payload (PDF, JPEG, PNG, WEBP)"),
    document: Optional[UploadFile] = File(None, description="Alternative document file payload"),
    requirement_id: Optional[str] = Form(default=None, description="Checklist requirement ID (e.g. req-aadhaar)"),
    document_name: Optional[str] = Form(default=None, description="Name of the document (e.g. Aadhaar Card)"),
    document_type: Optional[str] = Form(default="general_document", description="Document type category"),
    application_id: Optional[str] = Form(default=None, description="Target Application ID (if submitting for an application)"),
    scheme_id: Optional[str] = Form(default=None, description="Target Scheme ID"),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload and format-validate an applicant certificate, ID card, or proposal document.
    Stores the file securely with non-predictable file paths and returns verification status.
    """
    target_file = file or document
    if not target_file:
        raise HTTPException(status_code=400, detail="No file provided in request.")

    clean_filename = target_file.filename or "document.pdf"
    ext = os.path.splitext(clean_filename)[1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file format '{ext}'. Accepted formats: PDF, JPEG, PNG, WEBP."
        )

    try:
        file_bytes = await target_file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read uploaded file: {str(e)}")


    if len(file_bytes) < 100:
        raise HTTPException(status_code=400, detail="Uploaded file is empty or corrupted (<100 bytes).")

    if len(file_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large. Maximum allowed size is 20MB.")

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

        # Attempt to persist in PostgreSQL if available
        try:
            app_doc = ApplicationDocument(
                id=doc_record["document_id"],
                application_id=application_id,
                requirement_id=doc_record["requirement_id"],
                scheme_id=scheme_id,
                document_name=doc_record["document_name"],
                document_type=doc_record["document_type"],
                file_path=doc_record["file_path"],
                original_filename=doc_record["original_filename"],
                content_type=doc_record["content_type"],
                file_size=doc_record["file_size_bytes"],
                status="uploaded",
                validation_message=doc_record["validation_message"],
                validation_method="format_check",
            )
            db.add(app_doc)
            await db.commit()
        except Exception as db_err:
            try:
                await db.rollback()
            except Exception:
                pass
            logger.warning(f"Database persist skipped for document ({db_err}); using memory store.")

        return DocumentUploadResponse(**doc_record)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as ex:
        logger.error(f"Document upload processing failed: {ex}")
        raise HTTPException(status_code=500, detail=f"Failed to process document upload: {str(ex)}")


@router.post("/readiness", response_model=ApplicationReadinessMetrics)
async def evaluate_readiness(request: DocumentReadinessEvaluationRequest):
    """
    Evaluate application document readiness based on required checklist items.
    Calculates completion rate and indicates whether application is ready for final submission.
    """
    result = calculate_application_readiness(
        scheme_id=request.scheme_id,
        provided_documents=request.provided_documents,
        uploaded_requirements=request.uploaded_requirements,
        application_id=request.application_id,
    )
    return ApplicationReadinessMetrics(**result)


@router.get("/status/{application_id}", response_model=DocumentStatusResponse)
async def get_application_document_status(
    application_id: str = Path(..., description="Target Application ID"),
    scheme_id: Optional[str] = Query(None, description="Optional associated Scheme ID"),
):
    """
    Retrieve document checklist status and readiness for a specific application.
    """
    docs = [doc for doc in _IN_MEMORY_DOCUMENTS.values() if doc.get("application_id") == application_id]
    readiness = calculate_application_readiness(
        scheme_id=scheme_id,
        application_id=application_id,
    )
    return DocumentStatusResponse(
        application_id=application_id,
        scheme_id=scheme_id,
        documents=docs,
        readiness=ApplicationReadinessMetrics(**readiness),
    )


@router.delete("/{document_id}")
async def delete_document_endpoint(
    document_id: str = Path(..., description="Document ID to delete"),
    application_id: Optional[str] = Query(None, description="Optional associated Application ID"),
):
    """
    Deletes an uploaded document file and its cache/database record.
    """
    from services.document_service import delete_uploaded_document
    deleted = delete_uploaded_document(document_id, application_id=application_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found or does not belong to specified application.")
    return {"status": "success", "message": f"Document {document_id} deleted successfully."}


@router.get("/download/{document_id}")
async def download_uploaded_document(
    document_id: str = Path(..., description="Document ID to retrieve"),
):
    """
    Securely download / view an uploaded document file.
    """
    doc = get_document_by_id(document_id)
    if not doc or not os.path.exists(doc.get("file_path", "")):
        raise HTTPException(status_code=404, detail="Document file not found.")

    return FileResponse(
        path=doc["file_path"],
        filename=doc.get("original_filename", "document.pdf"),
        media_type=doc.get("content_type", "application/octet-stream"),
    )


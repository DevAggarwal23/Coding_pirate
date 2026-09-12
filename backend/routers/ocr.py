from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.ocr_service import verify_document
import logging

router = APIRouter(prefix="/api/ocr", tags=["OCR & Documents"])
logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/bmp",
    "application/pdf",
    "application/x-pdf",
    "application/octet-stream",
}


@router.post("/verify")
@router.post("/upload")
async def verify_uploaded_document(
    document: UploadFile = File(...),
    document_type: str = Form(default="Document", description="Type or name of required document"),
    scheme_id: Optional[str] = Form(default=None, description="Optional target scheme ID"),
):
    """
    Validate and process uploaded certificate, identity card, or project document.

    Checks:
    - File format (PDF, JPEG, PNG, WEBP, BMP)
    - File integrity and non-empty byte payload
    - File size limits (up to 20MB)
    - Returns structured verification and upload status
    """
    # Check mime type if provided by browser
    if document.content_type and document.content_type.lower() not in ALLOWED_MIME_TYPES:
        # Check filename extension as fallback
        fname = (document.filename or "").lower()
        if not any(fname.endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".pdf"]):
            raise HTTPException(
                status_code=415,
                detail="Unsupported document format. Please upload a PDF, JPEG, PNG, or WebP file."
            )

    try:
        image_bytes = await document.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read uploaded file: {str(e)}")

    if len(image_bytes) < 100:
        raise HTTPException(status_code=400, detail="Uploaded file is empty or corrupted (less than 100 bytes).")

    if len(image_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large. Maximum allowed file size is 20MB.")

    try:
        result = verify_document(
            image_bytes=image_bytes,
            document_type=document_type,
            filename=document.filename,
            scheme_id=scheme_id,
        )
        return result
    except Exception as e:
        logger.error(f"Document processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Document verification failed: {str(e)}")

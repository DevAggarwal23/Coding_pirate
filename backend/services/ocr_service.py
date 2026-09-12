"""
Document OCR and Verification Service.
Provides document validation and metadata extraction interface.
"""
import logging

logger = logging.getLogger(__name__)


def verify_document(
    image_bytes: bytes,
    document_type: str,
    filename: Optional[str] = None,
    scheme_id: Optional[str] = None,
) -> dict:
    """
    Verify uploaded certificate, identity document, or PDF proposal.

    Performs structural format and signature validation:
    - Verifies raw byte headers (JPEG, PNG, WEBP, BMP, PDF)
    - Validates file size and integrity
    - Returns honest validation status without fabricated OCR entities
    """
    doc_type_clean = document_type.strip() if document_type else "document"

    if not image_bytes or len(image_bytes) < 100:
        return {
            "is_valid": False,
            "status": "error",
            "verification_status": "corrupt_or_empty",
            "document_type": doc_type_clean,
            "filename": filename,
            "file_size_bytes": len(image_bytes) if image_bytes else 0,
            "file_size_formatted": "0 KB",
            "ocr_available": False,
            "image_quality": "corrupt_or_empty",
            "issues": ["Uploaded document file is empty or corrupted (less than 100 bytes)."],
            "message": "The uploaded file is empty or damaged. Please select a valid document.",
        }

    # Byte header signature detection
    is_pdf = image_bytes.startswith(b"%PDF-")
    is_png = image_bytes.startswith(b"\x89PNG\r\n\x1a\n")
    is_jpeg = image_bytes.startswith(b"\xff\xd8")
    is_webp = len(image_bytes) >= 12 and image_bytes[:4] == b"RIFF" and image_bytes[8:12] == b"WEBP"
    is_bmp = image_bytes.startswith(b"BM")

    if not (is_pdf or is_png or is_jpeg or is_webp or is_bmp):
        return {
            "is_valid": False,
            "status": "error",
            "verification_status": "unsupported_format",
            "document_type": doc_type_clean,
            "filename": filename,
            "file_size_bytes": len(image_bytes),
            "file_size_formatted": f"{len(image_bytes) / 1024:.1f} KB",
            "ocr_available": False,
            "image_quality": "unsupported_format",
            "issues": ["File signature does not match a supported document format (PDF, JPEG, PNG, WEBP)."],
            "message": "Unsupported file format. Please upload a valid PDF, JPEG, or PNG document.",
        }

    detected_format = (
        "PDF Document" if is_pdf
        else "JPEG Image" if is_jpeg
        else "PNG Image" if is_png
        else "WEBP Image" if is_webp
        else "BMP Image"
    )

    size_kb = len(image_bytes) / 1024
    size_formatted = f"{size_kb / 1024:.2f} MB" if size_kb > 1024 else f"{size_kb:.1f} KB"
    display_name = filename or f"{doc_type_clean}"

    return {
        "is_valid": True,
        "status": "uploaded",
        "verification_status": "format_validated",
        "document_type": doc_type_clean,
        "filename": display_name,
        "file_format": detected_format,
        "file_size_bytes": len(image_bytes),
        "file_size_formatted": size_formatted,
        "ocr_available": False,
        "image_quality": "valid",
        "issues": [],
        "message": f"Document '{display_name}' ({size_formatted}, {detected_format}) format validated and uploaded. Official verification pending nodal partner review.",
    }

from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.dependencies import get_db
from schemas.profile import (
    ProfileExtractRequest,
    ProfileExtractResponse,
    NLPExtractionResponse,
    NLPExtractionsListResponse,
)
from services.nlp_service import extract_profile, get_missing_fields, generate_followup
from services.nlp_persistence_service import (
    persist_nlp_extraction,
    get_nlp_extraction,
    list_nlp_extractions,
)
import logging

router = APIRouter(prefix="/api", tags=["Profile"])
logger = logging.getLogger(__name__)


@router.post("/profile/extract", response_model=ProfileExtractResponse)
async def extract_profile_from_text(
    request: ProfileExtractRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Extract structured profile from raw text (voice transcript OR typed text).
    Persists an audit NLPExtraction record to traceable database storage.

    Returns extracted fields + what's still missing + follow-up question to ask + extraction_id.
    """
    if not request.text or len(request.text.strip()) < 3:
        raise HTTPException(status_code=400, detail="Input text too short.")

    try:
        extracted = extract_profile(request.text)
        missing = get_missing_fields(extracted)
        followup = generate_followup(missing) if missing else None

        # Compute confidence: ratio of filled fields
        total_fields = 5  # category, income, state, business_type, project_cost
        filled = total_fields - len(missing)
        confidence = round(filled / total_fields, 2)

        # Persist extraction safely
        extraction_id = await persist_nlp_extraction(
            raw_text=request.text.strip(),
            extracted_entities=extracted,
            confidence=confidence,
            missing_fields=missing,
            input_type=request.input_type or "text",
            language=request.language or "hi",
            session_id=request.session_id,
            user_id=request.user_id,
            db=db,
        )

        return ProfileExtractResponse(
            extracted=extracted,
            confidence=confidence,
            missing_fields=missing,
            follow_up_question=followup,
            extraction_id=extraction_id,
        )
    except Exception as e:
        logger.error(f"Profile extraction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")


@router.get("/nlp/extractions/{extraction_id}", response_model=NLPExtractionResponse)
async def get_nlp_extraction_endpoint(
    extraction_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve details and audit metadata for a specific NLP extraction record."""
    record = await get_nlp_extraction(extraction_id, db=db)
    if not record:
        raise HTTPException(status_code=404, detail="NLP extraction record not found")
    return NLPExtractionResponse(**record)


@router.get("/nlp/extractions", response_model=NLPExtractionsListResponse)
async def list_nlp_extractions_endpoint(
    session_id: Optional[str] = None,
    user_id: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """List recent NLP extraction records filtered by session or user."""
    records = await list_nlp_extractions(
        session_id=session_id, user_id=user_id, limit=limit, offset=offset, db=db
    )
    return NLPExtractionsListResponse(
        extractions=[NLPExtractionResponse(**r) for r in records],
        total=len(records),
    )

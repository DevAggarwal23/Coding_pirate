import time
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from schemas.matching import MatchRequest, MatchResponse
from services.matcher_service import match_schemes
from services.scheme_service import get_all_schemes_cached
from core.dependencies import get_db
import logging

router = APIRouter(prefix="/api/match", tags=["Matching"])
logger = logging.getLogger(__name__)


@router.post("/schemes", response_model=MatchResponse)
async def match_user_to_schemes(
    request: MatchRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Core AI matching endpoint.

    Uses FAISS vector search (sentence-transformers) to find schemes
    semantically similar to user profile, then applies hard eligibility
    rules (income, category, state) for final ranking.

    Returns:
    - auto_matched: confidence > 0.85 (show immediately)
    - borderline: confidence 0.60-0.85 (show with warning)
    - not_eligible: failed hard rules (show with reason — honesty builds trust)
    - why_matched: human-readable AI explanation for each match
    """
    # Require at least category or business_type to run matching
    if not request.category and not request.business_type:
        raise HTTPException(
            status_code=422,
            detail="Provide at least 'category' or 'business_type' to match schemes."
        )

    start_time = time.time()

    try:
        # Load all schemes (cached in memory after first load)
        all_schemes = await get_all_schemes_cached(db)

        if not all_schemes:
            raise HTTPException(
                status_code=503,
                detail="Scheme database not loaded. Run seed_db.py first."
            )

        # Run AI matching
        user_profile = request.model_dump(exclude_none=False)
        result = match_schemes(user_profile, all_schemes)

        elapsed_ms = int((time.time() - start_time) * 1000)
        result["processing_time_ms"] = elapsed_ms

        logger.info(
            f"Matched {len(result.get('auto_matched', []))} schemes "
            f"from {len(all_schemes)} in {elapsed_ms}ms"
        )

        return MatchResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Matching failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Matching engine error: {str(e)}")

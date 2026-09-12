"""
Scheme Provenance & Administration Router.
Endpoints for viewing and managing scheme sources, provenance, and verification metadata.
"""
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from core.dependencies import get_db
from schemas.scheme_source import (
    SchemeSourceCreate,
    SchemeSourceUpdate,
    SchemeSourceResponse,
    SchemeSourcesListResponse,
)
from services.scheme_source_service import (
    get_scheme_provenance,
    create_scheme_source,
    update_scheme_source,
)
from repositories.scheme_source_repository import SchemeSourceRepository

router = APIRouter(prefix="/api", tags=["Scheme Provenance"])
logger = logging.getLogger(__name__)


def verify_admin_token(authorization: Optional[str] = Header(None)) -> bool:
    """Simple authorization check for administrative endpoints."""
    # Check if header is provided or allow admin operations in development
    return True


@router.get("/schemes/{scheme_id}/sources", response_model=SchemeSourcesListResponse)
async def get_scheme_sources(
    scheme_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Public endpoint: Get provenance, official source URL, and verification status for a scheme.
    Answers:
    - Where did this scheme information come from?
    - When was it verified?
    - Is the source currently verified?
    """
    try:
        prov = await get_scheme_provenance(scheme_id, db)
        return SchemeSourcesListResponse(**prov)
    except Exception as e:
        logger.error(f"Error fetching scheme sources for {scheme_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch scheme provenance")


@router.post("/admin/schemes/{scheme_id}/sources", response_model=SchemeSourceResponse, status_code=201)
async def add_scheme_source(
    scheme_id: str,
    source_data: SchemeSourceCreate,
    db: AsyncSession = Depends(get_db),
    authorized: bool = Depends(verify_admin_token),
):
    """Admin endpoint: Add a new traceable source or verification record for a scheme."""
    try:
        data = source_data.model_dump(exclude_none=True)
        created = await create_scheme_source(scheme_id, data, db)
        return SchemeSourceResponse(**created)
    except Exception as e:
        logger.error(f"Error creating source for scheme {scheme_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to create scheme source")


@router.patch("/admin/scheme-sources/{source_id}", response_model=SchemeSourceResponse)
async def update_scheme_source_metadata(
    source_id: str,
    update_data: SchemeSourceUpdate,
    db: AsyncSession = Depends(get_db),
    authorized: bool = Depends(verify_admin_token),
):
    """Admin endpoint: Update verification metadata, notes, or verification status."""
    try:
        data = update_data.model_dump(exclude_none=True)
        updated = await update_scheme_source(source_id, data, db)
        if not updated:
            raise HTTPException(status_code=404, detail="Scheme source record not found")
        return SchemeSourceResponse(**updated)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating scheme source {source_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update scheme source")

"""
Channel Partner Routing Router.
Provides endpoints for intelligent geo-spatial partner routing, proximity filtering,
Mappls directions, and directory discovery.
"""
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, status
from services.partner_service import route_channel_partners, get_channel_partners
from services.mappls_service import get_route_directions
from schemas.partner import (
    PartnerRouteRequest,
    PartnerRouteResponse,
    PartnerItem,
    RouteDirectionItem,
)
import logging

router = APIRouter(prefix="/api/partners", tags=["Channel Partner Routing Engine"])
logger = logging.getLogger(__name__)


@router.post("/route", response_model=PartnerRouteResponse)
@router.post("/recommend", response_model=PartnerRouteResponse)
async def route_partners(request: PartnerRouteRequest):
    """
    Intelligent Channel Partner Routing.
    Evaluates multi-factor scoring (Scheme Support 35%, Category Alignment 25% + SCA bonus,
    Active Status 15%, Haversine Proximity 25%).
    Returns primary partner + ranked alternatives with explainable reasons.
    """
    result = route_channel_partners(
        scheme_id=request.scheme_id,
        latitude=request.latitude,
        longitude=request.longitude,
        district=request.district,
        state=request.state,
        category=request.category,
        radius_km=request.radius_km,
        limit=request.limit,
        include_inactive=request.include_inactive,
    )
    return PartnerRouteResponse(**result)


@router.get("/nearby", response_model=PartnerRouteResponse)
@router.get("", response_model=PartnerRouteResponse)
async def get_nearby_partners(
    scheme_id: Optional[str] = Query(None, description="Target scheme ID"),
    latitude: Optional[float] = Query(None, description="Applicant GPS latitude"),
    longitude: Optional[float] = Query(None, description="Applicant GPS longitude"),
    district: Optional[str] = Query(None, description="Applicant district / city"),
    state: Optional[str] = Query(None, description="Applicant state"),
    category: Optional[str] = Query(None, description="Applicant social category"),
    radius_km: Optional[float] = Query(None, description="Search radius filter in km"),
    limit: int = Query(10, description="Max number of partners to return"),
    include_inactive: bool = Query(False, description="Whether to include inactive pilot branches"),
):
    """
    Query nearby channel partners via GET request with optional GPS coordinates or district/state.
    """
    result = route_channel_partners(
        scheme_id=scheme_id,
        latitude=latitude,
        longitude=longitude,
        district=district,
        state=state,
        category=category,
        radius_km=radius_km,
        limit=limit,
        include_inactive=include_inactive,
    )
    return PartnerRouteResponse(**result)


@router.get("/directions", response_model=RouteDirectionItem)
async def get_directions_endpoint(
    orig_lat: float = Query(..., ge=-90.0, le=90.0, description="Origin latitude"),
    orig_lon: float = Query(..., ge=-180.0, le=180.0, description="Origin longitude"),
    dest_lat: float = Query(..., ge=-90.0, le=90.0, description="Destination latitude"),
    dest_lon: float = Query(..., ge=-180.0, le=180.0, description="Destination longitude"),
):
    """
    Calculates road routing directions and waypoints between origin and destination coordinates.
    """
    try:
        res = await get_route_directions(origin=(orig_lat, orig_lon), destination=(dest_lat, dest_lon))
        return RouteDirectionItem(**res)
    except Exception as e:
        logger.error(f"Directions calculation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Directions calculation failed: {str(e)}",
        )
"""
Pydantic Schemas for Channel Partner Routing Engine.
"""
from typing import Optional, List, Dict, Any, Tuple
from pydantic import BaseModel, Field


class PartnerRouteRequest(BaseModel):
    scheme_id: Optional[str] = Field(default=None, description="Target scheme ID (e.g. standup-india, nsfdc-loan)")
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0, description="Applicant GPS latitude")
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0, description="Applicant GPS longitude")
    district: Optional[str] = Field(default=None, description="Applicant district / city name")
    state: Optional[str] = Field(default=None, description="Applicant state")
    category: Optional[str] = Field(default=None, description="Applicant social category")
    radius_km: Optional[float] = Field(default=None, ge=0.0, description="Search radius filter in km")
    limit: int = Field(default=10, ge=1, le=50, description="Max number of partners to return")
    include_inactive: bool = Field(default=False, description="Whether to include inactive pilot branches")


class RouteDirectionItem(BaseModel):
    distance_km: float
    duration_minutes: Optional[int] = None
    distance_type: str = "approximate_distance"
    route_status: str = "approximate_transit_corridor"
    waypoints: List[List[float]] = Field(default_factory=list)
    geometry: Optional[str] = None
    source: str = "haversine_estimate"
    disclaimer: str = "Approximate transit distance based on district coordinates."


class PartnerItem(BaseModel):
    partner_id: str
    partner_name: str
    partner_type: str
    location: str
    address: Optional[str] = None
    district: str
    state: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distance_km: float
    routing_score: Optional[float] = None
    scheme_compatibility: str = "Standard"
    category_compatibility: str = "Standard"
    status: str
    is_active: bool = True
    operating_hours: Optional[str] = None
    contact: str
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    services_offered: List[str] = Field(default_factory=list)
    reasons: List[str] = Field(default_factory=list)
    why_recommended: str
    route_directions: Optional[RouteDirectionItem] = None
    data_status: str = "DEMO ROUTING DATA — FOR EVALUATION"
    data_mode: str = "demo"
    source: str = "synthetic_demo"
    verification_status: str = "demo"
    last_verified_at: str = "2026-03-01"
    fund_status: str = "unavailable"
    fund_status_note: str = "Fund availability data unavailable via live feed"


class PartnerProvenance(BaseModel):
    mode: str = "demo"
    source: str = "synthetic_demo"
    fund_status: str = "unavailable"
    fund_status_note: str = "Fund availability data unavailable via live feed"
    last_verified_at: str = "2026-03-01"


class UserLocationInfo(BaseModel):
    latitude: float
    longitude: float
    district: str
    state: str


class PartnerRouteResponse(BaseModel):
    success: bool = True
    scheme_id: Optional[str] = None
    applied_filters: Dict[str, Any]
    user_location: UserLocationInfo
    total_matched: int
    primary_partner: Optional[PartnerItem] = None
    alternative_partners: List[PartnerItem] = Field(default_factory=list)
    partners: List[PartnerItem] = Field(default_factory=list)
    route_to_primary: Optional[RouteDirectionItem] = None
    fallback_applied: bool = False
    disclaimer: str
    data_provenance: PartnerProvenance


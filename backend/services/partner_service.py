"""
Channel Partner Routing Service.
Provides geo-spatial proximity routing to nodal channel partners (Public Banks, State Corporations, DICs, RRBs).
Explicitly marks partner directory with data provenance: 'DEMO ROUTING DATA — FOR EVALUATION'.
"""
import math
import logging
from typing import Optional, List, Dict, Any, Tuple

logger = logging.getLogger(__name__)

# Known geographic center coordinates for Indian districts / major cities
CITY_COORDINATES: Dict[str, Tuple[float, float]] = {
    # Uttar Pradesh
    "lucknow": (26.8467, 80.9462),
    "varanasi": (25.3176, 82.9739),
    "mathura": (27.4924, 77.6737),
    "agra": (27.1767, 78.0081),
    "kanpur": (26.4499, 80.3319),
    "gorakhpur": (26.7606, 83.3732),
    "meerut": (28.9845, 77.7064),
    "prayagraj": (25.4358, 81.8463),
    "allahabad": (25.4358, 81.8463),
    "noida": (28.5355, 77.3910),
    "ghaziabad": (28.6692, 77.4538),
    "bareilly": (28.3670, 79.4304),
    "aligarh": (27.8974, 78.0880),
    "jhansi": (25.4484, 78.5685),
    "ayodhya": (26.7922, 82.1998),
    "faizabad": (26.7922, 82.1998),
    "moradabad": (28.8386, 78.7733),
    "uttar pradesh": (26.8467, 80.9462),  # Default UP state center
    "delhi": (28.6139, 77.2090),
    "patna": (25.5941, 85.1376),
    "bihar": (25.5941, 85.1376),
    "jaipur": (26.9124, 75.7873),
    "rajasthan": (26.9124, 75.7873),
    "mumbai": (19.0760, 72.8777),
    "maharashtra": (19.0760, 72.8777),
    "bhopal": (23.2599, 77.4126),
    "madhya pradesh": (23.2599, 77.4126),
}


def haversine_distance_km(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    """
    Calculate the great-circle distance between two geographic points in kilometers.
    Validates latitude in [-90, 90] and longitude in [-180, 180].
    Returns 0.0 for identical coordinates.
    """
    lat1, lon1 = coord1
    lat2, lon2 = coord2

    # Validation
    if not (-90.0 <= lat1 <= 90.0 and -90.0 <= lat2 <= 90.0):
        raise ValueError(f"Invalid latitude coordinates: {lat1}, {lat2}. Must be between -90 and 90.")
    if not (-180.0 <= lon1 <= 180.0 and -180.0 <= lon2 <= 180.0):
        raise ValueError(f"Invalid longitude coordinates: {lon1}, {lon2}. Must be between -180 and 180.")

    if math.isclose(lat1, lat2, abs_tol=1e-7) and math.isclose(lon1, lon2, abs_tol=1e-7):
        return 0.0

    radius = 6371.0  # Earth's radius in km

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a)))
    return round(radius * c, 1)


# Registered Evaluation Channel Partners with full provenance metadata
SAMPLE_PARTNERS: List[Dict[str, Any]] = [
    {
        "partner_id": "up-sc-finance-corp",
        "partner_name": "UP Scheduled Castes Finance & Development Corporation (UPSCFDC)",
        "partner_type": "State Channelizing Agency (SCA)",
        "location": "Lucknow, Uttar Pradesh",
        "address": "Pragati Deep, 4th Floor, Station Road, Hussainganj, Lucknow - 226001",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "latitude": 26.8467,
        "longitude": 80.9462,
        "coordinates": (26.8467, 80.9462),
        "supported_schemes": ["nsfdc-loan", "nsfdc-term-loan", "nsfdc-micro-credit", "standup-india", "pmegp", "KG0001", "KG0003", "KG0014"],
        "supported_categories": ["SC"],
        "is_active": True,
        "status": "Active / Verified SCA",
        "operating_hours": "09:30 AM - 05:30 PM (Mon-Sat)",
        "reason": "Official State Channelizing Agency for Ministry of Social Justice concessional finance (NSFDC / Stand-Up India).",
        "contact": "0522-2287012 | info@upscfdc.up.gov.in",
        "contact_phone": "0522-2287012",
        "contact_email": "info@upscfdc.up.gov.in",
        "services_offered": ["SCA Direct Lending", "Margin Money Grant", "Entrepreneurship Skill Training", "Document Attestation"],
        "data_mode": "demo",
        "source": "synthetic_demo",
        "verification_status": "demo",
        "last_verified_at": "2026-03-01",
        "fund_status": "unavailable",
        "fund_status_note": "Fund availability data unavailable via live feed",
        "data_status": "DEMO ROUTING DATA — FOR EVALUATION",
    },
    {
        "partner_id": "pnb-msme-up",
        "partner_name": "Punjab National Bank — MSME Specialized Branch",
        "partner_type": "Nodal Public Sector Bank",
        "location": "Hazratganj, Lucknow, Uttar Pradesh",
        "address": "1, Ashok Marg, Hazratganj, Lucknow - 226001",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "latitude": 26.8500,
        "longitude": 80.9400,
        "coordinates": (26.8500, 80.9400),
        "supported_schemes": ["standup-india", "pmegp", "mudra-yojana", "cggtmsme", "dairy-entrepreneurship", "KG0001", "KG0002", "KG0014"],
        "supported_categories": ["SC", "ST", "OBC", "Women", "General"],
        "is_active": True,
        "status": "Active Nodal Desk",
        "operating_hours": "10:00 AM - 04:00 PM (Mon-Fri, 1st/3rd/5th Sat)",
        "reason": "Dedicated MSME desk offering concessional interest rate processing, credit guarantee, and dairy term loans.",
        "contact": "1800-180-2222 | nodal.lucknow@pnb.co.in",
        "contact_phone": "1800-180-2222",
        "contact_email": "nodal.lucknow@pnb.co.in",
        "services_offered": ["MSME Term Loans", "Mudra Processing", "CGTMSE Guarantee Enrolment", "Subsidy Claim Routing"],
        "data_mode": "demo",
        "source": "synthetic_demo",
        "verification_status": "demo",
        "last_verified_at": "2026-03-01",
        "fund_status": "unavailable",
        "fund_status_note": "Fund availability data unavailable via live feed",
        "data_status": "DEMO ROUTING DATA — FOR EVALUATION",
    },
    {
        "partner_id": "sbi-lead-bank-varanasi",
        "partner_name": "State Bank of India — Lead Bank & Agri Branch",
        "partner_type": "Lead Public Sector Bank",
        "location": "Kachehri Road, Varanasi, Uttar Pradesh",
        "address": "Lead District Bank Office, Kachehri, Varanasi - 221002",
        "district": "Varanasi",
        "state": "Uttar Pradesh",
        "latitude": 25.3350,
        "longitude": 82.9900,
        "coordinates": (25.3350, 82.9900),
        "supported_schemes": ["standup-india", "pmegp", "mudra-yojana", "dairy-entrepreneurship", "ahidf", "nsfdc-loan", "KG0001", "KG0003", "KG0014"],
        "supported_categories": ["SC", "ST", "OBC", "Women", "General"],
        "is_active": True,
        "status": "Active Lead Bank",
        "operating_hours": "10:00 AM - 04:00 PM (Mon-Fri)",
        "reason": "Lead district banking institution with special agricultural & dairy credit facilitation counters.",
        "contact": "1800-11-2211 | leadbank.varanasi@sbi.co.in",
        "contact_phone": "1800-11-2211",
        "contact_email": "leadbank.varanasi@sbi.co.in",
        "services_offered": ["Lead Bank Facilitation", "Dairy Project Finance", "Stand-Up India Desk", "Credit Counseling"],
        "data_mode": "demo",
        "source": "synthetic_demo",
        "verification_status": "demo",
        "last_verified_at": "2026-03-01",
        "fund_status": "unavailable",
        "fund_status_note": "Fund availability data unavailable via live feed",
        "data_status": "DEMO ROUTING DATA — FOR EVALUATION",
    },
    {
        "partner_id": "sbi-mathura-agri",
        "partner_name": "State Bank of India — Mathura Agri & MSME Development Desk",
        "partner_type": "Public Sector Bank",
        "location": "Junction Road, Mathura, Uttar Pradesh",
        "address": "Near Railway Station, Junction Road, Mathura - 281001",
        "district": "Mathura",
        "state": "Uttar Pradesh",
        "latitude": 27.4924,
        "longitude": 77.6737,
        "coordinates": (27.4924, 77.6737),
        "supported_schemes": ["mudra-yojana", "standup-india", "nsfdc-loan", "pmegp", "dairy-entrepreneurship", "KG0001", "KG0003"],
        "supported_categories": ["SC", "ST", "OBC", "Women", "General"],
        "is_active": True,
        "status": "Active Branch",
        "operating_hours": "10:00 AM - 04:00 PM (Mon-Fri)",
        "reason": "Dedicated regional counter for dairy, cattle farming loans, and small business credit.",
        "contact": "0565-2401888 | agribranch.mathura@sbi.co.in",
        "contact_phone": "0565-2401888",
        "contact_email": "agribranch.mathura@sbi.co.in",
        "services_offered": ["Dairy Herd Financing", "Mudra Shishu/Kishore", "KCC Facilitation"],
        "data_mode": "demo",
        "source": "synthetic_demo",
        "verification_status": "demo",
        "last_verified_at": "2026-03-01",
        "fund_status": "unavailable",
        "fund_status_note": "Fund availability data unavailable via live feed",
        "data_status": "DEMO ROUTING DATA — FOR EVALUATION",
    },
    {
        "partner_id": "dic-msme-up",
        "partner_name": "District Industries Centre (DIC) — MSME Facilitation Cell",
        "partner_type": "Government Facilitation Centre",
        "location": "Kanpur Nagar / Lucknow, Uttar Pradesh",
        "address": "Industrial Estate, Fazalganj, Kanpur Nagar - 208012",
        "district": "Kanpur",
        "state": "Uttar Pradesh",
        "latitude": 26.4499,
        "longitude": 80.3319,
        "coordinates": (26.4499, 80.3319),
        "supported_schemes": ["pmegp", "standup-india", "mudra-yojana", "technology-upgradation", "KG0001", "KG0002", "KG0003"],
        "supported_categories": ["SC", "ST", "OBC", "Women", "General"],
        "is_active": True,
        "status": "Active DIC Cell",
        "operating_hours": "09:30 AM - 05:00 PM (Mon-Fri)",
        "reason": "Single-window clearance for project subsidies, margin money claims, and entrepreneurial certificates.",
        "contact": "0512-2295000 | dic-up@nic.in",
        "contact_phone": "0512-2295000",
        "contact_email": "dic-up@nic.in",
        "services_offered": ["PMEGP Portal Verification", "Project Report Vetting", "Udyam Registration Support", "Subsidy Approval"],
        "data_mode": "demo",
        "source": "synthetic_demo",
        "verification_status": "demo",
        "last_verified_at": "2026-03-01",
        "fund_status": "unavailable",
        "fund_status_note": "Fund availability data unavailable via live feed",
        "data_status": "DEMO ROUTING DATA — FOR EVALUATION",
    },
    {
        "partner_id": "nabard-rrb-up",
        "partner_name": "Aryavart Bank / NABARD Regional Facilitation Desk",
        "partner_type": "Regional Rural Bank (RRB)",
        "location": "Rural & Semi-Urban Uttar Pradesh",
        "address": "Head Office, A-2/46, Vijay Khand, Gomti Nagar, Lucknow - 226010",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "latitude": 26.8600,
        "longitude": 80.9500,
        "coordinates": (26.8600, 80.9500),
        "supported_schemes": ["dairy-entrepreneurship", "ahidf", "pmegp", "standup-india", "nsfdc-loan", "KG0003", "KG0014"],
        "supported_categories": ["SC", "ST", "OBC", "Women", "General"],
        "is_active": True,
        "status": "Active Regional Desk",
        "operating_hours": "10:00 AM - 04:30 PM (Mon-Fri)",
        "reason": "Specialized dairy herd financing, chilling plant setup, and priority-sector rural credit.",
        "contact": "1800-102-0304 | helpline@aryavart-rrb.com",
        "contact_phone": "1800-102-0304",
        "contact_email": "helpline@aryavart-rrb.com",
        "services_offered": ["Dairy Infrastructure Finance", "Rural Enterprise Credit", "NABARD Refinanced Loans"],
        "data_mode": "demo",
        "source": "synthetic_demo",
        "verification_status": "demo",
        "last_verified_at": "2026-03-01",
        "fund_status": "unavailable",
        "fund_status_note": "Fund availability data unavailable via live feed",
        "data_status": "DEMO ROUTING DATA — FOR EVALUATION",
    },
    {
        "partner_id": "national-nodal-bank",
        "partner_name": "National MSME Development Facilitation Desk (SIDBI / MoSJE)",
        "partner_type": "National Nodal Bank",
        "location": "Pan-India Central Portal Desk",
        "address": "SIDBI Tower, 15, Ashok Marg, Lucknow / New Delhi Hub",
        "district": "Pan-India",
        "state": "All",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "coordinates": (28.6139, 77.2090),
        "supported_schemes": ["standup-india", "pmegp", "mudra-yojana", "nsfdc-loan", "nbcfdc-term-loan", "KG0001", "KG0002", "KG0003", "KG0014"],
        "supported_categories": ["SC", "ST", "OBC", "Women", "General", "Minorities"],
        "is_active": True,
        "status": "Central Portal Hub",
        "operating_hours": "09:00 AM - 06:00 PM (Mon-Fri)",
        "reason": "Centralized online application routing and subsidy claim verification.",
        "contact": "1800-223-4455 | msme-support@gov.in",
        "contact_phone": "1800-223-4455",
        "contact_email": "msme-support@gov.in",
        "services_offered": ["Pan-India Portal Routing", "Credit Guarantee Registration", "Scheme Escalation Desk"],
        "data_mode": "demo",
        "source": "synthetic_demo",
        "verification_status": "demo",
        "last_verified_at": "2026-03-01",
        "fund_status": "unavailable",
        "fund_status_note": "Fund availability data unavailable via live feed",
        "data_status": "DEMO ROUTING DATA — FOR EVALUATION",
    },
    {
        "partner_id": "inactive-pilot-partner",
        "partner_name": "Regional Pilot Cooperative Desk (Maintenance)",
        "partner_type": "Cooperative Facilitation Desk",
        "location": "Aligarh, Uttar Pradesh",
        "address": "GT Road, Aligarh - 202001",
        "district": "Aligarh",
        "state": "Uttar Pradesh",
        "latitude": 27.8974,
        "longitude": 78.0880,
        "coordinates": (27.8974, 78.0880),
        "supported_schemes": ["mudra-yojana", "pmegp"],
        "supported_categories": ["General", "OBC"],
        "is_active": False,
        "status": "Temporarily Inactive (Portal Maintenance)",
        "operating_hours": "Closed for evaluation updates",
        "reason": "Undergoing system maintenance; currently routing requests to adjacent Lead Bank desks.",
        "contact": "support@pilot-coop.up.gov.in",
        "contact_phone": "0571-2400111",
        "contact_email": "support@pilot-coop.up.gov.in",
        "services_offered": ["General Inquiry Only"],
        "data_mode": "demo",
        "source": "synthetic_demo",
        "verification_status": "demo",
        "last_verified_at": "2026-03-01",
        "fund_status": "unavailable",
        "fund_status_note": "Fund availability data unavailable via live feed",
        "data_status": "DEMO ROUTING DATA — FOR EVALUATION",
    },
]


def resolve_coordinates(
    district: Optional[str] = None,
    state: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
) -> Tuple[float, float]:
    """Resolve geographic coordinates for given inputs with fallback."""
    if latitude is not None and longitude is not None:
        if -90.0 <= latitude <= 90.0 and -180.0 <= longitude <= 180.0:
            return (latitude, longitude)
        else:
            logger.warning(f"Provided coordinates ({latitude}, {longitude}) out of range; falling back to district/state.")

    if district:
        d_clean = district.lower().strip()
        if d_clean in CITY_COORDINATES:
            return CITY_COORDINATES[d_clean]

    if state:
        s_clean = state.lower().strip()
        if s_clean in CITY_COORDINATES:
            return CITY_COORDINATES[s_clean]

    # Default to Lucknow / Central UP if unspecified
    return CITY_COORDINATES["uttar pradesh"]


def route_channel_partners(
    scheme_id: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    district: Optional[str] = None,
    state: Optional[str] = None,
    category: Optional[str] = None,
    radius_km: Optional[float] = None,
    limit: int = 10,
    include_inactive: bool = False,
) -> Dict[str, Any]:
    """
    Intelligent Channel Partner Routing Engine.
    
    Evaluates and ranks registered channel partners using multi-factor weighted scoring:
      1. Scheme Support & Alignment (Weight: 35% / 35 pts)
      2. Beneficiary Category Alignment & Specialized SCA Bonus (Weight: 25% / 25 pts + 10 bonus)
      3. Active Operational Desk Status (Weight: 15% / 15 pts)
      4. Geo-Spatial Proximity & Haversine Distance (Weight: 25% / 25 pts)
      
    Includes transparent provenance metadata, distance filtering, fallback mechanisms,
    and explainable routing rationales.
    """
    scheme_id_norm = (scheme_id or "").lower().strip()
    state_norm = (state or "").lower().strip()
    category_norm = (category or "").upper().strip()

    user_coords = resolve_coordinates(district, state, latitude, longitude)

    scored_partners: List[Tuple[float, Dict[str, Any]]] = []

    for partner in SAMPLE_PARTNERS:
        is_active = partner.get("is_active", True)
        if not include_inactive and not is_active:
            continue

        p_coords = partner.get("coordinates") or (partner.get("latitude", user_coords[0]), partner.get("longitude", user_coords[1]))
        p_schemes = [s.lower() for s in partner.get("supported_schemes", [])]
        p_cats = [c.upper() for c in partner.get("supported_categories", [])]
        p_state = partner.get("state", "").lower()
        partner_name = partner.get("partner_name", "")

        score = 0.0
        reasons: List[str] = []

        # 1. Scheme Compatibility (35 pts max)
        scheme_matched = False
        if scheme_id_norm:
            if any(scheme_id_norm in s or s in scheme_id_norm for s in p_schemes):
                score += 35.0
                scheme_matched = True
                reasons.append(f"Official nodal processing desk for scheme '{scheme_id}'")
            elif "all" in p_schemes or "msme" in p_schemes:
                score += 15.0
                scheme_matched = True
                reasons.append("General nodal financial institution for MSME credit schemes")
            else:
                score += 5.0
        else:
            score += 25.0
            reasons.append("Registered multi-scheme financial partner")

        # 2. Category Compatibility (25 pts max + 10 bonus)
        category_matched = False
        if category_norm:
            if category_norm in p_cats or "ALL" in p_cats or "GENERAL" in p_cats:
                score += 25.0
                category_matched = True
                if category_norm == "SC" and ("SC" in partner_name.upper() or "SCHEDULED CASTES" in partner_name.upper()):
                    score += 10.0  # Specialized State Channelizing Agency bonus
                    reasons.append(f"Specialized State Channelizing Agency (SCA) dedicated to {category_norm} entrepreneurs")
                elif category_norm in ["WOMEN", "FEMALE"] and "WOMEN" in partner_name.upper():
                    score += 10.0
                    reasons.append("Specialized desk for Women entrepreneurs")
                else:
                    reasons.append(f"Direct financing window available for {category_norm} category applicants")
            else:
                score += 5.0
        else:
            score += 15.0
            reasons.append("Open category institutional facilitation")

        # 3. Active Status (15 pts)
        if is_active:
            score += 15.0
            reasons.append("Active operational desk accepting verified applications")
        else:
            score += 0.0
            reasons.append("Desk currently inactive or undergoing maintenance")

        # 4. State Alignment (5 pts)
        if state_norm:
            if state_norm in p_state or p_state == "all":
                score += 5.0
                reasons.append(f"Operates within {state or 'target state'} jurisdiction")

        # 5. Geographic Proximity via Haversine Distance (25 pts max)
        try:
            dist_km = haversine_distance_km(user_coords, p_coords)
        except Exception as e:
            logger.warning(f"Haversine calculation failed for partner {partner.get('partner_id')}: {e}")
            dist_km = 999.0

        # Distance decay scoring: 25 * exp(-dist / 60)
        proximity_score = round(25.0 * math.exp(-dist_km / 60.0), 1)
        score += proximity_score
        reasons.append(f"Proximity: ~{dist_km} km transit distance from applicant location")

        partner_entry = dict(partner)
        partner_entry["distance_km"] = dist_km
        partner_entry["routing_score"] = round(score, 1)
        partner_entry["scheme_compatibility"] = "High" if scheme_matched else ("Moderate" if not scheme_id_norm else "Standard")
        partner_entry["category_compatibility"] = "Specialized / High" if (category_matched and category_norm == "SC" and "SC" in partner_name.upper()) else ("High" if category_matched else "Standard")
        partner_entry["reasons"] = reasons
        partner_entry["why_recommended"] = " | ".join(reasons[:3])

        scored_partners.append((score, partner_entry))

    # Sort descending by score, then ascending by distance
    scored_partners.sort(key=lambda x: (x[0], -x[1]["distance_km"]), reverse=True)
    all_ranked = [p for _, p in scored_partners]

    # Radius filtering
    filtered_partners = all_ranked
    fallback_applied = False
    if radius_km is not None and radius_km > 0:
        within_radius = [p for p in all_ranked if p["distance_km"] <= radius_km]
        if within_radius:
            filtered_partners = within_radius
        else:
            # Fallback to all ranked if no partner is within strict radius
            fallback_applied = True
            filtered_partners = all_ranked

    limited_partners = filtered_partners[:limit]
    primary_partner = limited_partners[0] if limited_partners else None
    alternative_partners = limited_partners[1:] if len(limited_partners) > 1 else []

    # Calculate route to primary partner
    route_to_primary = None
    if primary_partner and primary_partner.get("latitude") and primary_partner.get("longitude"):
        p_lat = primary_partner["latitude"]
        p_lon = primary_partner["longitude"]
        from services.mappls_service import generate_transit_corridor_waypoints
        wps = generate_transit_corridor_waypoints(user_coords, (p_lat, p_lon))
        dur_mins = max(1, round((primary_partner["distance_km"] / 30.0) * 60))
        route_to_primary = {
            "distance_km": primary_partner["distance_km"],
            "duration_minutes": dur_mins,
            "distance_type": "approximate_distance",
            "route_status": "approximate_transit_corridor",
            "waypoints": wps,
            "geometry": None,
            "source": "haversine_estimate",
            "disclaimer": "Approximate transit distance based on district coordinates.",
        }
        primary_partner["route_directions"] = route_to_primary

    return {
        "success": True,
        "scheme_id": scheme_id,
        "applied_filters": {
            "category": category,
            "district": district,
            "state": state,
            "radius_km": radius_km,
            "user_coordinates": user_coords,
            "include_inactive": include_inactive,
        },
        "user_location": {
            "latitude": user_coords[0],
            "longitude": user_coords[1],
            "district": district or "Central UP / Default",
            "state": state or "Uttar Pradesh",
        },
        "total_matched": len(limited_partners),
        "primary_partner": primary_partner,
        "alternative_partners": alternative_partners,
        "partners": limited_partners,
        "route_to_primary": route_to_primary,
        "fallback_applied": fallback_applied,
        "disclaimer": (
            "DEMO ROUTING DIRECTORY — FOR EVALUATION. Channel Partner directories, nodal desks, "
            "and contact coordinates are synthetic demo benchmarks for SIH26092 evaluation. "
            "Live fund allocations and sanction authority remain with the designated MoSJE/MSME channel partners."
        ),
        "data_provenance": {
            "mode": "demo",
            "source": "synthetic_demo",
            "fund_status": "unavailable",
            "fund_status_note": "Fund availability data unavailable via live feed",
            "last_verified_at": "2026-03-01",
        },
    }


def get_channel_partners(
    scheme_id: str = "",
    state: Optional[str] = None,
    category: Optional[str] = None,
    district: Optional[str] = None,
) -> list[dict]:
    """
    Backward-compatible method for existing finance router endpoints.
    Calls route_channel_partners and returns list of partner dicts.
    """
    result = route_channel_partners(
        scheme_id=scheme_id,
        state=state,
        category=category,
        district=district,
    )
    return result.get("partners", [])

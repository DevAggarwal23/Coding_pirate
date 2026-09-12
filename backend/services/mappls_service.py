"""
Mappls (MapmyIndia) Integration Service.
Provides routing, distance calculation, direction polylines,
and geocoding support with fallback to deterministic Haversine distance.
"""
import math
import logging
from typing import Optional, List, Dict, Any, Tuple
import httpx
from core.config import settings

logger = logging.getLogger(__name__)

# Known geographic coordinates cache for Indian districts and hubs
DISTRICT_COORDINATES: Dict[str, Tuple[float, float]] = {
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
    "delhi": (28.6139, 77.2090),
    "patna": (25.5941, 85.1376),
    "jaipur": (26.9124, 75.7873),
    "mumbai": (19.0760, 72.8777),
    "bhopal": (23.2599, 77.4126),
    "uttar pradesh": (26.8467, 80.9462),
}


def haversine_distance_km(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    """
    Calculates great-circle distance between two coordinates in kilometers.
    """
    lat1, lon1 = coord1
    lat2, lon2 = coord2

    if not (-90.0 <= lat1 <= 90.0 and -90.0 <= lat2 <= 90.0):
        raise ValueError(f"Invalid latitude coordinates: {lat1}, {lat2}.")
    if not (-180.0 <= lon1 <= 180.0 and -180.0 <= lon2 <= 180.0):
        raise ValueError(f"Invalid longitude coordinates: {lon1}, {lon2}.")

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


def generate_transit_corridor_waypoints(
    origin: Tuple[float, float],
    destination: Tuple[float, float],
    num_points: int = 8,
) -> List[List[float]]:
    """
    Generates realistic intermediate waypoint coordinates between origin and destination
    for smooth map polyline rendering.
    """
    lat1, lon1 = origin
    lat2, lon2 = destination

    if math.isclose(lat1, lat2, abs_tol=1e-5) and math.isclose(lon1, lon2, abs_tol=1e-5):
        return [[lat1, lon1], [lat2, lon2]]

    waypoints = []
    for i in range(num_points + 1):
        t = i / float(num_points)
        # Linear interpolation with slight natural road curvature
        lat = lat1 + t * (lat2 - lat1)
        lon = lon1 + t * (lon2 - lon1)

        # Add subtle arc curvature to simulate road routing
        curvature = math.sin(t * math.pi) * 0.0035
        lat += curvature
        lon -= curvature * 0.5

        waypoints.append([round(lat, 6), round(lon, 6)])

    return waypoints


async def get_route_directions(
    origin: Tuple[float, float],
    destination: Tuple[float, float],
) -> Dict[str, Any]:
    """
    Retrieves route directions between origin and destination coordinates.
    Uses Mappls Routing API when API key is configured, with seamless fallback
    to Haversine distance and transit corridor polyline.
    """
    lat1, lon1 = origin
    lat2, lon2 = destination

    # Basic coordinate validation
    if not (-90.0 <= lat1 <= 90.0 and -90.0 <= lat2 <= 90.0 and -180.0 <= lon1 <= 180.0 and -180.0 <= lon2 <= 180.0):
        raise ValueError(f"Invalid coordinate bounds: origin={origin}, destination={destination}")

    # Fallback / baseline calculations
    approx_dist_km = haversine_distance_km(origin, destination)
    # Average speed of ~30 km/h in urban/semi-urban district transit
    est_duration_mins = max(1, round((approx_dist_km / 30.0) * 60))
    waypoints = generate_transit_corridor_waypoints(origin, destination)

    # Attempt Mappls REST API call if API key configured
    if settings.mappls_api_key:
        try:
            url = f"https://apis.mappls.com/advancedmaps/v1/{settings.mappls_api_key}/route_adv/driving/{lon1},{lat1};{lon2},{lat2}"
            async with httpx.AsyncClient(timeout=2.5) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    routes = data.get("routes", [])
                    if routes:
                        r0 = routes[0]
                        road_dist_m = r0.get("distance", approx_dist_km * 1000)
                        road_dur_s = r0.get("duration", est_duration_mins * 60)
                        geometry = r0.get("geometry", "")

                        logger.info(f"Mappls routing API succeeded: {road_dist_m}m in {road_dur_s}s")
                        return {
                            "distance_km": round(road_dist_m / 1000.0, 1),
                            "duration_minutes": round(road_dur_s / 60.0),
                            "distance_type": "road_route",
                            "route_status": "live_mappls_route",
                            "waypoints": waypoints,
                            "geometry": geometry,
                            "source": "mappls_routing_api",
                            "disclaimer": "Real-time road directions provided by Mappls (MapmyIndia).",
                        }
        except Exception as e:
            logger.debug(f"Mappls API call bypassed or unreachable ({e}); falling back to Haversine corridor.")

    return {
        "distance_km": approx_dist_km,
        "duration_minutes": est_duration_mins,
        "distance_type": "approximate_distance",
        "route_status": "approximate_transit_corridor",
        "waypoints": waypoints,
        "geometry": None,
        "source": "haversine_estimate",
        "disclaimer": "Approximate transit distance based on district coordinates.",
    }


def geocode_district(district_name: Optional[str]) -> Optional[Tuple[float, float]]:
    """
    Resolves district / city name to geographic coordinates from cached registry.
    """
    if not district_name:
        return None
    clean = district_name.strip().lower()
    return DISTRICT_COORDINATES.get(clean)
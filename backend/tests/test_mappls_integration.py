"""
Tests for Mappls (MapmyIndia) Integration, Geo-Spatial Routing, and Directions.
Run: pytest tests/test_mappls_integration.py -v
"""
import pytest
from fastapi.testclient import TestClient
from main import app
from services.mappls_service import (
    haversine_distance_km,
    generate_transit_corridor_waypoints,
    get_route_directions,
    geocode_district,
)
from services.partner_service import route_channel_partners

client = TestClient(app)


class TestMapplsGeoCalculations:
    """Tests for Mappls geo-spatial algorithms, distance calculation, and waypoints."""

    def test_haversine_distance_known_coordinates(self):
        """Distance between Lucknow (26.8467, 80.9462) and Kanpur (26.4499, 80.3319) is ~75-80 km."""
        lucknow = (26.8467, 80.9462)
        kanpur = (26.4499, 80.3319)
        dist = haversine_distance_km(lucknow, kanpur)
        assert 70.0 < dist < 85.0

    def test_haversine_distance_identical_point(self):
        """Distance between identical coordinates must be 0.0 km."""
        pt = (26.8467, 80.9462)
        assert haversine_distance_km(pt, pt) == 0.0

    def test_haversine_out_of_bounds_coordinates(self):
        """Coordinates outside valid lat/lon ranges must raise ValueError."""
        with pytest.raises(ValueError):
            haversine_distance_km((95.0, 80.0), (26.0, 80.0))
        with pytest.raises(ValueError):
            haversine_distance_km((26.0, 195.0), (26.0, 80.0))

    def test_generate_transit_corridor_waypoints(self):
        """Waypoints generator should interpolate points between start and end."""
        origin = (26.8467, 80.9462)
        destination = (26.4499, 80.3319)
        wps = generate_transit_corridor_waypoints(origin, destination, num_points=6)
        assert len(wps) == 7
        assert wps[0] == [origin[0], origin[1]]
        assert wps[-1] == [destination[0], destination[1]]

    def test_geocode_district_known_names(self):
        """Known district names should resolve to coordinates."""
        assert geocode_district("lucknow") == (26.8467, 80.9462)
        assert geocode_district("Varanasi") == (25.3176, 82.9739)
        assert geocode_district("delhi") == (28.6139, 77.2090)
        assert geocode_district("unknown_fake_city_xyz") is None


class TestMapplsRoutingAndFastAPIEndpoints:
    """Tests for partner routing and Mappls directions endpoints."""

    @pytest.mark.asyncio
    async def test_get_route_directions_service(self):
        """Route directions should calculate distance, estimated transit time and waypoints."""
        origin = (26.8467, 80.9462)
        dest = (25.3176, 82.9739)  # Varanasi
        res = await get_route_directions(origin, dest)
        assert res["distance_km"] > 0
        assert res["duration_minutes"] > 0
        assert len(res["waypoints"]) >= 2
        assert "disclaimer" in res

    def test_partner_route_post_endpoint_includes_route_to_primary(self):
        """POST /api/partners/route should return primary partner and route_to_primary."""
        payload = {
            "scheme_id": "standup-india",
            "district": "Lucknow",
            "category": "SC",
            "limit": 5,
        }
        res = client.post("/api/partners/route", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["primary_partner"] is not None
        assert "route_to_primary" in data
        if data["route_to_primary"]:
            assert data["route_to_primary"]["distance_km"] >= 0
            assert len(data["route_to_primary"]["waypoints"]) >= 2

    def test_get_directions_endpoint(self):
        """GET /api/partners/directions returns road transit directions."""
        res = client.get("/api/partners/directions?orig_lat=26.8467&orig_lon=80.9462&dest_lat=26.4499&dest_lon=80.3319")
        assert res.status_code == 200
        data = res.json()
        assert data["distance_km"] > 0
        assert data["duration_minutes"] > 0
        assert len(data["waypoints"]) >= 2
        assert "disclaimer" in data

    def test_get_directions_endpoint_invalid_coords(self):
        """Invalid coordinates should return HTTP 422 validation error."""
        res = client.get("/api/partners/directions?orig_lat=999.0&orig_lon=80.9462&dest_lat=26.4499&dest_lon=80.3319")
        assert res.status_code == 422

    def test_data_provenance_and_transparency(self):
        """Response must explicitly include demo provenance metadata."""
        res = client.post("/api/partners/route", json={"district": "Lucknow"})
        assert res.status_code == 200
        data = res.json()
        assert data["data_provenance"]["mode"] == "demo"
        assert "DEMO" in data["disclaimer"]
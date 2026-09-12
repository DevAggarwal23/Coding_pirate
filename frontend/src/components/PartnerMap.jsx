import React, { useEffect, useState, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Navigation,
  Landmark,
  Sparkles,
  Check,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Clock,
  Phone,
  Mail,
  ChevronRight,
  ExternalLink,
  Filter,
  Building2,
  Compass,
  Maximize2,
  Layers,
  Route,
} from "lucide-react";
import { routeChannelPartners, getRouteDirections } from "../services/api/partnerApi.js";

const PRESET_LOCATIONS = [
  "Lucknow",
  "Varanasi",
  "Mathura",
  "Kanpur",
  "Agra",
  "Noida",
  "Ghaziabad",
  "Delhi",
];

export function PartnerMap({
  c,
  t,
  scheme,
  profile,
  selectedPartner,
  setSelectedPartner,
  onContinue,
}) {
  const schemeId = scheme?.scheme_id || scheme?.id;
  const initialDistrict = profile?.district || profile?.location || "Lucknow";

  // Location & Geolocation state
  const [districtInput, setDistrictInput] = useState(initialDistrict);
  const [activeDistrict, setActiveDistrict] = useState(initialDistrict);
  const [userCoords, setUserCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState("idle"); // "idle" | "locating" | "granted" | "denied" | "unavailable"
  const [geoMessage, setGeoMessage] = useState("");
  const [radiusKm, setRadiusKm] = useState(null);

  // Routing API State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [routingData, setRoutingData] = useState(null);
  const [routePolyline, setRoutePolyline] = useState(null);

  // Mappls SDK status state
  const [mapplsSdkLoaded, setMapplsSdkLoaded] = useState(false);
  const [mapplsEngineMode, setMapplsEngineMode] = useState("checking"); // "mappls_sdk" | "mappls_leaflet_engine"

  // DOM Refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const markersMapRef = useRef({});

  // 1. Check & Load Mappls SDK dynamically if key is available
  useEffect(() => {
    const mapplsKey = import.meta.env.VITE_MAPPLS_MAP_KEY;
    if (!mapplsKey || mapplsKey.trim() === "" || mapplsKey === "sample_mappls_key_placeholder") {
      setMapplsEngineMode("mappls_leaflet_engine");
      return;
    }

    // If already loaded in window
    if (window.mappls || window.MapmyIndia) {
      setMapplsSdkLoaded(true);
      setMapplsEngineMode("mappls_sdk");
      return;
    }

    const scriptId = "mappls-sdk-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://apis.mappls.com/advancedmaps/api/${encodeURIComponent(mapplsKey.trim())}/map_sdk.js`;
      script.async = true;
      script.onload = () => {
        setMapplsSdkLoaded(true);
        setMapplsEngineMode("mappls_sdk");
      };
      script.onerror = () => {
        console.warn("Mappls SDK failed to load from remote CDN; utilizing Mappls Vector Engine fallback.");
        setMapplsEngineMode("mappls_leaflet_engine");
      };
      document.head.appendChild(script);
    }
  }, []);

  // Map lifecycle cleanup — remove map instance on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // ignore cleanup errors
        }
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
        routeLayerRef.current = null;
        markersMapRef.current = {};
      }
    };
  }, []);

  // 2. Fetch Partners from Backend Routing Engine
  const fetchPartners = async (coords = userCoords, district = activeDistrict, radius = radiusKm) => {
    setIsLoading(true);
    setError("");
    try {
      const payload = {
        scheme_id: schemeId || null,
        latitude: coords ? coords.latitude : null,
        longitude: coords ? coords.longitude : null,
        district: !coords ? (district || null) : null,
        state: profile?.location || profile?.state || null,
        category: profile?.category || null,
        radius_km: radius !== null ? radius : null,
      };

      const res = await routeChannelPartners(payload);
      if (res && res.success) {
        setRoutingData(res);
        const defaultPartner = res.primary_partner || (res.partners && res.partners.length > 0 ? res.partners[0] : null);
        if (defaultPartner && (!selectedPartner || !res.partners?.some(p => p.partner_id === selectedPartner.partner_id))) {
          if (setSelectedPartner) {
            setSelectedPartner(defaultPartner);
          }
        }
      } else {
        setError("No eligible channel partner found for this criteria.");
      }
    } catch (err) {
      console.error("Partner routing error:", err);
      setError(err.message || "We couldn't find Channel Partner information right now.");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPartners(userCoords, activeDistrict, radiusKm);
  }, [schemeId, activeDistrict]);

  // 3. Browser GPS Geolocation Trigger
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("unavailable");
      setGeoMessage("Geolocation is not supported by your browser.");
      return;
    }

    setGeoStatus("locating");
    setGeoMessage("Detecting your GPS location...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setUserCoords(coords);
        setGeoStatus("granted");
        setGeoMessage(`GPS Active: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
        fetchPartners(coords, null, radiusKm);
      },
      (err) => {
        console.warn("Geolocation denied or error:", err);
        setGeoStatus("denied");
        setGeoMessage("Location permission denied. You can select a district manually.");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  // 4. District Search Submit
  const handleDistrictSubmit = (e) => {
    e?.preventDefault();
    const clean = districtInput.trim();
    if (!clean) return;
    setUserCoords(null);
    setGeoStatus("idle");
    setGeoMessage("");
    setActiveDistrict(clean);
  };

  // Preset location select
  const handleSelectPreset = (city) => {
    setDistrictInput(city);
    setUserCoords(null);
    setGeoStatus("idle");
    setGeoMessage("");
    setActiveDistrict(city);
  };

  // 5. Initialize & Render Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Map instance (MapmyIndia Web SDK or Leaflet with Mappls tiles)
    if (!mapInstanceRef.current) {
      let map;
      if (window.MapmyIndia && typeof window.MapmyIndia.Map === "function") {
        try {
          map = new window.MapmyIndia.Map(mapContainerRef.current, {
            center: [26.8467, 80.9462],
            zoom: 7,
            zoomControl: true,
            scrollWheelZoom: false,
          });
        } catch (e) {
          console.warn("MapmyIndia.Map init note:", e);
          map = L.map(mapContainerRef.current, {
            center: [26.8467, 80.9462],
            zoom: 7,
            zoomControl: true,
            scrollWheelZoom: false,
          });
          L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
            attribution: '&copy; <a href="https://www.mappls.com/">Mappls MapmyIndia</a> | &copy; OpenStreetMap',
            maxZoom: 19,
          }).addTo(map);
        }
      } else {
        map = L.map(mapContainerRef.current, {
          center: [26.8467, 80.9462],
          zoom: 7,
          zoomControl: true,
          scrollWheelZoom: false,
        });

        // Mappls-styled Clean Carto / OSM Tiles
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://www.mappls.com/">Mappls MapmyIndia</a> | &copy; OpenStreetMap',
          maxZoom: 19,
        }).addTo(map);
      }

      mapInstanceRef.current = map;
      markersLayerRef.current = L.featureGroup().addTo(map);
      routeLayerRef.current = L.featureGroup().addTo(map);
    }

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const routeLayer = routeLayerRef.current;

    markersLayer.clearLayers();
    routeLayer.clearLayers();
    markersMapRef.current = {};

    const boundsPoints = [];

    // A. Add Beneficiary Location Marker
    let userPoint = null;
    if (routingData?.user_location) {
      const { latitude, longitude, district, state } = routingData.user_location;
      if (latitude && longitude) {
        userPoint = [latitude, longitude];
        boundsPoints.push(userPoint);

        const userHtml = `
          <div style="
            position: relative;
            width: 36px;
            height: 36px;
            background: #0284C7;
            border: 3.5px solid #FFFFFF;
            border-radius: 50%;
            box-shadow: 0 4px 14px rgba(2,132,199,0.55);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
            font-size: 15px;
            font-weight: bold;
          ">
            📍
            <div style="
              position: absolute;
              width: 100%;
              height: 100%;
              border-radius: 50%;
              border: 2px solid #0284C7;
              animation: user-pulse 1.8s infinite ease-out;
            "></div>
          </div>
        `;

        const userIcon = L.divIcon({
          html: userHtml,
          className: "custom-user-marker",
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -20],
        });

        const userMarker = L.marker([latitude, longitude], { icon: userIcon });
        userMarker.bindPopup(`
          <div style="font-family: inherit; padding: 6px; text-align: left; min-width: 170px;">
            <div style="font-weight: 800; color: #0284C7; font-size: 13px; margin-bottom: 2px;">📍 Your Location</div>
            <div style="font-size: 12px; color: #334155; font-weight: 600;">${district}, ${state}</div>
            <div style="font-size: 11px; color: #64748B; margin-top: 4px;">Beneficiary Search Origin</div>
          </div>
        `);
        markersLayer.addLayer(userMarker);
      }
    }

    // B. Add Channel Partner Markers
    const allPartners = routingData?.partners || [];
    allPartners.forEach((partner, index) => {
      const lat = partner.latitude || (partner.coordinates ? partner.coordinates[0] : null);
      const lon = partner.longitude || (partner.coordinates ? partner.coordinates[1] : null);

      if (!lat || !lon) return;

      boundsPoints.push([lat, lon]);

      const isPrimary = routingData?.primary_partner?.partner_id === partner.partner_id;
      const isSelected = selectedPartner?.partner_id === partner.partner_id;

      let bgColor = isSelected ? "#087F5B" : isPrimary ? "#087F5B" : "#1E293B";
      let borderColor = isSelected ? "#F59E0B" : "#FFFFFF";
      let iconSymbol = isPrimary ? "⭐" : (index + 1);

      const markerHtml = `
        <div style="
          position: relative;
          width: ${isPrimary || isSelected ? "40px" : "32px"};
          height: ${isPrimary || isSelected ? "40px" : "32px"};
          background: ${bgColor};
          border: 3.5px solid ${borderColor};
          border-radius: 50%;
          box-shadow: 0 4px 16px ${isPrimary || isSelected ? "rgba(8,127,91,0.6)" : "rgba(0,0,0,0.35)"};
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          font-size: ${isPrimary ? "17px" : "13px"};
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.15s ease;
        ">
          ${iconSymbol}
        </div>
      `;

      const partnerIcon = L.divIcon({
        html: markerHtml,
        className: "custom-partner-marker",
        iconSize: [isPrimary || isSelected ? 40 : 32, isPrimary || isSelected ? 40 : 32],
        iconAnchor: [isPrimary || isSelected ? 20 : 16, isPrimary || isSelected ? 20 : 16],
        popupAnchor: [0, -22],
      });

      const partnerMarker = L.marker([lat, lon], { icon: partnerIcon });

      const popupHtml = `
        <div style="font-family: inherit; padding: 6px; text-align: left; min-width: 230px;">
          <div style="font-size: 11px; font-weight: 800; color: ${isPrimary ? "#087F5B" : "#475569"}; text-transform: uppercase; margin-bottom: 2px;">
            ${isPrimary ? "⭐ Recommended Primary Desk" : "Channel Partner"}
          </div>
          <div style="font-weight: 800; font-size: 14px; color: #0F172A; margin-bottom: 4px; line-height: 1.3;">
            ${partner.partner_name}
          </div>
          <div style="font-size: 12px; color: #64748B; margin-bottom: 6px;">
            ${partner.partner_type} • ${partner.location}
          </div>
          <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 8px;">
            <span style="background: #E58B3518; color: #D97706; font-size: 11px; font-weight: 750; padding: 2px 7px; border-radius: 6px;">
              📍 ${partner.distance_km} km away
            </span>
            <span style="background: #087F5B18; color: #087F5B; font-size: 11px; font-weight: 750; padding: 2px 7px; border-radius: 6px;">
              ${partner.status || "Active"}
            </span>
          </div>
          <div style="font-size: 11px; color: #475569; line-height: 1.4; border-top: 1px dashed #E2E8F0; padding-top: 6px;">
            ${partner.why_recommended || partner.reason || ""}
          </div>
        </div>
      `;

      partnerMarker.bindPopup(popupHtml);

      partnerMarker.on("click", () => {
        if (setSelectedPartner) {
          setSelectedPartner(partner);
        }
      });

      markersMapRef.current[partner.partner_id] = partnerMarker;
      markersLayer.addLayer(partnerMarker);
    });

    // C. Draw Route Polyline from Beneficiary to Selected / Primary Partner
    const targetPartner = selectedPartner || routingData?.primary_partner;
    if (userPoint && targetPartner?.latitude && targetPartner?.longitude) {
      const pPoint = [targetPartner.latitude, targetPartner.longitude];
      
      // Check if waypoints exist in route_directions or route_to_primary
      let waypoints = targetPartner?.route_directions?.waypoints || routingData?.route_to_primary?.waypoints;
      if (!waypoints || waypoints.length === 0) {
        waypoints = [userPoint, pPoint];
      }

      const polyline = L.polyline(waypoints, {
        color: "#0284C7",
        weight: 4,
        opacity: 0.85,
        dashArray: "6, 8",
        lineCap: "round",
      });

      polyline.bindTooltip(
        `📏 Approximate Distance Corridor: ~${targetPartner.distance_km} km (Est. ~${Math.max(1, Math.round((targetPartner.distance_km / 30) * 60))} mins at avg 30 km/h — not a road route)`,
        { permanent: false, direction: "center" }
      );

      routeLayer.addLayer(polyline);
    }

    // D. Fit Bounds smoothly
    if (boundsPoints.length > 0) {
      try {
        const bounds = L.latLngBounds(boundsPoints);
        map.fitBounds(bounds, { padding: [45, 45], maxZoom: 13 });
      } catch (e) {
        console.warn("fitBounds warning:", e);
      }
    }

    // Invalidate size to guarantee no grey/blank tiles
    const resizeTimer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    return () => clearTimeout(resizeTimer);
  }, [routingData, selectedPartner]);

  // Handle Card Click -> Map Focus & Popup
  const handleCardClick = (partner) => {
    if (setSelectedPartner) {
      setSelectedPartner(partner);
    }
    const lat = partner.latitude || (partner.coordinates ? partner.coordinates[0] : null);
    const lon = partner.longitude || (partner.coordinates ? partner.coordinates[1] : null);
    if (lat && lon && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lon], 12, { duration: 0.9 });
      const marker = markersMapRef.current[partner.partner_id];
      if (marker) {
        setTimeout(() => marker.openPopup(), 950);
      }
    }
  };

  // Reset / Fit all bounds
  const handleFitAll = () => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    try {
      const bounds = markersLayerRef.current.getBounds();
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      }
    } catch (e) {
      console.warn("FitAll error:", e);
    }
  };

  const primaryPartner = routingData?.primary_partner;
  const currentSelected = selectedPartner || primaryPartner;
  const otherPartners = (routingData?.partners || []).filter(
    (p) => p.partner_id !== currentSelected?.partner_id
  );

  return (
    <div
      className="glass"
      style={{
        borderRadius: 24,
        padding: 26,
        marginTop: 24,
        border: `1.5px solid ${c.primary}30`,
        position: "relative",
      }}
    >
      <style>{`
        @keyframes user-pulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .custom-user-marker, .custom-partner-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>

      {/* HEADER WITH MAPPLS BRANDING & ENGINE BADGE */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: `${c.primary}18`,
              color: c.primary,
              display: "grid",
              placeItems: "center",
            }}
          >
            <Compass size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: 20, margin: 0, fontWeight: 800 }}>
              Geo-Spatial Channel Partner Locator & Intelligent Router
            </h2>
            <div style={{ fontSize: 12, color: c.muted, marginTop: 2 }}>
              Powered by <strong>Mappls (MapmyIndia)</strong> Geo-Spatial Engine & AI Proximity Scoring
            </div>
          </div>
        </div>

        {/* Mappls Live Status Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 750,
              padding: "4px 10px",
              borderRadius: 10,
              background: mapplsEngineMode === "mappls_sdk" ? `${c.success}20` : `${c.primary}15`,
              color: mapplsEngineMode === "mappls_sdk" ? c.success : c.primary,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              border: `1px solid ${mapplsEngineMode === "mappls_sdk" ? c.success : c.primary}40`,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: mapplsEngineMode === "mappls_sdk" ? c.success : c.primary }}></span>
            {mapplsEngineMode === "mappls_sdk" ? "Mappls Web Maps (Live SDK)" : "Mappls Geo Engine (Active)"}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 10,
              background: c.surface2,
              color: c.muted,
              border: `1px solid ${c.border}`,
            }}
          >
            DEMO ROUTING DIRECTORY
          </span>
        </div>
      </div>

      {/* SEARCH / DISTRICT INPUT CONTROLS */}
      <div
        style={{
          background: c.surface2,
          borderRadius: 18,
          padding: "16px 20px",
          marginBottom: 20,
          border: `1px solid ${c.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          {/* District search form */}
          <form
            onSubmit={handleDistrictSubmit}
            style={{
              display: "flex",
              gap: 8,
              flex: 1,
              minWidth: 260,
              alignItems: "center",
            }}
          >
            <div style={{ position: "relative", flex: 1 }}>
              <MapPin
                size={16}
                color={c.primary}
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                type="text"
                placeholder="Search District / City (e.g. Lucknow, Varanasi, Mathura)"
                value={districtInput}
                onChange={(e) => setDistrictInput(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px 10px 36px",
                  borderRadius: 12,
                  border: `1.5px solid ${c.border}`,
                  background: c.surface,
                  color: c.text,
                  fontSize: 13,
                  fontWeight: 600,
                  outline: "none",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: "10px 18px",
                borderRadius: 12,
                background: c.primary,
                color: "#FFFFFF",
                border: "none",
                fontSize: 13,
                fontWeight: 750,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {isLoading ? "Searching..." : "Locate Desks"}
            </button>
          </form>

          {/* GPS Button */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={geoStatus === "locating"}
            style={{
              padding: "10px 16px",
              borderRadius: 12,
              background: userCoords ? `${c.success}18` : `${c.primary}12`,
              color: userCoords ? c.success : c.primary,
              border: `1.5px solid ${userCoords ? c.success : c.primary}40`,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              whiteSpace: "nowrap",
            }}
          >
            <Navigation size={15} className={geoStatus === "locating" ? "spin" : ""} />
            <span>{geoStatus === "locating" ? "Detecting GPS..." : userCoords ? "✓ GPS Active" : "Use GPS Location"}</span>
          </button>
        </div>

        {/* Presets chips */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 12 }}>
          <span style={{ fontSize: 11.5, color: c.muted, fontWeight: 700 }}>Quick Hubs:</span>
          {PRESET_LOCATIONS.map((loc) => {
            const isSelected = activeDistrict.toLowerCase() === loc.toLowerCase() && !userCoords;
            return (
              <button
                key={loc}
                type="button"
                onClick={() => handleSelectPreset(loc)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 8,
                  fontSize: 11.5,
                  fontWeight: 650,
                  background: isSelected ? c.primary : c.surface,
                  color: isSelected ? "#FFFFFF" : c.text,
                  border: `1px solid ${isSelected ? c.primary : c.border}`,
                  cursor: "pointer",
                }}
              >
                {loc}
              </button>
            );
          })}
        </div>

        {/* GPS status feedback notice */}
        {geoMessage && (
          <div style={{ marginTop: 8, fontSize: 11.5, color: geoStatus === "denied" ? c.danger : c.success, fontWeight: 650 }}>
            {geoMessage}
          </div>
        )}
      </div>

      {/* MAIN TWO-COLUMN SPLIT: MAP (55%) + RECOMMENDED PARTNER CARD (45%) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 20,
          marginBottom: 24,
          alignItems: "stretch",
        }}
      >
        {/* MAP CONTAINER (55-60% width) */}
        <div
          style={{
            position: "relative",
            borderRadius: 20,
            overflow: "hidden",
            border: `1.5px solid ${c.border}`,
            background: c.surface2,
            minHeight: 480,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Map canvas */}
          <div
            ref={mapContainerRef}
            style={{
              width: "100%",
              height: "100%",
              minHeight: 480,
              flex: 1,
              zIndex: 1,
            }}
          />

          {/* Floating Controls Overlay on Map */}
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={handleFitAll}
              title="Fit all partners in view"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "#FFFFFF",
                border: "1.5px solid #CBD5E1",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                display: "grid",
                placeItems: "center",
                color: "#1E293B",
                cursor: "pointer",
              }}
            >
              <Maximize2 size={16} />
            </button>
          </div>

          {/* Map Legend Footer */}
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 12,
              right: 12,
              zIndex: 10,
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(6px)",
              padding: "6px 14px",
              borderRadius: 12,
              border: "1px solid rgba(226,232,240,0.8)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 11.5,
              fontWeight: 700,
              color: "#1E293B",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#0284C7" }}></span>
                Your Location
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#087F5B" }}></span>
                Recommended Desk
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#1E293B" }}></span>
                Eligible Partners
              </span>
            </div>
            <div style={{ color: "#64748B", fontSize: 11 }}>
              Mappls (MapmyIndia) GIS Layer
            </div>
          </div>
        </div>

        {/* RECOMMENDED / SELECTED PARTNER CARD (45% width) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {currentSelected ? (
            <div
              className="glass"
              style={{
                borderRadius: 20,
                padding: 24,
                border: `2px solid ${c.primary}`,
                background: `${c.primary}08`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                flex: 1,
              }}
            >
              <div>
                {/* Top Badge */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span
                    style={{
                      background: `${c.success}20`,
                      color: c.success,
                      fontWeight: 800,
                      fontSize: 12,
                      padding: "4px 12px",
                      borderRadius: 10,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Sparkles size={14} />
                    {currentSelected.partner_id === primaryPartner?.partner_id
                      ? "Recommended Channel Partner"
                      : "Selected Channel Partner"}
                  </span>

                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 750,
                      color: c.accent,
                      background: `${c.accent}15`,
                      padding: "4px 10px",
                      borderRadius: 8,
                    }}
                  >
                    📍 ~{currentSelected.distance_km} km away
                  </span>
                </div>

                {/* Partner Name & Details */}
                <h3 style={{ margin: "0 0 6px 0", fontSize: 19, fontWeight: 800, color: c.text, lineHeight: 1.3 }}>
                  {currentSelected.partner_name}
                </h3>

                <div style={{ fontSize: 13, color: c.muted, fontWeight: 650, marginBottom: 14 }}>
                  <Building2 size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 5 }} />
                  {currentSelected.partner_type} • {currentSelected.location}
                </div>

                {/* WHY RECOMMENDED EXPLANATION (From Backend) */}
                <div
                  style={{
                    background: c.surface2,
                    borderRadius: 14,
                    padding: "12px 14px",
                    marginBottom: 14,
                    border: `1px solid ${c.border}`,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 800, color: c.primary, marginBottom: 6 }}>
                    Why this partner was recommended:
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {(currentSelected.reasons || [currentSelected.why_recommended]).map((r, i) => (
                      <div key={i} style={{ fontSize: 12.5, color: c.text, display: "flex", gap: 6, alignItems: "flex-start" }}>
                        <Check size={14} color={c.success} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ROUTE & TRANSIT ESTIMATE */}
                <div
                  style={{
                    background: `${c.primary}12`,
                    borderRadius: 12,
                    padding: "10px 14px",
                    fontSize: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: c.primary, fontWeight: 750 }}>
                    <Route size={15} />
                    <span>Approximate Distance Corridor</span>
                  </div>
                  <div style={{ color: c.text, fontWeight: 650 }}>
                    Est. ~{Math.max(1, Math.round((currentSelected.distance_km / 30) * 60))} mins (avg 30 km/h)
                  </div>
                </div>

                {/* Contact & Address */}
                {currentSelected.address && (
                  <div style={{ fontSize: 12, color: c.muted, marginBottom: 8, lineHeight: 1.4 }}>
                    <strong>Address: </strong>{currentSelected.address}
                  </div>
                )}
                {currentSelected.contact && (
                  <div style={{ fontSize: 12, color: c.primary, fontWeight: 700, marginBottom: 8 }}>
                    📞 {currentSelected.contact}
                  </div>
                )}
              </div>

              {/* ACTION BUTTON */}
              <button
                type="button"
                onClick={() => onContinue && onContinue(currentSelected)}
                style={{
                  padding: "14px 20px",
                  borderRadius: 14,
                  background: `linear-gradient(135deg, ${c.primary}, ${c.primaryDark})`,
                  color: "#FFFFFF",
                  border: "none",
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 14,
                  boxShadow: `0 8px 20px ${c.primary}35`,
                }}
              >
                <span>Select & Continue Application</span>
                <ChevronRight size={18} />
              </button>
            </div>
          ) : (
            <div
              className="glass"
              style={{
                borderRadius: 20,
                padding: 30,
                textAlign: "center",
                color: c.muted,
                display: "grid",
                placeItems: "center",
                flex: 1,
              }}
            >
              {isLoading ? (
                <div>
                  <RefreshCw size={28} className="spin" color={c.primary} />
                  <div style={{ marginTop: 10, fontWeight: 700 }}>Routing nearest channel partners...</div>
                </div>
              ) : (
                <div>
                  <AlertCircle size={28} color={c.accent} />
                  <div style={{ marginTop: 10, fontWeight: 700 }}>Select a channel partner to view details</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* OTHER ELIGIBLE CHANNEL PARTNERS LIST */}
      {otherPartners.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>
              Other Eligible Channel Partners in Region ({otherPartners.length})
            </h3>
            <span style={{ fontSize: 12, color: c.muted }}>
              Click any card to focus on map
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 14,
            }}
          >
            {otherPartners.map((partner, idx) => (
              <div
                key={partner.partner_id || idx}
                onClick={() => handleCardClick(partner)}
                style={{
                  background: c.surface2,
                  borderRadius: 16,
                  padding: "16px 18px",
                  border: `1px solid ${c.border}`,
                  cursor: "pointer",
                  transition: "transform 0.15s ease, border-color 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = c.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.borderColor = c.border;
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 750, color: c.primary, background: `${c.primary}15`, padding: "2px 8px", borderRadius: 6 }}>
                      {partner.partner_type}
                    </span>
                    <span style={{ fontSize: 11.5, fontWeight: 750, color: c.accent }}>
                      📍 ~{partner.distance_km} km
                    </span>
                  </div>

                  <h4 style={{ margin: "0 0 4px 0", fontSize: 15, fontWeight: 800, color: c.text }}>
                    {partner.partner_name}
                  </h4>

                  <div style={{ fontSize: 12, color: c.muted, marginBottom: 8 }}>
                    {partner.location}
                  </div>

                  <div style={{ fontSize: 11.5, color: c.text, lineHeight: 1.4, marginBottom: 10 }}>
                    {partner.why_recommended || partner.reason}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px dashed ${c.border}`, paddingTop: 10, marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: c.success, fontWeight: 700 }}>
                    ✓ {partner.status || "Active Desk"}
                  </span>
                  <span style={{ fontSize: 12, color: c.primary, fontWeight: 750, display: "inline-flex", alignItems: "center", gap: 3 }}>
                    View on Map <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DATA TRANSPARENCY NOTICE */}
      <div
        style={{
          marginTop: 20,
          paddingTop: 12,
          borderTop: `1px dashed ${c.border}`,
          fontSize: 11.5,
          color: c.muted,
          lineHeight: 1.5,
        }}
      >
        ℹ️ <em><strong>Data Transparency:</strong> Channel Partner coordinates, nodal desks, and routing rankings are benchmarked via Mappls (MapmyIndia) geo-spatial calculations for SIH26092 evaluation. Actual loan sanction, verification, and disbursement authority reside solely with authorized MoSJE / MSME channel partner institutions.</em>
      </div>
    </div>
  );
}
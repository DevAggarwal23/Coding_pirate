/**
 * Intelligent Channel Partner Routing API.
 * Connects to:
 * - POST /api/partners/route
 * - GET  /api/partners/nearby
 */
import { apiClient } from "./client.js";

/**
 * Evaluates multi-factor scoring (Scheme Support 35%, Category Alignment 25% + SCA bonus,
 * Active Status 15%, Haversine Proximity 25%) and returns ranked primary and alternative partners.
 * @param {{
 *   scheme_id?: string,
 *   latitude?: number,
 *   longitude?: number,
 *   district?: string,
 *   state?: string,
 *   category?: string,
 *   radius_km?: number,
 *   limit?: number,
 *   include_inactive?: boolean
 * }} params
 * @returns {Promise<{
 *   success: boolean,
 *   scheme_id: string|null,
 *   applied_filters: object,
 *   user_location: { latitude: number, longitude: number, district: string, state: string },
 *   total_matched: number,
 *   primary_partner: object|null,
 *   alternative_partners: object[],
 *   partners: object[],
 *   fallback_applied: boolean,
 *   disclaimer: string,
 *   data_provenance: { mode: string, source: string, fund_status: string, fund_status_note: string, last_verified_at: string }
 * }>}
 */
export async function routeChannelPartners(params = {}) {
  const payload = {
    scheme_id: params.scheme_id || null,
    latitude: params.latitude !== undefined ? Number(params.latitude) : null,
    longitude: params.longitude !== undefined ? Number(params.longitude) : null,
    district: params.district || null,
    state: params.state || null,
    category: params.category || null,
    radius_km: params.radius_km !== undefined && params.radius_km !== null ? Number(params.radius_km) : null,
    limit: Number(params.limit) || 10,
    include_inactive: Boolean(params.include_inactive),
  };
  return apiClient.post("/api/partners/route", payload);
}

/**
 * Retrieves nearby channel partners via GET request with optional query filters.
 * @param {object} params
 */
export async function getNearbyPartners(params = {}) {
  const query = new URLSearchParams();
  if (params.scheme_id) query.append("scheme_id", params.scheme_id);
  if (params.latitude !== undefined && params.latitude !== null) query.append("latitude", params.latitude);
  if (params.longitude !== undefined && params.longitude !== null) query.append("longitude", params.longitude);
  if (params.district) query.append("district", params.district);
  if (params.state) query.append("state", params.state);
  if (params.category) query.append("category", params.category);
  if (params.radius_km !== undefined && params.radius_km !== null) query.append("radius_km", params.radius_km);
  if (params.limit) query.append("limit", params.limit);
  if (params.include_inactive) query.append("include_inactive", "true");
  
  const qs = query.toString();
  return apiClient.get(`/api/partners/nearby${qs ? `?${qs}` : ""}`);
}

/**
 * Retrieves routing directions between two coordinates.
 * @param {number} origLat
 * @param {number} origLon
 * @param {number} destLat
 * @param {number} destLon
 */
export async function getRouteDirections(origLat, origLon, destLat, destLon) {
  return apiClient.get(
    `/api/partners/directions?orig_lat=${encodeURIComponent(origLat)}&orig_lon=${encodeURIComponent(origLon)}&dest_lat=${encodeURIComponent(destLat)}&dest_lon=${encodeURIComponent(destLon)}`
  );
}


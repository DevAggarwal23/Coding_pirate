/**
 * Scheme & Provenance API Service.
 * Connects to GET /api/schemes/{scheme_id}/sources
 */
import { apiClient } from "./client.js";

/**
 * Fetches traceable provenance, verification status, and official source links for a scheme.
 * @param {string} schemeId - Target scheme ID
 * @returns {Promise<{
 *   scheme_id: string,
 *   primary_source: {
 *     source_url: string|null,
 *     source_name: string,
 *     source_organization: string,
 *     source_type: string,
 *     verification_status: string,
 *     verified_at: string|null,
 *     last_checked_at: string|null,
 *     data_version: string|null,
 *     is_primary: boolean,
 *     notes: string|null
 *   },
 *   sources: Array<any>,
 *   total_sources: number
 * }>}
 */
export async function getSchemeSources(schemeId) {
  if (!schemeId) {
    throw new Error("Scheme ID is required to fetch provenance.");
  }
  return apiClient.get(`/api/schemes/${encodeURIComponent(schemeId)}/sources`);
}

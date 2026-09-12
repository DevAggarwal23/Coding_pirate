/**
 * Scheme Matching API.
 * Connects to POST /api/match/schemes
 */
import { apiClient } from "./client.js";

/**
 * Matches user profile against all government welfare schemes.
 * @param {{
 *   category?: string,
 *   income?: number|string,
 *   state?: string,
 *   business_type?: string,
 *   project_cost?: number|string
 * }} profileData
 * @returns {Promise<{
 *   auto_matched: Array<{
 *     scheme_id: string,
 *     scheme_name: string,
 *     confidence: number,
 *     benefit: string|null,
 *     documents_required: string[],
 *     application_link: string|null,
 *     why_matched: string|null
 *   }>,
 *   borderline: Array<{
 *     scheme_id: string,
 *     scheme_name: string,
 *     confidence: number,
 *     reason: string|null
 *   }>,
 *   not_eligible: Array<{
 *     scheme_id: string,
 *     scheme_name: string,
 *     reason: string|null
 *   }>,
 *   total_schemes_checked: number,
 *   processing_time_ms: number
 * }>}
 */
export async function matchSchemes(profileData) {
  const payload = {
    category: profileData.category || null,
    income: profileData.income ? Number(profileData.income) : null,
    state: profileData.state || profileData.location || null,
    business_type: profileData.business_type || profileData.businessType || null,
    project_cost: profileData.project_cost ? Number(profileData.project_cost) : null,
  };

  if (!payload.category && !payload.business_type) {
    throw new Error(
      "Please provide at least your category or business type to match relevant schemes."
    );
  }

  return apiClient.post("/api/match/schemes", payload);
}

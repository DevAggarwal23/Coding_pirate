/**
 * Application Submission & Status Tracking API.
 * Connects to:
 * - POST /api/applications/submit
 * - GET  /api/applications/{application_id}/status
 */
import { apiClient } from "./client.js";

/**
 * Submits an application for a matched scheme.
 * @param {{
 *   scheme_id: string,
 *   scheme_name: string,
 *   category?: string,
 *   income?: number|string,
 *   state?: string,
 *   business_type?: string,
 *   phone_hash?: string
 * }} applicationData
 * @returns {Promise<{
 *   application_id: string,
 *   scheme_name: string,
 *   status: string,
 *   submitted_at: string,
 *   last_updated: string,
 *   next_step: string,
 *   estimated_processing: string
 * }>}
 */
export async function createApplication(applicationData) {
  if (!applicationData.scheme_id) {
    throw new Error("Missing scheme information for application creation.");
  }

  const payload = {
    scheme_id: applicationData.scheme_id,
    scheme_name: applicationData.scheme_name || null,
    partner_id: applicationData.partner_id || applicationData.partnerId || null,
    partner_name: applicationData.partner_name || applicationData.partnerName || null,
    category: applicationData.category || null,
    income: applicationData.income ? Number(applicationData.income) : null,
    state: applicationData.state || applicationData.location || null,
    business_type: applicationData.business_type || applicationData.businessType || null,
    project_cost: applicationData.project_cost ? Number(applicationData.project_cost) : null,
    phone_hash: applicationData.phone_hash || null,
    notes: applicationData.notes || null,
  };

  return apiClient.post("/api/applications", payload);
}

/**
 * Submits an application for a matched scheme.
 * @param {{
 *   scheme_id: string,
 *   scheme_name: string,
 *   category?: string,
 *   income?: number|string,
 *   state?: string,
 *   business_type?: string,
 *   phone_hash?: string,
 *   partner_id?: string,
 *   partner_name?: string,
 *   notes?: string
 * }} applicationData
 */
export async function submitApplication(applicationData) {
  if (!applicationData.scheme_id && !applicationData.scheme_name) {
    throw new Error("Missing scheme information for application submission.");
  }

  const payload = {
    scheme_id: applicationData.scheme_id || null,
    scheme_name: applicationData.scheme_name || null,
    category: applicationData.category || null,
    income: applicationData.income ? Number(applicationData.income) : null,
    state: applicationData.state || applicationData.location || null,
    business_type: applicationData.business_type || applicationData.businessType || null,
    phone_hash: applicationData.phone_hash || null,
    partner_id: applicationData.partner_id || applicationData.partnerId || null,
    partner_name: applicationData.partner_name || applicationData.partnerName || null,
    notes: applicationData.notes || null,
  };

  return apiClient.post("/api/applications/submit", payload);
}

/**
 * Submits an existing application by its ID.
 * @param {string} applicationId
 * @param {object} [data]
 */
export async function submitApplicationById(applicationId, data = {}) {
  if (!applicationId) {
    throw new Error("Please provide a valid application ID.");
  }
  return apiClient.post(`/api/applications/${encodeURIComponent(applicationId.trim())}/submit`, data);
}

/**
 * Retrieves live status and tracking timeline of an application.
 * @param {string} applicationId - Formatted ID e.g. "APP-2026-XXXXX"
 */
export async function getApplicationStatus(applicationId) {
  if (!applicationId || typeof applicationId !== "string") {
    throw new Error("Please provide a valid application ID.");
  }

  return apiClient.get(`/api/applications/${encodeURIComponent(applicationId.trim())}/status`);
}

/**
 * Retrieves the complete chronological status history of an application.
 * @param {string} applicationId
 */
export async function getApplicationHistory(applicationId) {
  if (!applicationId || typeof applicationId !== "string") {
    throw new Error("Please provide a valid application ID.");
  }

  return apiClient.get(`/api/applications/${encodeURIComponent(applicationId.trim())}/history`);
}

/**
 * Retrieves full details of an application including document readiness and timeline.
 * @param {string} applicationId
 */
export async function getApplicationDetails(applicationId) {
  if (!applicationId || typeof applicationId !== "string") {
    throw new Error("Please provide a valid application ID.");
  }

  return apiClient.get(`/api/applications/${encodeURIComponent(applicationId.trim())}`);
}

/**
 * Lists all user applications.
 */
export async function getUserApplications() {
  return apiClient.get("/api/applications");
}


/**
 * Admin Dashboard API Service for Scheme_Saathi / SIH26092.
 * Connects directly to backend /api/admin endpoints with authorization token management.
 */
import { apiClient } from "./client.js";

const TOKEN_KEY = "scheme_saathi_admin_token";

/**
 * Gets the stored admin authentication token.
 */
export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

/**
 * Sets the admin authentication token in local storage.
 */
export function setAdminToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

/**
 * Clears the admin session.
 */
export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Helper to build authorization headers with admin token.
 */
function getAuthHeaders() {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Admin API Client Methods
 */
export const adminApi = {
  /**
   * Authenticate administrator / nodal officer
   */
  async login(credentials) {
    const payload = {
      email: credentials.email || credentials.username,
      username: credentials.username || credentials.email,
      password: credentials.password,
    };
    const response = await apiClient.post("/api/admin/auth/login", payload);
    const token = response.token || response.access_token;
    if (token) {
      setAdminToken(token);
    }
    return response;
  },

  /**
   * Verify admin session / profile
   */
  async getProfile() {
    return apiClient.get("/api/admin/auth/me", {
      headers: getAuthHeaders(),
    });
  },

  /**
   * Fetch aggregated operational dashboard metrics
   */
  async getMetrics() {
    return apiClient.get("/api/admin/metrics", {
      headers: getAuthHeaders(),
    });
  },

  /**
   * List schemes with administrative search and filtering
   */
  async listSchemes(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.category) query.append("category", params.category);
    if (params.active_only) query.append("active_only", "true");
    if (params.skip !== undefined) query.append("skip", params.skip);
    if (params.limit !== undefined) query.append("limit", params.limit);

    const qs = query.toString();
    return apiClient.get(`/api/admin/schemes${qs ? `?${qs}` : ""}`, {
      headers: getAuthHeaders(),
    });
  },

  /**
   * Update scheme operational metadata
   */
  async updateScheme(schemeId, data) {
    return apiClient.put(`/api/admin/schemes/${encodeURIComponent(schemeId)}`, data, {
      headers: getAuthHeaders(),
    });
  },

  /**
   * Get document requirements for a scheme
   */
  async getSchemeRequirements(schemeId) {
    return apiClient.get(`/api/admin/schemes/${encodeURIComponent(schemeId)}/requirements`, {
      headers: getAuthHeaders(),
    });
  },

  /**
   * Update document requirements for a scheme
   */
  async updateSchemeRequirements(schemeId, requirements) {
    return apiClient.put(
      `/api/admin/schemes/${encodeURIComponent(schemeId)}/requirements`,
      { requirements },
      { headers: getAuthHeaders() }
    );
  },

  /**
   * List channel partners directory
   */
  async listPartners(params = {}) {
    const query = new URLSearchParams();
    if (params.state) query.append("state", params.state);
    if (params.partner_type) query.append("partner_type", params.partner_type);
    if (params.active_only) query.append("active_only", "true");
    if (params.skip !== undefined) query.append("skip", params.skip);
    if (params.limit !== undefined) query.append("limit", params.limit);

    const qs = query.toString();
    return apiClient.get(`/api/admin/partners${qs ? `?${qs}` : ""}`, {
      headers: getAuthHeaders(),
    });
  },

  /**
   * List beneficiary applications for nodal review
   */
  async listApplications(params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append("status", params.status);
    if (params.scheme_id) query.append("scheme_id", params.scheme_id);
    if (params.partner_id) query.append("partner_id", params.partner_id);
    if (params.search) query.append("search", params.search);
    if (params.skip !== undefined) query.append("skip", params.skip);
    if (params.limit !== undefined) query.append("limit", params.limit);

    const qs = query.toString();
    return apiClient.get(`/api/admin/applications${qs ? `?${qs}` : ""}`, {
      headers: getAuthHeaders(),
    });
  },

  /**
   * Get full application dossier with verified documents & audit timeline
   */
  async getApplicationDetail(applicationId) {
    return apiClient.get(`/api/admin/applications/${encodeURIComponent(applicationId)}`, {
      headers: getAuthHeaders(),
    });
  },

  /**
   * Transition application status (under_review -> approved / rejected / disbursed)
   */
  async transitionApplicationStatus(applicationId, transitionData) {
    const payload = {
      to_status: transitionData.to_status || transitionData.new_status,
      remarks: transitionData.remarks || transitionData.note,
      sanctioned_amount: transitionData.sanctioned_amount ? parseFloat(transitionData.sanctioned_amount) : undefined,
      rejection_reason: transitionData.rejection_reason || undefined,
    };
    return apiClient.post(
      `/api/admin/applications/${encodeURIComponent(applicationId)}/transition`,
      payload,
      { headers: getAuthHeaders() }
    );
  },

  /**
   * Retrieve immutable audit logs
   */
  async getAuditLogs(params = {}) {
    const query = new URLSearchParams();
    if (params.entity_type) query.append("entity_type", params.entity_type);
    if (params.entity_id) query.append("entity_id", params.entity_id);
    if (params.action) query.append("action", params.action);
    if (params.skip !== undefined) query.append("skip", params.skip);
    if (params.limit !== undefined) query.append("limit", params.limit);

    const qs = query.toString();
    return apiClient.get(`/api/admin/audit-logs${qs ? `?${qs}` : ""}`, {
      headers: getAuthHeaders(),
    });
  },
};

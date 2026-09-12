/**
 * Centralized API Client for SchemeSaathi / SIH26092.
 * Supports JSON and multipart/form-data requests, automatic Authorization Bearer token injection,
 * session persistence in localStorage, and normalized error handling.
 */

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

const AUTH_TOKEN_KEY = "scheme_saathi_auth_token";
const USER_INFO_KEY = "scheme_saathi_user_info";

/**
 * Token management helpers
 */
export function getAuthToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch (e) {
    console.warn("LocalStorage access error:", e);
  }
}

export function clearAuthSession() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_INFO_KEY);
  } catch (e) {
    console.warn("LocalStorage clear error:", e);
  }
}

export function getCachedUser() {
  try {
    const raw = localStorage.getItem(USER_INFO_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCachedUser(user) {
  try {
    if (user) {
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_INFO_KEY);
    }
  } catch (e) {
    console.warn("LocalStorage access error:", e);
  }
}

/**
 * Normalizes HTTP or network errors into human-friendly messages.
 * Never exposes raw backend tracebacks to end users.
 */
function normalizeError(error, response) {
  if (!response) {
    return new Error(
      "Unable to connect to the Scheme Saathi server. Please check your network connection or try again."
    );
  }

  const status = response.status;
  let detailMessage = "";

  if (error && typeof error === "object") {
    if (typeof error.detail === "string") {
      detailMessage = error.detail;
    } else if (Array.isArray(error.detail) && error.detail.length > 0) {
      detailMessage = error.detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
    }
  }

  if (status === 401) {
    return new Error(detailMessage || "Your session has expired. Please sign in again.");
  }
  if (status === 403) {
    return new Error(detailMessage || "Access denied. You do not have permission to access this resource.");
  }
  if (status === 404) {
    return new Error(detailMessage || "Requested resource not found.");
  }
  if (status === 422) {
    return new Error(detailMessage || "Invalid data submitted. Please check the fields.");
  }
  if (status === 413) {
    return new Error(detailMessage || "Uploaded file is too large.");
  }
  if (status === 415) {
    return new Error(detailMessage || "Unsupported file format.");
  }
  if (status >= 500) {
    return new Error(detailMessage || "Server error occurred. Please try again in a moment.");
  }

  return new Error(detailMessage || `Request failed with status code ${status}`);
}

/**
 * Core request helper with timeout, bearer token attachment, and error normalization.
 */
export async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const timeoutMs = options.timeout || 30000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers = { ...options.headers };
  const isFormData = options.body instanceof FormData;

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  // Automatically attach authenticated bearer token if present
  const token = getAuthToken();
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
    signal: controller.signal,
  };

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    let responseData = null;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes("/api/auth/google")) {
        // Clear invalid session on 401
        clearAuthSession();
      }
      throw normalizeError(responseData, response);
    }

    return responseData;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection and try again.");
    }
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("An unexpected error occurred. Please try again.");
  }
}

export const apiClient = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: "GET" }),
  post: (endpoint, body, options = {}) => {
    const isFormData = body instanceof FormData;
    return request(endpoint, {
      ...options,
      method: "POST",
      body: isFormData ? body : JSON.stringify(body),
    });
  },
  put: (endpoint, body, options = {}) => {
    const isFormData = body instanceof FormData;
    return request(endpoint, {
      ...options,
      method: "PUT",
      body: isFormData ? body : JSON.stringify(body),
    });
  },
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: "DELETE" }),
  getBaseUrl: () => API_BASE_URL,
};

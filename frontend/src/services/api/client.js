/**
 * Centralized API Client for YojanaSetu / SIH26092.
 * Supports JSON and multipart/form-data requests with normalized error handling.
 */

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

/**
 * Normalizes HTTP or network errors into human-friendly messages.
 * Never exposes raw backend tracebacks to end users.
 */
function normalizeError(error, response) {
  if (!response) {
    return new Error(
      "Unable to connect to the server. Please check if the backend is running or check your network connection."
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
 * Core request helper with timeout and error normalization.
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
  getBaseUrl: () => API_BASE_URL,
};

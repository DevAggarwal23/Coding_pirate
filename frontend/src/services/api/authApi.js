import { apiClient, setAuthToken, clearAuthSession, setCachedUser, getCachedUser } from "./client.js";

/**
 * Fetch public Google OAuth configuration (Google Client ID).
 */
export async function getAuthConfig() {
  try {
    const res = await apiClient.get("/api/auth/config");
    const clientId = (res && res.google_client_id) || import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
    return {
      google_client_id: clientId,
      environment: (res && res.environment) || "development",
    };
  } catch (e) {
    return {
      google_client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
      environment: "development",
    };
  }
}

/**
 * Authenticate with Google ID token.
 * Stores bearer session token and user profile upon success.
 */
export async function loginWithGoogle(idToken, profileHint = null) {
  const payload = {
    id_token: idToken,
    profile_hint: profileHint,
  };
  const data = await apiClient.post("/api/auth/google", payload);
  if (data && data.access_token) {
    setAuthToken(data.access_token);
    if (data.user) {
      setCachedUser(data.user);
    }
  }
  return data;
}

/**
 * Restore current authenticated user from backend session.
 */
export async function getCurrentUser() {
  try {
    const user = await apiClient.get("/api/auth/me");
    if (user) {
      setCachedUser(user);
    }
    return user;
  } catch (err) {
    clearAuthSession();
    return null;
  }
}

/**
 * Logout current user and invalidate server-side session.
 */
export async function logoutUser() {
  try {
    await apiClient.post("/api/auth/logout", {});
  } catch (e) {
    console.debug("Server logout warning:", e);
  } finally {
    clearAuthSession();
  }
  return { success: true };
}

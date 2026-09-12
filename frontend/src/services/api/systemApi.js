/**
 * System Health & Statistics API.
 * Connects to:
 * - GET /api/health
 * - GET /api/stats
 */
import { apiClient } from "./client.js";

export async function checkHealth() {
  return apiClient.get("/api/health");
}

export async function getSystemStats() {
  return apiClient.get("/api/stats");
}

export async function sendChatMessage(data) {
  return apiClient.post("/api/chat", data);
}

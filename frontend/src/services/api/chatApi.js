/**
 * Scheme Saathi AI Chatbot Client.
 * Connects to backend FastAPI POST /api/chat.
 * NEVER connects to Groq directly from the browser.
 */
import { apiClient } from "./client.js";

/**
 * Sends a message and rich journey context to the Scheme Saathi AI Chat Assistant.
 * @param {{
 *   message: string,
 *   language?: string,
 *   context?: {
 *     profile?: object,
 *     selected_scheme?: object,
 *     finance?: object,
 *     documents?: object,
 *     partner?: object,
 *     application?: object
 *   },
 *   history?: Array<{ role: string, content: string }>,
 *   sessionId?: string
 * }} payload
 * @returns {Promise<{
 *   reply: string,
 *   suggested_actions: Array<{ action_type: string, label: string, description?: string, payload?: object }>,
 *   matched_schemes: Array<object>,
 *   language: string,
 *   session_id: string,
 *   provider: string,
 *   model_used?: string,
 *   processing_time_ms: number,
 *   source_attribution?: string
 * }>}
 */
export async function sendChatMessage({
  message,
  language = "en",
  context = null,
  history = [],
  sessionId = null,
}) {
  if (!message || typeof message !== "string" || !message.trim()) {
    throw new Error("Message content cannot be empty.");
  }

  const payload = {
    message: message.trim(),
    language: language || "en",
    context: context || null,
    history: Array.isArray(history) ? history.slice(-8) : [],
    session_id: sessionId || null,
  };

  return apiClient.post("/api/chat", payload);
}

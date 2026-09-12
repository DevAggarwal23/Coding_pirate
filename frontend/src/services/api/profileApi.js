/**
 * Profile and NLP Entity Extraction API.
 * Connects to POST /api/profile/extract
 */
import { apiClient } from "./client.js";

/**
 * Extracts structured demographic and business entities from natural language text.
 * @param {string} text - User voice transcript or typed text
 * @returns {Promise<{
 *   extracted: {
 *     category: string|null,
 *     income: number|null,
 *     state: string|null,
 *     business_type: string|null,
 *     project_cost: number|null
 *   },
 *   confidence: number,
 *   missing_fields: string[],
 *   follow_up_question: string|null
 * }>}
 */
export async function extractProfile(text) {
  if (!text || typeof text !== "string" || text.trim().length < 2) {
    throw new Error("Please enter at least a few words about yourself or your business.");
  }

  return apiClient.post("/api/profile/extract", { text: text.trim() });
}

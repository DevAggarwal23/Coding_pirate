/**
 * OCR Document Verification API.
 * Connects to POST /api/ocr/verify
 */
import { apiClient } from "./client.js";

const VALID_DOC_TYPES = new Set([
  "caste_certificate",
  "income_certificate",
  "aadhaar",
  "pan_card",
  "bank_passbook",
  "business_registration",
  "project_report",
]);

/**
 * Normalizes document title to supported backend document_type.
 */
export function normalizeDocType(docTitle) {
  const lower = (docTitle || "").toLowerCase();
  if (lower.includes("caste") || lower.includes("category")) return "caste_certificate";
  if (lower.includes("income")) return "income_certificate";
  if (lower.includes("aadhaar") || lower.includes("aadhar")) return "aadhaar";
  if (lower.includes("pan")) return "pan_card";
  if (lower.includes("passbook") || lower.includes("bank statement") || lower.includes("bank account"))
    return "bank_passbook";
  if (lower.includes("business") || lower.includes("registration") || lower.includes("proof"))
    return "business_registration";
  if (lower.includes("project") || lower.includes("plan")) return "project_report";
  return "caste_certificate"; // safe fallback
}

/**
 * Uploads and verifies a document/certificate with the backend.
 * @param {File|Blob} file - Document image or PDF file
 * @param {string} docType - Document type or title
 * @param {string} [schemeId] - Optional associated Scheme ID
 * @returns {Promise<{
 *   is_valid: boolean,
 *   status: string,
 *   verification_status: string,
 *   document_type: string,
 *   filename?: string,
 *   file_format?: string,
 *   file_size_bytes?: number,
 *   file_size_formatted?: string,
 *   message?: string,
 *   issues?: string[]
 * }>}
 */
export async function verifyDocument(file, docType, schemeId = null) {
  if (!file) {
    throw new Error("No document file selected.");
  }

  const formData = new FormData();
  formData.append("document", file);
  formData.append("document_type", docType || "document");
  if (schemeId) {
    formData.append("scheme_id", schemeId);
  }

  return apiClient.post("/api/ocr/verify", formData);
}

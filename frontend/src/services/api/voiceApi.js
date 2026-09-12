/**
 * Voice Transcription API.
 * Connects to POST /api/voice/transcribe
 */
import { apiClient } from "./client.js";

/**
 * Transcribes recorded audio blob via FastAPI Whisper/Bhashini backend.
 * @param {Blob|File} audioBlob - Audio file (wav/mp3/webm/ogg)
 * @param {string} language - ISO language code (e.g. 'hi', 'en', 'bn', 'ta', 'mr', 'te')
 * @returns {Promise<{
 *   transcript: string,
 *   language_detected: string,
 *   confidence: number,
 *   processing_time_ms: number
 * }>}
 */
export async function transcribeVoice(audioBlob, language = "hi") {
  if (!audioBlob) {
    throw new Error("No audio recording provided.");
  }

  const formData = new FormData();
  // Ensure appropriate filename with extension based on MIME type
  const extension = audioBlob.type.includes("webm")
    ? "webm"
    : audioBlob.type.includes("ogg")
    ? "ogg"
    : "wav";
  formData.append("audio", audioBlob, `recording.${extension}`);
  formData.append("language", language);

  return apiClient.post("/api/voice/transcribe", formData);
}

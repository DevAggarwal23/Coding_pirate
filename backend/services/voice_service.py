"""
Voice Transcription & Multilingual Service.
Integrates Bhashini ASR (DHRUVA API), Language Detection, and NMT Translation.
Strict real-speech processing — NO fabricated/demo transcript fallbacks.
"""
import base64
import logging
import re
import time
from typing import Optional, Dict, Any
import httpx

from core.config import settings

logger = logging.getLogger(__name__)

# In-memory cache for Bhashini pipeline configurations: (task_type, source_lang, target_lang) -> (timestamp, config_dict)
_PIPELINE_CONFIG_CACHE: Dict[str, Dict[str, Any]] = {}
_CACHE_TTL_SECONDS = 3600  # 1 hour cache


def detect_script_language(text: str) -> str:
    """
    Detects language code based on unicode character ranges.
    Supported: Devanagari (hi/mr), Bengali (bn), Tamil (ta), Telugu (te),
    Kannada (kn), Malayalam (ml), Gujarati (gu), Punjabi (pa), Odia (or), English (en).
    """
    if not text or not text.strip():
        return "hi"

    # Unicode ranges for major Indian scripts
    script_ranges = [
        (r"[\u0900-\u097F]", "hi"),  # Devanagari (Hindi/Marathi)
        (r"[\u0980-\u09FF]", "bn"),  # Bengali / Assamese
        (r"[\u0B80-\u0BFF]", "ta"),  # Tamil
        (r"[\u0C00-\u0C7F]", "te"),  # Telugu
        (r"[\u0C80-\u0CFF]", "kn"),  # Kannada
        (r"[\u0D00-\u0D7F]", "ml"),  # Malayalam
        (r"[\u0A80-\u0AFF]", "gu"),  # Gujarati
        (r"[\u0A00-\u0A7F]", "pa"),  # Gurmukhi (Punjabi)
        (r"[\u0B00-\u0B7F]", "or"),  # Odia
    ]

    total_chars = len(text)
    for pattern, lang in script_ranges:
        matches = len(re.findall(pattern, text))
        if matches / max(total_chars, 1) > 0.15:
            return lang

    return "en"


def _mask_credential(key: Optional[str]) -> str:
    """Safely masks API keys for logging."""
    if not key:
        return "<none>"
    k = key.strip()
    if len(k) <= 8:
        return "***"
    return f"{k[:4]}...{k[-4:]}"


async def get_bhashini_pipeline_config(
    task_type: str = "asr",
    source_lang: str = "hi",
    target_lang: Optional[str] = None
) -> Dict[str, Any]:
    """
    Step 1 of Official Bhashini Architecture:
    Calls https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline
    to retrieve dynamic serviceId, callbackUrl, and inferenceApiKey.
    Caches configuration in memory to avoid per-request config overhead.
    Falls back gracefully to configured settings if config endpoint fails.
    """
    cache_key = f"{task_type}:{source_lang}:{target_lang or ''}"
    now = time.time()

    if cache_key in _PIPELINE_CONFIG_CACHE:
        cached_entry = _PIPELINE_CONFIG_CACHE[cache_key]
        if now - cached_entry.get("cached_at", 0) < _CACHE_TTL_SECONDS:
            return cached_entry["config"]

    user_id = (settings.bhashini_user_id or "").strip()
    ulca_key = (settings.bhashini_ulca_api_key or settings.bhashini_api_key or "").strip()
    pipeline_id = (settings.bhashini_pipeline_id or "64392f96daac500b55c543cd").strip()
    inference_key = (settings.bhashini_inference_api_key or ulca_key).strip()
    default_url = (settings.bhashini_api_url or "https://dhruva-api.bhashini.gov.in/services/inference/pipeline").strip()

    fallback_config = {
        "serviceId": None,
        "callbackUrl": default_url,
        "inferenceApiKey": inference_key,
    }

    # If credentials are not set, return fallback
    if not user_id or not ulca_key:
        return fallback_config

    config_url = "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline"
    headers = {
        "Content-Type": "application/json",
        "userID": user_id,
        "ulcaApiKey": ulca_key,
    }

    task_cfg: Dict[str, Any] = {"language": {"sourceLanguage": source_lang}}
    if target_lang:
        task_cfg["language"]["targetLanguage"] = target_lang

    payload = {
        "pipelineTasks": [
            {
                "taskType": task_type,
                "config": task_cfg
            }
        ],
        "pipelineRequestConfig": {
            "pipelineId": pipeline_id
        }
    }

    try:
        masked_ulca = _mask_credential(ulca_key)
        logger.info(f"Querying Bhashini pipeline config for task={task_type}, lang={source_lang} (user={user_id[:6]}..., key={masked_ulca})...")
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(config_url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                service_id = None
                
                # Extract serviceId from pipelineResponseConfig
                resp_configs = data.get("pipelineResponseConfig", [])
                for rc in resp_configs:
                    if rc.get("taskType") == task_type:
                        config_list = rc.get("config", [])
                        if config_list and isinstance(config_list, list):
                            service_id = config_list[0].get("serviceId")
                            break

                # Extract callbackUrl and dynamic inferenceApiKey
                endpoint_info = data.get("pipelineInferenceAPIEndPoint", {})
                callback_url = endpoint_info.get("callbackUrl") or default_url
                
                api_key_info = endpoint_info.get("inferenceApiKey", {})
                dynamic_key = api_key_info.get("value") if isinstance(api_key_info, dict) else None
                resolved_key = dynamic_key or inference_key

                resolved_config = {
                    "serviceId": service_id,
                    "callbackUrl": callback_url,
                    "inferenceApiKey": resolved_key,
                }

                logger.info(f"Bhashini pipeline config resolved: serviceId={service_id}, callbackUrl={callback_url}")
                _PIPELINE_CONFIG_CACHE[cache_key] = {
                    "cached_at": now,
                    "config": resolved_config
                }
                return resolved_config
            else:
                logger.info(f"Bhashini getModelsPipeline returned {resp.status_code}. Using direct inference config.")
    except Exception as ex:
        logger.warning(f"Bhashini pipeline config lookup skipped ({type(ex).__name__}): {ex}. Using direct inference config.")

    # Cache fallback to prevent rapid retries on failure
    _PIPELINE_CONFIG_CACHE[cache_key] = {
        "cached_at": now,
        "config": fallback_config
    }
    return fallback_config


async def call_bhashini_asr(audio_bytes: bytes, language: str = "hi") -> Optional[Dict[str, Any]]:
    """
    Dispatches audio bytes to Bhashini DHRUVA ASR inference pipeline.

    :param audio_bytes: Raw audio binary data (WAV PCM 16kHz)
    :param language: Target source language code (default 'hi')
    :return: dict with transcript and metadata, or None if call fails
    """
    if not settings.bhashini_enabled:
        logger.warning("Bhashini ASR is disabled in settings.")
        return None

    lang_code = (language or "hi").strip().lower()

    # Step 1: Resolve pipeline config (serviceId, callbackUrl, inferenceApiKey)
    pipeline_config = await get_bhashini_pipeline_config(task_type="asr", source_lang=lang_code)
    
    inference_key = (
        pipeline_config.get("inferenceApiKey")
        or settings.bhashini_inference_api_key
        or settings.bhashini_ulca_api_key
        or settings.bhashini_api_key
        or ""
    ).strip()

    callback_url = (
        pipeline_config.get("callbackUrl")
        or settings.bhashini_api_url
        or "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"
    ).strip()

    is_placeholder_key = (
        not inference_key
        or "<" in inference_key
        or "paste" in inference_key.lower()
        or len(inference_key) < 10
    )

    if is_placeholder_key:
        logger.warning("Bhashini ASR credentials pending or invalid.")
        return None

    audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

    asr_config: Dict[str, Any] = {
        "language": {
            "sourceLanguage": lang_code
        },
        "audioFormat": "wav",
        "samplingRate": 16000
    }

    if pipeline_config.get("serviceId"):
        asr_config["serviceId"] = pipeline_config["serviceId"]

    payload = {
        "pipelineTasks": [
            {
                "taskType": "asr",
                "config": asr_config
            }
        ],
        "inputData": {
            "audio": [
                {
                    "audioContent": audio_b64
                }
            ]
        }
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": inference_key,
    }

    try:
        masked_key = _mask_credential(inference_key)
        service_info = asr_config.get("serviceId", "default")
        logger.info(f"Calling Bhashini ASR (url={callback_url}, auth={masked_key}, lang={lang_code}, service={service_info})...")

        t0 = time.time()
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(callback_url, json=payload, headers=headers)
            bhashini_call_ms = int((time.time() - t0) * 1000)

            if resp.status_code == 200:
                data = resp.json()
                pipeline_resp = data.get("pipelineResponse", [])
                if pipeline_resp and len(pipeline_resp) > 0:
                    output_list = pipeline_resp[0].get("output", [])
                    if output_list and len(output_list) > 0:
                        transcript_text = output_list[0].get("source", "").strip()
                        if transcript_text:
                            resp_config = pipeline_resp[0].get("config") or {}
                            lang_dict = resp_config.get("language") or {}
                            detected_lang = (
                                lang_dict.get("sourceLanguage")
                                or detect_script_language(transcript_text)
                                or lang_code
                            )
                            logger.info(f"Bhashini ASR succeeded (lang={detected_lang}): {transcript_text[:60]}")
                            return {
                                "transcript": transcript_text,
                                "language_detected": detected_lang,
                                "confidence": 0.95,
                                "source": "bhashini_asr",
                            }
                logger.info(f"Bhashini ASR returned empty transcription for input audio.")
            else:
                logger.warning(
                    f"Bhashini ASR HTTP error {resp.status_code}: {resp.text[:150]}"
                )
    except httpx.TimeoutException:
        logger.warning("Bhashini ASR request timed out after 15s.")
    except Exception as ex:
        logger.warning(f"Bhashini ASR invocation failed ({type(ex).__name__}): {ex}")

    return None


async def call_bhashini_translation(text: str, source_lang: str, target_lang: str = "hi") -> Optional[str]:
    """
    Translates text via Bhashini NMT pipeline when needed for regional languages.
    """
    if not settings.bhashini_enabled or not text or not text.strip():
        return None

    if source_lang == target_lang or source_lang in {"hi", "en"}:
        return text

    pipeline_config = await get_bhashini_pipeline_config(
        task_type="translation",
        source_lang=source_lang,
        target_lang=target_lang
    )

    inference_key = (
        pipeline_config.get("inferenceApiKey")
        or settings.bhashini_inference_api_key
        or settings.bhashini_ulca_api_key
        or settings.bhashini_api_key
        or ""
    ).strip()

    callback_url = (
        pipeline_config.get("callbackUrl")
        or settings.bhashini_api_url
        or "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"
    ).strip()

    if not inference_key or len(inference_key) < 10:
        return None

    nmt_config: Dict[str, Any] = {
        "language": {
            "sourceLanguage": source_lang,
            "targetLanguage": target_lang,
        }
    }
    if pipeline_config.get("serviceId"):
        nmt_config["serviceId"] = pipeline_config["serviceId"]

    payload = {
        "pipelineTasks": [
            {
                "taskType": "translation",
                "config": nmt_config
            }
        ],
        "inputData": {
            "input": [
                {
                    "source": text
                }
            ]
        }
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": inference_key,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(callback_url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                pipeline_resp = data.get("pipelineResponse", [])
                if pipeline_resp and len(pipeline_resp) > 0:
                    output_list = pipeline_resp[0].get("output", [])
                    if output_list and len(output_list) > 0:
                        translated_text = output_list[0].get("target", "").strip()
                        if translated_text:
                            return translated_text
    except Exception as ex:
        logger.warning(f"Bhashini NMT translation skipped: {ex}")

    return None


async def call_whisper_fallback(audio_bytes: bytes, language: str = "hi") -> Optional[Dict[str, Any]]:
    """
    Fallback ASR using Whisper Large v3 via Groq API or local Whisper.
    Provides fast, resilient transcription when Bhashini ASR endpoint is unreachable.
    """
    import os
    groq_key = (getattr(settings, "groq_api_key", None) or os.getenv("GROQ_API_KEY") or "").strip()
    if not groq_key or len(groq_key) < 10:
        return None

    try:
        lang_code = (language or "hi").strip().lower()
        async with httpx.AsyncClient(timeout=12.0) as client:
            files = {"file": ("recording.wav", audio_bytes, "audio/wav")}
            data = {
                "model": "whisper-large-v3",
                "language": lang_code if lang_code in {"hi", "en", "bn", "ta", "mr", "te", "gu", "kn", "ml", "pa", "or", "ur"} else "hi",
                "response_format": "json",
                "temperature": 0.0,
            }
            headers = {"Authorization": f"Bearer {groq_key}"}
            resp = await client.post(
                "https://api.groq.com/openai/v1/audio/transcriptions",
                files=files,
                data=data,
                headers=headers,
            )
            if resp.status_code == 200:
                body = resp.json()
                text = (body.get("text") or "").strip()
                if text:
                    detected_lang = detect_script_language(text) or lang_code
                    logger.info(f"Whisper fallback ASR succeeded (lang={detected_lang}): {text[:60]}")
                    return {
                        "transcript": text,
                        "language_detected": detected_lang,
                        "confidence": 0.94,
                        "source": "whisper_fallback",
                    }
    except Exception as ex:
        logger.warning(f"Whisper fallback invocation failed ({type(ex).__name__}): {ex}")

    return None


async def transcribe_audio(audio_bytes: bytes, language: str = "hi") -> dict:
    """
    Transcribes actual audio bytes using Bhashini ASR with automatic Whisper fallback.
    Returns the real transcript or raises an error if all services fail.
    NO fabricated/demo transcripts.
    """
    if not audio_bytes or len(audio_bytes) < 10:
        raise ValueError("Audio buffer is empty or too short.")

    start_time = time.time()
    lang_code = (language or "hi").strip().lower()

    # 1. Primary: Call live Bhashini ASR
    bhashini_result = await call_bhashini_asr(audio_bytes, language=lang_code)

    if bhashini_result and bhashini_result.get("transcript"):
        transcript = bhashini_result["transcript"].strip()
        if transcript:
            detected_lang = bhashini_result.get("language_detected") or detect_script_language(transcript)
            elapsed_ms = int((time.time() - start_time) * 1000)
            logger.info(f"VOICE_PERF (Bhashini): audio_size_bytes={len(audio_bytes)}, language={detected_lang}, processing_time_ms={elapsed_ms}")
            return {
                "transcript": transcript,
                "language_detected": detected_lang,
                "confidence": bhashini_result.get("confidence", 0.95),
                "processing_time_ms": max(elapsed_ms, 10),
            }

    # 2. Secondary: Robust Whisper fallback
    whisper_result = await call_whisper_fallback(audio_bytes, language=lang_code)
    if whisper_result and whisper_result.get("transcript"):
        transcript = whisper_result["transcript"].strip()
        if transcript:
            detected_lang = whisper_result.get("language_detected") or detect_script_language(transcript)
            elapsed_ms = int((time.time() - start_time) * 1000)
            logger.info(f"VOICE_PERF (Whisper): audio_size_bytes={len(audio_bytes)}, language={detected_lang}, processing_time_ms={elapsed_ms}")
            return {
                "transcript": transcript,
                "language_detected": detected_lang,
                "confidence": whisper_result.get("confidence", 0.94),
                "processing_time_ms": max(elapsed_ms, 10),
            }

    # Raise explicit error when both ASR services fail
    raise RuntimeError(
        "Bhashini / Whisper speech-to-text service is currently unavailable or returned an error. Please try again or use text input."
    )



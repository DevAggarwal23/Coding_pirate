"""
Bhashini API Router for SchemeSaathi.
Exposes endpoints for Bhashini NMT Translation, Script/Language Detection,
and DHRUVA Pipeline Configuration.
"""
import logging
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Depends

from core.config import settings
from services.voice_service import (
    call_bhashini_translation,
    get_bhashini_pipeline_config,
    detect_script_language,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/bhashini", tags=["Bhashini"])


class TranslationRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Text to translate")
    source_lang: str = Field(default="en", description="Source language code (e.g. en, hi, bn, ta, te)")
    target_lang: str = Field(default="hi", description="Target language code (e.g. hi, en, bn, ta, te)")


class TranslationResponse(BaseModel):
    translated_text: str = Field(..., description="Translated text")
    source_lang: str = Field(..., description="Source language code")
    target_lang: str = Field(..., description="Target language code")
    provider: str = Field(default="bhashini_nmt", description="Provider name")


class LanguageDetectionRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Input text to analyze")


class LanguageDetectionResponse(BaseModel):
    detected_language: str = Field(..., description="Detected ISO language code (e.g., 'hi', 'en', 'bn')")
    text_length: int = Field(..., description="Length of input text")


class BhashiniStatusResponse(BaseModel):
    enabled: bool = Field(..., description="Whether Bhashini live API is active")
    api_url: str = Field(..., description="DHRUVA API endpoint URL")
    pipeline_id: Optional[str] = Field(None, description="Bhashini Pipeline ID")
    supported_languages: list[str] = Field(default_factory=list, description="Supported Indian languages")
    has_credentials: bool = Field(..., description="Whether required API credentials are configured")


@router.get("/status", response_model=BhashiniStatusResponse)
async def get_bhashini_status():
    """
    Returns current Bhashini API integration status and configuration.
    Safely omits sensitive keys.
    """
    has_creds = bool(
        (settings.bhashini_user_id and (settings.bhashini_ulca_api_key or settings.bhashini_api_key))
    )
    return BhashiniStatusResponse(
        enabled=settings.bhashini_enabled,
        api_url=settings.bhashini_api_url or "https://dhruva-api.bhashini.gov.in/services/inference/pipeline",
        pipeline_id=settings.bhashini_pipeline_id or "64392f96daac500b55c543cd",
        supported_languages=["hi", "en", "ta", "te", "bn", "mr", "gu", "kn", "ml", "pa", "or"],
        has_credentials=has_creds,
    )


@router.post("/translate", response_model=TranslationResponse)
async def translate_text(payload: TranslationRequest):
    """
    Translates text between Indian languages and English using Bhashini NMT.
    """
    try:
        translated = await call_bhashini_translation(
            text=payload.text,
            source_lang=payload.source_lang,
            target_lang=payload.target_lang,
        )
        if not translated:
            return TranslationResponse(
                translated_text=payload.text,
                source_lang=payload.source_lang,
                target_lang=payload.target_lang,
                provider="fallback_passthrough",
            )
        return TranslationResponse(
            translated_text=translated,
            source_lang=payload.source_lang,
            target_lang=payload.target_lang,
            provider="bhashini_nmt",
        )
    except Exception as e:
        logger.error(f"Bhashini translation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Translation error: {str(e)}")


@router.post("/detect-language", response_model=LanguageDetectionResponse)
async def detect_language_endpoint(payload: LanguageDetectionRequest):
    """
    Detects the Indian language script of the given text.
    """
    detected = detect_script_language(payload.text)
    return LanguageDetectionResponse(
        detected_language=detected,
        text_length=len(payload.text),
    )


@router.get("/config")
async def get_pipeline_config(
    task_type: str = "asr",
    source_lang: str = "hi",
    target_lang: Optional[str] = None,
):
    """
    Fetches dynamic DHRUVA pipeline configuration for the specified task and language pair.
    """
    try:
        config = await get_bhashini_pipeline_config(
            task_type=task_type,
            source_lang=source_lang,
            target_lang=target_lang,
        )
        safe_config = {
            "serviceId": config.get("serviceId"),
            "callbackUrl": config.get("callbackUrl"),
            "hasInferenceKey": bool(config.get("inferenceApiKey")),
        }
        return safe_config
    except Exception as e:
        logger.error(f"Failed to fetch Bhashini pipeline config: {e}")
        raise HTTPException(status_code=500, detail=f"Pipeline config error: {str(e)}")

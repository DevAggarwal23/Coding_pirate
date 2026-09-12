"""
Tests for Bhashini Voice Transcription Service & NLP Integration.
Includes unit tests with mocked Bhashini API, language detection,
error/timeout resilience, and transcript-to-NLP pipeline verification.
"""
import pytest
from unittest.mock import patch, AsyncMock
import httpx

from schemas.voice import VoiceTranscribeResponse
from services.voice_service import (
    transcribe_audio,
    call_bhashini_asr,
    detect_script_language,
)
from services.nlp_service import extract_profile
from services.matcher_service import match_schemes_from_list
from services.scheme_service import _load_schemes_from_json


class TestLanguageDetection:
    """Test unicode-based script language detection."""

    def test_detect_hindi_devanagari(self):
        text = "मेरी दर्जी की दुकान है उत्तर प्रदेश में"
        assert detect_script_language(text) == "hi"

    def test_detect_english_latin(self):
        text = "I want to start a dairy farm in Uttar Pradesh"
        assert detect_script_language(text) == "en"

    def test_detect_bengali(self):
        text = "আমি একটি দুগ্ধ খামার শুরু করতে চাই"
        assert detect_script_language(text) == "bn"

    def test_detect_tamil(self):
        text = "நான் ஒரு பால் பண்ணை தொடங்க விரும்புகிறேன்"
        assert detect_script_language(text) == "ta"

    def test_detect_telugu(self):
        text = "నేను పాల వ్యాపారం ప్రారంభించాలనుకుంటున్నాను"
        assert detect_script_language(text) == "te"


class TestBhashiniASR:
    """Test Bhashini ASR pipeline calls with mocking."""

    @pytest.mark.asyncio
    async def test_bhashini_successful_hindi_transcription(self):
        """Mock successful Bhashini ASR response for Hindi audio."""
        mock_response_data = {
            "pipelineResponse": [
                {
                    "taskType": "asr",
                    "config": {
                        "language": {"sourceLanguage": "hi"}
                    },
                    "output": [
                        {
                            "source": "Main SC category se hoon meri income 3 lakh hai UP mein dairy business"
                        }
                    ]
                }
            ]
        }

        mock_resp = httpx.Response(
            status_code=200,
            json=mock_response_data,
            request=httpx.Request("POST", "https://dhruva-api.bhashini.gov.in/services/inference/pipeline")
        )

        with patch("core.config.settings.bhashini_enabled", True), \
             patch("core.config.settings.bhashini_user_id", "test_user_id_12345"), \
             patch("core.config.settings.bhashini_ulca_api_key", "test_ulca_api_key_valid_12345"), \
             patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_resp

            dummy_audio = b"RIFF" + b"\x00" * 500
            result = await call_bhashini_asr(dummy_audio, language="hi")

            assert result is not None
            assert "Main SC category" in result["transcript"]
            assert result["language_detected"] == "hi"
            assert result["confidence"] >= 0.9

    @pytest.mark.asyncio
    async def test_bhashini_successful_english_transcription(self):
        """Mock successful Bhashini ASR response for English audio."""
        mock_response_data = {
            "pipelineResponse": [
                {
                    "taskType": "asr",
                    "config": {
                        "language": {"sourceLanguage": "en"}
                    },
                    "output": [
                        {
                            "source": "I belong to SC category with 3 lakh annual income in Uttar Pradesh"
                        }
                    ]
                }
            ]
        }

        mock_resp = httpx.Response(
            status_code=200,
            json=mock_response_data,
            request=httpx.Request("POST", "https://dhruva-api.bhashini.gov.in/services/inference/pipeline")
        )

        with patch("core.config.settings.bhashini_enabled", True), \
             patch("core.config.settings.bhashini_user_id", "test_user_id_12345"), \
             patch("core.config.settings.bhashini_ulca_api_key", "test_ulca_api_key_valid_12345"), \
             patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_resp

            dummy_audio = b"RIFF" + b"\x00" * 500
            result = await call_bhashini_asr(dummy_audio, language="en")

            assert result is not None
            assert "belong to SC category" in result["transcript"]
            assert result["language_detected"] == "en"

    @pytest.mark.asyncio
    async def test_bhashini_timeout_handled_gracefully(self):
        """Timeout must raise explicit RuntimeError indicating service unavailability (no fake transcripts)."""
        with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("Read timed out")):
            dummy_audio = b"RIFF" + b"\x00" * 500
            with pytest.raises(RuntimeError) as exc_info:
                await transcribe_audio(dummy_audio, language="hi")
            assert "unavailable" in str(exc_info.value).lower() or "bhashini" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_bhashini_server_error_handled_gracefully(self):
        """HTTP 500 error must raise explicit RuntimeError indicating service error (no fake transcripts)."""
        mock_resp = httpx.Response(
            status_code=500,
            text="Internal Bhashini Server Error",
            request=httpx.Request("POST", "https://dhruva-api.bhashini.gov.in/services/inference/pipeline")
        )

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_resp

            dummy_audio = b"RIFF" + b"\x00" * 500
            with pytest.raises(RuntimeError) as exc_info:
                await transcribe_audio(dummy_audio, language="hi")
            assert "unavailable" in str(exc_info.value).lower() or "bhashini" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_empty_audio_raises_error(self):
        """Empty audio bytes must raise ValueError."""
        with pytest.raises(ValueError) as exc_info:
            await transcribe_audio(b"", language="hi")
        assert "empty" in str(exc_info.value).lower() or "short" in str(exc_info.value).lower()


class TestVoiceToNLPAndMatchingPipeline:
    """Golden demo test: Voice Transcript -> NLP Extraction -> Scheme Matching."""

    @pytest.mark.asyncio
    async def test_voice_transcript_feeds_nlp_and_matching(self):
        """
        Verify that Bhashini transcript seamlessly feeds into existing NLP
        and matching pipeline.
        """
        # 1. Voice returns transcript
        voice_transcript = (
            "Main SC category se hoon, meri family income 3 lakh hai. "
            "Uttar Pradesh mein dairy business start karna chahta hoon "
            "aur mujhe 5 lakh ki financial assistance chahiye."
        )

        # 2. Feed directly into existing NLP
        extracted = extract_profile(voice_transcript)

        assert extracted["category"] == "SC"
        assert extracted["income"] == 300000
        assert extracted["state"] == "Uttar Pradesh"
        assert extracted["business_type"] == "dairy"
        assert extracted["project_cost"] == 500000

        # 3. Feed extracted profile into scheme matcher
        schemes = _load_schemes_from_json()
        match_res = match_schemes_from_list(extracted, schemes)

        assert len(match_res["auto_matched"]) > 0
        top_scheme = match_res["auto_matched"][0]
        assert top_scheme["confidence"] >= 0.85
        assert "SC category" in top_scheme["why_matched"]

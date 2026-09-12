from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.dependencies import get_db
from schemas.voice import VoiceTranscribeResponse, VoiceSessionResponse, VoiceSessionsListResponse
from services.voice_service import transcribe_audio
from services.voice_session_service import (
    create_voice_session,
    complete_voice_session,
    fail_voice_session,
    get_voice_session,
    list_voice_sessions,
)
import logging
import uuid

router = APIRouter(prefix="/api/voice", tags=["Voice"])
logger = logging.getLogger(__name__)


@router.post("/transcribe", response_model=VoiceTranscribeResponse)
async def transcribe_voice(
    audio: UploadFile = File(..., description="Audio file (WAV/MP3/WebM/OGG)"),
    language: str = Form(default="hi", description="Language code: hi/en/ta/te/bn/mr/gu/kn/ml/pa/or"),
    session_id: Optional[str] = Form(default=None, description="Voice interaction session ID"),
    user_id: Optional[str] = Form(default=None, description="Beneficiary user profile ID"),
    db: AsyncSession = Depends(get_db),
):
    """
    Transcribe voice audio to text using Bhashini ASR (DHRUVA API).
    Accepts real audio from mobile/desktop browser MediaRecorder and IVR streams.
    Persists session metadata, processing state, and confidence scores.
    """
    allowed_types = {
        "audio/wav", "audio/mp3", "audio/mpeg", "audio/webm",
        "audio/ogg", "audio/x-wav", "audio/wave", "audio/aac",
        "audio/mp4", "audio/m4a", "audio/x-m4a", "application/octet-stream"
    }

    content_type_base = (audio.content_type or "").split(";")[0].strip().lower()
    
    if content_type_base and content_type_base not in allowed_types:
        ext = (audio.filename or "").split(".")[-1].lower()
        if ext not in {"wav", "mp3", "webm", "ogg", "m4a", "aac", "bin"}:
            raise HTTPException(
                status_code=415,
                detail=f"Unsupported audio format: {audio.content_type}. Use WAV, MP3, WebM, or OGG."
            )

    audio_bytes = await audio.read()
    if len(audio_bytes) > 15 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Audio file too large. Max size: 15MB.")

    if len(audio_bytes) < 50:
        raise HTTPException(status_code=400, detail="Audio too short or empty.")

    # Create persistent voice session record
    active_session_id = await create_voice_session(
        language=language,
        input_format=content_type_base or audio.filename,
        session_id=session_id or str(uuid.uuid4()),
        user_id=user_id,
        db=db,
    )

    try:
        result = await transcribe_audio(audio_bytes, language=language)
        
        # Complete voice session in database
        await complete_voice_session(
            session_id=active_session_id,
            transcript=result.get("transcript", ""),
            confidence=result.get("confidence", 0.95),
            language=result.get("language_detected", language),
            duration_seconds=result.get("processing_time_ms", 0) / 1000.0,
            db=db,
        )

        return VoiceTranscribeResponse(
            transcript=result.get("transcript", ""),
            language_detected=result.get("language_detected", language),
            confidence=result.get("confidence", 0.95),
            processing_time_ms=result.get("processing_time_ms", 0),
            session_id=active_session_id,
            processing_status="COMPLETED",
        )
    except ValueError as ve:
        await fail_voice_session(active_session_id, error_code="INVALID_AUDIO", db=db)
        raise HTTPException(status_code=400, detail=str(ve))
    except RuntimeError as re:
        await fail_voice_session(active_session_id, error_code="ASR_UNAVAILABLE", db=db)
        raise HTTPException(status_code=503, detail=str(re))
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        await fail_voice_session(active_session_id, error_code="INTERNAL_ERROR", db=db)
        raise HTTPException(status_code=500, detail=f"Audio transcription error: {str(e)}")


@router.get("/sessions/{session_id}", response_model=VoiceSessionResponse)
async def get_voice_session_endpoint(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve metadata and status for a specific voice session."""
    record = await get_voice_session(session_id, db=db)
    if not record:
        raise HTTPException(status_code=404, detail="Voice session not found")
    return VoiceSessionResponse(**record)


@router.get("/sessions", response_model=VoiceSessionsListResponse)
async def list_voice_sessions_endpoint(
    user_id: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """List voice sessions with optional user_id filter."""
    records = await list_voice_sessions(user_id=user_id, limit=limit, offset=offset, db=db)
    return VoiceSessionsListResponse(
        sessions=[VoiceSessionResponse(**r) for r in records],
        total=len(records),
    )

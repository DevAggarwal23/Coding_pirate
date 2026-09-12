"""Voice transcription schemas."""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class VoiceTranscribeResponse(BaseModel):
    transcript: str = Field(..., description="Transcribed text from audio")
    language_detected: str = Field(default="hi", description="Detected language code (e.g., 'hi', 'en')")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Confidence score between 0.0 and 1.0")
    processing_time_ms: int = Field(default=0, ge=0, description="Processing duration in milliseconds")
    session_id: Optional[str] = Field(None, description="Voice interaction session ID")
    processing_status: Optional[str] = Field(default="COMPLETED", description="CREATED | PROCESSING | COMPLETED | FAILED")


class VoiceSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    language: str
    input_format: Optional[str] = None
    duration_seconds: Optional[float] = None
    transcript: Optional[str] = None
    transcription_confidence: Optional[float] = None
    processing_status: str
    provider: str
    error_code: Optional[str] = None
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class VoiceSessionsListResponse(BaseModel):
    sessions: list[VoiceSessionResponse] = Field(default_factory=list)
    total: int = 0

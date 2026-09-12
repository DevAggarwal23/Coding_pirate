"""
SIH26092 — Context-Aware AI Chatbot Router.
Connects FastAPI to the Groq AI service & contextual synthesizer.
Secured with authenticated user context derivation.
"""
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.dependencies import get_db, get_optional_user
from schemas.auth import UserResponse
from schemas.chat import ChatRequest, ChatResponse
from services import groq_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["AI Chatbot"])


@router.post("", response_model=ChatResponse, status_code=status.HTTP_200_OK)
@router.post("/", response_model=ChatResponse, status_code=status.HTTP_200_OK)
@router.post("/query", response_model=ChatResponse, status_code=status.HTTP_200_OK)
@router.post("/message", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def handle_chat_message(
    request: ChatRequest,
    current_user: Optional[UserResponse] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Advanced Context-Aware AI Chatbot Endpoint.
    Accepts beneficiary queries along with optional multi-domain journey context.
    Ensures that chatbot context is bound to the current authenticated user.
    """
    if not request.message or not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty.",
        )

    # Secure Context Scoping: If user is authenticated, associate user context
    if current_user and request.context:
        if hasattr(request.context, "user_id"):
            request.context.user_id = current_user.id

    try:
        response = await groq_service.generate_chat_response(request=request, db=db)
        return response
    except Exception as e:
        logger.error(f"Chat execution failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI Assistant is temporarily unavailable. Please try again.",
        )

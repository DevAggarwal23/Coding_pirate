"""
SIH26092 — Google Authentication & Session Router.
Endpoints:
- POST /api/auth/google   : Verify Google ID token, provision user, return session token
- GET  /api/auth/me       : Restore authenticated session and return current user profile
- POST /api/auth/logout   : Invalidate current session token
- GET  /api/auth/config   : Expose public Google client ID for frontend GIS initialization
"""
import logging
from fastapi import APIRouter, HTTPException, Depends, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from core.database import get_db
from core.config import settings
from core.dependencies import get_current_user
from schemas.auth import (
    GoogleAuthRequest,
    UserResponse,
    AuthTokenResponse,
    AuthConfigResponse,
)
from services.auth_service import (
    verify_google_id_token,
    get_or_create_user,
    create_user_session,
    revoke_user_session,
    SESSION_LIFESPAN_SEC,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)


@router.get("/config", response_model=AuthConfigResponse)
async def get_auth_config():
    """
    Returns public Google OAuth 2.0 configuration for client-side GIS initialization.
    NEVER exposes client secrets or private keys.
    """
    return AuthConfigResponse(
        google_client_id=settings.google_client_id or "",
        environment=settings.environment,
    )


@router.post("/google", response_model=AuthTokenResponse, status_code=status.HTTP_200_OK)
async def authenticate_google(
    request: GoogleAuthRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticates a user via Google OAuth 2.0 ID token.
    1. Verifies token authenticity, issuer, audience, and expiration with Google.
    2. Retrieves or provisions user profile in Scheme Saathi database with applicant role.
    3. Issues a cryptographically secure session token.
    """
    try:
        google_claims = await verify_google_id_token(request.id_token)
    except ValueError as ve:
        logger.warning(f"Google authentication validation failed: {ve}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(ve),
        )
    except Exception as e:
        logger.error(f"Unexpected error validating Google credential: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to authenticate with Google. Please try again.",
        )

    try:
        user_record = await get_or_create_user(google_claims, db=db)
        token = await create_user_session(user_record, db=db)

        user_response = UserResponse(
            id=user_record["id"],
            email=user_record["email"],
            name=user_record.get("name"),
            picture=user_record.get("picture_url"),
            role=user_record.get("role", "applicant"),
            created_at=user_record.get("created_at"),
        )

        return AuthTokenResponse(
            access_token=token,
            token_type="bearer",
            user=user_response,
            expires_in_seconds=SESSION_LIFESPAN_SEC,
        )
    except Exception as e:
        logger.error(f"Failed to provision user session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication succeeded but failed to initialize session: {str(e)}",
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Returns the current authenticated user's profile info.
    Used on app load to restore authenticated session state from localStorage.
    """
    return current_user


@router.post("/logout")
async def logout(
    authorization: Optional[str] = Header(None, description="Bearer <session_token>"),
    db: AsyncSession = Depends(get_db),
):
    """
    Revokes the active session token and clears server-side session cache.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
        await revoke_user_session(token, db=db)
    return {
        "status": "success",
        "message": "Successfully logged out. Session has been invalidated.",
    }

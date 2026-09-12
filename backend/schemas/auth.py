from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field


class GoogleAuthRequest(BaseModel):
    id_token: str = Field(..., description="Google OAuth 2.0 ID token or verified credential string")
    profile_hint: Optional[Dict[str, Any]] = Field(default=None, description="Optional local profile data to migrate")


class UserResponse(BaseModel):
    id: str = Field(..., description="Internal unique user UUID")
    email: str = Field(..., description="User email address")
    name: Optional[str] = Field(default=None, description="User full display name")
    picture: Optional[str] = Field(default=None, description="User avatar image URL")
    role: str = Field(default="applicant", description="User role: applicant | nodal_officer | super_admin")
    created_at: Optional[str] = Field(default=None, description="ISO timestamp of account creation")


class AuthTokenResponse(BaseModel):
    access_token: str = Field(..., description="Authenticated session bearer token")
    token_type: str = Field(default="bearer", description="Token type")
    user: UserResponse = Field(..., description="Authenticated user profile info")
    expires_in_seconds: int = Field(default=259200, description="Token validity in seconds (72 hours)")


class AuthConfigResponse(BaseModel):
    google_client_id: str = Field(..., description="Public Google OAuth 2.0 Client ID")
    environment: str = Field(default="development", description="Current backend environment")

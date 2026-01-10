"""
Authentication Endpoints
Signup, login, logout, refresh token
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.auth import UserSignup, UserLogin, TokenResponse, RefreshTokenRequest
from app.schemas.user import UserResponse
from app.services.auth_service import signup_user, login_user, refresh_access_token
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    user_data: UserSignup,
    db: AsyncSession = Depends(get_db)
):
    """Create a new user account"""
    user = await signup_user(db, user_data)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """Login and receive access + refresh tokens"""
    return await login_user(db, login_data)


@router.post("/refresh", response_model=dict)
async def refresh_token(
    token_data: RefreshTokenRequest
):
    """Refresh access token using refresh token"""
    return await refresh_access_token(token_data.refresh_token)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current authenticated user information"""
    return current_user


@router.post("/logout")
async def logout():
    """Logout endpoint (client should discard tokens)"""
    return {"message": "Successfully logged out"}


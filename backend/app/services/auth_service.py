import logging
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from app.repositories.user_repository import user_repository
from app.core.security import verify_password, create_access_token
from app.schemas.auth_schema import LoginRequest, TokenResponse, UserResponse

logger = logging.getLogger(__name__)

class AuthService:
    async def authenticate_user(self, login_data: LoginRequest) -> TokenResponse:
        """Authenticate user with email and password and issue JWT token."""
        user = await user_repository.get_by_email(login_data.email)
        if not user:
            logger.warning(f"Login failed: User not found for email '{login_data.email}'")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not verify_password(login_data.password, user.get("passwordHash", "")):
            logger.warning(f"Login failed: Incorrect password for user '{login_data.email}'")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_id_str = str(user["_id"])
        access_token = create_access_token(
            subject=user_id_str,
            role=user.get("role", "ADMIN")
        )

        user_response = UserResponse(
            id=user_id_str,
            name=user.get("name", "Admin"),
            email=user.get("email"),
            role=user.get("role", "ADMIN"),
            createdAt=user.get("createdAt")
        )

        logger.info(f"User '{login_data.email}' logged in successfully.")
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )

    async def get_user_by_id(self, user_id: str) -> Optional[UserResponse]:
        """Fetch sanitized user profile by user ID."""
        user = await user_repository.get_by_id(user_id)
        if not user:
            return None
        return UserResponse(
            id=str(user["_id"]),
            name=user.get("name", "Admin"),
            email=user.get("email"),
            role=user.get("role", "ADMIN"),
            createdAt=user.get("createdAt")
        )

auth_service = AuthService()

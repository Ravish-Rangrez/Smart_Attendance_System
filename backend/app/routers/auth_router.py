from fastapi import APIRouter, Depends, status
from app.schemas.auth_schema import LoginRequest, TokenResponse, UserResponse
from app.services.auth_service import auth_service
from app.dependencies.auth_dependency import get_current_user
from app.utils.response_utils import success_response

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post(
    "/login",
    summary="Admin Login",
    description="Authenticate with email & password and receive JWT bearer token."
)
async def login(login_data: LoginRequest):
    token_response = await auth_service.authenticate_user(login_data)
    return success_response(
        data=token_response.model_dump(),
        message="Login successful"
    )

@router.get(
    "/me",
    summary="Get Current User Profile",
    description="Retrieve profile of the currently authenticated administrator."
)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    return success_response(
        data=current_user.model_dump(),
        message="Profile retrieved successfully"
    )

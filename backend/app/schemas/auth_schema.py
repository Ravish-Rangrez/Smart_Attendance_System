from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class LoginRequest(BaseModel):
    email: EmailStr = Field(..., example="admin@smartattendance.com")
    password: str = Field(..., min_length=4, example="admin123")

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    createdAt: Optional[datetime] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

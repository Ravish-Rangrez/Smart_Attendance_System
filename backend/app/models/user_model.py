from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    email: EmailStr
    passwordHash: str
    role: str = "ADMIN"
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

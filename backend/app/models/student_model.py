from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field

class StudentModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    studentId: str = Field(..., description="Unique College Roll/Student ID (e.g., STU001)")
    name: str = Field(..., description="Full Name of the student")
    department: str = Field(..., description="Department (e.g., Computer Engineering)")
    className: str = Field(..., description="Class Name (e.g., B.Tech A)")
    faceEncoding: Optional[List[float]] = Field(default=None, description="128D/512D facial embedding vector")
    registeredAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    isActive: bool = Field(default=True)

    class Config:
        populate_by_name = True

from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field

class AttendanceRecordModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    sessionId: str = Field(..., description="AttendanceSession ObjectId")
    studentId: str = Field(..., description="Student ObjectId")
    studentRollNumber: str = Field(..., description="College Student ID (e.g. STU001)")
    studentName: str = Field(..., description="Student Name")
    status: str = Field(default="PRESENT", description="PRESENT or ABSENT")
    markedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True

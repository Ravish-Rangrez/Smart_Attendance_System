from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field

class AttendanceSessionModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    subjectId: str = Field(..., description="Subject ObjectId")
    subjectName: str = Field(..., description="Name of the subject (e.g. Mathematics)")
    date: str = Field(..., description="Date formatted as YYYY-MM-DD")
    startedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    finishedAt: Optional[datetime] = None
    createdBy: str = Field(..., description="User ObjectId of creator/admin")
    status: str = Field(default="ACTIVE", description="ACTIVE or COMPLETED")
    totalStudents: int = 0
    presentCount: int = 0
    absentCount: int = 0
    attendancePercentage: float = 0.0

    class Config:
        populate_by_name = True

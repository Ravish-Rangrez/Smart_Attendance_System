from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class StudentRegisterRequest(BaseModel):
    studentId: str = Field(..., min_length=2, max_length=30, example="STU001")
    name: str = Field(..., min_length=2, max_length=100, example="Saqib Rangrez")
    department: str = Field(..., min_length=2, max_length=100, example="Computer Engineering")
    className: str = Field(..., min_length=1, max_length=50, example="B.Tech A")

class StudentUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    department: Optional[str] = Field(None, min_length=2, max_length=100)
    className: Optional[str] = Field(None, min_length=1, max_length=50)
    isActive: Optional[bool] = None

class StudentResponse(BaseModel):
    id: str
    studentId: str
    name: str
    department: str
    className: str
    hasFaceRegistered: bool = False
    registeredAt: Optional[datetime] = None
    isActive: bool = True
    attendancePercentage: Optional[float] = 0.0

class StudentListResponse(BaseModel):
    total: int
    page: int
    limit: int
    students: List[StudentResponse]

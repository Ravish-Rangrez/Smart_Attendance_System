from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class SubjectCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, example="Mathematics")
    code: str = Field(..., min_length=2, max_length=20, example="MATH101")
    isActive: bool = True

class SubjectResponse(BaseModel):
    id: str
    name: str
    code: str
    isActive: bool
    createdAt: Optional[datetime] = None

class SubjectListResponse(BaseModel):
    total: int
    subjects: List[SubjectResponse]

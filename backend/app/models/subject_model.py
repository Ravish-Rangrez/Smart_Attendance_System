from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field

class SubjectModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str = Field(..., description="Subject Name (e.g. Mathematics)")
    code: str = Field(..., description="Subject Code (e.g. MATH101)")
    isActive: bool = Field(default=True)
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True

from typing import List, Optional, Any
from pydantic import BaseModel, Field

class ValidateSampleRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded webcam image frame")

class ValidateSampleResponse(BaseModel):
    valid: bool
    faces_detected: int
    message: str
    box: Optional[List[int]] = None

class RegisterFaceRequest(BaseModel):
    studentId: str = Field(..., description="Student ID or MongoDB ObjectId")
    samples: List[str] = Field(
        ...,
        min_length=1,
        max_length=20,
        description="List of 3 to 5 Base64 encoded valid face images"
    )

class RegisterFaceResponse(BaseModel):
    studentId: str
    studentName: str
    samples_processed: int
    message: str

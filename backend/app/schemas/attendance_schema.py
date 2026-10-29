from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, Field

class StartSessionRequest(BaseModel):
    subjectId: str = Field(..., description="ObjectId of the academic subject")

class SessionResponse(BaseModel):
    id: str
    subjectId: str
    subjectName: str
    date: str
    startedAt: datetime
    finishedAt: Optional[datetime] = None
    status: str
    totalStudents: int = 0
    presentCount: int = 0
    absentCount: int = 0
    attendancePercentage: float = 0.0

class RecognizeFrameRequest(BaseModel):
    sessionId: str = Field(..., description="Current active session ID")
    image: str = Field(..., description="Base64 encoded frame from webcam")

class DetectedPerson(BaseModel):
    matched: bool
    studentId: Optional[str] = None  # Roll number
    studentName: str
    studentObjId: Optional[str] = None
    alreadyMarked: bool = False
    newlyMarked: bool = False
    distance: float
    confidence: float
    box: List[int]

class RecognizeFrameResponse(BaseModel):
    sessionId: str
    faces_detected: int
    persons: List[DetectedPerson]
    totalPresent: int
    totalStudents: int

class FinishSessionRequest(BaseModel):
    sessionId: str

class AttendanceRecordDetail(BaseModel):
    id: str
    studentId: str  # Roll number
    studentName: str
    department: Optional[str] = None
    className: Optional[str] = None
    status: str
    markedAt: Optional[datetime] = None

class SessionDetailResponse(BaseModel):
    session: SessionResponse
    records: List[AttendanceRecordDetail]
    absentStudents: List[AttendanceRecordDetail]

class SessionHistoryResponse(BaseModel):
    total: int
    sessions: List[SessionResponse]

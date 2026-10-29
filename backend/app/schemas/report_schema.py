from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from app.schemas.attendance_schema import SessionResponse

class DashboardMetric(BaseModel):
    title: str
    value: Any
    change: Optional[str] = None
    icon: str

class AttendanceTrendItem(BaseModel):
    date: str
    subject: str
    percentage: float
    present: int
    total: int

class DashboardStatsResponse(BaseModel):
    totalStudents: int
    totalSubjects: int
    todaySessions: int
    overallAttendancePercentage: float
    recentSessions: List[SessionResponse]
    attendanceTrend: List[AttendanceTrendItem]

class StudentReportItem(BaseModel):
    id: str
    studentId: str
    name: str
    department: str
    className: str
    totalSessions: int
    attendedSessions: int
    percentage: float

class StudentReportListResponse(BaseModel):
    total: int
    students: List[StudentReportItem]

class SubjectReportItem(BaseModel):
    id: str
    name: str
    code: str
    totalSessions: int
    averageAttendancePercentage: float

class SubjectReportListResponse(BaseModel):
    total: int
    subjects: List[SubjectReportItem]

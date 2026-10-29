import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from bson import ObjectId
from app.repositories.student_repository import student_repository
from app.repositories.subject_repository import subject_repository
from app.repositories.attendance_repository import attendance_repository
from app.services.attendance_service import attendance_service
from app.schemas.report_schema import (
    DashboardStatsResponse,
    AttendanceTrendItem,
    StudentReportItem,
    StudentReportListResponse,
    SubjectReportItem,
    SubjectReportListResponse
)

logger = logging.getLogger(__name__)

class ReportService:
    async def get_dashboard_stats(self) -> DashboardStatsResponse:
        """Calculate live summary statistics for dashboard."""
        total_students = await student_repository.count_students()
        total_subjects = len(await subject_repository.get_all())
        today_sessions = await attendance_repository.get_todays_sessions_count()

        # Get recent sessions
        recent_raw = await attendance_repository.list_sessions(skip=0, limit=5)
        recent_sessions = [attendance_service._doc_to_session_response(s) for s in recent_raw]

        # Calculate overall attendance percentage from completed sessions
        all_completed = await attendance_repository.session_collection.find(
            {"status": "COMPLETED"}
        ).to_list(length=500)

        if all_completed:
            percentages = [s.get("attendancePercentage", 0.0) for s in all_completed]
            overall_pct = round(sum(percentages) / len(percentages), 2)
        else:
            overall_pct = 0.0

        # Build attendance trend for charts (last 7 completed sessions)
        trend_items: List[AttendanceTrendItem] = []
        for s in reversed(all_completed[-7:] if len(all_completed) > 7 else all_completed):
            trend_items.append(AttendanceTrendItem(
                date=s.get("date", ""),
                subject=s.get("subjectName", ""),
                percentage=s.get("attendancePercentage", 0.0),
                present=s.get("presentCount", 0),
                total=s.get("totalStudents", 0)
            ))

        return DashboardStatsResponse(
            totalStudents=total_students,
            totalSubjects=total_subjects,
            todaySessions=today_sessions,
            overallAttendancePercentage=overall_pct,
            recentSessions=recent_sessions,
            attendanceTrend=trend_items
        )

    async def get_students_report(self) -> StudentReportListResponse:
        """Generate comprehensive student-wise attendance percentage report."""
        students = await student_repository.list_students(skip=0, limit=1000)
        total_completed_sessions = await attendance_repository.session_collection.count_documents(
            {"status": "COMPLETED"}
        )

        items: List[StudentReportItem] = []
        for s in students:
            s_id = str(s["_id"])
            attended = await attendance_repository.record_collection.count_documents({
                "studentId": s_id,
                "status": "PRESENT"
            })
            pct = round((attended / total_completed_sessions * 100.0), 2) if total_completed_sessions > 0 else 0.0

            items.append(StudentReportItem(
                id=s_id,
                studentId=s.get("studentId", "N/A"),
                name=s.get("name", ""),
                department=s.get("department", ""),
                className=s.get("className", ""),
                totalSessions=total_completed_sessions,
                attendedSessions=attended,
                percentage=pct
            ))

        return StudentReportListResponse(total=len(items), students=items)

    async def get_subjects_report(self) -> SubjectReportListResponse:
        """Generate subject-wise attendance aggregation report."""
        subjects = await subject_repository.get_all(active_only=False)
        items: List[SubjectReportItem] = []

        for sub in subjects:
            sub_id = str(sub["_id"])
            sessions = await attendance_repository.session_collection.find({
                "subjectId": sub_id,
                "status": "COMPLETED"
            }).to_list(length=500)

            total_sessions = len(sessions)
            if total_sessions > 0:
                avg_pct = round(sum(s.get("attendancePercentage", 0.0) for s in sessions) / total_sessions, 2)
            else:
                avg_pct = 0.0

            items.append(SubjectReportItem(
                id=sub_id,
                name=sub.get("name", ""),
                code=sub.get("code", ""),
                totalSessions=total_sessions,
                averageAttendancePercentage=avg_pct
            ))

        return SubjectReportListResponse(total=len(items), subjects=items)

report_service = ReportService()

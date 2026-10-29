from fastapi import APIRouter, Depends, Path
from app.schemas.report_schema import (
    DashboardStatsResponse,
    StudentReportListResponse,
    SubjectReportListResponse
)
from app.services.report_service import report_service
from app.dependencies.auth_dependency import get_current_user
from app.schemas.auth_schema import UserResponse
from app.utils.response_utils import success_response

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get(
    "/dashboard",
    summary="Dashboard Summary Statistics",
    description="Get live counters, overall attendance percentage, recent sessions, and trend data."
)
async def get_dashboard(
    current_user: UserResponse = Depends(get_current_user)
):
    stats = await report_service.get_dashboard_stats()
    return success_response(
        data=stats.model_dump(),
        message="Dashboard statistics retrieved."
    )

@router.get(
    "/students",
    summary="Student Attendance Report",
    description="Get attendance percentage and attended session count for all students."
)
async def get_students_report(
    current_user: UserResponse = Depends(get_current_user)
):
    report = await report_service.get_students_report()
    return success_response(
        data=report.model_dump(),
        message="Student attendance report retrieved."
    )

@router.get(
    "/subjects",
    summary="Subject Attendance Report",
    description="Get session count and average attendance percentage by subject."
)
async def get_subjects_report(
    current_user: UserResponse = Depends(get_current_user)
):
    report = await report_service.get_subjects_report()
    return success_response(
        data=report.model_dump(),
        message="Subject attendance report retrieved."
    )

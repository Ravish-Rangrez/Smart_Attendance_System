from fastapi import APIRouter, Depends, Query, Path, status
from app.schemas.attendance_schema import (
    StartSessionRequest,
    SessionResponse,
    RecognizeFrameRequest,
    RecognizeFrameResponse,
    FinishSessionRequest,
    SessionDetailResponse,
    SessionHistoryResponse
)
from app.services.attendance_service import attendance_service
from app.dependencies.auth_dependency import get_current_user
from app.schemas.auth_schema import UserResponse
from app.utils.response_utils import success_response

router = APIRouter(prefix="/attendance", tags=["Attendance"])

@router.post(
    "/start",
    summary="Start Attendance Session",
    description="Start a new live attendance session for a subject."
)
async def start_session(
    data: StartSessionRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    session = await attendance_service.start_session(
        subject_id=data.subjectId,
        user_id=current_user.id
    )
    return success_response(
        data=session.model_dump(),
        message="Attendance session started successfully."
    )

@router.post(
    "/recognize",
    summary="Recognize Face & Mark Attendance",
    description="Receive live webcam frame, recognize student face, and record attendance idempotently."
)
async def recognize_and_mark(
    data: RecognizeFrameRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    result = await attendance_service.process_attendance_frame(
        session_id=data.sessionId,
        base64_image=data.image
    )
    return success_response(
        data=result.model_dump(),
        message="Frame processed."
    )

@router.post(
    "/finish",
    summary="Finish Attendance Session",
    description="Complete active attendance session and compute final attendance percentages."
)
async def finish_session(
    data: FinishSessionRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    result = await attendance_service.finish_session(session_id=data.sessionId)
    return success_response(
        data=result.model_dump(),
        message="Attendance session completed successfully."
    )

@router.get(
    "/history",
    summary="Attendance Session History",
    description="Get chronological list of attendance sessions with summary metrics."
)
async def get_history(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    current_user: UserResponse = Depends(get_current_user)
):
    result = await attendance_service.list_history(page=page, limit=limit)
    return success_response(
        data=result.model_dump(),
        message="Attendance history retrieved."
    )

@router.get(
    "/session/{sessionId}",
    summary="Get Session Attendance Details",
    description="Get attendance breakdown for a session, including list of present and absent students."
)
async def get_session_detail(
    sessionId: str = Path(..., description="Attendance Session ID"),
    current_user: UserResponse = Depends(get_current_user)
):
    result = await attendance_service.get_session_details(sessionId)
    return success_response(
        data=result.model_dump(),
        message="Session details retrieved."
    )

from fastapi import APIRouter, Depends, status
from app.schemas.subject_schema import SubjectCreateRequest, SubjectResponse, SubjectListResponse
from app.services.subject_service import subject_service
from app.dependencies.auth_dependency import get_current_user
from app.schemas.auth_schema import UserResponse
from app.utils.response_utils import success_response

router = APIRouter(prefix="/subjects", tags=["Subjects"])

@router.get(
    "",
    summary="List Subjects",
    description="Retrieve all available subjects for attendance sessions."
)
async def list_subjects(
    current_user: UserResponse = Depends(get_current_user)
):
    result = await subject_service.list_subjects()
    return success_response(data=result.model_dump(), message="Subjects retrieved successfully")

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create Subject",
    description="Add a new academic subject."
)
async def create_subject(
    data: SubjectCreateRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    result = await subject_service.create_subject(data)
    return success_response(
        data=result.model_dump(),
        message="Subject created successfully",
        status_code=status.HTTP_201_CREATED
    )

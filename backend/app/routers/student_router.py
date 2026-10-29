from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Path, HTTPException, status
from app.schemas.student_schema import (
    StudentRegisterRequest,
    StudentUpdateRequest,
    StudentResponse,
    StudentListResponse
)
from app.schemas.face_schema import (
    ValidateSampleRequest,
    ValidateSampleResponse,
    RegisterFaceRequest,
    RegisterFaceResponse
)
from app.services.student_service import student_service
from app.services.face_recognition_service import face_recognition_service
from app.repositories.student_repository import student_repository
from app.utils.image_utils import base64_to_cv2_image
from app.dependencies.auth_dependency import get_current_user
from app.schemas.auth_schema import UserResponse
from app.utils.response_utils import success_response, error_response

router = APIRouter(prefix="/students", tags=["Students"])

@router.post(
    "/face/validate-frame",
    summary="Validate Live Camera Frame",
    description="Validate webcam frame for single face detection and quality before capturing sample."
)
async def validate_face_frame(
    req: ValidateSampleRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    img = base64_to_cv2_image(req.image)
    if img is None:
        return error_response(message="Invalid image format", status_code=400)

    faces = face_recognition_service.detect_faces(img)
    if len(faces) == 0:
        return success_response(
            data={"valid": False, "faces_detected": 0, "message": "No face detected in frame", "box": None},
            message="No face detected"
        )
    elif len(faces) > 1:
        return success_response(
            data={"valid": False, "faces_detected": len(faces), "message": "Multiple faces detected. Ensure only one person is in frame.", "box": faces[0]["box"]},
            message="Multiple faces detected"
        )
    
    return success_response(
        data={"valid": True, "faces_detected": 1, "message": "Face detected cleanly", "box": faces[0]["box"]},
        message="Face detected"
    )

@router.post(
    "/{id}/register-face",
    summary="Register Student Face Encodings",
    description="Process multiple face sample frames, compute normalized average embedding vector, and save to database."
)
async def register_student_face(
    id: str = Path(..., description="Student ObjectId or Student ID"),
    samples: List[str] = Query(None),
    body: Optional[RegisterFaceRequest] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    # Find student
    student = await student_repository.get_by_id(id)
    if not student:
        student = await student_repository.get_by_student_id(id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    sample_images = []
    if body and body.samples:
        sample_images = body.samples
    elif samples:
        sample_images = samples

    if not sample_images or len(sample_images) < 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least 1 valid face sample is required.")

    valid_encodings = []
    for idx, b64_img in enumerate(sample_images):
        img = base64_to_cv2_image(b64_img)
        if img is None:
            continue
        faces = face_recognition_service.detect_faces(img)
        if len(faces) == 1:
            enc = face_recognition_service.generate_encoding(img, faces[0])
            if enc is not None:
                valid_encodings.append(enc)

    if not valid_encodings:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to extract valid face encodings from uploaded samples. Please ensure good lighting and face visibility."
        )

    # Compute normalized average vector
    final_encoding = face_recognition_service.average_encodings(valid_encodings)
    student_obj_id = str(student["_id"])
    
    await student_repository.update_face_encoding(student_obj_id, final_encoding)

    return success_response(
        data={
            "studentId": student.get("studentId"),
            "studentName": student.get("name"),
            "samples_processed": len(valid_encodings),
            "message": f"Successfully registered face data with {len(valid_encodings)} valid samples."
        },
        message="Face registration completed successfully."
    )

@router.get(
    "",
    summary="List Students",
    description="Retrieve paginated list of students with optional search filter."
)
async def list_students(
    search: Optional[str] = Query(None, description="Search by student name or student ID"),
    department: Optional[str] = Query(None, description="Filter by department"),
    className: Optional[str] = Query(None, description="Filter by class"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=200, description="Items per page"),
    current_user: UserResponse = Depends(get_current_user)
):
    result = await student_service.list_students(
        search=search,
        department=department,
        className=className,
        page=page,
        limit=limit
    )
    return success_response(data=result.model_dump(), message="Students retrieved successfully")

@router.get(
    "/{id}",
    summary="Get Student Details",
    description="Retrieve student profile details by ID."
)
async def get_student(
    id: str = Path(..., description="Student MongoDB ID or Roll Number"),
    current_user: UserResponse = Depends(get_current_user)
):
    student = await student_service.get_student(id)
    return success_response(data=student.model_dump(), message="Student found")

@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    summary="Register Student",
    description="Register a new student with roll number and personal details."
)
async def register_student(
    data: StudentRegisterRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    created = await student_service.register_student(data)
    return success_response(
        data=created.model_dump(),
        message="Student registered successfully. You can now register face samples.",
        status_code=status.HTTP_201_CREATED
    )

@router.put(
    "/{id}",
    summary="Update Student",
    description="Update student details."
)
async def update_student(
    data: StudentUpdateRequest,
    id: str = Path(..., description="Student ID"),
    current_user: UserResponse = Depends(get_current_user)
):
    updated = await student_service.update_student(id, data)
    return success_response(data=updated.model_dump(), message="Student updated successfully")

@router.delete(
    "/{id}",
    summary="Delete Student",
    description="Permanently delete a student and their face registration."
)
async def delete_student(
    id: str = Path(..., description="Student ID"),
    current_user: UserResponse = Depends(get_current_user)
):
    await student_service.delete_student(id)
    return success_response(message="Student deleted successfully")

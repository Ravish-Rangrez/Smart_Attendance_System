import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from fastapi import HTTPException, status
from app.repositories.student_repository import student_repository
from app.schemas.student_schema import (
    StudentRegisterRequest,
    StudentUpdateRequest,
    StudentResponse,
    StudentListResponse
)

logger = logging.getLogger(__name__)

class StudentService:
    def _doc_to_response(self, doc: Dict[str, Any], attendance_pct: float = 0.0) -> StudentResponse:
        """Convert MongoDB document to sanitized StudentResponse (never leaking raw vector)."""
        has_face = bool(doc.get("faceEncoding") and len(doc.get("faceEncoding", [])) > 0)
        return StudentResponse(
            id=str(doc["_id"]),
            studentId=doc.get("studentId", ""),
            name=doc.get("name", ""),
            department=doc.get("department", ""),
            className=doc.get("className", ""),
            hasFaceRegistered=has_face,
            registeredAt=doc.get("registeredAt"),
            isActive=doc.get("isActive", True),
            attendancePercentage=attendance_pct
        )

    async def register_student(self, data: StudentRegisterRequest) -> StudentResponse:
        """Register a new student."""
        existing = await student_repository.get_by_student_id(data.studentId)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Student with Student ID '{data.studentId.upper()}' is already registered."
            )

        student_doc = {
            "studentId": data.studentId.strip().upper(),
            "name": data.name.strip(),
            "department": data.department.strip(),
            "className": data.className.strip(),
            "faceEncoding": None,
            "registeredAt": datetime.now(timezone.utc),
            "isActive": True
        }

        created = await student_repository.create_student(student_doc)
        logger.info(f"Student '{created['name']}' ({created['studentId']}) created successfully.")
        return self._doc_to_response(created)

    async def get_student(self, student_id: str) -> StudentResponse:
        """Fetch student by ObjectId or Student ID."""
        doc = await student_repository.get_by_id(student_id)
        if not doc:
            doc = await student_repository.get_by_student_id(student_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        return self._doc_to_response(doc)

    async def update_student(self, student_id: str, data: StudentUpdateRequest) -> StudentResponse:
        """Update existing student."""
        existing = await student_repository.get_by_id(student_id)
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        if not updates:
            return self._doc_to_response(existing)

        updated = await student_repository.update_student(student_id, updates)
        return self._doc_to_response(updated)

    async def delete_student(self, student_id: str) -> bool:
        """Delete student."""
        existing = await student_repository.get_by_id(student_id)
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

        success = await student_repository.delete_student(student_id)
        if success:
            logger.info(f"Student ID '{student_id}' deleted successfully.")
        return success

    async def list_students(
        self,
        search: Optional[str] = None,
        department: Optional[str] = None,
        className: Optional[str] = None,
        page: int = 1,
        limit: int = 50
    ) -> StudentListResponse:
        """List students with pagination and optional search."""
        skip = (page - 1) * limit
        docs = await student_repository.list_students(
            search=search,
            department=department,
            className=className,
            skip=skip,
            limit=limit
        )
        total = await student_repository.count_students(
            search=search,
            department=department,
            className=className
        )
        students = [self._doc_to_response(d) for d in docs]
        return StudentListResponse(
            total=total,
            page=page,
            limit=limit,
            students=students
        )

student_service = StudentService()

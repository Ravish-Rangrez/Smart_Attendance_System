import logging
from typing import List, Dict, Any
from fastapi import HTTPException, status
from app.repositories.subject_repository import subject_repository
from app.schemas.subject_schema import SubjectCreateRequest, SubjectResponse, SubjectListResponse

logger = logging.getLogger(__name__)

class SubjectService:
    def _doc_to_response(self, doc: Dict[str, Any]) -> SubjectResponse:
        return SubjectResponse(
            id=str(doc["_id"]),
            name=doc.get("name", ""),
            code=doc.get("code", ""),
            isActive=doc.get("isActive", True),
            createdAt=doc.get("createdAt")
        )

    async def list_subjects(self, active_only: bool = True) -> SubjectListResponse:
        """List all available subjects."""
        docs = await subject_repository.get_all(active_only=active_only)
        subjects = [self._doc_to_response(d) for d in docs]
        return SubjectListResponse(total=len(subjects), subjects=subjects)

    async def create_subject(self, data: SubjectCreateRequest) -> SubjectResponse:
        """Create a new subject."""
        existing = await subject_repository.get_by_code(data.code)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Subject with code '{data.code.upper()}' already exists."
            )
        created = await subject_repository.create({
            "name": data.name.strip(),
            "code": data.code.strip().upper(),
            "isActive": data.isActive
        })
        return self._doc_to_response(created)

    async def get_subject_by_id(self, subject_id: str) -> SubjectResponse:
        """Fetch subject by ID."""
        doc = await subject_repository.get_by_id(subject_id)
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
        return self._doc_to_response(doc)

subject_service = SubjectService()

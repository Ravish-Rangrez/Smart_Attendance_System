import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import HTTPException, status
from app.repositories.attendance_repository import attendance_repository
from app.repositories.student_repository import student_repository
from app.repositories.subject_repository import subject_repository
from app.services.face_recognition_service import face_recognition_service
from app.utils.image_utils import base64_to_cv2_image
from app.schemas.attendance_schema import (
    SessionResponse,
    RecognizeFrameResponse,
    DetectedPerson,
    SessionDetailResponse,
    AttendanceRecordDetail,
    SessionHistoryResponse
)

logger = logging.getLogger(__name__)

class AttendanceService:
    def _doc_to_session_response(self, doc: Dict[str, Any]) -> SessionResponse:
        return SessionResponse(
            id=str(doc["_id"]),
            subjectId=str(doc.get("subjectId", "")),
            subjectName=doc.get("subjectName", ""),
            date=doc.get("date", ""),
            startedAt=doc.get("startedAt"),
            finishedAt=doc.get("finishedAt"),
            status=doc.get("status", "ACTIVE"),
            totalStudents=doc.get("totalStudents", 0),
            presentCount=doc.get("presentCount", 0),
            absentCount=doc.get("absentCount", 0),
            attendancePercentage=doc.get("attendancePercentage", 0.0)
        )

    async def start_session(self, subject_id: str, user_id: str) -> SessionResponse:
        """Start a new active attendance session for a subject."""
        subject = await subject_repository.get_by_id(subject_id)
        if not subject:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

        total_students = await student_repository.count_students()
        now = datetime.now(timezone.utc)
        date_str = now.strftime("%Y-%m-%d")

        session_doc = {
            "subjectId": str(subject["_id"]),
            "subjectName": subject.get("name", "Unknown Subject"),
            "date": date_str,
            "startedAt": now,
            "finishedAt": None,
            "createdBy": user_id,
            "status": "ACTIVE",
            "totalStudents": total_students,
            "presentCount": 0,
            "absentCount": total_students,
            "attendancePercentage": 0.0
        }

        created = await attendance_repository.create_session(session_doc)
        logger.info(f"Started Attendance Session '{created['_id']}' for {subject.get('name')}")
        return self._doc_to_session_response(created)

    async def process_attendance_frame(self, session_id: str, base64_image: str) -> RecognizeFrameResponse:
        """Process live frame from webcam, run facial recognition, and mark attendance."""
        session = await attendance_repository.get_session_by_id(session_id)
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance session not found")
        
        if session.get("status") != "ACTIVE":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Attendance session is already completed.")

        image = base64_to_cv2_image(base64_image)
        if image is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image frame received.")

        # Get all registered students with face encodings
        registered_students = await student_repository.get_all_with_encodings()
        total_students = await student_repository.count_students()

        # Run face recognition
        recognition_results = face_recognition_service.recognize_faces(
            image=image,
            registered_students=registered_students
        )

        detected_persons: List[DetectedPerson] = []

        for res in recognition_results:
            matched = res.get("matched", False)
            student_name = res.get("studentName", "Unknown Face")
            student_roll = res.get("studentId")
            student_obj_id = res.get("studentObjId")
            
            already_marked = False
            newly_marked = False

            if matched and student_obj_id:
                # Check if already present in database
                is_marked = await attendance_repository.is_student_marked(session_id, student_obj_id)
                if is_marked:
                    already_marked = True
                else:
                    # Mark present
                    success, was_already = await attendance_repository.mark_student_present(
                        session_id=session_id,
                        student_obj_id=student_obj_id,
                        student_roll=student_roll or "N/A",
                        student_name=student_name
                    )
                    if success and not was_already:
                        newly_marked = True
                        logger.info(f"Student {student_name} ({student_roll}) marked PRESENT in session {session_id}")
                    elif was_already:
                        already_marked = True

            detected_persons.append(DetectedPerson(
                matched=matched,
                studentId=student_roll,
                studentName=student_name,
                studentObjId=student_obj_id,
                alreadyMarked=already_marked,
                newlyMarked=newly_marked,
                distance=res.get("distance", 1.0),
                confidence=res.get("confidence", 0.0),
                box=res.get("box", [0, 0, 0, 0])
            ))

        present_count = await attendance_repository.count_present_in_session(session_id)

        return RecognizeFrameResponse(
            sessionId=session_id,
            faces_detected=len(detected_persons),
            persons=detected_persons,
            totalPresent=present_count,
            totalStudents=total_students
        )

    async def finish_session(self, session_id: str) -> SessionResponse:
        """Finish an attendance session and calculate final percentage."""
        session = await attendance_repository.get_session_by_id(session_id)
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

        total_students = await student_repository.count_students()
        present_count = await attendance_repository.count_present_in_session(session_id)
        absent_count = max(0, total_students - present_count)
        percentage = round((present_count / total_students * 100.0), 2) if total_students > 0 else 0.0

        updates = {
            "finishedAt": datetime.now(timezone.utc),
            "status": "COMPLETED",
            "totalStudents": total_students,
            "presentCount": present_count,
            "absentCount": absent_count,
            "attendancePercentage": percentage
        }

        updated = await attendance_repository.update_session(session_id, updates)
        logger.info(f"Attendance Session {session_id} COMPLETED. Present: {present_count}/{total_students} ({percentage}%)")
        return self._doc_to_session_response(updated)

    async def get_session_details(self, session_id: str) -> SessionDetailResponse:
        """Get full session details with present records and absent students list."""
        session = await attendance_repository.get_session_by_id(session_id)
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

        session_res = self._doc_to_session_response(session)
        records = await attendance_repository.get_records_for_session(session_id)
        
        present_ids = set()
        present_details: List[AttendanceRecordDetail] = []
        
        for r in records:
            present_ids.add(r["studentId"])
            # Fetch student details for department/class
            stu = await student_repository.get_by_id(r["studentId"])
            present_details.append(AttendanceRecordDetail(
                id=str(r["_id"]),
                studentId=r.get("studentRollNumber", stu.get("studentId", "N/A") if stu else "N/A"),
                studentName=r.get("studentName", stu.get("name", "Student") if stu else "Student"),
                department=stu.get("department") if stu else None,
                className=stu.get("className") if stu else None,
                status="PRESENT",
                markedAt=r.get("markedAt")
            ))

        # Determine absent students
        all_students = await student_repository.list_students(skip=0, limit=1000)
        absent_details: List[AttendanceRecordDetail] = []
        
        for s in all_students:
            s_id = str(s["_id"])
            if s_id not in present_ids:
                absent_details.append(AttendanceRecordDetail(
                    id=s_id,
                    studentId=s.get("studentId", "N/A"),
                    studentName=s.get("name", "Unknown"),
                    department=s.get("department"),
                    className=s.get("className"),
                    status="ABSENT",
                    markedAt=None
                ))

        return SessionDetailResponse(
            session=session_res,
            records=present_details,
            absentStudents=absent_details
        )

    async def list_history(self, page: int = 1, limit: int = 50) -> SessionHistoryResponse:
        """List attendance session history with pagination."""
        skip = (page - 1) * limit
        sessions = await attendance_repository.list_sessions(skip=skip, limit=limit)
        total = await attendance_repository.count_sessions()
        
        return SessionHistoryResponse(
            total=total,
            sessions=[self._doc_to_session_response(s) for s in sessions]
        )

attendance_service = AttendanceService()

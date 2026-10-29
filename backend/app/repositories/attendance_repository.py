from typing import Optional, List, Dict, Any
from bson import ObjectId
from datetime import datetime, timezone
from pymongo.errors import DuplicateKeyError
from app.core.database import get_database

class AttendanceRepository:
    @property
    def session_collection(self):
        db = get_database()
        if db is None:
            raise RuntimeError("Database connection not initialized")
        return db.attendance_sessions

    @property
    def record_collection(self):
        db = get_database()
        if db is None:
            raise RuntimeError("Database connection not initialized")
        return db.attendance_records

    # -------------------------------------------------------------
    # Session Operations
    # -------------------------------------------------------------
    async def create_session(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new attendance session."""
        result = await self.session_collection.insert_one(session_data)
        session_data["_id"] = str(result.inserted_id)
        return session_data

    async def get_session_by_id(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session by MongoDB ObjectId."""
        try:
            if ObjectId.is_valid(session_id):
                return await self.session_collection.find_one({"_id": ObjectId(session_id)})
            return await self.session_collection.find_one({"_id": session_id})
        except Exception:
            return None

    async def get_active_session_by_id(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get active session by ID."""
        session = await self.get_session_by_id(session_id)
        if session and session.get("status") == "ACTIVE":
            return session
        return None

    async def update_session(self, session_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update session fields."""
        if not ObjectId.is_valid(session_id):
            return None
        await self.session_collection.update_one(
            {"_id": ObjectId(session_id)},
            {"$set": updates}
        )
        return await self.get_session_by_id(session_id)

    async def list_sessions(self, skip: int = 0, limit: int = 50) -> List[Dict[str, Any]]:
        """List attendance sessions sorted by startedAt descending."""
        cursor = self.session_collection.find({}).sort("startedAt", -1).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def count_sessions(self) -> int:
        """Count total attendance sessions."""
        return await self.session_collection.count_documents({})

    async def get_todays_sessions_count(self) -> int:
        """Count sessions started today."""
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        return await self.session_collection.count_documents({"date": today_str})

    # -------------------------------------------------------------
    # Record Operations (Attendance Records)
    # -------------------------------------------------------------
    async def mark_student_present(
        self,
        session_id: str,
        student_obj_id: str,
        student_roll: str,
        student_name: str
    ) -> Tuple[bool, bool]:
        """
        Mark student present in session.
        Returns: (success: bool, was_already_marked: bool)
        """
        try:
            record_doc = {
                "sessionId": session_id,
                "studentId": student_obj_id,
                "studentRollNumber": student_roll,
                "studentName": student_name,
                "status": "PRESENT",
                "markedAt": datetime.now(timezone.utc)
            }
            await self.record_collection.insert_one(record_doc)
            return True, False  # Newly marked
        except DuplicateKeyError:
            return True, True   # Already marked
        except Exception:
            return False, False

    async def is_student_marked(self, session_id: str, student_obj_id: str) -> bool:
        """Check if student is already marked present in session."""
        record = await self.record_collection.find_one({
            "sessionId": session_id,
            "studentId": student_obj_id
        })
        return record is not None

    async def get_marked_student_ids(self, session_id: str) -> List[str]:
        """Get list of student ObjectId strings marked in this session."""
        cursor = self.record_collection.find({"sessionId": session_id}, {"studentId": 1})
        records = await cursor.to_list(length=1000)
        return [r["studentId"] for r in records]

    async def get_records_for_session(self, session_id: str) -> List[Dict[str, Any]]:
        """Get all attendance records for a session."""
        cursor = self.record_collection.find({"sessionId": session_id}).sort("markedAt", 1)
        return await cursor.to_list(length=1000)

    async def count_present_in_session(self, session_id: str) -> int:
        """Count present records in session."""
        return await self.record_collection.count_documents({
            "sessionId": session_id,
            "status": "PRESENT"
        })

    async def get_student_attendance_stats(self, student_obj_id: str) -> Dict[str, Any]:
        """Get attendance count for a single student."""
        total_sessions = await self.session_collection.count_documents({"status": "COMPLETED"})
        attended_sessions = await self.record_collection.count_documents({
            "studentId": student_obj_id,
            "status": "PRESENT"
        })
        pct = (attended_sessions / total_sessions * 100.0) if total_sessions > 0 else 0.0
        return {
            "totalSessions": total_sessions,
            "attendedSessions": attended_sessions,
            "percentage": round(pct, 2)
        }

from typing import Tuple
attendance_repository = AttendanceRepository()

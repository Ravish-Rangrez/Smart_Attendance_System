from typing import Optional, List, Dict, Any
from bson import ObjectId
from app.core.database import get_database

class StudentRepository:
    @property
    def collection(self):
        db = get_database()
        if db is None:
            raise RuntimeError("Database connection not initialized")
        return db.students

    async def get_by_id(self, student_obj_id: str) -> Optional[Dict[str, Any]]:
        """Find student by MongoDB ObjectId."""
        try:
            if ObjectId.is_valid(student_obj_id):
                return await self.collection.find_one({"_id": ObjectId(student_obj_id)})
            return await self.collection.find_one({"_id": student_obj_id})
        except Exception:
            return None

    async def get_by_student_id(self, student_id: str) -> Optional[Dict[str, Any]]:
        """Find student by unique college studentId (case-insensitive)."""
        return await self.collection.find_one({"studentId": student_id.strip().upper()})

    async def create_student(self, student_data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert new student."""
        student_data["studentId"] = student_data["studentId"].strip().upper()
        result = await self.collection.insert_one(student_data)
        student_data["_id"] = str(result.inserted_id)
        return student_data

    async def update_student(self, student_obj_id: str, update_fields: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update student basic fields."""
        if not ObjectId.is_valid(student_obj_id):
            return None
        await self.collection.update_one(
            {"_id": ObjectId(student_obj_id)},
            {"$set": update_fields}
        )
        return await self.get_by_id(student_obj_id)

    async def update_face_encoding(self, student_obj_id: str, encoding: List[float]) -> bool:
        """Store/update 128D/512D facial encoding vector for a student."""
        if not ObjectId.is_valid(student_obj_id):
            return False
        result = await self.collection.update_one(
            {"_id": ObjectId(student_obj_id)},
            {"$set": {"faceEncoding": encoding}}
        )
        return result.modified_count > 0 or result.matched_count > 0

    async def delete_student(self, student_obj_id: str) -> bool:
        """Permanently delete student record."""
        if not ObjectId.is_valid(student_obj_id):
            return False
        result = await self.collection.delete_one({"_id": ObjectId(student_obj_id)})
        return result.deleted_count > 0

    async def get_all_with_encodings(self) -> List[Dict[str, Any]]:
        """Fetch all active students that have registered facial encodings."""
        cursor = self.collection.find({
            "isActive": True,
            "faceEncoding": {"$exists": True, "$ne": None}
        })
        return await cursor.to_list(length=1000)

    async def list_students(
        self,
        search: Optional[str] = None,
        department: Optional[str] = None,
        className: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """List students with search filtering and pagination."""
        query: Dict[str, Any] = {}
        if search:
            regex = {"$regex": search.strip(), "$options": "i"}
            query["$or"] = [{"name": regex}, {"studentId": regex}]
        if department:
            query["department"] = department
        if className:
            query["className"] = className

        cursor = self.collection.find(query).sort("studentId", 1).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def count_students(
        self,
        search: Optional[str] = None,
        department: Optional[str] = None,
        className: Optional[str] = None
    ) -> int:
        """Count total matching students."""
        query: Dict[str, Any] = {}
        if search:
            regex = {"$regex": search.strip(), "$options": "i"}
            query["$or"] = [{"name": regex}, {"studentId": regex}]
        if department:
            query["department"] = department
        if className:
            query["className"] = className

        return await self.collection.count_documents(query)

student_repository = StudentRepository()

from typing import Optional, List, Dict, Any
from bson import ObjectId
from app.core.database import get_database

class SubjectRepository:
    @property
    def collection(self):
        db = get_database()
        if db is None:
            raise RuntimeError("Database connection not initialized")
        return db.subjects

    async def get_all(self, active_only: bool = True) -> List[Dict[str, Any]]:
        """Fetch all subjects."""
        query = {"isActive": True} if active_only else {}
        cursor = self.collection.find(query).sort("name", 1)
        return await cursor.to_list(length=100)

    async def get_by_id(self, subject_id: str) -> Optional[Dict[str, Any]]:
        """Find subject by MongoDB ObjectId."""
        try:
            if ObjectId.is_valid(subject_id):
                return await self.collection.find_one({"_id": ObjectId(subject_id)})
            return await self.collection.find_one({"_id": subject_id})
        except Exception:
            return None

    async def get_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        """Find subject by subject code (e.g. MATH101)."""
        return await self.collection.find_one({"code": code.strip().upper()})

    async def create(self, subject_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new subject."""
        subject_data["code"] = subject_data["code"].strip().upper()
        result = await self.collection.insert_one(subject_data)
        subject_data["_id"] = str(result.inserted_id)
        return subject_data

subject_repository = SubjectRepository()

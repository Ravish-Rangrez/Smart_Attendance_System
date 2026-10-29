from typing import Optional, Dict, Any
from bson import ObjectId
from app.core.database import get_database
from app.models.user_model import UserModel

class UserRepository:
    @property
    def collection(self):
        db = get_database()
        if db is None:
            raise RuntimeError("Database connection not initialized")
        return db.users

    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Find user by lowercase email."""
        return await self.collection.find_one({"email": email.strip().lower()})

    async def get_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Find user by MongoDB ObjectId or string id."""
        try:
            if ObjectId.is_valid(user_id):
                return await self.collection.find_one({"_id": ObjectId(user_id)})
            return await self.collection.find_one({"_id": user_id})
        except Exception:
            return None

    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert new user document and return it."""
        user_data["email"] = user_data["email"].strip().lower()
        result = await self.collection.insert_one(user_data)
        user_data["_id"] = str(result.inserted_id)
        return user_data

    async def count_users(self) -> int:
        """Count total registered users."""
        return await self.collection.count_documents({})

user_repository = UserRepository()

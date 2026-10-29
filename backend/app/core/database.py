import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.core.config import settings

logger = logging.getLogger(__name__)

class DatabaseManager:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None

db_manager = DatabaseManager()

async def connect_to_mongo():
    """Establish connection to MongoDB and ensure indexes."""
    logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
    try:
        db_manager.client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=5000
        )
        # Test connection
        await db_manager.client.admin.command("ping")
        db_manager.db = db_manager.client[settings.DATABASE_NAME]
        logger.info(f"Successfully connected to MongoDB database: '{settings.DATABASE_NAME}'")
        
        # Initialize indexes asynchronously
        await init_db_indexes(db_manager.db)
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        logger.warning(
            f"MongoDB connection failed: {e}. Backend running in disconnected/fallback mode. "
            "Please ensure MongoDB service is running."
        )
    except Exception as e:
        logger.error(f"Unexpected error while connecting to MongoDB: {e}")

async def close_mongo_connection():
    """Close MongoDB client connection."""
    if db_manager.client:
        logger.info("Closing MongoDB connection...")
        db_manager.client.close()
        logger.info("MongoDB connection closed.")

async def init_db_indexes(db: AsyncIOMotorDatabase):
    """Ensure essential unique indexes are present."""
    try:
        # Users: unique email
        await db.users.create_index("email", unique=True)
        
        # Students: unique studentId
        await db.students.create_index("studentId", unique=True)
        
        # Subjects: unique code
        await db.subjects.create_index("code", unique=True)
        
        # Attendance Records: unique (sessionId + studentId)
        await db.attendance_records.create_index(
            [("sessionId", 1), ("studentId", 1)],
            unique=True
        )
        logger.info("MongoDB indexes verified / created successfully.")
    except Exception as e:
        logger.warning(f"Could not create database indexes: {e}")

def get_database() -> AsyncIOMotorDatabase:
    """Dependency / Helper to retrieve current MongoDB database instance."""
    return db_manager.db

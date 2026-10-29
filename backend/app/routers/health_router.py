from fastapi import APIRouter
from app.core.database import db_manager
from app.core.config import settings
from app.utils.response_utils import success_response, error_response
import time

router = APIRouter(tags=["Health"])

START_TIME = time.time()

@router.get("/health", summary="System Health & Status Check")
async def health_check():
    """
    Check the operational status of the FastAPI backend and MongoDB connection.
    """
    db_connected = False
    db_latency_ms = None
    
    if db_manager.client:
        try:
            t0 = time.time()
            await db_manager.client.admin.command("ping")
            db_latency_ms = round((time.time() - t0) * 1000, 2)
            db_connected = True
        except Exception:
            db_connected = False

    uptime_seconds = round(time.time() - START_TIME, 2)

    status_data = {
        "status": "healthy" if db_connected else "degraded",
        "app_name": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "uptime_seconds": uptime_seconds,
        "database": {
            "connected": db_connected,
            "name": settings.DATABASE_NAME,
            "latency_ms": db_latency_ms
        }
    }
    
    return success_response(
        data=status_data,
        message="Service is running." if db_connected else "Service running with database connection issue."
    )

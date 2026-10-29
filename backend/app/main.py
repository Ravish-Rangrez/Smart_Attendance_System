import logging
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.routers.health_router import router as health_router
from app.routers.auth_router import router as auth_router
from app.routers.student_router import router as student_router
from app.routers.subject_router import router as subject_router
from app.routers.attendance_router import router as attendance_router
from app.routers.report_router import router as report_router
from app.utils.response_utils import error_response

# -------------------------------------------------------------
# Logging Configuration
# -------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("smart_attendance")

# -------------------------------------------------------------
# Application Lifespan (Startup & Shutdown)
# -------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.PROJECT_VERSION}...")
    await connect_to_mongo()
    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME}...")
    await close_mongo_connection()

# -------------------------------------------------------------
# FastAPI App Initialization
# -------------------------------------------------------------
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Production-quality REST API for Smart Attendance System using Face Recognition",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# -------------------------------------------------------------
# CORS Middleware
# -------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# Global Exception Handlers for Clean & Consistent Error Format
# -------------------------------------------------------------
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return error_response(
        message=str(exc.detail),
        status_code=exc.status_code
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        loc = " -> ".join([str(l) for l in err.get("loc", [])])
        msg = err.get("msg")
        errors.append(f"{loc}: {msg}")
    return error_response(
        message="Validation failed",
        status_code=422,
        data={"errors": errors}
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled server error: {exc}")
    return error_response(
        message="An internal server error occurred.",
        status_code=500
    )

# -------------------------------------------------------------
# Register Routers
# -------------------------------------------------------------
# Direct /health and API v1 /api/health
app.include_router(health_router, prefix="")
app.include_router(health_router, prefix=settings.API_V1_STR)

# API v1 feature routes
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(student_router, prefix=settings.API_V1_STR)
app.include_router(subject_router, prefix=settings.API_V1_STR)
app.include_router(attendance_router, prefix=settings.API_V1_STR)
app.include_router(report_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Root"])
async def root():
    return {
        "success": True,
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )

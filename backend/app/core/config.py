from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
import os

class Settings(BaseSettings):
    # Server Info
    PROJECT_NAME: str = "Smart Attendance System API"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    DEBUG: bool = True

    # MongoDB
    MONGODB_URL: str = "mongodb://127.0.0.1:27017"
    DATABASE_NAME: str = "smart_attendance_db"
    
    # JWT & Auth
    JWT_SECRET_KEY: str = "smart_attendance_dev_secret_key_change_in_production_2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Face Recognition
    FACE_MATCH_THRESHOLD: float = 0.55
    FACE_DETECTION_MODEL: str = "hog"  # "hog" (fast/CPU) or "cnn" (GPU)
    YUNET_SCORE_THRESHOLD: float = 0.3  # YuNet face detection confidence threshold (0.0-1.0, lower = more sensitive)
    REQUIRED_FACE_SAMPLES: int = 5

    # CORS
    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str):
            if v.strip() == "*":
                return ["*"]
            if not v.startswith("["):
                return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return []

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()

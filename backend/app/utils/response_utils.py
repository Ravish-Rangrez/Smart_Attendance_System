from typing import Any, Optional
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel

class StandardResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None

def success_response(
    data: Any = None,
    message: str = "Operation successful",
    status_code: int = 200
) -> JSONResponse:
    """Generate consistent JSON response for successful operations."""
    content = {
        "success": True,
        "message": message,
        "data": data
    }
    return JSONResponse(
        status_code=status_code,
        content=jsonable_encoder(content)
    )

def error_response(
    message: str = "An error occurred",
    status_code: int = 400,
    data: Any = None
) -> JSONResponse:
    """Generate consistent JSON response for failed operations or errors."""
    content = {
        "success": False,
        "message": message,
        "data": data
    }
    return JSONResponse(
        status_code=status_code,
        content=jsonable_encoder(content)
    )

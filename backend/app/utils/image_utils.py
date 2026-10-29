import base64
import re
import cv2
import numpy as np
from typing import Optional, Tuple
from fastapi import UploadFile

def base64_to_cv2_image(base64_str: str) -> Optional[np.ndarray]:
    """
    Convert a Base64 image string (with or without data URL prefix)
    into an OpenCV BGR numpy image array.
    """
    try:
        if not base64_str:
            return None
        
        # Strip data URL prefix if present (e.g., 'data:image/jpeg;base64,')
        if "," in base64_str:
            base64_str = base64_str.split(",", 1)[1]

        image_data = base64.b64decode(base64_str)
        np_arr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return image
    except Exception:
        return None

async def upload_file_to_cv2_image(file: UploadFile) -> Optional[np.ndarray]:
    """
    Read an uploaded file into an OpenCV BGR numpy image array.
    """
    try:
        contents = await file.read()
        np_arr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return image
    except Exception:
        return None

def cv2_image_to_base64(image: np.ndarray, format: str = ".jpg") -> str:
    """
    Encode an OpenCV BGR numpy image array into a Base64 string.
    """
    success, buffer = cv2.imencode(format, image)
    if not success:
        return ""
    return base64.b64encode(buffer).decode("utf-8")

def resize_image_if_needed(image: np.ndarray, max_dimension: int = 1280) -> np.ndarray:
    """
    Resize large images down to max_dimension while preserving aspect ratio.
    """
    h, w = image.shape[:2]
    if max(h, w) <= max_dimension:
        return image
    
    if h > w:
        new_h = max_dimension
        new_w = int(w * (max_dimension / h))
    else:
        new_w = max_dimension
        new_h = int(h * (max_dimension / w))
        
    return cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)

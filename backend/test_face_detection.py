#!/usr/bin/env python3
"""Test face detection directly"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import cv2
import base64
from app.services.face_recognition_service import face_recognition_service
from app.utils.image_utils import base64_to_cv2_image

# Test with a simple image URL or local file
test_image_path = "test_face.jpg"

if os.path.exists(test_image_path):
    print(f"Testing face detection on {test_image_path}")
    img = cv2.imread(test_image_path)
    if img is not None:
        faces = face_recognition_service.detect_faces(img)
        print(f"Faces detected: {len(faces)}")
        for i, face in enumerate(faces):
            print(f"  Face {i}: box={face['box']}, confidence={face['confidence']:.4f}")
    else:
        print("Failed to load test image")
else:
    print(f"Test image not found: {test_image_path}")
    print("Please place a test image at: backend/test_face.jpg")
    print("\nTo test with camera feed, check the backend logs when processing attendance frames")

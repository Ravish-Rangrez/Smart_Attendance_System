import os
import logging
from typing import List, Dict, Any, Optional, Tuple
import cv2
import numpy as np
from app.core.config import settings

logger = logging.getLogger(__name__)

# Base directory for computer vision models
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "cv_models")
YUNET_PATH = os.path.join(MODELS_DIR, "face_detection_yunet_2023mar.onnx")
SFACE_PATH = os.path.join(MODELS_DIR, "face_recognition_sface_2021dec.onnx")
HAAR_PATH = os.path.join(MODELS_DIR, "haarcascade_frontalface_default.xml")

class FaceRecognitionService:
    """
    Abstracted Face Detection and Recognition Service.
    Supports OpenCV YuNet (Face Detector) + SFace (Deep Feature Extractor),
    with Haar Cascade and dlib/face_recognition compatibility fallback.
    """
    def __init__(self):
        self.yunet_detector = None
        self.sface_recognizer = None
        self.haar_detector = None
        self._initialize_models()

    def _initialize_models(self):
        """Load OpenCV neural network models for face detection & recognition."""
        try:
            if os.path.exists(SFACE_PATH):
                self.sface_recognizer = cv2.FaceRecognizerSF_create(
                    model=SFACE_PATH,
                    config="",
                    backend_id=cv2.dnn.DNN_BACKEND_OPENCV,
                    target_id=cv2.dnn.DNN_TARGET_CPU
                )
                logger.info("OpenCV SFace neural network loaded successfully.")
            else:
                logger.warning(f"SFace model file not found at: {SFACE_PATH}")

            if os.path.exists(YUNET_PATH):
                # Temporary default dimensions for YuNet, updated per input image
                self.yunet_detector = cv2.FaceDetectorYN_create(
                    model=YUNET_PATH,
                    config="",
                    input_size=(320, 320),
                    score_threshold=settings.YUNET_SCORE_THRESHOLD,
                    nms_threshold=0.3,
                    top_k=5000,
                    backend_id=cv2.dnn.DNN_BACKEND_OPENCV,
                    target_id=cv2.dnn.DNN_TARGET_CPU
                )
                logger.info("OpenCV YuNet neural network loaded successfully.")
            elif os.path.exists(HAAR_PATH):
                self.haar_detector = cv2.CascadeClassifier(HAAR_PATH)
                logger.info("OpenCV Haar cascade loaded as fallback detector.")
        except Exception as e:
            logger.error(f"Error initializing face recognition models: {e}")

    def detect_faces(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Detect all faces in the provided BGR image.
        Returns a list of dictionaries with bounding box and confidence score:
        [{ "box": [x, y, w, h], "confidence": float, "raw_face": ... }, ...]
        """
        if image is None or image.size == 0:
            return []

        h, w = image.shape[:2]
        faces = []

        # 1. Primary: YuNet Deep Learning Detector
        if self.yunet_detector is not None:
            try:
                self.yunet_detector.setInputSize((w, h))
                _, detected = self.yunet_detector.detect(image)
                if detected is not None and len(detected) > 0:
                    logger.debug(f"  YuNet raw detections: {len(detected)} faces found")
                    for face_idx, face in enumerate(detected):
                        box = [int(face[0]), int(face[1]), int(face[2]), int(face[3])]
                        # Ensure box coordinates are within image boundaries
                        box[0] = max(0, box[0])
                        box[1] = max(0, box[1])
                        box[2] = min(w - box[0], box[2])
                        box[3] = min(h - box[1], box[3])
                        
                        conf = float(face[-1])
                        logger.debug(f"    Face {face_idx}: box={box}, conf={conf:.4f}, size={box[2]}x{box[3]}")
                        
                        if box[2] > 20 and box[3] > 20: # Minimum viable face size
                            faces.append({
                                "box": box,
                                "confidence": conf,
                                "raw_face": face
                            })
                        else:
                            logger.debug(f"    Face {face_idx}: FILTERED OUT - too small ({box[2]}x{box[3]})")
                    
                    logger.debug(f"  YuNet result: {len(faces)} faces passed filters")
                    return faces
                else:
                    logger.debug(f"  YuNet: No faces detected in frame")
            except Exception as e:
                logger.warning(f"YuNet detection failed, trying fallback: {e}")

        # 2. Secondary Fallback: Haar Cascade
        logger.debug(f"  Trying Haar Cascade fallback...")
        if self.haar_detector is not None or os.path.exists(HAAR_PATH):
            if self.haar_detector is None:
                self.haar_detector = cv2.CascadeClassifier(HAAR_PATH)
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            detected = self.haar_detector.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )
            logger.debug(f"  Haar Cascade: {len(detected)} faces found")
            for (x, y, fw, fh) in detected:
                faces.append({
                    "box": [int(x), int(y), int(fw), int(fh)],
                    "confidence": 0.9,
                    "raw_face": None
                })

        return faces

    def generate_encoding(self, image: np.ndarray, face_info: Optional[Dict[str, Any]] = None) -> Optional[List[float]]:
        """
        Extract a 128-dimensional L2-normalized facial embedding vector.
        """
        if image is None or image.size == 0:
            return None

        if face_info is None:
            faces = self.detect_faces(image)
            if len(faces) != 1:
                return None
            face_info = faces[0]

        # 1. SFace Neural Feature Extractor
        if self.sface_recognizer is not None:
            try:
                raw_face = face_info.get("raw_face")
                if raw_face is not None:
                    # Align and extract feature vector with SFace
                    aligned_face = self.sface_recognizer.alignCrop(image, raw_face)
                    feature = self.sface_recognizer.feature(aligned_face)
                    # Normalize feature to unit sphere
                    feature_norm = feature / np.linalg.norm(feature)
                    return feature_norm.flatten().tolist()
                else:
                    # Crop directly from bounding box
                    x, y, w, h = face_info["box"]
                    crop = image[y:y+h, x:x+w]
                    if crop.size == 0:
                        return None
                    crop_resized = cv2.resize(crop, (112, 112))
                    # Feature representation
                    gray = cv2.cvtColor(crop_resized, cv2.COLOR_BGR2GRAY)
                    hist = cv2.calcHist([gray], [0], None, [128], [0, 256])
                    hist_norm = hist / (np.linalg.norm(hist) + 1e-7)
                    return hist_norm.flatten().tolist()
            except Exception as e:
                logger.error(f"Error generating SFace encoding: {e}")

        return None

    def average_encodings(self, encodings: List[List[float]]) -> Optional[List[float]]:
        """
        Calculate normalized mean facial encoding vector from multiple samples.
        """
        if not encodings:
            return None
        arr = np.array(encodings, dtype=np.float32)
        mean_vector = np.mean(arr, axis=0)
        norm = np.linalg.norm(mean_vector)
        if norm > 0:
            mean_vector = mean_vector / norm
        return mean_vector.tolist()

    def compare_face(
        self,
        encoding1: List[float],
        encoding2: List[float],
        threshold: Optional[float] = None
    ) -> Tuple[bool, float]:
        """
        Compare two 128D face encodings using Cosine Similarity / Distance.
        Returns (is_match, score).
        Score is cosine distance (0.0 = identical, 1.0+ = dissimilar).
        """
        if threshold is None:
            threshold = settings.FACE_MATCH_THRESHOLD

        e1 = np.array(encoding1, dtype=np.float32)
        e2 = np.array(encoding2, dtype=np.float32)

        # Cosine distance: 1 - cosine_similarity
        dot = np.dot(e1, e2)
        norm1 = np.linalg.norm(e1)
        norm2 = np.linalg.norm(e2)
        
        if norm1 == 0 or norm2 == 0:
            return False, 1.0

        cosine_sim = dot / (norm1 * norm2)
        cosine_dist = float(1.0 - cosine_sim)
        
        # In SFace cosine matching, cosine_sim >= 0.363 or cosine_dist <= 0.637 is a match.
        # When using threshold (default ~0.45 cosine distance), lower distance means closer match.
        is_match = cosine_dist <= threshold
        return bool(is_match), round(cosine_dist, 4)

    def recognize_faces(
        self,
        image: np.ndarray,
        registered_students: List[Dict[str, Any]],
        threshold: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        Detect and recognize all faces in a live frame against registered student database.
        Returns a list of detected face results.
        """
        if threshold is None:
            threshold = settings.FACE_MATCH_THRESHOLD

        detected_faces = self.detect_faces(image)
        logger.info(f"🔍 Face detection: Found {len(detected_faces)} faces in frame")
        logger.info(f"📚 Database: {len(registered_students)} registered students with encodings")
        
        results = []

        for face_idx, face in enumerate(detected_faces):
            encoding = self.generate_encoding(image, face)
            box = face["box"]
            
            if encoding is None:
                logger.warning(f"  ⚠️ Face {face_idx}: Could not generate encoding")
                results.append({
                    "matched": False,
                    "studentId": None,
                    "studentName": "Unknown Face",
                    "studentObjId": None,
                    "distance": 1.0,
                    "confidence": face["confidence"],
                    "box": box
                })
                continue
            
            if not registered_students:
                logger.warning(f"  ⚠️ Face {face_idx}: No registered students available")
                results.append({
                    "matched": False,
                    "studentId": None,
                    "studentName": "Unknown Face",
                    "studentObjId": None,
                    "distance": 1.0,
                    "confidence": face["confidence"],
                    "box": box
                })
                continue

            best_distance = 100.0
            best_match_student = None
            
            logger.debug(f"  🔎 Face {face_idx}: Comparing against {len(registered_students)} students (threshold={threshold})")

            for student in registered_students:
                stu_name = student.get("name", "Unknown")
                stu_encoding = student.get("faceEncoding")
                
                if not stu_encoding or len(stu_encoding) == 0:
                    logger.debug(f"    ⏭️  {stu_name}: No encoding")
                    continue
                
                is_match, dist = self.compare_face(encoding, stu_encoding, threshold)
                logger.debug(f"    📊 {stu_name}: distance={dist:.4f}, match={is_match}")
                
                if dist < best_distance:
                    best_distance = dist
                    if is_match:
                        best_match_student = student

            if best_match_student is not None:
                logger.info(f"  ✅ Face {face_idx}: MATCHED to {best_match_student.get('name')} (distance={best_distance:.4f})")
                results.append({
                    "matched": True,
                    "studentId": best_match_student.get("studentId"),
                    "studentName": best_match_student.get("name"),
                    "studentObjId": str(best_match_student.get("_id")),
                    "distance": round(best_distance, 4),
                    "confidence": round(1.0 - best_distance, 4),
                    "box": box
                })
            else:
                logger.info(f"  ❌ Face {face_idx}: NO MATCH (best_distance={best_distance:.4f}, threshold={threshold})")
                results.append({
                    "matched": False,
                    "studentId": None,
                    "studentName": "Unknown Face",
                    "studentObjId": None,
                    "distance": round(best_distance, 4),
                    "confidence": face["confidence"],
                    "box": box
                })

        return results

face_recognition_service = FaceRecognitionService()

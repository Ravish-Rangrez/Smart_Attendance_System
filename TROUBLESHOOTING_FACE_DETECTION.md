# Face Detection Troubleshooting Guide

## Issue: "0 Detected" in Live Attendance Camera

When the live attendance camera shows "0 Detected" despite a person being visible on screen, the issue is typically with **face detection**, not face recognition.

### Root Cause Analysis

The system uses **YuNet** (deep learning model) for face detection with fallback to **Haar Cascade**. Common reasons for "0 Detected":

1. **YuNet score threshold too high** (was 0.6, too strict)
2. **Poor lighting conditions** (underexposed, shadows on face)
3. **Face angle not frontal** (profile/extreme angles rejected)
4. **Face too small in frame** (minimum 20x20 pixels required)
5. **Low resolution camera** (model trained on HD/FHD)
6. **YuNet model not loaded** (missing ONNX file)

### Changes Made (Aug 31, 2026)

#### 1. **Lowered YuNet Detection Threshold**
- **Before:** `score_threshold=0.6` (very strict, only high-confidence detections)
- **After:** `score_threshold=0.3` (more permissive, detects faces at various angles/conditions)
- **File:** `backend/app/services/face_recognition_service.py`
- **Config:** Can now be adjusted via `YUNET_SCORE_THRESHOLD` in `.env`

```python
# In config.py
YUNET_SCORE_THRESHOLD: float = 0.3

# In face_recognition_service.py
score_threshold=settings.YUNET_SCORE_THRESHOLD
```

#### 2. **Enhanced Debug Logging**
Added detailed logging to track face detection pipeline:

```
🔍 Face detection: Found X faces in frame
📚 Database: Y registered students with encodings
  🔎 Face 0: Comparing against Y students (threshold=0.55)
    📊 Student Name: distance=0.4567, match=True/False
  ✅ Face 0: MATCHED to Student Name (distance=0.1234)
  ❌ Face 0: NO MATCH (best_distance=0.7890, threshold=0.55)
```

View logs in backend console output.

### Debugging Steps

#### Step 1: Check Backend Logs

Run backend with output visible:
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Expected output when camera is running:
```
🔍 Face detection: Found 1 faces in frame
📚 Database: 1 registered students with encodings
  YuNet raw detections: 1 faces found
    Face 0: box=[...], conf=0.8234, size=280x320
  YuNet result: 1 faces passed filters
  🔎 Face 0: Comparing against 1 students (threshold=0.55)
    📊 Saqib Rangrez: distance=0.2345, match=True
  ✅ Face 0: MATCHED to Saqib Rangrez (distance=0.2345)
```

If seeing `YuNet result: 0 faces passed filters`, face was detected but filtered out.

#### Step 2: Verify Students Have Face Encodings

```bash
# Via API (with auth token)
curl -H "Authorization: Bearer <token>" http://127.0.0.1:8000/api/students

# Response should show hasFaceRegistered: true
```

#### Step 3: Check Camera Feed Quality

- **Lighting:** Ensure face is well-lit (avoid backlighting)
- **Angle:** Face should be frontal (±30 degrees max)
- **Distance:** Face should be ~30-60cm from camera
- **Size:** Face should be ~80x80 pixels minimum
- **Clarity:** Avoid motion blur, ensure focus

#### Step 4: Try Lower Threshold Values

If still not detecting, adjust in `.env`:

```env
YUNET_SCORE_THRESHOLD=0.2  # Even more permissive
# Or even
YUNET_SCORE_THRESHOLD=0.1  # Very permissive (may get false positives)
```

Restart backend after changing `.env`.

### Threshold Tuning Guide

| Threshold | Sensitivity | Best For |
|-----------|------------|----------|
| 0.9+ | Very strict | Frontal faces only, high confidence |
| 0.6 | Strict | Well-lit, frontal faces (original) |
| 0.3 | Moderate | **Current default**, good balance |
| 0.1 | Permissive | Difficult conditions, slight angles |
| <0.1 | Very permissive | Risk of false positives |

### Complete Detection-to-Recognition Pipeline

```
1. Frame captured → base64_to_cv2_image()
2. Face detection → YuNet (score_threshold=0.3)
   ├─ YuNet succeeds → extract box, confidence
   ├─ YuNet fails → fallback to Haar Cascade
   └─ No faces → return empty result
3. Face encoding → SFace 128D embedding
   ├─ Success → normalized vector
   └─ Fail → mark as "Unknown Face"
4. Matching → cosine distance comparison
   ├─ distance ≤ 0.55 → MATCH
   └─ distance > 0.55 → NO MATCH
5. Attendance marking → check if already marked
   ├─ New → add to roll & mark newlyMarked=true
   └─ Already marked → mark already_marked=true
```

### Known Issues & Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| Face detector not loading | "0 Detected" always | Verify `face_detection_yunet_2023mar.onnx` exists in `backend/app/cv_models/` |
| SFace model missing | Detects face but doesn't match | Verify `face_recognition_sface_2021dec.onnx` exists in `backend/app/cv_models/` |
| No students registered | Shows "Unknown Face" | Complete face registration for at least 1 student |
| Student has no encoding | Face detected but no match | Re-register student faces (5+ samples) |
| Threshold too high | Never detects faces | Lower `YUNET_SCORE_THRESHOLD` (now configurable) |
| Threshold too low | False positives, noise detected | Raise `YUNET_SCORE_THRESHOLD` slightly |
| Poor image quality | Intermittent detection | Improve lighting, ensure frontal angle |
| Camera resolution too low | Only large faces detected | Use camera with higher resolution if possible |

### Configuration Summary

**Backend Settings (backend/.env)**
```env
# Face Detection (YuNet)
YUNET_SCORE_THRESHOLD=0.3  # Detection sensitivity [0.0-1.0], lower = more sensitive

# Face Matching (Cosine Distance)
FACE_MATCH_THRESHOLD=0.55  # Match threshold [0.0-1.0], lower = stricter matching

# Face Enrollment
REQUIRED_FACE_SAMPLES=5    # Samples needed for registration
```

### Performance Notes

- **YuNet:** ~50-100ms per frame on CPU (Intel i7+)
- **SFace:** ~10-20ms per face encoding
- **Matching:** ~1ms per student comparison
- **Total:** ~100-150ms per frame with 5 students

If slower, check:
- CPU usage (Uvicorn hot-reload can increase it)
- Concurrent requests (frame processing interval in frontend)
- MongoDB latency (especially if using slow internet connection to Atlas)

### Next Steps

1. **Immediate:** Lower threshold is applied (0.3 default)
2. **Test:** Navigate to Live Attendance Camera, show face
3. **Monitor:** Check backend logs for detection pipeline
4. **Adjust:** Fine-tune thresholds based on real usage conditions
5. **Verify:** Confirm "✅ Face marked" appears in live feed

For additional debugging, enable `DEBUG=true` in `.env` for more verbose logging.

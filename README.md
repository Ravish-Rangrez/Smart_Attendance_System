# 🎓 Smart Attendance System Using Face Recognition

A modern, production-grade automated attendance management platform built with **FastAPI**, **React**, **TypeScript**, **MongoDB**, and **OpenCV Deep Learning Face Recognition**.

---

## 🌟 Key Features

1. **Student Registration & Management**:
   - Register students with unique Roll Number, Name, Department, and Class.
   - Comprehensive student directory with live search, filters, and status indicators.
   - Face enrollment status badges (Enrolled / Not Enrolled).

2. **AI Facial Registration Studio**:
   - Webcam image capture via browser (`navigator.mediaDevices.getUserMedia`).
   - Real-time face detection with visual bounding box feedback.
   - Multi-sample collection (5 angle/expression frames) to ensure high matching accuracy.
   - Computes normalized mean 128-dimensional embedding vectors stored securely in MongoDB.

3. **Live Attendance Camera & Real-Time Recognition**:
   - One-click attendance launch by academic subject (Mathematics, Physics, Chemistry, English, etc.).
   - Live face recognition with dynamic green/red canvas bounding boxes and student names.
   - **Strict Duplicate Prevention**: Multiple detections of the same student within a session only mark attendance once.
   - Live roll-call ticker showing newly marked students with timestamps.
   - Controlled frame processing rate (1 frame per 1.5s) to ensure low CPU overhead and high responsiveness.

4. **Session Outcome & Roll Call Reports**:
   - Immediate session summary upon completion: Total Enrolled, Present Count, Absent Count, and Attendance Turnout Percentage.
   - Detailed present vs. absent student breakdown tables.
   - One-click **Export to CSV**.

5. **Analytics Dashboard & Reports**:
   - Live telemetry KPI cards (Total Students, Total Subjects, Today's Lectures, Overall Attendance Rate).
   - Recharts visual graphs for attendance trends and subject turnout rates.
   - Student-wise attendance percentage report.

6. **Secure Admin Authentication**:
   - Secure Bcrypt password hashing and JWT Bearer token authentication.
   - Protected API routes and client-side authentication guards.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, React Router v7, Axios, Lucide Icons, Recharts |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, Motor (Async MongoDB), Pydantic v2, Jose (JWT), Bcrypt |
| **Face Engine** | OpenCV YuNet (Face Detector) + OpenCV SFace (128D Deep Feature Embeddings) / Fallback |
| **Database** | MongoDB Atlas / MongoDB Community Server (Async Motor Driver) |

---

## 📂 Project Structure

```text
Smart-Attendance/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py              # Centralized pydantic-settings
│   │   │   ├── database.py            # Motor async client & unique index setup
│   │   │   └── security.py            # Bcrypt hashing & JWT management
│   │   ├── cv_models/                 # Neural network ONNX models (YuNet, SFace)
│   │   ├── dependencies/
│   │   │   └── auth_dependency.py     # JWT Bearer guard
│   │   ├── models/                    # Pydantic entity schemas
│   │   ├── repositories/              # Database query repositories
│   │   ├── routers/                   # Modular FastAPI API routers
│   │   ├── schemas/                   # Request/response validation schemas
│   │   ├── services/                  # Business logic & face recognition services
│   │   │   ├── auth_service.py
│   │   │   ├── student_service.py
│   │   │   ├── face_recognition_service.py
│   │   │   ├── attendance_service.py
│   │   │   └── report_service.py
│   │   ├── utils/                     # Image processing & JSON response envelopes
│   │   └── main.py                    # FastAPI entrypoint with CORS & lifespan
│   ├── seed_db.py                     # Admin & subject database seed script
│   ├── requirements.txt               # Backend Python dependencies
│   ├── .env                           # Environment configuration
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/                # Reusable UI cards, modal, webcam viewport
│   │   ├── context/                   # AuthContext & Toast notification provider
│   │   ├── layouts/                   # Main responsive layout with sidebar & navbar
│   │   ├── pages/                     # Full SaaS dashboard & studio pages
│   │   ├── routes/                    # Protected React routes
│   │   ├── services/                  # Axios API client modules
│   │   ├── types/                     # TypeScript definitions
│   │   ├── App.tsx
│   │   └── index.css                  # Tailwind styles
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- **Python**: 3.10+ or 3.11+
- **Node.js**: v18+ or v20+ / v24+
- **MongoDB**: MongoDB Atlas connection URI or local MongoDB Community Server

---

### 2. Backend Setup

1. Open PowerShell or Command Prompt and navigate to the backend directory:
   ```powershell
   cd C:\Ravish\Smart-Attendance\backend
   ```

2. Create and activate a Python virtual environment:
   ```powershell
   # PowerShell
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Or in Command Prompt (cmd)
   # venv\Scripts\activate.bat
   ```

3. Install required dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

4. Verify your `.env` configuration in `backend/.env`:
   ```env
   PORT=8000
   HOST=127.0.0.1
   PROJECT_NAME="Smart Attendance System API"
   API_V1_STR="/api"
   DEBUG=True

   MONGODB_URL=mongodb+srv://ravishrang1315_db_user:L0XI2BSkbg5XloW5@cluster0.fupl3xr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   DATABASE_NAME=smart_attendance_db

   JWT_SECRET_KEY=smart_attendance_dev_secret_key_change_in_production_2026
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   FACE_MATCH_THRESHOLD=0.45
   ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   ```

5. Seed the database with default Administrator and Subjects:
   ```powershell
   python seed_db.py
   ```

6. Start the FastAPI backend server:
   ```powershell
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

---

### 3. Frontend Setup

1. Open a new terminal in the `frontend` directory:
   ```powershell
   cd C:\Ravish\Smart-Attendance\frontend
   ```

2. Install Node packages:
   ```powershell
   npm install
   ```

3. Start the Vite development server:
   ```powershell
   npm run dev
   ```

4. Open your browser at:
   👉 **http://localhost:5173**

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| **System Administrator** | `admin@smartattendance.com` | `admin123` |

*(A convenient "Auto Fill" button is also present on the login screen for rapid demonstrations).*

---

## 📡 API Endpoints & Swagger Documentation

Interactive OpenAPI / Swagger Documentation is available at:
👉 **http://127.0.0.1:8000/docs**

### Core Endpoints Summary:

- **Auth**:
  - `POST /api/auth/login` — Admin login with JWT token issuance
  - `GET /api/auth/me` — Authenticated profile details
- **Students**:
  - `GET /api/students` — List all students with search & pagination
  - `GET /api/students/{id}` — Get student profile
  - `POST /api/students/register` — Register student details
  - `POST /api/students/face/validate-frame` — Live camera frame face validation
  - `POST /api/students/{id}/register-face` — Enroll 5-sample face embeddings
  - `DELETE /api/students/{id}` — Delete student record
- **Subjects**:
  - `GET /api/subjects` — List curriculum subjects
  - `POST /api/subjects` — Create new subject
- **Attendance**:
  - `POST /api/attendance/start` — Initialize active attendance session
  - `POST /api/attendance/recognize` — Live facial recognition & automatic idempotent marking
  - `POST /api/attendance/finish` — Finalize session and calculate percentages
  - `GET /api/attendance/history` — List past attendance sessions
  - `GET /api/attendance/session/{sessionId}` — Session details with present & absent lists
- **Reports**:
  - `GET /api/reports/dashboard` — Live counters, KPIs, and trend telemetry
  - `GET /api/reports/students` — Student-wise attendance percentage report
  - `GET /api/reports/subjects` — Subject turnout rates
- **Health**:
  - `GET /health` / `GET /api/health` — System status and MongoDB ping

---

## 💡 College Demonstration Workflow

1. **Sign In**: Navigate to `http://localhost:5173/login`, click **Auto Fill**, then **Sign In**.
2. **Explore Dashboard**: View live KPI cards, attendance trend chart, and recent sessions.
3. **Register Student**:
   - Go to **Register Student** (`/students/register`).
   - Enter Roll Number, Student Name, Department, and Class.
   - Click **Continue to Face Registration**.
4. **Enroll Face**:
   - Allow camera access in the browser.
   - Look into the camera; notice the live green detection box.
   - Capture 5 face samples.
   - Click **Save & Complete Registration**.
5. **Start Attendance**:
   - Go to **Start Attendance** (`/attendance/start`).
   - Select a subject (e.g. Mathematics) and click **Launch Attendance Camera**.
6. **Live Facial Recognition**:
   - Look at the camera; your face is recognized with a green bounding box and `✓ [Your Name]`.
   - The counter updates (e.g., `1 / 1 Present`) and your name appears on the live ticker.
   - Notice that subsequent frames recognize you without creating duplicate attendance.
7. **Finish Attendance**:
   - Click **Finish Attendance**.
   - Review the final turnout percentage and present/absent breakdown.
   - Click **Export CSV** to download the official attendance sheet.
8. **View Reports**:
   - Go to **Reports & Analytics** (`/reports`) to inspect student percentages and subject turnout comparisons.

---

## 🔧 Troubleshooting

- **Camera Permission**: If the webcam doesn't start, ensure you have clicked "Allow" in your browser's address bar for camera permissions.
- **MongoDB Atlas Connection**: If you experience connection timeout, verify that your IP is allowlisted on MongoDB Atlas (Network Access -> Allow Access from Anywhere `0.0.0.0/0` during development).

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Student {
  id: string;
  studentId: string; // Roll Number
  name: string;
  department: string;
  className: string;
  hasFaceRegistered: boolean;
  registeredAt?: string;
  isActive: boolean;
  attendancePercentage?: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt?: string;
}

export interface AttendanceSession {
  id: string;
  subjectId: string;
  subjectName: string;
  date: string;
  startedAt: string;
  finishedAt?: string;
  status: 'ACTIVE' | 'COMPLETED';
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  attendancePercentage: number;
}

export interface DetectedPerson {
  matched: boolean;
  studentId?: string; // Roll number
  studentName: string;
  studentObjId?: string;
  alreadyMarked: boolean;
  newlyMarked: boolean;
  distance: number;
  confidence: number;
  box: [number, number, number, number]; // [x, y, w, h]
}

export interface FrameRecognitionResult {
  sessionId: string;
  faces_detected: number;
  persons: DetectedPerson[];
  totalPresent: number;
  totalStudents: number;
}

export interface AttendanceRecordDetail {
  id: string;
  studentId: string;
  studentName: string;
  department?: string;
  className?: string;
  status: 'PRESENT' | 'ABSENT';
  markedAt?: string;
}

export interface SessionDetail {
  session: AttendanceSession;
  records: AttendanceRecordDetail[];
  absentStudents: AttendanceRecordDetail[];
}

export interface DashboardStats {
  totalStudents: number;
  totalSubjects: number;
  todaySessions: number;
  overallAttendancePercentage: number;
  recentSessions: AttendanceSession[];
  attendanceTrend: {
    date: string;
    subject: string;
    percentage: number;
    present: number;
    total: number;
  }[];
}

export interface StudentReport {
  id: string;
  studentId: string;
  name: string;
  department: string;
  className: string;
  totalSessions: number;
  attendedSessions: number;
  percentage: number;
}

export interface SubjectReport {
  id: string;
  name: string;
  code: string;
  totalSessions: number;
  averageAttendancePercentage: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

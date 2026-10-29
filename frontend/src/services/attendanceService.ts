import api from './api';
import { ApiResponse, AttendanceSession, FrameRecognitionResult, SessionDetail } from '../types';

export const attendanceService = {
  startSession: async (subjectId: string): Promise<AttendanceSession> => {
    const res = await api.post<ApiResponse<AttendanceSession>>('/attendance/start', { subjectId });
    return res.data.data;
  },

  recognizeFrame: async (sessionId: string, imageBase64: string): Promise<FrameRecognitionResult> => {
    const res = await api.post<ApiResponse<FrameRecognitionResult>>('/attendance/recognize', {
      sessionId,
      image: imageBase64,
    });
    return res.data.data;
  },

  finishSession: async (sessionId: string): Promise<AttendanceSession> => {
    const res = await api.post<ApiResponse<AttendanceSession>>('/attendance/finish', { sessionId });
    return res.data.data;
  },

  getHistory: async (page = 1, limit = 50): Promise<{ total: number; sessions: AttendanceSession[] }> => {
    const res = await api.get<ApiResponse<{ total: number; sessions: AttendanceSession[] }>>('/attendance/history', {
      params: { page, limit },
    });
    return res.data.data;
  },

  getSessionDetail: async (sessionId: string): Promise<SessionDetail> => {
    const res = await api.get<ApiResponse<SessionDetail>>(`/attendance/session/${sessionId}`);
    return res.data.data;
  },
};

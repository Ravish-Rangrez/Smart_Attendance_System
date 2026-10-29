import api from './api';
import { ApiResponse, Student } from '../types';

export interface StudentListResult {
  total: number;
  page: number;
  limit: number;
  students: Student[];
}

export interface ValidateFrameResult {
  valid: boolean;
  faces_detected: number;
  message: string;
  box: [number, number, number, number] | null;
}

export const studentService = {
  listStudents: async (params?: {
    search?: string;
    department?: string;
    className?: string;
    page?: number;
    limit?: number;
  }): Promise<{ total: number; students: Student[] }> => {
    const res = await api.get<ApiResponse<{ total: number; students: Student[] }>>('/students', { params });
    return res.data.data;
  },

  getStudent: async (id: string): Promise<Student> => {
    const res = await api.get<ApiResponse<Student>>(`/students/${id}`);
    return res.data.data;
  },

  registerStudent: async (data: {
    studentId: string;
    name: string;
    department: string;
    className: string;
  }): Promise<Student> => {
    const res = await api.post<ApiResponse<Student>>('/students/register', data);
    return res.data.data;
  },

  deleteStudent: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/students/${id}`);
  },

  validateFaceFrame: async (imageBase64: string): Promise<ValidateFrameResult> => {
    const res = await api.post<ApiResponse<ValidateFrameResult>>('/students/face/validate-frame', {
      image: imageBase64,
    });
    return res.data.data;
  },

  registerFaceSamples: async (studentId: string, samples: string[]): Promise<{ message: string }> => {
    const res = await api.post<ApiResponse<{ message: string }>>(`/students/${studentId}/register-face`, {
      studentId,
      samples,
    });
    return res.data.data;
  },
};

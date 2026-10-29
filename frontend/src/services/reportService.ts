import api from './api';
import { ApiResponse, DashboardStats, StudentReport, SubjectReport } from '../types';

export const reportService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await api.get<ApiResponse<DashboardStats>>('/reports/dashboard');
    return res.data.data;
  },

  getStudentsReport: async (): Promise<{ total: number; students: StudentReport[] }> => {
    const res = await api.get<ApiResponse<{ total: number; students: StudentReport[] }>>('/reports/students');
    return res.data.data;
  },

  getSubjectsReport: async (): Promise<{ total: number; subjects: SubjectReport[] }> => {
    const res = await api.get<ApiResponse<{ total: number; subjects: SubjectReport[] }>>('/reports/subjects');
    return res.data.data;
  },
};

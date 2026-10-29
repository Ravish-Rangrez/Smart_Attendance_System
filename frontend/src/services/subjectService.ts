import api from './api';
import { ApiResponse, Subject } from '../types';

export const subjectService = {
  listSubjects: async (): Promise<{ total: number; subjects: Subject[] }> => {
    const res = await api.get<ApiResponse<{ total: number; subjects: Subject[] }>>('/subjects');
    return res.data.data;
  },

  createSubject: async (data: { name: string; code: string }): Promise<Subject> => {
    const res = await api.post<ApiResponse<Subject>>('/subjects', data);
    return res.data.data;
  },
};

import { apiRequest } from './api.js';

export const studentService = {
  getDashboard: () => apiRequest('/api/students/dashboard'),
  getProfile: () => apiRequest('/api/students/profile'),
  getMarks: () => apiRequest('/api/students/marks'),
  getAttendance: () => apiRequest('/api/students/attendance'),
  getFees: () => apiRequest('/api/students/fees'),
  getNotices: () => apiRequest('/api/students/notices'),
};

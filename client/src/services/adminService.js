import { apiRequest } from './api.js';

export const adminService = {
  getDashboard: () => apiRequest('/api/admin/dashboard'),
  getStudents: () => apiRequest('/api/admin/students'),
  getStudentById: (studentId) => apiRequest(`/api/admin/students/${studentId}`),
  getNotices: () => apiRequest('/api/admin/notices'),
  createNotice: (payload) => apiRequest('/api/admin/notices', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateNotice: (noticeId, payload) => apiRequest(`/api/admin/notices/${noticeId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  deleteNotice: (noticeId) => apiRequest(`/api/admin/notices/${noticeId}`, {
    method: 'DELETE',
  }),
};

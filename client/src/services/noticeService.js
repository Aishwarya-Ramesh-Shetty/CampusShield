import { apiRequest } from './api.js';

export const noticeService = {
  getActiveNotices: () => apiRequest('/api/students/notices'),
};

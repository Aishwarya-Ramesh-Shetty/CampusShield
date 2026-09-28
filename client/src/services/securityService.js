import { apiRequest } from './api.js';

export const securityService = {
  getDashboard: () => apiRequest('/api/security/dashboard'),
  startScan: () => apiRequest('/api/security/scans', { method: 'POST' }),
  getScans: () => apiRequest('/api/security/scans'),
  getScan: (scanId) => apiRequest(`/api/security/scans/${encodeURIComponent(scanId)}`),
  getScanResults: (scanId) => apiRequest(`/api/security/scans/${encodeURIComponent(scanId)}/results`),
  getScanFindings: (scanId) => apiRequest(`/api/security/scans/${encodeURIComponent(scanId)}/findings`),
  getFindings: () => apiRequest('/api/security/findings'),
  getFinding: (findingId) => apiRequest(`/api/security/findings/${encodeURIComponent(findingId)}`),
};
import api from './axios';

let auditCache = null;

export const auditService = {
  /**
   * Fetches the audit logs for administrators
   */
  async getAuditLogs(forceRefresh = false) {
    if (auditCache && !forceRefresh) return auditCache;
    const response = await api.get('/admin/audit-logs');
    auditCache = response.data;
    return response.data;
  }
};

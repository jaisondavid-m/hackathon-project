import api from './axios';

export const auditService = {
  /**
   * Fetches the audit logs for administrators
   */
  async getAuditLogs() {
    const response = await api.get('/admin/audit-logs');
    return response.data;
  }
};

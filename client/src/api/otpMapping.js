import api from './axios';

export const otpMappingService = {
  /**
   * Fetches all registered student class-venue permissions
   */
  async getOtpMappings() {
    const response = await api.get('/admin/otp-mappings');
    return response.data;
  },

  /**
   * Registers a new student class-venue permission
   */
  async createOtpMapping(mappingData) {
    const response = await api.post('/admin/otp-mappings', mappingData);
    return response.data;
  },

  /**
   * Removes a student class-venue permission mapping
   */
  async deleteOtpMapping(id) {
    const response = await api.delete(`/admin/otp-mappings/${id}`);
    return response.data;
  }
};

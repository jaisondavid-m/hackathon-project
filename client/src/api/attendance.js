import api from './axios';

export const attendanceService = {
  /**
   * Starts a new OTP attendance session (Faculty only)
   * @param {string} classId
   * @param {number} hourNumber
   * @param {number} venueId
   */
  async startSession(classId, hourNumber, venueId) {
    const response = await api.post('/faculty/sessions', {
      class_id: classId,
      hour_number: Number(hourNumber),
      venue_id: Number(venueId)
    });
    return response.data;
  },

  /**
   * Gets current active OTP sessions (Faculty only)
   */
  async getActiveSessions() {
    const response = await api.get('/faculty/sessions');
    return response.data;
  },

  /**
   * Gets logged attendance records for a specific session (Faculty only)
   */
  async getClassLogs(classId, hourNumber, date) {
    const response = await api.get('/faculty/attendance/logs', {
      params: {
        class_id: classId,
        hour_number: hourNumber,
        date: date
      }
    });
    return response.data;
  },

  /**
   * Student submits an OTP to register presence (Student only)
   * @param {string} otp 6-digit OTP code
   * @param {number} latitude Student latitude
   * @param {number} longitude Student longitude
   */
  async submitOTP(otp, latitude, longitude) {
    const response = await api.post('/student/attendance/submit', {
      otp,
      latitude: Number(latitude),
      longitude: Number(longitude)
    });
    return response.data;
  },

  /**
   * Student retrieves their logged records & stats (Student only)
   */
  async getStudentRecords() {
    const response = await api.get('/student/attendance/records');
    return response.data;
  }
};

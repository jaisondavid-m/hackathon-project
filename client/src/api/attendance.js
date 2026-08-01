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
    let encryptedOtp = otp;
    try {
      const keyStr = import.meta.env.VITE_OTP_ENCRYPTION_KEY || 'default_otp_secret_key_12345678';
      const enc = new TextEncoder();
      
      // 1. Derive 256-bit AES key by hashing the passphrase with SHA-256
      const keyBuffer = await window.crypto.subtle.digest("SHA-256", enc.encode(keyStr));
      const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        keyBuffer,
        { name: "AES-CBC" },
        false,
        ["encrypt"]
      );
      
      // 2. Generate a random 16-byte initialization vector (IV)
      const iv = window.crypto.getRandomValues(new Uint8Array(16));
      
      // 3. Encrypt the OTP value
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-CBC", iv: iv },
        cryptoKey,
        enc.encode(otp)
      );
      
      // 4. Combine IV and encrypted bytes into a single array
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);
      
      // 5. Encode combined bytes as a hex string
      encryptedOtp = Array.from(combined).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.error('Failed to encrypt OTP:', e);
    }

    const response = await api.post('/student/attendance/submit', {
      otp: encryptedOtp,
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

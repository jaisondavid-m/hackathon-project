import api from './axios';

export const configService = {
  /**
   * Fetches the daily 7 class hours timeslots
   */
  async getHourConfigs() {
    const response = await api.get('/hours');
    return response.data;
  },

  /**
   * Batch updates timeslots for hours (Admin only)
   * @param {Array} hours Array of hour configs: [{hour_number, start_time, end_time}]
   */
  async saveHourConfigs(hours) {
    const response = await api.post('/admin/hours', hours);
    return response.data;
  },

  /**
   * Fetches all custom holidays calendar overrides
   */
  async getHolidays() {
    const response = await api.get('/holidays');
    return response.data;
  },

  /**
   * Registers or updates a calendar day status override (Admin only)
   * @param {object} param0 
   * @param {string} param0.date YYYY-MM-DD
   * @param {string} param0.name Reason description
   * @param {boolean} param0.is_holiday True for holiday, False for working day
   */
  async saveHoliday({ date, name, is_holiday }) {
    const response = await api.post('/admin/holidays', { date, name, is_holiday });
    return response.data;
  }
};

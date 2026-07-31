import api from './axios';

export const venueService = {
  /**
   * Fetches all registered class venues
   */
  async getVenues() {
    const response = await api.get('/venues');
    return response.data;
  },

  /**
   * Registers a new geofenced venue (Admin only)
   */
  async createVenue(venueData) {
    const response = await api.post('/admin/venues', venueData);
    return response.data;
  }
};

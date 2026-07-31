import api from './axios';

let venuesCache = null;

export const venueService = {
  /**
   * Fetches all registered class venues
   */
  async getVenues() {
    if (venuesCache) return venuesCache;
    const response = await api.get('/venues');
    venuesCache = response.data;
    return response.data;
  },

  /**
   * Registers a new geofenced venue (Admin only)
   */
  async createVenue(venueData) {
    const response = await api.post('/admin/venues', venueData);
    venuesCache = null; // Invalidate cache
    return response.data;
  },

  /**
   * Updates an existing geofenced venue (Admin only)
   */
  async updateVenue(id, venueData) {
    const response = await api.put(`/admin/venues/${id}`, venueData);
    venuesCache = null; // Invalidate cache
    return response.data;
  }
};

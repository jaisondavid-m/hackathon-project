import api from './axios';

export const authService = {
  /**
   * Logs in a user
   * @param {string} emailid 
   * @param {string} password 
   */
  async login(emailid, password) {
    const response = await api.post('/login', { emailid, password });
    const { token, user } = response.data;
    
    // Save to localStorage
    localStorage.setItem('pcdp_token', token);
    localStorage.setItem('pcdp_user', JSON.stringify(user));
    
    return user;
  },

  /**
   * Fetches current user profile
   */
  async getProfile() {
    const response = await api.get('/profile');
    return response.data;
  },

  /**
   * Adds a new user (Admin only)
   * @param {object} param0 
   * @param {string} param0.name
   * @param {string} param0.emailid
   * @param {string} param0.password
   * @param {string} param0.role
   */
  async addUser({ name, emailid, password, role }) {
    const response = await api.post('/admin/users', { name, emailid, password, role });
    return response.data;
  },

  /**
   * Fetches all registered users (Admin only)
   */
  async getUsers() {
    const response = await api.get('/admin/users');
    return response.data;
  },

  /**
   * Blocks or unblocks a user by ID (Admin only)
   * @param {number|string} id User ID
   */
  async toggleBlockUser(id) {
    const response = await api.post(`/admin/users/${id}/toggle-block`);
    return response.data;
  },

  /**
   * Clears auth data and logs out
   */
  logout() {
    localStorage.removeItem('pcdp_token');
    localStorage.removeItem('pcdp_user');
  },

  /**
   * Gets stored user from localStorage
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('pcdp_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  },

  /**
   * Checks if user is authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem('pcdp_token');
  }
};

import api from './api';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    // Only store token if 2FA is not required
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      // Store role in localStorage for easy access
      if (response.data.user?.role) {
        localStorage.setItem('role', response.data.user.role.toLowerCase());
      }
    }
    // If 2FA is required, return the response with requires2FA flag
    return response.data;
  },

  async verify2FA(code) {
    const response = await api.post('/auth/verify-2fa', { code });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      // Store role in localStorage for easy access
      if (response.data.user?.role) {
        localStorage.setItem('role', response.data.user.role.toLowerCase());
      }
    }
    return response.data;
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData);
    // Registration does not return token - user must login after registration
    return response.data;
  },

  async me() {
    const response = await api.get('/auth/me');
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
      const role = (response.data.role || 'student').toLowerCase();
      localStorage.setItem('role', role);
    }
    return response.data;
  },

  async logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken() {
    return localStorage.getItem('token');
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
};


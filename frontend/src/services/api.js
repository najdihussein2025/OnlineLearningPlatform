import axios from 'axios';

// Ensure API URL points to backend localhost:5000 where the backend is forced to run
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Required for session cookies
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Check if 2FA is pending
      const is2FAPending = localStorage.getItem('2fa_pending') === 'true';
      
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Don't redirect if 2FA is pending (user is in 2FA flow)
      if (is2FAPending) {
        // If on verify-2fa page, stay there; otherwise redirect to verify-2fa
        if (window.location.pathname !== '/verify-2fa') {
          window.location.href = '/verify-2fa';
        }
        return Promise.reject(error);
      }
      
      // Only redirect to login if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;


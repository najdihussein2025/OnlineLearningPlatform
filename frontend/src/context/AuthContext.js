import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = authService.getToken();

    let mounted = true;
    const loadCurrentUser = async () => {
      try {
        if (!token) {
          setUser(null);
          localStorage.removeItem('role');
          return;
        }

        // Try to refresh user info from server (auth/me)
        const me = await authService.me();
        if (!mounted) return;
        const role = (me?.role || 'student').toLowerCase();
        localStorage.setItem('role', role);
        setUser({ ...me, role });
      } catch (err) {
        // if me fails (e.g., invalid token), clear auth
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadCurrentUser();

    return () => { mounted = false; };
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      // Check if 2FA is required
      if (data.requires2FA) {
        // Set 2FA pending state
        localStorage.setItem('2fa_pending', 'true');
        return { success: true, data, requires2FA: true };
      }
      // Clear 2FA pending if it exists (shouldn't happen, but safety check)
      localStorage.removeItem('2fa_pending');
      const userData = data.user || { email, firstName: email.split('@')[0] };
      // Normalize role to lowercase and set default to student
      const role = (data.user?.role || localStorage.getItem('role') || 'student').toLowerCase();
      localStorage.setItem('role', role);
      setUser({ ...userData, role });
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const verify2FA = async (code) => {
    try {
      const data = await authService.verify2FA(code);
      // Remove 2FA pending state on successful verification
      localStorage.removeItem('2fa_pending');
      const userData = data.user || {};
      const role = (data.user?.role || 'admin').toLowerCase();
      localStorage.setItem('role', role);
      setUser({ ...userData, role });
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Verification failed',
      };
    }
  };

  const register = async (userData) => {
    try {
      const data = await authService.register(userData);
      // Registration successful - user must login to get token
      // Do not store any user data or role on registration
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const logout = () => {
    authService.logout();
    localStorage.removeItem('role');
    localStorage.removeItem('2fa_pending'); // Clear 2FA pending state on logout
    setUser(null);
  };

  const getRole = () => {
    if (user?.role) return user.role;
    return localStorage.getItem('role') || null;
  };

  // Check authentication: user exists AND token exists
  const isAuthenticated = !!user && !!authService.getToken();

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    verify2FA,
    isAuthenticated,
    getRole,
    role: user?.role || localStorage.getItem('role') || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


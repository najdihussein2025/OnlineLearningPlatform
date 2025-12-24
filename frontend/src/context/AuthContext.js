import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = authService.getToken();
    const currentUser = authService.getCurrentUser();
    const role = localStorage.getItem('role');
    
    if (token && currentUser) {
      setUser({ ...currentUser, role: role || 'student' });
    } else {
      // Clear any stale data if not authenticated
      setUser(null);
      localStorage.removeItem('role');
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      const userData = data.user || { email, firstName: email.split('@')[0] };
      // Set default role to student if not provided (for UI demo)
      const role = data.user?.role || localStorage.getItem('role') || 'student';
      localStorage.setItem('role', role);
      setUser({ ...userData, role });
      return { success: true, data };
    } catch (error) {
      // For UI testing without backend: create mock auth
      if (!error.response) {
        const userData = { email, firstName: email.split('@')[0], id: Date.now() };
        const role = email.includes('admin') ? 'admin' : 
                     email.includes('instructor') ? 'instructor' : 'student';
        localStorage.setItem('token', 'mock-token-' + Date.now());
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('role', role);
        setUser({ ...userData, role });
        return { success: true, data: { user: userData } };
      }
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const register = async (userData) => {
    try {
      const data = await authService.register(userData);
      const newUser = data.user || { ...userData, id: Date.now() };
      // Set default role to student if not provided (for UI demo)
      const role = data.user?.role || localStorage.getItem('role') || 'student';
      localStorage.setItem('role', role);
      setUser({ ...newUser, role });
      return { success: true, data };
    } catch (error) {
      // For UI testing without backend: create mock auth
      if (!error.response) {
        const newUser = { ...userData, id: Date.now() };
        const role = userData.email.includes('admin') ? 'admin' : 
                     userData.email.includes('instructor') ? 'instructor' : 'student';
        localStorage.setItem('token', 'mock-token-' + Date.now());
        localStorage.setItem('user', JSON.stringify(newUser));
        localStorage.setItem('role', role);
        setUser({ ...newUser, role });
        return { success: true, data: { user: newUser } };
      }
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const logout = () => {
    authService.logout();
    localStorage.removeItem('role');
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


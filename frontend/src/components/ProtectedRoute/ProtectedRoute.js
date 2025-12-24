import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, loading, role } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Double-check authentication with token
  const hasToken = !!authService.getToken();
  const hasUser = !!authService.getCurrentUser();
  
  if (!isAuthenticated || !hasToken || !hasUser) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    // Redirect to appropriate dashboard based on role, or login if no role
    if (role === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    } else if (role === 'instructor') {
      return <Navigate to="/instructor/dashboard" replace />;
    } else if (role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;


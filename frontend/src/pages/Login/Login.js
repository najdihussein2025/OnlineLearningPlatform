import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button/Button';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const result = await login(formData.email, formData.password);
    setLoading(false);

    if (result.success) {
      // Extract role from backend response - normalize to lowercase
      let role = 'student'; // default
      
      if (result.data?.user?.role) {
        role = result.data.user.role.toLowerCase();
      } else if (result.data?.user) {
        // Try to get role from user object directly
        role = (result.data.user.role || 'student').toLowerCase();
      } else {
        // Fallback: check email pattern or use default
        const emailLower = formData.email.toLowerCase();
        if (emailLower.includes('admin')) {
          role = 'admin';
        } else if (emailLower.includes('instructor')) {
          role = 'instructor';
        } else {
          role = 'student';
        }
      }
      
      // Ensure role is stored in localStorage
      localStorage.setItem('role', role);

      // Navigate to role-specific dashboard
      if (role === 'student') {
        navigate('/student/dashboard');
      } else if (role === 'instructor') {
        navigate('/instructor/dashboard');
      } else if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        // Default fallback to student dashboard
        navigate('/student/dashboard');
      }
    } else {
      setError(result.error);
    }
  };

  const isFormValid = formData.email.trim() && formData.password && Object.keys(errors).length === 0;

  return (
    <div className="login">
      <div className="login-container">
        <h2>Login</h2>
        
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email <span className="required">*</span></label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'input-error' : ''}
              placeholder="Enter your email"
              required
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="password">Password <span className="required">*</span></label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'input-error' : ''}
              placeholder="Enter your password"
              required
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>
          <Button type="submit" variant="primary" disabled={loading || !isFormValid}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        <p className="register-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

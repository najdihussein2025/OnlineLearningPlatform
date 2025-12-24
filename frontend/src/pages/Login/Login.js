import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button/Button';
import { seedAccounts, getSeededAccounts } from '../../utils/seedAccounts';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSeedInfo, setShowSeedInfo] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    // Seed accounts on component mount (only once)
    if (!getSeededAccounts()) {
      seedAccounts();
    }
    setShowSeedInfo(true);
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    // For demo: Set role based on email or default to student
    const role = formData.email.includes('admin') ? 'admin' : 
                 formData.email.includes('instructor') ? 'instructor' : 'student';
    localStorage.setItem('role', role);

    const result = await login(formData.email, formData.password);
    setLoading(false);

    if (result.success) {
      // Navigate to role-specific dashboard
      if (role === 'student') {
        navigate('/student/dashboard');
      } else if (role === 'instructor') {
        navigate('/instructor/dashboard');
      } else if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error);
    }
  };

  const handleQuickLogin = (email, password, role) => {
    setFormData({ email, password });
    localStorage.setItem('role', role);
    // Auto-submit after a brief delay
    setTimeout(() => {
      login(email, password).then((result) => {
        if (result.success) {
          if (role === 'student') {
            navigate('/student/dashboard');
          } else if (role === 'instructor') {
            navigate('/instructor/dashboard');
          } else if (role === 'admin') {
            navigate('/admin/dashboard');
          }
        }
      });
    }, 100);
  };

  const isFormValid = formData.email.trim() && formData.password && Object.keys(errors).length === 0;

  const seededAccounts = getSeededAccounts();

  return (
    <div className="login">
      <div className="login-container">
        <h2>Login</h2>
        
        {/* Seed Accounts Info */}
        {showSeedInfo && seededAccounts && (
          <div className="seed-accounts-info">
            <h3>Test Accounts (Click to login):</h3>
            <div className="seed-accounts-list">
              {seededAccounts.map((account, index) => (
                <button
                  key={index}
                  type="button"
                  className="seed-account-btn"
                  onClick={() => handleQuickLogin(account.email, account.password, account.role)}
                >
                  <div className="seed-account-info">
                    <strong>{account.role.toUpperCase()}</strong>
                    <span>{account.email}</span>
                    <small>Password: {account.password}</small>
                  </div>
                </button>
              ))}
            </div>
            <button 
              type="button"
              className="hide-seed-info"
              onClick={() => setShowSeedInfo(false)}
            >
              Hide
            </button>
          </div>
        )}

        {!showSeedInfo && (
          <button 
            type="button"
            className="show-seed-info"
            onClick={() => setShowSeedInfo(true)}
          >
            Show Test Accounts
          </button>
        )}

        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email <span className="required">*</span></label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'input-error' : ''}
              placeholder="student@test.com"
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
              placeholder="password123"
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

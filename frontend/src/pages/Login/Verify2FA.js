import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button/Button';
import './Verify2FA.css';

const Verify2FA = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { verify2FA } = useAuth();

  // Check if 2FA is pending, redirect to login if not
  useEffect(() => {
    const is2FAPending = localStorage.getItem('2fa_pending') === 'true';
    if (!is2FAPending) {
      navigate('/login');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6); // Only digits, max 6
    setCode(value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);

    const result = await verify2FA(code);
    setLoading(false);

    if (result.success) {
      // 2fa_pending is already removed in verify2FA function
      // Navigate to admin dashboard
      navigate('/admin/dashboard');
    } else {
      setError(result.error || 'Invalid code. Please try again.');
      // If session expired, clear 2FA pending and redirect to login
      if (result.error?.includes('Session expired') || result.error?.includes('expired')) {
        localStorage.removeItem('2fa_pending');
        setTimeout(() => navigate('/login'), 2000);
      }
    }
  };

  return (
    <div className="verify-2fa">
      <div className="verify-2fa-container">
        <h2>Two-Factor Authentication</h2>
        <p className="verify-2fa-description">
          We've sent a 6-digit verification code to your email. Please enter it below.
        </p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="code">Verification Code <span className="required">*</span></label>
            <input
              type="text"
              id="code"
              name="code"
              value={code}
              onChange={handleChange}
              className={error ? 'input-error' : ''}
              placeholder="000000"
              maxLength="6"
              required
              autoFocus
              style={{
                textAlign: 'center',
                fontSize: '24px',
                letterSpacing: '8px',
                fontFamily: 'monospace'
              }}
            />
            {error && <span className="error-message">{error}</span>}
          </div>
          
          <Button type="submit" variant="primary" disabled={loading || code.length !== 6}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </Button>
        </form>
        
        <p className="verify-2fa-help">
          Didn't receive the code? Check your email spam folder or{' '}
          <button 
            type="button" 
            className="link-button"
            onClick={() => {
              localStorage.removeItem('2fa_pending');
              navigate('/login');
            }}
          >
            try logging in again
          </button>
        </p>
      </div>
    </div>
  );
};

export default Verify2FA;


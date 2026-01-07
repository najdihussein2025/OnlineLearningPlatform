import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { studentService } from '../../../services/studentService';
import { authService } from '../../../services/authService';
import './StudentSettings.css';

const StudentSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Load profile data on component mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const profile = await studentService.getProfile();
        setFormData(prev => ({
          ...prev,
          fullName: profile.fullName || '',
          email: profile.email || '',
        }));
      } catch (error) {
        setErrorMessage(error.response?.data?.message || 'Failed to load profile');
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileSave = async () => {
    try {
      setProfileLoading(true);
      setShowError(false);
      setShowSuccess(false);

      if (!formData.fullName || formData.fullName.trim() === '') {
        setErrorMessage('Full name is required');
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
        return;
      }

      const result = await studentService.updateProfile(formData.fullName.trim());
      
      // Refresh user data from server to update context
      try {
        const updatedUser = await authService.me();
        // Update localStorage which will be picked up by AuthContext
        if (updatedUser) {
          const role = (updatedUser.role || 'student').toLowerCase();
          localStorage.setItem('role', role);
        }
      } catch (refreshError) {
        console.error('Error refreshing user data:', refreshError);
        // Don't fail the whole operation if refresh fails
      }
      
      setSuccessMessage('Profile updated successfully!');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to update profile');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      setPasswordLoading(true);
      setShowError(false);
      setShowSuccess(false);

      // Validation
      if (!formData.currentPassword) {
        setErrorMessage('Current password is required');
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
        return;
      }

      if (!formData.newPassword) {
        setErrorMessage('New password is required');
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
        return;
      }

      if (formData.newPassword.length < 8) {
        setErrorMessage('New password must be at least 8 characters long');
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        setErrorMessage('New password and confirm password do not match');
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
        return;
      }

      await studentService.changePassword(
        formData.currentPassword,
        formData.newPassword,
        formData.confirmPassword
      );

      setSuccessMessage('Password changed successfully!');
      setShowSuccess(true);
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to change password');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="student-settings-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account settings and preferences</p>
        </div>
      </div>

      {showSuccess && (
        <div className="settings-success-message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {successMessage}
        </div>
      )}

      {showError && (
        <div className="settings-error-message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {errorMessage}
        </div>
      )}

      {loading && (
        <div className="settings-loading">
          <p>Loading profile...</p>
        </div>
      )}

      {!loading && (
        <div className="settings-sections">
          {/* Profile Settings */}
          <div className="settings-section">
            <h2 className="settings-section-title">Profile Information</h2>
            <div className="settings-form">
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="form-input"
                  disabled={profileLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  className="form-input"
                  readOnly
                  disabled
                />
                <p className="form-help">Email cannot be changed</p>
              </div>
              <div className="form-actions">
                <button 
                  className="btn-primary" 
                  onClick={handleProfileSave}
                  disabled={profileLoading}
                >
                  {profileLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>

          {/* Password Settings */}
          <div className="settings-section">
            <h2 className="settings-section-title">Change Password</h2>
            <div className="settings-form">
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="form-input"
                  disabled={passwordLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="form-input"
                  disabled={passwordLoading}
                />
                <p className="form-help">Must be at least 8 characters long</p>
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="form-input"
                  disabled={passwordLoading}
                />
              </div>
              <div className="form-actions">
                <button 
                  className="btn-primary" 
                  onClick={handlePasswordChange}
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default StudentSettings;


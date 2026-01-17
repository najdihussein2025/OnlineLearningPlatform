import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import './InstructorSettings.css';

const InstructorSettings = () => {
  const { user } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    emailNotifications: true,
    courseNotifications: true,
    studentNotifications: true,
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.fullName || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (section) => {
    setLoading(true);
    setShowError(false);
    setErrorMessage('');
    try {
      if (section === 'profile') {
        await api.put('/users/me', {
          fullName: formData.fullName,
          email: formData.email,
        });
      } else if (section === 'password') {
        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
          throw new Error('All password fields are required');
        }
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('New passwords do not match');
        }
        await api.post('/users/change-password', {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        });
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
      } else if (section === 'notifications') {
        localStorage.setItem('notificationPrefs', JSON.stringify({
          emailNotifications: formData.emailNotifications,
          courseNotifications: formData.courseNotifications,
          studentNotifications: formData.studentNotifications,
        }));
      }
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error(`Failed to save ${section}`, err);
      setShowError(true);
      setErrorMessage(err.response?.data?.message || err.message || `Failed to save ${section}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="instructor-settings-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your instructor account settings</p>
        </div>
      </div>

      {showSuccess && (
        <div className="settings-success-message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Settings saved successfully!
        </div>
      )}

      <div className="settings-sections">
        {/* Profile Settings */}
        <div className="settings-section">
          <h2 className="settings-section-title">Profile Information</h2>
          <div className="settings-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                disabled
              />
              <p className="form-help">Email cannot be changed</p>
            </div>
            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                className="form-textarea"
                rows="4"
                placeholder="Tell students about your expertise and teaching style..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="expertise">Areas of Expertise</label>
              <input
                type="text"
                id="expertise"
                name="expertise"
                value={formData.expertise}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., Web Development, Data Science, UI/UX Design"
              />
            </div>
            <div className="form-actions">
              <button className="btn-primary" onClick={() => handleSave('profile')}>
                Save Changes
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
              />
            </div>
            <div className="form-actions">
              <button className="btn-primary" onClick={() => handleSave('password')}>
                Update Password
              </button>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="settings-section">
          <h2 className="settings-section-title">Notification Preferences</h2>
          <div className="settings-form">
            <div className="setting-item">
              <div className="setting-info">
                <h3 className="setting-label">Email Notifications</h3>
                <p className="setting-description">Receive email notifications for important updates</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="emailNotifications"
                  checked={formData.emailNotifications}
                  onChange={handleInputChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="setting-item">
              <div className="setting-info">
                <h3 className="setting-label">Course Notifications</h3>
                <p className="setting-description">Get notified when students enroll in your courses</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="courseNotifications"
                  checked={formData.courseNotifications}
                  onChange={handleInputChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="setting-item">
              <div className="setting-info">
                <h3 className="setting-label">Student Activity</h3>
                <p className="setting-description">Receive notifications about student progress and quiz completions</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="studentNotifications"
                  checked={formData.studentNotifications}
                  onChange={handleInputChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="form-actions">
              <button className="btn-primary" onClick={() => handleSave('notifications')}>
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorSettings;


import React, { useState, useEffect } from 'react';
import { useDashboardToast } from '../../../components/DashboardLayout/DashboardLayout';
import api from '../../../services/api';
import './AdminSettings.css';

const AdminSettings = () => {
  const { success, error } = useDashboardToast();

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [savingPassword, setSavingPassword] = useState(false);

  // Chatbot visibility state
  const [chatbotEnabled, setChatbotEnabled] = useState(false);
  const [loadingChatbot, setLoadingChatbot] = useState(true);
  const [savingChatbot, setSavingChatbot] = useState(false);

  // Load chatbot visibility on mount
  useEffect(() => {
    loadChatbotVisibility();
  }, []);

  const loadChatbotVisibility = async () => {
    try {
      setLoadingChatbot(true);
      const response = await api.get('/settings/chatbot-visibility');
      setChatbotEnabled(response.data?.isEnabled || false);
    } catch (err) {
      console.error('Error loading chatbot visibility:', err);
      // Default to false on error
      setChatbotEnabled(false);
    } finally {
      setLoadingChatbot(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      error('All password fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      error('New password and confirm password do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      error('New password must be at least 8 characters long');
      return;
    }

    try {
      setSavingPassword(true);
      await api.put('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      success('Password changed successfully');
    } catch (err) {
      console.error('Error changing password:', err);
      error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleChatbotToggle = async (e) => {
    const newValue = e.target.checked;
    
    try {
      setSavingChatbot(true);
      await api.put('/settings/chatbot-visibility', {
        isEnabled: newValue
      });
      
      setChatbotEnabled(newValue);
      success(`AI Chatbot ${newValue ? 'enabled' : 'disabled'} for students`);
    } catch (err) {
      console.error('Error updating chatbot visibility:', err);
      error(err.response?.data?.message || 'Failed to update chatbot visibility');
      // Revert toggle on error
      setChatbotEnabled(!newValue);
    } finally {
      setSavingChatbot(false);
    }
  };

  return (
    <div className="admin-settings-page">
      <div className="page-header">
        <h1 className="page-title">Admin Settings</h1>
        <p className="page-subtitle">Manage your personal settings</p>
      </div>

      <div className="settings-sections">
        {/* Section 1: Change Password */}
        <div className="settings-section">
          <h2 className="settings-section-title">Change Password</h2>
          <form onSubmit={handleChangePassword} className="password-form">
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="settings-input"
                placeholder="Enter current password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="settings-input"
                placeholder="Enter new password (min 8 characters)"
                required
                minLength={8}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="settings-input"
                placeholder="Confirm new password"
                required
                minLength={8}
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={savingPassword}
              >
                {savingPassword ? 'Saving...' : 'Save Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Chatbot Visibility */}
        <div className="settings-section">
          <h2 className="settings-section-title">AI Chatbot Visibility</h2>
          <div className="chatbot-setting">
            <div className="setting-item">
              <div className="setting-info">
                <h3 className="setting-label">Show AI Chatbot to students</h3>
                <p className="setting-description">
                  Toggle the visibility of the AI chatbot feature for all students on the platform
                </p>
              </div>
              {loadingChatbot ? (
                <div className="loading-spinner">Loading...</div>
              ) : (
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={chatbotEnabled}
                    onChange={handleChatbotToggle}
                    disabled={savingChatbot}
                  />
                  <span className="toggle-slider"></span>
                </label>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;

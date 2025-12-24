import React, { useState } from 'react';
import './AdminSettings.css';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    platformName: 'Online Learning Platform',
    aiQuizGenerator: true,
    aiLessonSummarizer: true,
    smartLearningAssistant: true,
    certificateAutoIssue: true,
    requireInstructorApproval: true,
    emailNotifications: true,
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleInputChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // UI only - would call API in production
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleCancel = () => {
    // Reset to default values
    setSettings({
      platformName: 'Online Learning Platform',
      aiQuizGenerator: true,
      aiLessonSummarizer: true,
      smartLearningAssistant: true,
      certificateAutoIssue: true,
      requireInstructorApproval: true,
      emailNotifications: true,
    });
  };

  return (
    <div className="admin-settings-page">
        <div className="page-header">
          <h1 className="page-title">Platform Settings</h1>
          <p className="page-subtitle">Configure platform-wide settings and features</p>
        </div>

        <div className="settings-sections">
          {/* General Settings */}
          <div className="settings-section">
            <h2 className="settings-section-title">General Settings</h2>
            <div className="settings-group">
              <label htmlFor="platform-name">Platform Name</label>
              <input
                type="text"
                id="platform-name"
                value={settings.platformName}
                onChange={(e) => handleInputChange('platformName', e.target.value)}
                className="settings-input"
              />
            </div>
          </div>

          {/* AI Features */}
          <div className="settings-section">
            <h2 className="settings-section-title">AI Features</h2>
            <div className="settings-group">
              <div className="setting-item">
                <div className="setting-info">
                  <h3 className="setting-label">AI Quiz Generator</h3>
                  <p className="setting-description">Automatically generate quiz questions from course content</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.aiQuizGenerator}
                    onChange={() => handleToggle('aiQuizGenerator')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3 className="setting-label">AI Lesson Summarizer</h3>
                  <p className="setting-description">Generate concise summaries of lessons</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.aiLessonSummarizer}
                    onChange={() => handleToggle('aiLessonSummarizer')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3 className="setting-label">Smart Learning Assistant</h3>
                  <p className="setting-description">AI-powered assistant for personalized learning</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.smartLearningAssistant}
                    onChange={() => handleToggle('smartLearningAssistant')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Certificate Settings */}
          <div className="settings-section">
            <h2 className="settings-section-title">Certificate Settings</h2>
            <div className="settings-group">
              <div className="setting-item">
                <div className="setting-info">
                  <h3 className="setting-label">Auto-Issue Certificates</h3>
                  <p className="setting-description">Automatically issue certificates upon course completion</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.certificateAutoIssue}
                    onChange={() => handleToggle('certificateAutoIssue')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* User Management Settings */}
          <div className="settings-section">
            <h2 className="settings-section-title">User Management</h2>
            <div className="settings-group">
              <div className="setting-item">
                <div className="setting-info">
                  <h3 className="setting-label">Require Instructor Approval</h3>
                  <p className="setting-description">New instructor accounts require admin approval</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.requireInstructorApproval}
                    onChange={() => handleToggle('requireInstructorApproval')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="settings-section">
            <h2 className="settings-section-title">Notifications</h2>
            <div className="settings-group">
              <div className="setting-item">
                <div className="setting-info">
                  <h3 className="setting-label">Email Notifications</h3>
                  <p className="setting-description">Send email notifications for platform events</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={() => handleToggle('emailNotifications')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
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

        <div className="settings-actions">
          <button className="btn-secondary" onClick={handleCancel}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
  );
};

export default AdminSettings;


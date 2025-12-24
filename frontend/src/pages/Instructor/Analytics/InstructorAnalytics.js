import React from 'react';
import StatCard from '../../../components/admin/StatCard/StatCard';
import './InstructorAnalytics.css';

const InstructorAnalytics = () => {
  // Mock data - would come from API
  const stats = [
    {
      title: 'Total Enrollments',
      value: '1,245',
      change: '+12%',
      changeType: 'positive',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'primary',
    },
    {
      title: 'Course Completion Rate',
      value: '78%',
      change: '+5%',
      changeType: 'positive',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'secondary',
    },
    {
      title: 'Average Quiz Score',
      value: '87%',
      change: '+3%',
      changeType: 'positive',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'accent',
    },
    {
      title: 'Active Students',
      value: '892',
      change: '+8%',
      changeType: 'positive',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3V21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'success',
    },
  ];

  const courseEnrollments = [
    { course: 'Complete Web Development Bootcamp', enrollments: 120 },
    { course: 'Advanced Data Science with Python', enrollments: 85 },
    { course: 'UI/UX Design Fundamentals', enrollments: 40 },
    { course: 'React Advanced Patterns', enrollments: 25 },
  ];

  const maxEnrollments = Math.max(...courseEnrollments.map(c => c.enrollments));

  return (
    <div className="instructor-analytics-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Track student performance and course metrics</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Course Enrollments */}
      <div className="analytics-section">
        <h2 className="section-title">Course Enrollments</h2>
        <div className="enrollments-chart">
          <div className="chart-placeholder">
            <svg width="100%" height="300" viewBox="0 0 800 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="50" y="50" width="120" height="250" fill="#3b82f6" opacity="0.7" rx="4"/>
              <rect x="200" y="100" width="120" height="200" fill="#0d9488" opacity="0.7" rx="4"/>
              <rect x="350" y="200" width="120" height="100" fill="#f97316" opacity="0.7" rx="4"/>
              <rect x="500" y="220" width="120" height="80" fill="#64748b" opacity="0.7" rx="4"/>
              <text x="400" y="290" textAnchor="middle" fill="#64748b" fontSize="14">Course Enrollments</text>
            </svg>
          </div>
        </div>
        <div className="enrollments-list">
          {courseEnrollments.map((item, index) => (
            <div key={index} className="enrollment-item">
              <div className="enrollment-info">
                <h4 className="enrollment-course">{item.course}</h4>
                <span className="enrollment-count">{item.enrollments} students</span>
              </div>
              <div className="enrollment-bar">
                <div 
                  className="enrollment-fill" 
                  style={{ width: `${(item.enrollments / maxEnrollments) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student Progress Trends */}
      <div className="analytics-section">
        <h2 className="section-title">Student Progress Trends</h2>
        <div className="progress-chart">
          <div className="chart-placeholder">
            <svg width="100%" height="300" viewBox="0 0 800 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="300" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d="M50 250 L150 200 L250 180 L350 150 L450 120 L550 100 L650 90 L750 80" stroke="#3b82f6" strokeWidth="3" fill="none"/>
              <path d="M50 250 L150 200 L250 180 L350 150 L450 120 L550 100 L650 90 L750 80 L750 300 L50 300 Z" fill="url(#progressGradient)"/>
              <text x="400" y="290" textAnchor="middle" fill="#64748b" fontSize="14">Average Progress Over Time</text>
            </svg>
          </div>
        </div>
      </div>

      {/* Quiz Score Trends */}
      <div className="analytics-section">
        <h2 className="section-title">Quiz Score Trends</h2>
        <div className="quiz-score-chart">
          <div className="chart-placeholder">
            <svg width="100%" height="300" viewBox="0 0 800 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="quizGradient" x1="0" y1="0" x2="0" y2="300" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d="M50 200 L150 180 L250 160 L350 140 L450 120 L550 100 L650 90 L750 85" stroke="#10b981" strokeWidth="3" fill="none"/>
              <path d="M50 200 L150 180 L250 160 L350 140 L450 120 L550 100 L650 90 L750 85 L750 300 L50 300 Z" fill="url(#quizGradient)"/>
              <text x="400" y="290" textAnchor="middle" fill="#64748b" fontSize="14">Average Quiz Scores Over Time</text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorAnalytics;


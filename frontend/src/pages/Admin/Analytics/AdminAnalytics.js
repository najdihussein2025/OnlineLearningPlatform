import React from 'react';
import StatCard from '../../../components/admin/StatCard/StatCard';
import './AdminAnalytics.css';

const AdminAnalytics = () => {
  const stats = [
    {
      title: 'Total Enrollments',
      value: '2,450',
      change: '+15%',
      changeType: 'positive',
      color: 'primary',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      title: 'Average Quiz Score',
      value: '78%',
      change: '+3%',
      changeType: 'positive',
      color: 'success',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      title: 'Completion Rate',
      value: '65%',
      change: '+5%',
      changeType: 'positive',
      color: 'secondary',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3V21L12 18L21 21V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      title: 'Active Users',
      value: '1,120',
      change: '+8%',
      changeType: 'positive',
      color: 'accent',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ];

  const topCourses = [
    { id: 1, title: 'Web Development Bootcamp', enrollments: 450, completion: 72 },
    { id: 2, title: 'Data Science with Python', enrollments: 320, completion: 68 },
    { id: 3, title: 'UI/UX Design Fundamentals', enrollments: 280, completion: 75 },
  ];

  return (
    <div className="admin-analytics-page">
        <div className="page-header">
          <h1 className="page-title">Analytics & Reports</h1>
          <p className="page-subtitle">Platform performance and insights</p>
        </div>

        <div className="stats-grid">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        <div className="analytics-charts">
          <div className="chart-card">
            <h2 className="section-title">Course Enrollments</h2>
            <div className="chart-placeholder">
              <svg width="100%" height="300" viewBox="0 0 800 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="enrollGradient" x1="0" y1="0" x2="0" y2="300" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <rect x="50" y="50" width="100" height="200" fill="#3b82f6" opacity="0.7" rx="4"/>
                <rect x="180" y="80" width="100" height="170" fill="#0d9488" opacity="0.7" rx="4"/>
                <rect x="310" y="60" width="100" height="190" fill="#3b82f6" opacity="0.7" rx="4"/>
                <rect x="440" y="100" width="100" height="150" fill="#f97316" opacity="0.7" rx="4"/>
                <rect x="570" y="70" width="100" height="180" fill="#0d9488" opacity="0.7" rx="4"/>
                <rect x="700" y="90" width="100" height="160" fill="#3b82f6" opacity="0.7" rx="4"/>
                <text x="400" y="280" textAnchor="middle" fill="#64748b" fontSize="14">Last 7 Days</text>
              </svg>
            </div>
          </div>

          <div className="chart-card">
            <h2 className="section-title">Quiz Average Scores</h2>
            <div className="chart-placeholder">
              <svg width="100%" height="300" viewBox="0 0 800 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 200 L150 150 L250 120 L350 100 L450 90 L550 85 L650 80 L750 75" stroke="#3b82f6" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="50" cy="200" r="6" fill="#3b82f6"/>
                <circle cx="150" cy="150" r="6" fill="#3b82f6"/>
                <circle cx="250" cy="120" r="6" fill="#3b82f6"/>
                <circle cx="350" cy="100" r="6" fill="#3b82f6"/>
                <circle cx="450" cy="90" r="6" fill="#3b82f6"/>
                <circle cx="550" cy="85" r="6" fill="#3b82f6"/>
                <circle cx="650" cy="80" r="6" fill="#3b82f6"/>
                <circle cx="750" cy="75" r="6" fill="#3b82f6"/>
                <text x="400" y="280" textAnchor="middle" fill="#64748b" fontSize="14">Average Score Trend</text>
              </svg>
            </div>
          </div>
        </div>

        <div className="top-courses-section">
          <h2 className="section-title">Top Courses</h2>
          <div className="top-courses-list">
            {topCourses.map((course) => (
              <div key={course.id} className="top-course-card">
                <div className="course-rank">#{course.id}</div>
                <div className="course-details">
                  <h3 className="course-title">{course.title}</h3>
                  <div className="course-stats">
                    <span className="stat-item">📚 {course.enrollments} enrollments</span>
                    <span className="stat-item">✓ {course.completion}% completion</span>
                  </div>
                </div>
                <div className="course-progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${course.completion}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
  );
};

export default AdminAnalytics;


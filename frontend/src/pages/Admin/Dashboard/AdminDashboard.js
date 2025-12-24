import React, { useState } from 'react';
import StatCard from '../../../components/admin/StatCard/StatCard';
import DataTable from '../../../components/admin/DataTable/DataTable';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const stats = [
    {
      title: 'Total Users',
      value: '1,245',
      change: '+12%',
      changeType: 'positive',
      color: 'primary',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      title: 'Total Courses',
      value: '89',
      change: '+5',
      changeType: 'positive',
      color: 'secondary',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      title: 'Total Lessons',
      value: '342',
      change: '+18',
      changeType: 'positive',
      color: 'accent',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 19.5C4 18.6716 4.67157 18 5.5 18H18.5C19.3284 18 20 18.6716 20 19.5V20.5C20 21.3284 19.3284 22 18.5 22H5.5C4.67157 22 4 21.3284 4 20.5V19.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 2H20V14H4V2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      title: 'Total Quizzes',
      value: '156',
      change: '+8',
      changeType: 'positive',
      color: 'success',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ];

  const recentActivity = [
    { id: 1, type: 'user', action: 'New user registered: john@example.com', time: '5 minutes ago', user: 'John Doe' },
    { id: 2, type: 'course', action: 'Course published: Web Development Bootcamp', time: '1 hour ago', user: 'Jane Instructor' },
    { id: 3, type: 'quiz', action: 'Quiz completed: JavaScript Basics', time: '2 hours ago', user: 'Mike Student' },
    { id: 4, type: 'instructor', action: 'Instructor approved: Sarah Johnson', time: '3 hours ago', user: 'Admin' },
    { id: 5, type: 'certificate', action: 'Certificate issued: Data Science Course', time: '4 hours ago', user: 'Alex Student' },
  ];

  const activityColumns = [
    { key: 'action', header: 'Activity' },
    { key: 'user', header: 'User' },
    { key: 'time', header: 'Time', align: 'right' },
  ];

  const filteredActivity = searchQuery
    ? recentActivity.filter(item => 
        item.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.user.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : recentActivity;

  return (
    <div className="admin-dashboard-page">
        <div className="dashboard-header-section">
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Monitor platform activity and statistics</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Analytics Section */}
        <div className="analytics-section">
          <div className="analytics-card">
            <h2 className="section-title">Enrollment Growth</h2>
            <div className="chart-placeholder">
              <svg width="100%" height="200" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="enrollmentGradient" x1="0" y1="0" x2="0" y2="200" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <path d="M50 150 L150 120 L250 100 L350 80 L450 70 L550 60 L650 55 L750 50" stroke="#3b82f6" strokeWidth="3" fill="none"/>
                <path d="M50 150 L150 120 L250 100 L350 80 L450 70 L550 60 L650 55 L750 50 L750 200 L50 200 Z" fill="url(#enrollmentGradient)"/>
                <text x="400" y="180" textAnchor="middle" fill="#64748b" fontSize="14">Last 7 days</text>
              </svg>
            </div>
          </div>
          <div className="analytics-card">
            <h2 className="section-title">Quiz Performance</h2>
            <div className="chart-placeholder">
              <svg width="100%" height="200" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="100" y="80" width="80" height="120" fill="#3b82f6" opacity="0.7" rx="4"/>
                <rect x="220" y="60" width="80" height="140" fill="#0d9488" opacity="0.7" rx="4"/>
                <rect x="340" y="100" width="80" height="100" fill="#f97316" opacity="0.7" rx="4"/>
                <rect x="460" y="70" width="80" height="130" fill="#3b82f6" opacity="0.7" rx="4"/>
                <rect x="580" y="90" width="80" height="110" fill="#0d9488" opacity="0.7" rx="4"/>
                <text x="400" y="190" textAnchor="middle" fill="#64748b" fontSize="14">Average Score by Course</text>
              </svg>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity-section">
          <div className="section-header-row">
            <h2 className="section-title">Recent Activity</h2>
            <button className="btn-view-all">View All</button>
          </div>
          <DataTable
            columns={activityColumns}
            data={filteredActivity}
            emptyMessage="No recent activity"
          />
        </div>
      </div>
  );
};

export default AdminDashboard;


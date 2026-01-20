import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../../components/admin/StatCard/StatCard';
import DataTable from '../../../components/admin/DataTable/DataTable';
import api from '../../../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalLessons: 0,
    totalQuizzes: 0,
  });
  const [enrollmentData, setEnrollmentData] = useState([]);
  const [quizPerformance, setQuizPerformance] = useState([]);
  const [recentActivityData, setRecentActivityData] = useState([]);
  const [loading, setLoading] = useState(true);

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };
    
    for (const [name, secondsInInterval] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInInterval);
      if (interval >= 1) {
        return interval === 1 ? `1 ${name} ago` : `${interval} ${name}s ago`;
      }
    }
    return 'just now';
  };

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        
        // Fetch all required data in parallel
        const [
          usersRes,
          coursesRes,
          lessonsRes,
          quizzesRes,
          enrollmentsRes,
          attemptsRes
        ] = await Promise.all([
          api.get('/users').catch(() => ({ data: [] })),
          api.get('/courses').catch(() => ({ data: [] })),
          api.get('/lessons').catch(() => ({ data: [] })),
          api.get('/quizzes').catch(() => ({ data: [] })),
          api.get('/enrollments').catch(() => ({ data: [] })),
          api.get('/quizattempts').catch(() => ({ data: [] }))
        ]);

        const users = usersRes.data || [];
        const courses = coursesRes.data || [];
        const lessons = lessonsRes.data || [];
        const quizzes = quizzesRes.data || [];
        const enrollments = enrollmentsRes.data || [];
        const attempts = attemptsRes.data || [];

        // Update stats
        setStats({
          totalUsers: users.length,
          totalCourses: courses.length,
          totalLessons: lessons.length,
          totalQuizzes: quizzes.length,
        });

        // Calculate enrollment growth for last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return date.toISOString().split('T')[0];
        });

        const enrollmentByDay = last7Days.map(date => {
          const count = enrollments.filter(e => {
            const enrollDate = new Date(e.enrolledAt).toISOString().split('T')[0];
            return enrollDate === date;
          }).length;
          return {
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            enrollments: count,
            fullDate: date
          };
        });

        setEnrollmentData(enrollmentByDay);

        // Calculate quiz performance by course
        const coursePerformance = courses.map(course => {
          const courseQuizzes = quizzes.filter(q => q.courseId === course.id);
          const courseAttempts = attempts.filter(a => 
            courseQuizzes.some(q => q.id === a.quizId)
          );
          
          const avgScore = courseAttempts.length > 0
            ? courseAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / courseAttempts.length
            : 0;

          return {
            courseId: course.id,
            course: course.title,
            avgScore: Math.round(avgScore),
            attempts: courseAttempts.length
          };
        }).sort((a, b) => b.avgScore - a.avgScore).slice(0, 5);

        setQuizPerformance(coursePerformance);

        // Fetch audit logs for recent activities
        try {
          const auditLogsRes = await api.get('/auditlogs?limit=10');
          const auditLogs = auditLogsRes.data || [];
          
          const activities = auditLogs.map(log => ({
            id: `audit-${log.id}`,
            type: log.entityType.toLowerCase(),
            action: `[${log.action}] ${log.entityType}: ${log.description}`,
            time: getTimeAgo(new Date(log.createdAt)),
            user: log.userName || 'System',
            entityName: log.entityName
          }));

          setRecentActivityData(activities);
        } catch (error) {
          console.error('Error fetching audit logs:', error);
          setRecentActivityData([]);
        }

      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
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
      value: stats.totalCourses.toLocaleString(),
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
      value: stats.totalLessons.toLocaleString(),
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
      value: stats.totalQuizzes.toLocaleString(),
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

  const activityColumns = [
    { key: 'action', header: 'Activity' },
    { key: 'user', header: 'User' },
    { key: 'time', header: 'Time', align: 'right' },
  ];

  const recentActivity = searchQuery
    ? recentActivityData.filter(item => 
        item.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.user.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : recentActivityData;

  return (
    <div className="admin-dashboard-page">
        <div className="dashboard-header-section">
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Monitor platform activity and statistics</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          {statCards.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Analytics Section */}
        <div className="analytics-section">
          <div className="analytics-card">
            <h2 className="section-title">Enrollment Growth (Last 7 Days)</h2>
            <div className="chart-placeholder">
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
                  <p>Loading chart...</p>
                </div>
              ) : (
                <svg width="100%" height="200" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="enrollmentGradient" x1="0" y1="0" x2="0" y2="200" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  {/* Y-axis labels */}
                  {[0, 25, 50, 75, 100].map((value, idx) => (
                    <text key={`y-${idx}`} x="40" y={150 - value} fontSize="12" fill="#94a3b8" textAnchor="end">
                      {value}
                    </text>
                  ))}
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((value, idx) => (
                    <line 
                      key={`grid-${idx}`}
                      x1="50" 
                      y1={150 - value} 
                      x2="750" 
                      y2={150 - value} 
                      stroke="#e2e8f0" 
                      strokeDasharray="4"
                    />
                  ))}
                  {/* Data bars */}
                  {enrollmentData.map((data, idx) => {
                    const maxEnrollments = Math.max(...enrollmentData.map(d => d.enrollments), 1);
                    const barHeight = (data.enrollments / maxEnrollments) * 120;
                    const xPos = 100 + idx * 95;
                    return (
                      <g key={`bar-${idx}`}>
                        <rect
                          x={xPos}
                          y={150 - barHeight}
                          width="60"
                          height={barHeight}
                          fill="#3b82f6"
                          rx="4"
                        />
                        <text
                          x={xPos + 30}
                          y={170}
                          textAnchor="middle"
                          fontSize="12"
                          fill="#64748b"
                        >
                          {data.date}
                        </text>
                        <text
                          x={xPos + 30}
                          y={150 - barHeight - 5}
                          textAnchor="middle"
                          fontSize="11"
                          fill="#1e293b"
                          fontWeight="600"
                        >
                          {data.enrollments}
                        </text>
                      </g>
                    );
                  })}
                  <line x1="50" y1="150" x2="750" y2="150" stroke="#cbd5e1" strokeWidth="2"/>
                </svg>
              )}
            </div>
            <div style={{ marginTop: '12px', fontSize: '13px', color: '#64748b' }}>
              <strong>{enrollmentData.reduce((sum, d) => sum + d.enrollments, 0)}</strong> total enrollments in the last 7 days
            </div>
          </div>
          
          <div className="analytics-card">
            <h2 className="section-title">Quiz Performance (Top 5 Courses)</h2>
            <div className="chart-placeholder">
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
                  <p>Loading chart...</p>
                </div>
              ) : quizPerformance.length > 0 ? (
                <svg width="100%" height="200" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Y-axis labels */}
                  {[0, 25, 50, 75, 100].map((value, idx) => (
                    <text key={`y-${idx}`} x="40" y={150 - (value * 1.2)} fontSize="12" fill="#94a3b8" textAnchor="end">
                      {value}%
                    </text>
                  ))}
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((value, idx) => (
                    <line 
                      key={`grid-${idx}`}
                      x1="50" 
                      y1={150 - (value * 1.2)} 
                      x2="750" 
                      y2={150 - (value * 1.2)} 
                      stroke="#e2e8f0" 
                      strokeDasharray="4"
                    />
                  ))}
                  {/* Data bars */}
                  {quizPerformance.map((data, idx) => {
                    const barHeight = (data.avgScore / 100) * 120;
                    const xPos = 100 + idx * 130;
                    const colors = ['#3b82f6', '#0d9488', '#f97316', '#8b5cf6', '#ec4899'];
                    return (
                      <g key={`bar-${idx}`}>
                        <rect
                          x={xPos}
                          y={150 - barHeight}
                          width="80"
                          height={barHeight}
                          fill={colors[idx]}
                          opacity="0.8"
                          rx="4"
                        />
                        <text
                          x={xPos + 40}
                          y={170}
                          textAnchor="middle"
                          fontSize="11"
                          fill="#64748b"
                        >
                          {data.course.substring(0, 12)}
                        </text>
                        <text
                          x={xPos + 40}
                          y={150 - barHeight - 5}
                          textAnchor="middle"
                          fontSize="12"
                          fill="#1e293b"
                          fontWeight="600"
                        >
                          {data.avgScore}%
                        </text>
                      </g>
                    );
                  })}
                  <line x1="50" y1="150" x2="750" y2="150" stroke="#cbd5e1" strokeWidth="2"/>
                </svg>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#94a3b8' }}>
                  No quiz data available
                </div>
              )}
            </div>
            <div style={{ marginTop: '12px', fontSize: '13px', color: '#64748b' }}>
              <strong>{quizPerformance.length}</strong> courses with quiz attempts • <strong>{quizPerformance[0]?.avgScore || 0}%</strong> highest average
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity-section">
          <div className="section-header-row">
            <h2 className="section-title">Recent Activity</h2>
            <button 
              className="btn-view-all"
              onClick={() => navigate('/admin/activity-log')}
            >
              View All
            </button>
          </div>
          <DataTable
            columns={activityColumns}
            data={recentActivity}
            emptyMessage="No recent activity"
          />
        </div>
      </div>
  );
};

export default AdminDashboard;


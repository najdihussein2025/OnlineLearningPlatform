import React, { useEffect, useState } from 'react';
import StatCard from '../../../components/admin/StatCard/StatCard';
import api from '../../../services/api';
import './InstructorAnalytics.css';

const InstructorAnalytics = () => {
  const [stats, setStats] = useState([]);
  const [courseEnrollments, setCourseEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch stats
        const statsRes = await api.get('/analytics/stats');
        const enrollmentsRes = await api.get('/analytics/course-enrollments');

        // If backend returns an object of metrics, map it into StatCard-friendly array
        const rawStats = statsRes.data;
        let mappedStats = [];
        if (Array.isArray(rawStats)) {
          mappedStats = rawStats;
        } else if (rawStats && typeof rawStats === 'object') {
          mappedStats = [
            {
              title: 'Total Enrollments',
              value: rawStats.totalEnrollments?.toString() ?? '0',
              change: null,
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
              value: `${rawStats.courseCompletionRate ?? 0}%`,
              change: null,
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
              value: `${rawStats.averageQuizScore ?? 0}%`,
              change: null,
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
              value: (rawStats.activeStudents ?? 0).toString(),
              change: null,
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
        }

        setStats(mappedStats);
        setCourseEnrollments(enrollmentsRes.data || []);
      } catch (err) {
        console.error('Failed to fetch analytics data:', err);
        setError(`Failed to load analytics. Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) return <div>Loading analytics...</div>;
  if (error) return <div>{error}</div>;

  const maxEnrollments = Math.max(...courseEnrollments.map((c) => c.enrollments), 0);

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
    </div>
  );
};

export default InstructorAnalytics;


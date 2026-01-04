import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import StatCard from '../../../components/admin/StatCard/StatCard';
import api from '../../../services/api';
import './InstructorDashboard.css';

const InstructorDashboard = () => {
  const { user } = useAuth();

  const [coursesData, setCoursesData] = React.useState([]);
  const [stats, setStats] = React.useState({ coursesCreated: 0, totalEnrollments: 0, avgQuizScore: 0, activeStudents: 0 });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const coursesRes = await api.get('/courses/mine');
        const myCourses = coursesRes.data || [];
        if (!mounted) return;
        setCoursesData(myCourses);

        // aggregate enrollments and active students
        let totalEnrollments = 0;
        const studentsSet = new Set();
        for (const c of myCourses) {
          try {
            const eRes = await api.get(`/enrollments/byCourse/${c.id}`);
            const enrolls = eRes.data || [];
            totalEnrollments += enrolls.length;
            enrolls.forEach(en => studentsSet.add(en.userId));
          } catch (err) {
            // ignore per-course enrollment failures
          }
        }

        // average quiz score across instructor's quizzes
        let totalScore = 0;
        let scoreCount = 0;
        try {
          const attemptsRes = await api.get('/quizattempts');
          const allAttempts = attemptsRes.data || [];
          // we will filter by quizzes that belong to these courses
          const courseIds = myCourses.map(c => c.id);
          const relevantAttempts = allAttempts.filter(a => courseIds.includes(a.courseId || a.courseId));
          relevantAttempts.forEach(a => { totalScore += (a.score || 0); scoreCount++; });
        } catch (err) {
          // ignore
        }

        const avgQuizScore = scoreCount ? Math.round(totalScore / scoreCount) : 0;

        if (mounted) setStats({ coursesCreated: myCourses.length, totalEnrollments, avgQuizScore, activeStudents: studentsSet.size });
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <span className="status-badge status-published">Published</span>;
      case 'draft':
        return <span className="status-badge status-draft">Draft</span>;
      case 'pending':
        return <span className="status-badge status-pending">Pending Approval</span>;
      default:
        return null;
    }
  };

  return (
    <div className="instructor-dashboard-page">
      {/* Welcome Header */}
      <div className="dashboard-welcome">
        <h1 className="dashboard-title">
          Welcome back, {user?.firstName || 'Instructor'}!
        </h1>
        <p className="dashboard-subtitle">Manage your courses and track student progress</p>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        {[
          {
            title: 'Courses Created',
            value: stats.coursesCreated?.toString() || '0',
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ),
            color: 'primary',
          },
          {
            title: 'Total Enrollments',
            value: (stats.totalEnrollments || 0).toString(),
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ),
            color: 'secondary',
          },
          {
            title: 'Average Quiz Score',
            value: `${stats.avgQuizScore || 0}%`,
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ),
            color: 'accent',
          },
          {
            title: 'Active Students',
            value: (stats.activeStudents || 0).toString(),
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3V21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ),
            color: 'success',
          },
        ].map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Analytics Preview */}
      <div className="analytics-preview-section">
        <div className="section-header">
          <h2 className="section-title">Analytics Overview</h2>
          <Link to="/instructor/analytics" className="view-all-link">
            View Full Analytics
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        <div className="analytics-grid">
          <div className="analytics-card">
            <h3 className="analytics-card-title">Enrollment per Course</h3>
            <div className="chart-placeholder">
              <svg width="100%" height="200" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="50" y="80" width="120" height="120" fill="#3b82f6" opacity="0.7" rx="4"/>
                <rect x="200" y="100" width="120" height="100" fill="#0d9488" opacity="0.7" rx="4"/>
                <rect x="350" y="140" width="120" height="60" fill="#f97316" opacity="0.7" rx="4"/>
                <rect x="500" y="180" width="120" height="20" fill="#64748b" opacity="0.7" rx="4"/>
                <text x="400" y="195" textAnchor="middle" fill="#64748b" fontSize="12">Course Enrollments</text>
              </svg>
            </div>
          </div>

          <div className="analytics-card">
            <h3 className="analytics-card-title">Quiz Performance</h3>
            <div className="chart-placeholder">
              <svg width="100%" height="200" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="quizGradient" x1="0" y1="0" x2="0" y2="200" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <path d="M50 150 L150 120 L250 100 L350 80 L450 70 L550 60 L650 55 L750 50" stroke="#3b82f6" strokeWidth="3" fill="none"/>
                <path d="M50 150 L150 120 L250 100 L350 80 L450 70 L550 60 L650 55 L750 50 L750 200 L50 200 Z" fill="url(#quizGradient)"/>
                <text x="400" y="190" textAnchor="middle" fill="#64748b" fontSize="12">Average Quiz Scores Over Time</text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* My Courses Section */}
      <div className="courses-section">
        <div className="section-header">
          <h2 className="section-title">My Courses</h2>
          <div className="section-actions">
            <Link to="/instructor/courses" className="view-all-link">
              View All
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link to="/instructor/courses/new" className="btn-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Create New Course
            </Link>
          </div>
        </div>

        <div className="courses-table">
          <table>
            <thead>
              <tr>
                <th>Course Title</th>
                <th>Status</th>
                <th>Enrollments</th>
                <th>Rating</th>
                <th>Revenue</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coursesData.map((course) => (
                <tr key={course.id}>
                  <td>
                    <div className="course-title-cell">
                      <h4 className="course-title">{course.title}</h4>
                    </div>
                  </td>
                  <td>{getStatusBadge(course)}</td>
                  <td>{/* enrollment count not available on course DTO by default */}</td>
                  <td>
                    {course.rating ? (
                      <span className="rating">
                        ⭐ {course.rating}
                      </span>
                    ) : (
                      <span className="no-rating">-</span>
                    )}
                  </td>
                  <td>{course.revenue || '-'}</td>
                  <td>
                    <div className="table-actions">
                      <Link to={`/instructor/courses/${course.id}`} className="btn-icon" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
                      <Link to={`/instructor/students?course=${course.id}`} className="btn-icon" title="View Students">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;


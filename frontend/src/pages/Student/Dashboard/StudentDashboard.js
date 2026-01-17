import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { studentService } from '../../../services/studentService';
import api from '../../../services/api';
import StatCard from '../../../components/admin/StatCard/StatCard';
import ProgressBar from '../../../components/student/ProgressBar/ProgressBar';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load dashboard data on mount
  useEffect(() => {
    let mounted = true;
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await studentService.getDashboard();
        if (!mounted) return;
        
        // Ensure data structure is valid, even if backend returns unexpected format
        if (data && typeof data === 'object') {
          // Normalize the data structure with defaults
          const normalizedData = {
            totalCourses: data.totalCourses ?? 0,
            completedCourses: data.completedCourses ?? 0,
            inProgressCourses: data.inProgressCourses ?? 0,
            totalLessons: data.totalLessons ?? 0,
            completedLessons: data.completedLessons ?? 0,
            overallProgress: data.overallProgress ?? 0,
            lastAccessedLessonDate: data.lastAccessedLessonDate ?? null,
            courses: Array.isArray(data.courses) ? data.courses : []
          };
          setDashboardData(normalizedData);
        } else {
          // If data is invalid, set empty dashboard
          setDashboardData({
            totalCourses: 0,
            completedCourses: 0,
            inProgressCourses: 0,
            totalLessons: 0,
            completedLessons: 0,
            overallProgress: 0,
            lastAccessedLessonDate: null,
            courses: []
          });
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
        if (!mounted) return;
        
        // Instead of showing error, set empty dashboard data
        // This prevents the "Retry" screen from showing
        setDashboardData({
          totalCourses: 0,
          completedCourses: 0,
          inProgressCourses: 0,
          totalLessons: 0,
          completedLessons: 0,
          overallProgress: 0,
          lastAccessedLessonDate: null,
          courses: []
        });
        setError(null); // Clear error to prevent retry screen
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboard();
    return () => { mounted = false; };
  }, []);

  // Refresh dashboard data (called after lesson completion, quiz pass, etc.)
  const refreshDashboard = async () => {
    try {
      const data = await studentService.getDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error('Error refreshing dashboard:', err);
    }
  };

  // Format last accessed date
  const formatLastAccessed = (dateString) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Never';
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return 'Never';
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'completed') {
      return <span className="status-badge status-completed">Completed</span>;
    } else if (statusLower === 'inprogress') {
      return <span className="status-badge status-in-progress">In Progress</span>;
    }
    return <span className="status-badge status-not-started">Not Started</span>;
  };

  // Handle Continue Learning
  const handleContinueLearning = async (courseId) => {
    try {
      const response = await api.get(`/student/courses/${courseId}/continue`);
      const data = response.data;

      // Handle both camelCase and PascalCase (backend returns PascalCase)
      const courseCompleted = data.courseCompleted || data.CourseCompleted || false;
      const lessonId = data.lessonId || data.LessonId || null;

      if (courseCompleted) {
        // Course is completed - navigate to lessons page (readonly/completed state)
        // Do NOT show alert - completion is state-driven and reflected in UI
        navigate(`/student/lessons?course=${courseId}`);
        refreshDashboard();
      } else if (lessonId) {
        // Navigate to the next incomplete lesson
        navigate(`/student/lessons?course=${courseId}&lesson=${lessonId}`);
      } else {
        // No next lesson found but course not completed - navigate to lessons page
        navigate(`/student/lessons?course=${courseId}`);
      }
    } catch (err) {
      console.error('Error continuing learning:', err);
      const errorMessage = err.response?.data?.message 
        || err.message 
        || 'Failed to continue learning';
      alert(errorMessage);
    }
  };

  // Handle Start Course
  const handleStartCourse = async (courseId) => {
    try {
      await api.post(`/student/courses/${courseId}/start`);
      refreshDashboard();
      // Navigate to course details
      navigate(`/student/courses/${courseId}`);
    } catch (err) {
      console.error('Error starting course:', err);
      const errorMessage = err.response?.data?.message 
        || err.message 
        || 'Failed to start course';
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="student-dashboard-page">
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Loading your progress...</p>
        </div>
      </div>
    );
  }

  // Don't show error screen - always show dashboard with data (even if empty)
  // This prevents the "Retry" button from appearing
  if (!dashboardData) {
    // Initialize with empty data if somehow null
    const emptyData = {
      totalCourses: 0,
      completedCourses: 0,
      inProgressCourses: 0,
      totalLessons: 0,
      completedLessons: 0,
      overallProgress: 0,
      lastAccessedLessonDate: null,
      courses: []
    };
    setDashboardData(emptyData);
    return (
      <div className="student-dashboard-page">
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Loading your progress...</p>
        </div>
      </div>
    );
  }

  // Safely extract data with defaults (new flat structure)
  // Ensure all values are properly typed and have defaults
  const totalCourses = Number(dashboardData.totalCourses) || 0;
  const completedCourses = Number(dashboardData.completedCourses) || 0;
  const inProgressCourses = Number(dashboardData.inProgressCourses) || 0;
  const totalLessons = Number(dashboardData.totalLessons) || 0;
  const completedLessons = Number(dashboardData.completedLessons) || 0;
  const overallProgress = Number(dashboardData.overallProgress) || 0;
  const lastAccessedLessonDate = dashboardData.lastAccessedLessonDate || null;
  const courses = Array.isArray(dashboardData.courses) ? dashboardData.courses : [];

  // Prepare overview stats
  const overviewStats = [
    {
      title: 'Enrolled Courses',
      value: totalCourses.toString(),
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
      title: 'Completed Courses',
      value: completedCourses.toString(),
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'success',
    },
    {
      title: 'In Progress',
      value: inProgressCourses.toString(),
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'accent',
    },
    {
      title: 'Total Lessons',
      value: totalLessons.toString(),
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'info',
    },
    {
      title: 'Completed Lessons',
      value: `${completedLessons}/${totalLessons}`,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'success',
    },
    {
      title: 'Overall Progress',
      value: `${overallProgress.toFixed(0)}%`,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 19.5C4 18.6716 4.67157 18 5.5 18H18.5C19.3284 18 20 18.6716 20 19.5V20.5C20 21.3284 19.3284 22 18.5 22H5.5C4.67157 22 4 21.3284 4 20.5V19.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 2H20V14H4V2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'secondary',
    },
  ];

  return (
    <div className="student-dashboard-page">
      {/* Welcome Header */}
      <div className="dashboard-welcome">
        <h1 className="dashboard-title">
          Welcome back, {user?.firstName || 'Student'}!
        </h1>
        <p className="dashboard-subtitle">Track your learning progress</p>
        {lastAccessedLessonDate && (
          <p className="dashboard-subtitle" style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.8 }}>
            Last accessed lesson: {formatLastAccessed(lastAccessedLessonDate)}
          </p>
        )}
      </div>

      {/* Overview Cards */}
      <div className="stats-grid">
        {overviewStats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Course Progress Section */}
      <div className="course-progress-section">
        <div className="section-header">
          <h2 className="section-title">Your Courses</h2>
          <Link to="/student/courses" className="view-all-link">
            View All Courses
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-state-content">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3>You haven't enrolled in any courses yet</h3>
              <p>Start your learning journey by enrolling in a course</p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  try {
                    navigate('/courses');
                  } catch (err) {
                    console.error('Navigation error:', err);
                    alert('Failed to open courses. Please try again.');
                  }
                }}
              >
                Browse Courses
              </button>
            </div>
          </div>
        ) : (
          <div className="course-progress-grid">
            {courses.map((course, index) => {
              // Safely extract course data with defaults
              // Handle both camelCase from backend DTO and direct field names
              const courseId = course.courseId || course.id || null;
              const title = course.title || 'Untitled Course';
              const status = (course.status || '').toLowerCase();
              // Backend DTO uses completionPercentage, but we want progress
              const progress = Number(course.progress || course.completionPercentage) || 0;
              const completedLessons = Number(course.completedLessons) || 0;
              const totalLessons = Number(course.totalLessons) || 0;
              const completedQuizzes = Number(course.completedQuizzes || course.passedQuizzes) || 0;
              const totalQuizzes = Number(course.totalQuizzes) || 0;
              const lastAccessed = course.lastAccessed || null;
              
              // Skip if courseId is invalid
              if (!courseId) {
                return null;
              }
              
              return (
                <div key={courseId || `course-${index}`} className="course-progress-item">
                  <div className="course-progress-item-header">
                    <h3 className="course-progress-item-title">{title}</h3>
                    {getStatusBadge(status)}
                  </div>

                  <div className="course-progress-item-stats">
                    <div className="course-progress-item-stat">
                      <span className="stat-label">Lessons</span>
                      <span className="stat-value">{completedLessons}/{totalLessons}</span>
                    </div>
                    <div className="course-progress-item-stat">
                      <span className="stat-label">Quizzes</span>
                      <span className="stat-value">{completedQuizzes}/{totalQuizzes}</span>
                    </div>
                    <div className="course-progress-item-stat">
                      <span className="stat-label">Last Accessed</span>
                      <span className="stat-value">{formatLastAccessed(lastAccessed)}</span>
                    </div>
                  </div>

                  <div className="course-progress-item-progress">
                    <ProgressBar progress={Math.max(0, Math.min(100, progress))} size="medium" />
                    <span className="progress-percentage">{Math.max(0, Math.min(100, progress))}%</span>
                  </div>

                  <div className="course-progress-item-actions">
                    {status === 'completed' ? (
                      <button 
                        className="btn-secondary" 
                        disabled
                        style={{ opacity: 0.6, cursor: 'not-allowed' }}
                      >
                        View Certificate
                      </button>
                    ) : status === 'inprogress' ? (
                      <button 
                        className="btn-primary"
                        onClick={() => handleContinueLearning(courseId)}
                      >
                        Continue Learning
                      </button>
                    ) : (
                      <button 
                        className="btn-primary"
                        onClick={() => handleStartCourse(courseId)}
                      >
                        Start Course
                      </button>
                    )}
                    <Link 
                      to={`/student/courses/${courseId}`} 
                      className="btn-secondary"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import ProgressBar from '../../../components/student/ProgressBar/ProgressBar';
import './StudentCourseDetails.css';

const StudentCourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startingCourse, setStartingCourse] = useState(false);
  const [startError, setStartError] = useState(null);
  const [continuing, setContinuing] = useState(false);
  const [continueError, setContinueError] = useState(null);

  // Refetch course details function
  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch course details
      const response = await api.get(`/student/courses/${courseId}`);
      
      const data = response.data;
      
      // Extract course info from nested structure
      if (data.course) {
        setCourse({
          id: data.course.id,
          title: data.course.title,
          shortDescription: data.course.shortDescription,
          longDescription: data.course.longDescription,
          category: data.course.category,
          difficulty: data.course.difficulty,
          thumbnail: data.course.thumbnail
        });
      }
      
      // Extract enrollment info if available
      if (data.enrollment) {
        setEnrollment({
          enrolledAt: data.enrollment.enrolledAt,
          startedAt: data.enrollment.startedAt,
          status: data.enrollment.status,
          lastAccessed: data.enrollment.lastAccessed
        });
      }
      
      // Extract progress info
      if (data.progress) {
        setProgress({
          progress: data.progress.progress || 0,
          completedLessons: data.progress.completedLessons || 0,
          totalLessons: data.progress.totalLessons || 0,
          completedQuizzes: data.progress.completedQuizzes || data.progress.passedQuizzes || 0,
          totalQuizzes: data.progress.totalQuizzes || 0
        });
      }
    } catch (err) {
      console.error('Error loading course details:', err);
      
      const errorMessage = err.response?.data?.message 
        || err.message 
        || 'Failed to load course details';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourseDetails();
  }, [courseId]);

  // Determine course status from backend
  const getCourseStatus = () => {
    if (!enrollment || !enrollment.status) return 'not-started';
    const statusLower = enrollment.status.toLowerCase();
    if (statusLower === 'completed') return 'completed';
    if (statusLower === 'inprogress') return 'in-progress';
    return 'not-started';
  };

  const status = getCourseStatus();

  // Handle Start Course button click
  const handleStartCourse = async () => {
    if (startingCourse || status !== 'not-started') return;

    try {
      setStartingCourse(true);
      setStartError(null);

      await api.post(`/student/courses/${courseId}/start`);
      
      // Re-fetch course details to get updated state from backend
      await loadCourseDetails();
    } catch (err) {
      console.error('Error starting course:', err);
      const errorMessage = err.response?.data?.message 
        || err.message 
        || 'Failed to start course';
      setStartError(errorMessage);
    } finally {
      setStartingCourse(false);
    }
  };

  // Handle Continue Learning button click
  const handleContinueLearning = async () => {
    if (continuing || status === 'not-started') return;

    try {
      setContinuing(true);
      setContinueError(null);

      const response = await api.get(`/student/courses/${courseId}/continue`);
      const data = response.data;

      // Handle both camelCase and PascalCase (backend returns PascalCase)
      const courseCompleted = data.courseCompleted || data.CourseCompleted || false;
      const lessonId = data.lessonId || data.LessonId || null;

      if (courseCompleted) {
        // Course is completed - navigate to lessons page (readonly/completed state)
        // Do NOT show alert - completion is state-driven and reflected in UI
        navigate(`/student/lessons?course=${courseId}`);
        // Refresh course details to show updated status
        await loadCourseDetails();
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
      setContinueError(errorMessage);
    } finally {
      setContinuing(false);
    }
  };

  // Format enrollment date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return 'Never';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="student-course-details-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading course details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="student-course-details-page">
        <div className="error-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h3>Error loading course</h3>
          <p>{error}</p>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/student/courses')}
          >
            Back to My Courses
          </button>
        </div>
      </div>
    );
  }

  // Empty state (course not found)
  if (!course) {
    return (
      <div className="student-course-details-page">
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3>Course not found</h3>
          <p>This course may not exist or you may not have access to it.</p>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/student/courses')}
          >
            Back to My Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-course-details-page">
      {/* Course Header */}
      <div className="course-header">
        <div className="course-header-content">
          {course.thumbnail && (
            <div className="course-thumbnail">
              <img src={course.thumbnail} alt={course.title} />
            </div>
          )}
          <div className="course-header-info">
            <div className="course-meta">
              <span className="course-category">{course.category || 'Uncategorized'}</span>
              <span className="course-difficulty">{course.difficulty || 'Not Specified'}</span>
            </div>
            <h1 className="course-title">{course.title}</h1>
            <p className="course-instructor">by Instructor</p>
          </div>
        </div>
      </div>

      {/* Course Description Section */}
      <div className="course-description-section">
        <h2 className="section-title">About This Course</h2>
        {course.shortDescription && (
          <p className="course-short-description">{course.shortDescription}</p>
        )}
        {course.longDescription && (
          <div className="course-long-description">
            {course.longDescription.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        )}
      </div>

      {/* Course Status Card */}
      <div className="course-status-card">
        <h3 className="status-card-title">Course Status</h3>
        <div className="status-card-content">
          <div className="enrollment-status">
            <span className="status-label">Enrollment Status:</span>
            <span className={`status-badge status-${status}`}>
              {status === 'completed' ? 'Completed' : 
               status === 'in-progress' ? 'In Progress' : 
               'Not Started'}
            </span>
          </div>
          {enrollment && (
            <>
              <div className="enrollment-date">
                <span className="info-label">Enrolled On:</span>
                <span className="info-value">{formatDate(enrollment.enrolledAt)}</span>
              </div>
              <div className="progress-section">
                <div className="progress-header">
                  <span className="progress-label">Progress</span>
                  <span className="progress-percentage">{progress?.progress || 0}%</span>
                </div>
                <ProgressBar progress={progress?.progress || 0} size="large" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="course-actions">
        {status === 'not-started' ? (
          <>
            <button 
              className="btn-primary btn-action" 
              onClick={handleStartCourse}
              disabled={startingCourse}
            >
              {startingCourse ? 'Starting...' : 'Start Course'}
            </button>
            {startError && (
              <div className="error-message" style={{ marginTop: 'var(--spacing-md)', color: 'var(--error-color, #dc3545)', fontSize: 'var(--font-size-sm)' }}>
                {startError}
              </div>
            )}
          </>
        ) : status === 'completed' ? (
          <button 
            className="btn-primary btn-action" 
            disabled
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
          >
            View Certificate
          </button>
        ) : (
          <>
            <button 
              className="btn-primary btn-action" 
              onClick={handleContinueLearning}
              disabled={continuing}
            >
              {continuing ? 'Loading...' : 'Continue Learning'}
            </button>
            {continueError && (
              <div className="error-message" style={{ marginTop: 'var(--spacing-md)', color: 'var(--error-color, #dc3545)', fontSize: 'var(--font-size-sm)' }}>
                {continueError}
              </div>
            )}
          </>
        )}
      </div>

      {/* Info Cards */}
      <div className="info-cards-grid">
        <div className="info-card">
          <div className="info-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="info-card-content">
            <span className="info-card-label">Total Lessons</span>
            <span className="info-card-value">{progress?.totalLessons ?? 0}</span>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="info-card-content">
            <span className="info-card-label">Total Quizzes</span>
            <span className="info-card-value">{progress?.totalQuizzes ?? 0}</span>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="info-card-content">
            <span className="info-card-label">Last Accessed</span>
            <span className="info-card-value">
              {enrollment?.lastAccessed 
                ? formatDate(enrollment.lastAccessed)
                : 'Never'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentCourseDetails;


import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import ProgressBar from '../ProgressBar/ProgressBar';
import './CourseProgressCard.css';

const CourseProgressCard = ({ course, showButton = true }) => {
  const navigate = useNavigate();
  const [continuing, setContinuing] = useState(false);

  // Guard against null/undefined course
  if (!course) {
    return null;
  }

  // Determine course status - STRICTLY use backend status, never calculate from progress
  const getCourseStatus = () => {
    // Backend MUST provide status - use it directly
    if (course.status) {
      const statusLower = String(course.status).toLowerCase().trim();
      // Handle enum string values from backend: "Completed", "InProgress", "NotStarted"
      if (statusLower === 'completed') return 'completed';
      if (statusLower === 'inprogress' || statusLower === 'in-progress') return 'in-progress';
      if (statusLower === 'notstarted' || statusLower === 'not-started') return 'not-started';
    }
    // If backend doesn't provide status, default to not-started (shouldn't happen)
    // DO NOT calculate from progress - backend is source of truth
    console.warn(`Course ${course?.id} missing status from backend`);
    return 'not-started';
  };

  const getStatusBadge = () => {
    const status = getCourseStatus();
    if (status === 'completed') {
      return <span className="status-badge status-completed">Completed</span>;
    } else if (status === 'in-progress') {
      return <span className="status-badge status-in-progress">In Progress</span>;
    }
    return <span className="status-badge status-not-started">Not Started</span>;
  };

  // Handle Continue Learning button click
  const handleContinueLearning = async (e) => {
    e.preventDefault();
    if (continuing || !course.id) return;

    try {
      setContinuing(true);
      const response = await api.get(`/student/courses/${course.id}/continue`);
      const data = response.data;

      // Handle both camelCase and PascalCase (backend returns PascalCase)
      const courseCompleted = data.courseCompleted || data.CourseCompleted || false;
      const lessonId = data.lessonId || data.LessonId || null;

      if (courseCompleted) {
        // Course is completed - navigate to lessons page (readonly/completed state)
        // Do NOT show alert - completion is state-driven and reflected in UI
        navigate(`/student/lessons?course=${course.id}`);
      } else if (lessonId) {
        // Navigate to the next incomplete lesson
        navigate(`/student/lessons?course=${course.id}&lesson=${lessonId}`);
      } else {
        // No next lesson found but course not completed - navigate to lessons page
        navigate(`/student/lessons?course=${course.id}`);
      }
    } catch (err) {
      console.error('Error continuing learning:', err);
      const errorMessage = err.response?.data?.message 
        || err.message 
        || 'Failed to continue learning';
      alert(errorMessage);
    } finally {
      setContinuing(false);
    }
  };

  const formatLastAccessed = (dateString) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Never';
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return 'Never';
    }
  };

  // Safely extract course properties with defaults
  const courseId = course.id || 0;
  const title = course.title || 'Untitled Course';
  const instructor = course.instructor || '';
  const completedLessons = Number(course.completedLessons) || 0;
  const totalLessons = Number(course.totalLessons) || 0;
  const completedQuizzes = Number(course.completedQuizzes) || 0;
  const totalQuizzes = Number(course.totalQuizzes) || 0;
  const progress = Math.max(0, Math.min(100, Number(course.progress) || 0));
  const lastAccessed = course.lastAccessed || null;

  return (
    <div className="course-progress-card">
      <div className="course-progress-header">
        <div className="course-progress-info">
          <h3 className="course-progress-title">{title}</h3>
          {instructor && (
            <p className="course-progress-instructor">by {instructor}</p>
          )}
        </div>
        {getStatusBadge()}
      </div>
      
      <div className="course-progress-stats">
        <div className="course-progress-stat">
          <span className="stat-label">Lessons</span>
          <span className="stat-value">{completedLessons}/{totalLessons}</span>
        </div>
        <div className="course-progress-stat">
          <span className="stat-label">Quizzes</span>
          <span className="stat-value">{completedQuizzes}/{totalQuizzes}</span>
        </div>
        <div className="course-progress-stat">
          <span className="stat-label">Last Accessed</span>
          <span className="stat-value">{formatLastAccessed(lastAccessed)}</span>
        </div>
      </div>

      <ProgressBar progress={progress} size="medium" />

      {showButton && courseId > 0 && (
        <div className="course-progress-actions">
          {getCourseStatus() === 'completed' ? (
            <button 
              className="btn-primary" 
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            >
              View Certificate
            </button>
          ) : getCourseStatus() === 'in-progress' ? (
            <button 
              className="btn-primary" 
              onClick={handleContinueLearning}
              disabled={continuing}
            >
              {continuing ? 'Loading...' : 'Continue Learning'}
            </button>
          ) : (
            <Link to={`/student/courses/${courseId}`} className="btn-primary">
              Start Course
            </Link>
          )}
          <Link to={`/student/courses/${courseId}`} className="btn-secondary">
            View Details
          </Link>
        </div>
      )}
    </div>
  );
};

export default CourseProgressCard;


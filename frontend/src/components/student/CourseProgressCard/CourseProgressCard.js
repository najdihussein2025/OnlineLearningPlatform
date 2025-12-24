import React from 'react';
import { Link } from 'react-router-dom';
import ProgressBar from '../ProgressBar/ProgressBar';
import './CourseProgressCard.css';

const CourseProgressCard = ({ course, showButton = true }) => {
  const getStatusBadge = () => {
    if (course.progress === 100) {
      return <span className="status-badge status-completed">Completed</span>;
    } else if (course.progress > 0) {
      return <span className="status-badge status-in-progress">In Progress</span>;
    }
    return <span className="status-badge status-not-started">Not Started</span>;
  };

  return (
    <div className="course-progress-card">
      <div className="course-progress-header">
        <div className="course-progress-info">
          <h3 className="course-progress-title">{course.title}</h3>
          <p className="course-progress-instructor">by {course.instructor}</p>
        </div>
        {getStatusBadge()}
      </div>
      
      <div className="course-progress-stats">
        <div className="course-progress-stat">
          <span className="stat-label">Lessons</span>
          <span className="stat-value">{course.completedLessons}/{course.totalLessons}</span>
        </div>
        <div className="course-progress-stat">
          <span className="stat-label">Quizzes</span>
          <span className="stat-value">{course.completedQuizzes}/{course.totalQuizzes}</span>
        </div>
        <div className="course-progress-stat">
          <span className="stat-label">Last Accessed</span>
          <span className="stat-value">{course.lastAccessed || 'Never'}</span>
        </div>
      </div>

      <ProgressBar progress={course.progress} size="medium" />

      {showButton && (
        <div className="course-progress-actions">
          {course.progress > 0 ? (
            <Link to={`/student/lessons?course=${course.id}`} className="btn-primary">
              Continue Learning
            </Link>
          ) : (
            <Link to={`/student/lessons?course=${course.id}`} className="btn-primary">
              Start Course
            </Link>
          )}
          <Link to={`/student/courses/${course.id}`} className="btn-secondary">
              View Details
            </Link>
        </div>
      )}
    </div>
  );
};

export default CourseProgressCard;


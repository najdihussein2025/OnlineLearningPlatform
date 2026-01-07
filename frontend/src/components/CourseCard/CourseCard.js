import React from 'react';
import { Link } from 'react-router-dom';
import './CourseCard.css';

const CourseCard = ({ course, isEnrolled, onEnroll, isEnrolling, showEnrollButton = false }) => {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'badge-beginner';
      case 'intermediate':
        return 'badge-intermediate';
      case 'advanced':
        return 'badge-advanced';
      default:
        return 'badge-beginner';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'web development': 'category-web',
      'data science': 'category-data',
      'design': 'category-design',
      'business': 'category-business',
      'programming': 'category-programming',
      'marketing': 'category-marketing',
    };
    return colors[category?.toLowerCase()] || 'category-default';
  };

  const handleEnrollClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEnroll && !isEnrolling) {
      onEnroll(course.id);
    }
  };

  return (
    <div className="course-card-wrapper">
    <Link to={`/course/${course.id}`} className="course-card">
      <div className="course-card-thumbnail">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} />
        ) : (
          <div className="course-card-placeholder">
            <svg width="100%" height="100%" viewBox="0 0 400 225" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="400" height="225" fill="url(#courseGradient)"/>
              <defs>
                <linearGradient id="courseGradient" x1="0" y1="0" x2="400" y2="225" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#3b82f6"/>
                  <stop offset="100%" stopColor="#1e3a8a"/>
                </linearGradient>
              </defs>
              <circle cx="200" cy="112" r="40" fill="white" opacity="0.2"/>
              <rect x="150" y="90" width="100" height="45" rx="4" fill="white" opacity="0.3"/>
            </svg>
          </div>
        )}
        <div className="course-card-badges">
          <span className={`course-badge category-badge ${getCategoryColor(course.category)}`}>
            {course.category}
          </span>
          <span className={`course-badge difficulty-badge ${getDifficultyColor(course.difficulty)}`}>
            {course.difficulty}
          </span>
        </div>
      </div>
      <div className="course-card-content">
        <h3 className="course-card-title">{course.title}</h3>
        <p className="course-card-description">{course.description}</p>
        <div className="course-card-meta">
          <div className="course-card-meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 13H11V7H13V13ZM13 17H11V15H13V17Z" fill="currentColor"/>
            </svg>
            <span>{course.duration}</span>
          </div>
          <div className="course-card-meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="currentColor"/>
            </svg>
            <span>{course.instructor}</span>
          </div>
        </div>
        <div className="course-card-footer">
          {isEnrolled ? (
            <>
              <span className="course-card-cta enrolled">Enrolled</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </>
          ) : (
            <>
              <span className="course-card-cta">View Course</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </>
          )}
        </div>
      </div>
    </Link>
    {showEnrollButton && !isEnrolled && (
      <button
        className="course-card-enroll-btn"
        onClick={handleEnrollClick}
        disabled={isEnrolling}
      >
        {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
      </button>
    )}
    </div>
  );
};

export default CourseCard;


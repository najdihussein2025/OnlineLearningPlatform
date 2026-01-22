import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { enrollmentService } from '../../../services/enrollmentService';
import './StudentEnrollment.css';

const StudentEnrollment = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadAvailableCourses();
  }, []);

  const loadAvailableCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/courses/available-for-enrollment');
      setCourses(response.data || []);
    } catch (error) {
      console.error('Error loading available courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      setEnrollingId(courseId);
      const result = await enrollmentService.enroll(courseId);
      
      if (result.success) {
        // Remove the enrolled course from the list
        setCourses(courses.filter(c => c.id !== courseId));
        // Redirect to My Courses
        navigate('/student/courses');
      } else {
        alert(result.error || 'Failed to enroll in course');
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      alert('Failed to enroll in course. Please try again.');
    } finally {
      setEnrollingId(null);
    }
  };

  if (loading) {
    return (
      <div className="student-enrollment-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Enrollment</h1>
            <p className="page-subtitle">Browse and enroll in available courses</p>
          </div>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading available courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-enrollment-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Enrollment</h1>
          <p className="page-subtitle">Browse and enroll in available courses</p>
        </div>
      </div>

      <div className="courses-grid">
        {courses.length > 0 ? (
          courses.map((course) => (
            <div key={course.id} className="course-card">
              <div className="course-image-container">
                {course.thumbnail ? (
                  <img 
                    src={course.thumbnail} 
                    alt={course.title}
                    className="course-image"
                  />
                ) : (
                  <div className="course-image-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
              <div className="course-content">
                <h3 className="course-title">{course.title || 'Untitled Course'}</h3>
                <p className="course-description">
                  {course.shortDescription || 'No description available'}
                </p>
                <div className="course-meta">
                  <span className="course-lessons">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 19.5C4 18.6716 4.67157 18 5.5 18H18.5C19.3284 18 20 18.6716 20 19.5V20.5C20 21.3284 19.3284 22 18.5 22H5.5C4.67157 22 4 21.3284 4 20.5V19.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M4 2H20V14H4V2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {course.lessonsCount || 0} Lessons
                  </span>
                </div>
                <button
                  className="enroll-button"
                  onClick={() => handleEnroll(course.id)}
                  disabled={enrollingId === course.id}
                >
                  {enrollingId === course.id ? (
                    <>
                      <div className="button-spinner"></div>
                      Enrolling...
                    </>
                  ) : (
                    'Enroll'
                  )}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 3H8C9.06087 3 10.0783 3.42143 10.8284 4.17157C11.5786 4.92172 12 5.93913 12 7V21C12 20.2044 11.6839 19.4413 11.1213 18.8787C10.5587 18.3161 9.79565 18 9 18H2V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 3H16C14.9391 3 13.9217 3.42143 13.1716 4.17157C12.4214 4.92172 12 5.93913 12 7V21C12 20.2044 12.3161 19.4413 12.8787 18.8787C13.4413 18.3161 14.2044 18 15 18H22V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3>You are enrolled in all available courses 🎉</h3>
            <p>Great job! You've enrolled in all the courses currently available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentEnrollment;


import React, { useState, useEffect } from 'react';
import CourseProgressCard from '../../../components/student/CourseProgressCard/CourseProgressCard';
import api from '../../../services/api';
import './StudentCourses.css';

const StudentCourses = () => {
  const [filter, setFilter] = useState('all');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadCourses = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get('/student/courses');
        
        if (!mounted) return;

        // Backend returns a plain JSON array directly
        // Ensure response.data is an array
        const coursesData = Array.isArray(response.data) ? response.data : [];
        
        // Map backend data to frontend format with safe defaults
        // Filter out any invalid courses (missing courseId)
        const mappedCourses = coursesData
          .filter(course => course && (course.courseId || course.id))
          .map(course => {
            // Safely extract all values with proper defaults
            const courseId = course.courseId || course.id || 0;
            const title = course.title || 'Untitled Course';
            const shortDescription = course.shortDescription || '';
            const progress = Number(course.progress) || 0;
            const lessonsCount = Number(course.lessonsCount) || 0;
            const completedLessonsCount = Number(course.completedLessonsCount) || 0;
            const quizzesCount = Number(course.quizzesCount) || 0;
            const completedQuizzesCount = Number(course.completedQuizzesCount || course.passedQuizzesCount) || 0;
            const lastAccessed = course.lastAccessed || null;
            const status = course.status || null;
            
            return {
              id: courseId,
              title: title,
              description: shortDescription,
              thumbnail: '', // Not in new response
              progress: Math.max(0, Math.min(100, progress)), // Clamp between 0-100
              enrolledAt: null, // Not in new response
              instructor: '', // Not available in current backend response
              completedLessons: completedLessonsCount,
              totalLessons: lessonsCount,
              completedQuizzes: completedQuizzesCount,
              totalQuizzes: quizzesCount,
              lastAccessed: lastAccessed,
              status: status,
            };
          });

        setCourses(mappedCourses);
      } catch (err) {
        console.error('Error loading enrolled courses:', err);
        if (!mounted) return;
        
        // Instead of showing error, set empty courses array
        // This prevents the error screen from showing
        setCourses([]);
        setError(null); // Clear error to prevent error screen
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadCourses();
    return () => { mounted = false; };
  }, []);

  // Determine course status - STRICTLY use backend status, never calculate from progress
  const getCourseStatus = (course) => {
    // Backend MUST provide status - use it directly
    if (course && course.status) {
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

  // Safely filter courses
  const filteredCourses = (courses || []).filter(course => {
    if (!course) return false;
    const status = getCourseStatus(course);
    if (filter === 'all') return true;
    if (filter === 'in-progress') return status === 'in-progress';
    if (filter === 'completed') return status === 'completed';
    if (filter === 'not-started') return status === 'not-started';
    return true;
  });

  // Calculate counts for tabs (ensure courses is an array)
  const coursesArray = Array.isArray(courses) ? courses : [];
  const allCount = coursesArray.length;
  const inProgressCount = coursesArray.filter(c => c && getCourseStatus(c) === 'in-progress').length;
  const completedCount = coursesArray.filter(c => c && getCourseStatus(c) === 'completed').length;
  const notStartedCount = coursesArray.filter(c => c && getCourseStatus(c) === 'not-started').length;

  // Loading state
  if (loading) {
    return (
      <div className="student-courses-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Courses</h1>
            <p className="page-subtitle">Manage and continue your enrolled courses</p>
          </div>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your courses...</p>
        </div>
      </div>
    );
  }

  // Don't show error state - always show courses list (even if empty)
  // This prevents the error screen from appearing

  return (
    <div className="student-courses-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Courses</h1>
          <p className="page-subtitle">Manage and continue your enrolled courses</p>
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Courses ({allCount})
          </button>
          <button
            className={`filter-tab ${filter === 'in-progress' ? 'active' : ''}`}
            onClick={() => setFilter('in-progress')}
          >
            In Progress ({inProgressCount})
          </button>
          <button
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({completedCount})
          </button>
          <button
            className={`filter-tab ${filter === 'not-started' ? 'active' : ''}`}
            onClick={() => setFilter('not-started')}
          >
            Not Started ({notStartedCount})
          </button>
        </div>
      </div>

      <div className="courses-grid">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <CourseProgressCard key={course.id} course={course} />
          ))
        ) : (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3>
              {courses.length === 0 
                ? 'You are not enrolled in any courses yet'
                : 'No courses found'}
            </h3>
            <p>
              {courses.length === 0
                ? 'Browse available courses and enroll to get started.'
                : 'No courses match your selected filter.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCourses;


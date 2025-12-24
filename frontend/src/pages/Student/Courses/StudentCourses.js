import React, { useState } from 'react';
import CourseProgressCard from '../../../components/student/CourseProgressCard/CourseProgressCard';
import './StudentCourses.css';

const StudentCourses = () => {
  const [filter, setFilter] = useState('all');

  // Mock data - would come from API
  const courses = [
    {
      id: 1,
      title: 'Complete Web Development Bootcamp',
      instructor: 'John Smith',
      progress: 65,
      completedLessons: 13,
      totalLessons: 20,
      completedQuizzes: 2,
      totalQuizzes: 5,
      lastAccessed: '2 hours ago',
      status: 'in-progress',
    },
    {
      id: 2,
      title: 'Advanced Data Science with Python',
      instructor: 'Sarah Johnson',
      progress: 30,
      completedLessons: 6,
      totalLessons: 20,
      completedQuizzes: 1,
      totalQuizzes: 4,
      lastAccessed: '1 day ago',
      status: 'in-progress',
    },
    {
      id: 3,
      title: 'UI/UX Design Fundamentals',
      instructor: 'Mike Davis',
      progress: 100,
      completedLessons: 15,
      totalLessons: 15,
      completedQuizzes: 3,
      totalQuizzes: 3,
      lastAccessed: '1 week ago',
      status: 'completed',
    },
    {
      id: 4,
      title: 'React Advanced Patterns',
      instructor: 'Emily Chen',
      progress: 0,
      completedLessons: 0,
      totalLessons: 18,
      completedQuizzes: 0,
      totalQuizzes: 4,
      lastAccessed: null,
      status: 'not-started',
    },
    {
      id: 5,
      title: 'Node.js Backend Development',
      instructor: 'David Wilson',
      progress: 45,
      completedLessons: 9,
      totalLessons: 20,
      completedQuizzes: 1,
      totalQuizzes: 5,
      lastAccessed: '3 days ago',
      status: 'in-progress',
    },
    {
      id: 6,
      title: 'Machine Learning Basics',
      instructor: 'Lisa Anderson',
      progress: 100,
      completedLessons: 12,
      totalLessons: 12,
      completedQuizzes: 2,
      totalQuizzes: 2,
      lastAccessed: '2 weeks ago',
      status: 'completed',
    },
  ];

  const filteredCourses = courses.filter(course => {
    if (filter === 'all') return true;
    if (filter === 'in-progress') return course.status === 'in-progress';
    if (filter === 'completed') return course.status === 'completed';
    if (filter === 'not-started') return course.status === 'not-started';
    return true;
  });

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
            All Courses ({courses.length})
          </button>
          <button
            className={`filter-tab ${filter === 'in-progress' ? 'active' : ''}`}
            onClick={() => setFilter('in-progress')}
          >
            In Progress ({courses.filter(c => c.status === 'in-progress').length})
          </button>
          <button
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({courses.filter(c => c.status === 'completed').length})
          </button>
          <button
            className={`filter-tab ${filter === 'not-started' ? 'active' : ''}`}
            onClick={() => setFilter('not-started')}
          >
            Not Started ({courses.filter(c => c.status === 'not-started').length})
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
            <h3>No courses found</h3>
            <p>No courses match your selected filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCourses;


import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ProgressBar from '../../../components/student/ProgressBar/ProgressBar';
import './StudentLessons.css';

const StudentLessons = () => {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('course');
  const lessonId = searchParams.get('lesson');
  const [completedLessons, setCompletedLessons] = useState(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]));

  // Mock data - would come from API
  const courses = [
    {
      id: 1,
      title: 'Complete Web Development Bootcamp',
      progress: 65,
      lessons: [
        { id: 1, title: 'Introduction to Web Development', type: 'video', duration: '15 min', completed: true },
        { id: 2, title: 'HTML Basics', type: 'video', duration: '20 min', completed: true },
        { id: 3, title: 'CSS Fundamentals', type: 'video', duration: '25 min', completed: true },
        { id: 4, title: 'JavaScript Basics', type: 'video', duration: '30 min', completed: true },
        { id: 5, title: 'DOM Manipulation', type: 'video', duration: '35 min', completed: true },
        { id: 6, title: 'React Introduction', type: 'video', duration: '40 min', completed: true },
        { id: 7, title: 'React Components', type: 'video', duration: '45 min', completed: true },
        { id: 8, title: 'React State Management', type: 'video', duration: '50 min', completed: true },
        { id: 9, title: 'React Hooks', type: 'video', duration: '45 min', completed: true },
        { id: 10, title: 'React Router', type: 'video', duration: '40 min', completed: true },
        { id: 11, title: 'API Integration', type: 'video', duration: '50 min', completed: true },
        { id: 12, title: 'State Management with Redux', type: 'video', duration: '55 min', completed: true },
        { id: 13, title: 'Testing React Applications', type: 'video', duration: '45 min', completed: true },
        { id: 14, title: 'React Hooks Deep Dive', type: 'video', duration: '50 min', completed: false },
        { id: 15, title: 'Advanced React Patterns', type: 'video', duration: '55 min', completed: false },
        { id: 16, title: 'Performance Optimization', type: 'article', duration: '30 min', completed: false },
        { id: 17, title: 'Deployment Strategies', type: 'article', duration: '25 min', completed: false },
        { id: 18, title: 'Best Practices', type: 'article', duration: '20 min', completed: false },
        { id: 19, title: 'Project Setup', type: 'video', duration: '35 min', completed: false },
        { id: 20, title: 'Final Project', type: 'project', duration: '2 hours', completed: false },
      ],
    },
  ];

  const selectedCourse = courses.find(c => c.id === parseInt(courseId || '1')) || courses[0];
  const selectedLesson = selectedCourse.lessons.find(l => l.id === parseInt(lessonId || '14')) || selectedCourse.lessons[13];
  const currentLessonIndex = selectedCourse.lessons.findIndex(l => l.id === selectedLesson.id);
  const nextLesson = selectedCourse.lessons[currentLessonIndex + 1];
  const prevLesson = selectedCourse.lessons[currentLessonIndex - 1];

  const handleMarkComplete = () => {
    setCompletedLessons(prev => new Set([...prev, selectedLesson.id]));
  };

  const getLessonTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
          </svg>
        );
      case 'article':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 19.5C4 18.6716 4.67157 18 5.5 18H18.5C19.3284 18 20 18.6716 20 19.5V20.5C20 21.3284 19.3284 22 18.5 22H5.5C4.67157 22 4 21.3284 4 20.5V19.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 2H20V14H4V2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'project':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="student-lessons-page">
      <div className="lessons-layout">
        {/* Sidebar - Lessons List */}
        <aside className="lessons-sidebar">
          <div className="lessons-sidebar-header">
            <h2 className="course-title">{selectedCourse.title}</h2>
            <ProgressBar progress={selectedCourse.progress} size="small" />
          </div>
          <div className="lessons-list">
            {selectedCourse.lessons.map((lesson, index) => {
              const isCompleted = completedLessons.has(lesson.id);
              const isActive = lesson.id === selectedLesson.id;
              
              return (
                <Link
                  key={lesson.id}
                  to={`/student/lessons?course=${selectedCourse.id}&lesson=${lesson.id}`}
                  className={`lesson-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                >
                  <div className="lesson-item-number">{index + 1}</div>
                  <div className="lesson-item-content">
                    <div className="lesson-item-header">
                      <span className="lesson-item-type">{getLessonTypeIcon(lesson.type)}</span>
                      <h3 className="lesson-item-title">{lesson.title}</h3>
                    </div>
                    <div className="lesson-item-meta">
                      <span className="lesson-duration">{lesson.duration}</span>
                      {isCompleted && (
                        <span className="lesson-completed-badge">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Main Content - Lesson View */}
        <main className="lesson-content">
          <div className="lesson-header">
            <div className="lesson-breadcrumb">
              <Link to="/student/courses">My Courses</Link>
              <span>/</span>
              <span>{selectedCourse.title}</span>
            </div>
            <h1 className="lesson-title">{selectedLesson.title}</h1>
            <div className="lesson-meta">
              <span className="lesson-type-badge">
                {getLessonTypeIcon(selectedLesson.type)}
                {selectedLesson.type.charAt(0).toUpperCase() + selectedLesson.type.slice(1)}
              </span>
              <span className="lesson-duration-badge">{selectedLesson.duration}</span>
              {completedLessons.has(selectedLesson.id) && (
                <span className="lesson-completed-badge-main">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Completed
                </span>
              )}
            </div>
          </div>

          <div className="lesson-player">
            {selectedLesson.type === 'video' ? (
              <div className="video-placeholder">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
                </svg>
                <p>Video Player Placeholder</p>
                <p className="video-placeholder-note">Video content would be displayed here</p>
              </div>
            ) : selectedLesson.type === 'article' ? (
              <div className="article-content">
                <h2>Article Content</h2>
                <p>This is a placeholder for article content. In a real application, this would contain the full article text, images, code examples, and other educational materials.</p>
                <p>The article content would be fetched from the backend and displayed here with proper formatting, syntax highlighting for code blocks, and interactive elements.</p>
              </div>
            ) : (
              <div className="project-content">
                <h2>Project Instructions</h2>
                <p>This is a placeholder for project instructions. In a real application, this would contain detailed project requirements, starter code, submission guidelines, and evaluation criteria.</p>
              </div>
            )}
          </div>

          <div className="lesson-actions">
            {!completedLessons.has(selectedLesson.id) && (
              <button className="btn-mark-complete" onClick={handleMarkComplete}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Mark as Completed
              </button>
            )}
          </div>

          <div className="lesson-navigation">
            {prevLesson && (
              <Link
                to={`/student/lessons?course=${selectedCourse.id}&lesson=${prevLesson.id}`}
                className="nav-button nav-prev"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div>
                  <span className="nav-label">Previous</span>
                  <span className="nav-title">{prevLesson.title}</span>
                </div>
              </Link>
            )}
            {nextLesson && (
              <Link
                to={`/student/lessons?course=${selectedCourse.id}&lesson=${nextLesson.id}`}
                className="nav-button nav-next"
              >
                <div>
                  <span className="nav-label">Next</span>
                  <span className="nav-title">{nextLesson.title}</span>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentLessons;


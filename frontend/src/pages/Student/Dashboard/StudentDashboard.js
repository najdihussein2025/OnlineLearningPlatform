import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import StatCard from '../../../components/admin/StatCard/StatCard';
import CourseProgressCard from '../../../components/student/CourseProgressCard/CourseProgressCard';
import ProgressBar from '../../../components/student/ProgressBar/ProgressBar';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const { user } = useAuth();

  // Mock data - would come from API
  const stats = [
    {
      title: 'Enrolled Courses',
      value: '12',
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
      title: 'Completed Lessons',
      value: '48',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 19.5C4 18.6716 4.67157 18 5.5 18H18.5C19.3284 18 20 18.6716 20 19.5V20.5C20 21.3284 19.3284 22 18.5 22H5.5C4.67157 22 4 21.3284 4 20.5V19.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 2H20V14H4V2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'secondary',
    },
    {
      title: 'Upcoming Quizzes',
      value: '3',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'accent',
    },
    {
      title: 'Certificates Earned',
      value: '7',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'success',
    },
  ];

  const lastCourse = {
    id: 1,
    title: 'Complete Web Development Bootcamp',
    instructor: 'John Smith',
    progress: 65,
    completedLessons: 13,
    totalLessons: 20,
    completedQuizzes: 2,
    totalQuizzes: 5,
    lastAccessed: '2 hours ago',
    lastLesson: {
      id: 14,
      title: 'React Hooks Deep Dive',
      courseId: 1,
    },
  };

  const upcomingQuizzes = [
    {
      id: 1,
      title: 'JavaScript Fundamentals Quiz',
      course: 'Complete Web Development Bootcamp',
      date: '2024-01-28',
      time: '10:00 AM',
      duration: '30 minutes',
    },
    {
      id: 2,
      title: 'React Components Quiz',
      course: 'Complete Web Development Bootcamp',
      date: '2024-01-30',
      time: '2:00 PM',
      duration: '45 minutes',
    },
    {
      id: 3,
      title: 'Python Basics Quiz',
      course: 'Advanced Data Science with Python',
      date: '2024-02-01',
      time: '11:00 AM',
      duration: '30 minutes',
    },
  ];

  return (
    <div className="student-dashboard-page">
      {/* Welcome Header */}
      <div className="dashboard-welcome">
        <h1 className="dashboard-title">
          Welcome back, {user?.firstName || 'Student'}!
        </h1>
        <p className="dashboard-subtitle">Continue your learning journey</p>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Continue Learning Section */}
      <div className="continue-learning-section">
        <div className="section-header">
          <h2 className="section-title">Continue Learning</h2>
          <Link to="/student/courses" className="view-all-link">
            View All Courses
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
        
        <div className="continue-learning-card">
          <div className="continue-learning-content">
            <div className="continue-learning-info">
              <h3 className="continue-course-title">{lastCourse.title}</h3>
              <p className="continue-course-instructor">by {lastCourse.instructor}</p>
              <div className="continue-progress-wrapper">
                <ProgressBar progress={lastCourse.progress} size="large" />
              </div>
              <div className="continue-stats">
                <div className="continue-stat">
                  <span className="stat-label">Last Lesson</span>
                  <span className="stat-value">{lastCourse.lastLesson.title}</span>
                </div>
                <div className="continue-stat">
                  <span className="stat-label">Progress</span>
                  <span className="stat-value">{lastCourse.completedLessons}/{lastCourse.totalLessons} Lessons</span>
                </div>
              </div>
            </div>
            <Link 
              to={`/student/lessons?course=${lastCourse.id}&lesson=${lastCourse.lastLesson.id}`}
              className="btn-resume"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
              </svg>
              Resume Lesson
            </Link>
          </div>
        </div>
      </div>

      {/* Upcoming Quizzes Section */}
      <div className="upcoming-quizzes-section">
        <div className="section-header">
          <h2 className="section-title">Upcoming Quizzes</h2>
          <Link to="/student/quizzes" className="view-all-link">
            View All Quizzes
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        <div className="quizzes-grid">
          {upcomingQuizzes.map((quiz) => (
            <div key={quiz.id} className="quiz-card">
              <div className="quiz-card-header">
                <div className="quiz-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="quiz-badge">Upcoming</span>
              </div>
              <h3 className="quiz-title">{quiz.title}</h3>
              <p className="quiz-course">{quiz.course}</p>
              <div className="quiz-details">
                <div className="quiz-detail-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{new Date(quiz.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="quiz-detail-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{quiz.duration}</span>
                </div>
              </div>
              <Link to={`/student/quizzes/${quiz.id}`} className="btn-start-quiz">
                Start Quiz
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;


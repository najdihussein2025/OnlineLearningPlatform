import React from 'react';
import ProgressBar from '../../../components/student/ProgressBar/ProgressBar';
import './StudentProgress.css';

const StudentProgress = () => {
  // Mock data - would come from API
  const overallStats = {
    totalCourses: 12,
    completedCourses: 7,
    totalLessons: 180,
    completedLessons: 120,
    totalQuizzes: 45,
    completedQuizzes: 32,
    averageScore: 87,
  };

  const courseProgress = [
    {
      id: 1,
      title: 'Complete Web Development Bootcamp',
      progress: 65,
      completedLessons: 13,
      totalLessons: 20,
      averageQuizScore: 85,
      lastActivity: '2 hours ago',
    },
    {
      id: 2,
      title: 'Advanced Data Science with Python',
      progress: 30,
      completedLessons: 6,
      totalLessons: 20,
      averageQuizScore: 78,
      lastActivity: '1 day ago',
    },
    {
      id: 3,
      title: 'UI/UX Design Fundamentals',
      progress: 100,
      completedLessons: 15,
      totalLessons: 15,
      averageQuizScore: 92,
      lastActivity: '1 week ago',
    },
  ];

  const quizHistory = [
    { id: 1, quiz: 'JavaScript Fundamentals', course: 'Web Development', score: 85, date: '2024-01-25', passed: true },
    { id: 2, quiz: 'CSS Layout', course: 'Web Development', score: 92, date: '2024-01-20', passed: true },
    { id: 3, quiz: 'React Basics', course: 'Web Development', score: 78, date: '2024-01-15', passed: true },
    { id: 4, quiz: 'Python Basics', course: 'Data Science', score: 88, date: '2024-01-10', passed: true },
  ];

  return (
    <div className="student-progress-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Progress</h1>
          <p className="page-subtitle">Track your learning journey and achievements</p>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="overall-stats-section">
        <h2 className="section-title">Overall Statistics</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{overallStats.totalCourses}</div>
              <div className="stat-label">Total Courses</div>
              <div className="stat-subtext">{overallStats.completedCourses} Completed</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 19.5C4 18.6716 4.67157 18 5.5 18H18.5C19.3284 18 20 18.6716 20 19.5V20.5C20 21.3284 19.3284 22 18.5 22H5.5C4.67157 22 4 21.3284 4 20.5V19.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 2H20V14H4V2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{overallStats.completedLessons}/{overallStats.totalLessons}</div>
              <div className="stat-label">Lessons Completed</div>
              <div className="stat-subtext">{Math.round((overallStats.completedLessons / overallStats.totalLessons) * 100)}% Overall</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{overallStats.completedQuizzes}/{overallStats.totalQuizzes}</div>
              <div className="stat-label">Quizzes Completed</div>
              <div className="stat-subtext">Average Score: {overallStats.averageScore}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Progress */}
      <div className="course-progress-section">
        <h2 className="section-title">Course Progress</h2>
        <div className="course-progress-list">
          {courseProgress.map((course) => (
            <div key={course.id} className="course-progress-item">
              <div className="course-progress-header">
                <h3 className="course-progress-title">{course.title}</h3>
                <span className="course-progress-percentage">{course.progress}%</span>
              </div>
              <ProgressBar progress={course.progress} size="medium" />
              <div className="course-progress-details">
                <div className="progress-detail">
                  <span className="detail-label">Lessons</span>
                  <span className="detail-value">{course.completedLessons}/{course.totalLessons}</span>
                </div>
                <div className="progress-detail">
                  <span className="detail-label">Avg Quiz Score</span>
                  <span className="detail-value">{course.averageQuizScore}%</span>
                </div>
                <div className="progress-detail">
                  <span className="detail-label">Last Activity</span>
                  <span className="detail-value">{course.lastActivity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quiz History */}
      <div className="quiz-history-section">
        <h2 className="section-title">Quiz Score History</h2>
        <div className="quiz-history-chart">
          <div className="chart-placeholder">
            <svg width="100%" height="200" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="200" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d="M50 120 L150 100 L250 110 L350 80 L450 90 L550 95 L650 85 L750 88" stroke="#3b82f6" strokeWidth="3" fill="none"/>
              <path d="M50 120 L150 100 L250 110 L350 80 L450 90 L550 95 L650 85 L750 88 L750 200 L50 200 Z" fill="url(#scoreGradient)"/>
              <text x="400" y="190" textAnchor="middle" fill="#64748b" fontSize="14">Quiz Scores Over Time</text>
            </svg>
          </div>
        </div>
        <div className="quiz-history-list">
          {quizHistory.map((quiz) => (
            <div key={quiz.id} className="quiz-history-item">
              <div className="quiz-history-info">
                <h4 className="quiz-history-title">{quiz.quiz}</h4>
                <p className="quiz-history-course">{quiz.course}</p>
                <span className="quiz-history-date">
                  {new Date(quiz.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className={`quiz-history-score ${quiz.passed ? 'score-passed' : 'score-failed'}`}>
                <span className="score-value">{quiz.score}%</span>
                <span className="score-status">{quiz.passed ? 'Passed' : 'Failed'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentProgress;


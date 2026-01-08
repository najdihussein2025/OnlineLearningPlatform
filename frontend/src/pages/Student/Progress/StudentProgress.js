import React, { useState, useEffect } from 'react';
import ProgressBar from '../../../components/student/ProgressBar/ProgressBar';
import api from '../../../services/api';
import { studentService } from '../../../services/studentService';
import './StudentProgress.css';

const StudentProgress = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadProgress = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load dashboard data for overall stats and course progress
        const dashboard = await studentService.getDashboard();
        if (!mounted) return;

        // Normalize dashboard data with defaults
        const normalizedDashboard = {
          totalCourses: dashboard?.totalCourses ?? 0,
          completedCourses: dashboard?.completedCourses ?? 0,
          inProgressCourses: dashboard?.inProgressCourses ?? 0,
          totalLessons: dashboard?.totalLessons ?? 0,
          completedLessons: dashboard?.completedLessons ?? 0,
          overallProgress: dashboard?.overallProgress ?? 0,
          courses: Array.isArray(dashboard?.courses) ? dashboard.courses : []
        };
        setDashboardData(normalizedDashboard);

        // Load quiz attempts for quiz history
        try {
          const attemptsResponse = await api.get('/student/quiz-attempts');
          if (!mounted) return;
          const attemptsData = Array.isArray(attemptsResponse.data) ? attemptsResponse.data : [];
          setQuizAttempts(attemptsData);
        } catch (err) {
          console.error('Error loading quiz attempts:', err);
          // Don't fail the whole page if quiz attempts fail
          setQuizAttempts([]);
        }
      } catch (err) {
        console.error('Error loading progress:', err);
        if (!mounted) return;
        
        // Set empty data instead of showing error
        setDashboardData({
          totalCourses: 0,
          completedCourses: 0,
          inProgressCourses: 0,
          totalLessons: 0,
          completedLessons: 0,
          overallProgress: 0,
          courses: []
        });
        setQuizAttempts([]);
        setError(null); // Clear error to prevent error screen
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProgress();
    return () => { mounted = false; };
  }, []);

  // Format date relative to now
  const formatLastActivity = (dateString) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Never';
      const now = new Date();
      const diffMs = now - date;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Never';
    }
  };

  // Calculate average quiz score from attempts
  const calculateAverageScore = () => {
    if (!quizAttempts || quizAttempts.length === 0) return 0;
    const scores = quizAttempts.map(a => Number(a.score) || 0).filter(s => s > 0);
    if (scores.length === 0) return 0;
    const sum = scores.reduce((acc, score) => acc + score, 0);
    return Math.round(sum / scores.length);
  };

  // Calculate average quiz score per course
  const calculateCourseAverageScore = (courseId) => {
    const courseAttempts = quizAttempts.filter(a => a.courseId === courseId);
    if (courseAttempts.length === 0) return 0;
    const scores = courseAttempts.map(a => Number(a.score) || 0).filter(s => s > 0);
    if (scores.length === 0) return 0;
    const sum = scores.reduce((acc, score) => acc + score, 0);
    return Math.round(sum / scores.length);
  };

  if (loading) {
    return (
      <div className="student-progress-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Progress</h1>
            <p className="page-subtitle">Track your learning journey and achievements</p>
          </div>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your progress...</p>
        </div>
      </div>
    );
  }

  // Use dashboard data or defaults
  const overallStats = dashboardData ? {
    totalCourses: Number(dashboardData.totalCourses) || 0,
    completedCourses: Number(dashboardData.completedCourses) || 0,
    totalLessons: Number(dashboardData.totalLessons) || 0,
    completedLessons: Number(dashboardData.completedLessons) || 0,
    totalQuizzes: 0, // Not tracked in dashboard
    completedQuizzes: quizAttempts.filter(a => a.passed).length,
    averageScore: calculateAverageScore(),
  } : {
    totalCourses: 0,
    completedCourses: 0,
    totalLessons: 0,
    completedLessons: 0,
    totalQuizzes: 0,
    completedQuizzes: 0,
    averageScore: 0,
  };

  // Map courses from dashboard to courseProgress format
  const courseProgress = (dashboardData?.courses || []).map(course => ({
    id: course.courseId || course.id || 0,
    title: course.title || 'Untitled Course',
    progress: Number(course.progress) || 0,
    completedLessons: Number(course.completedLessons) || 0,
    totalLessons: Number(course.totalLessons) || 0,
    averageQuizScore: calculateCourseAverageScore(course.courseId || course.id),
    lastActivity: formatLastActivity(course.lastAccessed),
  }));

  // Map quiz attempts to quizHistory format
  const quizHistory = (quizAttempts || []).map(attempt => ({
    id: attempt.id || 0,
    quiz: attempt.quizTitle || 'Untitled Quiz',
    course: attempt.courseTitle || 'Untitled Course',
    score: Number(attempt.score) || 0,
    date: attempt.attemptDate || new Date().toISOString(),
    passed: Boolean(attempt.passed),
  }));

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
              <div className="stat-subtext">
                {overallStats.totalLessons > 0 
                  ? `${Math.round((overallStats.completedLessons / overallStats.totalLessons) * 100)}% Overall`
                  : 'No lessons available'}
              </div>
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
        {courseProgress.length > 0 ? (
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
        ) : (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3>No course progress available</h3>
            <p>You haven't enrolled in any courses yet.</p>
          </div>
        )}
      </div>

      {/* Quiz History */}
      <div className="quiz-history-section">
        <h2 className="section-title">Quiz Score History</h2>
        {quizHistory.length > 0 ? (
          <>
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
          </>
        ) : (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3>No quiz attempts yet</h3>
            <p>Complete quizzes to see your score history here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProgress;


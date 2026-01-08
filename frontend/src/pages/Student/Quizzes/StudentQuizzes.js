import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import './StudentQuizzes.css';

const StudentQuizzes = () => {
  const [filter, setFilter] = useState('all');
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadQuizzes = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get('/student/quizzes');
        if (!mounted) return;

        // Normalize quiz data with defaults
        const quizzesData = Array.isArray(response.data) ? response.data : [];
        const normalizedQuizzes = quizzesData.map(quiz => ({
          id: quiz.id || quiz.quizId || 0,
          title: quiz.title || 'Untitled Quiz',
          course: quiz.course || 'Untitled Course',
          status: quiz.status || 'not-started',
          score: quiz.score || null,
          maxScore: quiz.maxScore || 100,
          date: quiz.date || null,
          duration: quiz.duration || 'No limit',
          questions: quiz.questions || 0,
          passingScore: quiz.passingScore || 70,
          canRetake: quiz.canRetake !== false, // Default to true
        }));

        setQuizzes(normalizedQuizzes);
      } catch (err) {
        console.error('Error loading quizzes:', err);
        if (!mounted) return;
        
        // Set empty array instead of showing error
        setQuizzes([]);
        setError(null); // Clear error to prevent error screen
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadQuizzes();
    return () => { mounted = false; };
  }, []);

  const getStatusBadge = (status, score, passingScore) => {
    if (status === 'completed') {
      const passed = score != null && score >= passingScore;
      return (
        <span className={`status-badge ${passed ? 'status-passed' : 'status-failed'}`}>
          {passed ? 'Passed' : 'Failed'}
        </span>
      );
    } else if (status === 'upcoming') {
      return <span className="status-badge status-upcoming">Upcoming</span>;
    }
    return <span className="status-badge status-not-started">Not Started</span>;
  };

  // Filter quizzes based on selected filter
  const filteredQuizzes = (quizzes || []).filter(quiz => {
    if (filter === 'all') return true;
    return quiz.status === filter;
  });

  if (loading) {
    return (
      <div className="student-quizzes-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Quizzes</h1>
            <p className="page-subtitle">Take quizzes and track your performance</p>
          </div>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-quizzes-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Quizzes</h1>
          <p className="page-subtitle">Take quizzes and track your performance</p>
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Quizzes ({quizzes.length})
          </button>
          <button
            className={`filter-tab ${filter === 'not-started' ? 'active' : ''}`}
            onClick={() => setFilter('not-started')}
          >
            Not Started ({quizzes.filter(q => q.status === 'not-started').length})
          </button>
          <button
            className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming ({quizzes.filter(q => q.status === 'upcoming').length})
          </button>
          <button
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({quizzes.filter(q => q.status === 'completed').length})
          </button>
        </div>
      </div>

      <div className="quizzes-grid">
        {filteredQuizzes.length > 0 ? (
          filteredQuizzes.map((quiz) => (
            <div key={quiz.id} className="quiz-card">
              <div className="quiz-card-header">
                <div className="quiz-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {getStatusBadge(quiz.status, quiz.score, quiz.passingScore)}
              </div>
              
              <h3 className="quiz-title">{quiz.title}</h3>
              <p className="quiz-course">{quiz.course}</p>

              <div className="quiz-details">
                <div className="quiz-detail-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{quiz.duration}</span>
                </div>
                <div className="quiz-detail-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{quiz.questions} Questions</span>
                </div>
                {quiz.status === 'completed' && quiz.score != null && (
                  <div className="quiz-detail-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Score: {quiz.score}/{quiz.maxScore}</span>
                  </div>
                )}
              </div>

              {quiz.status === 'completed' && quiz.score != null && (
                <div className="quiz-score-section">
                  <div className="score-bar">
                    <div 
                      className="score-fill" 
                      style={{ width: `${(quiz.score / quiz.maxScore) * 100}%` }}
                    ></div>
                  </div>
                  <p className="score-text">
                    {quiz.score >= quiz.passingScore ? '✓ Passed' : '✗ Failed'} 
                    (Passing: {quiz.passingScore}%)
                  </p>
                </div>
              )}

              <div className="quiz-actions">
                {quiz.status === 'not-started' && (
                  <Link to={`/student/quizzes/${quiz.id}`} className="btn-start-quiz">
                    Start Quiz
                  </Link>
                )}
                {quiz.status === 'upcoming' && quiz.date && (
                  <div className="upcoming-info">
                    <p className="upcoming-date">
                      {new Date(quiz.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                {quiz.status === 'completed' && (
                  <div className="completed-actions">
                    <Link to={`/student/quizzes/${quiz.id}/results`} className="btn-view-results">
                      View Results
                    </Link>
                    {quiz.canRetake && (
                      <Link to={`/student/quizzes/${quiz.id}`} className="btn-retake">
                        Retake Quiz
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3>No quizzes found</h3>
            <p>No quizzes match your selected filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentQuizzes;


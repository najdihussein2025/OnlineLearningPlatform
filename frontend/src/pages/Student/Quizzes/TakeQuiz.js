import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizService } from '../../../services/quizService';
import { useToast } from '../../../hooks/useToast';
import './TakeQuiz.css';

const TakeQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Load quiz data
  useEffect(() => {
    if (!quizId) {
      setError('Quiz ID is required');
      setLoading(false);
      return;
    }

    const loadQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        const quizData = await quizService.getQuizForAttempt(quizId);
        
        // Ensure questions array exists (even if empty)
        const questions = Array.isArray(quizData.questions) ? quizData.questions : [];
        
        // Log detailed quiz data for debugging
        console.log('Quiz loaded:', {
          id: quizData.id,
          title: quizData.title,
          questionsCount: questions.length,
          questions: questions.map(q => ({
            id: q.id,
            questionText: q.questionText,
            questionType: q.questionType,
            answersCount: Array.isArray(q.answers) ? q.answers.length : 0,
            answers: q.answers,
            rawData: q // Include raw data for debugging
          }))
        });
        
        // Log any questions missing answers
        questions.forEach(q => {
          const answerCount = Array.isArray(q.answers) ? q.answers.length : 0;
          if (answerCount === 0) {
            console.warn(`Question ${q.id} has no answers:`, q);
          }
        });
        
        setQuiz({
          ...quizData,
          questions: questions
        });
        
        // Initialize answers object - only for valid questions
        const initialAnswers = {};
        questions
          .filter(q => q && q.id && q.questionText) // Only valid questions
          .forEach(q => {
            initialAnswers[q.id] = [];
          });
        setAnswers(initialAnswers);
      } catch (err) {
        console.error('Error loading quiz:', err);
        const errorMessage = err.response?.data?.message || 'Failed to load quiz';
        setError(errorMessage);
        showToast(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId, showToast]);

  const handleAnswerChange = (questionId, answerId, questionType) => {
    setAnswers(prev => {
      const newAnswers = { ...prev };
      
      if (questionType === 'MSQ') {
        // Multiple select - toggle answer
        if (!newAnswers[questionId]) {
          newAnswers[questionId] = [];
        }
        const index = newAnswers[questionId].indexOf(answerId);
        if (index > -1) {
          newAnswers[questionId] = newAnswers[questionId].filter(id => id !== answerId);
        } else {
          newAnswers[questionId] = [...newAnswers[questionId], answerId];
        }
      } else {
        // Single select (MCQ, TF)
        newAnswers[questionId] = [answerId];
      }
      
      return newAnswers;
    });
  };

  const handleShortAnswer = (questionId, value) => {
    setAnswers(prev => {
      const newAnswers = { ...prev };
      // Store short answer as text in the answers array
      newAnswers[questionId] = [value];
      return newAnswers;
    });
  };

  // Normalize question type from backend codes to enum names
  const normalizeQuestionType = (questionType) => {
    if (!questionType) return 'MultipleChoice';
    
    const typeStr = String(questionType).toLowerCase();
    if (typeStr === 'multiplechoice' || typeStr === 'mcq') return 'MultipleChoice';
    if (typeStr === 'truefalse' || typeStr === 'tf') return 'TrueFalse';
    if (typeStr === 'shortanswer' || typeStr === 'sa') return 'ShortAnswer';
    
    return 'MultipleChoice'; // default
  };

  const handleSubmit = async () => {
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      showToast('Cannot submit quiz with no questions', 'error');
      return;
    }

    // Check if at least one answer is selected
    const answeredCount = Object.values(answers).filter(a => a && a.length > 0).length;
    if (answeredCount === 0) {
      showToast('Please answer at least one question before submitting', 'error');
      return;
    }

    // Validate that all valid questions are answered
    const validQuestions = quiz.questions.filter(q => q && q.id && q.questionText);
    const unansweredQuestions = validQuestions.filter(q => 
      !answers[q.id] || answers[q.id].length === 0
    );

    if (unansweredQuestions.length > 0) {
      const confirmSubmit = window.confirm(
        `You have ${unansweredQuestions.length} unanswered question(s). Do you want to submit anyway?`
      );
      if (!confirmSubmit) return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Format answers for API - only include valid questions
      const validQuestions = quiz.questions.filter(q => q && q.id && q.questionText);
      const formattedAnswers = validQuestions.map(q => {
        const answerValues = answers[q.id] || [];
        
        // Convert answer values to IDs (filter out non-numeric values for ShortAnswer text)
        const selectedAnswerIds = answerValues
          .filter(id => typeof id === 'number' || (typeof id === 'string' && !isNaN(id)))
          .map(id => typeof id === 'string' ? parseInt(id, 10) : id)
          .filter(id => !isNaN(id));
        
        return {
          questionId: q.id,
          selectedAnswerIds: selectedAnswerIds
        };
      });

      const resultData = await quizService.submitQuizAttempt(quizId, formattedAnswers);
      setResult(resultData);
      showToast(
        resultData.passed 
          ? `Quiz passed! Score: ${resultData.score}%` 
          : `Quiz failed. Score: ${resultData.score}% (Required: ${resultData.passingScore}%)`,
        resultData.passed ? 'success' : 'error'
      );
    } catch (err) {
      console.error('Error submitting quiz:', err);
      const errorMessage = err.response?.data?.message || 'Failed to submit quiz';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="take-quiz-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading quiz...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !quiz) {
    return (
      <div className="take-quiz-page">
        <div className="error-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h3>Error loading quiz</h3>
          <p>{error}</p>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/student/quizzes')}
            style={{ marginTop: 'var(--spacing-lg)' }}
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  // Result state
  if (result) {
    return (
      <div className="take-quiz-page">
        <div className="quiz-result-container">
          <div className={`quiz-result-card ${result.passed ? 'passed' : 'failed'}`}>
            <div className="result-icon">
              {result.passed ? (
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M15 9L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </div>
            <h2 className="result-title">{result.passed ? 'Quiz Passed!' : 'Quiz Failed'}</h2>
            <div className="result-score">
              <div className="score-value">{result.score}%</div>
              <div className="score-details">
                <p>Your Score: {result.score}%</p>
                <p>Passing Score: {result.passingScore}%</p>
                <p>Total Questions: {result.totalQuestions}</p>
              </div>
            </div>
            <div className="result-actions">
              <button 
                className="btn-primary" 
                onClick={() => navigate('/student/quizzes')}
              >
                Back to Quizzes
              </button>
              {!result.passed && (
                <button 
                  className="btn-secondary" 
                  onClick={() => {
                    setResult(null);
                    setAnswers({});
                    // Reload quiz
                    window.location.reload();
                  }}
                >
                  Retake Quiz
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz taking state
  return (
    <div className="take-quiz-page">
      <div className="quiz-header">
        <div>
          <h1 className="quiz-title">{quiz?.title}</h1>
          <div className="quiz-meta">
            <span>Passing Score: {quiz?.passingScore}%</span>
            <span>Time Limit: {quiz?.timeLimit} minutes</span>
            <span>Questions: {quiz?.questions?.filter(q => q && q.id && q.questionText).length || 0}</span>
          </div>
        </div>
        <button 
          className="btn-secondary" 
          onClick={() => navigate('/student/quizzes')}
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {quiz?.questions && quiz.questions.length === 0 ? (
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3>No Questions Available</h3>
          <p>This quiz doesn't have any questions yet. Please contact your instructor.</p>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/student/quizzes')}
            style={{ marginTop: 'var(--spacing-lg)' }}
          >
            Back to Quizzes
          </button>
        </div>
      ) : (
        <div className="quiz-questions">
          {(() => {
            const validQuestions = quiz?.questions?.filter(q => q && q.id && q.questionText) || [];
            return validQuestions.map((question, index) => {
              const type = normalizeQuestionType(question.type || question.questionType);
              
              // Ensure question has answers array - handle both 'answers' and 'Answers' (case variations)
              const rawAnswers = question.answers || question.Answers || [];
              const questionAnswers = Array.isArray(rawAnswers) ? rawAnswers : [];
              
              // Filter and validate answers
              const validAnswers = questionAnswers.filter(a => 
                a && 
                (a.id !== undefined && a.id !== null) && 
                (a.answerText !== undefined && a.answerText !== null && String(a.answerText).trim() !== '')
              );
              
              const hasValidAnswers = validAnswers.length > 0;
              
              // Log if answers are missing for debugging
              if (!hasValidAnswers && questionAnswers.length > 0) {
                console.warn(`Question ${question.id} has invalid answers:`, questionAnswers);
              }
              
              return (
                <div key={question.id} className="question-card">
                  <div className="question-header">
                    <span className="question-number">Question {index + 1}</span>
                    <span className="question-type">{question.questionType || 'MCQ'}</span>
                  </div>
                  <h3 className="question-text">{question.questionText}</h3>
                  {type === 'MultipleChoice' && (
                    !hasValidAnswers ? (
                      <div className="no-answers-message">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                          <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <p>No answer options available for this question. Please contact your instructor.</p>
                      </div>
                    ) : (
                      <div className="question-answers">
                        {validAnswers.map((answer) => {
                          const isSelected = answers[question.id]?.includes(answer.id) || false;
                          return (
                            <label 
                              key={answer.id} 
                              className={`answer-option ${isSelected ? 'selected' : ''}`}
                            >
                              <input
                                type="radio"
                                name={`q-${question.id}`}
                                value={answer.id}
                                checked={isSelected}
                                onChange={() => handleAnswerChange(question.id, answer.id, question.questionType)}
                              />
                              <span className="answer-text">{answer.answerText}</span>
                            </label>
                          );
                        })}
                      </div>
                    )
                  )}

                  {type === 'TrueFalse' && (
                    <div className="question-answers">
                      {(() => {
                        // Find True and False answer IDs
                        const trueAnswer = validAnswers.find(a => 
                          String(a.answerText || '').trim().toLowerCase() === 'true'
                        );
                        const falseAnswer = validAnswers.find(a => 
                          String(a.answerText || '').trim().toLowerCase() === 'false'
                        );
                        
                        // Use answer IDs if available, otherwise fall back to strings
                        const trueValue = trueAnswer?.id || 'true';
                        const falseValue = falseAnswer?.id || 'false';
                        const isTrueSelected = trueAnswer?.id 
                          ? answers[question.id]?.includes(trueAnswer.id) 
                          : answers[question.id]?.includes('true');
                        const isFalseSelected = falseAnswer?.id 
                          ? answers[question.id]?.includes(falseAnswer.id) 
                          : answers[question.id]?.includes('false');
                        
                        return (
                          <>
                            <label className={`answer-option ${isTrueSelected ? 'selected' : ''}`}>
                              <input
                                type="radio"
                                name={`q-${question.id}`}
                                value={trueValue}
                                checked={isTrueSelected || false}
                                onChange={() => handleAnswerChange(question.id, trueValue, question.questionType)}
                              />
                              True
                            </label>
                            <label className={`answer-option ${isFalseSelected ? 'selected' : ''}`}>
                              <input
                                type="radio"
                                name={`q-${question.id}`}
                                value={falseValue}
                                checked={isFalseSelected || false}
                                onChange={() => handleAnswerChange(question.id, falseValue, question.questionType)}
                              />
                              False
                            </label>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {type === 'ShortAnswer' && (
                    <div className="question-answers">
                      <input
                        type="text"
                        className="short-answer-input"
                        placeholder="Type your answer here..."
                        value={answers[question.id]?.[0] || ''}
                        onChange={(e) => handleShortAnswer(question.id, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              );
            });
          })()}
          {quiz?.questions?.filter(q => q && q.id && q.questionText).length === 0 && (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3>No Valid Questions Available</h3>
              <p>This quiz doesn't have any valid questions with answer options. Please contact your instructor.</p>
            </div>
          )}
        </div>
      )}

      {quiz?.questions && quiz.questions.filter(q => q && q.id && q.questionText).length > 0 && (
        <div className="quiz-footer">
          <div className="quiz-progress">
            <span>
              Answered: {Object.values(answers).filter(a => a && a.length > 0).length} / {quiz.questions.filter(q => q && q.id && q.questionText).length}
            </span>
          </div>
          <button 
            className="btn-primary btn-submit" 
            onClick={handleSubmit}
            disabled={submitting || Object.values(answers).filter(a => a && a.length > 0).length === 0}
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </div>
      )}
    </div>
  );
};

export default TakeQuiz;


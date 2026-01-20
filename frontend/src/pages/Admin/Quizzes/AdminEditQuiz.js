import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDashboardToast } from '../../../components/DashboardLayout/DashboardLayout';
import api from '../../../services/api';
import './AdminQuizzes.css';

const AdminEditQuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useDashboardToast();

  // Main form state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    courseId: '',
    lessonId: '',
    passingScore: 70,
    timeLimit: 30
  });

  // Questions list
  const [questions, setQuestions] = useState([]);

  // New question form state
  const [newQuestion, setNewQuestion] = useState({
    questionText: '',
    questionType: 'multipleChoice',
    answers: [
      { answerText: '', isCorrect: false },
      { answerText: '', isCorrect: false }
    ]
  });

  // Supporting data
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    loadAllData();
  }, [id]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      console.log('[Load] Starting to load quiz ID:', id);

      // Get courses
      const coursesRes = await api.get('/courses');
      const coursesData = Array.isArray(coursesRes.data) ? coursesRes.data : [];
      setCourses(coursesData);
      console.log('[Load] Courses loaded:', coursesData.length);

      // Get quiz by ID
      const quizRes = await api.get(`/quizzes/${id}`);
      const quiz = quizRes.data;
      setFormData({
        title: quiz.title || '',
        courseId: quiz.courseId || '',
        lessonId: quiz.lessonId || '',
        passingScore: quiz.passingScore || 70,
        timeLimit: quiz.timeLimit || 30
      });
      console.log('[Load] Quiz loaded:', quiz.title);

      // Get all questions and filter for this quiz
      const questionsRes = await api.get('/questions');
      const allQuestions = Array.isArray(questionsRes.data) ? questionsRes.data : [];
      const quizQuestions = allQuestions.filter(q => q.quizId === parseInt(id));
      setQuestions(quizQuestions);
      console.log('[Load] Questions loaded:', quizQuestions.length);
    } catch (err) {
      console.error('[Load] Error:', err);
      error('Failed to load quiz');
      navigate('/admin/quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'passingScore' || name === 'timeLimit' ? parseInt(value) : value
    }));
  };

  const handleQuestionTextChange = (e) => {
    setNewQuestion(prev => ({
      ...prev,
      questionText: e.target.value
    }));
  };

  const handleAnswerChange = (index, field, value) => {
    setNewQuestion(prev => ({
      ...prev,
      answers: prev.answers.map((ans, i) => 
        i === index ? { ...ans, [field]: value } : ans
      )
    }));
  };

  const addAnswerOption = () => {
    setNewQuestion(prev => ({
      ...prev,
      answers: [...prev.answers, { answerText: '', isCorrect: false }]
    }));
  };

  const removeAnswerOption = (index) => {
    if (newQuestion.answers.length > 2) {
      setNewQuestion(prev => ({
        ...prev,
        answers: prev.answers.filter((_, i) => i !== index)
      }));
    }
  };

  const validateQuestion = () => {
    console.log('[Validate] Checking question:', newQuestion);

    if (!newQuestion.questionText.trim()) {
      error('Question text is required');
      return false;
    }

    const emptyAnswers = newQuestion.answers.filter(a => !a.answerText.trim());
    if (emptyAnswers.length > 0) {
      error('All answers must have text');
      return false;
    }

    const hasCorrect = newQuestion.answers.some(a => a.isCorrect);
    if (!hasCorrect) {
      error('At least one answer must be marked as correct');
      return false;
    }

    console.log('[Validate] Valid!');
    return true;
  };

  const handleAddQuestion = async () => {
    console.log('[AddQuestion] Starting...');

    if (!validateQuestion()) return;

    try {
      setSaving(true);

      // Step 1: Create question
      console.log('[AddQuestion] Creating question...');
      const qRes = await api.post('/questions', {
        quizId: parseInt(id),
        questionText: newQuestion.questionText,
        questionType: newQuestion.questionType
      });

      const questionId = qRes.data?.id;
      if (!questionId) {
        error('No question ID returned');
        return;
      }
      console.log('[AddQuestion] Question created, ID:', questionId);

      // Step 2: Create answers
      console.log('[AddQuestion] Creating answers...');
      await Promise.all(newQuestion.answers.map(ans =>
        api.post('/answers', {
          questionId: questionId,
          answerText: ans.answerText,
          isCorrect: ans.isCorrect
        })
      ));
      console.log('[AddQuestion] Answers created');

      // Step 3: Add to local state immediately
      const newQ = {
        id: questionId,
        quizId: parseInt(id),
        questionText: newQuestion.questionText,
        questionType: newQuestion.questionType,
        answers: newQuestion.answers
      };
      setQuestions(prev => [...prev, newQ]);
      console.log('[AddQuestion] Added to state. Total:', questions.length + 1);

      // Step 4: Reset form
      setNewQuestion({
        questionText: '',
        questionType: 'multipleChoice',
        answers: [
          { answerText: '', isCorrect: false },
          { answerText: '', isCorrect: false }
        ]
      });

      success('Question added');
      console.log('[AddQuestion] Done');
    } catch (err) {
      console.error('[AddQuestion] Error:', err);
      error(err.response?.data?.message || 'Failed to add question');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Delete this question?')) return;

    try {
      setSaving(true);
      console.log('[DeleteQuestion] Deleting:', questionId);
      await api.delete(`/questions/${questionId}`);
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      success('Question deleted');
      console.log('[DeleteQuestion] Done');
    } catch (err) {
      console.error('[DeleteQuestion] Error:', err);
      error('Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      console.log('[Submit] Saving quiz...');

      await api.put(`/quizzes/${id}`, {
        title: formData.title,
        courseId: formData.courseId ? parseInt(formData.courseId) : null,
        lessonId: formData.lessonId || null,
        passingScore: formData.passingScore,
        timeLimit: formData.timeLimit
      });

      success('Quiz saved');
      navigate('/admin/quizzes');
    } catch (err) {
      console.error('[Submit] Error:', err);
      error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-edit-quiz">
      <h1>Edit Quiz: {formData.title}</h1>

      <form onSubmit={handleSubmit}>
        {/* Quiz Form */}
        <div className="form-section">
          <h2>Quiz Info</h2>
          
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Course</label>
            <select
              name="courseId"
              value={formData.courseId}
              onChange={handleChange}
            >
              <option value="">Select...</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Passing Score %</label>
              <input
                type="number"
                name="passingScore"
                value={formData.passingScore}
                onChange={handleChange}
                min="0"
                max="100"
              />
            </div>
            <div className="form-group">
              <label>Time Limit (min)</label>
              <input
                type="number"
                name="timeLimit"
                value={formData.timeLimit}
                onChange={handleChange}
                min="1"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Quiz'}
          </button>
        </div>

        {/* Questions Section */}
        <div className="form-section">
          <h2>Questions ({questions.length})</h2>

          {questions.length > 0 && (
            <div className="questions-list">
              {questions.map((q, idx) => (
                <div key={q.id} className="question-item">
                  <div className="question-header">
                    <span>Q{idx + 1}</span>
                    <span className="question-text">{q.questionText}</span>
                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() => handleDeleteQuestion(q.id)}
                      disabled={saving}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="question-answers">
                    {q.answers?.map((ans, aidx) => (
                      <div key={aidx} className="answer-item">
                        <span className={ans.isCorrect ? 'correct' : ''}>
                          {ans.isCorrect ? '✓' : '○'}
                        </span>
                        {ans.answerText}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Question Form */}
          <div className="add-question-form">
            <h3>Add New Question</h3>

            <div className="form-group">
              <label>Question Text *</label>
              <textarea
                value={newQuestion.questionText}
                onChange={handleQuestionTextChange}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Type</label>
              <select
                value={newQuestion.questionType}
                onChange={(e) => setNewQuestion(p => ({ ...p, questionType: e.target.value }))}
              >
                <option value="multipleChoice">Multiple Choice</option>
                <option value="truefalse">True/False</option>
              </select>
            </div>

            {/* Answers */}
            <div className="answers-section">
              <label>Answers *</label>
              {newQuestion.answers.map((ans, idx) => (
                <div key={idx} className="answer-option">
                  <input
                    type="text"
                    value={ans.answerText}
                    onChange={(e) => handleAnswerChange(idx, 'answerText', e.target.value)}
                    placeholder={`Answer ${idx + 1}`}
                  />
                  <label>
                    <input
                      type="checkbox"
                      checked={ans.isCorrect}
                      onChange={(e) => handleAnswerChange(idx, 'isCorrect', e.target.checked)}
                    />
                    Correct
                  </label>
                  {newQuestion.answers.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeAnswerOption(idx)}
                      className="btn-small"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={addAnswerOption}
            >
              + Add Answer
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={handleAddQuestion}
              disabled={saving}
            >
              {saving ? 'Adding...' : 'Add Question'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminEditQuiz;

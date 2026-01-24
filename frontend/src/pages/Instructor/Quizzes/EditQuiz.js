import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';
import { useDashboardToast } from '../../../components/DashboardLayout/DashboardLayout';
import './InstructorQuizzes.css';

// Multiple Choice Answers Component
const MultipleChoiceAnswers = ({ answers, handleAnswerChange, addAnswerOption, removeAnswerOption }) => {
  return (
    <div className="answers-section">
      <label>Answers *</label>
      {answers.map((ans, idx) => (
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
          {answers.length > 2 && (
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
      <button
        type="button"
        className="btn-secondary"
        onClick={addAnswerOption}
      >
        + Add Answer
      </button>
    </div>
  );
};

// True/False Answers Component
const TrueFalseAnswers = ({ trueFalseAnswer, setTrueFalseAnswer }) => {
  return (
    <div className="answers-section">
      <label>Correct Answer *</label>
      <div className="true-false-options">
        <label>
          <input
            type="radio"
            name="trueFalse"
            checked={trueFalseAnswer === true}
            onChange={() => setTrueFalseAnswer(true)}
          />
          True
        </label>
        <label>
          <input
            type="radio"
            name="trueFalse"
            checked={trueFalseAnswer === false}
            onChange={() => setTrueFalseAnswer(false)}
          />
          False
        </label>
      </div>
    </div>
  );
};

// Short Answer Input Component
const ShortAnswerInput = ({ shortAnswer, setShortAnswer }) => {
  return (
    <div className="answers-section">
      <label>Correct Answer *</label>
      <input
        type="text"
        value={shortAnswer}
        onChange={(e) => setShortAnswer(e.target.value)}
        placeholder="Enter the correct answer"
      />
      <span style={{ marginTop: '8px', fontSize: '14px', color: '#666', display: 'block' }}>
        (Auto-marked as correct)
      </span>
    </div>
  );
};

const EditQuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useDashboardToast();

  // Form state
  const [form, setForm] = useState({
    title: '',
    courseId: null,
    lessonId: '',
    passingScore: 70,
    timeLimit: 10
  });

  // Question type mapping: UI string -> enum number
  const questionTypeMap = {
    "Multiple Choice": 0,
    "True/False": 1,
    "Short Answer": 2
  };

  // Questions
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState({
    questionText: '',
    questionType: 'Multiple Choice',
    answers: [
      { answerText: '', isCorrect: false },
      { answerText: '', isCorrect: false }
    ]
  });
  
  // True/False state
  const [trueFalseAnswer, setTrueFalseAnswer] = useState(true);
  
  // Short Answer state
  const [shortAnswer, setShortAnswer] = useState('');

  // Handle question type changes
  const handleQuestionTypeChange = (newType) => {
    if (newType === 'True/False') {
      setTrueFalseAnswer(true);
      setNewQuestion({
        questionText: newQuestion.questionText,
        questionType: newType,
        answers: [
          { answerText: 'True', isCorrect: true },
          { answerText: 'False', isCorrect: false }
        ]
      });
    } else if (newType === 'Short Answer') {
      setShortAnswer('');
      setNewQuestion({
        questionText: newQuestion.questionText,
        questionType: newType,
        answers: [
          { answerText: '', isCorrect: true }
        ]
      });
    } else {
      // Multiple Choice
      setNewQuestion({
        questionText: newQuestion.questionText,
        questionType: newType,
        answers: [
          { answerText: '', isCorrect: false },
          { answerText: '', isCorrect: false }
        ]
      });
    }
  };

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('[Load] Loading quiz ID:', id);

      // Get quiz
      const quizRes = await api.get(`/quizzes/${id}`);
      const quiz = quizRes.data;
      setForm({
        title: quiz.title || '',
        courseId: quiz.courseId || null,
        lessonId: quiz.lessonId || '',
        passingScore: quiz.passingScore || 70,
        timeLimit: quiz.timeLimit || 10
      });

      // Get instructor's courses
      const coursesRes = await api.get('/courses/mine');
      setCourses(coursesRes.data || []);

      // Get questions for this quiz
      const questionsRes = await api.get('/questions');
      const allQuestions = Array.isArray(questionsRes.data) ? questionsRes.data : [];
      const quizQuestions = allQuestions.filter(q => q.quizId === parseInt(id));
      setQuestions(quizQuestions);
      console.log('[Load] Loaded', quizQuestions.length, 'questions');

      // Get lessons for the course
      if (quiz.courseId) {
        const lessonsRes = await api.get(`/lessons/byCourse/${quiz.courseId}`);
        setLessons(lessonsRes.data || []);
      }
    } catch (err) {
      console.error('[Load] Error:', err);
      error('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  // Load lessons when course changes
  useEffect(() => {
    if (!form.courseId) return;
    const loadLessons = async () => {
      try {
        const res = await api.get(`/lessons/byCourse/${form.courseId}`);
        setLessons(res.data || []);
      } catch (err) {
        console.error('[Lessons] Error:', err);
      }
    };
    loadLessons();
  }, [form.courseId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
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
    // For Short Answer and True/False, prevent adding more answers
    if (newQuestion.questionType === 'Short Answer' || newQuestion.questionType === 'True/False') {
      return;
    }
    setNewQuestion(prev => ({
      ...prev,
      answers: [...prev.answers, { answerText: '', isCorrect: false }]
    }));
  };

  const removeAnswerOption = (index) => {
    // For Short Answer, prevent removal (only 1 answer)
    if (newQuestion.questionType === 'Short Answer') {
      return;
    }
    if (newQuestion.answers.length > 2) {
      setNewQuestion(prev => ({
        ...prev,
        answers: prev.answers.filter((_, i) => i !== index)
      }));
    }
  };

  const validateQuestion = () => {
    console.log('[Validate] Question:', newQuestion);

    if (!newQuestion.questionText.trim()) {
      error('Question text required');
      return false;
    }

    const empty = newQuestion.answers.filter(a => !a.answerText.trim());
    if (empty.length > 0) {
      error('All answers need text');
      return false;
    }

    const hasCorrect = newQuestion.answers.some(a => a.isCorrect);
    if (!hasCorrect) {
      error('Mark at least one answer as correct');
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

      // Step 1: Create question with answers
      console.log('[AddQuestion] Creating...');
      const qRes = await api.post('/questions', {
        quizId: parseInt(id),
        questionText: newQuestion.questionText,
        type: questionTypeMap[newQuestion.questionType],
        answers: newQuestion.answers.map(ans => ({
          text: ans.answerText,
          isCorrect: ans.isCorrect
        }))
      });

      const questionId = qRes.data?.id;
      if (!questionId) {
        error('No question ID');
        return;
      }
      console.log('[AddQuestion] Created, ID:', questionId);

      // Step 3: Add to local state
      const newQ = {
        id: questionId,
        quizId: parseInt(id),
        questionText: newQuestion.questionText,
        questionType: newQuestion.questionType,
        answers: qRes.data?.answers || newQuestion.answers.map(ans => ({
          answerText: ans.answerText,
          isCorrect: ans.isCorrect
        }))
      };
      setQuestions(prev => [...prev, newQ]);
      console.log('[AddQuestion] Added to state. Total:', questions.length + 1);

      // Step 4: Reset form
      setNewQuestion({
        questionText: '',
        questionType: 'Multiple Choice',
        answers: [
          { answerText: '', isCorrect: false },
          { answerText: '', isCorrect: false }
        ]
      });
      setShowAddQuestion(false);

      success('Question added');
      console.log('[AddQuestion] Done');
    } catch (err) {
      console.error('[AddQuestion] Error:', err);
      error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Delete?')) return;

    try {
      setSaving(true);
      console.log('[Delete] Deleting:', questionId);
      await api.delete(`/questions/${questionId}`);
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      success('Deleted');
      console.log('[Delete] Done');
    } catch (err) {
      console.error('[Delete] Error:', err);
      error('Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      console.log('[Submit] Saving...');
      await api.put(`/quizzes/${id}`, {
        title: form.title,
        courseId: form.courseId ? parseInt(form.courseId) : null,
        lessonId: form.lessonId || null,
        passingScore: parseInt(form.passingScore) || 70,
        timeLimit: parseInt(form.timeLimit) || 10
      });
      success('Saved');
      navigate('/instructor/quizzes');
    } catch (err) {
      console.error('[Submit] Error:', err);
      error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="instructor-edit-quiz">
      <h1>Edit Quiz: {form.title}</h1>

      <form onSubmit={handleSubmit}>
        {/* Form Section */}
        <div className="form-section">
          <h2>Quiz Info</h2>

          <div className="form-group">
            <label>Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Passing Score %</label>
              <input
                name="passingScore"
                value={form.passingScore}
                onChange={handleChange}
                type="number"
                min="0"
                max="100"
              />
            </div>
            <div className="form-group">
              <label>Time Limit (min)</label>
              <input
                name="timeLimit"
                value={form.timeLimit}
                onChange={handleChange}
                type="number"
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
          <div className="section-header">
            <h2>Questions ({questions.length})</h2>
            <button
              type="button"
              className="btn-add-question-top"
              onClick={() => setShowAddQuestion(!showAddQuestion)}
            >
              <div className="btn-icon">{showAddQuestion ? '- Cancel' : '+ Add Question'}</div>
            </button>
          </div>

          {/* Questions List */}
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
          {showAddQuestion && (
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
                  onChange={(e) => handleQuestionTypeChange(e.target.value)}
                >
                  <option value="Multiple Choice">Multiple Choice</option>
                  <option value="True/False">True/False</option>
                  <option value="Short Answer">Short Answer</option>
                </select>
              </div>

              {/* Answers - Component-based rendering */}
              {newQuestion.questionType === 'Multiple Choice' && (
                <MultipleChoiceAnswers
                  answers={newQuestion.answers}
                  handleAnswerChange={handleAnswerChange}
                  addAnswerOption={addAnswerOption}
                  removeAnswerOption={removeAnswerOption}
                />
              )}
              
              {newQuestion.questionType === 'True/False' && (
                <TrueFalseAnswers
                  trueFalseAnswer={trueFalseAnswer}
                  setTrueFalseAnswer={(value) => {
                    setTrueFalseAnswer(value);
                    setNewQuestion(prev => ({
                      ...prev,
                      answers: [
                        { answerText: 'True', isCorrect: value === true },
                        { answerText: 'False', isCorrect: value === false }
                      ]
                    }));
                  }}
                />
              )}
              
              {newQuestion.questionType === 'Short Answer' && (
                <ShortAnswerInput
                  shortAnswer={shortAnswer}
                  setShortAnswer={(value) => {
                    setShortAnswer(value);
                    setNewQuestion(prev => ({
                      ...prev,
                      answers: [
                        { answerText: value, isCorrect: true }
                      ]
                    }));
                  }}
                />
              )}

              <button
                type="button"
                className="btn-primary"
                onClick={handleAddQuestion}
                disabled={saving}
              >
                {saving ? 'Adding...' : 'Add Question'}
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default EditQuiz;

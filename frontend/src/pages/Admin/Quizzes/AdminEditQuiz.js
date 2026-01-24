import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDashboardToast } from '../../../components/DashboardLayout/DashboardLayout';
import api from '../../../services/api';
import './AdminQuizzes.css';

// Multiple Choice Answers Component
const MultipleChoiceAnswers = ({ answers, handleAnswerChange, addAnswerOption, removeAnswerOption }) => {
  return (
    <div className="answers-section">
      <label>Answers *</label>
      {answers.map((ans, idx) => (
        <div key={idx} className="answer-option">
          <input
            type="text"
            value={ans.text}
            onChange={(e) => handleAnswerChange(idx, 'text', e.target.value)}
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

  // Question type mapping: UI string -> enum number
  const questionTypeMap = {
    "Multiple Choice": 0,
    "True/False": 1,
    "Short Answer": 2
  };

  // Reverse mapping: database code -> UI string
  const questionTypeCodeMap = {
    "MCQ": "Multiple Choice",
    "TF": "True/False",
    "SA": "Short Answer"
  };

  // Question type state
  const [questionType, setQuestionType] = useState("Multiple Choice");

  // New question form state
  const [newQuestion, setNewQuestion] = useState({
    questionText: ''
  });

  // Multiple Choice answers state
  const [answers, setAnswers] = useState([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false }
  ]);

  // True/False answer state
  const [trueFalseAnswer, setTrueFalseAnswer] = useState(true);

  // Short Answer state
  const [shortAnswer, setShortAnswer] = useState("");

  // Edit mode state
  const [editingQuestionId, setEditingQuestionId] = useState(null);

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
    setNewQuestion({
      questionText: e.target.value
    });
  };

  const handleQuestionTypeChange = (e) => {
    const newType = e.target.value;
    setQuestionType(newType);
    // Reset answer states when type changes
    if (newType === "Multiple Choice") {
      setAnswers([
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ]);
    } else if (newType === "True/False") {
      setTrueFalseAnswer(true);
    } else if (newType === "Short Answer") {
      setShortAnswer("");
    }
  };

  // Multiple Choice handlers
  const handleAnswerChange = (index, field, value) => {
    setAnswers(prev => prev.map((ans, i) => 
      i === index ? { ...ans, [field]: value } : ans
    ));
  };

  const addAnswerOption = () => {
    setAnswers(prev => [...prev, { text: '', isCorrect: false }]);
  };

  const removeAnswerOption = (index) => {
    if (answers.length > 2) {
      setAnswers(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validateQuestion = () => {
    console.log('[Validate] Checking question:', newQuestion);

    if (!newQuestion.questionText.trim()) {
      error('Question text is required');
      return false;
    }

    if (questionType === "Multiple Choice") {
      const emptyAnswers = answers.filter(a => !a.text.trim());
      if (emptyAnswers.length > 0) {
        error('All answers must have text');
        return false;
      }
      const hasCorrect = answers.some(a => a.isCorrect);
      if (!hasCorrect) {
        error('At least one answer must be marked as correct');
        return false;
      }
    } else if (questionType === "Short Answer") {
      if (!shortAnswer.trim()) {
        error('Correct answer is required');
        return false;
      }
    }
    // True/False always has an answer (defaults to true)

    console.log('[Validate] Valid!');
    return true;
  };

  const handleAddQuestion = async () => {
    console.log('[AddQuestion] Starting...');

    if (!validateQuestion()) return;

    try {
      setSaving(true);

      // Build answers payload based on question type
      let answersPayload = [];

      if (questionType === "Multiple Choice") {
        answersPayload = answers.map(a => ({
          text: a.text,
          isCorrect: a.isCorrect
        }));
      } else if (questionType === "True/False") {
        answersPayload = [
          { text: "True", isCorrect: trueFalseAnswer },
          { text: "False", isCorrect: !trueFalseAnswer }
        ];
      } else if (questionType === "Short Answer") {
        answersPayload = [
          { text: shortAnswer, isCorrect: true }
        ];
      }

      if (editingQuestionId) {
        // Update existing question
        console.log('[UpdateQuestion] Updating question:', editingQuestionId);
        const qRes = await api.put(`/questions/${editingQuestionId}`, {
          questionText: newQuestion.questionText,
          type: questionTypeMap[questionType],
          answers: answersPayload
        });

        // Update in local state
        setQuestions(prev => prev.map(q => 
          q.id === editingQuestionId 
            ? {
                id: q.id,
                quizId: q.quizId,
                questionText: newQuestion.questionText,
                questionType: questionType,
                answers: qRes.data?.answers || answersPayload.map(a => ({
                  answerText: a.text,
                  isCorrect: a.isCorrect
                }))
              }
            : q
        ));

        setEditingQuestionId(null);
        success('Question updated');
      } else {
        // Create new question
        console.log('[AddQuestion] Creating question...');
        const qRes = await api.post('/questions', {
          quizId: parseInt(id),
          questionText: newQuestion.questionText,
          type: questionTypeMap[questionType],
          answers: answersPayload
        });

        const questionId = qRes.data?.id;
        if (!questionId) {
          error('No question ID returned');
          return;
        }
        console.log('[AddQuestion] Question created, ID:', questionId);

        // Add to local state immediately
        const newQ = {
          id: questionId,
          quizId: parseInt(id),
          questionText: newQuestion.questionText,
          questionType: questionType,
          answers: qRes.data?.answers || answersPayload.map(a => ({
            answerText: a.text,
            isCorrect: a.isCorrect
          }))
        };
        setQuestions(prev => [...prev, newQ]);
        console.log('[AddQuestion] Added to state. Total:', questions.length + 1);
        success('Question added');
      }

      // Reset form
      setNewQuestion({
        questionText: ''
      });
      setQuestionType("Multiple Choice");
      setAnswers([
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ]);
      setTrueFalseAnswer(true);
      setShortAnswer("");

      console.log('[AddQuestion] Done');
    } catch (err) {
      console.error('[AddQuestion] Error:', err);
      error(err.response?.data?.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const handleEditQuestion = (question) => {
    console.log('[EditQuestion] Starting edit for:', question.id);
    
    // Set editing mode
    setEditingQuestionId(question.id);
    
    // Populate form with question data
    setNewQuestion({
      questionText: question.questionText || ''
    });
    
    // Map question type code to UI string
    const uiType = questionTypeCodeMap[question.questionType] || "Multiple Choice";
    setQuestionType(uiType);
    
    // Populate answers based on type
    if (uiType === "Multiple Choice") {
      const mcAnswers = question.answers?.map(a => ({
        text: a.answerText || '',
        isCorrect: a.isCorrect || false
      })) || [{ text: '', isCorrect: false }];
      setAnswers(mcAnswers.length > 0 ? mcAnswers : [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ]);
    } else if (uiType === "True/False") {
      // Find which answer is correct
      const trueAnswer = question.answers?.find(a => a.answerText === "True" && a.isCorrect);
      setTrueFalseAnswer(trueAnswer ? true : false);
    } else if (uiType === "Short Answer") {
      const correctAnswer = question.answers?.find(a => a.isCorrect);
      setShortAnswer(correctAnswer?.answerText || '');
    }
    
    // Scroll to form
    document.querySelector('.add-question-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setNewQuestion({ questionText: '' });
    setQuestionType("Multiple Choice");
    setAnswers([
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ]);
    setTrueFalseAnswer(true);
    setShortAnswer("");
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
                    <div className="question-actions">
                      <button
                        type="button"
                        className="btn-edit"
                        onClick={() => handleEditQuestion(q)}
                        disabled={saving}
                        title="Edit question"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => handleDeleteQuestion(q.id)}
                        disabled={saving}
                        title="Delete question"
                      >
                        ✕
                      </button>
                    </div>
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

          {/* Add/Edit Question Form */}
          <div className="add-question-form">
            <h3>{editingQuestionId ? 'Edit Question' : 'Add New Question'}</h3>
            
            {editingQuestionId && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancelEdit}
                style={{ marginBottom: '10px' }}
              >
                Cancel Edit
              </button>
            )}

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
                value={questionType}
                onChange={handleQuestionTypeChange}
              >
                <option value="Multiple Choice">Multiple Choice</option>
                <option value="True/False">True/False</option>
                <option value="Short Answer">Short Answer</option>
              </select>
            </div>

            {/* Conditional Answer Components */}
            {questionType === "Multiple Choice" && (
              <MultipleChoiceAnswers
                answers={answers}
                handleAnswerChange={handleAnswerChange}
                addAnswerOption={addAnswerOption}
                removeAnswerOption={removeAnswerOption}
              />
            )}

            {questionType === "True/False" && (
              <TrueFalseAnswers
                trueFalseAnswer={trueFalseAnswer}
                setTrueFalseAnswer={setTrueFalseAnswer}
              />
            )}

            {questionType === "Short Answer" && (
              <ShortAnswerInput
                shortAnswer={shortAnswer}
                setShortAnswer={setShortAnswer}
              />
            )}

            <button
              type="button"
              className="btn-primary"
              onClick={handleAddQuestion}
              disabled={saving}
            >
              {saving 
                ? (editingQuestionId ? 'Updating...' : 'Adding...') 
                : (editingQuestionId ? 'Update Question' : 'Add Question')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminEditQuiz;

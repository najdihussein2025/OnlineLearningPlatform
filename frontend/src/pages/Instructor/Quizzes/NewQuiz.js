import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../services/api';
import './InstructorQuizzes.css';

const NewQuiz = () => {
  const [searchParams] = useSearchParams();
  const courseQuery = parseInt(searchParams.get('course')) || null;
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [form, setForm] = useState({
    title: '',
    courseId: courseQuery,
    lessonId: '',
    passingScore: 70,
    timeLimit: 10
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.get('/courses/mine');
        if (!mounted) return;
        setCourses(res.data || []);
      } catch (err) {
        console.error('Failed to load courses', err);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const cid = form.courseId || courseQuery;
    if (!cid) return;
    let mounted = true;
    const loadLessons = async () => {
      try {
        const res = await api.get(`/lessons/byCourse/${cid}`);
        if (!mounted) return;
        setLessons(res.data || []);
      } catch (err) {
        console.error('Failed to load lessons', err);
      }
    };
    loadLessons();
    return () => { mounted = false; };
  }, [form.courseId, courseQuery]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.courseId) {
      setError('Please select a course');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        courseId: parseInt(form.courseId),
        lessonId: form.lessonId ? parseInt(form.lessonId) : null,
        title: form.title,
        passingScore: parseInt(form.passingScore) || 0,
        timeLimit: parseInt(form.timeLimit) || 0
      };
      await api.post('/quizzes', payload);
      navigate('/instructor/quizzes');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="instructor-quizzes-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Create New Quiz</h1>
          <p className="page-subtitle">Add a quiz to your course</p>
        </div>
      </div>

      <form className="quiz-form" onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label>Course</label>
          <select name="courseId" value={form.courseId || ''} onChange={handleChange} required>
            <option value="">Select a course</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Lesson (optional)</label>
          <select name="lessonId" value={form.lessonId || ''} onChange={handleChange}>
            <option value="">None</option>
            {lessons.map(l => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Title</label>
          <input name="title" value={form.title} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Passing Score (%)</label>
          <input name="passingScore" value={form.passingScore} onChange={handleChange} type="number" min="0" max="100" required />
        </div>

        <div className="form-group">
          <label>Time Limit (minutes)</label>
          <input name="timeLimit" value={form.timeLimit} onChange={handleChange} type="number" min="0" required />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Quiz'}</button>
        </div>
      </form>
    </div>
  );
};

export default NewQuiz;

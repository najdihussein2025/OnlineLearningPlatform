import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';
import './InstructorQuizzes.css';

const EditQuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [form, setForm] = useState({
    title: '',
    courseId: null,
    lessonId: '',
    passingScore: 70,
    timeLimit: 10
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const courseRes = await api.get('/courses/mine');
        if (!mounted) return;
        setCourses(courseRes.data || []);

        const quizRes = await api.get(`/quizzes/${id}`);
        if (!mounted) return;
        const q = quizRes.data;
        setForm({
          title: q.title || '',
          courseId: q.courseId || null,
          lessonId: q.lessonId || '',
          passingScore: q.passingScore || 70,
          timeLimit: q.timeLimit || 10
        });

        if (q.courseId) {
          const lessonsRes = await api.get(`/lessons/byCourse/${q.courseId}`);
          if (!mounted) return;
          setLessons(lessonsRes.data || []);
        }
      } catch (err) {
        console.error('Failed to load quiz', err);
        setError(err.response?.data?.message || 'Failed to load quiz');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    const cid = form.courseId;
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
  }, [form.courseId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        passingScore: parseInt(form.passingScore) || undefined,
        timeLimit: parseInt(form.timeLimit) || undefined
      };
      await api.put(`/quizzes/${id}`, payload);
      navigate('/instructor/quizzes');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update quiz');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="instructor-quizzes-page">Loading quiz...</div>;

  return (
    <div className="instructor-quizzes-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Quiz</h1>
          <p className="page-subtitle">Update quiz details</p>
        </div>
      </div>

      <form className="quiz-form" onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}

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
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/instructor/quizzes')}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default EditQuiz;

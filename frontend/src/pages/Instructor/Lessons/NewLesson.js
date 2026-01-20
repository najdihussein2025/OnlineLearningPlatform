import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../services/api';
import './InstructorLessons.css';

const NewLesson = () => {
  const [searchParams] = useSearchParams();
  const courseId = parseInt(searchParams.get('course')) || null;
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    content: '',
    videoUrl: '',
    pdfUrl: '',
    externalUrl: '',
    order: 1,
    estimatedDuration: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!courseId) {
      setError('No course selected');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        courseId,
        title: form.title,
        content: form.content,
        videoUrl: form.videoUrl,
        pdfUrl: form.pdfUrl,
        externalUrl: form.externalUrl,
        order: parseInt(form.order) || 1,
        estimatedDuration: form.estimatedDuration
      };
      await api.post('/lessons', payload);
      navigate(`/instructor/lessons?course=${courseId}`);
    } catch (err) {
      if (err.response?.status === 403) {
        setError(err.response?.data?.message || 'You do not have permission to add lessons to this course');
        // redirect back to instructor courses after showing message briefly
        setTimeout(() => navigate('/instructor/courses'), 1800);
        return;
      }
      setError(err.response?.data?.message || 'Failed to create lesson');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="instructor-lessons-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Create New Lesson</h1>
          <p className="page-subtitle">Add a lesson to your course</p>
        </div>
      </div>

      <form className="lesson-form" onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label>Title</label>
          <input name="title" value={form.title} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Content</label>
          <textarea name="content" value={form.content} onChange={handleChange} rows={6} />
        </div>
        <div className="form-group">
          <label>Video URL</label>
          <input name="videoUrl" value={form.videoUrl} onChange={handleChange} placeholder="e.g., https://youtu.be/..." />
        </div>
        <div className="form-group">
          <label>PDF URL</label>
          <input name="pdfUrl" value={form.pdfUrl} onChange={handleChange} placeholder="e.g., https://example.com/document.pdf" />
        </div>
        <div className="form-group">
          <label>External URL (Resource Link)</label>
          <input name="externalUrl" value={form.externalUrl} onChange={handleChange} placeholder="e.g., https://example.com" />
        </div>
        <div className="form-group">
          <label>Order</label>
          <input name="order" value={form.order} onChange={handleChange} type="number" min="1" />
        </div>
        <div className="form-group">
          <label>Estimated Duration</label>
          <input name="estimatedDuration" value={form.estimatedDuration} onChange={handleChange} placeholder="e.g., 15 min" />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Lesson'}</button>
          <button type="button" className="btn-secondary" onClick={() => navigate(`/instructor/lessons?course=${courseId}`)}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default NewLesson;

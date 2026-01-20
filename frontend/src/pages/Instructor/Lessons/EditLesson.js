import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';
import './InstructorLessons.css';

const EditLesson = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', content: '', videoUrl: '', pdfUrl: '', externalUrl: '', order: 1, estimatedDuration: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.get(`/lessons/${id}`);
        if (!mounted) return;
        const l = res.data;
        setForm({ title: l.title || '', content: l.content || '', videoUrl: l.videoUrl || '', pdfUrl: l.pdfUrl || '', externalUrl: l.externalUrl || '', order: l.order || 1, estimatedDuration: l.estimatedDuration || '' });
      } catch (err) {
        if (err.response?.status === 403) {
          setError(err.response?.data?.message || 'You do not have permission to view or edit this lesson');
          setTimeout(() => navigate('/instructor/lessons'), 1500);
          return;
        }
        setError(err.response?.data?.message || 'Failed to load lesson');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { title: form.title, content: form.content, videoUrl: form.videoUrl, pdfUrl: form.pdfUrl, externalUrl: form.externalUrl, order: parseInt(form.order) || 1, estimatedDuration: form.estimatedDuration };
      await api.put(`/lessons/${id}`, payload);
      // go back to the lessons list - fetch course id from lesson details not available, so go to instructor/lessons
      navigate('/instructor/lessons');
    } catch (err) {
      if (err.response?.status === 403) {
        setError(err.response?.data?.message || 'You do not have permission to edit this lesson');
        setTimeout(() => navigate('/instructor/lessons'), 1500);
        return;
      }
      setError(err.response?.data?.message || 'Failed to save lesson');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="instructor-lessons-page">Loading lesson...</div>;

  return (
    <div className="instructor-lessons-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Lesson</h1>
          <p className="page-subtitle">Modify lesson details</p>
        </div>
      </div>

      <form className="lesson-form" onSubmit={handleSave}>
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
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/instructor/lessons')}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default EditLesson;

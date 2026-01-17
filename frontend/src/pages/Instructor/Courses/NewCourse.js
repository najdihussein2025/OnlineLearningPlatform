import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import './InstructorCourses.css';

const NewCourse = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    shortDescription: '',
    longDescription: '',
    category: '',
    difficulty: '',
    thumbnail: '',
    isPublished: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        shortDescription: form.shortDescription,
        longDescription: form.longDescription,
        category: form.category,
        difficulty: form.difficulty,
        thumbnail: form.thumbnail,
        isPublished: form.isPublished,
      };
      const response = await api.post('/courses', payload);
      navigate('/instructor/courses');
    } catch (err) {
      console.error('Course creation error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="instructor-courses-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Create New Course</h1>
          <p className="page-subtitle">Add a new course for your students</p>
        </div>
      </div>

      <form className="course-form" onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label>Title</label>
          <input name="title" value={form.title} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Short Description</label>
          <input name="shortDescription" value={form.shortDescription} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Long Description</label>
          <textarea name="longDescription" value={form.longDescription} onChange={handleChange} rows={6} />
        </div>
        <div className="form-group">
          <label>Category</label>
          <input name="category" value={form.category} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Difficulty</label>
          <select name="difficulty" value={form.difficulty} onChange={handleChange}>
            <option value="">Select</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div className="form-group">
          <label>Thumbnail URL</label>
          <input name="thumbnail" value={form.thumbnail} onChange={handleChange} />
        </div>
        <div className="form-group checkbox-group">
          <label>
            <input type="checkbox" name="isPublished" checked={form.isPublished} onChange={handleChange} /> Publish now
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Course'}</button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/instructor/courses')}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default NewCourse;

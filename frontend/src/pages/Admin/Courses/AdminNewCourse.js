import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardToast } from '../../../components/DashboardLayout/DashboardLayout';
import api from '../../../services/api';
import './AdminCourses.css';

const AdminNewCourse = () => {
  const navigate = useNavigate();
  const { success, error } = useDashboardToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    longDescription: '',
    category: '',
    difficulty: 'Beginner',
    thumbnail: '',
    isPublished: false,
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Course title is required';
    }
    if (!formData.shortDescription.trim()) {
      newErrors.shortDescription = 'Short description is required';
    }
    if (!formData.longDescription.trim()) {
      newErrors.longDescription = 'Long description is required';
    }
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/courses', {
        title: formData.title,
        shortDescription: formData.shortDescription,
        longDescription: formData.longDescription,
        category: formData.category,
        difficulty: formData.difficulty,
        thumbnail: formData.thumbnail,
        isPublished: formData.isPublished
      });
      
      success('Course created successfully');
      navigate('/admin/courses');
    } catch (err) {
      console.error('Error creating course:', err);
      error('Failed to create course: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="edit-course-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Create New Course</h1>
          <p className="page-subtitle">Add a new course to the platform</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="edit-course-form">
        <div className="form-section">
          <h2>Course Information</h2>
          
          <div className="form-group">
            <label htmlFor="title">Course Title *</label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter course title"
              className={errors.title ? 'input-error' : ''}
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <input
                id="category"
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g., Web Development"
                className={errors.category ? 'input-error' : ''}
              />
              {errors.category && <span className="error-text">{errors.category}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="difficulty">Difficulty Level</label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="shortDescription">Short Description *</label>
            <textarea
              id="shortDescription"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              placeholder="Brief description (visible in course listings)"
              rows="3"
              className={errors.shortDescription ? 'input-error' : ''}
            />
            {errors.shortDescription && <span className="error-text">{errors.shortDescription}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="longDescription">Long Description *</label>
            <textarea
              id="longDescription"
              name="longDescription"
              value={formData.longDescription}
              onChange={handleChange}
              placeholder="Detailed course description"
              rows="6"
              className={errors.longDescription ? 'input-error' : ''}
            />
            {errors.longDescription && <span className="error-text">{errors.longDescription}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="thumbnail">Thumbnail URL</label>
            <input
              id="thumbnail"
              type="url"
              name="thumbnail"
              value={formData.thumbnail}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
            {formData.thumbnail && (
              <div className="thumbnail-preview">
                <img src={formData.thumbnail} alt="Course thumbnail" onError={(e) => e.target.src = ''} />
              </div>
            )}
          </div>

          <div className="form-group checkbox-group">
            <label htmlFor="isPublished">
              <input
                id="isPublished"
                type="checkbox"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleChange}
              />
              Publish immediately
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/admin/courses')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminNewCourse;

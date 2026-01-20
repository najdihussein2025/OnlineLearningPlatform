import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDashboardToast } from '../../../components/DashboardLayout/DashboardLayout';
import api from '../../../services/api';
import './AdminCourses.css';

const AdminEditCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useDashboardToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [course, setCourse] = useState(null);
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

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await api.get('/courses');
      const courses = Array.isArray(response.data) ? response.data : response.data?.data || [];
      const foundCourse = courses.find(c => c.id === parseInt(id));
      
      if (!foundCourse) {
        error('Course not found');
        navigate('/admin/courses');
        return;
      }

      setCourse(foundCourse);
      setFormData({
        title: foundCourse.title || '',
        shortDescription: foundCourse.shortDescription || '',
        longDescription: foundCourse.longDescription || '',
        category: foundCourse.category || '',
        difficulty: foundCourse.difficulty || 'Beginner',
        thumbnail: foundCourse.thumbnail || '',
        isPublished: foundCourse.isPublished || false,
      });
    } catch (err) {
      console.error('Error fetching course:', err);
      error('Failed to load course');
      navigate('/admin/courses');
    } finally {
      setLoading(false);
    }
  };

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
      await api.put(`/courses/${id}`, {
        title: formData.title,
        shortDescription: formData.shortDescription,
        longDescription: formData.longDescription,
        category: formData.category,
        difficulty: formData.difficulty,
        thumbnail: formData.thumbnail,
        isPublished: formData.isPublished
      });
      
      success('Course updated successfully');
      navigate('/admin/courses');
    } catch (err) {
      console.error('Error updating course:', err);
      error('Failed to update course: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async () => {
    try {
      setSubmitting(true);
      await api.put(`/courses/${id}`, {
        title: formData.title,
        shortDescription: formData.shortDescription,
        longDescription: formData.longDescription,
        category: formData.category,
        difficulty: formData.difficulty,
        thumbnail: formData.thumbnail,
        isPublished: true
      });
      
      setFormData(prev => ({
        ...prev,
        isPublished: true
      }));
      setCourse(prev => ({
        ...prev,
        isPublished: true
      }));
      success('Course published successfully');
    } catch (err) {
      console.error('Error publishing course:', err);
      error('Failed to publish course: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="edit-course-page">Loading course...</div>;
  }

  if (!course) {
    return <div className="edit-course-page">Course not found</div>;
  }

  const isDraft = !formData.isPublished;

  return (
    <div className="edit-course-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Course</h1>
          <p className="page-subtitle">{formData.title}</p>
        </div>
        <div className="header-actions">
          {isDraft && (
            <button 
              className="btn-success"
              onClick={handlePublish}
              disabled={submitting}
              title="Publish this course to make it visible to students"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Publish Course
            </button>
          )}
          {!isDraft && (
            <span className="status-badge status-published">Published</span>
          )}
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
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminEditCourse;

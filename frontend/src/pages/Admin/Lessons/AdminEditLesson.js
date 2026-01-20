import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDashboardToast } from '../../../components/DashboardLayout/DashboardLayout';
import api from '../../../services/api';
import './AdminLessons.css';

const AdminEditLesson = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useDashboardToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lesson, setLesson] = useState(null);
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    courseId: '',
    title: '',
    content: '',
    videoUrl: '',
    order: 1,
    estimatedDuration: 0
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lessonsRes, coursesRes] = await Promise.all([
        api.get('/lessons'),
        api.get('/courses')
      ]);

      const lessonsData = Array.isArray(lessonsRes.data) ? lessonsRes.data : lessonsRes.data?.data || [];
      const foundLesson = lessonsData.find(l => l.id === parseInt(id));
      
      if (!foundLesson) {
        error('Lesson not found');
        navigate('/admin/lessons');
        return;
      }

      const coursesData = Array.isArray(coursesRes.data) ? coursesRes.data : coursesRes.data?.data || [];
      setCourses(coursesData);
      setLesson(foundLesson);
      setFormData({
        courseId: foundLesson.courseId || '',
        title: foundLesson.title || '',
        content: foundLesson.content || '',
        videoUrl: foundLesson.videoUrl || '',
        order: foundLesson.order || 1,
        estimatedDuration: foundLesson.estimatedDuration || 0
      });
    } catch (err) {
      console.error('Error fetching data:', err);
      error('Failed to load lesson');
      navigate('/admin/lessons');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseInt(value) : 0) : value
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
      newErrors.title = 'Lesson title is required';
    }
    if (!formData.content.trim()) {
      newErrors.content = 'Lesson content is required';
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
      await api.put(`/lessons/${id}`, {
        courseId: parseInt(formData.courseId),
        title: formData.title,
        content: formData.content,
        videoUrl: formData.videoUrl,
        order: formData.order,
        estimatedDuration: formData.estimatedDuration
      });
      
      success('Lesson updated successfully');
      navigate('/admin/lessons');
    } catch (err) {
      console.error('Error updating lesson:', err);
      error('Failed to update lesson: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="admin-lessons-page">Loading lesson...</div>;
  }

  if (!lesson) {
    return <div className="admin-lessons-page">Lesson not found</div>;
  }

  return (
    <div className="admin-lessons-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Lesson</h1>
          <p className="page-subtitle">{formData.title}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="lesson-form">
        <div className="form-section">
          <h2>Lesson Information</h2>
          
          <div className="form-group">
            <label htmlFor="courseId">Course *</label>
            <select
              id="courseId"
              name="courseId"
              value={formData.courseId}
              onChange={handleChange}
              className={errors.courseId ? 'input-error' : ''}
            >
              <option value="">Select a course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            {errors.courseId && <span className="error-text">{errors.courseId}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="title">Lesson Title *</label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter lesson title"
              className={errors.title ? 'input-error' : ''}
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="order">Lesson Order</label>
              <input
                id="order"
                type="number"
                name="order"
                value={formData.order}
                onChange={handleChange}
                min="1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="estimatedDuration">Duration (minutes)</label>
              <input
                id="estimatedDuration"
                type="number"
                name="estimatedDuration"
                value={formData.estimatedDuration}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="content">Content *</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Enter lesson content"
              rows="6"
              className={errors.content ? 'input-error' : ''}
            />
            {errors.content && <span className="error-text">{errors.content}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="videoUrl">Video URL</label>
            <input
              id="videoUrl"
              type="url"
              name="videoUrl"
              value={formData.videoUrl}
              onChange={handleChange}
              placeholder="https://example.com/video.mp4"
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/admin/lessons')}
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

export default AdminEditLesson;

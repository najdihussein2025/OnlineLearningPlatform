import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardToast } from '../../../components/DashboardLayout/DashboardLayout';
import api from '../../../services/api';
import './AdminLessons.css';

const AdminNewLesson = () => {
  const navigate = useNavigate();
  const { success, error } = useDashboardToast();
  const [submitting, setSubmitting] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [formData, setFormData] = useState({
    courseId: '',
    title: '',
    content: '',
    videoUrl: '',
    pdfUrl: '',
    externalUrl: '',
    order: 1,
    estimatedDuration: 0
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses');
      const coursesData = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setCourses(coursesData);
      
      // IMPORTANT: auto select first course
      if (coursesData.length > 0) {
        setFormData(prev => ({
          ...prev,
          courseId: coursesData[0].id.toString()
        }));
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      error('Failed to load courses');
    } finally {
      setLoadingCourses(false);
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
    
    if (!formData.courseId) {
      newErrors.courseId = 'Course is required';
    }
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
    
    // Before submit validation
    if (!formData.courseId) {
      error('Course is not selected');
      return;
    }
    
    if (!validateForm()) {
      error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      
      const selectedCourseId = parseInt(formData.courseId);
      const title = formData.title?.trim();
      const lessonOrder = formData.order || 1;
      const duration = formData.estimatedDuration || 0;
      const content = formData.content?.trim();
      const videoUrl = formData.videoUrl?.trim() || null;
      const pdfUrl = formData.pdfUrl?.trim() || null;
      const externalUrl = formData.externalUrl?.trim() || null;
      
      const payload = {
        courseId: selectedCourseId,
        title: title,
        order: lessonOrder,
        durationMinutes: duration,
        content: content,
        videoUrl: videoUrl,
        pdfUrl: pdfUrl,
        externalUrl: externalUrl
      };
      
      console.log("CreateLesson Payload:", {
        courseId: payload.courseId,
        title: payload.title,
        order: payload.order,
        durationMinutes: payload.durationMinutes,
        content: payload.content,
        videoUrl: payload.videoUrl
      });
      
      await api.post('/lessons', payload);
      
      success('Lesson created successfully');
      navigate('/admin/lessons');
    } catch (err) {
      // Log error to backend file instead of console
      const errorData = {
        error: err.message,
        responseStatus: err.response?.status,
        responseData: err.response?.data,
        stack: err.stack,
        formData: formData
      };
      
      // Send error to backend for logging (don't await - fire and forget)
      api.post('/logs/frontend-error', {
        source: 'AdminNewLesson - CreateLesson',
        message: `Failed to create lesson: ${err.response?.data?.message || err.response?.data?.errors || err.message}`,
        errorData: errorData
      }).catch(() => {
        // Silently fail if logging fails
      });
      
      const errorMessage = err.response?.data?.message || err.response?.data?.errors || err.message;
      error('Failed to create lesson: ' + errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-lessons-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Create New Lesson</h1>
          <p className="page-subtitle">Add a new lesson to a course</p>
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
              disabled={loadingCourses}
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

          <div className="form-group">
            <label htmlFor="pdfUrl">PDF URL</label>
            <input
              id="pdfUrl"
              type="url"
              name="pdfUrl"
              value={formData.pdfUrl}
              onChange={handleChange}
              placeholder="https://example.com/document.pdf"
            />
          </div>

          <div className="form-group">
            <label htmlFor="externalUrl">External URL</label>
            <input
              id="externalUrl"
              type="url"
              name="externalUrl"
              value={formData.externalUrl}
              onChange={handleChange}
              placeholder="https://example.com"
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
            {submitting ? 'Creating...' : 'Create Lesson'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminNewLesson;

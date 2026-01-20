import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardToast } from '../../../components/DashboardLayout/DashboardLayout';
import api from '../../../services/api';
import './AdminQuizzes.css';

const AdminNewQuiz = () => {
  const navigate = useNavigate();
  const { success, error } = useDashboardToast();
  const [submitting, setSubmitting] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [formData, setFormData] = useState({
    courseId: '',
    lessonId: '',
    title: '',
    passingScore: 70,
    timeLimit: 30
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
      newErrors.title = 'Quiz title is required';
    }
    if (formData.passingScore < 0 || formData.passingScore > 100) {
      newErrors.passingScore = 'Passing score must be between 0 and 100';
    }
    if (formData.timeLimit < 1) {
      newErrors.timeLimit = 'Time limit must be at least 1 minute';
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
      await api.post('/quizzes', {
        courseId: parseInt(formData.courseId),
        lessonId: formData.lessonId ? parseInt(formData.lessonId) : null,
        title: formData.title,
        passingScore: formData.passingScore,
        timeLimit: formData.timeLimit
      });
      
      success('Quiz created successfully');
      navigate('/admin/quizzes');
    } catch (err) {
      console.error('Error creating quiz:', err);
      error('Failed to create quiz: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-quizzes-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Create New Quiz</h1>
          <p className="page-subtitle">Add a new quiz to a course</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="quiz-form">
        <div className="form-section">
          <h2>Quiz Information</h2>
          
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
            <label htmlFor="title">Quiz Title *</label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter quiz title"
              className={errors.title ? 'input-error' : ''}
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="passingScore">Passing Score (%) *</label>
              <input
                id="passingScore"
                type="number"
                name="passingScore"
                value={formData.passingScore}
                onChange={handleChange}
                min="0"
                max="100"
                className={errors.passingScore ? 'input-error' : ''}
              />
              {errors.passingScore && <span className="error-text">{errors.passingScore}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="timeLimit">Time Limit (minutes) *</label>
              <input
                id="timeLimit"
                type="number"
                name="timeLimit"
                value={formData.timeLimit}
                onChange={handleChange}
                min="1"
                className={errors.timeLimit ? 'input-error' : ''}
              />
              {errors.timeLimit && <span className="error-text">{errors.timeLimit}</span>}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/admin/quizzes')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create Quiz'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminNewQuiz;

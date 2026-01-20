import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../components/admin/DataTable/DataTable';
import { useDashboardToast } from '../../../components/DashboardLayout/DashboardLayout';
import ConfirmationDialog from '../../../components/ConfirmationDialog/ConfirmationDialog';
import api from '../../../services/api';
import './AdminLessons.css';

const AdminLessons = () => {
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, lessonId: null });
  const [lessons, setLessons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { success, error } = useDashboardToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lessonsRes, coursesRes] = await Promise.all([
        api.get('/lessons'),
        api.get('/courses')
      ]);

      const lessonsData = Array.isArray(lessonsRes.data) ? lessonsRes.data : lessonsRes.data?.data || [];
      const coursesData = Array.isArray(coursesRes.data) ? coursesRes.data : coursesRes.data?.data || [];
      
      setLessons(lessonsData);
      setCourses(coursesData);
    } catch (err) {
      console.error('Error fetching data:', err);
      error('Failed to load lessons');
    } finally {
      setLoading(false);
    }
  };

  const getCourseTitle = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course?.title || 'Unknown Course';
  };

  const columns = [
    {
      key: 'order',
      header: '#',
      align: 'center',
      render: (value) => <span className="lesson-order">{value}</span>,
    },
    {
      key: 'title',
      header: 'Lesson Title',
    },
    {
      key: 'courseId',
      header: 'Course',
      render: (value) => getCourseTitle(value),
    },
    {
      key: 'type',
      header: 'Type',
      render: (value) => (
        <span className={`lesson-type lesson-type-${value}`}>
          {value === 'video' ? '📹 Video' : value === 'article' ? '📄 Article' : '📎 Attachment'}
        </span>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      align: 'right',
    },
  ];

  const handleEdit = (lessonId) => {
    navigate(`/admin/lessons/${lessonId}`);
  };

  const handleDelete = (lessonId) => {
    setConfirmDialog({ 
      isOpen: true, 
      action: 'delete', 
      lessonId,
      message: 'Are you sure you want to delete this lesson? This action cannot be undone.'
    });
  };

  const handleCreate = () => {
    navigate('/admin/lessons/new');
  };

  const confirmAction = async () => {
    if (confirmDialog.action === 'delete') {
      try {
        await api.delete(`/lessons/${confirmDialog.lessonId}`);
        success('Lesson deleted successfully');
        await fetchData();
      } catch (err) {
        error('Failed to delete lesson');
        console.error('Delete error:', err);
      }
    }
    setConfirmDialog({ isOpen: false, action: null, lessonId: null });
  };

  const actions = (row) => (
    <>
      <button 
        className="btn-action btn-edit"
        onClick={(e) => {
          e.stopPropagation();
          handleEdit(row.id);
        }}
      >
        Edit
      </button>
      <button 
        className="btn-action btn-delete"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(row.id);
        }}
      >
        Delete
      </button>
    </>
  );

  return (
    <>
      <div className="admin-lessons-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Lesson Management</h1>
            <p className="page-subtitle">Manage lessons across all courses</p>
          </div>
          <button className="btn-primary" onClick={handleCreate}>Add New Lesson</button>
        </div>

        <div className="filters-section">
          <div className="filter-group">
            <label htmlFor="course-filter">Filter by Course</label>
            <select
              id="course-filter"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-results">
            Showing {selectedCourse === 'all' ? lessons.length : lessons.filter(l => l.courseId === parseInt(selectedCourse)).length} lessons
          </div>
        </div>

        {loading ? (
          <div className="loading-message">Loading lessons...</div>
        ) : (
          <DataTable
            columns={columns}
            data={selectedCourse === 'all' ? lessons : lessons.filter(l => l.courseId === parseInt(selectedCourse))}
            actions={actions}
            emptyMessage="No lessons found"
          />
        )}
      </div>
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, action: null, lessonId: null })}
        onConfirm={confirmAction}
        title="Confirm Delete"
        message={confirmDialog.message || 'Are you sure you want to delete this lesson?'}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
};

export default AdminLessons;


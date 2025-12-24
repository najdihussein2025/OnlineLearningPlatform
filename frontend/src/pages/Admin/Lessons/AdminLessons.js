import React, { useState } from 'react';
import DataTable from '../../../components/admin/DataTable/DataTable';
import { useDashboardToast } from '../../../components/DashboardLayout/DashboardLayout';
import ConfirmationDialog from '../../../components/ConfirmationDialog/ConfirmationDialog';
import './AdminLessons.css';

const AdminLessons = () => {
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, lessonId: null });
  const { success, error, info } = useDashboardToast();

  // Mock lessons data
  const lessons = [
    { id: 1, title: 'Introduction to HTML', course: 'Web Development Bootcamp', type: 'video', order: 1, duration: '15 min' },
    { id: 2, title: 'CSS Fundamentals', course: 'Web Development Bootcamp', type: 'video', order: 2, duration: '20 min' },
    { id: 3, title: 'JavaScript Basics', course: 'Web Development Bootcamp', type: 'article', order: 3, duration: '25 min' },
    { id: 4, title: 'Python Overview', course: 'Data Science with Python', type: 'video', order: 1, duration: '18 min' },
    { id: 5, title: 'Data Structures', course: 'Data Science with Python', type: 'article', order: 2, duration: '30 min' },
  ];

  const courses = ['All Courses', 'Web Development Bootcamp', 'Data Science with Python'];

  const filteredLessons = selectedCourse === 'all' 
    ? lessons 
    : lessons.filter(lesson => lesson.course === selectedCourse);

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
      key: 'course',
      header: 'Course',
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
    info('Edit lesson feature coming soon');
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
    info('Create lesson feature coming soon');
  };

  const confirmAction = () => {
    if (confirmDialog.action === 'delete') {
      success(`Lesson ${confirmDialog.lessonId} deleted successfully`);
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
              {courses.map((course, index) => (
                <option key={index} value={index === 0 ? 'all' : course}>
                  {course}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-results">
            Showing {filteredLessons.length} lessons
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredLessons}
          actions={actions}
          emptyMessage="No lessons found"
        />
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


import React, { useState, useMemo } from 'react';
import DataTable from '../../../components/admin/DataTable/DataTable';
import { useDashboardToast } from '../../../components/DashboardLayout/DashboardLayout';
import ConfirmationDialog from '../../../components/ConfirmationDialog/ConfirmationDialog';
import './AdminCourses.css';

const AdminCourses = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, courseId: null });
  const { success, error, info } = useDashboardToast();

  // Mock courses data
  const courses = [
    { id: 1, title: 'Complete Web Development Bootcamp', category: 'Web Development', difficulty: 'Beginner', instructor: 'Sarah Johnson', enrollments: 120, status: 'published' },
    { id: 2, title: 'Advanced Data Science with Python', category: 'Data Science', difficulty: 'Advanced', instructor: 'Dr. Michael Chen', enrollments: 85, status: 'published' },
    { id: 3, title: 'UI/UX Design Fundamentals', category: 'Design', difficulty: 'Beginner', instructor: 'Emily Rodriguez', enrollments: 40, status: 'draft' },
    { id: 4, title: 'Business Strategy & Leadership', category: 'Business', difficulty: 'Intermediate', instructor: 'James Anderson', enrollments: 65, status: 'published' },
    { id: 5, title: 'Full-Stack JavaScript Development', category: 'Programming', difficulty: 'Intermediate', instructor: 'Alex Thompson', enrollments: 95, status: 'published' },
  ];

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesSearch = !searchQuery || 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  const handlePublish = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    const action = course?.status === 'published' ? 'unpublished' : 'published';
    success(`Course ${action} successfully`);
  };

  const handleEdit = (courseId) => {
    info('Edit course feature coming soon');
  };

  const handleCreate = () => {
    info('Create course feature coming soon');
  };

  const handleDelete = (courseId) => {
    setConfirmDialog({ 
      isOpen: true, 
      action: 'delete', 
      courseId,
      message: 'Are you sure you want to delete this course? This action cannot be undone.'
    });
  };

  const confirmAction = () => {
    if (confirmDialog.action === 'delete') {
      success(`Course ${confirmDialog.courseId} deleted successfully`);
    }
    setConfirmDialog({ isOpen: false, action: null, courseId: null });
  };

  const columns = [
    {
      key: 'title',
      header: 'Course',
      render: (value, row) => (
        <div className="course-cell">
          <div className="course-thumbnail-small">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div className="course-title-cell">{value}</div>
            <div className="course-meta-cell">{row.category} • {row.difficulty}</div>
          </div>
        </div>
      ),
    },
    { key: 'instructor', header: 'Instructor' },
    {
      key: 'enrollments',
      header: 'Enrollments',
      align: 'center',
      render: (value) => <strong>{value}</strong>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <span className={`status-badge status-${value}`}>{value}</span>
      ),
    },
  ];

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
        className="btn-action btn-publish"
        onClick={(e) => {
          e.stopPropagation();
          handlePublish(row.id);
        }}
      >
        {row.status === 'published' ? 'Unpublish' : 'Publish'}
      </button>
    </>
  );

  return (
    <>
      <div className="admin-courses-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Course Management</h1>
            <p className="page-subtitle">Manage all platform courses</p>
          </div>
          <button className="btn-primary" onClick={handleCreate}>Create New Course</button>
        </div>

        <div className="filters-section">
          <div className="filter-group">
            <label htmlFor="status-filter">Filter by Status</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="filter-results">
            Showing {filteredCourses.length} of {courses.length} courses
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredCourses}
          actions={actions}
          emptyMessage="No courses found"
        />
      </div>
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, action: null, courseId: null })}
        onConfirm={confirmAction}
        title="Confirm Delete"
        message={confirmDialog.message || 'Are you sure you want to delete this course?'}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
};

export default AdminCourses;


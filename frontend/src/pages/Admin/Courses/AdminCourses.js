import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DataTable from '../../../components/admin/DataTable/DataTable';
import { useDashboardToast } from '../../../components/DashboardLayout/DashboardLayout';
import ConfirmationDialog from '../../../components/ConfirmationDialog/ConfirmationDialog';
import api from '../../../services/api';
import './AdminCourses.css';

const AdminCourses = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prevPathnameRef = useRef(location.pathname);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, courseId: null });
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { success, error } = useDashboardToast();

  // Fetch courses when statusFilter changes
  useEffect(() => {
    fetchCourses();
  }, [statusFilter]);

  // Refetch when navigating back from create/edit pages
  useEffect(() => {
    const prevPathname = prevPathnameRef.current;
    const currentPathname = location.pathname;
    
    // Only refetch if we navigated TO /admin/courses FROM a different page
    if (currentPathname === '/admin/courses' && prevPathname !== '/admin/courses') {
      fetchCourses();
    }
    
    prevPathnameRef.current = currentPathname;
  }, [location.pathname]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      let url = '/courses';
      
      if (statusFilter !== 'All') {
        url += `?status=${statusFilter}`;
      }
      
      const response = await api.get(url);
      console.log('Courses API Response:', response.data);
      
      const coursesData = Array.isArray(response.data) ? response.data : response.data?.data || [];
      
      // Format courses data
      const formattedCourses = coursesData.map(course => ({
        id: course.id,
        title: course.title || 'Untitled Course',
        category: course.category || 'General',
        difficulty: course.difficulty || 'Beginner',
        instructor: course.creator?.fullName || course.creatorName || 'Unknown',
        enrollments: course.enrollmentCount || 0,
        status: course.isPublished ? 'published' : 'draft'
      }));
      
      console.log('Formatted Courses:', formattedCourses);
      setCourses(formattedCourses);
    } catch (err) {
      console.error('Error fetching courses:', err);
      error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  // Client-side search filtering only (status filtering is done on backend)
  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesSearch = !searchQuery || 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [searchQuery, courses]);

  const handlePublish = async (courseId) => {
    try {
      const course = courses.find(c => c.id === courseId);
      const newPublishStatus = course?.status === 'published' ? false : true;
      
      console.log('Publishing course:', courseId, 'to:', newPublishStatus);
      const fullCourses = await api.get('/courses');
      const fullCourse = (Array.isArray(fullCourses.data) ? fullCourses.data : fullCourses.data?.data || []).find(c => c.id === courseId);
      
      await api.put(`/courses/${courseId}`, { 
        title: fullCourse.title,
        shortDescription: fullCourse.shortDescription,
        longDescription: fullCourse.longDescription,
        category: fullCourse.category,
        difficulty: fullCourse.difficulty,
        thumbnail: fullCourse.thumbnail,
        isPublished: newPublishStatus 
      });
      
      success(`Course ${newPublishStatus ? 'published' : 'unpublished'} successfully`);
      fetchCourses(); // Refetch courses to update the table
    } catch (err) {
      console.error('Error publishing course:', err);
      error('Failed to update course: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (courseId) => {
    navigate(`/admin/courses/${courseId}`);
  };

  const handleCreate = () => {
    navigate('/admin/courses/new');
  };

  const handleDelete = (courseId) => {
    setConfirmDialog({ 
      isOpen: true, 
      action: 'delete', 
      courseId,
      message: 'Are you sure you want to delete this course? This action cannot be undone.'
    });
  };

  const confirmAction = async () => {
    if (confirmDialog.action === 'delete') {
      try {
        console.log('Deleting course:', confirmDialog.courseId);
        await api.delete(`/courses/${confirmDialog.courseId}`);
        success('Course deleted successfully');
        fetchCourses(); // Refetch courses to update the table
      } catch (err) {
        console.error('Error deleting course:', err);
        error('Failed to delete course: ' + (err.response?.data?.message || err.message));
      }
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
              <option value="All">All Status</option>
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



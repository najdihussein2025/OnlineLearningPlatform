import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DataTable from '../../../components/admin/DataTable/DataTable';
import api from '../../../services/api';
import './InstructorCourses.css';

const InstructorCourses = () => {
  const [filter, setFilter] = useState('all');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.get('/courses/mine');
        if (!mounted) return;
        setCourses(res.data || []);
      } catch (err) {
        console.error('Failed to load instructor courses', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return <div className="instructor-courses-page">Loading courses...</div>;
  }

  const getCourseStatus = (course) => {
    const isPublished = course.isPublished ?? course.IsPublished ?? false;
    return isPublished ? 'published' : 'draft';
  };

  const filteredCourses = courses.filter(course => {
    if (filter === 'all') return true;
    return getCourseStatus(course) === filter;
  });

  const getStatusBadge = (course) => {
    const status = getCourseStatus(course);
    switch (status) {
      case 'published':
        return <span className="status-badge status-published">Published</span>;
      case 'draft':
        return <span className="status-badge status-draft">Draft</span>;
      case 'pending':
        return <span className="status-badge status-pending">Pending Approval</span>;
      default:
        return null;
    }
  };

  const columns = [
    {
      header: 'Course Title',
      accessor: 'title',
      render: (course) => (
        <div className="course-title-cell">
          <h4 className="course-title">{course.title}</h4>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (course) => getStatusBadge(course),
    },
    {
      header: 'Enrollments',
      accessor: 'enrollments',
      render: (course) => course.enrollments ?? '-',
    },
    {
      header: 'Rating',
      accessor: 'rating',
      render: (course) => course.rating ? <span className="rating">⭐ {course.rating}</span> : <span className="no-rating">-</span>,
    },
    {
      header: 'Revenue',
      accessor: 'revenue',
      render: (course) => course.revenue ?? '-',
    },
    {
      header: 'Last Updated',
      accessor: 'createdAt',
      render: (course) => {
        const ts = course.createdAt || course.CreatedAt || course.created || null;
        return ts ? new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
      }
    }
  ];

  const actions = (course) => (
    <div className="table-actions">
      <Link to={`/instructor/courses/${course.id}`} className="btn-icon" title="Edit Course">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>
      <Link to={`/instructor/lessons?course=${course.id}`} className="btn-icon" title="Manage Lessons">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 19.5C4 18.6716 4.67157 18 5.5 18H18.5C19.3284 18 20 18.6716 20 19.5V20.5C20 21.3284 19.3284 22 18.5 22H5.5C4.67157 22 4 21.3284 4 20.5V19.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 2H20V14H4V2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>
      <Link to={`/instructor/students?course=${course.id}`} className="btn-icon" title="View Students">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>
    </div>
  );

  return (
    <div className="instructor-courses-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Courses</h1>
          <p className="page-subtitle">Create and manage your courses</p>
        </div>
        <Link to="/instructor/courses/new" className="btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Create New Course
        </Link>
      </div>

      <div className="filters-section">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Courses ({courses.length})
          </button>
          <button
            className={`filter-tab ${filter === 'published' ? 'active' : ''}`}
            onClick={() => setFilter('published')}
          >
            Published ({courses.filter(c => getCourseStatus(c) === 'published').length})
          </button>
          <button
            className={`filter-tab ${filter === 'draft' ? 'active' : ''}`}
            onClick={() => setFilter('draft')}
          >
            Draft ({courses.filter(c => getCourseStatus(c) === 'draft').length})
          </button>
          <button
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({courses.filter(c => c.status === 'pending').length})
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredCourses}
        actions={actions}
        emptyMessage="No courses found. Create your first course to get started!"
      />
    </div>
  );
};

export default InstructorCourses;


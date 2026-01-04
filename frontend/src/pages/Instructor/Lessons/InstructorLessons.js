import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import DataTable from '../../../components/admin/DataTable/DataTable';
import { useDashboardToast } from '../../../components/DashboardLayout/DashboardLayout';
import api from '../../../services/api';
import './InstructorLessons.css';

const InstructorLessons = () => {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('course');
  const { info } = useDashboardToast();

  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadCourses = async () => {
      try {
        const res = await api.get('/courses/mine');
        if (!mounted) return;
        setCourses(res.data || []);
      } catch (err) {
        console.error('Failed to load courses', err);
      } finally {
        if (mounted) setLoadingCourses(false);
      }
    };
    loadCourses();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const selectedCourseId = courseId ? parseInt(courseId) : courses[0]?.id;
    if (!selectedCourseId) return;
    let mounted = true;
    const loadLessons = async () => {
      setLoadingLessons(true);
      try {
        const res = await api.get(`/lessons/byCourse/${selectedCourseId}`);
        if (!mounted) return;
        setLessons(res.data || []);
      } catch (err) {
        console.error('Failed to load lessons', err);
      } finally {
        if (mounted) setLoadingLessons(false);
      }
    };
    loadLessons();
    return () => { mounted = false; };
  }, [courseId, courses]);

  const selectedCourseIdNum = courseId ? parseInt(courseId) : courses[0]?.id || null;
  const selectedCourse = courses.find(c => c.id === selectedCourseIdNum) || null;

  const getLessonTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
          </svg>
        );
      case 'article':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 19.5C4 18.6716 4.67157 18 5.5 18H18.5C19.3284 18 20 18.6716 20 19.5V20.5C20 21.3284 19.3284 22 18.5 22H5.5C4.67157 22 4 21.3284 4 20.5V19.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 2H20V14H4V2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'attachment':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 7H17M7 11H17M7 15H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const columns = [
    {
      header: 'Order',
      accessor: 'order',
      render: (value) => (
        <span className="lesson-order">{value}</span>
      ),
    },
    {
      header: 'Lesson Title',
      accessor: 'title',
      render: (value, row) => (
        <div className="lesson-title-cell">
          <span className="lesson-type-icon">{getLessonTypeIcon(row.type)}</span>
          <span className="lesson-title">{value}</span>
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: 'type',
      render: (value) => (
        <span className="lesson-type-badge">
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      header: 'Duration',
      accessor: 'duration',
    },
  ];

  const actions = (row) => (
    <div className="table-actions">
      <Link to={`/instructor/lessons/${row.id}/edit`} className="btn-icon" title="Edit Lesson">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>
      <button 
        className="btn-icon" 
        title="Delete Lesson" 
        onClick={() => {
          // UI only - would delete lesson in production
          info('Delete lesson feature coming soon');
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );

  return (
    <div className="instructor-lessons-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Lesson Management</h1>
          <p className="page-subtitle">Create and organize lessons for your courses</p>
        </div>
        <Link to={`/instructor/lessons/new?course=${selectedCourseIdNum}`} className="btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Add New Lesson
        </Link>
      </div>

      <div className="course-selector">
        <label htmlFor="course-select">Select Course:</label>
        <select
          id="course-select"
          value={selectedCourseIdNum}
          onChange={(e) => window.location.href = `/instructor/lessons?course=${e.target.value}`}
          className="course-select"
        >
          {courses.map(course => (
            <option key={course.id} value={course.id}>{course.title}</option>
          ))}
        </select>
      </div>

      <div className="lessons-info">
        <p className="lessons-count">{lessons.length} lessons in <strong>{selectedCourse?.title || '—'}</strong></p>
      </div>

      <DataTable
        columns={columns}
        data={lessons}
        actions={actions}
        emptyMessage="No lessons found. Add your first lesson to get started!"
      />

      <div className="reorder-note">
        <p>💡 Tip: Drag and drop lessons to reorder them (feature coming soon)</p>
      </div>
    </div>
  );
};

export default InstructorLessons;


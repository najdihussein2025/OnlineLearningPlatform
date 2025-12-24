import React, { useState, useMemo } from 'react';
import DataTable from '../../../components/admin/DataTable/DataTable';
import { useDashboardToast } from '../../../components/DashboardLayout/DashboardLayout';
import './AdminCertificates.css';

const AdminCertificates = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const { info } = useDashboardToast();

  // Mock certificates data
  const certificates = [
    { id: 1, student: 'John Doe', email: 'john@example.com', course: 'Web Development Bootcamp', issuedDate: '2024-01-15', status: 'issued' },
    { id: 2, student: 'Mike Johnson', email: 'mike@example.com', course: 'Data Science with Python', issuedDate: '2024-01-18', status: 'issued' },
    { id: 3, student: 'Sarah Williams', email: 'sarah@example.com', course: 'Web Development Bootcamp', issuedDate: '2024-01-20', status: 'issued' },
    { id: 4, student: 'David Brown', email: 'david@example.com', course: 'UI/UX Design Fundamentals', issuedDate: '2024-01-22', status: 'issued' },
    { id: 5, student: 'Emily Davis', email: 'emily@example.com', course: 'Data Science with Python', issuedDate: '2024-01-25', status: 'issued' },
  ];

  const courses = ['All Courses', 'Web Development Bootcamp', 'Data Science with Python', 'UI/UX Design Fundamentals'];

  const filteredCertificates = useMemo(() => {
    return certificates.filter(cert => {
      const matchesSearch = !searchQuery || 
        cert.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.course.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCourse = courseFilter === 'all' || cert.course === courseFilter;
      return matchesSearch && matchesCourse;
    });
  }, [searchQuery, courseFilter]);

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (value, row) => (
        <div className="student-cell">
          <div className="student-avatar-small">
            {value[0]}
          </div>
          <div>
            <div className="student-name">{value}</div>
            <div className="student-email">{row.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'course', header: 'Course' },
    { key: 'issuedDate', header: 'Issued Date' },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <span className={`status-badge status-${value}`}>{value}</span>
      ),
    },
  ];

  const actions = (row) => (
    <button
      className="btn-action btn-download"
      onClick={(e) => {
        e.stopPropagation();
        info('Download feature coming soon');
      }}
    >
      Download
    </button>
  );

  return (
    <div className="admin-certificates-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Certificates</h1>
            <p className="page-subtitle">View and manage issued certificates</p>
          </div>
        </div>

        <div className="filters-section">
          <div className="filter-group">
            <label htmlFor="course-filter">Filter by Course</label>
            <select
              id="course-filter"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
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
            Showing {filteredCertificates.length} of {certificates.length} certificates
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredCertificates}
          actions={actions}
          emptyMessage="No certificates found"
        />
      </div>
  );
};

export default AdminCertificates;


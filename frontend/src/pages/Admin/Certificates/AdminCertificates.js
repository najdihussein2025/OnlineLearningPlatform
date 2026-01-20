import React, { useState, useMemo, useEffect } from 'react';
import DataTable from '../../../components/admin/DataTable/DataTable';
import { useDashboardToast } from '../../../components/DashboardLayout/DashboardLayout';
import './AdminCertificates.css';

const AdminCertificates = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [certificates, setCertificates] = useState([]);
  const [completedEnrollments, setCompletedEnrollments] = useState([]);
  const [courses, setCourses] = useState(['All Courses']);
  const [loading, setLoading] = useState(true);
  const [issuingCertificates, setIssuingCertificates] = useState({});
  const { info, success, error } = useDashboardToast();

  // Fetch issued certificates and completed enrollments
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [certsRes, enrollmentsRes] = await Promise.all([
          fetch('http://localhost:5000/api/certificates'),
          fetch('http://localhost:5000/api/certificates/completed-enrollments')
        ]);

        if (certsRes.ok) {
          const certsData = await certsRes.json();
          setCertificates(certsData.map(c => ({
            id: c.id,
            student: c.studentName,
            email: c.studentName, // You might need to fetch email separately
            course: c.courseName,
            issuedDate: new Date(c.generatedAt).toLocaleDateString(),
            status: 'issued',
            verificationCode: c.verificationCode
          })));
        }

        if (enrollmentsRes.ok) {
          const enrollmentsData = await enrollmentsRes.json();
          setCompletedEnrollments(enrollmentsData);
          
          // Extract unique courses
          const uniqueCourses = ['All Courses', ...new Set(enrollmentsData.map(e => e.courseName))];
          setCourses(uniqueCourses);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        error('Failed to load certificates data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [success, error]);

  const filteredCertificates = useMemo(() => {
    return certificates.filter(cert => {
      const matchesSearch = !searchQuery || 
        cert.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.course.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCourse = courseFilter === 'all' || cert.course === courseFilter;
      return matchesSearch && matchesCourse;
    });
  }, [searchQuery, courseFilter, certificates]);

  const handleGenerateCertificate = async (enrollment) => {
    try {
      setIssuingCertificates(prev => ({ ...prev, [enrollment.id]: true }));
      const response = await fetch('http://localhost:5000/api/certificates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: enrollment.userId,
          courseId: enrollment.courseId
        })
      });

      if (response.ok) {
        const result = await response.json();
        success(`Certificate issued for ${enrollment.studentName} in ${enrollment.courseName}`);
        // Refresh certificates list
        const certsRes = await fetch('http://localhost:5000/api/certificates');
        if (certsRes.ok) {
          const certsData = await certsRes.json();
          setCertificates(certsData.map(c => ({
            id: c.id,
            student: c.studentName,
            email: c.studentName,
            course: c.courseName,
            issuedDate: new Date(c.generatedAt).toLocaleDateString(),
            status: 'issued',
            verificationCode: c.verificationCode
          })));
        }
      } else {
        const errorData = await response.json();
        error(errorData.title || 'Failed to generate certificate');
      }
    } catch (err) {
      console.error('Error generating certificate:', err);
      error('Failed to generate certificate');
    } finally {
      setIssuingCertificates(prev => ({ ...prev, [enrollment.id]: false }));
    }
  };

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
        info('Certificate verification code: ' + row.verificationCode);
      }}
    >
      View Details
    </button>
  );

  return (
    <div className="admin-certificates-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Certificates</h1>
            <p className="page-subtitle">View and manage issued certificates. Certificates are only issued to students who have completed their courses.</p>
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

        {filteredCertificates.length > 0 && (
          <div>
            <h2 className="section-title">Issued Certificates</h2>
            <DataTable
              columns={columns}
              data={filteredCertificates}
              actions={actions}
              emptyMessage="No certificates found"
            />
          </div>
        )}

        {completedEnrollments.length > 0 && (
          <div className="pending-certificates-section" style={{ marginTop: '40px' }}>
            <h2 className="section-title">Pending - Students Ready for Certification</h2>
            <p className="section-subtitle">These students have completed their courses. Issue certificates to acknowledge their achievement.</p>
            <div className="pending-certificates-grid">
              {completedEnrollments
                .filter(enrollment => {
                  const hasCertificate = certificates.some(
                    c => c.student === enrollment.studentName && c.course === enrollment.courseName
                  );
                  return !hasCertificate;
                })
                .map(enrollment => (
                  <div key={`${enrollment.userId}-${enrollment.courseId}`} className="pending-cert-card">
                    <div className="card-header">
                      <h3 className="student-name">{enrollment.studentName}</h3>
                    </div>
                    <div className="card-content">
                      <div className="info-row">
                        <span className="label">Course:</span>
                        <span className="value">{enrollment.courseName}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Completed:</span>
                        <span className="value">{new Date(enrollment.completedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button
                        className="btn-issue"
                        onClick={() => handleGenerateCertificate(enrollment)}
                        disabled={issuingCertificates[enrollment.id]}
                      >
                        {issuingCertificates[enrollment.id] ? 'Issuing...' : 'Issue Certificate'}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {loading && <p className="loading-text">Loading certificates...</p>}
      </div>
  );
};

export default AdminCertificates;


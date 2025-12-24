import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import DataTable from '../../../components/admin/DataTable/DataTable';
import ProgressBar from '../../../components/student/ProgressBar/ProgressBar';
import './InstructorStudents.css';

const InstructorStudents = () => {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('course');

  // Mock data - would come from API
  const courses = [
    { id: 1, title: 'Complete Web Development Bootcamp' },
    { id: 2, title: 'Advanced Data Science with Python' },
    { id: 3, title: 'UI/UX Design Fundamentals' },
  ];

  const selectedCourseId = courseId ? parseInt(courseId) : null;

  const students = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      course: 'Complete Web Development Bootcamp',
      courseId: 1,
      enrolled: '2024-01-15',
      progress: 65,
      quizScore: 85,
      lastActivity: '2 hours ago',
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      course: 'Complete Web Development Bootcamp',
      courseId: 1,
      enrolled: '2024-01-18',
      progress: 45,
      quizScore: 78,
      lastActivity: '1 day ago',
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike@example.com',
      course: 'Advanced Data Science with Python',
      courseId: 2,
      enrolled: '2024-01-20',
      progress: 30,
      quizScore: 88,
      lastActivity: '3 days ago',
    },
    {
      id: 4,
      name: 'Sarah Williams',
      email: 'sarah@example.com',
      course: 'Complete Web Development Bootcamp',
      courseId: 1,
      enrolled: '2024-01-10',
      progress: 100,
      quizScore: 92,
      lastActivity: '1 week ago',
    },
  ].filter(s => !selectedCourseId || s.courseId === selectedCourseId);

  const columns = [
    {
      header: 'Student',
      accessor: 'name',
      render: (student) => (
        <div className="student-cell">
          <div className="student-avatar">
            {student.name.charAt(0)}
          </div>
          <div className="student-info">
            <h4 className="student-name">{student.name}</h4>
            <p className="student-email">{student.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Course',
      accessor: 'course',
    },
    {
      header: 'Enrolled',
      accessor: 'enrolled',
      render: (student) => new Date(student.enrolled).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }),
    },
    {
      header: 'Progress',
      accessor: 'progress',
      render: (student) => (
        <div className="progress-cell">
          <ProgressBar progress={student.progress} size="small" />
        </div>
      ),
    },
    {
      header: 'Quiz Score',
      accessor: 'quizScore',
      render: (student) => (
        <span className={`quiz-score ${student.quizScore >= 70 ? 'score-passed' : 'score-failed'}`}>
          {student.quizScore}%
        </span>
      ),
    },
    {
      header: 'Last Activity',
      accessor: 'lastActivity',
    },
  ];

  const actions = (student) => (
    <div className="table-actions">
      <Link to={`/instructor/students/${student.id}`} className="btn-icon" title="View Details">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>
    </div>
  );

  return (
    <div className="instructor-students-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Students</h1>
          <p className="page-subtitle">Monitor student progress and performance</p>
        </div>
      </div>

      {selectedCourseId && (
        <div className="course-filter">
          <label htmlFor="course-select">Filter by Course:</label>
          <select
            id="course-select"
            value={selectedCourseId}
            onChange={(e) => window.location.href = `/instructor/students?course=${e.target.value}`}
            className="course-select"
          >
            <option value="">All Courses</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
        </div>
      )}

      <div className="students-stats">
        <div className="stat-item">
          <span className="stat-label">Total Students</span>
          <span className="stat-value">{students.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Average Progress</span>
          <span className="stat-value">
            {Math.round(students.reduce((sum, s) => sum + s.progress, 0) / students.length)}%
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Average Quiz Score</span>
          <span className="stat-value">
            {Math.round(students.reduce((sum, s) => sum + s.quizScore, 0) / students.length)}%
          </span>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={students}
        actions={actions}
        emptyMessage="No students found"
      />
    </div>
  );
};

export default InstructorStudents;


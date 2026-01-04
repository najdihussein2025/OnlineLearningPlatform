import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import DataTable from '../../../components/admin/DataTable/DataTable';
import ProgressBar from '../../../components/student/ProgressBar/ProgressBar';
import api from '../../../services/api';
import './InstructorStudents.css';

const InstructorStudents = () => {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('course');

  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const courseRes = await api.get('/courses/mine');
        if (!mounted) return;
        const myCourses = courseRes.data || [];
        setCourses(myCourses);

        const selectedCourseId = courseId ? parseInt(courseId) : (myCourses[0]?.id || null);
        if (!selectedCourseId) {
          setStudents([]);
          return;
        }

        // enrollments
        const enrollRes = await api.get(`/enrollments/byCourse/${selectedCourseId}`);
        const enrollments = enrollRes.data || [];

        // users (get all and map by id)
        const usersRes = await api.get('/users');
        const users = usersRes.data || [];
        const usersMap = users.reduce((m, u) => { m[u.id] = u; return m; }, {});

        // lessons for progress
        const lessonsRes = await api.get(`/lessons/byCourse/${selectedCourseId}`);
        const lessons = lessonsRes.data || [];
        const lessonIds = lessons.map(l => l.id);

        // completions and quiz attempts (all) - filter locally
        const completionsRes = await api.get('/lessoncompletions');
        const completions = completionsRes.data || [];

        const attemptsRes = await api.get('/quizattempts');
        const attempts = attemptsRes.data || [];

        const studentsData = enrollments.map(e => {
          const u = usersMap[e.userId] || { id: e.userId, fullName: 'Unknown', email: '' };

          // compute progress as completed lessons in this course
          const completedCount = completions.filter(c => c.userId === e.userId && lessonIds.includes(c.lessonId)).length;
          const progress = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

          // compute latest quiz score for user in quizzes that belong to the course
          const quizAttemptsForUser = attempts.filter(a => a.userId === e.userId);
          const latestAttempt = quizAttemptsForUser.sort((a,b) => new Date(b.attemptDate) - new Date(a.attemptDate))[0];
          const quizScore = latestAttempt ? latestAttempt.score : null;

          return {
            id: u.id,
            name: u.fullName,
            email: u.email,
            course: myCourses.find(c => c.id === selectedCourseId)?.title || '',
            courseId: selectedCourseId,
            enrolled: e.enrolledAt,
            progress,
            quizScore,
            lastActivity: latestAttempt ? new Date(latestAttempt.attemptDate).toLocaleString() : (e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString() : '-'),
          };
        });

        setStudents(studentsData);
      } catch (err) {
        console.error('Failed to load students', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [courseId]);

  const columns = [
    {
      header: 'Student',
      accessor: 'name',
      render: (student) => (
        <div className="student-cell">
          <div className="student-avatar">
            {student.name?.charAt(0) || ''}
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
        student.quizScore ? (
          <span className={`quiz-score ${student.quizScore >= 70 ? 'score-passed' : 'score-failed'}`}>
            {student.quizScore}%
          </span>
        ) : (
          <span className="no-score">-</span>
        )
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

  if (loading) return <div className="instructor-students-page">Loading students...</div>;

  return (
    <div className="instructor-students-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Students</h1>
          <p className="page-subtitle">Monitor student progress and performance</p>
        </div>
      </div>

      {courses.length > 0 && (
        <div className="course-filter">
          <label htmlFor="course-select">Filter by Course:</label>
          <select
            id="course-select"
            value={courseId || ''}
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
            {students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.progress, 0) / students.length) : 0}%
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Average Quiz Score</span>
          <span className="stat-value">
            {students.length > 0 ? Math.round(students.reduce((sum, s) => sum + (s.quizScore || 0), 0) / students.length) : 0}%
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


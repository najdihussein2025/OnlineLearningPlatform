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
  const [stats, setStats] = useState({
    total: 0,
    avgProgress: 0,
    avgQuizScore: 0
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const courseRes = await api.get('/courses/mine');
        if (!mounted) return;
        const myCourses = courseRes.data || [];
        setCourses(myCourses);

        // "All Courses" = no courseId; single course = courseId from URL
        const selectedCourseId = courseId ? parseInt(courseId, 10) : null;
        const courseIdsToLoad = selectedCourseId
          ? [selectedCourseId]
          : myCourses.map((c) => c.id);

        if (courseIdsToLoad.length === 0) {
          setStudents([]);
          setStats({ total: 0, avgProgress: 0, avgQuizScore: 0 });
          setLoading(false);
          return;
        }

        // Fetch enrollments for selected course(s)
        const enrollmentPromises = courseIdsToLoad.map((cid) =>
          api.get(`/enrollments/byCourse/${cid}`)
        );
        const enrollmentResults = await Promise.all(enrollmentPromises);
        const enrollments = enrollmentResults.flatMap((res) => res.data || []);

        if (enrollments.length === 0) {
          setStudents([]);
          setStats({ total: 0, avgProgress: 0, avgQuizScore: 0 });
          setLoading(false);
          return;
        }

        const usersRes = await api.get('/users');
        if (!mounted) return;
        const users = usersRes.data || [];
        const usersMap = {};
        users.forEach((user) => {
          usersMap[user.id] = user;
        });

        const [completionsRes, attemptsRes] = await Promise.all([
          api.get('/lessoncompletions'),
          api.get('/quizattempts'),
        ]);
        if (!mounted) return;
        const completions = completionsRes.data || [];
        const attempts = attemptsRes.data || [];

        // Lessons and quizzes per course (for progress and quiz score)
        const lessonsByCourse = {};
        const quizIdsByCourse = {};
        await Promise.all(
          courseIdsToLoad.map(async (cid) => {
            const [lessonsRes, quizzesRes] = await Promise.all([
              api.get(`/lessons/byCourse/${cid}`),
              api.get(`/quizzes/byCourse/${cid}`),
            ]);
            lessonsByCourse[cid] = lessonsRes.data || [];
            quizIdsByCourse[cid] = (quizzesRes.data || []).map((q) => q.id);
          })
        );
        if (!mounted) return;

        const studentsData = [];
        for (const enrollment of enrollments) {
          const userId = enrollment.userId;
          const courseIdForEnrollment = enrollment.courseId;
          const user = usersMap[userId];
          if (!user) continue;

          const lessons = lessonsByCourse[courseIdForEnrollment] || [];
          const lessonIds = lessons.map((l) => l.id);
          const courseQuizIds = quizIdsByCourse[courseIdForEnrollment] || [];

          let progress = 0;
          if (lessonIds.length > 0) {
            const userCompletions = completions.filter(
              (c) => c.userId === userId && lessonIds.includes(c.lessonId)
            );
            progress = Math.round((userCompletions.length / lessonIds.length) * 100);
          }
          progress = Number(progress) || 0;

          const userQuizAttempts = attempts.filter(
            (a) => a.userId === userId && courseQuizIds.includes(a.quizId)
          );
          const latestAttempt = [...userQuizAttempts].sort(
            (a, b) => new Date(b.attemptDate || b.AttemptDate) - new Date(a.attemptDate || a.AttemptDate)
          )[0];
          let quizScore = null;
          if (latestAttempt && latestAttempt.score != null) {
            const score = Number(latestAttempt.score);
            quizScore = isNaN(score) ? null : Math.round(score);
          }

          let enrolledDate = 'Not set';
          try {
            if (enrollment.enrolledAt) {
              const date = new Date(enrollment.enrolledAt);
              if (!isNaN(date.getTime())) {
                enrolledDate = date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
              }
            }
          } catch (_) {}

          let lastActivity = 'No activity';
          try {
            if (latestAttempt?.attemptDate) {
              const date = new Date(latestAttempt.attemptDate);
              if (!isNaN(date.getTime())) {
                lastActivity = date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
              }
            } else if (enrollment.enrolledAt) {
              const date = new Date(enrollment.enrolledAt);
              if (!isNaN(date.getTime())) {
                lastActivity = date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
              }
            }
          } catch (_) {}

          const studentName = user.fullName || user.name || user.username || `Student ${userId}`;
          const studentEmail = user.Email ?? user.email ?? 'No email';
          const courseTitle = myCourses.find((c) => c.id === courseIdForEnrollment)?.title ?? 'Unnamed Course';

          studentsData.push({
            id: `${user.id}-${courseIdForEnrollment}`,
            userId: user.id,
            name: studentName,
            email: studentEmail,
            course: courseTitle,
            courseId: courseIdForEnrollment,
            enrolled: enrolledDate,
            progress,
            quizScore,
            lastActivity,
          });
        }

        setStudents(studentsData);

        const total = studentsData.length;
        const validProgresses = studentsData
          .map((s) => s.progress)
          .filter((p) => !isNaN(p) && p != null);
        const avgProgress =
          validProgresses.length > 0
            ? Math.round(validProgresses.reduce((sum, p) => sum + p, 0) / validProgresses.length)
            : 0;
        const validQuizScores = studentsData
          .filter((s) => s.quizScore != null && !isNaN(s.quizScore))
          .map((s) => s.quizScore);
        const avgQuizScore =
          validQuizScores.length > 0
            ? Math.round(validQuizScores.reduce((sum, s) => sum + s, 0) / validQuizScores.length)
            : 0;

        setStats({ total, avgProgress, avgQuizScore });
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
    cell: ({ row }) => {  // Changed from render to cell
      const student = row.original;
      console.log('Rendering student cell:', student);
      
      const firstName = student.name || 'Unknown';
      const firstChar = firstName.charAt(0).toUpperCase();
      
      return (
        <div className="student-cell">
          <div className="student-avatar">
            {firstChar}
          </div>
          <div className="student-info">
            <h4 className="student-name">{firstName}</h4>
            <p className="student-email">{student.email || 'No email'}</p>
          </div>
        </div>
      );
    },
  },
  {
    header: 'Course',
    accessor: 'course',
    cell: ({ row }) => {  // Changed from render to cell
      const student = row.original;
      console.log('Rendering course cell:', student.course);
      return <span>{student.course}</span>;
    },
  },
  {
    header: 'Enrolled',
    accessor: 'enrolled',
    cell: ({ row }) => {  // Changed from render to cell
      const student = row.original;
      console.log('Rendering enrolled cell:', student.enrolled);
      return <span>{student.enrolled}</span>;
    },
  },
  {
    header: 'Progress',
    accessor: 'progress',
    cell: ({ row }) => {  // Changed from render to cell
      const student = row.original;
      const progress = student.progress !== undefined && student.progress !== null ? student.progress : 0;
      console.log('Rendering progress cell:', progress, 'for student', student.name);
      
      return (
        <div className="progress-cell">
          <div className="progress-info">
            <span className="progress-value">{progress}%</span>
            <ProgressBar progress={progress} size="small" />
          </div>
        </div>
      );
    },
  },
  {
    header: 'Quiz Score',
    accessor: 'quizScore',
    cell: ({ row }) => {  // Changed from render to cell
      const student = row.original;
      console.log('Rendering quiz score cell:', student.quizScore, 'for student', student.name);
      
      if (student.quizScore !== null && !isNaN(student.quizScore)) {
        return (
          <span className={`quiz-score ${student.quizScore >= 70 ? 'score-passed' : 'score-failed'}`}>
            {student.quizScore}%
          </span>
        );
      }
      return <span className="no-score">-</span>;
    },
  },
  {
    header: 'Last Activity',
    accessor: 'lastActivity',
    cell: ({ row }) => {  // Changed from render to cell
      const student = row.original;
      console.log('Rendering last activity cell:', student.lastActivity, 'for student', student.name);
      return <span>{student.lastActivity}</span>;
    },
  },
];

  const actions = (student) => (
    <div className="table-actions">
      <Link to={`/instructor/students/course/${student.courseId}`} className="btn-icon" title="View Course Details">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 20H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16.5 3.5C16.8978 3.10218 17.4374 2.87868 18 2.87868C18.5626 2.87868 19.1022 3.10218 19.5 3.5C19.8978 3.89782 20.1213 4.4374 20.1213 5C20.1213 5.5626 19.8978 6.10218 19.5 6.5L6.5 19.5L3 20.5L4 17L16.5 3.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
            onChange={(e) => {
              if (e.target.value) {
                window.location.href = `/instructor/students?course=${e.target.value}`;
              } else {
                window.location.href = '/instructor/students';
              }
            }}
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
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Average Progress</span>
          <span className="stat-value">
            {stats.avgProgress}%
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Average Quiz Score</span>
          <span className="stat-value">
            {stats.avgQuizScore}%
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
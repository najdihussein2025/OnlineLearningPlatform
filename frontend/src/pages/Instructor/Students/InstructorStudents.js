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
        console.log('Starting to load students data...'); // Debug log
        
        const courseRes = await api.get('/courses/mine');
        console.log('Courses data:', courseRes.data); // Debug log
        
        if (!mounted) return;
        const myCourses = courseRes.data || [];
        setCourses(myCourses);

        const selectedCourseId = courseId ? parseInt(courseId) : (myCourses[0]?.id || null);
        console.log('Selected course ID:', selectedCourseId); // Debug log
        
        if (!selectedCourseId) {
          console.log('No course selected, setting empty students');
          setStudents([]);
          setStats({ total: 0, avgProgress: 0, avgQuizScore: 0 });
          setLoading(false);
          return;
        }

        // Get enrollments for this course
        console.log('Fetching enrollments for course:', selectedCourseId);
        const enrollRes = await api.get(`/enrollments/byCourse/${selectedCourseId}`);
        console.log('Enrollments data:', enrollRes.data); // Debug log
        
        const enrollments = enrollRes.data || [];

        if (enrollments.length === 0) {
          console.log('No enrollments found');
          setStudents([]);
          setStats({ total: 0, avgProgress: 0, avgQuizScore: 0 });
          setLoading(false);
          return;
        }

        // Get all users to match with enrollments
        console.log('Fetching all users');
        const usersRes = await api.get('/users');
        console.log('Users data:', usersRes.data); // Debug log
        
        const users = usersRes.data || [];
        
        // Create a map for quick user lookup
        const usersMap = {};
        users.forEach(user => {
          usersMap[user.id] = user;
        });
        console.log('Users map created with', Object.keys(usersMap).length, 'users'); // Debug log

        // Get lessons for this course to calculate progress
        console.log('Fetching lessons for course:', selectedCourseId);
        const lessonsRes = await api.get(`/lessons/byCourse/${selectedCourseId}`);
        console.log('Lessons data:', lessonsRes.data); // Debug log
        
        const lessons = lessonsRes.data || [];
        const lessonIds = lessons.map(l => l.id);
        console.log('Lesson IDs:', lessonIds); // Debug log

        // Get all completions
        console.log('Fetching lesson completions');
        const completionsRes = await api.get('/lessoncompletions');
        console.log('Completions data:', completionsRes.data); // Debug log
        
        const completions = completionsRes.data || [];

        // Get all quiz attempts
        console.log('Fetching quiz attempts');
        const attemptsRes = await api.get('/quizattempts');
        console.log('Quiz attempts data:', attemptsRes.data); // Debug log
        
        const attempts = attemptsRes.data || [];

        // Process each enrollment to create student data
        const studentsData = [];
        
        console.log('Processing', enrollments.length, 'enrollments'); // Debug log
        
        for (const enrollment of enrollments) {
          const userId = enrollment.userId;
          console.log('Processing enrollment for user ID:', userId); // Debug log
          
          const user = usersMap[userId];
          
          if (!user) {
            console.log(`User not found for ID: ${userId}, checking user object structure...`);
            console.log('Available user IDs:', Object.keys(usersMap)); // Debug log
            continue; // Skip if user doesn't exist
          }

          console.log('Found user:', user); // Debug log

          // Calculate progress for this user in this course
          let progress = 0;
          if (lessons.length > 0) {
            const userCompletions = completions.filter(
              c => c.userId === userId && lessonIds.includes(c.lessonId)
            );
            console.log(`User ${userId} has ${userCompletions.length} completions out of ${lessons.length} lessons`); // Debug log
            
            const completedCount = userCompletions.length;
            progress = Math.round((completedCount / lessons.length) * 100);
          }
          progress = Number(progress) || 0;

          // Find quiz attempts for this user
          const userQuizAttempts = attempts.filter(a => a.userId === userId);
          console.log(`User ${userId} has ${userQuizAttempts.length} quiz attempts`); // Debug log
          
          const latestAttempt = userQuizAttempts.sort((a, b) => 
            new Date(b.attemptDate) - new Date(a.attemptDate)
          )[0];
          
          let quizScore = null;
          if (latestAttempt && latestAttempt.score !== undefined && latestAttempt.score !== null) {
            const score = Number(latestAttempt.score);
            quizScore = isNaN(score) ? null : Math.round(score);
          }

          // Format enrollment date
          let enrolledDate = 'Not set';
          try {
            if (enrollment.enrolledAt) {
              const date = new Date(enrollment.enrolledAt);
              if (!isNaN(date.getTime())) {
                enrolledDate = date.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                });
              }
            }
          } catch (err) {
            console.error('Error formatting enrollment date:', err);
          }

          // Format last activity date
          let lastActivity = 'No activity';
          try {
            if (latestAttempt && latestAttempt.attemptDate) {
              const date = new Date(latestAttempt.attemptDate);
              if (!isNaN(date.getTime())) {
                lastActivity = date.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                });
              }
            } else if (enrollment.enrolledAt) {
              const date = new Date(enrollment.enrolledAt);
              if (!isNaN(date.getTime())) {
                lastActivity = date.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                });
              }
            }
          } catch (err) {
            console.error('Error formatting last activity date:', err);
          }

          // Get student name - check different possible fields
          const studentName = user.fullName || user.name || user.username || `Student ${userId}`;
          const studentEmail = user.Email || 'No email';
          
          studentsData.push({
            id: user.id,
            name: studentName,
            email: studentEmail,
            course: myCourses.find(c => c.id === selectedCourseId)?.title || 'Unnamed Course',
            courseId: selectedCourseId,
            enrolled: enrolledDate,
            progress,
            quizScore,
            lastActivity,
          });
          
          console.log('Added student:', { 
            id: user.id, 
            name: studentName, 
            email: studentEmail,
            progress 
          }); // Debug log
        }

        console.log('Final students data:', studentsData); // Debug log
        setStudents(studentsData);
        
        // Calculate statistics
        const total = studentsData.length;
        
        const validProgresses = studentsData
          .map(s => s.progress)
          .filter(p => !isNaN(p) && p !== null && p !== undefined);
        
        const avgProgress = validProgresses.length > 0 
          ? Math.round(validProgresses.reduce((sum, p) => sum + p, 0) / validProgresses.length)
          : 0;
        
        const validQuizScores = studentsData
          .filter(s => s.quizScore !== null && !isNaN(s.quizScore))
          .map(s => s.quizScore);
        
        const avgQuizScore = validQuizScores.length > 0 
          ? Math.round(validQuizScores.reduce((sum, score) => sum + score, 0) / validQuizScores.length)
          : 0;

        setStats({
          total,
          avgProgress,
          avgQuizScore
        });
        
        console.log('Stats calculated:', { total, avgProgress, avgQuizScore }); // Debug log
        
      } catch (err) {
        console.error('Failed to load students', err);
      } finally {
        if (mounted) {
          console.log('Setting loading to false');
          setLoading(false);
        }
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
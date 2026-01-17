import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';
import ProgressBar from '../../../components/student/ProgressBar/ProgressBar';

const CourseStudents = () => {
  const { courseId } = useParams(); // courseId refers to the course ID
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseInfo, setCourseInfo] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [allAttempts, setAllAttempts] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    avgProgress: 0,
    avgQuizScore: 0,
    activeStudents: 0
  });

  useEffect(() => {
    const fetchCourseStudents = async () => {
      try {
        // Fetch course details
        const courseRes = await api.get(`/courses/${courseId}`);
        setCourseInfo(courseRes.data);

        const enrollmentsRes = await api.get(`/enrollments/byCourse/${courseId}`);
        const enrollments = enrollmentsRes.data || [];

        const usersRes = await api.get('/users');
        const users = usersRes.data || [];
        const usersMap = users.reduce((map, user) => {
          map[user.id] = user;
          return map;
        }, {});

        const lessonsRes = await api.get(`/lessons/byCourse/${courseId}`);
        const lessons = lessonsRes.data || [];
        const lessonIds = lessons.map((lesson) => lesson.id);

        const completionsRes = await api.get('/lessoncompletions');
        const completions = completionsRes.data || [];

        const attemptsRes = await api.get('/quizattempts');
        const attempts = attemptsRes.data || [];

        let courseQuizzes = [];
        try {
          const quizzesRes = await api.get(`/quizzes/byCourse/${courseId}`);
          courseQuizzes = quizzesRes.data || [];
        } catch (error) {
          console.warn('Could not fetch quizzes by course:', error);
          // Fallback: get all quizzes and filter by course
          try {
            const allQuizzesRes = await api.get('/quizzes');
            const allQuizzes = allQuizzesRes.data || [];
            courseQuizzes = allQuizzes.filter(q => q.courseId === courseId);
          } catch (err) {
            console.error('Error fetching quizzes:', err);
          }
        }
        setQuizzes(courseQuizzes);
        setAllAttempts(attempts);

        const studentsData = enrollments.map((enrollment) => {
          const user = usersMap[enrollment.userId] || { 
            id: enrollment.userId, 
            fullName: 'Unknown Student', 
            email: 'No email available' 
          };

          const completedLessons = completions.filter(
            (completion) =>
              completion.userId === enrollment.userId && lessonIds.includes(completion.lessonId)
          ).length;
          const progress = lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0;

          const userQuizAttempts = attempts.filter((attempt) => attempt.userId === enrollment.userId);
          const latestAttempt = userQuizAttempts.sort((a, b) => new Date(b.attemptDate) - new Date(a.attemptDate))[0];
          const quizScore = latestAttempt ? Math.round(latestAttempt.score) : null;

          // Safe date formatting
          let lastActivity = '-';
          try {
            if (latestAttempt) {
              lastActivity = new Date(latestAttempt.attemptDate).toLocaleDateString();
            } else if (enrollment.enrolledAt) {
              lastActivity = new Date(enrollment.enrolledAt).toLocaleDateString();
            }
          } catch (error) {
            console.error('Error formatting date:', error);
          }

          return {
            id: user.id,
            name: user.fullName,
            email: user.email,
            progress,
            quizScore,
            lastActivity,
            enrolledDate: enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : '-',
            isActive: progress > 0
          };
        });

        setStudents(studentsData);
        
        // Calculate statistics
        const total = studentsData.length;
        const avgProgress = total > 0 ? Math.round(studentsData.reduce((sum, s) => sum + s.progress, 0) / total) : 0;
        const quizScores = studentsData.filter(s => s.quizScore !== null && !isNaN(s.quizScore)).map(s => s.quizScore);
        const avgQuizScore = quizScores.length > 0 ? 
          Math.round(quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length) : 0;
        const activeStudents = studentsData.filter(s => s.isActive).length;
        
        setStats({
          total,
          avgProgress,
          avgQuizScore,
          activeStudents
        });
      } catch (error) {
        console.error('Failed to fetch students for the course', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseStudents();
  }, [courseId]);

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    const studentAttempts = allAttempts.filter(attempt => attempt.userId === student.id);
    setQuizAttempts(studentAttempts);
  };

  const styles = {
    container: {
      padding: '24px',
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
    },
    header: {
      marginBottom: '32px',
    },
    pageTitle: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: '8px',
    },
    pageSubtitle: {
      fontSize: '14px',
      color: '#64748b',
      marginBottom: '16px',
    },
    courseCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e2e8f0',
      marginBottom: '24px',
    },
    courseTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '8px',
    },
    courseDescription: {
      fontSize: '14px',
      color: '#64748b',
      lineHeight: '1.5',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '32px',
    },
    statCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      transition: 'transform 0.2s, box-shadow 0.2s',
    },
    statContent: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },
    statLabel: {
      fontSize: '14px',
      color: '#64748b',
      fontWeight: '500',
    },
    statValue: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1e293b',
    },
    tableContainer: {
      backgroundColor: 'white',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    },
    tableHeader: {
      padding: '20px',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    tableTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1e293b',
      margin: '0',
    },
    tableCount: {
      fontSize: '14px',
      color: '#64748b',
      backgroundColor: '#f1f5f9',
      padding: '4px 12px',
      borderRadius: '20px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    tableHead: {
      backgroundColor: '#f8fafc',
      borderBottom: '2px solid #e2e8f0',
    },
    th: {
      padding: '16px',
      textAlign: 'left',
      fontSize: '12px',
      fontWeight: '600',
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    tbody: {
      '& tr': {
        borderBottom: '1px solid #e2e8f0',
        transition: 'background-color 0.2s',
      },
      '& tr:hover': {
        backgroundColor: '#f8fafc',
      },
    },
    td: {
      padding: '16px',
      fontSize: '14px',
      color: '#475569',
      verticalAlign: 'middle',
    },
    studentCell: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    studentAvatar: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '600',
      fontSize: '14px',
    },
    studentInfo: {
      display: 'flex',
      flexDirection: 'column',
    },
    studentName: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#1e293b',
      margin: '0 0 ',
    },
    studentEmail: {
      fontSize: '12px',
      color: '#64748b',
      margin: '0',
    },
    progressCell: {
      minWidth: '120px',
    },
    progressInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },
    progressValue: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#1e293b',
    },
    quizScore: {
      padding: '4px 12px',
      borderRadius: '6px',
      fontWeight: '600',
      fontSize: '14px',
      display: 'inline-block',
    },
    scorePassed: {
      backgroundColor: '#d1fae5',
      color: '#065f46',
    },
    scoreFailed: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
    },
    noScore: {
      color: '#94a3b8',
      fontSize: '14px',
      fontStyle: 'italic',
    },
    statusBadge: {
      padding: '4px 8px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      display: 'inline-block',
    },
    statusActive: {
      backgroundColor: '#d1fae5',
      color: '#065f46',
    },
    statusInactive: {
      backgroundColor: '#f1f5f9',
      color: '#64748b',
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      gap: '16px',
    },
    loadingSpinner: {
      width: '48px',
      height: '48px',
      border: '3px solid #e2e8f0',
      borderTopColor: '#4f46e5',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    emptyState: {
      padding: '48px',
      textAlign: 'center',
      backgroundColor: 'white',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
    },
    emptyIcon: {
      width: '64px',
      height: '64px',
      margin: '0 auto 16px',
      color: '#cbd5e1',
    },
    emptyTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#475569',
      marginBottom: '8px',
    },
    emptyText: {
      fontSize: '14px',
      color: '#94a3b8',
      maxWidth: '400px',
      margin: '0 auto',
    },
    quizDetailsContainer: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '24px',
      marginTop: '32px',
    },
    quizDetailPanel: {
      backgroundColor: 'white',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden',
    },
    quizDetailHeader: {
      padding: '20px',
      borderBottom: '2px solid #e2e8f0',
      backgroundColor: '#f8fafc',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    quizDetailTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1e293b',
      margin: '0',
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      color: '#64748b',
      cursor: 'pointer',
      padding: '0',
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '6px',
      transition: 'background-color 0.2s',
    },
    closeButtonHover: {
      backgroundColor: '#e2e8f0',
    },
    quizDetailContent: {
      padding: '20px',
    },
    studentDetailHeader: {
      marginBottom: '20px',
      paddingBottom: '16px',
      borderBottom: '1px solid #e2e8f0',
    },
    studentDetailName: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1e293b',
      margin: '0 0 4px 0',
    },
    studentDetailEmail: {
      fontSize: '14px',
      color: '#64748b',
      margin: '0',
    },
    quizList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    quizItem: {
      padding: '16px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      backgroundColor: '#f8fafc',
      transition: 'all 0.2s',
    },
    quizItemHover: {
      backgroundColor: '#f1f5f9',
      borderColor: '#cbd5e1',
    },
    quizItemTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '8px',
      margin: '0 0 8px 0',
    },
    quizItemStats: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px',
    },
    quizStatItem: {
      fontSize: '12px',
      color: '#64748b',
    },
    quizStatLabel: {
      fontWeight: '600',
      color: '#475569',
    },
    attemptsList: {
      marginTop: '16px',
    },
    attemptsTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '12px',
      margin: '0 0 12px 0',
    },
    attemptItem: {
      padding: '12px',
      backgroundColor: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      marginBottom: '8px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    attemptDate: {
      fontSize: '12px',
      color: '#64748b',
    },
    attemptScore: {
      fontSize: '12px',
      fontWeight: '600',
      padding: '2px 8px',
      borderRadius: '4px',
    },
    quizCompletionStats: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px',
      marginBottom: '20px',
    },
    completionStat: {
      backgroundColor: '#f1f5f9',
      padding: '12px',
      borderRadius: '8px',
      textAlign: 'center',
    },
    completionStatValue: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#4f46e5',
      margin: '0',
    },
    completionStatLabel: {
      fontSize: '12px',
      color: '#64748b',
      margin: '4px 0 0 0',
    },
    noAttempts: {
      fontSize: '12px',
      color: '#94a3b8',
      fontStyle: 'italic',
      padding: '8px 0',
    },
  };

  if (loading) return (
    <div style={styles.container}>
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading students data...</p>
      </div>
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );

  if (students.length === 0) return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>Course Students</h1>
        <p style={styles.pageSubtitle}>View and manage student performance</p>
      </div>
      <div style={styles.emptyState}>
        <svg style={styles.emptyIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h3 style={styles.emptyTitle}>No Students Enrolled</h3>
        <p style={styles.emptyText}>There are no students enrolled in this course yet. Students will appear here once they enroll.</p>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>Course Students</h1>
        <p style={styles.pageSubtitle}>View and manage student performance for this course</p>
      </div>

      {courseInfo && (
        <div style={styles.courseCard}>
          <h2 style={styles.courseTitle}>{courseInfo.title || 'Course Details'}</h2>
          <p style={styles.courseDescription}>
            {courseInfo.description || 'No description available'}
          </p>
        </div>
      )}

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statContent}>
            <span style={styles.statLabel}>Total Students</span>
            <span style={styles.statValue}>{stats.total}</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statContent}>
            <span style={styles.statLabel}>Average Progress</span>
            <span style={styles.statValue}>{stats.avgProgress}%</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statContent}>
            <span style={styles.statLabel}>Avg Quiz Score</span>
            <span style={styles.statValue}>{stats.avgQuizScore}%</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statContent}>
            <span style={styles.statLabel}>Active Students</span>
            <span style={styles.statValue}>{stats.activeStudents}</span>
          </div>
        </div>
      </div>

      <div style={styles.tableContainer}>
        <div style={styles.tableHeader}>
          <h3 style={styles.tableTitle}>Students Overview</h3>
          <span style={styles.tableCount}>{students.length} {students.length === 1 ? 'student' : 'students'}</span>
        </div>
        <table style={styles.table}>
          <thead style={styles.tableHead}>
            <tr>
              <th style={styles.th}>Student</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Progress</th>
              <th style={styles.th}>Quiz Score</th>
              <th style={styles.th}>Last Activity</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody style={styles.tbody}>
            {students.map((student) => (
              <tr key={student.id} onClick={() => handleStudentClick(student)} style={{ cursor: 'pointer' }}>
                <td style={styles.td}>
                  <div style={styles.studentCell}>
                    <div style={styles.studentAvatar}>
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={styles.studentInfo}>
                      <div style={styles.studentName}>{student.name}</div>
                    </div>
                  </div>
                </td>
                <td style={styles.td}>
                  <div style={styles.studentEmail}>{student.email}</div>
                </td>
                <td style={styles.td}>
                  <div style={styles.progressCell}>
                    <div style={styles.progressInfo}>
                      <span style={styles.progressValue}>{student.progress}%</span>
                      <ProgressBar progress={student.progress} size="small" />
                    </div>
                  </div>
                </td>
                <td style={styles.td}>
                  {student.quizScore !== null ? (
                    <span 
                      style={{
                        ...styles.quizScore,
                        ...(student.quizScore >= 70 ? styles.scorePassed : styles.scoreFailed)
                      }}
                    >
                      {student.quizScore}%
                    </span>
                  ) : (
                    <span style={styles.noScore}>No score</span>
                  )}
                </td>
                <td style={styles.td}>{student.lastActivity}</td>
                <td style={styles.td}>
                  <span 
                    style={{
                      ...styles.statusBadge,
                      ...(student.isActive ? styles.statusActive : styles.statusInactive)
                    }}
                  >
                    {student.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedStudent && (
        <div style={styles.quizDetailsContainer}>
          <div style={styles.quizDetailPanel}>
            <div style={styles.quizDetailHeader}>
              <h3 style={styles.quizDetailTitle}>Quiz Completion Details</h3>
              <button 
                style={styles.closeButton}
                onClick={() => {
                  setSelectedStudent(null);
                  setQuizAttempts([]);
                }}
              >
                ✕
              </button>
            </div>
            <div style={styles.quizDetailContent}>
              <div style={styles.studentDetailHeader}>
                <h4 style={styles.studentDetailName}>{selectedStudent.name}</h4>
                <p style={styles.studentDetailEmail}>{selectedStudent.email}</p>
              </div>
              
              <div style={styles.quizCompletionStats}>
                <div style={styles.completionStat}>
                  <p style={styles.completionStatValue}>{quizzes.length}</p>
                  <p style={styles.completionStatLabel}>Total Quizzes</p>
                </div>
                <div style={styles.completionStat}>
                  <p style={styles.completionStatValue}>
                    {quizzes.filter(q => quizAttempts.some(a => a.quizId === q.id)).length}
                  </p>
                  <p style={styles.completionStatLabel}>Quizzes Attempted</p>
                </div>
              </div>

              <h4 style={styles.attemptsTitle}>Quiz List</h4>
              <div style={styles.quizList}>
                {quizzes.length > 0 ? (
                  quizzes.map((quiz) => {
                    const quizAttemptList = quizAttempts.filter(a => a.quizId === quiz.id);
                    const hasAttempted = quizAttemptList.length > 0;
                    const bestScore = hasAttempted 
                      ? Math.max(...quizAttemptList.map(a => a.score)) 
                      : null;

                    return (
                      <div key={quiz.id} style={styles.quizItem}>
                        <h5 style={styles.quizItemTitle}>{quiz.title}</h5>
                        <div style={styles.quizItemStats}>
                          <div style={styles.quizStatItem}>
                            <span style={styles.quizStatLabel}>Status: </span>
                            {hasAttempted ? 'Attempted' : 'Not Attempted'}
                          </div>
                          <div style={styles.quizStatItem}>
                            <span style={styles.quizStatLabel}>Best Score: </span>
                            {hasAttempted ? `${Math.round(bestScore)}%` : '-'}
                          </div>
                        </div>

                        {hasAttempted && (
                          <div style={styles.attemptsList}>
                            <h6 style={styles.attemptsTitle}>Attempts ({quizAttemptList.length})</h6>
                            {quizAttemptList.map((attempt, index) => (
                              <div key={attempt.id || index} style={styles.attemptItem}>
                                <div>
                                  <div style={styles.attemptDate}>
                                    {new Date(attempt.attemptDate).toLocaleDateString()} at{' '}
                                    {new Date(attempt.attemptDate).toLocaleTimeString()}
                                  </div>
                                </div>
                                <span 
                                  style={{
                                    ...styles.attemptScore,
                                    ...(attempt.score >= 70 ? styles.scorePassed : styles.scoreFailed)
                                  }}
                                >
                                  {Math.round(attempt.score)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p style={styles.noAttempts}>No quizzes available for this course</p>
                )}
              </div>
            </div>
          </div>

          <div style={styles.quizDetailPanel}>
            <div style={styles.quizDetailHeader}>
              <h3 style={styles.quizDetailTitle}>Performance Summary</h3>
            </div>
            <div style={styles.quizDetailContent}>
              <div style={styles.studentDetailHeader}>
                <h4 style={styles.studentDetailName}>{selectedStudent.name}</h4>
              </div>

              <div style={styles.quizCompletionStats}>
                <div style={styles.completionStat}>
                  <p style={styles.completionStatValue}>{selectedStudent.progress}%</p>
                  <p style={styles.completionStatLabel}>Course Progress</p>
                </div>
                <div style={styles.completionStat}>
                  <p style={styles.completionStatValue}>
                    {selectedStudent.quizScore !== null ? selectedStudent.quizScore : '-'}
                  </p>
                  <p style={styles.completionStatLabel}>Latest Quiz Score</p>
                </div>
              </div>

              <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px 0' }}>
                  Summary Stats
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#64748b' }}>Enrolled Date:</span>
                    <span style={{ fontWeight: '600', color: '#1e293b' }}>{selectedStudent.enrolledDate}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#64748b' }}>Last Activity:</span>
                    <span style={{ fontWeight: '600', color: '#1e293b' }}>{selectedStudent.lastActivity}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#64748b' }}>Status:</span>
                    <span 
                      style={{
                        fontWeight: '600',
                        color: selectedStudent.isActive ? '#065f46' : '#64748b'
                      }}
                    >
                      {selectedStudent.isActive ? '🟢 Active' : '🔴 Inactive'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#64748b' }}>Quiz Completion Rate:</span>
                    <span style={{ fontWeight: '600', color: '#1e293b' }}>
                      {quizzes.length > 0 
                        ? `${Math.round((quizAttempts.filter((a, i, arr) => arr.findIndex(x => x.quizId === a.quizId) === i).length / quizzes.length) * 100)}%`
                        : '-'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseStudents;
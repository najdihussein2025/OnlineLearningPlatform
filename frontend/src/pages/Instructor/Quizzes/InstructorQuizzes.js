import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DataTable from '../../../components/admin/DataTable/DataTable';
import StatCard from '../../../components/admin/StatCard/StatCard';
import api from '../../../services/api';
import './InstructorQuizzes.css';

const InstructorQuizzes = () => {
  const [filter, setFilter] = useState('all');
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const courseRes = await api.get('/courses/mine');
        if (!mounted) return;
        const myCourses = courseRes.data || [];
        setCourses(myCourses);

        // fetch quizzes for every course in parallel
        const quizzesPromises = myCourses.map(c => api.get(`/quizzes/byCourse/${c.id}`));
        const quizzesResults = await Promise.all(quizzesPromises);
        const all = quizzesResults.flatMap((r, idx) => (r.data || []).map(q => ({ ...q, courseTitle: myCourses[idx].title })));
        if (!mounted) return;
        setQuizzes(all);
      } catch (err) {
        console.error('Failed to load quizzes', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const filteredQuizzes = quizzes.filter(quiz => {
    if (filter === 'all') return true;
    return quiz.status === filter;
  });

  const quizStats = [
    {
      title: 'Total Quizzes',
      value: quizzes.length.toString(),
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'primary',
    },
    {
      title: 'Total Attempts',
      value: quizzes.reduce((sum, q) => sum + q.attempts, 0).toString(),
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'secondary',
    },
    {
      title: 'Average Score',
      value: '85%',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'accent',
    },
  ];

  const columns = [
    {
      header: 'Quiz Title',
      accessor: 'title',
      render: (quiz) => (
        <div className="quiz-title-cell">
          <h4 className="quiz-title">{quiz.title}</h4>
          <p className="quiz-course">{quiz.courseTitle}</p>
        </div>
      ),
    },
    {
      header: 'Questions',
      accessor: 'questions',
    },
    {
      header: 'Passing Score',
      accessor: 'passingScore',
      render: (quiz) => `${quiz.passingScore}%`,
    },
    {
      header: 'Time Limit',
      accessor: 'timeLimit',
      render: (quiz) => `${quiz.timeLimit} min`,
    },
    {
      header: 'Attempts',
      accessor: 'attempts',
    },
    {
      header: 'Avg Score',
      accessor: 'averageScore',
      render: (quiz) => quiz.averageScore ? `${quiz.averageScore}%` : '-',
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (quiz) => (
        <span className={`status-badge status-${quiz.status}`}>
          {quiz.status.charAt(0).toUpperCase() + quiz.status.slice(1)}
        </span>
      ),
    },
  ];

  const actions = (quiz) => (
    <div className="table-actions">
      <Link to={`/instructor/quizzes/${quiz.id}/edit`} className="btn-icon" title="Edit Quiz">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>
      <Link to={`/instructor/quizzes/${quiz.id}/preview`} className="btn-icon" title="Preview Quiz">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>
      <Link to={`/instructor/quizzes/${quiz.id}/stats`} className="btn-icon" title="View Statistics">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3V21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>
    </div>
  );

  return (
    <div className="instructor-quizzes-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quiz Management</h1>
          <p className="page-subtitle">Create and manage quizzes for your courses</p>
        </div>
        <Link to="/instructor/quizzes/new" className="btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Create New Quiz
        </Link>
      </div>

      <div className="quiz-stats-grid">
        {quizStats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="filters-section">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Quizzes ({quizzes.length})
          </button>
          <button
            className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({quizzes.filter(q => q.status === 'active').length})
          </button>
          <button
            className={`filter-tab ${filter === 'draft' ? 'active' : ''}`}
            onClick={() => setFilter('draft')}
          >
            Draft ({quizzes.filter(q => q.status === 'draft').length})
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredQuizzes}
        actions={actions}
        emptyMessage="No quizzes found. Create your first quiz to get started!"
      />
    </div>
  );
};

export default InstructorQuizzes;


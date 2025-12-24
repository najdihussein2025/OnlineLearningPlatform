import React, { useState } from 'react';
import DataTable from '../../../components/admin/DataTable/DataTable';
import StatCard from '../../../components/admin/StatCard/StatCard';
import './AdminQuizzes.css';

const AdminQuizzes = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock quizzes data
  const quizzes = [
    { id: 1, title: 'JavaScript Basics Quiz', course: 'Web Development Bootcamp', questions: 10, passingScore: 70, timeLimit: 30, attempts: 245 },
    { id: 2, title: 'Python Fundamentals', course: 'Data Science with Python', questions: 15, passingScore: 75, timeLimit: 45, attempts: 180 },
    { id: 3, title: 'CSS Layout Quiz', course: 'Web Development Bootcamp', questions: 8, passingScore: 65, timeLimit: 20, attempts: 320 },
    { id: 4, title: 'Data Analysis Quiz', course: 'Data Science with Python', questions: 12, passingScore: 80, timeLimit: 40, attempts: 95 },
  ];

  const filteredQuizzes = searchQuery
    ? quizzes.filter(quiz => 
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quiz.course.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : quizzes;

  const columns = [
    { key: 'title', header: 'Quiz Title' },
    { key: 'course', header: 'Course' },
    {
      key: 'questions',
      header: 'Questions',
      align: 'center',
      render: (value) => <strong>{value}</strong>,
    },
    {
      key: 'passingScore',
      header: 'Passing Score',
      align: 'center',
      render: (value) => <span>{value}%</span>,
    },
    {
      key: 'timeLimit',
      header: 'Time Limit',
      align: 'center',
      render: (value) => <span>{value} min</span>,
    },
    {
      key: 'attempts',
      header: 'Attempts',
      align: 'center',
      render: (value) => <strong>{value}</strong>,
    },
  ];

  const actions = (row) => (
    <>
      <button className="btn-action btn-edit">Edit</button>
      <button className="btn-action btn-preview">Preview</button>
      <button className="btn-action btn-stats">Stats</button>
    </>
  );

  return (
    <div className="admin-quizzes-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Quiz Management</h1>
            <p className="page-subtitle">Create and manage quizzes</p>
          </div>
          <button className="btn-primary">Create New Quiz</button>
        </div>

        <div className="quizzes-stats">
          <div className="quiz-stat-card">
            <div className="quiz-stat-value">{quizzes.length}</div>
            <div className="quiz-stat-label">Total Quizzes</div>
          </div>
          <div className="quiz-stat-card">
            <div className="quiz-stat-value">{quizzes.reduce((sum, q) => sum + q.questions, 0)}</div>
            <div className="quiz-stat-label">Total Questions</div>
          </div>
          <div className="quiz-stat-card">
            <div className="quiz-stat-value">{quizzes.reduce((sum, q) => sum + q.attempts, 0)}</div>
            <div className="quiz-stat-label">Total Attempts</div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredQuizzes}
          actions={actions}
          emptyMessage="No quizzes found"
        />
      </div>
  );
};

export default AdminQuizzes;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../components/admin/DataTable/DataTable';
import ConfirmationDialog from '../../../components/ConfirmationDialog/ConfirmationDialog';
import { useDashboardToast } from '../../../components/DashboardLayout/DashboardLayout';
import api from '../../../services/api';
import './AdminQuizzes.css';

const AdminQuizzes = () => {
  const navigate = useNavigate();
  const { success, error } = useDashboardToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, quizId: null });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [quizzesRes, coursesRes] = await Promise.all([
        api.get('/quizzes'),
        api.get('/courses')
      ]);

      const quizzesData = Array.isArray(quizzesRes.data) ? quizzesRes.data : quizzesRes.data?.data || [];
      const coursesData = Array.isArray(coursesRes.data) ? coursesRes.data : coursesRes.data?.data || [];
      
      setQuizzes(quizzesData);
      setCourses(coursesData);
    } catch (err) {
      console.error('Error fetching data:', err);
      error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const getCourseTitle = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course?.title || 'Unknown Course';
  };

  const filteredQuizzes = searchQuery
    ? quizzes.filter(quiz => 
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getCourseTitle(quiz.courseId).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : quizzes;

  const columns = [
    { key: 'title', header: 'Quiz Title' },
    {
      key: 'courseId',
      header: 'Course',
      render: (value) => getCourseTitle(value),
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
  ];

  const actions = (row) => (
    <>
      <button className="btn-action btn-edit" onClick={() => handleEdit(row.id)}>Edit</button>
      <button className="btn-action btn-delete" onClick={() => handleDelete(row.id)}>Delete</button>
    </>
  );

  const handleEdit = (quizId) => {
    navigate(`/admin/quizzes/${quizId}`);
  };

  const handleDelete = (quizId) => {
    setConfirmDialog({
      isOpen: true,
      action: 'delete',
      quizId,
      message: 'Are you sure you want to delete this quiz? This action cannot be undone.'
    });
  };

  const handleCreate = () => {
    navigate('/admin/quizzes/new');
  };

  const confirmAction = async () => {
    if (confirmDialog.action === 'delete') {
      try {
        await api.delete(`/quizzes/${confirmDialog.quizId}`);
        success('Quiz deleted successfully');
        await fetchData();
      } catch (err) {
        error('Failed to delete quiz');
        console.error('Delete error:', err);
      }
    }
    setConfirmDialog({ isOpen: false, action: null, quizId: null });
  };

  return (
    <div className="admin-quizzes-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quiz Management</h1>
          <p className="page-subtitle">Create and manage quizzes</p>
        </div>
        <button className="btn-primary" onClick={handleCreate}>Create New Quiz</button>
      </div>

      {!loading && (
        <div className="quizzes-stats">
          <div className="quiz-stat-card">
            <div className="quiz-stat-value">{quizzes.length}</div>
            <div className="quiz-stat-label">Total Quizzes</div>
          </div>
          <div className="quiz-stat-card">
            <div className="quiz-stat-value">{quizzes.reduce((sum, q) => sum + (q.questions || 0), 0)}</div>
            <div className="quiz-stat-label">Total Questions</div>
          </div>
        </div>
      )}

      <div className="search-section">
        <input
          type="text"
          placeholder="Search quizzes by title or course..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <div className="loading-message">Loading quizzes...</div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredQuizzes}
          actions={actions}
          emptyMessage="No quizzes found"
        />
      )}

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, action: null, quizId: null })}
        onConfirm={confirmAction}
        title="Confirm Delete"
        message={confirmDialog.message || 'Are you sure you want to delete this quiz?'}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default AdminQuizzes;


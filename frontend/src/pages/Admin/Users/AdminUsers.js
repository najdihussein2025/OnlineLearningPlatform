import React, { useState, useMemo } from 'react';
import DataTable from '../../../components/admin/DataTable/DataTable';
import SearchBar from '../../../components/admin/SearchBar/SearchBar';
import { useDashboardToast } from '../../../components/DashboardLayout/DashboardLayout';
import ConfirmationDialog from '../../../components/ConfirmationDialog/ConfirmationDialog';
import './AdminUsers.css';

const AdminUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, userId: null });
  const { success, error } = useDashboardToast();

  // Mock users data
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'student', status: 'active', joined: '2024-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'instructor', status: 'pending', joined: '2024-01-20' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'student', status: 'active', joined: '2024-01-18' },
    { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', role: 'instructor', status: 'active', joined: '2024-01-10' },
    { id: 5, name: 'David Brown', email: 'david@example.com', role: 'student', status: 'active', joined: '2024-01-22' },
    { id: 6, name: 'Emily Davis', email: 'emily@example.com', role: 'instructor', status: 'pending', joined: '2024-01-25' },
  ];

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !searchQuery || 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [searchQuery, roleFilter, statusFilter]);

  const handleApprove = (userId) => {
    // UI only - would call API in production
    success(`User ${userId} approved successfully`);
  };

  const handleDisable = (userId) => {
    setConfirmDialog({ 
      isOpen: true, 
      action: 'disable', 
      userId,
      message: 'Are you sure you want to disable this user?'
    });
  };

  const confirmAction = () => {
    if (confirmDialog.action === 'disable') {
      // UI only - would call API in production
      success(`User ${confirmDialog.userId} disabled successfully`);
    }
    setConfirmDialog({ isOpen: false, action: null, userId: null });
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (value, row) => (
        <div className="user-cell">
          <div className="user-avatar-small">
            {value[0]}
          </div>
          <span>{value}</span>
        </div>
      ),
    },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (value) => (
        <span className={`role-badge role-${value}`}>{value}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <span className={`status-badge status-${value}`}>{value}</span>
      ),
    },
    { key: 'joined', header: 'Joined' },
  ];

  const actions = (row) => (
    <>
      {row.status === 'pending' && row.role === 'instructor' && (
        <button
          className="btn-action btn-approve"
          onClick={(e) => {
            e.stopPropagation();
            handleApprove(row.id);
          }}
        >
          Approve
        </button>
      )}
      <button
        className="btn-action btn-disable"
        onClick={(e) => {
          e.stopPropagation();
          handleDisable(row.id);
        }}
      >
        {row.status === 'active' ? 'Disable' : 'Enable'}
      </button>
    </>
  );

  return (
    <>
      <div className="admin-users-page">
        <div className="page-header">
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage platform users and instructor approvals</p>
        </div>

        <div className="filters-section">
          <div className="filter-group">
            <label htmlFor="role-filter">Filter by Role</label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="instructor">Instructors</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="status-filter">Filter by Status</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div className="filter-results">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredUsers}
          actions={actions}
          emptyMessage="No users found"
        />
      </div>
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, action: null, userId: null })}
        onConfirm={confirmAction}
        title="Confirm Action"
        message={confirmDialog.message || 'Are you sure you want to proceed?'}
        confirmText="Confirm"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
};

export default AdminUsers;


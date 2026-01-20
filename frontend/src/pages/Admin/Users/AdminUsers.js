import React, { useState, useMemo, useEffect } from 'react';
import DataTable from '../../../components/admin/DataTable/DataTable';
import SearchBar from '../../../components/admin/SearchBar/SearchBar';
import { useDashboardToast } from '../../../components/DashboardLayout/DashboardLayout';
import ConfirmationDialog from '../../../components/ConfirmationDialog/ConfirmationDialog';
import api from '../../../services/api';
import './AdminUsers.css';

const AdminUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, userId: null });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { success, error } = useDashboardToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      console.log('API Response:', response);
      console.log('API Response Data:', response.data);
      
      const usersData = Array.isArray(response.data) ? response.data : response.data?.data || [];
      console.log('Processed Users Data:', usersData);
      
      // Map API data to table format
      const formattedUsers = usersData.map(user => ({
        id: user.id,
        name: user.fullName || user.name || 'Unknown',
        email: user.email || 'No email',
        role: (user.role || 'student').toLowerCase(),
        status: user.status || 'active',
        joined: user.createdAt 
          ? new Date(user.createdAt).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })
          : 'Not set'
      }));
      
      console.log('Formatted Users:', formattedUsers);
      setUsers(formattedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

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

  const handleApprove = async (userId) => {
    try {
      console.log('Approving instructor:', userId);
      await api.put(`/users/${userId}`, { status: 'active' });
      setUsers(users.map(u => u.id === userId ? { ...u, status: 'active' } : u));
      success('Instructor approved successfully!');
    } catch (err) {
      console.error('Error approving instructor:', err);
      console.error('Error details:', err.response?.data);
      error('Failed to approve instructor: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDisable = (userId) => {
    const user = users.find(u => u.id === userId);
    console.log('handleDisable called for userId:', userId, 'user:', user);
    setConfirmDialog({ 
      isOpen: true, 
      action: 'disable', 
      userId,
      message: `Are you sure you want to ${user?.status === 'active' ? 'disable' : 'enable'} this user?`
    });
  };

  const confirmAction = async () => {
    if (confirmDialog.action === 'disable') {
      try {
        const user = users.find(u => u.id === confirmDialog.userId);
        const newStatus = user?.status === 'active' ? 'inactive' : 'active';
        console.log('Updating user', confirmDialog.userId, 'to status:', newStatus);
        
        const response = await api.put(`/users/${confirmDialog.userId}`, { status: newStatus });
        console.log('Update response:', response);
        
        setUsers(users.map(u => u.id === confirmDialog.userId ? { ...u, status: newStatus } : u));
        success(`User status updated to ${newStatus}`);
      } catch (err) {
        console.error('Error updating user status:', err);
        console.error('Error details:', err.response?.data);
        error('Failed to update user status: ' + (err.response?.data?.message || err.message));
      }
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
          title="Approve this instructor"
          onClick={(e) => {
            e.stopPropagation();
            handleApprove(row.id);
          }}
        >
          Approve Instructor
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
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="filter-results">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Loading users...
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredUsers}
            actions={actions}
            emptyMessage="No users found"
          />
        )}
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


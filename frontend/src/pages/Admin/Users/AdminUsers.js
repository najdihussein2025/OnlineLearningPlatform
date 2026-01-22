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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'Student',
    status: 'Active'
  });
  const { success, error } = useDashboardToast();

  // Fetch users when filters change
  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const response = await api.get('/users', { params });
      const usersData = Array.isArray(response.data) ? response.data : response.data?.data || [];
      
      // Map API data to table format
      const formattedUsers = usersData.map(user => ({
        id: user.id,
        name: user.fullName || user.name || 'Unknown',
        email: user.email || 'No email',
        role: (user.role || 'student').toLowerCase(),
        status: (user.status || 'Active'),
        joined: user.createdAt 
          ? new Date(user.createdAt).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })
          : 'Not set'
      }));
      
      setUsers(formattedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Client-side search filtering only
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !searchQuery || 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [searchQuery, users]);

  const handleCreateUser = () => {
    setFormData({
      fullName: '',
      email: '',
      password: '',
      role: 'Student',
      status: 'Active'
    });
    setShowCreateModal(true);
  };

  const handleEditUser = (user) => {
    const originalUser = users.find(u => u.id === user.id);
    setEditingUser(originalUser);
    setFormData({
      fullName: originalUser.name,
      email: originalUser.email,
      password: '',
      role: originalUser.role.charAt(0).toUpperCase() + originalUser.role.slice(1),
      status: originalUser.status || 'Active'
    });
    setShowEditModal(true);
  };

  const handleDeleteUser = (user) => {
    setConfirmDialog({ 
      isOpen: true, 
      action: 'delete', 
      userId: user.id,
      message: `Are you sure you want to delete user "${user.name}"? This action cannot be undone.`
    });
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      success('User created successfully!');
      setShowCreateModal(false);
      fetchUsers();
    } catch (err) {
      console.error('Error creating user:', err);
      error('Failed to create user: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${editingUser.id}`, {
        fullName: formData.fullName,
        role: formData.role,
        status: formData.status
      });
      success('User updated successfully!');
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      error('Failed to update user: ' + (err.response?.data?.message || err.message));
    }
  };

  const confirmAction = async () => {
    if (confirmDialog.action === 'delete') {
      try {
        await api.delete(`/users/${confirmDialog.userId}`);
        success('User deleted successfully!');
        fetchUsers();
      } catch (err) {
        console.error('Error deleting user:', err);
        error('Failed to delete user: ' + (err.response?.data?.message || err.message));
      }
    } else if (confirmDialog.action === 'disable') {
      try {
        const user = users.find(u => u.id === confirmDialog.userId);
        const newStatus = user?.status?.toLowerCase() === 'active' ? 'Inactive' : 'Active';
        await api.put(`/users/${confirmDialog.userId}/status`, { status: newStatus });
        success(`User ${newStatus === 'Active' ? 'enabled' : 'disabled'} successfully!`);
        fetchUsers();
      } catch (err) {
        console.error('Error updating user status:', err);
        error('Failed to update user status: ' + (err.response?.data?.message || err.message));
      }
    }
    setConfirmDialog({ isOpen: false, action: null, userId: null });
  };

  const handleApprove = async (userId) => {
    try {
      await api.put(`/users/${userId}/status`, { status: 'Active' });
      success('Instructor approved successfully!');
      fetchUsers();
    } catch (err) {
      console.error('Error approving instructor:', err);
      error('Failed to approve instructor: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDisable = (userId) => {
    const user = users.find(u => u.id === userId);
    setConfirmDialog({ 
      isOpen: true, 
      action: 'disable', 
      userId,
      message: `Are you sure you want to ${user?.status?.toLowerCase() === 'active' ? 'disable' : 'enable'} this user?`
    });
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
      <button
        className="btn-action btn-edit"
        onClick={(e) => {
          e.stopPropagation();
          handleEditUser(row);
        }}
        title="Edit user"
      >
        Edit
      </button>
      <button
        className="btn-action btn-delete"
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteUser(row);
        }}
        title="Delete user"
      >
        Delete
      </button>
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
        {row.status?.toLowerCase() === 'active' ? 'Disable' : 'Enable'}
      </button>
    </>
  );

  return (
    <>
      <div className="admin-users-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">User Management</h1>
            <p className="page-subtitle">Manage platform users and instructor approvals</p>
          </div>
          <button className="btn-primary" onClick={handleCreateUser}>
            + Add User
          </button>
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
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="search-input">Search</label>
            <input
              id="search-input"
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="filter-select"
            />
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New User</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitCreate}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="Student">Student</option>
                  <option value="Instructor">Instructor</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit User</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitEdit}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                />
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="Student">Student</option>
                  <option value="Instructor">Instructor</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

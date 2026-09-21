/**
 * User Management Page
 * Full CRUD administrative interface for managing analysts, role assignments, and access status.
 */

import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/Toast';

const ROLES = ['Super Admin', 'Security Analyst', 'Investigator', 'User', 'Viewer'];
const STATUSES = ['active', 'suspended'];

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Security Analyst',
    status: 'active',
    department: '',
    phone: '',
  });
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.users.list();
      if (res?.users) {
        setUsers(res.users);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      showToast('Please fill in all required fields.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.users.create(formData);
      showToast(`User ${formData.name} created successfully!`, 'success');
      setShowAddModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'Security Analyst',
        status: 'active',
      });
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to create user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      await api.users.update(selectedUser.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
      });
      showToast(`Updated user ${formData.name}`, 'success');
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to update user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser || !newPassword || newPassword.length < 6) {
      showToast('Password must be at least 6 characters long.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.users.resetPassword(selectedUser.id, newPassword);
      showToast(`Password reset for ${selectedUser.name}`, 'success');
      setShowPasswordModal(false);
      setNewPassword('');
    } catch (err) {
      showToast(err.message || 'Failed to reset password', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (userToDelete) => {
    if (userToDelete.id === currentUser?.id) {
      showToast('You cannot delete your own active account.', 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete user "${userToDelete.name}"?`)) {
      return;
    }

    try {
      await api.users.delete(userToDelete.id);
      showToast(`User ${userToDelete.name} deleted`, 'success');
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to delete user', 'error');
    }
  };

  const handleToggleStatus = async (targetUser) => {
    const nextStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    try {
      await api.users.update(targetUser.id, { status: nextStatus });
      showToast(`User marked as ${nextStatus}`, 'info');
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to change status', 'error');
    }
  };

  const openDetail = (u) => {
    setSelectedUser(u);
    setShowDetailModal(true);
  };

  const openEdit = (u) => {
    setSelectedUser(u);
    setFormData({
      name: u.name || '',
      email: u.email || '',
      role: u.role || 'User',
      status: u.status || 'active',
      department: u.department || '',
      phone: u.phone || '',
      password: '',
    });
    setShowEditModal(true);
  };

  const openResetPassword = (u) => {
    setSelectedUser(u);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const filteredUsers = users.filter((u) => {
    const q = searchFilter.toLowerCase();
    const matchSearch =
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q) ||
      (u.department || '').toLowerCase().includes(q);
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalLoginsCount = users.reduce((acc, u) => acc + (u.loginCount || 0), 0);
  const loggedInUsersCount = users.filter((u) => u.lastLogin).length;

  return (
    <div className="users-page">
      {/* Header */}
      <div className="page-header-card">
        <div className="page-header-info">
          <h2>👥 Identity & Access Management (RBAC)</h2>
          <p>
            Platform user directory, authentication telemetry, and granular access controls for administrators and standard users.
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            + Add New User
          </button>
        </div>
      </div>

      {/* Admin Login Visibility & User Metrics */}
      <div className="stats-grid mb-4">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Platform Users</span>
            <span className="stat-icon">👥</span>
          </div>
          <div className="stat-number">{users.length}</div>
          <div className="stat-sub text-success">
            {users.filter((u) => u.status === 'active').length} active accounts
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Users Logged In</span>
            <span className="stat-icon">🟢</span>
          </div>
          <div className="stat-number text-success">{loggedInUsersCount}</div>
          <div className="stat-sub text-info">
            {Math.round((loggedInUsersCount / Math.max(users.length, 1)) * 100)}% of total userbase
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Platform Logins</span>
            <span className="stat-icon">🔐</span>
          </div>
          <div className="stat-number text-primary">{totalLoginsCount}</div>
          <div className="stat-sub text-secondary">Cumulative authentication events</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Standard Users</span>
            <span className="stat-icon">👤</span>
          </div>
          <div className="stat-number text-warning">
            {users.filter((u) => u.role === 'User' || u.role === 'Viewer').length}
          </div>
          <div className="stat-sub text-muted">Email analysis scope</div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="card user-filter-bar">
        <div className="search-input-group" style={{ flex: 1, minWidth: '240px' }}>
          <span className="search-input-icon">🔍</span>
          <input
            type="text"
            className="intel-input"
            placeholder="Search by name, email, department or role..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
        </div>

        <div className="filter-select-group">
          <label className="text-secondary text-sm">Role Filter:</label>
          <select
            className="input font-semibold"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="All">All Roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card full-width">
        <div className="card-header">
          <div>
            <h3>User Directory & Login Telemetry</h3>
            <p className="card-subtitle">Complete records of platform users, authentication counts, and access roles</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>User / Identity</th>
                <th>Role</th>
                <th>Status</th>
                <th>Department & Contact</th>
                <th>Login Telemetry</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center p-4">Loading user directory...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-4">No users match the search criteria.</td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-table-cell">
                        <div className="user-table-avatar">{u.avatar || 'US'}</div>
                        <div>
                          <div className="font-semibold text-primary">{u.name}</div>
                          <div className="font-mono text-xs text-secondary">{u.email}</div>
                          <div className="font-mono text-xs text-muted" style={{ fontSize: '0.68rem' }}>ID: {u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        u.role === 'Super Admin'
                          ? 'badge-purple'
                          : u.role === 'Security Analyst'
                          ? 'badge-info'
                          : u.role === 'Investigator'
                          ? 'badge-warning'
                          : u.role === 'User'
                          ? 'badge-success'
                          : 'badge-secondary'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {u.status?.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="text-sm text-primary">{u.department || 'Security Operations'}</div>
                      <div className="text-xs text-secondary">{u.phone || 'No phone set'}</div>
                    </td>
                    <td>
                      <div className="login-telemetry-cell">
                        <div className="font-semibold text-xs text-primary">
                          <span className="badge badge-outline" style={{ marginRight: '4px' }}>
                            {u.loginCount || 0} {u.loginCount === 1 ? 'Login' : 'Logins'}
                          </span>
                          {u.lastLogin ? (
                            <span className="text-success text-xs">● Active</span>
                          ) : (
                            <span className="text-muted text-xs">○ Never</span>
                          )}
                        </div>
                        <div className="font-mono text-xs text-secondary mt-1">
                          {u.lastLogin
                            ? new Date(u.lastLogin).toLocaleString(undefined, {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : 'No logins recorded'}
                        </div>
                        {u.lastLoginIp && (
                          <div className="font-mono text-xs text-muted" style={{ fontSize: '0.68rem' }}>
                            IP: {u.lastLoginIp}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={() => openDetail(u)}
                          title="View Full User Details"
                        >
                          👁️ Details
                        </button>
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={() => openEdit(u)}
                          title="Edit User"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={() => openResetPassword(u)}
                          title="Reset Password"
                        >
                          🔑 Reset
                        </button>
                        <button
                          className={`btn ${u.status === 'active' ? 'btn-ghost' : 'btn-secondary'} btn-xs`}
                          onClick={() => handleToggleStatus(u)}
                          title={u.status === 'active' ? 'Suspend' : 'Activate'}
                        >
                          {u.status === 'active' ? '⏸️' : '▶️'}
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            className="btn btn-danger btn-xs"
                            onClick={() => handleDelete(u)}
                            title="Delete User"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD USER */}
      {showAddModal && (
        <div className="search-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h3>Add New Platform User</h3>
              <button className="btn-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddSubmit} className="modal-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Alex Mercer"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  className="input"
                  placeholder="e.g. alex@mailguard.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Initial Password (min 6 chars) *</label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Assigned Role *</label>
                  <select
                    className="input font-semibold"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Status *</label>
                  <select
                    className="input font-semibold"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT USER */}
      {showEditModal && selectedUser && (
        <div className="search-modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="modal-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h3>Edit User: {selectedUser.name}</h3>
              <button className="btn-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleEditSubmit} className="modal-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Role</label>
                  <select
                    className="input font-semibold"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    className="input font-semibold"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RESET PASSWORD */}
      {showPasswordModal && selectedUser && (
        <div className="search-modal-backdrop" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h3>Reset Password: {selectedUser.name}</h3>
              <button className="btn-close" onClick={() => setShowPasswordModal(false)}>✕</button>
            </div>
            <form onSubmit={handleResetPasswordSubmit} className="modal-form">
              <p className="text-secondary text-sm">
                Set a new password for account <strong>{selectedUser.email}</strong>.
              </p>

              <div className="form-group mt-3">
                <label>New Password (min 6 chars) *</label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Set New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: FULL USER DETAILS DOSSIER */}
      {showDetailModal && selectedUser && (
        <div className="search-modal-backdrop" onClick={() => setShowDetailModal(false)}>
          <div className="modal-dialog-card user-detail-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="card-header">
              <div className="user-detail-header-wrap">
                <div className="user-detail-avatar-lg">{selectedUser.avatar || 'US'}</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{selectedUser.name}</h3>
                  <p className="font-mono text-xs text-secondary" style={{ margin: '2px 0 0' }}>{selectedUser.email}</p>
                </div>
              </div>
              <button className="btn-close" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>

            <div className="user-detail-body">
              <div className="user-detail-badges mb-3">
                <span className={`badge ${
                  selectedUser.role === 'Super Admin'
                    ? 'badge-purple'
                    : selectedUser.role === 'Security Analyst'
                    ? 'badge-info'
                    : selectedUser.role === 'Investigator'
                    ? 'badge-warning'
                    : selectedUser.role === 'User'
                    ? 'badge-success'
                    : 'badge-secondary'
                }`}>
                  Role: {selectedUser.role}
                </span>
                <span className={`badge ${selectedUser.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                  Status: {selectedUser.status?.toUpperCase()}
                </span>
                <span className="badge badge-outline">
                  {selectedUser.loginCount || 0} Total Logins
                </span>
              </div>

              <div className="user-detail-grid">
                <div className="user-detail-item">
                  <span className="user-detail-label">User Identifier:</span>
                  <span className="user-detail-value font-mono text-xs">{selectedUser.id}</span>
                </div>

                <div className="user-detail-item">
                  <span className="user-detail-label">Department / Unit:</span>
                  <span className="user-detail-value">{selectedUser.department || 'Email Security & Operations'}</span>
                </div>

                <div className="user-detail-item">
                  <span className="user-detail-label">Phone / Contact:</span>
                  <span className="user-detail-value">{selectedUser.phone || 'Not configured'}</span>
                </div>

                <div className="user-detail-item">
                  <span className="user-detail-label">Total Authentications:</span>
                  <span className="user-detail-value text-primary font-semibold">
                    {selectedUser.loginCount || 0} {selectedUser.loginCount === 1 ? 'session' : 'sessions'}
                  </span>
                </div>

                <div className="user-detail-item">
                  <span className="user-detail-label">Last Login Timestamp:</span>
                  <span className="user-detail-value">
                    {selectedUser.lastLogin
                      ? new Date(selectedUser.lastLogin).toLocaleString()
                      : 'Never logged in'}
                  </span>
                </div>

                <div className="user-detail-item">
                  <span className="user-detail-label">Last Login Client IP:</span>
                  <span className="user-detail-value font-mono text-xs">
                    {selectedUser.lastLoginIp || (selectedUser.lastLogin ? '127.0.0.1' : 'None')}
                  </span>
                </div>

                <div className="user-detail-item">
                  <span className="user-detail-label">Account Created:</span>
                  <span className="user-detail-value">
                    {selectedUser.createdAt
                      ? new Date(selectedUser.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Initial Provisioning'}
                  </span>
                </div>

                <div className="user-detail-item">
                  <span className="user-detail-label">Last Profile Update:</span>
                  <span className="user-detail-value">
                    {selectedUser.updatedAt
                      ? new Date(selectedUser.updatedAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'No changes'}
                  </span>
                </div>
              </div>

              <div className="user-detail-scope-box mt-3">
                <span className="user-detail-scope-title">🔐 Assigned Platform Capabilities:</span>
                <p className="user-detail-scope-desc">
                  {selectedUser.role === 'Super Admin'
                    ? 'Super Administrator: Full SOC administration, user directory governance, DFIR audit trails, platform settings, and all email threat analysis modules.'
                    : selectedUser.role === 'Security Analyst'
                    ? 'Security Analyst: Advanced threat hunting, header inspection, forensic report export, IP tracing, and incident triage.'
                    : selectedUser.role === 'Investigator'
                    ? 'Investigator: Digital forensics evidence collection, case management triage, threat hunting, and report generation.'
                    : 'Standard User: Basic email threat analysis (Email Analyzer, IP Geolocation Tracer, Case Management, Threat History Reports, and Mailbox Integration). Administrative modules are strictly restricted.'}
                </p>
              </div>

              <div className="modal-actions mt-4">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDetailModal(false);
                    openResetPassword(selectedUser);
                  }}
                >
                  🔑 Reset Password
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setShowDetailModal(false);
                    openEdit(selectedUser);
                  }}
                >
                  ✏️ Edit User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

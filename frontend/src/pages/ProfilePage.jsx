/**
 * Profile Page
 * View and update user profile, avatar, department, phone, and password.
 */

import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/Toast';

export default function ProfilePage() {
  const { user: authUser, updateUser } = useAuth();
  const [profile, setProfile] = useState(authUser || {});
  const [loading, setLoading] = useState(false);

  // Edit fields
  const [name, setName] = useState(authUser?.name || '');
  const [phone, setPhone] = useState(authUser?.phone || '');
  const [department, setDepartment] = useState(authUser?.department || '');
  const [bio, setBio] = useState(authUser?.bio || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.profile.get();
        if (res?.profile) {
          setProfile(res.profile);
          setName(res.profile.name || '');
          setPhone(res.profile.phone || '');
          setDepartment(res.profile.department || '');
          setBio(res.profile.bio || '');
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      }
    }
    loadProfile();
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.profile.update({
        name,
        phone,
        department,
        bio,
      });
      if (res?.profile) {
        setProfile(res.profile);
        updateUser(res.profile);
      }
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showToast('Please provide both current and new password.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'warning');
      return;
    }

    setPwdLoading(true);
    try {
      await api.profile.changePassword(currentPassword, newPassword);
      showToast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.message || 'Failed to change password.', 'error');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="page-header-card">
        <div className="page-header-info">
          <h2>👤 Analyst Identity & Credentials</h2>
          <p>Manage your account profile, assigned operational department, and security authentication credentials.</p>
        </div>
      </div>

      <div className="profile-layout-grid">
        {/* Left Column: Avatar & Role Card */}
        <div className="card profile-card">
          <div className="profile-avatar-large">
            {profile.avatar || 'AA'}
          </div>
          <h3 className="profile-user-name">{profile.name || 'Analyst'}</h3>
          <p className="profile-user-email font-mono">{profile.email}</p>
          <span className="badge badge-purple mt-2">{profile.role || 'Security Analyst'}</span>

          <div className="profile-meta-list mt-4">
            <div className="profile-meta-row">
              <span className="meta-label">Account Status:</span>
              <span className="badge badge-success">{profile.status?.toUpperCase() || 'ACTIVE'}</span>
            </div>
            <div className="profile-meta-row">
              <span className="meta-label">Department:</span>
              <span className="meta-val">{profile.department || 'DFIR Operations'}</span>
            </div>
            <div className="profile-meta-row">
              <span className="meta-label">Member Since:</span>
              <span className="meta-val">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '2026'}</span>
            </div>
            <div className="profile-meta-row">
              <span className="meta-label">Last Authenticated:</span>
              <span className="meta-val">{profile.lastLogin ? new Date(profile.lastLogin).toLocaleTimeString() : 'Current Session'}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile & Password */}
        <div className="profile-forms-column">
          {/* Edit Profile Details */}
          <div className="card">
            <div className="card-header">
              <h3>Edit Account Details</h3>
            </div>
            <form onSubmit={handleProfileSave} className="modal-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Operational Department</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Threat Intelligence"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Emergency Contact Phone</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Security Clearance / Bio</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Notes or operational role details..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary mt-2" disabled={loading}>
                {loading ? 'Saving Changes...' : 'Save Profile Details'}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="card">
            <div className="card-header">
              <h3>Change Password</h3>
            </div>
            <form onSubmit={handlePasswordChange} className="modal-form">
              <div className="form-group">
                <label>Current Password *</label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
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

                <div className="form-group">
                  <label>Confirm New Password *</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-secondary mt-2" disabled={pwdLoading}>
                {pwdLoading ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

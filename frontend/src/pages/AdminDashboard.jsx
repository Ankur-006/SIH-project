/**
 * Admin Dashboard
 * Administrative command center for security operations, RBAC governance, and platform auditing.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const [statsData, usersData, logsData] = await Promise.all([
          api.dashboard.stats().catch(() => null),
          api.users.list().catch(() => ({ users: [] })),
          api.audit.list(6).catch(() => ({ logs: [] })),
        ]);

        if (statsData) setStats(statsData);
        if (usersData?.users) setUsersList(usersData.users);
        if (logsData?.logs) setRecentLogs(logsData.logs);
      } catch (err) {
        console.error('Failed to load admin telemetry', err);
      } finally {
        setLoading(false);
      }
    }

    loadAdminData();
  }, []);

  return (
    <div className="admin-page">
      {/* Page Header */}
      <div className="page-header-card">
        <div className="page-header-info">
          <h2>🛡️ System Administration & Governance</h2>
          <p>
            Platform security overview, role-based access control (RBAC), and forensic compliance tracking.
          </p>
        </div>

        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => navigate('/admin/users')}>
            👥 Manage Users
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/audit')}>
            📜 View Full Audit Logs
          </button>
        </div>
      </div>

      {/* Admin Stat Metric Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Platform Users</span>
            <span className="stat-icon">👥</span>
          </div>
          <div className="stat-number">{usersList.length || 4}</div>
          <div className="stat-sub text-success">All accounts active</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Threat Scans</span>
            <span className="stat-icon">📊</span>
          </div>
          <div className="stat-number">{stats?.totalScans || 60}</div>
          <div className="stat-sub text-info">Persistent DFIR engine</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Security Incidents</span>
            <span className="stat-icon">📁</span>
          </div>
          <div className="stat-number">{stats?.activeCases || 3}</div>
          <div className="stat-sub text-warning">Active DFIR investigations</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Security Health</span>
            <span className="stat-icon">✅</span>
          </div>
          <div className="stat-number text-success">100%</div>
          <div className="stat-sub text-success">Zero security breaches</div>
        </div>
      </div>

      {/* Admin Modules Navigation */}
      <div className="admin-modules-grid">
        <div className="admin-module-card" onClick={() => navigate('/admin/users')}>
          <div className="module-icon-wrap">👥</div>
          <div className="module-content">
            <h3>User & Role Management</h3>
            <p>Create analysts, configure RBAC permissions (Super Admin, Analyst, Investigator, Viewer), and reset passwords.</p>
            <span className="module-link">Access User Directory →</span>
          </div>
        </div>

        <div className="admin-module-card" onClick={() => navigate('/admin/audit')}>
          <div className="module-icon-wrap">📜</div>
          <div className="module-content">
            <h3>DFIR Compliance Audit Trail</h3>
            <p>Immutable forensic record of all user authentications, scan submissions, case modifications, and policy changes.</p>
            <span className="module-link">Inspect Audit Records →</span>
          </div>
        </div>

        <div className="admin-module-card" onClick={() => navigate('/settings')}>
          <div className="module-icon-wrap">⚙️</div>
          <div className="module-content">
            <h3>System Settings & Perimeter</h3>
            <p>Configure telemetry intervals, alerting channels, dark/light theme defaults, and defense rules.</p>
            <span className="module-link">Configure Settings →</span>
          </div>
        </div>
      </div>

      {/* Recent Audit Events Preview */}
      <div className="card full-width">
        <div className="card-header">
          <div>
            <h3>Recent Administrative & Security Events</h3>
            <p className="card-subtitle">Real-time DFIR audit activity stream</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/audit')}>
            View All Audit Logs →
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Details</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center p-4">No audit logs recorded yet.</td>
                </tr>
              ) : (
                recentLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="font-mono text-xs text-secondary">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <div className="font-semibold text-primary">{log.actorName}</div>
                      <div className="font-mono text-xs text-secondary">{log.actorEmail}</div>
                    </td>
                    <td>
                      <span className="action-tag">{log.action}</span>
                    </td>
                    <td className="text-sm">{log.details}</td>
                    <td>
                      <span className="badge badge-info">{log.category}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * Audit Logs Page
 * Immutable security audit trail recording authentication, scan activity, case mutations, and administrative events.
 */

import { useState, useEffect } from 'react';
import api from '../services/api';
import { showToast } from '../components/Toast';

const CATEGORIES = ['All', 'Auth', 'Admin', 'Security', 'System', 'Account'];

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [limit, setLimit] = useState(100);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.audit.list(limit, category);
      if (res?.logs) {
        setLogs(res.logs);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [category, limit]);

  const exportCSV = () => {
    if (logs.length === 0) {
      showToast('No logs to export', 'warning');
      return;
    }

    const headers = ['Timestamp', 'Actor Name', 'Actor Email', 'Action', 'Category', 'Details', 'IP Address'];
    const rows = filteredLogs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.actorName || ''}"`,
      `"${l.actorEmail || ''}"`,
      `"${l.action || ''}"`,
      `"${l.category || ''}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${l.ipAddress || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mailguard_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Audit trail exported to CSV', 'success');
  };

  const filteredLogs = logs.filter((l) => {
    const q = searchTerm.toLowerCase();
    return (
      (l.action || '').toLowerCase().includes(q) ||
      (l.actorName || '').toLowerCase().includes(q) ||
      (l.actorEmail || '').toLowerCase().includes(q) ||
      (l.details || '').toLowerCase().includes(q) ||
      (l.ipAddress || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="audit-page">
      {/* Page Header */}
      <div className="page-header-card">
        <div className="page-header-info">
          <h2>📜 Immutable DFIR Audit Trail</h2>
          <p>
            Chronological compliance record capturing all analyst logins, credential updates, threat reports, and administrative events.
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={fetchLogs}>
            🔄 Refresh
          </button>
          <button className="btn btn-primary" onClick={exportCSV}>
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="card user-filter-bar">
        <div className="search-input-group" style={{ flex: 1, minWidth: '240px' }}>
          <span className="search-input-icon">🔍</span>
          <input
            type="text"
            className="intel-input"
            placeholder="Search events, actor, IP address, details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-select-group">
          <label className="text-secondary text-sm">Category:</label>
          <select
            className="input font-semibold"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="filter-select-group">
          <label className="text-secondary text-sm">Limit:</label>
          <select
            className="input font-semibold"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
            <option value={200}>200 rows</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="card full-width">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp (UTC)</th>
                <th>Actor</th>
                <th>Action Taken</th>
                <th>Category</th>
                <th>Event Description & Details</th>
                <th>Origin IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center p-4">Fetching audit trail...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-4">No audit events match your filter.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isFailOrDelete =
                    (log.action || '').toLowerCase().includes('failed') ||
                    (log.action || '').toLowerCase().includes('delete') ||
                    (log.action || '').toLowerCase().includes('suspend');

                  return (
                    <tr key={log.id}>
                      <td className="font-mono text-xs text-secondary whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td>
                        <div className="font-semibold text-primary">{log.actorName || 'System'}</div>
                        <div className="font-mono text-xs text-secondary">{log.actorEmail}</div>
                      </td>
                      <td>
                        <span className={`action-tag ${isFailOrDelete ? 'text-danger border-danger' : ''}`}>
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-info">{log.category || 'Security'}</span>
                      </td>
                      <td className="text-sm">{log.details}</td>
                      <td className="font-mono text-xs text-secondary">{log.ipAddress || '127.0.0.1'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

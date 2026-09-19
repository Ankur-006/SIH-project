/**
 * Notifications Page
 * Central hub for threat alerts, operational notifications, and security advisories.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { showToast } from '../components/Toast';

export default function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead, deleteNotification } = useNotifications();
  const [filterType, setFilterType] = useState('All');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const navigate = useNavigate();

  const handleMarkAll = async () => {
    await markAllRead();
    showToast('All notifications marked as read', 'success');
  };

  const filtered = notifications.filter((n) => {
    const matchType = filterType === 'All' || n.type === filterType.toLowerCase();
    const matchUnread = !showUnreadOnly || !n.read;
    return matchType && matchUnread;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'threat': return '🚨';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="notifications-page">
      {/* Page Header */}
      <div className="page-header-card">
        <div className="page-header-info">
          <h2>🔔 Notification & Alert Center</h2>
          <p>Real-time stream of intercepted email threats, IOC detections, and compliance alerts.</p>
        </div>

        <div className="page-header-actions">
          {notifications.length > 0 && (
            <button className="btn btn-secondary" onClick={handleMarkAll}>
              ✓ Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card user-filter-bar">
        <div className="btn-group">
          {['All', 'Threat', 'Warning', 'Info', 'Success'].map((t) => (
            <button
              key={t}
              className={`btn btn-sm ${filterType === t ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterType(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <label className="auth-checkbox">
          <input
            type="checkbox"
            checked={showUnreadOnly}
            onChange={(e) => setShowUnreadOnly(e.target.checked)}
          />
          <span className="auth-checkbox-mark" />
          Show Unread Only ({unreadCount})
        </label>
      </div>

      {/* Notifications List */}
      <div className="card full-width">
        {filtered.length === 0 ? (
          <div className="empty-state p-5 text-center">
            <span className="empty-icon">🔔</span>
            <div className="empty-title">No Notifications Found</div>
            <p className="text-secondary">No alerts match the selected criteria.</p>
          </div>
        ) : (
          <div className="notif-full-list">
            {filtered.map((notif) => (
              <div
                key={notif.id}
                className={`notif-full-item ${notif.read ? 'read' : 'unread'} ${notif.type || 'info'}`}
                onClick={() => {
                  if (!notif.read) markRead(notif.id);
                  if (notif.link) navigate(notif.link);
                }}
              >
                <div className="notif-full-icon">{getTypeIcon(notif.type)}</div>
                <div className="notif-full-content">
                  <div className="notif-full-header">
                    <span className="notif-full-title">{notif.title}</span>
                    {!notif.read && <span className="notif-unread-dot" />}
                    <span className="badge badge-secondary ml-auto">
                      {new Date(notif.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="notif-full-msg">{notif.message}</p>
                  {notif.link && (
                    <span className="text-primary text-xs font-semibold">Inspect artifact →</span>
                  )}
                </div>
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notif.id);
                  }}
                  title="Dismiss notification"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

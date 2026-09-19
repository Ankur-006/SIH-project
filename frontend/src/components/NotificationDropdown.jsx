/**
 * Notification Dropdown Component
 * Displays live notifications, threat alerts, mark-as-read controls, and links.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead, deleteNotification } = useNotifications();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (notif) => {
    if (!notif.read) {
      markRead(notif.id);
    }
    if (notif.link) {
      setOpen(false);
      navigate(notif.link);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'threat':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const formatTimestamp = (isoStr) => {
    if (!isoStr) return 'Just now';
    try {
      const date = new Date(isoStr);
      const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHrs = Math.floor(diffMin / 60);
      if (diffHrs < 24) return `${diffHrs}h ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="notification-dropdown-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className="topbar-icon-btn"
        onClick={() => setOpen(!open)}
        title="Security Notifications"
        aria-label="Notifications"
      >
        <span className="notif-bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="topbar-notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notifications-popover">
          <div className="notif-header">
            <div className="notif-title-row">
              <span className="notif-header-title">Notifications</span>
              {unreadCount > 0 && <span className="notif-unread-tag">{unreadCount} new</span>}
            </div>
            {notifications.length > 0 && (
              <button className="notif-mark-all-btn" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty-state">
                <span className="notif-empty-icon">🔔</span>
                <p>No new notifications</p>
                <span>All security channels clear</span>
              </div>

            ) : (
              notifications.slice(0, 8).map((notif) => (
                <div
                  key={notif.id}
                  className={`notif-item ${notif.read ? 'read' : 'unread'} ${notif.type || 'info'}`}
                  onClick={() => handleItemClick(notif)}
                >
                  <div className="notif-type-icon">{getTypeIcon(notif.type)}</div>
                  <div className="notif-content">
                    <div className="notif-content-title">
                      <span>{notif.title}</span>
                      {!notif.read && <span className="notif-unread-dot" />}
                    </div>
                    <div className="notif-content-body">{notif.message}</div>
                    <div className="notif-content-meta">
                      <span>{formatTimestamp(notif.timestamp)}</span>
                      {notif.link && <span className="notif-link-hint">Click to inspect →</span>}
                    </div>
                  </div>
                  <button
                    className="notif-dismiss-btn"
                    title="Dismiss notification"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notif.id);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="notif-footer">
            <button
              className="notif-view-all-btn"
              onClick={() => {
                setOpen(false);
                navigate('/notifications');
              }}
            >
              View all notifications in Notification Center →
            </button>

          </div>
        </div>
      )}
    </div>
  );
}

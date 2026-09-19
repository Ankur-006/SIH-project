/**
 * Sidebar Navigation Component
 * Modern enterprise sidebar with spacious layout, clean typography, and RBAC visibility.
 */

import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useEmail } from '../context/EmailContext';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { inboxConnected, inboxEmail } = useEmail();
  const { user, setShowLogoutModal, hasRole } = useAuth();

  const isAdminOrAnalyst = hasRole(['Super Admin', 'Security Analyst']);

  const navItems = [
    { section: 'Overview' },
    { path: '/', icon: '📊', label: 'Dashboard' },

    { section: 'Threat Intelligence' },
    { path: '/analyze', icon: '🔍', label: 'Email Analyzer' },
    { path: '/domain-intel', icon: '🌐', label: 'Domain Intel' },
    { path: '/url-intel', icon: '🔗', label: 'URL Scanner' },
    { path: '/geo-tracer', icon: '🌍', label: 'IP Intelligence' },
    { path: '/reports', icon: '📋', label: 'Threat History' },

    { section: 'Mailbox & Investigations' },
    { path: '/login', icon: '📬', label: inboxConnected ? 'Mailbox Status' : 'Connect Mailbox' },
    ...(inboxConnected ? [{ path: '/inbox', icon: '🛡️', label: 'Inbox Telemetry' }] : []),
    { path: '/cases', icon: '📁', label: 'Case Management' },

    ...(isAdminOrAnalyst
      ? [
          { section: 'Administration' },
          { path: '/admin', icon: '🛡️', label: 'Admin Panel' },
          { path: '/admin/users', icon: '👥', label: 'User Directory' },
          { path: '/admin/audit', icon: '📜', label: 'Audit Trail' },
        ]
      : []),

    { section: 'System' },
    { path: '/help', icon: '❓', label: 'Documentation' },
    { path: '/settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon">🛡️</div>
        {!collapsed && (
          <div className="brand-text">
            <h2>MailGuard</h2>
            <span className="brand-subtitle">Email Security Platform</span>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        {navItems.map((item, index) => {
          if (item.section) {
            if (collapsed) return null;
            return (
              <div key={`section-${index}`} className="sidebar-section-label">
                {item.section}
              </div>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
              {!collapsed && item.badge && <span className="nav-badge">{item.badge}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Status & Profile */}
      <div className="sidebar-user-section">
        {!collapsed && (
          <>
            {inboxConnected ? (
              <div className="sidebar-connection-status" title={`Connected to ${inboxEmail}`}>
                <span className="sidebar-status-dot connected" />
                <span className="sidebar-status-text truncate">{inboxEmail}</span>
              </div>
            ) : (
              <div className="sidebar-connection-status">
                <span className="sidebar-status-dot online" />
                <span className="sidebar-status-text">System Online • Protected</span>
              </div>
            )}

            <div className="sidebar-user-profile">
              <div className="sidebar-user-avatar">{user?.avatar || 'AA'}</div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user?.name || 'Analyst'}</span>
                <span className="sidebar-user-role">{user?.role || 'Security Analyst'}</span>
              </div>
            </div>

            <button
              type="button"
              className="sidebar-signout-btn"
              onClick={() => setShowLogoutModal(true)}
              title="Sign Out"
            >
              <span className="sidebar-signout-icon">⏻</span>
              <span className="sidebar-signout-text">Sign Out</span>
            </button>
          </>
        )}

        {collapsed && (
          <button
            type="button"
            className="sidebar-collapsed-signout"
            onClick={() => setShowLogoutModal(true)}
            title="Sign Out"
          >
            ⏻
          </button>
        )}
      </div>

      {/* Collapse Toggle */}
      <div className="sidebar-toggle">
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>
    </aside>
  );
}

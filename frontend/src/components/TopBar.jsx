/**
 * Top Navigation Bar Component
 * Live navigation topbar with global search, notification center, dark mode toggle, and profile controls.
 */

import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import ThemeToggle from './ThemeToggle';
import SearchModal from './SearchModal';

const PAGE_TITLES = {
  '/': { title: 'Dashboard', subtitle: 'Live threat telemetry and incident overview' },
  '/analyze': { title: 'Email Analyzer', subtitle: 'RFC 822 forensic inspection & header analysis' },
  '/geo-tracer': { title: 'IP Intelligence', subtitle: 'IP routing intelligence & hop geolocation' },
  '/domain-intel': { title: 'Domain Intelligence', subtitle: 'WHOIS reputation, TLD threat, and typosquatting detection' },
  '/url-intel': { title: 'URL Intelligence', subtitle: 'Deep link inspection, homograph attacks & malicious redirects' },
  '/cases': { title: 'Case Management', subtitle: 'DFIR incident investigation and evidence handling' },
  '/reports': { title: 'Threat History', subtitle: 'Exportable threat documentation and forensic reports' },
  '/inbox': { title: 'Inbox Security', subtitle: 'Live IMAP automated mailbox inspection' },
  '/login': { title: 'Connect Mailbox', subtitle: 'Integrate external IMAP mailbox for automated email security monitoring' },
  '/admin': { title: 'System Administration', subtitle: 'Platform health, user access, and telemetry overview' },
  '/admin/users': { title: 'User Management', subtitle: 'RBAC identity administration and access control' },
  '/admin/audit': { title: 'Audit Trail', subtitle: 'Immutable security event logs & compliance audit history' },
  '/profile': { title: 'Analyst Profile', subtitle: 'Manage identity credentials and contact information' },
  '/settings': { title: 'System Settings', subtitle: 'Configure theme, alerts, and platform behavior' },
  '/help': { title: 'Knowledge Base', subtitle: 'Documentation, DFIR playbooks, and keyboard shortcuts' },
  '/notifications': { title: 'Notification Center', subtitle: 'Security alerts, threat advisories, and system notifications' },
};

export default function TopBar() {
  const { user, setShowLogoutModal, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Match route title
  let currentTitle = { title: 'MailGuard', subtitle: 'Advanced Threat Defense Platform' };
  if (PAGE_TITLES[location.pathname]) {
    currentTitle = PAGE_TITLES[location.pathname];
  } else if (location.pathname.startsWith('/threat/')) {
    currentTitle = { title: 'Threat Investigation', subtitle: 'In-depth artifact analysis and incident triage' };
  }


  // Global Ctrl+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    setDropdownOpen(false);
    setShowLogoutModal(true);
  };

  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  return (
    <>
      <header className="topbar">
        {/* Left: Page Title & Breadcrumb */}
        <div className="topbar-left">
          <div className="topbar-title-group">
            <h1 className="topbar-title">{currentTitle.title}</h1>
            <span className="topbar-subtitle">{currentTitle.subtitle}</span>
          </div>
        </div>

        {/* Center: Global Search Trigger Button */}
        <div className="topbar-center">
          <button
            type="button"
            className="topbar-search-trigger"
            onClick={() => setSearchModalOpen(true)}
            title="Search IOCs, emails, domains, cases (Ctrl+K)"
          >
            <span className="topbar-search-icon">🔍</span>
            <span className="topbar-search-placeholder">Quick search IOCs, threats, cases, IPs...</span>
            <kbd className="topbar-search-kbd">{isMac ? '⌘K' : 'Ctrl+K'}</kbd>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="topbar-right">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications Dropdown */}
          <NotificationDropdown />

          {/* User Profile Dropdown */}
          <div className="topbar-user" ref={dropdownRef}>
            <button
              type="button"
              className="topbar-user-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-label="User menu"
            >
              <div className="topbar-avatar">
                {user?.avatar || 'AA'}
              </div>
              <div className="topbar-user-info">
                <span className="topbar-user-name">{user?.name || 'Analyst'}</span>
                <span className="topbar-user-role">{user?.role || 'Security Analyst'}</span>
              </div>
              <span className={`topbar-chevron ${dropdownOpen ? 'open' : ''}`}>▾</span>
            </button>

            {dropdownOpen && (
              <div className="topbar-dropdown">
                <div className="topbar-dropdown-header">
                  <div className="topbar-dropdown-avatar">
                    {user?.avatar || 'AA'}
                  </div>
                  <div className="topbar-dropdown-user-details">
                    <div className="topbar-dropdown-name">{user?.name || 'Security Analyst'}</div>
                    <div className="topbar-dropdown-email">{user?.email || 'analyst@mailguard.com'}</div>
                    <span className="topbar-dropdown-role-pill">{user?.role || 'Analyst'}</span>
                  </div>
                </div>

                <div className="topbar-dropdown-divider" />

                <button
                  className="topbar-dropdown-item"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/profile');
                  }}
                >
                  <span>👤</span> My Profile
                </button>

                <button
                  className="topbar-dropdown-item"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/settings');
                  }}
                >
                  <span>⚙️</span> System Settings
                </button>

                {hasRole(['Super Admin', 'Security Analyst']) && (
                  <button
                    className="topbar-dropdown-item"
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/admin');
                    }}
                  >
                    <span>🛡️</span> Admin Panel
                  </button>
                )}


                <button
                  className="topbar-dropdown-item"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/help');
                  }}
                >
                  <span>❓</span> Help & Documentation
                </button>

                <div className="topbar-dropdown-divider" />

                <button className="topbar-dropdown-item topbar-dropdown-signout" onClick={handleSignOut}>
                  <span>⏻</span> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </>
  );
}

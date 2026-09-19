/**
 * Logout Confirmation Modal
 * Premium glassmorphic dialog with animated entrance,
 * user info display, and cancel/sign-out actions.
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LogoutModal() {
  const { user, showLogoutModal, setShowLogoutModal, logout } = useAuth();
  const modalRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!showLogoutModal) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowLogoutModal(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showLogoutModal, setShowLogoutModal]);

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowLogoutModal(false);
    }
  };

  if (!showLogoutModal) return null;

  return (
    <div className="logout-modal-backdrop" onClick={handleBackdropClick}>
      <div className="logout-modal" ref={modalRef}>
        {/* Decorative top accent */}
        <div className="logout-modal-accent" />

        {/* User Avatar */}
        <div className="logout-modal-avatar">
          <div className="logout-avatar-circle">
            {user?.avatar || '👤'}
          </div>
          <div className="logout-avatar-pulse" />
        </div>

        {/* Content */}
        <div className="logout-modal-content">
          <h3>Sign Out</h3>
          <p className="logout-modal-name">{user?.name || 'User'}</p>
          <p className="logout-modal-desc">
            Are you sure you want to sign out of MailGuard? You'll need to log in again to access your dashboard.
          </p>
        </div>

        {/* Session Info */}
        <div className="logout-modal-session">
          <div className="logout-session-item">
            <span className="logout-session-icon">📧</span>
            <span>{user?.email || 'user@mailguard.com'}</span>
          </div>
          <div className="logout-session-item">
            <span className="logout-session-icon">🔐</span>
            <span>{user?.role || 'Analyst'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="logout-modal-actions">
          <button
            className="logout-btn-cancel"
            onClick={() => setShowLogoutModal(false)}
          >
            Cancel
          </button>
          <button
            className="logout-btn-confirm"
            onClick={logout}
          >
            <span className="logout-btn-icon">⏻</span>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

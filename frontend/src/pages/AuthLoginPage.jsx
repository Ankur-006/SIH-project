/**
 * Auth Login Page
 * Beautiful full-page authentication screen with animated gradient hero,
 * glassmorphic form, and demo credential hints.
 * Separate from the IMAP inbox connection login.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthLoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, authError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shakeForm, setShakeForm] = useState(false);

  const [selectedRole, setSelectedRole] = useState('admin');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const selectRole = (role) => {
    setSelectedRole(role);
    if (role === 'admin') {
      setEmail('admin@mailguard.com');
      setPassword('admin123');
    } else {
      setEmail('user@mailguard.com');
      setPassword('user123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Small delay for animation feel
    await new Promise((r) => setTimeout(r, 600));

    const success = await login(email, password);
    setIsSubmitting(false);

    if (success) {
      navigate('/', { replace: true });
    } else {
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);
    }
  };


  return (
    <div className="auth-page">
      {/* Left Hero Panel */}
      <div className="auth-hero">
        <div className="auth-hero-bg">
          <div className="auth-hero-orb auth-hero-orb-1" />
          <div className="auth-hero-orb auth-hero-orb-2" />
          <div className="auth-hero-orb auth-hero-orb-3" />
        </div>

        <div className="auth-hero-content">
          <div className="auth-hero-logo">
            <div className="auth-hero-shield">🛡️</div>
            <h1>MailGuard</h1>
            <span className="auth-hero-badge">AI-Powered Security</span>
          </div>

          <p className="auth-hero-tagline">
            Advanced Email Threat Detection Platform
          </p>

          <div className="auth-hero-features">
            <div className="auth-hero-feature">
              <div className="auth-feature-icon">🔍</div>
              <div>
                <strong>6-Vector Analysis</strong>
                <p>Headers, links, NLP, auth, IP & domain scoring</p>
              </div>
            </div>
            <div className="auth-hero-feature">
              <div className="auth-feature-icon">⚡</div>
              <div>
                <strong>Real-Time Detection</strong>
                <p>Instant phishing, spoofing & BEC identification</p>
              </div>
            </div>
            <div className="auth-hero-feature">
              <div className="auth-feature-icon">🌍</div>
              <div>
                <strong>Global IP Intelligence</strong>
                <p>Geolocation mapping & risk assessment</p>
              </div>
            </div>
            <div className="auth-hero-feature">
              <div className="auth-feature-icon">📋</div>
              <div>
                <strong>Forensic Reporting</strong>
                <p>Detailed evidence for investigations</p>
              </div>
            </div>
          </div>

          {/* Stat area kept empty as requested */}
          <div className="auth-hero-stats" />
        </div>

        {/* Floating particles */}
        <div className="auth-particles">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`auth-particle auth-particle-${i + 1}`} />
          ))}
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-form-panel">
        <div className={`auth-form-wrapper ${shakeForm ? 'shake' : ''}`}>
          {/* Mobile logo */}
          <div className="auth-mobile-logo">
            <span>🛡️</span>
            <h2>MailGuard</h2>
          </div>

          <div className="auth-form-header">
            <h2>Welcome back</h2>
            <p>Sign in to your MailGuard account</p>
          </div>

          {/* Dual Role Selector: Admin or Standard User */}
          <div className="auth-role-tabs">
            <button
              type="button"
              className={`auth-role-tab ${selectedRole === 'admin' ? 'active' : ''}`}
              onClick={() => selectRole('admin')}
            >
              🛡️ Administrator
            </button>
            <button
              type="button"
              className={`auth-role-tab ${selectedRole === 'user' ? 'active' : ''}`}
              onClick={() => selectRole('user')}
            >
              👤 Standard User
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Email */}
            <div className="auth-field">
              <label htmlFor="auth-email">Email Address</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">📧</span>
                <input
                  id="auth-email"
                  type="email"
                  placeholder={selectedRole === 'admin' ? 'admin@mailguard.com' : 'user@mailguard.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="auth-password">Password</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">🔒</span>
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Options Row (Forgot password removed) */}
            <div className="auth-options">
              <label className="auth-checkbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="auth-checkbox-mark" />
                Remember me
              </label>
            </div>

            {/* Error */}
            {authError && (
              <div className="auth-error">
                <span>⚠️</span>
                <p>{authError}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="auth-submit"
              disabled={isSubmitting || !email || !password}
            >
              {isSubmitting ? (
                <span className="auth-submit-loading">
                  <span className="auth-spinner" />
                  Signing in...
                </span>
              ) : (
                <>
                  <span>🔐</span> Sign In as {selectedRole === 'admin' ? 'Admin' : 'User'}
                </>
              )}
            </button>
          </form>

          {/* Demo Hint with both Admin and User Options */}
          <div className="auth-demo-hint">
            <div className="auth-demo-title">
              <span>💡</span> One-Click Demo Logins
            </div>
            <div className="auth-demo-credentials-grid">
              <div
                className={`auth-demo-role-card ${selectedRole === 'admin' ? 'selected' : ''}`}
                onClick={() => selectRole('admin')}
              >
                <div className="auth-demo-card-top">
                  <span className="auth-demo-role-pill admin">🛡️ Admin</span>
                  <span className="auth-demo-click-hint">Click to Fill</span>
                </div>
                <div className="auth-demo-account-info">
                  <code>admin@mailguard.com</code>
                  <span className="auth-demo-scope">Full Admin & User Directory</span>
                </div>
              </div>

              <div
                className={`auth-demo-role-card ${selectedRole === 'user' ? 'selected' : ''}`}
                onClick={() => selectRole('user')}
              >
                <div className="auth-demo-card-top">
                  <span className="auth-demo-role-pill user">👤 User</span>
                  <span className="auth-demo-click-hint">Click to Fill</span>
                </div>
                <div className="auth-demo-account-info">
                  <code>user@mailguard.com</code>
                  <span className="auth-demo-scope">Email Analyzer, IP, Cases, Reports</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="auth-form-footer">
            <p>Protected by MailGuard AI Security Engine</p>
          </div>
        </div>
      </div>
    </div>
  );
}

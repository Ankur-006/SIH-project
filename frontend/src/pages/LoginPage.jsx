/**
 * Login Page
 * Premium-designed email connection page where users enter their
 * email credentials to connect via IMAP and auto-scan their inbox.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmail } from '../context/EmailContext';

// Common IMAP host auto-detection
const PROVIDER_INFO = {
  'gmail.com':       { host: 'imap.gmail.com',           name: 'Gmail',     icon: '📧', color: '#EA4335' },
  'googlemail.com':  { host: 'imap.gmail.com',           name: 'Gmail',     icon: '📧', color: '#EA4335' },
  'outlook.com':     { host: 'outlook.office365.com',    name: 'Outlook',   icon: '📬', color: '#0078D4' },
  'hotmail.com':     { host: 'outlook.office365.com',    name: 'Hotmail',   icon: '📬', color: '#0078D4' },
  'live.com':        { host: 'outlook.office365.com',    name: 'Live',      icon: '📬', color: '#0078D4' },
  'yahoo.com':       { host: 'imap.mail.yahoo.com',      name: 'Yahoo',     icon: '📨', color: '#6001D2' },
  'yahoo.in':        { host: 'imap.mail.yahoo.com',      name: 'Yahoo',     icon: '📨', color: '#6001D2' },
  'yahoo.co.in':     { host: 'imap.mail.yahoo.com',      name: 'Yahoo',     icon: '📨', color: '#6001D2' },
  'icloud.com':      { host: 'imap.mail.me.com',         name: 'iCloud',    icon: '☁️', color: '#999' },
  'zoho.com':        { host: 'imap.zoho.com',            name: 'Zoho',      icon: '✉️', color: '#D32F2F' },
  'protonmail.com':  { host: '127.0.0.1',                name: 'ProtonMail',icon: '🔒', color: '#6D4AFF' },
  'proton.me':       { host: '127.0.0.1',                name: 'ProtonMail',icon: '🔒', color: '#6D4AFF' },
  'yandex.com':      { host: 'imap.yandex.com',          name: 'Yandex',    icon: '📮', color: '#FF0000' },
  'rediffmail.com':  { host: 'imap.rediffmail.com',      name: 'Rediffmail',icon: '📩', color: '#E53935' },
};

function getProviderFromEmail(email) {
  if (!email || !email.includes('@')) return null;
  const domain = email.split('@')[1]?.toLowerCase();
  return PROVIDER_INFO[domain] || null;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { connectInbox, inboxConnected, inboxScanning, inboxProgress, inboxError, inboxEmail } = useEmail();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [imapServer, setImapServer] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [maxEmails, setMaxEmails] = useState(30);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localError, setLocalError] = useState('');

  // Redirect if already connected
  useEffect(() => {
    if (inboxConnected) {
      navigate('/inbox');
    }
  }, [inboxConnected, navigate]);

  // Auto-detect IMAP server when email changes
  const provider = getProviderFromEmail(email);
  useEffect(() => {
    if (provider) {
      setImapServer(provider.host);
    } else if (email.includes('@')) {
      const domain = email.split('@')[1];
      setImapServer(`imap.${domain}`);
    }
  }, [email, provider]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !email.includes('@')) {
      setLocalError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setLocalError('Please enter your app password');
      return;
    }

    try {
      await connectInbox(email, password, imapServer || undefined, maxEmails);
      // On success, the useEffect above will redirect to /inbox
    } catch (err) {
      // Error is already set in context via INBOX_ERROR
    }
  };

  const displayError = localError || inboxError;

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left Panel — Branding */}
        <div className="login-hero">
          <div className="login-hero-content">
            <div className="login-hero-icon">🛡️</div>
            <h1>MailGuard</h1>
            <p className="login-hero-tagline">Protect Your Inbox from Threats</p>
            <div className="login-hero-features">
              <div className="login-feature">
                <span className="login-feature-icon">🔍</span>
                <div>
                  <strong>Deep Email Scanning</strong>
                  <p>Analyzes headers, links, NLP patterns & sender reputation</p>
                </div>
              </div>
              <div className="login-feature">
                <span className="login-feature-icon">⚡</span>
                <div>
                  <strong>Instant Threat Detection</strong>
                  <p>Scans your latest emails in seconds with 6-vector analysis</p>
                </div>
              </div>
              <div className="login-feature">
                <span className="login-feature-icon">🔒</span>
                <div>
                  <strong>Privacy First</strong>
                  <p>Credentials are never stored — used only during the scan</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel — Form */}
        <div className="login-form-panel">
          <div className="login-form-wrapper">
            <div className="login-form-header">
              <h2>Connect Your Inbox</h2>
              <p>Sign in to scan your emails for phishing threats</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              {/* Email Input */}
              <div className="login-field">
                <label htmlFor="login-email">Email Address</label>
                <div className="login-input-group">
                  {provider && (
                    <span className="login-provider-badge" style={{ color: provider.color }}>
                      {provider.icon} {provider.name}
                    </span>
                  )}
                  <input
                    id="login-email"
                    type="email"
                    placeholder="you@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={inboxScanning}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="login-field">
                <label htmlFor="login-password">
                  App Password
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="login-help-link"
                  >
                    How to get one?
                  </a>
                </label>
                <div className="login-input-group login-password-group">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your app password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={inboxScanning}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-toggle-pw"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Advanced Settings Toggle */}
              <button
                type="button"
                className="login-advanced-toggle"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? '▾' : '▸'} Advanced Settings
              </button>

              {showAdvanced && (
                <div className="login-advanced">
                  <div className="login-field">
                    <label htmlFor="login-imap">IMAP Server</label>
                    <input
                      id="login-imap"
                      type="text"
                      placeholder="imap.example.com"
                      value={imapServer}
                      onChange={(e) => setImapServer(e.target.value)}
                      disabled={inboxScanning}
                    />
                  </div>
                  <div className="login-field">
                    <label htmlFor="login-max">Emails to Scan</label>
                    <input
                      id="login-max"
                      type="number"
                      min={1}
                      max={50}
                      value={maxEmails}
                      onChange={(e) => setMaxEmails(Math.min(50, Math.max(1, Number(e.target.value))))}
                      disabled={inboxScanning}
                    />
                  </div>
                </div>
              )}

              {/* Error Display */}
              {displayError && (
                <div className="login-error">
                  <span>⚠️</span>
                  <p>{displayError}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="login-submit"
                disabled={inboxScanning || !email || !password}
              >
                {inboxScanning ? (
                  <span className="login-submit-scanning">
                    <span className="login-spinner" />
                    {inboxProgress || 'Connecting...'}
                  </span>
                ) : (
                  <>🔍 Connect & Scan Inbox</>
                )}
              </button>
            </form>

            {/* Provider Help Cards */}
            <div className="login-provider-help">
              <h3>How to get an App Password</h3>
              <div className="login-provider-cards">
                <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="provider-card">
                  <span style={{ color: '#EA4335' }}>📧</span>
                  <div>
                    <strong>Gmail</strong>
                    <p>Google Account → Security → App Passwords</p>
                  </div>
                </a>
                <a href="https://account.live.com/proofs/AppPassword" target="_blank" rel="noopener noreferrer" className="provider-card">
                  <span style={{ color: '#0078D4' }}>📬</span>
                  <div>
                    <strong>Outlook</strong>
                    <p>Microsoft Account → Security → App Passwords</p>
                  </div>
                </a>
                <a href="https://login.yahoo.com/account/security" target="_blank" rel="noopener noreferrer" className="provider-card">
                  <span style={{ color: '#6001D2' }}>📨</span>
                  <div>
                    <strong>Yahoo</strong>
                    <p>Yahoo Account → Security → App Password</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

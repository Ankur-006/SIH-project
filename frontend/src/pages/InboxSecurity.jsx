/**
 * Inbox Security Page
 * Displays auto-scan results after connecting inbox via IMAP.
 * Shows all emails sorted by threat score with filter controls.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmail } from '../context/EmailContext';
import ThreatGauge from '../components/ThreatGauge';

function getScoreClass(score) {
  if (score >= 75) return 'critical';
  if (score >= 55) return 'high';
  if (score >= 35) return 'medium';
  if (score >= 15) return 'low';
  return 'safe';
}

function getScoreLabel(score) {
  if (score >= 75) return 'Critical';
  if (score >= 55) return 'High Risk';
  if (score >= 35) return 'Suspicious';
  if (score >= 15) return 'Low Risk';
  return 'Safe';
}

function getClassificationIcon(classification) {
  switch (classification) {
    case 'phishing': return '🎣';
    case 'fraud': return '💰';
    case 'impersonation': return '🎭';
    case 'suspicious': return '🔍';
    default: return '✅';
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    const now = new Date();
    const diffMs = now - d;
    const diffHrs = diffMs / (1000 * 60 * 60);
    if (diffHrs < 1) return `${Math.round(diffMs / (1000 * 60))}m ago`;
    if (diffHrs < 24) return `${Math.round(diffHrs)}h ago`;
    if (diffHrs < 48) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function InboxSecurity() {
  const navigate = useNavigate();
  const {
    inboxConnected,
    inboxEmail,
    inboxEmails,
    inboxScanning,
    inboxProgress,
    disconnectInbox,
    dispatch,
  } = useEmail();

  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect to login if not connected
  useEffect(() => {
    if (!inboxConnected && !inboxScanning) {
      navigate('/login');
    }
  }, [inboxConnected, inboxScanning, navigate]);

  // If still scanning, show progress
  if (inboxScanning) {
    return (
      <div className="inbox-scanning-overlay">
        <div className="inbox-scanning-card">
          <div className="inbox-scanning-spinner" />
          <h2>Scanning Your Inbox</h2>
          <p className="inbox-scanning-step">{inboxProgress || 'Connecting...'}</p>
          <div className="inbox-scanning-bar">
            <div className="inbox-scanning-bar-fill" />
          </div>
          <p className="inbox-scanning-hint">
            This may take a minute depending on the number of emails.
            <br />Your credentials are not stored.
          </p>
        </div>
      </div>
    );
  }

  if (!inboxConnected) return null;

  // Stats
  const totalEmails = inboxEmails.length;
  const criticalCount = inboxEmails.filter(e => (e.threatAssessment?.threatScore || 0) >= 75).length;
  const highCount = inboxEmails.filter(e => {
    const s = e.threatAssessment?.threatScore || 0;
    return s >= 55 && s < 75;
  }).length;
  const suspiciousCount = inboxEmails.filter(e => {
    const s = e.threatAssessment?.threatScore || 0;
    return s >= 35 && s < 55;
  }).length;
  const safeCount = inboxEmails.filter(e => (e.threatAssessment?.threatScore || 0) < 35).length;
  const threatCount = criticalCount + highCount + suspiciousCount;

  // Filter
  let filtered = [...inboxEmails];
  if (filter === 'critical') filtered = filtered.filter(e => (e.threatAssessment?.threatScore || 0) >= 75);
  else if (filter === 'high') filtered = filtered.filter(e => { const s = e.threatAssessment?.threatScore || 0; return s >= 55 && s < 75; });
  else if (filter === 'suspicious') filtered = filtered.filter(e => { const s = e.threatAssessment?.threatScore || 0; return s >= 35 && s < 55; });
  else if (filter === 'safe') filtered = filtered.filter(e => (e.threatAssessment?.threatScore || 0) < 35);

  // Search
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(e => {
      const subject = (e.parsed?.subject || '').toLowerCase();
      const from = (e.parsed?.from?.email || '').toLowerCase();
      const fromName = (e.parsed?.from?.name || '').toLowerCase();
      return subject.includes(q) || from.includes(q) || fromName.includes(q);
    });
  }

  const handleEmailClick = (email) => {
    dispatch({ type: 'SET_CURRENT_ANALYSIS', payload: email });
    navigate('/reports');
  };

  const handleDisconnect = () => {
    disconnectInbox();
    navigate('/login');
  };

  return (
    <div className="inbox-page">
      {/* Header */}
      <div className="inbox-header">
        <div className="inbox-header-left">
          <h1>📬 Inbox Security Scan</h1>
          <p>
            Connected as <strong>{inboxEmail}</strong>
          </p>
        </div>
        <div className="inbox-header-actions">
          <button className="btn-outline" onClick={() => navigate('/login')}>
            🔄 Re-scan
          </button>
          <button className="btn-outline btn-danger-outline" onClick={handleDisconnect}>
            ⏏ Disconnect
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="inbox-stats">
        <div className="inbox-stat-card">
          <div className="inbox-stat-number">{totalEmails}</div>
          <div className="inbox-stat-label">Emails Scanned</div>
        </div>
        <div className="inbox-stat-card inbox-stat-critical">
          <div className="inbox-stat-number">{criticalCount}</div>
          <div className="inbox-stat-label">Critical Threats</div>
        </div>
        <div className="inbox-stat-card inbox-stat-high">
          <div className="inbox-stat-number">{highCount}</div>
          <div className="inbox-stat-label">High Risk</div>
        </div>
        <div className="inbox-stat-card inbox-stat-suspicious">
          <div className="inbox-stat-number">{suspiciousCount}</div>
          <div className="inbox-stat-label">Suspicious</div>
        </div>
        <div className="inbox-stat-card inbox-stat-safe">
          <div className="inbox-stat-number">{safeCount}</div>
          <div className="inbox-stat-label">Safe</div>
        </div>
      </div>

      {/* Threat Summary Banner */}
      {threatCount > 0 && (
        <div className="inbox-threat-banner">
          <span>⚠️</span>
          <p>
            <strong>{threatCount} potential threat{threatCount > 1 ? 's' : ''} detected</strong> in your inbox.
            Review the flagged emails below and exercise caution.
          </p>
        </div>
      )}
      {threatCount === 0 && totalEmails > 0 && (
        <div className="inbox-safe-banner">
          <span>✅</span>
          <p>
            <strong>Your inbox looks clean!</strong> All {totalEmails} scanned emails passed our security checks.
          </p>
        </div>
      )}

      {/* Filter Bar */}
      <div className="inbox-filter-bar">
        <div className="inbox-filters">
          <button className={`inbox-filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            All ({totalEmails})
          </button>
          <button className={`inbox-filter-btn filter-critical ${filter === 'critical' ? 'active' : ''}`} onClick={() => setFilter('critical')}>
            🚨 Critical ({criticalCount})
          </button>
          <button className={`inbox-filter-btn filter-high ${filter === 'high' ? 'active' : ''}`} onClick={() => setFilter('high')}>
            ⚠️ High ({highCount})
          </button>
          <button className={`inbox-filter-btn filter-suspicious ${filter === 'suspicious' ? 'active' : ''}`} onClick={() => setFilter('suspicious')}>
            🔍 Suspicious ({suspiciousCount})
          </button>
          <button className={`inbox-filter-btn filter-safe ${filter === 'safe' ? 'active' : ''}`} onClick={() => setFilter('safe')}>
            ✅ Safe ({safeCount})
          </button>
        </div>
        <div className="inbox-search">
          <input
            type="text"
            placeholder="Search by subject or sender..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Email Cards */}
      <div className="inbox-email-list">
        {filtered.length === 0 && (
          <div className="inbox-empty">
            <span>📭</span>
            <p>No emails match the current filter.</p>
          </div>
        )}

        {filtered.map((email) => {
          const score = email.threatAssessment?.threatScore || 0;
          const classification = email.threatAssessment?.classification || 'legitimate';
          const scoreClass = getScoreClass(score);
          const subject = email.parsed?.subject || '(No Subject)';
          const fromName = email.parsed?.from?.name || '';
          const fromEmail = email.parsed?.from?.email || 'Unknown sender';
          const date = email.parsed?.date || email.timestamp;
          const recommendation = email.threatAssessment?.recommendation || '';

          return (
            <div
              key={email.id}
              className={`inbox-email-card inbox-card-${scoreClass}`}
              onClick={() => handleEmailClick(email)}
            >
              <div className="inbox-card-score">
                <div className={`inbox-score-circle inbox-score-${scoreClass}`}>
                  {score}
                </div>
                <span className="inbox-score-label">{getScoreLabel(score)}</span>
              </div>

              <div className="inbox-card-content">
                <div className="inbox-card-top">
                  <div className="inbox-card-sender">
                    <strong>{fromName || fromEmail}</strong>
                    {fromName && <span className="inbox-card-email">&lt;{fromEmail}&gt;</span>}
                  </div>
                  <span className="inbox-card-date">{formatDate(date)}</span>
                </div>
                <div className="inbox-card-subject">{subject}</div>
                <div className="inbox-card-meta">
                  <span className={`inbox-tag inbox-tag-${scoreClass}`}>
                    {getClassificationIcon(classification)} {classification}
                  </span>
                  {email.linkResult?.highRiskLinks > 0 && (
                    <span className="inbox-meta-badge">🔗 {email.linkResult.highRiskLinks} risky link{email.linkResult.highRiskLinks > 1 ? 's' : ''}</span>
                  )}
                  {email.headerAnomalies?.length > 0 && (
                    <span className="inbox-meta-badge">🏷️ {email.headerAnomalies.length} header anomal{email.headerAnomalies.length > 1 ? 'ies' : 'y'}</span>
                  )}
                  {email.authResult?.overallScore != null && email.authResult.overallScore < 50 && (
                    <span className="inbox-meta-badge">🔏 Auth failed</span>
                  )}
                </div>
                {score >= 35 && recommendation && (
                  <div className="inbox-card-recommendation">
                    {recommendation}
                  </div>
                )}
              </div>

              <div className="inbox-card-arrow">→</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

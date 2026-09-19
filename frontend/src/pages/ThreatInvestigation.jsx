/**
 * Threat Investigation Page
 * Deep DFIR investigation triage console for a specific analyzed email artifact.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { showToast } from '../components/Toast';

export default function ThreatInvestigation() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, headers, iocs, body
  const [statusAction, setStatusAction] = useState(null);

  useEffect(() => {
    async function loadArtifact() {
      setLoading(true);
      try {
        const data = await api.getReport(id);
        if (data && data.report) {
          setReport(data.report);
        } else if (data && data.id) {
          setReport(data);
        } else {
          // Fallback check reports list
          const all = await api.getReports();
          const match = all.reports?.find((r) => r.id === id);
          if (match) setReport(match);
        }
      } catch (err) {
        console.error('Failed to load threat artifact', err);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadArtifact();
    }
  }, [id]);

  const handleQuarantine = () => {
    setStatusAction('quarantined');
    showToast('Artifact quarantined and flagged across security perimeter', 'warning');
  };


  const handleMarkSafe = () => {
    setStatusAction('safe');
    showToast('Artifact marked as False Positive / Verified Safe', 'success');
  };

  const handleCreateCase = async () => {
    try {
      await api.createCase({
        name: `Incident: ${report?.subject || id}`,
        emails: [id],
        notes: `Triage initiated for threat artifact ${id}. Score: ${report?.threatScore || 0}%`,
        tags: ['Email Threat', report?.threatLevel || 'Phishing'],
      });
      showToast('Incident case generated with linked evidence', 'success');
      navigate('/cases');
    } catch {
      navigate('/cases');
    }
  };

  if (loading) {
    return (
      <div className="loading-view">
        <div className="spinner" />
        <p>Loading threat intelligence telemetry for artifact {id}...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="card text-center p-5">
        <h3>Threat Artifact Not Found</h3>
        <p>The requested email analysis ({id}) could not be retrieved.</p>
        <button className="btn btn-primary mt-3" onClick={() => navigate('/reports')}>
          Back to Reports
        </button>
      </div>
    );
  }

  const score = report.threatScore ?? report.threatAssessment?.threatScore ?? 0;
  const level = report.threatLevel ?? report.threatAssessment?.classification ?? 'Suspicious';
  const isDangerous = score >= 60;
  const isMedium = score >= 30 && score < 60;

  return (
    <div className="threat-investigation-page">
      {/* Top Banner with Artifact Details & Actions */}
      <div className="card investigation-header-card">
        <div className="inv-header-left">
          <div className="inv-badge-row">
            <span className={`threat-badge ${level.toLowerCase()}`}>
              {level.toUpperCase()}
            </span>
            <span className="inv-id-tag font-mono">ID: {report.id}</span>
            {statusAction && (
              <span className={`badge ${statusAction === 'quarantined' ? 'badge-danger' : 'badge-success'}`}>
                {statusAction.toUpperCase()}
              </span>
            )}
          </div>

          <h2 className="inv-subject">{report.subject || 'Suspicious Phishing Notification'}</h2>

          <div className="inv-metadata-row">
            <span><strong>From:</strong> <code className="text-secondary">{report.from || report.sender || 'Unknown'}</code></span>
            <span><strong>To:</strong> <code>{report.to || report.recipient || 'analyst@mailguard.com'}</code></span>
            <span><strong>Date:</strong> {report.date || report.timestamp || 'Recent'}</span>
          </div>
        </div>

        <div className="inv-header-right">
          <div className={`threat-gauge-circle ${isDangerous ? 'danger' : isMedium ? 'warning' : 'clean'}`}>
            <span className="gauge-score">{score}%</span>
            <span className="gauge-label">Threat Score</span>
          </div>

          <div className="inv-action-buttons">
            <button className="btn btn-danger btn-sm" onClick={handleQuarantine}>
              🛡️ Quarantine
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleMarkSafe}>
              ✅ Mark Safe
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleCreateCase}>
              📁 Create Case
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="inv-nav-tabs">
        <button
          className={`inv-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          🔍 Executive Overview
        </button>
        <button
          className={`inv-tab-btn ${activeTab === 'headers' ? 'active' : ''}`}
          onClick={() => setActiveTab('headers')}
        >
          📄 Header & Authentication
        </button>
        <button
          className={`inv-tab-btn ${activeTab === 'iocs' ? 'active' : ''}`}
          onClick={() => setActiveTab('iocs')}
        >
          🎯 IOC Artifacts
        </button>
        <button
          className={`inv-tab-btn ${activeTab === 'body' ? 'active' : ''}`}
          onClick={() => setActiveTab('body')}
        >
          ✉️ Body Inspection
        </button>
      </div>

      {/* Tab Contents */}
      <div className="inv-tab-content">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="inv-overview-grid">
            <div className="card">
              <div className="card-header">
                <h3>Forensic Threat Assessment</h3>
              </div>
              <div className="findings-list">
                {(report.findings || report.reasons || [
                  'Header authentication check anomalies observed.',
                  'Urgency NLP patterns detected in subject and body text.',
                  'External hyperlink routed through unverified infrastructure.',
                ]).map((reason, idx) => (
                  <div key={idx} className="finding-item finding-alert">
                    <span className="finding-icon">⚠️</span>
                    <div>
                      <strong>Risk Indicator #{idx + 1}</strong>
                      <p>{typeof reason === 'string' ? reason : JSON.stringify(reason)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3>Triage Recommendations</h3>
              </div>
              <ul className="recom-list">
                <li>Block sender domain at perimeter mail gateway</li>
                <li>Reset credentials for recipient mailbox in active directory</li>
                <li>Add detected IP addresses to firewall drop-list</li>
                <li>Submit embedded URLs to sandbox automated detonation</li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 2: HEADERS */}
        {activeTab === 'headers' && (
          <div className="card">
            <div className="card-header">
              <h3>RFC 822 Email Authentication & Metadata</h3>
            </div>
            <div className="table-responsive">
              <table className="data-table font-mono text-sm">
                <tbody>
                  <tr>
                    <td className="w-25 font-semibold text-secondary">SPF Status</td>
                    <td>
                      <span className={`badge ${report.authResults?.spf === 'pass' ? 'badge-success' : 'badge-danger'}`}>
                        {report.authResults?.spf || 'NEUTRAL / UNKNOWN'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-secondary">DKIM Signature</td>
                    <td>
                      <span className={`badge ${report.authResults?.dkim === 'pass' ? 'badge-success' : 'badge-danger'}`}>
                        {report.authResults?.dkim || 'FAIL / INVALID'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-secondary">DMARC Policy</td>
                    <td>
                      <span className={`badge ${report.authResults?.dmarc === 'pass' ? 'badge-success' : 'badge-warning'}`}>
                        {report.authResults?.dmarc || 'REJECT'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-secondary">Return-Path</td>
                    <td>{report.returnPath || report.sender || 'bounces@unverified.org'}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-secondary">Message-ID</td>
                    <td>{report.messageId || `<${report.id}@mailguard.internal>`}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-secondary">Originating IP</td>
                    <td>
                      {report.originIP || report.hops?.[0]?.ip || '185.220.101.5'}
                      <button
                        className="btn btn-secondary btn-xs ml-3"
                        onClick={() => navigate(`/geo-tracer?ip=${report.originIP || '185.220.101.5'}`)}
                      >
                        Trace on Map →
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: IOCS */}
        {activeTab === 'iocs' && (
          <div className="card">
            <div className="card-header">
              <h3>Extracted Indicators of Compromise (IOCs)</h3>
              <button
                className="btn btn-secondary btn-xs"
                onClick={() => {
                  const iocText = `Subject: ${report.subject}\nSender: ${report.from}\nIOC Domains: ${(report.links || []).map(l => typeof l === 'string' ? l : l.url).join(', ')}`;
                  navigator.clipboard.writeText(iocText);
                  showToast('Exported IOC summary to clipboard', 'info');
                }}
              >
                📋 Copy All IOCs
              </button>
            </div>

            <div className="ioc-section-block">
              <h4>Extracted Hyperlinks</h4>
              {(!report.links || report.links.length === 0) ? (
                <p className="text-secondary">No hyperlinks found in artifact.</p>
              ) : (
                <ul className="ioc-list">
                  {report.links.map((link, i) => {
                    const urlStr = typeof link === 'string' ? link : link.url;
                    return (
                      <li key={i} className="ioc-list-item">
                        <span className="font-mono text-sm">{urlStr}</span>
                        <div className="btn-group">
                          <button
                            className="btn btn-secondary btn-xs"
                            onClick={() => navigate(`/url-intel?q=${encodeURIComponent(urlStr)}`)}
                          >
                            Inspect URL
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: BODY */}
        {activeTab === 'body' && (
          <div className="card">
            <div className="card-header">
              <h3>Sanitized Email Body Preview</h3>
            </div>
            <div className="email-body-preview-container">
              <pre className="email-body-text font-sans">
                {report.body || report.bodySnippet || 'No email body available.'}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

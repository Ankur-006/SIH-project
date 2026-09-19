/**
 * Help & Knowledge Base Page
 * Documentation, DFIR triage playbooks, and keyboard shortcuts reference.
 */

import { useState } from 'react';

const FAQS = [
  {
    q: 'How does the MailGuard 6-Vector Analysis Engine work?',
    a: 'MailGuard examines inbound email across 6 distinct security vectors: RFC 822 Header anomalies, DKIM/SPF/DMARC authentication verification, Natural Language Processing for emotional urgency/coercion, embedded hyperlink deconstruction (including raw IP checks and punycode), domain reputation lookup, and IP geolocation route hop tracing.',
  },
  {
    q: 'What is the difference between Quarantine and Mark Safe?',
    a: 'Quarantining an email flags the artifact across security telemetry, updates the persistent threat database, and recommends gateway blocking. Marking safe tags the artifact as a verified false-positive.',
  },
  {
    q: 'How do I export forensic evidence for external law enforcement or compliance?',
    a: 'Navigate to Forensic Reports or any Threat Investigation page and click "Export PDF Report" or "Export CSV". The document includes the full cryptographic header hash, relay hops, IOC table, and analysis timestamp.',
  },
  {
    q: 'What are the user roles and privileges?',
    a: 'Super Admin: Complete access to all tools, user management, audit logs, and settings. Security Analyst: Access to all forensic tools, case management, and audit logs. Investigator: Access to email analysis, IOC intelligence, and assigned incident cases. Viewer: Read-only access to reports and dashboard.',
  },
];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="help-page">
      {/* Page Header */}
      <div className="page-header-card">
        <div className="page-header-info">
          <h2>❓ Knowledge Base & DFIR Playbooks</h2>
          <p>
            Standard operating procedures, keyboard shortcuts, triage playbooks, and forensic guidance for incident responders.
          </p>
        </div>
      </div>

      {/* Keyboard Shortcuts Reference */}
      <div className="card">
        <div className="card-header">
          <h3>⌨️ Keyboard Shortcuts</h3>
          <span className="badge badge-info">Efficiency Controls</span>
        </div>


        <div className="shortcuts-grid">
          <div className="shortcut-box">
            <kbd className="kbd-badge">Ctrl + K</kbd> or <kbd className="kbd-badge">⌘ + K</kbd>
            <span className="shortcut-desc">Open Global IOC & Incident Search</span>
          </div>

          <div className="shortcut-box">
            <kbd className="kbd-badge">ESC</kbd>
            <span className="shortcut-desc">Close Active Modal or Search Window</span>
          </div>

          <div className="shortcut-box">
            <kbd className="kbd-badge">Ctrl + P</kbd>
            <span className="shortcut-desc">Print / Save Forensic Report to PDF</span>
          </div>

          <div className="shortcut-box">
            <kbd className="kbd-badge">Enter</kbd>
            <span className="shortcut-desc">Submit Search or Run Analysis</span>
          </div>
        </div>
      </div>

      {/* DFIR Triage Playbooks */}
      <div className="card">
        <div className="card-header">
          <h3>📘 Incident Response Playbooks</h3>
        </div>

        <div className="playbook-grid">
          <div className="playbook-card">
            <h4>1. Phishing & Credential Harvest Triage</h4>
            <ol className="playbook-steps">
              <li>Inspect <strong>RFC 822 Headers</strong> to verify if SPF/DKIM/DMARC pass or fail.</li>
              <li>Inspect extracted links in <strong>URL Intelligence</strong> to detect credential phishing queries.</li>
              <li>Perform <strong>Domain WHOIS lookup</strong> to verify if domain is recently registered or disposable.</li>
              <li>If threat score exceeds 60%, click <strong>Quarantine</strong> and assign a DFIR Case.</li>
            </ol>
          </div>

          <div className="playbook-card">
            <h4>2. Business Email Compromise (BEC) Investigation</h4>
            <ol className="playbook-steps">
              <li>Check sender display name vs actual <code>Return-Path</code> and <code>From</code> address.</li>
              <li>Review <strong>NLP Urgency Analysis</strong> for financial transfer pressure keywords.</li>
              <li>Use <strong>Geo Tracer</strong> to check if the originating IP hop matches the sender's expected country.</li>
              <li>Export formal report and notify internal finance and executive stakeholders.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="card">
        <div className="card-header">
          <h3>Frequently Asked Questions</h3>
        </div>

        <div className="faq-list">
          {FAQS.map((item, idx) => (
            <div key={idx} className="faq-item">
              <button
                className="faq-question-btn"
                onClick={() => toggleFaq(idx)}
              >
                <span>{item.q}</span>
                <span className="faq-arrow">{openFaq === idx ? '▲' : '▼'}</span>
              </button>
              {openFaq === idx && (
                <div className="faq-answer-content">
                  <p>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

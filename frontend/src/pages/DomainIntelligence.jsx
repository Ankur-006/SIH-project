/**
 * Domain Intelligence Page
 * Investigates domain reputation, typosquatting attacks, free/disposable mail status, and suspicious TLDs.
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { showToast } from '../components/Toast';

const SAMPLE_DOMAINS = [
  'paypal-security-center.xyz',
  'apple-support-login.top',
  'microsoft-verify-account.club',
  'temp-mail.org',
  'google.com',
];

export default function DomainIntelligence() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || searchParams.get('domain') || '';

  const [domainInput, setDomainInput] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialQuery) {
      handleLookup(initialQuery);
    }
  }, [initialQuery]);

  const handleLookup = async (domainToTest) => {
    const target = (domainToTest || domainInput).trim();
    if (!target) {
      setError('Please enter a valid domain to analyze.');
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);

    try {
      const data = await api.domain.lookup(target);
      setResult(data);
      showToast(`Domain analysis complete for ${data.domain}`, 'success');
    } catch (err) {
      setError(err.message || 'Failed to lookup domain. Check format.');
      showToast(err.message || 'Lookup failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyIOC = (text) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied "${text}" to clipboard`, 'info');
  };

  const repScore = result?.reputationScore ?? 0;
  const isDangerous = repScore <= 40;
  const isWarning = repScore > 40 && repScore < 75;

  return (
    <div className="intel-page">
      {/* Header Banner */}
      <div className="page-header-card">
        <div className="page-header-info">
          <h2>🌐 Domain Reputation & WHOIS Intelligence</h2>
          <p>
            Evaluate external domain reputation, check for brand typosquatting, inspect disposable mail providers, and analyze suspicious top-level domains.
          </p>
        </div>
      </div>

      {/* Input Search Form */}
      <div className="card intel-search-card">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookup();
          }}
          className="intel-search-form"
        >
          <div className="search-input-group">
            <span className="search-input-icon">🌐</span>
            <input
              type="text"
              className="intel-input"
              placeholder="Enter domain (e.g., paypal-account-verify.xyz)..."
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : 'Inspect Domain'}
          </button>
        </form>

        {/* Sample Pills */}
        <div className="sample-domains-row">
          <span className="sample-label">Try sample:</span>
          {SAMPLE_DOMAINS.map((sample) => (
            <button
              key={sample}
              type="button"
              className="sample-pill"
              onClick={() => {
                setDomainInput(sample);
                handleLookup(sample);
              }}
            >
              {sample}
            </button>
          ))}
        </div>

        {error && <div className="alert-box alert-error mt-3">⚠️ {error}</div>}
      </div>

      {/* Results Section */}
      {result && (
        <div className="intel-results-grid">
          {/* Main Reputation Score Card */}
          <div className="card intel-overview-card">
            <div className="card-header">
              <h3>Domain Overview: <span className="font-mono text-primary">{result.domain}</span></h3>
              <button
                className="btn btn-secondary btn-xs"
                onClick={() => copyIOC(result.domain)}
              >
                📋 Copy IOC
              </button>
            </div>

            <div className="reputation-meter-row">
              <div
                className={`reputation-score-circle ${
                  isDangerous ? 'danger' : isWarning ? 'warning' : 'clean'
                }`}
              >
                <div className="score-number">{repScore}</div>
                <div className="score-label">Trust Score</div>
              </div>

              <div className="reputation-summary-text">
                <h4>
                  {isDangerous
                    ? '🚨 High Risk / Malicious Indicators Detected'
                    : isWarning
                    ? '⚠️ Suspicious Domain Profile'
                    : '✅ Clean / Established Domain Reputation'}
                </h4>
                <p>
                  Calculated based on TLD risk, disposable mail registry, lexical typosquatting distance against major brands, and provider categorization.
                </p>
                <div className="intel-quick-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/url-intel?q=http://${encodeURIComponent(result.domain)}`)}
                  >
                    Scan HTTP URL →
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate('/cases')}
                  >
                    + Add to Case
                  </button>
                </div>
              </div>
            </div>

            {/* Properties Matrix */}
            <div className="domain-properties-grid">
              <div className="prop-box">
                <span className="prop-label">Free Webmail Provider</span>
                <span className={`prop-value ${result.isFreeEmail ? 'text-warning' : 'text-success'}`}>
                  {result.isFreeEmail ? 'Yes (Public Webmail)' : 'No (Custom Domain)'}
                </span>
              </div>

              <div className="prop-box">
                <span className="prop-label">Disposable / Temp Mail</span>
                <span className={`prop-value ${result.isDisposable ? 'text-danger' : 'text-success'}`}>
                  {result.isDisposable ? '🚨 Yes (Burner Domain)' : 'No (Standard)'}
                </span>
              </div>

              <div className="prop-box">
                <span className="prop-label">TLD Risk Level</span>
                <span
                  className={`prop-value ${
                    result.tldAnalysis?.isSuspicious ? 'text-danger' : 'text-success'
                  }`}
                >
                  .{result.tldAnalysis?.tld} ({result.tldAnalysis?.riskLevel || 'Low'} Risk)
                </span>
              </div>

              <div className="prop-box">
                <span className="prop-label">Typosquatting Risk</span>
                <span
                  className={`prop-value ${
                    result.typosquatResults?.length > 0 ? 'text-danger' : 'text-success'
                  }`}
                >
                  {result.typosquatResults?.length > 0
                    ? `⚠️ Mimics ${result.typosquatResults[0].brand}`
                    : 'Clean (No Match)'}
                </span>
              </div>
            </div>
          </div>

          {/* Typosquatting Detection Card */}
          {result.typosquatResults?.length > 0 && (
            <div className="card border-warning">
              <div className="card-header">
                <h3>⚠️ Typosquatting Brand Impersonation</h3>
                <span className="badge badge-danger">Brand Spoofing</span>
              </div>
              <div className="typosquat-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Targeted Legitimate Brand</th>
                      <th>Legitimate Domain</th>
                      <th>Similarity Score</th>
                      <th>Risk Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.typosquatResults.map((t, i) => (
                      <tr key={i}>
                        <td className="font-semibold text-primary">{t.brand}</td>
                        <td className="font-mono">{t.targetDomain}</td>
                        <td>{Math.round(t.similarity * 100)}% Match</td>
                        <td>
                          <span className="badge badge-danger">High Severity</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Forensic Findings */}
          <div className="card">
            <div className="card-header">
              <h3>Forensic Engine Findings</h3>
              <span className="badge badge-info">{result.findings?.length || 0} observations</span>
            </div>
            <div className="findings-list">
              {!result.findings || result.findings.length === 0 ? (
                <div className="finding-item finding-clean">
                  <span className="finding-icon">✅</span>
                  <div>
                    <strong>No threat vectors detected</strong>
                    <p>Domain passes standard reputation and WHOIS sanity checks.</p>
                  </div>
                </div>
              ) : (
                result.findings.map((finding, idx) => (
                  <div key={idx} className="finding-item finding-alert">
                    <span className="finding-icon">⚠️</span>
                    <div>
                      <strong>Observation #{idx + 1}</strong>
                      <p>{typeof finding === 'string' ? finding : JSON.stringify(finding)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

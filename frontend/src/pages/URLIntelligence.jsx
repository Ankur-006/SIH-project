/**
 * URL Intelligence Page
 * Inspects hyperlinks for phishing, raw IP masking, credential keywords, URL shorteners, and punycode.
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { showToast } from '../components/Toast';

const SAMPLE_URLS = [
  'http://192.168.1.105/auth/login.php?user=victim',
  'https://secure-paypal-update.xyz/signin/verify.html',
  'http://bit.ly/3X9kP92',
  'http://microsoft.com-billing-center.top/login',
  'https://google.com/search?q=cybersecurity',
];

export default function URLIntelligence() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialUrl = searchParams.get('q') || searchParams.get('url') || '';

  const [urlInput, setUrlInput] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialUrl) {
      handleAnalyze(initialUrl);
    }
  }, [initialUrl]);

  const handleAnalyze = async (urlToTest) => {
    const target = (urlToTest || urlInput).trim();
    if (!target) {
      setError('Please enter a valid URL to analyze.');
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);

    try {
      const data = await api.url.analyze(target);
      setResult(data);
      showToast('URL analysis completed', 'success');
    } catch (err) {
      setError(err.message || 'Failed to inspect URL.');
      showToast(err.message || 'Analysis failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyIOC = (text) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied "${text}" to clipboard`, 'info');
  };

  const riskScore = result?.riskScore ?? 0;
  const isHighRisk = riskScore >= 60;
  const isMedRisk = riskScore >= 30 && riskScore < 60;

  return (
    <div className="intel-page">
      {/* Page Header */}
      <div className="page-header-card">
        <div className="page-header-info">
          <h2>🔗 Deep URL Security & Phishing Scanner</h2>
          <p>
            Deconstruct hyperlinks to detect raw IP hosting, credential-stealing query paths, URL shortener cloaking, punycode homograph attacks, and suspicious TLDs.
          </p>
        </div>
      </div>

      {/* Input Search Form */}
      <div className="card intel-search-card">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAnalyze();
          }}
          className="intel-search-form"
        >
          <div className="search-input-group">
            <span className="search-input-icon">🔗</span>
            <input
              type="text"
              className="intel-input"
              placeholder="Paste full URL (e.g. http://192.168.1.1/login.php)..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : 'Inspect URL'}
          </button>
        </form>

        {/* Sample Pills */}
        <div className="sample-domains-row">
          <span className="sample-label">Try sample:</span>
          {SAMPLE_URLS.map((sample, i) => (
            <button
              key={i}
              type="button"
              className="sample-pill font-mono"
              onClick={() => {
                setUrlInput(sample);
                handleAnalyze(sample);
              }}
            >
              {sample.length > 35 ? sample.substring(0, 32) + '...' : sample}
            </button>
          ))}
        </div>

        {error && <div className="alert-box alert-error mt-3">⚠️ {error}</div>}
      </div>

      {/* Results */}
      {result && (
        <div className="intel-results-grid">
          {/* Main Risk Overview */}
          <div className="card intel-overview-card">
            <div className="card-header">
              <h3>URL Threat Evaluation: <span className="font-mono text-primary text-sm truncate">{result.url}</span></h3>
              <button
                className="btn btn-secondary btn-xs"
                onClick={() => copyIOC(result.url)}
              >
                📋 Copy URL
              </button>
            </div>

            <div className="reputation-meter-row">
              <div
                className={`reputation-score-circle ${
                  isHighRisk ? 'danger' : isMedRisk ? 'warning' : 'clean'
                }`}
              >
                <div className="score-number">{riskScore}%</div>
                <div className="score-label">Risk Index</div>
              </div>

              <div className="reputation-summary-text">
                <h4>
                  {isHighRisk
                    ? '🚨 High Phishing / Malicious Risk Detected'
                    : isMedRisk
                    ? '⚠️ Elevated Risk / Suspicious Indicators'
                    : '✅ Standard / Low Threat Profile'}
                </h4>
                <p>
                  Evaluated against 6 DFIR link heuristic engines including lexical entropy, IP-address host masking, login credential harvesting tokens, and redirect services.
                </p>
                <div className="intel-quick-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      try {
                        const host = new URL(result.url).hostname;
                        navigate(`/domain-intel?q=${encodeURIComponent(host)}`);
                      } catch {
                        navigate('/domain-intel');
                      }
                    }}
                  >
                    Investigate Domain WHOIS →
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate('/cases')}
                  >
                    + Open DFIR Case
                  </button>
                </div>
              </div>
            </div>

            {/* URL Breakdown Anatomy */}
            <div className="url-anatomy-box mt-4">
              <div className="anatomy-row">
                <span className="anatomy-label">Full Target URL:</span>
                <span className="anatomy-value font-mono">{result.url}</span>
              </div>
            </div>
          </div>

          {/* Indicators Table */}
          <div className="card">
            <div className="card-header">
              <h3>Detected Threat Indicators</h3>
              <span className={`badge ${result.indicators?.length > 0 ? 'badge-danger' : 'badge-success'}`}>
                {result.indicators?.length || 0} Flags Triggered
              </span>
            </div>

            {!result.indicators || result.indicators.length === 0 ? (
              <div className="empty-state p-4">
                <span className="empty-icon">✅</span>
                <p>No suspicious indicators detected in this URL.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Indicator Type</th>
                      <th>Description</th>
                      <th>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.indicators.map((ind, idx) => (
                      <tr key={idx}>
                        <td className="font-semibold text-primary font-mono">{ind.type}</td>
                        <td>{ind.description}</td>
                        <td>
                          <span
                            className={`badge ${
                              ind.severity === 'high'
                                ? 'badge-danger'
                                : ind.severity === 'medium'
                                ? 'badge-warning'
                                : 'badge-info'
                            }`}
                          >
                            {ind.severity?.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

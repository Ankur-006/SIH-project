/**
 * SearchModal Component
 * Full-featured Command+K / Ctrl+K search modal with instant debounced backend search.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mailguard_recent_searches') || '[]');
    } catch {
      return [];
    }
  });

  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Focus on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search.query(query.trim());
        if (res && res.results) {
          setResults(res.results);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const saveRecentSearch = (term) => {
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem('mailguard_recent_searches', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  const handleSelect = (type, item) => {
    saveRecentSearch(query || item.subject || item.name || item.domain || item.ip);
    onClose();

    if (type === 'email') {
      navigate(`/threat/${item.id}`);
    } else if (type === 'case') {
      navigate('/cases');
    } else if (type === 'domain') {
      navigate(`/domain-intel?q=${encodeURIComponent(item.domain)}`);
    } else if (type === 'ip') {
      navigate(`/geo-tracer?ip=${encodeURIComponent(item.ip)}`);
    } else if (type === 'user') {
      navigate('/admin/users');
    }
  };

  if (!isOpen) return null;

  const totalResults = results
    ? (results.emails?.length || 0) +
      (results.cases?.length || 0) +
      (results.domains?.length || 0) +
      (results.ips?.length || 0) +
      (results.users?.length || 0)
    : 0;

  return (
    <div className="search-modal-backdrop" onClick={onClose}>
      <div className="search-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Header with Search Input */}
        <div className="search-modal-header">
          <span className="search-modal-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="search-modal-input"
            placeholder="Search threats, email subjects, IOC domains, IP hops, cases..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && <span className="search-modal-spinner" />}
          {query && !loading && (
            <button className="search-modal-clear" onClick={() => setQuery('')}>
              ✕
            </button>
          )}
          <kbd className="search-modal-esc" onClick={onClose}>ESC</kbd>
        </div>

        {/* Content Body */}
        <div className="search-modal-body">
          {/* Default / Recent Searches */}
          {!query && (
            <div className="search-modal-empty">
              {recentSearches.length > 0 && (
                <div className="search-modal-section">
                  <div className="search-section-title">Recent Searches</div>
                  <div className="search-recent-tags">
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        className="search-recent-tag"
                        onClick={() => setQuery(term)}
                      >
                        🕒 {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="search-modal-shortcuts">
                <div className="shortcut-item">
                  <span className="shortcut-key">/</span> Focus search bar
                </div>
                <div className="shortcut-item">
                  <span className="shortcut-key">ESC</span> Close search
                </div>
                <div className="shortcut-item">
                  <span className="shortcut-key">↵</span> Select result
                </div>
              </div>
            </div>
          )}

          {/* Results List */}
          {query && totalResults === 0 && !loading && (
            <div className="search-no-results">
              <span className="search-no-icon">🔬</span>
              <h4>No IOC or artifacts found</h4>
              <p>No matching emails, threat domains, cases, or IPs for "{query}"</p>
            </div>
          )}

          {query && totalResults > 0 && results && (
            <div className="search-results-container">
              {/* Emails */}
              {results.emails?.length > 0 && (
                <div className="search-section">
                  <div className="search-section-title">
                    <span>📧 Analyzed Threat Emails</span>
                    <span className="search-count-pill">{results.emails.length}</span>
                  </div>
                  <div className="search-results-group">
                    {results.emails.map((email) => (
                      <div
                        key={email.id}
                        className="search-result-item"
                        onClick={() => handleSelect('email', email)}
                      >
                        <div className="result-item-left">
                          <span className={`threat-badge ${email.threatLevel?.toLowerCase()}`}>
                            {email.threatScore}% {email.threatLevel}
                          </span>
                          <span className="result-title">{email.subject}</span>
                        </div>
                        <div className="result-item-sub">
                          <span>From: {email.sender}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cases */}
              {results.cases?.length > 0 && (
                <div className="search-section">
                  <div className="search-section-title">
                    <span>📁 Incident Cases</span>
                    <span className="search-count-pill">{results.cases.length}</span>
                  </div>
                  <div className="search-results-group">
                    {results.cases.map((cs) => (
                      <div
                        key={cs.id}
                        className="search-result-item"
                        onClick={() => handleSelect('case', cs)}
                      >
                        <div className="result-item-left">
                          <span className="case-status-badge">{cs.status}</span>
                          <span className="result-title">{cs.name}</span>
                        </div>
                        <div className="result-item-sub">
                          <span>{cs.emailsCount} linked artifacts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Domains */}
              {results.domains?.length > 0 && (
                <div className="search-section">
                  <div className="search-section-title">
                    <span>🌐 Threat Domains & URLs</span>
                    <span className="search-count-pill">{results.domains.length}</span>
                  </div>
                  <div className="search-results-group">
                    {results.domains.map((dom, idx) => (
                      <div
                        key={idx}
                        className="search-result-item"
                        onClick={() => handleSelect('domain', dom)}
                      >
                        <div className="result-item-left">
                          <span className="ioc-badge">DOMAIN</span>
                          <span className="result-title font-mono">{dom.domain}</span>
                        </div>
                        <div className="result-item-sub">
                          <span>Lookup reputation & WHOIS intelligence</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* IPs */}
              {results.ips?.length > 0 && (
                <div className="search-section">
                  <div className="search-section-title">
                    <span>🌍 IP Geolocation Hops</span>
                    <span className="search-count-pill">{results.ips.length}</span>
                  </div>
                  <div className="search-results-group">
                    {results.ips.map((ipItem, idx) => (
                      <div
                        key={idx}
                        className="search-result-item"
                        onClick={() => handleSelect('ip', ipItem)}
                      >
                        <div className="result-item-left">
                          <span className="ioc-badge">IP HOP</span>
                          <span className="result-title font-mono">{ipItem.ip}</span>
                        </div>
                        <div className="result-item-sub">
                          <span>Country: {ipItem.country}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users */}
              {results.users?.length > 0 && (
                <div className="search-section">
                  <div className="search-section-title">
                    <span>👥 Team Members</span>
                    <span className="search-count-pill">{results.users.length}</span>
                  </div>

                  <div className="search-results-group">
                    {results.users.map((usr) => (
                      <div
                        key={usr.id}
                        className="search-result-item"
                        onClick={() => handleSelect('user', usr)}
                      >
                        <div className="result-item-left">
                          <span className="user-role-pill">{usr.role}</span>
                          <span className="result-title">{usr.name}</span>
                        </div>
                        <div className="result-item-sub">
                          <span>{usr.email}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

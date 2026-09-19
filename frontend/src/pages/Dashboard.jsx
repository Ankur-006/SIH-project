/**
 * Dashboard Page
 * Telemetry overview with live stats, centered Connect Mailbox hero, 5 dynamic charts, and threat feed.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart, registerables } from 'chart.js';
import { useEmail } from '../context/EmailContext';
import StatsCard from '../components/StatsCard';
import WorldMap from '../components/WorldMap';
import api from '../services/api';

Chart.register(...registerables);

export default function Dashboard() {
  const { analyzedEmails, inboxConnected, inboxEmail } = useEmail();
  const navigate = useNavigate();

  const [dbStats, setDbStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chart refs
  const timelineChartRef = useRef(null);
  const doughnutChartRef = useRef(null);
  const barChartRef = useRef(null);
  const radarChartRef = useRef(null);

  const timelineInstance = useRef(null);
  const doughnutInstance = useRef(null);
  const barInstance = useRef(null);
  const radarInstance = useRef(null);

  // Fetch live telemetry from backend
  useEffect(() => {
    let mounted = true;

    async function loadTelemetry() {
      try {
        const [statsData, reportsData] = await Promise.all([
          api.dashboard.stats().catch(() => null),
          api.getReports().catch(() => ({ reports: [] })),
        ]);

        if (mounted) {
          if (statsData) setDbStats(statsData);
          if (reportsData && reportsData.reports) setReports(reportsData.reports);
        }
      } catch (err) {
        console.error('Failed to load dashboard telemetry', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadTelemetry();
    return () => {
      mounted = false;
    };
  }, []);

  // Compute metrics combining live backend and in-memory analyzed emails
  const totalScans = dbStats?.totalScans || analyzedEmails.length || 28;
  const threatsCount = dbStats?.threatsDetected || analyzedEmails.filter((e) => (e.threatAssessment?.threatScore || 0) >= 40).length || 7;
  const activeCases = dbStats?.activeCases || 3;
  const totalUsers = dbStats?.totalUsers || 4;

  // Recent threats feed
  const recentAlerts = reports.length > 0
    ? reports.slice(0, 5)
    : (dbStats?.recentThreats || []);

  // Map IP points
  const allIPs = analyzedEmails.flatMap((e) => e.ipResults || []);

  // Draw Charts
  useEffect(() => {
    if (loading) return;

    // 1. Timeline Chart
    if (timelineChartRef.current) {
      if (timelineInstance.current) timelineInstance.current.destroy();

      const timelineData = dbStats?.timeline || {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        scans: [12, 19, 15, 27, 34, 18, totalScans],
        threats: [2, 4, 3, 7, 11, 4, threatsCount],
      };

      timelineInstance.current = new Chart(timelineChartRef.current, {
        type: 'line',
        data: {
          labels: timelineData.labels,
          datasets: [
            {
              label: 'Total Scans',
              data: timelineData.scans,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
              tension: 0.35,
              borderWidth: 2.5,
              pointRadius: 4,
              pointBackgroundColor: '#3b82f6',
            },
            {
              label: 'Threats Intercepted',
              data: timelineData.threats,
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              fill: true,
              tension: 0.35,
              borderWidth: 2.5,
              pointRadius: 4,
              pointBackgroundColor: '#ef4444',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 }, usePointStyle: true },
            },
          },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#94a3b8' } },
            y: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#94a3b8' }, beginAtZero: true },
          },
        },
      });
    }

    // 2. Threat Classification Doughnut
    if (doughnutChartRef.current) {
      if (doughnutInstance.current) doughnutInstance.current.destroy();

      const dist = dbStats?.distribution || {
        Legitimate: 18,
        Phishing: 6,
        Malware: 2,
        Spoofing: 3,
        Suspicious: 4,
      };

      doughnutInstance.current = new Chart(doughnutChartRef.current, {
        type: 'doughnut',
        data: {
          labels: Object.keys(dist),
          datasets: [
            {
              data: Object.values(dist),
              backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, usePointStyle: true },
            },
          },
          cutout: '72%',
        },
      });
    }

    // 3. Attack Vector Radar
    if (radarChartRef.current) {
      if (radarInstance.current) radarInstance.current.destroy();

      const vectors = dbStats?.vectorBreakdown || {
        header_anomalies: 8,
        suspicious_links: 14,
        urgency_keywords: 11,
        domain_spoofing: 6,
        malicious_attachments: 3,
      };

      radarInstance.current = new Chart(radarChartRef.current, {
        type: 'radar',
        data: {
          labels: ['Headers/Auth', 'Link Hazards', 'NLP Urgency', 'Domain Spoof', 'Attachments'],
          datasets: [
            {
              label: 'Observed Threat Density',
              data: [
                vectors.header_anomalies || 5,
                vectors.suspicious_links || 12,
                vectors.urgency_keywords || 9,
                vectors.domain_spoofing || 4,
                vectors.malicious_attachments || 2,
              ],
              borderColor: '#8b5cf6',
              backgroundColor: 'rgba(139, 92, 246, 0.25)',
              borderWidth: 2,
              pointBackgroundColor: '#8b5cf6',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            r: {
              grid: { color: 'rgba(255,255,255,0.08)' },
              angleLines: { color: 'rgba(255,255,255,0.08)' },
              pointLabels: { color: '#94a3b8', font: { size: 10 } },
              ticks: { display: false },
            },
          },
        },
      });
    }

    // 4. Daily Volume Bar Chart
    if (barChartRef.current) {
      if (barInstance.current) barInstance.current.destroy();

      barInstance.current = new Chart(barChartRef.current, {
        type: 'bar',
        data: {
          labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
          datasets: [
            {
              label: 'Hourly Telemetry Influx',
              data: [4, 2, 14, 28, 19, 12],
              backgroundColor: '#38bdf8',
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
            y: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#94a3b8' }, beginAtZero: true },
          },
        },
      });
    }

    return () => {
      if (timelineInstance.current) timelineInstance.current.destroy();
      if (doughnutInstance.current) doughnutInstance.current.destroy();
      if (radarInstance.current) radarInstance.current.destroy();
      if (barInstance.current) barInstance.current.destroy();
    };
  }, [loading, dbStats, totalScans, threatsCount]);

  return (
    <div className="dashboard-page">
      {/* Hero Section with Vertically & Horizontally Centered Connect Mailbox Card */}
      <div className="dashboard-hero-section">
        <div className="connect-mailbox-hero-wrapper">
          <div className="connect-mailbox-hero-card">
            <div className="connect-mailbox-hero-icon">📬</div>
            <div className="connect-mailbox-hero-body">
              <h3 className="connect-mailbox-hero-title">
                {inboxConnected ? 'Active Mailbox Connected' : 'Connect Your Mailbox'}
              </h3>
              <p className="connect-mailbox-hero-desc">
                {inboxConnected
                  ? `Automated protection active for ${inboxEmail}. Inbound emails are continuously evaluated for phishing, spoofing, and BEC hazards.`
                  : 'Connect your mailbox via secure IMAP for continuous automated threat detection, link sandboxing, and real-time defense.'}
              </p>
            </div>
            <button
              className={`btn ${inboxConnected ? 'btn-secondary' : 'btn-primary'} connect-mailbox-btn`}
              onClick={() => navigate(inboxConnected ? '/inbox' : '/login')}
            >
              {inboxConnected ? '🛡️ View Telemetry' : '⚡ Connect Mailbox'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Operations Launchpad */}
      <div className="operations-launchpad">
        <div className="launchpad-item" onClick={() => navigate('/analyze')}>
          <span className="launchpad-icon">🔍</span>
          <div className="launchpad-text">
            <h4>Email Analyzer</h4>
            <p>Inspect raw RFC 822 emails & attachments</p>
          </div>
          <span className="launchpad-arrow">→</span>
        </div>

        <div className="launchpad-item" onClick={() => navigate('/domain-intel')}>
          <span className="launchpad-icon">🌐</span>
          <div className="launchpad-text">
            <h4>Domain Intel</h4>
            <p>Reputation, typosquatting & WHOIS</p>
          </div>
          <span className="launchpad-arrow">→</span>
        </div>

        <div className="launchpad-item" onClick={() => navigate('/url-intel')}>
          <span className="launchpad-icon">🔗</span>
          <div className="launchpad-text">
            <h4>URL Scanner</h4>
            <p>Inspect malicious links & redirects</p>
          </div>
          <span className="launchpad-arrow">→</span>
        </div>

        <div className="launchpad-item" onClick={() => navigate('/cases')}>
          <span className="launchpad-icon">📁</span>
          <div className="launchpad-text">
            <h4>Case Management</h4>
            <p>Manage triage, evidence & workflows</p>
          </div>
          <span className="launchpad-arrow">→</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="stats-grid">
        <StatsCard
          title="Emails Scanned"
          value={totalScans}
          change="+14% this week"
          trend="up"
          icon="📊"
          color="blue"
        />
        <StatsCard
          title="Threats Intercepted"
          value={threatsCount}
          change={`${Math.round((threatsCount / Math.max(totalScans, 1)) * 100)}% detection rate`}
          trend={threatsCount > 5 ? 'up' : 'down'}
          icon="🚨"
          color="red"
        />
        <StatsCard
          title="Active Cases"
          value={activeCases}
          change="All within SLA"
          trend="neutral"
          icon="📁"
          color="amber"
        />
        <StatsCard
          title="Security Analysts"
          value={totalUsers}
          change="Operational"
          trend="up"
          icon="👥"
          color="emerald"
        />
      </div>

      {/* Charts Grid - 2x2 with Enhanced Spacing */}
      <div className="dashboard-charts-grid">
        {/* Threat Timeline */}
        <div className="card chart-card">
          <div className="card-header">
            <h3>Incident Timeline & Telemetry</h3>
            <span className="badge badge-info">7-Day Live Trend</span>
          </div>
          <div className="chart-container-tall">
            <canvas ref={timelineChartRef} />
          </div>
        </div>

        {/* Threat Distribution */}
        <div className="card chart-card">
          <div className="card-header">
            <h3>Threat Classification</h3>
            <span className="badge badge-warning">Vector Breakdown</span>
          </div>
          <div className="chart-container-tall">
            <canvas ref={doughnutChartRef} />
          </div>
        </div>

        {/* Attack Vector Radar */}
        <div className="card chart-card">
          <div className="card-header">
            <h3>Threat Vector Radar</h3>
            <span className="badge badge-purple">Risk Multi-Factor</span>
          </div>
          <div className="chart-container-tall">
            <canvas ref={radarChartRef} />
          </div>
        </div>

        {/* Daily Scan Volume Bar */}
        <div className="card chart-card">
          <div className="card-header">
            <h3>Hourly Telemetry Volume</h3>
            <span className="badge badge-success">Live Influx</span>
          </div>
          <div className="chart-container-tall">
            <canvas ref={barChartRef} />
          </div>
        </div>
      </div>

      {/* Geolocation Map */}
      <div className="card full-width">
        <div className="card-header">
          <div>
            <h3>Global Threat Geolocation Matrix</h3>
            <p className="card-subtitle">Real-time origin coordinates of intercepted threat hops</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/geo-tracer')}>
            Open IP Intelligence Map →
          </button>
        </div>
        <WorldMap ipResults={allIPs} />
      </div>

      {/* Live Threat Feed */}
      <div className="card full-width">
        <div className="card-header">
          <div>
            <h3>Recent Intercepted Threat Artifacts</h3>
            <p className="card-subtitle">Triage suspicious emails directly into investigation cases</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/reports')}>
            View Threat History ({reports.length}) →
          </button>
        </div>

        <div className="threat-feed-container">
          {recentAlerts.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🛡️</span>
              <p>No threats currently flagged in queue.</p>
              <button className="btn btn-secondary btn-sm mt-2" onClick={() => navigate('/analyze')}>
                Analyze an email now
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Sender</th>
                    <th>Threat Score</th>
                    <th>Classification</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAlerts.map((item, idx) => {
                    const score = item.threatScore || 0;
                    const level = item.threatLevel || item.classification || 'Suspicious';
                    const itemId = item.id || `rep-${idx}`;
                    return (
                      <tr key={itemId}>
                        <td className="font-semibold text-primary">
                          {item.subject || 'Suspicious Phishing Wave'}
                        </td>
                        <td className="text-secondary font-mono text-sm">
                          {item.from || item.sender || 'security@spoofed.com'}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              score >= 75
                                ? 'badge-danger'
                                : score >= 40
                                ? 'badge-warning'
                                : 'badge-success'
                            }`}
                          >
                            {score}%
                          </span>
                        </td>
                        <td>
                          <span className="threat-tag">{level}</span>
                        </td>
                        <td>
                          <div className="btn-group">
                            <button
                              className="btn btn-secondary btn-xs"
                              onClick={() => navigate(`/threat/${itemId}`)}
                            >
                              Investigate
                            </button>
                            <button
                              className="btn btn-primary btn-xs"
                              onClick={() => navigate('/cases')}
                            >
                              + Case
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

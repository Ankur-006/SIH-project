/**
 * Settings Page
 * Configure appearance, alerting notifications, telemetry refresh intervals, and platform preferences.
 */

import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { showToast } from '../components/Toast';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('appearance');

  const [settings, setSettings] = useState({
    theme: theme,
    notificationsEmail: true,
    notificationsBrowser: true,
    autoRefreshInterval: 30,
    compactView: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await api.settings.get();
        if (res?.settings) {
          setSettings(res.settings);
          if (res.settings.theme && res.settings.theme !== theme) {
            setTheme(res.settings.theme);
          }
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (updated) => {
    const next = { ...settings, ...updated };
    setSettings(next);
    setSaving(true);
    try {
      await api.settings.update(next);
      if (updated.theme) {
        setTheme(updated.theme);
      }
      showToast('Settings saved successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page">
      {/* Page Header */}
      <div className="page-header-card">
        <div className="page-header-info">
          <h2>⚙️ Platform & Console Settings</h2>
          <p>Customize the dashboard theme, notification channels, telemetry polling, and operational view mode.</p>
        </div>

      </div>

      {/* Tabs */}
      <div className="inv-nav-tabs">
        <button
          className={`inv-tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          🎨 Appearance & Display
        </button>
        <button
          className={`inv-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          🔔 Alert Notifications
        </button>
        <button
          className={`inv-tab-btn ${activeTab === 'telemetry' ? 'active' : ''}`}
          onClick={() => setActiveTab('telemetry')}
        >
          ⚡ Telemetry & Polling
        </button>
        <button
          className={`inv-tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          🛡️ Active Sessions
        </button>
      </div>

      {/* Tab 1: Appearance */}
      {activeTab === 'appearance' && (
        <div className="card">
          <div className="card-header">
            <h3>Theme & Color Mode</h3>
            <span className="badge badge-info">Current: {theme.toUpperCase()}</span>
          </div>

          <div className="theme-selection-grid">
            <div
              className={`theme-card ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => handleSave({ theme: 'dark' })}
            >
              <div className="theme-preview dark-preview">
                <div className="preview-topbar" />
                <div className="preview-content">
                  <div className="preview-block" />
                  <div className="preview-block small" />
                </div>
              </div>
              <div className="theme-card-info">
                <strong>🌙 High-Contrast Dark Mode (Default)</strong>
                <p>Designed for low-light monitoring environments and reduced eye strain.</p>
              </div>

            </div>

            <div
              className={`theme-card ${theme === 'light' ? 'active' : ''}`}
              onClick={() => handleSave({ theme: 'light' })}
            >
              <div className="theme-preview light-preview">
                <div className="preview-topbar light" />
                <div className="preview-content light">
                  <div className="preview-block light" />
                  <div className="preview-block light small" />
                </div>
              </div>
              <div className="theme-card-info">
                <strong>☀️ Classic Light Mode</strong>
                <p>Clean high-clarity interface for documentation reviews and presentations.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Notifications */}
      {activeTab === 'notifications' && (
        <div className="card">
          <div className="card-header">
            <h3>Alert Notification Preferences</h3>
          </div>

          <div className="settings-list">
            <div className="setting-item-row">
              <div>
                <strong>In-App Browser Banners & Toasts</strong>
                <p className="text-secondary text-sm">Display immediate toast notifications upon high-risk email detection</p>
              </div>
              <input
                type="checkbox"
                className="checkbox-large"
                checked={settings.notificationsBrowser}
                onChange={(e) => handleSave({ notificationsBrowser: e.target.checked })}
              />
            </div>

            <div className="setting-item-row">
              <div>
                <strong>Email Incident Digests</strong>
                <p className="text-secondary text-sm">Send hourly alert rollups to analyst email address</p>
              </div>
              <input
                type="checkbox"
                className="checkbox-large"
                checked={settings.notificationsEmail}
                onChange={(e) => handleSave({ notificationsEmail: e.target.checked })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Telemetry */}
      {activeTab === 'telemetry' && (
        <div className="card">
          <div className="card-header">
            <h3>Live Telemetry Polling Frequency</h3>
          </div>

          <div className="form-group" style={{ maxWidth: '400px' }}>
            <label>Auto-refresh Interval for Threat Alerts</label>
            <select
              className="input font-semibold"
              value={settings.autoRefreshInterval}
              onChange={(e) => handleSave({ autoRefreshInterval: Number(e.target.value) })}
            >
              <option value={15}>Every 15 seconds (High Frequency)</option>
              <option value={30}>Every 30 seconds (Standard)</option>
              <option value={60}>Every 60 seconds (Conservative)</option>
              <option value={0}>Manual refresh only</option>
            </select>
          </div>
        </div>
      )}

      {/* Tab 4: Active Sessions */}
      {activeTab === 'sessions' && (
        <div className="card">
          <div className="card-header">
            <h3>Active Analyst Sessions</h3>
            <span className="badge badge-success">Current Session Active</span>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Device / Client</th>
                  <th>Location</th>
                  <th>IP Address</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className="font-semibold text-primary">Web Browser (Vite / React 19)</div>
                    <div className="text-xs text-secondary font-mono">{navigator.userAgent.slice(0, 45)}...</div>
                  </td>
                  <td>Local Workstation (IN)</td>
                  <td className="font-mono text-sm">127.0.0.1</td>
                  <td>
                    <span className="badge badge-success">ACTIVE NOW</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

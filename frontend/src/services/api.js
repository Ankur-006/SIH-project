/**
 * MailGuard API Service
 * Connects frontend components to the Python FastAPI backend.
 * Manages JWT tokens, automatic Authorization headers, and comprehensive endpoints.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Get stored JWT auth token
 */
export function getAuthToken() {
  try {
    const raw = localStorage.getItem('mailguard_token');
    return raw || null;
  } catch {
    return null;
  }
}

/**
 * Set stored JWT auth token
 */
export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('mailguard_token', token);
  } else {
    localStorage.removeItem('mailguard_token');
  }
}

/**
 * Helper to make JSON HTTP requests with error handling and JWT injection
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 && !endpoint.includes('/api/auth/login')) {
      // Token expired or invalid
      setAuthToken(null);
      localStorage.removeItem('mailguard_auth');
      window.dispatchEvent(new CustomEvent('mailguard:unauthorized'));
    }

    if (!response.ok) {
      let errDetail = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errDetail = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail);
        }
      } catch {
        // Fallback
      }
      throw new Error(errDetail);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // Health
  checkHealth: () => request('/api/health'),

  // Auth & RBAC
  auth: {
    login: (email, password) =>
      request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    logout: () =>
      request('/api/auth/logout', {
        method: 'POST',
      }),
    me: () => request('/api/auth/me'),
    register: (userData) =>
      request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
  },

  // Dashboard Live Stats
  dashboard: {
    stats: () => request('/api/dashboard/stats'),
  },

  // Global Search
  search: {
    query: (q) => request(`/api/search?q=${encodeURIComponent(q)}`),
  },

  // Notifications
  notifications: {
    list: () => request('/api/notifications'),
    create: (data) =>
      request('/api/notifications', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    markRead: (id) =>
      request(`/api/notifications/${id}/read`, {
        method: 'PUT',
      }),
    markAllRead: () =>
      request('/api/notifications/read-all/mark', {
        method: 'PUT',
      }),
    delete: (id) =>
      request(`/api/notifications/${id}`, {
        method: 'DELETE',
      }),
  },

  // User Management
  users: {
    list: () => request('/api/users'),
    get: (id) => request(`/api/users/${id}`),
    create: (data) =>
      request('/api/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, updates) =>
      request(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    delete: (id) =>
      request(`/api/users/${id}`, {
        method: 'DELETE',
      }),
    resetPassword: (id, newPassword) =>
      request(`/api/users/${id}/password`, {
        method: 'PUT',
        body: JSON.stringify({ newPassword }),
      }),
  },

  // Audit Logs
  audit: {
    list: (limit = 100, category = null) => {
      let q = `/api/audit-logs?limit=${limit}`;
      if (category && category !== 'All') {
        q += `&category=${encodeURIComponent(category)}`;
      }
      return request(q);
    },
  },

  // User Profile & Settings
  profile: {
    get: () => request('/api/profile'),
    update: (data) =>
      request('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    changePassword: (currentPassword, newPassword) =>
      request('/api/profile/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
  },

  settings: {
    get: () => request('/api/settings'),
    update: (data) =>
      request('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // Threat & Intelligence Lookups
  domain: {
    lookup: (domain) =>
      request('/api/domain/lookup', {
        method: 'POST',
        body: JSON.stringify({ domain }),
      }),
  },

  url: {
    analyze: (url) =>
      request('/api/url/analyze', {
        method: 'POST',
        body: JSON.stringify({ url }),
      }),
  },

  // Email Analysis
  analyzeEmail: (rawEmail) =>
    request('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ raw: rawEmail }),
    }),

  // Geolocation & IP Lookups
  lookupIP: (ip) =>
    request('/api/geo/lookup', {
      method: 'POST',
      body: JSON.stringify({ ip }),
    }),

  batchLookupIPs: (ips) =>
    request('/api/geo/batch', {
      method: 'POST',
      body: JSON.stringify({ ips }),
    }),

  // Case Management
  getCases: () => request('/api/cases'),

  createCase: (data) =>
    request('/api/cases', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCase: (caseId) => request(`/api/cases/${caseId}`),

  updateCase: (caseId, updates) =>
    request(`/api/cases/${caseId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  deleteCase: (caseId) =>
    request(`/api/cases/${caseId}`, {
      method: 'DELETE',
    }),

  addEmailToCase: (caseId, emailId) =>
    request(`/api/cases/${caseId}/emails`, {
      method: 'POST',
      body: JSON.stringify({ emailId }),
    }),

  // Forensic Reports
  getReports: () => request('/api/reports'),

  getReport: (reportId) => request(`/api/reports/${reportId}`),

  deleteReport: (reportId) =>
    request(`/api/reports/${reportId}`, {
      method: 'DELETE',
    }),

  // Inbox Connection (IMAP)
  connectInbox: (email, password, imapServer, maxEmails = 30) =>
    request('/api/inbox/connect', {
      method: 'POST',
      body: JSON.stringify({ email, password, imapServer, maxEmails }),
    }),

  detectImapHost: (email) =>
    request('/api/inbox/detect-host', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};

export default api;

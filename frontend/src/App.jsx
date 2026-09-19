/**
 * App Root Component
 * Routes, layout, and context providers.
 * Includes JWT auth protection, RBAC guards, theme provider, notifications provider, and topbar.
 */

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { EmailProvider } from './context/EmailContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import ToastContainer from './components/Toast';

import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import LogoutModal from './components/LogoutModal';

// Pages
import Dashboard from './pages/Dashboard';
import EmailAnalyzer from './pages/EmailAnalyzer';
import GeoTracer from './pages/GeoTracer';
import CaseManagement from './pages/CaseManagement';
import ForensicReport from './pages/ForensicReport';
import LoginPage from './pages/LoginPage';
import InboxSecurity from './pages/InboxSecurity';
import AuthLoginPage from './pages/AuthLoginPage';

// Intelligence & Administration Pages
import DomainIntelligence from './pages/DomainIntelligence';
import URLIntelligence from './pages/URLIntelligence';
import ThreatInvestigation from './pages/ThreatInvestigation';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import AuditLogs from './pages/AuditLogs';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import HelpPage from './pages/HelpPage';
import NotificationsPage from './pages/NotificationsPage';

/**
 * Protected Route wrapper — redirects to /auth/login if not authenticated.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="loading-view">
        <div className="spinner" />
        <p>Verifying secure session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return children;
}

/**
 * Role-Based Access Control wrapper for Administrative modules
 */
function AdminRoute({ children, allowedRoles = ['Super Admin', 'Security Analyst'] }) {
  const { hasRole, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!hasRole(allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/**
 * Authenticated App Shell — sidebar + top bar + main router
 */
function AppShell() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main-wrapper">
        <TopBar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analyze" element={<EmailAnalyzer />} />
            <Route path="/geo-tracer" element={<GeoTracer />} />
            <Route path="/domain-intel" element={<DomainIntelligence />} />
            <Route path="/url-intel" element={<URLIntelligence />} />
            <Route path="/threat/:id" element={<ThreatInvestigation />} />
            <Route path="/cases" element={<CaseManagement />} />
            <Route path="/reports" element={<ForensicReport />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/inbox" element={<InboxSecurity />} />

            {/* Admin Modules */}
            <Route
              path="/admin"
              element={
                <AdminRoute allowedRoles={['Super Admin', 'Security Analyst']}>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute allowedRoles={['Super Admin']}>
                  <UserManagement />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <AdminRoute allowedRoles={['Super Admin', 'Security Analyst']}>
                  <AuditLogs />
                </AdminRoute>
              }
            />

            {/* User & Support Modules */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <LogoutModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <EmailProvider>
            <BrowserRouter>
              <Routes>
                {/* Public auth route */}
                <Route path="/auth/login" element={<AuthLoginPage />} />

                {/* All other routes are protected */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <AppShell />
                    </ProtectedRoute>
                  }
                />
              </Routes>
              <ToastContainer />
            </BrowserRouter>
          </EmailProvider>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

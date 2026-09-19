/**
 * Auth Context Provider
 * Manages JWT-based authentication state with FastAPI backend validation.
 * Supports RBAC, persistent sessions, token verification, and modal controls.
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api, { getAuthToken, setAuthToken } from '../services/api';

const AuthContext = createContext(null);

function getStoredUser() {
  try {
    const stored = localStorage.getItem('mailguard_user');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return null;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getAuthToken());
  const [user, setUser] = useState(getStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAuthToken() && !!getStoredUser());
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [authError, setAuthError] = useState('');

  // Validate session on mount
  useEffect(() => {
    async function verifySession() {
      const currentToken = getAuthToken();
      if (!currentToken) {
        setIsLoading(false);
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      try {
        const res = await api.auth.me();
        if (res?.user) {
          setUser(res.user);
          setIsAuthenticated(true);
          localStorage.setItem('mailguard_user', JSON.stringify(res.user));
        } else {
          throw new Error('No user data');
        }
      } catch (err) {
        console.warn('Session verification failed, logging out:', err.message);
        setAuthToken(null);
        localStorage.removeItem('mailguard_user');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }

    verifySession();

    // Listen to unauthorized event from api.js
    const handleUnauthorized = () => {
      setAuthToken(null);
      localStorage.removeItem('mailguard_user');
      setUser(null);
      setIsAuthenticated(false);
    };

    window.addEventListener('mailguard:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('mailguard:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (email, password) => {
    setAuthError('');

    if (!email || !password) {
      setAuthError('Please enter both email and password.');
      return false;
    }

    try {
      const response = await api.auth.login(email.trim(), password);
      if (response && response.token && response.user) {
        setAuthToken(response.token);
        setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        localStorage.setItem('mailguard_user', JSON.stringify(response.user));
        return true;
      } else {
        setAuthError('Authentication succeeded but invalid response payload.');
        return false;
      }
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.message || 'Invalid email or password.';
      setAuthError(msg);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (getAuthToken()) {
        await api.auth.logout();
      }
    } catch {
      // ignore network errors on logout
    } finally {
      setAuthToken(null);
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setShowLogoutModal(false);
      localStorage.removeItem('mailguard_user');
      localStorage.removeItem('mailguard_token');
    }
  }, []);

  const updateUser = useCallback((updatedData) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedData };
      localStorage.setItem('mailguard_user', JSON.stringify(next));
      return next;
    });
  }, []);

  /**
   * Check if current user has one of the allowed roles
   */
  const hasRole = useCallback((allowedRoles = []) => {
    if (!user) return false;
    const userRole = user.role || 'Viewer';
    if (userRole === 'Super Admin') return true;
    if (typeof allowedRoles === 'string') {
      return userRole === allowedRoles;
    }
    return allowedRoles.includes(userRole);
  }, [user]);

  const value = {
    isAuthenticated,
    isLoading,
    user,
    token,
    authError,
    setAuthError,
    showLogoutModal,
    setShowLogoutModal,
    login,
    logout,
    updateUser,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

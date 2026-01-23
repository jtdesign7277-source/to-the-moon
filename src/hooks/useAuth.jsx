/**
 * TO THE MOON - Authentication Hook
 * Handles signup, login, logout, and user state.
 */
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { authApi, tokenManager } from '../utils/api';

// ============================================
// AUTH CONTEXT
// ============================================
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch current user on mount
  const fetchUser = useCallback(async () => {
    // Check for guest session first
    const guestUser = localStorage.getItem('ttm_guest_user');
    if (guestUser) {
      try {
        setUser(JSON.parse(guestUser));
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('ttm_guest_user');
      }
    }

    if (!tokenManager.isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await authApi.getMe();
      setUser(response.data.user || response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setUser(null);
      // Don't clear tokens here - interceptor handles 401s
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Listen for logout events from API interceptor
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      setError(null);
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  // ============================================
  // SIGNUP
  // ============================================
  const signup = async (email, username, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authApi.signup(email, username, password);
      const { access_token, refresh_token, user: userData } = response.data;

      tokenManager.setTokens(access_token, refresh_token);
      setUser(userData);

      return { success: true, user: userData };
    } catch (err) {
      const message = err.message || 'Signup failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // LOGIN
  // ============================================
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authApi.login(email, password);
      const { access_token, refresh_token, user: userData } = response.data;

      tokenManager.setTokens(access_token, refresh_token);
      setUser(userData);

      return { success: true, user: userData };
    } catch (err) {
      const message = err.message || 'Login failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // LOGOUT
  // ============================================
  const logout = async () => {
    // Check if guest user - no API call needed
    const isGuest = user?.is_guest;

    try {
      setLoading(true);
      if (!isGuest) {
        await authApi.logout();
      }
    } catch (err) {
      // Ignore logout errors - we're logging out anyway
      console.warn('Logout API error:', err);
    } finally {
      tokenManager.clearTokens();
      localStorage.removeItem('ttm_guest_user');
      setUser(null);
      setError(null);
      setLoading(false);
    }
  };

  // ============================================
  // GUEST LOGIN (no backend required)
  // ============================================
  const loginAsGuest = () => {
    const guestUser = {
      id: 'guest-' + Date.now(),
      email: 'guest@tothemoon.app',
      username: 'Guest User',
      is_pro: true, // Give guests pro access to test features
      is_guest: true,
      created_at: new Date().toISOString(),
    };

    // Store guest session in localStorage
    localStorage.setItem('ttm_guest_user', JSON.stringify(guestUser));
    setUser(guestUser);
    setError(null);

    return { success: true, user: guestUser };
  };

  // ============================================
  // REFRESH USER
  // ============================================
  const refreshUser = async () => {
    await fetchUser();
  };

  // ============================================
  // CLEAR ERROR
  // ============================================
  const clearError = () => setError(null);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    signup,
    login,
    loginAsGuest,
    logout,
    refreshUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================
// HOOK
// ============================================
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default useAuth;

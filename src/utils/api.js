/**
 * TO THE MOON - API Client
 * Axios instance with auth headers, error handling, and token management.
 */
import axios from 'axios';

// Base URL configuration
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Create axios instance
const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// TOKEN MANAGEMENT
// ============================================
const TOKEN_KEY = 'ttm_access_token';
const REFRESH_TOKEN_KEY = 'ttm_refresh_token';

export const tokenManager = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),

  setTokens: (accessToken, refreshToken = null) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
};

// ============================================
// REQUEST INTERCEPTOR - Add auth header
// ============================================
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================
// RESPONSE INTERCEPTOR - Handle errors & token refresh
// ============================================
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue requests while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenManager.getRefreshToken();

      if (refreshToken) {
        try {
          const response = await axios.post(`${BASE_URL}/api/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token } = response.data;
          tokenManager.setTokens(access_token);
          processQueue(null, access_token);

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          tokenManager.clearTokens();
          window.dispatchEvent(new CustomEvent('auth:logout'));
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        tokenManager.clearTokens();
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    }

    // Format error response
    const formattedError = {
      message: error.response?.data?.error || error.response?.data?.message || error.message || 'An error occurred',
      status: error.response?.status,
      data: error.response?.data,
    };

    return Promise.reject(formattedError);
  }
);

// ============================================
// AUTH ENDPOINTS
// ============================================
export const authApi = {
  signup: (email, username, password) =>
    api.post('/auth/signup', { email, username, password }),

  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  logout: () =>
    api.post('/auth/logout'),

  refresh: (refreshToken) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }),

  getMe: () =>
    api.get('/auth/me'),
};

// ============================================
// SUBSCRIPTION ENDPOINTS
// ============================================
export const subscriptionApi = {
  getStatus: () =>
    api.get('/subscription/status'),

  createCheckout: (successUrl, cancelUrl) =>
    api.post('/subscription/checkout', { success_url: successUrl, cancel_url: cancelUrl }),

  cancel: () =>
    api.post('/subscription/cancel'),
};

// ============================================
// STRATEGY ENDPOINTS
// ============================================
export const strategyApi = {
  list: (params = {}) =>
    api.get('/strategies', { params }),

  get: (id) =>
    api.get(`/strategies/${id}`),

  create: (data) =>
    api.post('/strategies', data),

  update: (id, data) =>
    api.put(`/strategies/${id}`, data),

  delete: (id) =>
    api.delete(`/strategies/${id}`),

  getTemplates: () =>
    api.get('/strategies/templates'),

  getMarketplace: (params = {}) =>
    api.get('/strategies/marketplace', { params }),

  follow: (id) =>
    api.post(`/strategies/${id}/follow`),

  unfollow: (id) =>
    api.delete(`/strategies/${id}/follow`),

  backtest: (strategyId, params) =>
    api.post('/strategies/backtest', { strategy_id: strategyId, ...params }),
};

// ============================================
// TRADE ENDPOINTS
// ============================================
export const tradeApi = {
  list: (params = {}) =>
    api.get('/trades', { params }),

  get: (id) =>
    api.get(`/trades/${id}`),

  open: (data) =>
    api.post('/trades', data),

  close: (id, exitPrice) =>
    api.post(`/trades/${id}/close`, { exit_price: exitPrice }),

  cancel: (id) =>
    api.post(`/trades/${id}/cancel`),

  getStats: () =>
    api.get('/trades/stats'),
};

// ============================================
// LEADERBOARD ENDPOINTS
// ============================================
export const leaderboardApi = {
  get: (period = 'monthly') =>
    api.get('/leaderboard', { params: { period } }),

  getMyRank: () =>
    api.get('/leaderboard/my-rank'),
};

// ============================================
// HEALTH CHECK
// ============================================
export const healthApi = {
  check: () =>
    api.get('/health'),
};

export default api;

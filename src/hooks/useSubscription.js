/**
 * TO THE MOON - Subscription Hook
 * Manages subscription status, Pro tier checks, and Stripe checkout.
 */
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { subscriptionApi, tokenManager } from '../utils/api';

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PRO: 'pro',
};

// ============================================
// SUBSCRIPTION CONTEXT
// ============================================
const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const [subscription, setSubscription] = useState(null);
  const [tier, setTier] = useState(SUBSCRIPTION_TIERS.FREE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Derived state
  const isPro = subscription?.is_pro || tier === SUBSCRIPTION_TIERS.PRO;
  const isFree = tier === SUBSCRIPTION_TIERS.FREE;
  const isActive = subscription?.is_active ?? true;
  const expiresAt = subscription?.expires_at ? new Date(subscription.expires_at) : null;
  const isCancelled = subscription?.cancelled_at != null;
  const isExpiringSoon = expiresAt
    ? expiresAt - new Date() < 7 * 24 * 60 * 60 * 1000
    : false;

  // ============================================
  // FETCH SUBSCRIPTION STATUS
  // ============================================
  const fetchSubscription = useCallback(async () => {
    if (!tokenManager.isAuthenticated()) {
      setSubscription(null);
      setTier(SUBSCRIPTION_TIERS.FREE);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await subscriptionApi.getStatus();
      const data = response.data.subscription || response.data;

      setSubscription(data);
      setTier(data.tier || SUBSCRIPTION_TIERS.FREE);
    } catch (err) {
      console.error('Failed to fetch subscription:', err);

      // Handle specific error cases
      if (err.status === 401) {
        // Not authenticated - default to free
        setTier(SUBSCRIPTION_TIERS.FREE);
        setError(null);
      } else if (err.status === 404) {
        // No subscription found - default to free
        setTier(SUBSCRIPTION_TIERS.FREE);
        setError(null);
      } else {
        setError(err.message || 'Failed to load subscription');
      }

      // Default to free tier on error
      setSubscription({ tier: 'free', is_pro: false, is_active: true });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Listen for auth changes
  useEffect(() => {
    const handleAuthChange = () => {
      fetchSubscription();
    };

    window.addEventListener('auth:login', handleAuthChange);
    window.addEventListener('auth:logout', handleAuthChange);

    return () => {
      window.removeEventListener('auth:login', handleAuthChange);
      window.removeEventListener('auth:logout', handleAuthChange);
    };
  }, [fetchSubscription]);

  // ============================================
  // CREATE CHECKOUT SESSION
  // ============================================
  const createCheckout = async (successUrl, cancelUrl) => {
    try {
      setLoading(true);
      setError(null);

      const response = await subscriptionApi.createCheckout(successUrl, cancelUrl);
      return {
        success: true,
        sessionId: response.data.session_id,
        url: response.data.url,
      };
    } catch (err) {
      const message = err.message || 'Failed to create checkout session';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // UPGRADE TO PRO (redirects to Stripe Checkout)
  // ============================================
  const upgradeToPro = async () => {
    const currentUrl = window.location.href;
    const successUrl = `${window.location.origin}/accounts?upgraded=true`;
    const cancelUrl = currentUrl;

    const result = await createCheckout(successUrl, cancelUrl);

    if (result.success && result.url) {
      // Redirect to Stripe Checkout
      window.location.href = result.url;
    }

    return result;
  };

  // ============================================
  // CANCEL SUBSCRIPTION
  // ============================================
  const cancelSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await subscriptionApi.cancel();

      // Update local state
      setSubscription((prev) => ({
        ...prev,
        cancelled_at: new Date().toISOString(),
        ...response.data,
      }));

      return {
        success: true,
        message: 'Subscription cancelled. You will have access until the end of your billing period.',
      };
    } catch (err) {
      const message = err.message || 'Failed to cancel subscription';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FEATURE ACCESS CONTROL
  // ============================================
  const freeFeatures = [
    'dashboard',
    'accounts',
    'leaderboard',
    'marketplace_browse',
    'paper_trading',
  ];

  const proFeatures = [
    ...freeFeatures,
    'strategy_builder',
    'create_strategy',
    'backtest',
    'live_trading',
    'advanced_analytics',
    'priority_support',
    'api_access',
    'custom_alerts',
    'multi_platform_arb',
  ];

  const requiresPro = (featureName) => {
    return !freeFeatures.includes(featureName);
  };

  const canAccess = (featureName) => {
    if (isPro) {
      return proFeatures.includes(featureName);
    }
    return freeFeatures.includes(featureName);
  };

  // ============================================
  // CLEAR ERROR
  // ============================================
  const clearError = () => setError(null);

  // ============================================
  // REFRESH
  // ============================================
  const refresh = () => fetchSubscription();

  const value = {
    // Core state
    subscription,
    tier,
    isPro,
    isFree,
    isActive,
    expiresAt,
    isCancelled,
    isExpiringSoon,
    loading,
    isLoading: loading, // Alias for backwards compatibility
    error,

    // Actions
    fetchSubscription,
    createCheckout,
    upgradeToPro,
    cancelSubscription,
    refresh,
    clearError,

    // Feature access
    requiresPro,
    canAccess,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================
export function useSubscription() {
  const context = useContext(SubscriptionContext);

  // If used outside provider, return standalone hook behavior
  if (!context) {
    // Fallback standalone implementation
    const [tier, setTier] = useState(SUBSCRIPTION_TIERS.FREE);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const fetchStatus = async () => {
        if (!tokenManager.isAuthenticated()) {
          setIsLoading(false);
          return;
        }
        try {
          const response = await subscriptionApi.getStatus();
          setTier(response.data.tier || SUBSCRIPTION_TIERS.FREE);
        } catch {
          setTier(SUBSCRIPTION_TIERS.FREE);
        } finally {
          setIsLoading(false);
        }
      };
      fetchStatus();
    }, []);

    return {
      tier,
      isPro: tier === SUBSCRIPTION_TIERS.PRO,
      isFree: tier === SUBSCRIPTION_TIERS.FREE,
      isLoading,
      loading: isLoading,
      error: null,
      subscription: null,
      upgradeToPro: async () => {},
      cancelSubscription: async () => {},
      refresh: () => {},
      clearError: () => {},
      requiresPro: () => true,
      canAccess: () => tier === SUBSCRIPTION_TIERS.PRO,
    };
  }

  return context;
}

/**
 * Hook for checking if a specific feature is available
 * @param {string} featureName - Name of the feature to check
 * @returns {Object} Feature availability state
 */
export function useFeatureAccess(featureName) {
  const { isPro, canAccess, requiresPro, isLoading } = useSubscription();

  return {
    hasAccess: canAccess(featureName),
    isLoading,
    requiresPro: requiresPro(featureName),
    isPro,
  };
}

export default useSubscription;

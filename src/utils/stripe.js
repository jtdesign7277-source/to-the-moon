/**
 * STRATIFY - Stripe Integration
 * Handles Stripe.js loading and checkout session management.
 */
import { subscriptionApi } from './api';

// Stripe public key from environment
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// Stripe.js instance (lazy loaded)
let stripePromise = null;

/**
 * Load Stripe.js library
 * @returns {Promise<Stripe>} Stripe instance
 */
export async function loadStripe() {
  if (!STRIPE_PUBLIC_KEY) {
    console.error('Stripe public key not configured. Set VITE_STRIPE_PUBLIC_KEY in .env');
    throw new Error('Stripe public key not configured');
  }

  if (stripePromise) {
    return stripePromise;
  }

  // Dynamically import Stripe.js
  stripePromise = new Promise((resolve, reject) => {
    // Check if Stripe is already loaded
    if (window.Stripe) {
      resolve(window.Stripe(STRIPE_PUBLIC_KEY));
      return;
    }

    // Load Stripe.js script
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;

    script.onload = () => {
      if (window.Stripe) {
        resolve(window.Stripe(STRIPE_PUBLIC_KEY));
      } else {
        reject(new Error('Stripe.js failed to load'));
      }
    };

    script.onerror = () => {
      reject(new Error('Failed to load Stripe.js script'));
    };

    document.head.appendChild(script);
  });

  return stripePromise;
}

/**
 * Create a Stripe Checkout session and redirect
 * @param {Object} options - Checkout options
 * @param {string} options.successUrl - URL to redirect on success
 * @param {string} options.cancelUrl - URL to redirect on cancel
 * @returns {Promise<Object>} Result object
 */
export async function createCheckoutSession({ successUrl, cancelUrl } = {}) {
  try {
    // Default URLs if not provided
    const success = successUrl || `${window.location.origin}/accounts?upgraded=true`;
    const cancel = cancelUrl || window.location.href;

    // Create checkout session via API
    const response = await subscriptionApi.createCheckout(success, cancel);
    const { session_id, url } = response.data;

    return {
      success: true,
      sessionId: session_id,
      url,
    };
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    return {
      success: false,
      error: error.message || 'Failed to create checkout session',
    };
  }
}

/**
 * Redirect to Stripe Checkout
 * @param {string} sessionId - Stripe Checkout session ID
 * @returns {Promise<Object>} Result object
 */
export async function redirectToCheckout(sessionId) {
  try {
    const stripe = await loadStripe();
    const { error } = await stripe.redirectToCheckout({ sessionId });

    if (error) {
      console.error('Stripe redirect error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to redirect to checkout:', error);
    return {
      success: false,
      error: error.message || 'Failed to redirect to checkout',
    };
  }
}

/**
 * Create checkout and redirect in one step
 * @param {Object} options - Checkout options
 * @returns {Promise<Object>} Result object
 */
export async function startCheckout(options = {}) {
  // Create session
  const sessionResult = await createCheckoutSession(options);

  if (!sessionResult.success) {
    return sessionResult;
  }

  // Prefer direct URL redirect (faster, no Stripe.js needed)
  if (sessionResult.url) {
    window.location.href = sessionResult.url;
    return { success: true, redirected: true };
  }

  // Fallback to Stripe.js redirect
  return redirectToCheckout(sessionResult.sessionId);
}

/**
 * Handle Stripe Checkout return
 * Checks URL params for success/cancel status
 * @returns {Object} Status object
 */
export function handleCheckoutReturn() {
  const params = new URLSearchParams(window.location.search);

  const upgraded = params.get('upgraded');
  const cancelled = params.get('cancelled');
  const sessionId = params.get('session_id');

  if (upgraded === 'true') {
    // Clean URL
    const url = new URL(window.location.href);
    url.searchParams.delete('upgraded');
    url.searchParams.delete('session_id');
    window.history.replaceState({}, '', url);

    return {
      status: 'success',
      message: 'Successfully upgraded to Pro!',
      sessionId,
    };
  }

  if (cancelled === 'true') {
    // Clean URL
    const url = new URL(window.location.href);
    url.searchParams.delete('cancelled');
    window.history.replaceState({}, '', url);

    return {
      status: 'cancelled',
      message: 'Checkout was cancelled',
    };
  }

  return { status: 'none' };
}

/**
 * Pro subscription price (for display)
 */
export const PRO_PRICE = {
  amount: 9.99,
  currency: 'USD',
  interval: 'month',
  formatted: '$9.99/month',
};

/**
 * Pro tier features list (for display)
 */
export const PRO_FEATURES = [
  'Create unlimited strategies',
  'Full backtesting engine',
  'Live trading mode',
  'Advanced analytics dashboard',
  'Priority support',
  'API access',
  'Custom alerts',
  'Multi-platform arbitrage',
];

export default {
  loadStripe,
  createCheckoutSession,
  redirectToCheckout,
  startCheckout,
  handleCheckoutReturn,
  PRO_PRICE,
  PRO_FEATURES,
};

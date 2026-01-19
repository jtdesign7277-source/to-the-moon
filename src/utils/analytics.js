/**
 * Google Analytics event tracking utilities
 * Measurement ID: G-CYZ19RNV30
 */

// Helper to safely call gtag
const gtag = (...args) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args)
  }
}

/**
 * Track user signup
 * @param {string} email - User's email address
 */
export const trackSignup = (email) => {
  gtag('event', 'sign_up', {
    method: 'email',
    email_domain: email.split('@')[1] || 'unknown',
  })
}

/**
 * Track Pro subscription upgrade
 * @param {number} amount - Amount in dollars
 * @param {string} planName - Name of the plan (e.g., 'monthly', 'yearly')
 */
export const trackProUpgrade = (amount, planName) => {
  gtag('event', 'purchase', {
    currency: 'USD',
    value: amount,
    items: [{
      item_name: `Pro ${planName}`,
      item_category: 'subscription',
      price: amount,
      quantity: 1,
    }],
  })
}

/**
 * Track strategy fork
 * @param {string} strategyName - Name of the forked strategy
 */
export const trackStrategyFork = (strategyName) => {
  gtag('event', 'strategy_fork', {
    strategy_name: strategyName,
  })
}

/**
 * Track backtest run
 * @param {string} strategyName - Name of the strategy being backtested
 */
export const trackBacktestRun = (strategyName) => {
  gtag('event', 'backtest_run', {
    strategy_name: strategyName,
  })
}

/**
 * Track strategy view
 * @param {string} strategyName - Name of the strategy being viewed
 */
export const trackStrategyView = (strategyName) => {
  gtag('event', 'strategy_view', {
    strategy_name: strategyName,
  })
}

/**
 * Track waitlist signup
 * @param {string} email - User's email address
 */
export const trackWaitlistSignup = (email) => {
  gtag('event', 'generate_lead', {
    currency: 'USD',
    value: 0,
    email_domain: email.split('@')[1] || 'unknown',
  })
}

/**
 * Track account connection (trading platform)
 * @param {string} platformName - Name of the platform connected
 */
export const trackAccountConnect = (platformName) => {
  gtag('event', 'account_connect', {
    platform_name: platformName,
  })
}

/**
 * Track strategy creation
 * @param {string} strategyName - Name of the created strategy
 * @param {string} strategyType - Type of strategy (custom, template, etc.)
 */
export const trackStrategyCreate = (strategyName, strategyType = 'custom') => {
  gtag('event', 'strategy_create', {
    strategy_name: strategyName,
    strategy_type: strategyType,
  })
}

/**
 * Track strategy deployment
 * @param {string} strategyName - Name of the deployed strategy
 */
export const trackStrategyDeploy = (strategyName) => {
  gtag('event', 'strategy_deploy', {
    strategy_name: strategyName,
  })
}

/**
 * Track page view
 * @param {string} pageName - Name of the page being viewed
 */
export const trackPageView = (pageName) => {
  gtag('event', 'page_view', {
    page_title: pageName,
    page_location: window.location.href,
  })
}

/**
 * Track button click
 * @param {string} buttonName - Name/label of the button clicked
 * @param {string} location - Where the button is located (e.g., 'dashboard', 'header')
 */
export const trackButtonClick = (buttonName, location = 'unknown') => {
  gtag('event', 'button_click', {
    button_name: buttonName,
    button_location: location,
  })
}

/**
 * Track upgrade modal open
 * @param {string} source - Where the upgrade was triggered from
 */
export const trackUpgradeModalOpen = (source) => {
  gtag('event', 'upgrade_modal_open', {
    source: source,
  })
}

/**
 * Track stat/metric view
 * @param {string} statName - Name of the stat being viewed
 * @param {string} statValue - Value of the stat
 */
export const trackStatView = (statName, statValue) => {
  gtag('event', 'stat_view', {
    stat_name: statName,
    stat_value: statValue,
  })
}

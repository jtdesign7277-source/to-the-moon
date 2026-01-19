/**
 * Market Data Fetcher Service
 * Fetches real market data from Kalshi and Manifold Markets APIs
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Kalshi API endpoints
const KALSHI_API = 'https://api.elections.kalshi.com/trade-api/v2';

// Manifold Markets API
const MANIFOLD_API = 'https://api.manifold.markets/v0';

/**
 * Standardized market format
 */
const normalizeMarket = (market, platform) => ({
  id: market.id || market.ticker,
  platform,
  title: market.title || market.question,
  category: market.category || market.group_slugs?.[0] || 'other',
  yesPrice: market.yes_price || market.probability || 0.5,
  noPrice: market.no_price || (1 - (market.probability || 0.5)),
  volume: market.volume || market.volume24Hours || 0,
  liquidity: market.liquidity || market.open_interest || 0,
  closeTime: market.close_time || market.closeTime,
  createdAt: market.created_at || market.createdTime,
  status: market.status || (market.isResolved ? 'resolved' : 'open'),
  resolution: market.result || market.resolution,
});

/**
 * Fetch markets from Kalshi
 */
export const fetchKalshiMarkets = async (options = {}) => {
  const { category, limit = 100, status = 'open' } = options;

  try {
    // Use our backend as proxy to avoid CORS
    const response = await fetch(`${API_BASE}/api/markets/kalshi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, limit, status }),
    });

    if (!response.ok) {
      throw new Error(`Kalshi API error: ${response.status}`);
    }

    const data = await response.json();
    return data.markets.map(m => normalizeMarket(m, 'kalshi'));
  } catch (error) {
    console.error('Failed to fetch Kalshi markets:', error);
    return [];
  }
};

/**
 * Fetch markets from Manifold
 */
export const fetchManifoldMarkets = async (options = {}) => {
  const { category, limit = 100, sort = 'liquidity' } = options;

  try {
    const response = await fetch(`${API_BASE}/api/markets/manifold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, limit, sort }),
    });

    if (!response.ok) {
      throw new Error(`Manifold API error: ${response.status}`);
    }

    const data = await response.json();
    return data.markets.map(m => normalizeMarket(m, 'manifold'));
  } catch (error) {
    console.error('Failed to fetch Manifold markets:', error);
    return [];
  }
};

/**
 * Fetch historical price data for a market
 */
export const getHistoricalData = async (marketId, platform, days = 180) => {
  try {
    const response = await fetch(`${API_BASE}/api/markets/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketId, platform, days }),
    });

    if (!response.ok) {
      throw new Error(`History API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch historical data:', error);
    return { prices: [], trades: [] };
  }
};

/**
 * Fetch all markets across platforms
 */
export const fetchAllMarkets = async (options = {}) => {
  const [kalshi, manifold] = await Promise.all([
    fetchKalshiMarkets(options),
    fetchManifoldMarkets(options),
  ]);

  return {
    kalshi,
    manifold,
    all: [...kalshi, ...manifold].sort((a, b) => b.volume - a.volume),
  };
};

/**
 * Run backtest for a strategy template
 */
export const runStrategyBacktest = async (strategyName, options = {}) => {
  const {
    days = 180,
    initialCapital = 10000,
  } = options;

  try {
    const response = await fetch(`${API_BASE}/api/backtest/strategy/${encodeURIComponent(strategyName)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days, initialCapital }),
    });

    if (!response.ok) {
      throw new Error(`Backtest API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to run backtest:', error);
    return null;
  }
};

/**
 * Run backtests for all strategies
 */
export const runAllBacktests = async (options = {}) => {
  try {
    const response = await fetch(`${API_BASE}/api/backtest/all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error(`Backtest API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to run all backtests:', error);
    return null;
  }
};

/**
 * Get cached backtest results
 */
export const getCachedBacktestResults = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/backtest/cached`);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get cached results:', error);
    return null;
  }
};

export default {
  fetchKalshiMarkets,
  fetchManifoldMarkets,
  fetchAllMarkets,
  getHistoricalData,
  runStrategyBacktest,
  runAllBacktests,
  getCachedBacktestResults,
};

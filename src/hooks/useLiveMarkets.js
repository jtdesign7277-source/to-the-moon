/**
 * useLiveMarkets Hook
 * Fetches real-time market data and trading opportunities from Kalshi via SDK
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { scannerApi } from '../utils/api'

/**
 * Hook for fetching live Kalshi markets
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether to enable fetching
 * @param {number} options.pollInterval - Polling interval in ms (default 30000)
 * @param {string} options.status - Market status filter ('open', 'closed', 'settled')
 * @param {number} options.limit - Max markets to fetch
 */
export function useLiveMarkets({
  enabled = true,
  pollInterval = 30000,
  status = 'open',
  limit = 100,
  category = null
} = {}) {
  const [markets, setMarkets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const intervalRef = useRef(null)

  const fetchMarkets = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)
      
      const params = { status, limit }
      if (category) params.category = category

      const response = await scannerApi.getLiveMarkets(params)
      
      if (response.data?.markets) {
        setMarkets(response.data.markets)
        setLastUpdated(new Date())
      }
    } catch (err) {
      console.error('Failed to fetch live markets:', err)
      setError(err.message || 'Failed to fetch markets')
    } finally {
      setLoading(false)
    }
  }, [enabled, status, limit, category])

  useEffect(() => {
    if (enabled) {
      fetchMarkets()
      
      if (pollInterval > 0) {
        intervalRef.current = setInterval(fetchMarkets, pollInterval)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, pollInterval, fetchMarkets])

  return {
    markets,
    loading,
    error,
    lastUpdated,
    refresh: fetchMarkets
  }
}

/**
 * Hook for fetching trading opportunities
 * @param {Object} options - Configuration options
 */
export function useLiveOpportunities({
  enabled = true,
  pollInterval = 15000,
  minEdge = 2.5,
  minVolume = 100,
  limit = 20
} = {}) {
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({ totalScanned: 0, count: 0 })
  const intervalRef = useRef(null)

  const fetchOpportunities = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)

      const response = await scannerApi.getLiveOpportunities({
        minEdge,
        minVolume,
        limit
      })
      
      if (response.data) {
        setOpportunities(response.data.opportunities || [])
        setStats({
          totalScanned: response.data.totalScanned || 0,
          count: response.data.count || 0
        })
      }
    } catch (err) {
      console.error('Failed to fetch opportunities:', err)
      setError(err.message || 'Failed to fetch opportunities')
    } finally {
      setLoading(false)
    }
  }, [enabled, minEdge, minVolume, limit])

  useEffect(() => {
    if (enabled) {
      fetchOpportunities()
      
      if (pollInterval > 0) {
        intervalRef.current = setInterval(fetchOpportunities, pollInterval)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, pollInterval, fetchOpportunities])

  return {
    opportunities,
    loading,
    error,
    stats,
    refresh: fetchOpportunities
  }
}

/**
 * Hook for fetching order book depth
 * @param {string} ticker - Market ticker
 * @param {Object} options - Configuration options
 */
export function useOrderbook(ticker, { enabled = true, depth = 5 } = {}) {
  const [orderbook, setOrderbook] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchOrderbook = useCallback(async () => {
    if (!enabled || !ticker) return

    try {
      setLoading(true)
      setError(null)

      const response = await scannerApi.getOrderbook(ticker, depth)
      
      if (response.data?.orderbook) {
        setOrderbook(response.data.orderbook)
      }
    } catch (err) {
      console.error(`Failed to fetch orderbook for ${ticker}:`, err)
      setError(err.message || 'Failed to fetch orderbook')
    } finally {
      setLoading(false)
    }
  }, [enabled, ticker, depth])

  useEffect(() => {
    fetchOrderbook()
  }, [fetchOrderbook])

  return {
    orderbook,
    loading,
    error,
    refresh: fetchOrderbook
  }
}

/**
 * Hook for fetching user's live portfolio (requires connected account)
 */
export function useLivePortfolio({ enabled = true, pollInterval = 60000 } = {}) {
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasAccount, setHasAccount] = useState(false)
  const intervalRef = useRef(null)

  const fetchPortfolio = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)

      // Import dynamically to avoid circular deps
      const { liveTradeApi } = await import('../utils/api')
      const response = await liveTradeApi.getSDKPortfolio()
      
      if (response.data) {
        setPortfolio(response.data)
        setHasAccount(true)
      }
    } catch (err) {
      console.error('Failed to fetch portfolio:', err)
      
      if (err.status === 400 || err.message?.includes('No connected')) {
        setHasAccount(false)
        setError(null) // Not an error, just no account
      } else {
        setError(err.message || 'Failed to fetch portfolio')
      }
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    if (enabled) {
      fetchPortfolio()
      
      if (pollInterval > 0) {
        intervalRef.current = setInterval(fetchPortfolio, pollInterval)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, pollInterval, fetchPortfolio])

  return {
    portfolio,
    loading,
    error,
    hasAccount,
    refresh: fetchPortfolio
  }
}

export default useLiveMarkets

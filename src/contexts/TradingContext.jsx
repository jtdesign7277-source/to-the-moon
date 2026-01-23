import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import { useApp } from '../hooks/useApp'

const TradingContext = createContext(null)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// ============================================
// TRADING DATA PROVIDER
// Centralized state for all trading data
// Used by: Alpha Lab, Trade Station, Dashboard, Strategy Builder, Accounts
// ============================================
export function TradingProvider({ children }) {
  const { tradingMode } = useApp()

  // ============================================
  // PORTFOLIO STATE (Account Balance, Equity, etc.)
  // ============================================
  const [portfolio, setPortfolio] = useState({
    balance: 0,
    equity: 0,
    buyingPower: 0,
    cash: 0,
    dayChange: 0,
    dayChangePercent: 0,
    totalGain: 0,
    totalGainPercent: 0,
    lastUpdated: null,
  })

  // ============================================
  // POSITIONS STATE (Current Holdings)
  // ============================================
  const [positions, setPositions] = useState([])

  // ============================================
  // STRATEGIES STATE (User-created strategies)
  // ============================================
  const [strategies, setStrategies] = useState(() => {
    try {
      const saved = localStorage.getItem('ttm_strategies')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // ============================================
  // DEPLOYED STRATEGIES (Active/Running)
  // ============================================
  const [deployedStrategies, setDeployedStrategies] = useState(() => {
    try {
      const saved = localStorage.getItem('ttm_deployed_strategies')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // ============================================
  // ORDERS STATE (Pending & Recent)
  // ============================================
  const [orders, setOrders] = useState([])

  // ============================================
  // WATCHLIST STATE
  // ============================================
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem('ttm_watchlist')
      return saved ? JSON.parse(saved) : ['AAPL', 'TSLA', 'NVDA', 'SPY', 'QQQ']
    } catch {
      return ['AAPL', 'TSLA', 'NVDA', 'SPY', 'QQQ']
    }
  })

  // ============================================
  // LOADING & ERROR STATES
  // ============================================
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastFetchTime, setLastFetchTime] = useState(null)

  // ============================================
  // PERSIST TO LOCAL STORAGE
  // ============================================
  useEffect(() => {
    localStorage.setItem('ttm_strategies', JSON.stringify(strategies))
  }, [strategies])

  useEffect(() => {
    localStorage.setItem('ttm_deployed_strategies', JSON.stringify(deployedStrategies))
  }, [deployedStrategies])

  useEffect(() => {
    localStorage.setItem('ttm_watchlist', JSON.stringify(watchlist))
  }, [watchlist])

  // ============================================
  // FETCH ALL TRADING DATA
  // ============================================
  const fetchTradingData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('ttm_access_token')
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}

      // Fetch portfolio/account data
      const portfolioRes = await fetch(
        `${API_URL}/api/alpaca/account?mode=${tradingMode}`,
        { headers }
      ).catch(() => null)

      if (portfolioRes?.ok) {
        const data = await portfolioRes.json()
        if (data.account) {
          setPortfolio({
            balance: parseFloat(data.account.portfolio_value || data.account.equity || 0),
            equity: parseFloat(data.account.equity || 0),
            buyingPower: parseFloat(data.account.buying_power || 0),
            cash: parseFloat(data.account.cash || 0),
            dayChange: parseFloat(data.account.equity || 0) - parseFloat(data.account.last_equity || 0),
            dayChangePercent: data.account.last_equity
              ? ((parseFloat(data.account.equity) - parseFloat(data.account.last_equity)) / parseFloat(data.account.last_equity)) * 100
              : 0,
            totalGain: 0,
            totalGainPercent: 0,
            lastUpdated: new Date(),
          })
        }
      }

      // Fetch positions
      const positionsRes = await fetch(
        `${API_URL}/api/alpaca/positions?mode=${tradingMode}`,
        { headers }
      ).catch(() => null)

      if (positionsRes?.ok) {
        const data = await positionsRes.json()
        if (data.positions) {
          setPositions(data.positions.map(pos => ({
            symbol: pos.symbol,
            qty: parseFloat(pos.qty),
            avgEntryPrice: parseFloat(pos.avg_entry_price),
            currentPrice: parseFloat(pos.current_price),
            marketValue: parseFloat(pos.market_value),
            unrealizedPL: parseFloat(pos.unrealized_pl),
            unrealizedPLPercent: parseFloat(pos.unrealized_plpc) * 100,
            side: pos.side,
          })))
        }
      }

      // Fetch orders
      const ordersRes = await fetch(
        `${API_URL}/api/alpaca/orders?mode=${tradingMode}`,
        { headers }
      ).catch(() => null)

      if (ordersRes?.ok) {
        const data = await ordersRes.json()
        if (data.orders) {
          setOrders(data.orders.map(order => ({
            id: order.id,
            symbol: order.symbol,
            qty: parseFloat(order.qty),
            side: order.side,
            type: order.type,
            status: order.status,
            filledQty: parseFloat(order.filled_qty || 0),
            filledAvgPrice: parseFloat(order.filled_avg_price || 0),
            submittedAt: order.submitted_at,
            filledAt: order.filled_at,
          })))
        }
      }

      // Fetch deployed strategies from backend
      const strategiesRes = await fetch(
        `${API_URL}/api/strategies/deployed?mode=${tradingMode}`,
        { headers }
      ).catch(() => null)

      if (strategiesRes?.ok) {
        const data = await strategiesRes.json()
        if (data.strategies) {
          setDeployedStrategies(data.strategies)
        }
      }

      setLastFetchTime(new Date())
    } catch (err) {
      console.error('Error fetching trading data:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [tradingMode])

  // ============================================
  // AUTO-REFRESH DATA
  // ============================================
  useEffect(() => {
    // Initial fetch
    fetchTradingData()

    // Refresh every 30 seconds when page is visible
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchTradingData()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchTradingData])

  // Refetch when trading mode changes
  useEffect(() => {
    fetchTradingData()
  }, [tradingMode, fetchTradingData])

  // ============================================
  // STRATEGY ACTIONS
  // ============================================
  const saveStrategy = useCallback((strategy) => {
    const newStrategy = {
      id: strategy.id || `strategy-${Date.now()}`,
      ...strategy,
      createdAt: strategy.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setStrategies(prev => {
      const exists = prev.find(s => s.id === newStrategy.id)
      if (exists) {
        return prev.map(s => s.id === newStrategy.id ? newStrategy : s)
      }
      return [newStrategy, ...prev]
    })

    return newStrategy
  }, [])

  const deleteStrategy = useCallback((strategyId) => {
    setStrategies(prev => prev.filter(s => s.id !== strategyId))
    setDeployedStrategies(prev => prev.filter(s => s.strategyId !== strategyId))
  }, [])

  const deployStrategy = useCallback(async (strategy, mode = 'paper') => {
    const token = localStorage.getItem('ttm_access_token')

    try {
      const res = await fetch(`${API_URL}/api/strategies/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ strategy, mode }),
      })

      if (res.ok) {
        const data = await res.json()
        const deployed = {
          id: data.deploymentId || `deploy-${Date.now()}`,
          strategyId: strategy.id,
          strategyName: strategy.name,
          mode,
          status: 'active',
          deployedAt: new Date().toISOString(),
          trades: 0,
          pnl: 0,
        }
        setDeployedStrategies(prev => [deployed, ...prev])
        return deployed
      }
    } catch (err) {
      console.error('Error deploying strategy:', err)
    }

    // Fallback for local deployment
    const deployed = {
      id: `deploy-${Date.now()}`,
      strategyId: strategy.id,
      strategyName: strategy.name,
      mode,
      status: 'active',
      deployedAt: new Date().toISOString(),
      trades: 0,
      pnl: 0,
    }
    setDeployedStrategies(prev => [deployed, ...prev])
    return deployed
  }, [])

  const pauseStrategy = useCallback((deploymentId) => {
    setDeployedStrategies(prev => prev.map(d =>
      d.id === deploymentId ? { ...d, status: 'paused' } : d
    ))
  }, [])

  const resumeStrategy = useCallback((deploymentId) => {
    setDeployedStrategies(prev => prev.map(d =>
      d.id === deploymentId ? { ...d, status: 'active' } : d
    ))
  }, [])

  const stopStrategy = useCallback((deploymentId) => {
    setDeployedStrategies(prev => prev.filter(d => d.id !== deploymentId))
  }, [])

  // ============================================
  // ORDER ACTIONS
  // ============================================
  const placeOrder = useCallback(async (orderData) => {
    const token = localStorage.getItem('ttm_access_token')

    try {
      const res = await fetch(`${API_URL}/api/alpaca/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...orderData,
          mode: tradingMode,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        // Refresh data after order
        setTimeout(fetchTradingData, 1000)
        return { success: true, order: data.order }
      } else {
        const error = await res.json()
        return { success: false, error: error.message }
      }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [tradingMode, fetchTradingData])

  const cancelOrder = useCallback(async (orderId) => {
    const token = localStorage.getItem('ttm_access_token')

    try {
      const res = await fetch(`${API_URL}/api/alpaca/order/${orderId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })

      if (res.ok) {
        setOrders(prev => prev.filter(o => o.id !== orderId))
        return { success: true }
      }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  // ============================================
  // POSITION ACTIONS
  // ============================================
  const closePosition = useCallback(async (symbol) => {
    const token = localStorage.getItem('ttm_access_token')

    try {
      const res = await fetch(`${API_URL}/api/alpaca/positions/${symbol}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })

      if (res.ok) {
        setPositions(prev => prev.filter(p => p.symbol !== symbol))
        setTimeout(fetchTradingData, 1000)
        return { success: true }
      }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [fetchTradingData])

  // ============================================
  // WATCHLIST ACTIONS
  // ============================================
  const addToWatchlist = useCallback((symbol) => {
    setWatchlist(prev => {
      if (prev.includes(symbol)) return prev
      return [...prev, symbol]
    })
  }, [])

  const removeFromWatchlist = useCallback((symbol) => {
    setWatchlist(prev => prev.filter(s => s !== symbol))
  }, [])

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const totalPositionValue = useMemo(() =>
    positions.reduce((sum, pos) => sum + pos.marketValue, 0)
  , [positions])

  const totalUnrealizedPL = useMemo(() =>
    positions.reduce((sum, pos) => sum + pos.unrealizedPL, 0)
  , [positions])

  const activeStrategiesCount = useMemo(() =>
    deployedStrategies.filter(d => d.status === 'active').length
  , [deployedStrategies])

  const pendingOrdersCount = useMemo(() =>
    orders.filter(o => o.status === 'pending' || o.status === 'new').length
  , [orders])

  // ============================================
  // CONTEXT VALUE
  // ============================================
  const value = useMemo(() => ({
    // Portfolio
    portfolio,

    // Positions
    positions,
    totalPositionValue,
    totalUnrealizedPL,

    // Strategies
    strategies,
    deployedStrategies,
    activeStrategiesCount,
    saveStrategy,
    deleteStrategy,
    deployStrategy,
    pauseStrategy,
    resumeStrategy,
    stopStrategy,

    // Orders
    orders,
    pendingOrdersCount,
    placeOrder,
    cancelOrder,

    // Positions actions
    closePosition,

    // Watchlist
    watchlist,
    addToWatchlist,
    removeFromWatchlist,

    // Loading/Error state
    isLoading,
    error,
    lastFetchTime,

    // Manual refresh
    refreshData: fetchTradingData,
  }), [
    portfolio,
    positions,
    totalPositionValue,
    totalUnrealizedPL,
    strategies,
    deployedStrategies,
    activeStrategiesCount,
    saveStrategy,
    deleteStrategy,
    deployStrategy,
    pauseStrategy,
    resumeStrategy,
    stopStrategy,
    orders,
    pendingOrdersCount,
    placeOrder,
    cancelOrder,
    closePosition,
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isLoading,
    error,
    lastFetchTime,
    fetchTradingData,
  ])

  return (
    <TradingContext.Provider value={value}>
      {children}
    </TradingContext.Provider>
  )
}

// ============================================
// HOOK TO USE TRADING CONTEXT
// ============================================
export function useTrading() {
  const context = useContext(TradingContext)
  if (!context) {
    throw new Error('useTrading must be used within a TradingProvider')
  }
  return context
}

export default TradingContext

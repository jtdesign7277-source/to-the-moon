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
  // STRATEGY TRADES (Trades linked to strategies)
  // ============================================
  const [strategyTrades, setStrategyTrades] = useState(() => {
    try {
      const saved = localStorage.getItem('ttm_strategy_trades')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

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

  useEffect(() => {
    localStorage.setItem('ttm_strategy_trades', JSON.stringify(strategyTrades))
  }, [strategyTrades])

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
  // STRATEGY TRADE ACTIONS
  // ============================================
  const logStrategyTrade = useCallback((deploymentId, tradeData) => {
    const trade = {
      id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      deploymentId,
      symbol: tradeData.symbol,
      side: tradeData.side,
      quantity: tradeData.quantity,
      entryPrice: tradeData.entryPrice,
      entryTime: new Date().toISOString(),
      status: 'open',
      exitPrice: null,
      exitTime: null,
      pnl: null,
      pnlPercent: null,
    }
    setStrategyTrades(prev => [trade, ...prev])
    return trade
  }, [])

  const closeStrategyTrade = useCallback((tradeId, exitPrice) => {
    setStrategyTrades(prev => prev.map(trade => {
      if (trade.id === tradeId) {
        const pnl = trade.side === 'buy'
          ? (exitPrice - trade.entryPrice) * trade.quantity
          : (trade.entryPrice - exitPrice) * trade.quantity
        const pnlPercent = trade.side === 'buy'
          ? ((exitPrice - trade.entryPrice) / trade.entryPrice) * 100
          : ((trade.entryPrice - exitPrice) / trade.entryPrice) * 100
        return {
          ...trade,
          status: 'closed',
          exitPrice,
          exitTime: new Date().toISOString(),
          pnl,
          pnlPercent,
        }
      }
      return trade
    }))
  }, [])

  // Kill switch - close all positions for a specific strategy
  const killStrategy = useCallback(async (deploymentId) => {
    const token = localStorage.getItem('ttm_access_token')

    // Get all open trades for this strategy
    const openTrades = strategyTrades.filter(
      t => t.deploymentId === deploymentId && t.status === 'open'
    )

    // Close each position
    const closePromises = openTrades.map(async (trade) => {
      try {
        const res = await fetch(`${API_URL}/api/alpaca/positions/${trade.symbol}`, {
          method: 'DELETE',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        })
        if (res.ok) {
          // Get current price for P&L calculation
          const position = positions.find(p => p.symbol === trade.symbol)
          const exitPrice = position?.currentPrice || trade.entryPrice
          closeStrategyTrade(trade.id, exitPrice)
        }
      } catch (err) {
        console.error(`Error closing position ${trade.symbol}:`, err)
      }
    })

    await Promise.all(closePromises)

    // Stop the strategy
    stopStrategy(deploymentId)

    // Refresh data
    fetchTradingData()

    return { success: true }
  }, [strategyTrades, positions, closeStrategyTrade, stopStrategy, fetchTradingData])

  // Kill ALL strategies and positions
  const killAllStrategies = useCallback(async () => {
    const token = localStorage.getItem('ttm_access_token')

    try {
      // Close all positions via Alpaca
      const res = await fetch(`${API_URL}/api/alpaca/positions`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })

      if (res.ok) {
        // Mark all open trades as closed
        setStrategyTrades(prev => prev.map(trade => {
          if (trade.status === 'open') {
            const position = positions.find(p => p.symbol === trade.symbol)
            const exitPrice = position?.currentPrice || trade.entryPrice
            const pnl = trade.side === 'buy'
              ? (exitPrice - trade.entryPrice) * trade.quantity
              : (trade.entryPrice - exitPrice) * trade.quantity
            return {
              ...trade,
              status: 'closed',
              exitPrice,
              exitTime: new Date().toISOString(),
              pnl,
              pnlPercent: ((exitPrice - trade.entryPrice) / trade.entryPrice) * 100,
            }
          }
          return trade
        }))

        // Stop all deployed strategies
        setDeployedStrategies([])

        // Refresh data
        fetchTradingData()

        return { success: true }
      }
    } catch (err) {
      console.error('Error killing all strategies:', err)
      return { success: false, error: err.message }
    }
  }, [positions, fetchTradingData])

  // Get trades for a specific strategy
  const getStrategyTrades = useCallback((deploymentId) => {
    return strategyTrades.filter(t => t.deploymentId === deploymentId)
  }, [strategyTrades])

  // Get open trades for a strategy
  const getOpenTrades = useCallback((deploymentId) => {
    return strategyTrades.filter(t => t.deploymentId === deploymentId && t.status === 'open')
  }, [strategyTrades])

  // Get closed trades for a strategy
  const getClosedTrades = useCallback((deploymentId) => {
    return strategyTrades.filter(t => t.deploymentId === deploymentId && t.status === 'closed')
  }, [strategyTrades])

  // Calculate total P&L for a strategy
  const getStrategyPnL = useCallback((deploymentId) => {
    const trades = strategyTrades.filter(t => t.deploymentId === deploymentId)
    const closedPnL = trades
      .filter(t => t.status === 'closed')
      .reduce((sum, t) => sum + (t.pnl || 0), 0)

    // Add unrealized P&L from open trades
    const openPnL = trades
      .filter(t => t.status === 'open')
      .reduce((sum, t) => {
        const position = positions.find(p => p.symbol === t.symbol)
        if (position) {
          return sum + (t.side === 'buy'
            ? (position.currentPrice - t.entryPrice) * t.quantity
            : (t.entryPrice - position.currentPrice) * t.quantity)
        }
        return sum
      }, 0)

    return { closedPnL, openPnL, totalPnL: closedPnL + openPnL }
  }, [strategyTrades, positions])

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

    // Strategy Trades
    strategyTrades,
    logStrategyTrade,
    closeStrategyTrade,
    getStrategyTrades,
    getOpenTrades,
    getClosedTrades,
    getStrategyPnL,
    killStrategy,
    killAllStrategies,

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
    strategyTrades,
    logStrategyTrade,
    closeStrategyTrade,
    getStrategyTrades,
    getOpenTrades,
    getClosedTrades,
    getStrategyPnL,
    killStrategy,
    killAllStrategies,
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

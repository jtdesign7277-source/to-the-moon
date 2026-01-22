import { createContext, useState, useCallback, useMemo, useEffect } from 'react'

const AppContext = createContext(null)

// ============================================
// INITIAL SAMPLE DATA
// ============================================
const INITIAL_OPEN_BETS = [
  {
    id: 'bet-001',
    ticker: 'TRUMP-2024',
    event: 'Trump wins 2024 Presidential Election',
    platform: 'Kalshi',
    position: 'YES',
    contracts: 150,
    entryPrice: 0.42,
    currentPrice: 0.48,
    potentialPayout: 150.00,
    profit: 9.00,
    profitPercent: 14.3,
    placedAt: new Date(Date.now() - 3600000 * 24),
    expiresAt: new Date('2024-11-05'),
    status: 'active',
    strategy: 'Momentum',
  },
  {
    id: 'bet-002',
    ticker: 'FED-DEC',
    event: 'Fed cuts rates in December',
    platform: 'Polymarket',
    position: 'NO',
    contracts: 200,
    entryPrice: 0.65,
    currentPrice: 0.58,
    potentialPayout: 200.00,
    profit: 14.00,
    profitPercent: 10.8,
    placedAt: new Date(Date.now() - 3600000 * 48),
    expiresAt: new Date('2024-12-18'),
    status: 'active',
    strategy: 'Mean Reversion',
  },
  {
    id: 'bet-003',
    ticker: 'BTC-100K',
    event: 'Bitcoin hits $100K in 2024',
    platform: 'Kalshi',
    position: 'YES',
    contracts: 75,
    entryPrice: 0.28,
    currentPrice: 0.31,
    potentialPayout: 75.00,
    profit: 2.25,
    profitPercent: 10.7,
    placedAt: new Date(Date.now() - 3600000 * 72),
    expiresAt: new Date('2024-12-31'),
    status: 'active',
    strategy: 'Trend Following',
  },
  {
    id: 'bet-004',
    ticker: 'AAPL-Q4',
    event: 'Apple beats Q4 earnings expectations',
    platform: 'Manifold',
    position: 'YES',
    contracts: 100,
    entryPrice: 0.72,
    currentPrice: 0.68,
    potentialPayout: 100.00,
    profit: -4.00,
    profitPercent: -5.6,
    placedAt: new Date(Date.now() - 3600000 * 12),
    expiresAt: new Date('2024-10-31'),
    status: 'active',
    strategy: 'News Catalyst',
  },
]

const INITIAL_TRADE_HISTORY = [
  // January 2026 sample trades - mix of wins and losses
  {
    id: 'trade-001',
    ticker: 'SPY-500',
    event: 'S&P 500 closes above 5500',
    platform: 'Kalshi',
    position: 'YES',
    contracts: 100,
    entryPrice: 0.55,
    exitPrice: 1.00,
    pnl: 45.00,
    pnlPercent: 81.8,
    placedAt: new Date('2026-01-20T10:30:00'),
    settledAt: new Date('2026-01-20T16:00:00'),
    status: 'won',
    strategy: 'Momentum',
    outcome: 'YES',
  },
  {
    id: 'trade-002',
    ticker: 'BTC-70K',
    event: 'Bitcoin above 70K',
    platform: 'Polymarket',
    position: 'YES',
    contracts: 50,
    entryPrice: 0.65,
    exitPrice: 1.00,
    pnl: 17.50,
    pnlPercent: 53.8,
    placedAt: new Date('2026-01-20T14:00:00'),
    settledAt: new Date('2026-01-20T18:00:00'),
    status: 'won',
    strategy: 'Crypto Momentum',
    outcome: 'YES',
  },
  {
    id: 'trade-003',
    ticker: 'NVDA-Q4',
    event: 'NVIDIA beats Q4 earnings',
    platform: 'Polymarket',
    position: 'YES',
    contracts: 150,
    entryPrice: 0.78,
    exitPrice: 1.00,
    pnl: 33.00,
    pnlPercent: 28.2,
    placedAt: new Date('2026-01-18T09:00:00'),
    settledAt: new Date('2026-01-18T20:00:00'),
    status: 'won',
    strategy: 'News Catalyst',
    outcome: 'YES',
  },
  {
    id: 'trade-004',
    ticker: 'RAIN-NYC',
    event: 'Rain in NYC on Jan 16',
    platform: 'Kalshi',
    position: 'NO',
    contracts: 50,
    entryPrice: 0.40,
    exitPrice: 0.00,
    pnl: -20.00,
    pnlPercent: -50.0,
    placedAt: new Date('2026-01-16T08:00:00'),
    settledAt: new Date('2026-01-16T23:00:00'),
    status: 'lost',
    strategy: 'Weather',
    outcome: 'YES',
  },
  {
    id: 'trade-005',
    ticker: 'FED-JAN',
    event: 'Fed holds rates in January',
    platform: 'Kalshi',
    position: 'YES',
    contracts: 75,
    entryPrice: 0.82,
    exitPrice: 1.00,
    pnl: 13.50,
    pnlPercent: 22.0,
    placedAt: new Date('2026-01-15T11:00:00'),
    settledAt: new Date('2026-01-15T14:30:00'),
    status: 'won',
    strategy: 'Macro',
    outcome: 'YES',
  },
  {
    id: 'trade-006',
    ticker: 'AAPL-200',
    event: 'Apple closes above $200',
    platform: 'Kalshi',
    position: 'YES',
    contracts: 80,
    entryPrice: 0.70,
    exitPrice: 0.00,
    pnl: -56.00,
    pnlPercent: -100.0,
    placedAt: new Date('2026-01-13T10:00:00'),
    settledAt: new Date('2026-01-13T16:00:00'),
    status: 'lost',
    strategy: 'Momentum',
    outcome: 'NO',
  },
  {
    id: 'trade-007',
    ticker: 'TSLA-300',
    event: 'Tesla closes above $300',
    platform: 'Polymarket',
    position: 'YES',
    contracts: 60,
    entryPrice: 0.45,
    exitPrice: 1.00,
    pnl: 33.00,
    pnlPercent: 122.2,
    placedAt: new Date('2026-01-10T09:30:00'),
    settledAt: new Date('2026-01-10T16:00:00'),
    status: 'won',
    strategy: 'Momentum',
    outcome: 'YES',
  },
  {
    id: 'trade-008',
    ticker: 'SNOW-DAY',
    event: 'Snow in Chicago Jan 8',
    platform: 'Kalshi',
    position: 'YES',
    contracts: 40,
    entryPrice: 0.60,
    exitPrice: 0.00,
    pnl: -24.00,
    pnlPercent: -100.0,
    placedAt: new Date('2026-01-08T07:00:00'),
    settledAt: new Date('2026-01-08T23:59:00'),
    status: 'lost',
    strategy: 'Weather',
    outcome: 'NO',
  },
]

// ============================================
// LOCAL STORAGE KEYS
// ============================================
const STORAGE_KEYS = {
  OPEN_BETS: 'ttm_open_bets',
  TRADE_HISTORY: 'ttm_trade_history',
  PORTFOLIO_STATS: 'ttm_portfolio_stats',
}

// ============================================
// APP PROVIDER COMPONENT
// ============================================
export function AppProvider({ children }) {
  // Subscription state
  const [isPro, setIsPro] = useState(false)

  // Trading mode state
  const [tradingMode, setTradingMode] = useState('paper') // 'paper' | 'live'

  // UI state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showLunaChat, setShowLunaChat] = useState(false)

  // ============================================
  // GLOBAL BETTING/TRADING STATE
  // ============================================
  
  // Open bets - positions that are still active (manual trades)
  const [openBets, setOpenBets] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.OPEN_BETS)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Convert date strings back to Date objects
        return parsed.map(bet => ({
          ...bet,
          placedAt: new Date(bet.placedAt),
          expiresAt: new Date(bet.expiresAt),
        }))
      }
    } catch (e) {
      console.error('Failed to load open bets:', e)
    }
    return INITIAL_OPEN_BETS
  })

  // Strategy bets - positions executed by automated strategies
  const [strategyBets, setStrategyBets] = useState(() => {
    try {
      const saved = localStorage.getItem('ttm_strategy_bets')
      if (saved) {
        const parsed = JSON.parse(saved)
        return parsed.map(bet => ({
          ...bet,
          placedAt: new Date(bet.placedAt),
          expiresAt: bet.expiresAt ? new Date(bet.expiresAt) : null,
        }))
      }
    } catch (e) {
      console.error('Failed to load strategy bets:', e)
    }
    return []
  })

  // Trade history - closed/settled positions
  const [tradeHistory, setTradeHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return parsed.map(trade => ({
          ...trade,
          placedAt: new Date(trade.placedAt),
          settledAt: new Date(trade.settledAt),
        }))
      }
    } catch (e) {
      console.error('Failed to load trade history:', e)
    }
    return INITIAL_TRADE_HISTORY
  })

  // Portfolio stats - derived from bets and trades
  const [portfolioStats, setPortfolioStats] = useState({
    totalPnl: 0,
    realizedPnl: 0,
    unrealizedPnl: 0,
    winRate: 0,
    totalTrades: 0,
    openPositions: 0,
    winningTrades: 0,
    losingTrades: 0,
    totalInvested: 0,
    bestTrade: 0,
    worstTrade: 0,
    avgWin: 0,
    avgLoss: 0,
    winLossRatio: 0,
  })

  // ============================================
  // PERSIST TO LOCAL STORAGE
  // ============================================
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.OPEN_BETS, JSON.stringify(openBets))
  }, [openBets])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(tradeHistory))
  }, [tradeHistory])

  useEffect(() => {
    localStorage.setItem('ttm_strategy_bets', JSON.stringify(strategyBets))
  }, [strategyBets])

  // ============================================
  // CALCULATE PORTFOLIO STATS
  // ============================================
  useEffect(() => {
    // Calculate realized P&L from trade history
    const realizedPnl = tradeHistory.reduce((sum, trade) => sum + (trade.pnl || 0), 0)
    
    // Calculate unrealized P&L from open bets
    const unrealizedPnl = openBets.reduce((sum, bet) => sum + (bet.profit || 0), 0)
    
    // Calculate total invested in open positions
    const totalInvested = openBets.reduce((sum, bet) => sum + (bet.entryPrice * bet.contracts), 0)
    
    // Calculate win/loss stats from trade history
    const wonTrades = tradeHistory.filter(t => t.status === 'won')
    const lostTrades = tradeHistory.filter(t => t.status === 'lost')
    const closedTrades = wonTrades.length + lostTrades.length
    
    // Find best and worst trades
    const pnls = tradeHistory.map(t => t.pnl || 0)
    const bestTrade = pnls.length > 0 ? Math.max(...pnls) : 0
    const worstTrade = pnls.length > 0 ? Math.min(...pnls) : 0

    // Calculate average win and average loss
    const winPnls = wonTrades.map(t => t.pnl || 0)
    const lossPnls = lostTrades.map(t => Math.abs(t.pnl || 0))
    const avgWin = winPnls.length > 0 ? winPnls.reduce((a, b) => a + b, 0) / winPnls.length : 0
    const avgLoss = lossPnls.length > 0 ? lossPnls.reduce((a, b) => a + b, 0) / lossPnls.length : 0
    const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0

    setPortfolioStats({
      totalPnl: realizedPnl + unrealizedPnl,
      realizedPnl,
      unrealizedPnl,
      winRate: closedTrades > 0 ? Math.round((wonTrades.length / closedTrades) * 100) : 0,
      totalTrades: tradeHistory.length,
      openPositions: openBets.length,
      winningTrades: wonTrades.length,
      losingTrades: lostTrades.length,
      totalInvested,
      bestTrade,
      worstTrade,
      avgWin,
      avgLoss,
      winLossRatio,
    })
  }, [openBets, tradeHistory])

  // ============================================
  // BETTING ACTIONS
  // ============================================

  // Place a new bet
  const placeBet = useCallback((betData) => {
    const newBet = {
      id: `bet-${Date.now()}`,
      ...betData,
      placedAt: new Date(),
      status: 'active',
      profit: 0,
      profitPercent: 0,
      currentPrice: betData.entryPrice,
    }
    setOpenBets(prev => [newBet, ...prev])
    return newBet
  }, [])

  // Update a bet's current price and profit
  const updateBetPrice = useCallback((betId, newPrice) => {
    setOpenBets(prev => prev.map(bet => {
      if (bet.id !== betId) return bet
      const profit = (newPrice - bet.entryPrice) * bet.contracts * (bet.position === 'YES' ? 1 : -1)
      const profitPercent = ((newPrice - bet.entryPrice) / bet.entryPrice) * 100 * (bet.position === 'YES' ? 1 : -1)
      return {
        ...bet,
        currentPrice: newPrice,
        profit,
        profitPercent,
      }
    }))
  }, [])

  // Close a position manually (sell before settlement)
  const closeBet = useCallback((betId, exitPrice) => {
    const bet = openBets.find(b => b.id === betId)
    if (!bet) return null

    const pnl = (exitPrice - bet.entryPrice) * bet.contracts * (bet.position === 'YES' ? 1 : -1)
    const pnlPercent = ((exitPrice - bet.entryPrice) / bet.entryPrice) * 100 * (bet.position === 'YES' ? 1 : -1)

    const closedTrade = {
      id: `trade-${Date.now()}`,
      ticker: bet.ticker,
      event: bet.event,
      platform: bet.platform,
      position: bet.position,
      contracts: bet.contracts,
      entryPrice: bet.entryPrice,
      exitPrice,
      pnl,
      pnlPercent,
      placedAt: bet.placedAt,
      settledAt: new Date(),
      status: pnl >= 0 ? 'won' : 'lost',
      strategy: bet.strategy,
      outcome: 'closed',
    }

    // Remove from open bets
    setOpenBets(prev => prev.filter(b => b.id !== betId))
    
    // Add to trade history
    setTradeHistory(prev => [closedTrade, ...prev])

    return closedTrade
  }, [openBets])

  // Settle a bet (market resolved)
  const settleBet = useCallback((betId, outcome) => {
    const bet = openBets.find(b => b.id === betId)
    if (!bet) return null

    // Calculate P&L based on outcome
    const won = (bet.position === 'YES' && outcome === 'YES') || (bet.position === 'NO' && outcome === 'NO')
    const exitPrice = won ? 1.00 : 0.00
    const pnl = won 
      ? bet.contracts * (1 - bet.entryPrice) 
      : -bet.contracts * bet.entryPrice
    const pnlPercent = won
      ? ((1 - bet.entryPrice) / bet.entryPrice) * 100
      : -100

    const settledTrade = {
      id: `trade-${Date.now()}`,
      ticker: bet.ticker,
      event: bet.event,
      platform: bet.platform,
      position: bet.position,
      contracts: bet.contracts,
      entryPrice: bet.entryPrice,
      exitPrice,
      pnl,
      pnlPercent,
      placedAt: bet.placedAt,
      settledAt: new Date(),
      status: won ? 'won' : 'lost',
      strategy: bet.strategy,
      outcome,
    }

    // Remove from open bets
    setOpenBets(prev => prev.filter(b => b.id !== betId))
    
    // Add to trade history
    setTradeHistory(prev => [settledTrade, ...prev])

    return settledTrade
  }, [openBets])

  // Delete a bet (cancel - no P&L impact)
  const deleteBet = useCallback((betId) => {
    setOpenBets(prev => prev.filter(b => b.id !== betId))
  }, [])

  // Delete a trade from history
  const deleteTrade = useCallback((tradeId) => {
    setTradeHistory(prev => prev.filter(t => t.id !== tradeId))
  }, [])

  // Update trade details (for journal: notes, tags, ratings)
  const updateTradeDetails = useCallback((tradeId, updates) => {
    setTradeHistory(prev => prev.map(trade => {
      if (trade.id !== tradeId) return trade
      return { ...trade, ...updates }
    }))
  }, [])

  // ============================================
  // STRATEGY BET ACTIONS
  // ============================================

  // Add a bet executed by a strategy
  const addStrategyBet = useCallback((betData) => {
    const newBet = {
      id: `strat-bet-${Date.now()}`,
      ...betData,
      placedAt: new Date(),
      status: 'active',
      profit: 0,
      profitPercent: 0,
      currentPrice: betData.entryPrice,
      isStrategyBet: true,
    }
    setStrategyBets(prev => [newBet, ...prev])
    return newBet
  }, [])

  // Update a strategy bet's price
  const updateStrategyBetPrice = useCallback((betId, newPrice) => {
    setStrategyBets(prev => prev.map(bet => {
      if (bet.id !== betId) return bet
      const profit = (newPrice - bet.entryPrice) * bet.contracts * (bet.position === 'YES' ? 1 : -1)
      const profitPercent = ((newPrice - bet.entryPrice) / bet.entryPrice) * 100 * (bet.position === 'YES' ? 1 : -1)
      return {
        ...bet,
        currentPrice: newPrice,
        profit,
        profitPercent,
      }
    }))
  }, [])

  // Settle/close a strategy bet (removes it from active list)
  const settleStrategyBet = useCallback((betId, outcome, exitPrice) => {
    const bet = strategyBets.find(b => b.id === betId)
    if (!bet) return null

    const won = (bet.position === 'YES' && outcome === 'YES') || (bet.position === 'NO' && outcome === 'NO')
    const finalExitPrice = exitPrice ?? (won ? 1.00 : 0.00)
    const pnl = won 
      ? bet.contracts * (1 - bet.entryPrice) 
      : -bet.contracts * bet.entryPrice

    const settledTrade = {
      id: `strat-trade-${Date.now()}`,
      ticker: bet.ticker,
      event: bet.event,
      platform: bet.platform,
      position: bet.position,
      contracts: bet.contracts,
      entryPrice: bet.entryPrice,
      exitPrice: finalExitPrice,
      pnl,
      pnlPercent: (pnl / (bet.entryPrice * bet.contracts)) * 100,
      placedAt: bet.placedAt,
      settledAt: new Date(),
      status: won ? 'won' : 'lost',
      strategy: bet.strategy,
      strategyId: bet.strategyId,
      outcome,
      isStrategyBet: true,
    }

    // Remove from strategy bets
    setStrategyBets(prev => prev.filter(b => b.id !== betId))
    
    // Add to trade history
    setTradeHistory(prev => [settledTrade, ...prev])

    return settledTrade
  }, [strategyBets])

  // Remove a strategy bet without settling
  const removeStrategyBet = useCallback((betId) => {
    setStrategyBets(prev => prev.filter(b => b.id !== betId))
  }, [])

  // Get portfolio breakdown by platform
  const getPortfolioByPlatform = useCallback(() => {
    const platforms = {}
    
    openBets.forEach(bet => {
      if (!platforms[bet.platform]) {
        platforms[bet.platform] = { invested: 0, profit: 0, count: 0 }
      }
      platforms[bet.platform].invested += bet.entryPrice * bet.contracts
      platforms[bet.platform].profit += bet.profit || 0
      platforms[bet.platform].count += 1
    })

    return Object.entries(platforms).map(([name, data]) => ({
      name,
      value: data.invested,
      profit: data.profit,
      count: data.count,
    }))
  }, [openBets])

  // Get portfolio breakdown by strategy
  const getPortfolioByStrategy = useCallback(() => {
    const strategies = {}
    
    openBets.forEach(bet => {
      const strategy = bet.strategy || 'Manual'
      if (!strategies[strategy]) {
        strategies[strategy] = { invested: 0, profit: 0, count: 0 }
      }
      strategies[strategy].invested += bet.entryPrice * bet.contracts
      strategies[strategy].profit += bet.profit || 0
      strategies[strategy].count += 1
    })

    return Object.entries(strategies).map(([name, data]) => ({
      name,
      value: data.invested,
      profit: data.profit,
      count: data.count,
    }))
  }, [openBets])

  // ============================================
  // EXISTING FUNCTIONS
  // ============================================

  // Toggle Pro status (for development)
  const togglePro = useCallback(() => {
    setIsPro(prev => !prev)
  }, [])

  // Open upgrade modal
  const openUpgradeModal = useCallback(() => {
    setShowUpgradeModal(true)
  }, [])

  // Close upgrade modal
  const closeUpgradeModal = useCallback(() => {
    setShowUpgradeModal(false)
  }, [])

  // Open Luna chat
  const openLunaChat = useCallback(() => {
    setShowLunaChat(true)
  }, [])

  // Close Luna chat
  const closeLunaChat = useCallback(() => {
    setShowLunaChat(false)
  }, [])

  // Handle successful upgrade
  const handleUpgradeSuccess = useCallback(() => {
    setIsPro(true)
    setShowUpgradeModal(false)
  }, [])

  // Check if a feature requires Pro
  const requiresProAccess = useCallback((featureId) => {
    const proFeatures = [
      'live-trading',
      'advanced-analytics',
      'custom-alerts',
      'api-access',
    ]
    return proFeatures.includes(featureId)
  }, [])

  // Check if user has access to a feature
  const hasFeatureAccess = useCallback((featureId) => {
    if (isPro) return true
    return !requiresProAccess(featureId)
  }, [isPro, requiresProAccess])

  // ============================================
  // CONTEXT VALUE
  // ============================================
  const value = useMemo(() => ({
    // Subscription
    isPro,
    setIsPro,
    togglePro,

    // Trading mode
    tradingMode,
    setTradingMode,

    // Upgrade modal
    showUpgradeModal,
    openUpgradeModal,
    closeUpgradeModal,
    handleUpgradeSuccess,

    // Luna chat
    showLunaChat,
    openLunaChat,
    closeLunaChat,

    // Feature access
    requiresProAccess,
    hasFeatureAccess,

    // === Global Betting State ===
    openBets,
    tradeHistory,
    portfolioStats,
    strategyBets,

    // === Betting Actions ===
    placeBet,
    updateBetPrice,
    closeBet,
    settleBet,
    deleteBet,
    deleteTrade,
    updateTradeDetails,

    // === Strategy Bet Actions ===
    addStrategyBet,
    updateStrategyBetPrice,
    settleStrategyBet,
    removeStrategyBet,

    // === Portfolio Breakdown ===
    getPortfolioByPlatform,
    getPortfolioByStrategy,
  }), [
    isPro,
    tradingMode,
    showUpgradeModal,
    togglePro,
    openUpgradeModal,
    closeUpgradeModal,
    handleUpgradeSuccess,
    showLunaChat,
    openLunaChat,
    closeLunaChat,
    requiresProAccess,
    hasFeatureAccess,
    // New dependencies
    openBets,
    tradeHistory,
    portfolioStats,
    strategyBets,
    placeBet,
    updateBetPrice,
    closeBet,
    settleBet,
    deleteBet,
    deleteTrade,
    updateTradeDetails,
    addStrategyBet,
    updateStrategyBetPrice,
    settleStrategyBet,
    removeStrategyBet,
    getPortfolioByPlatform,
    getPortfolioByStrategy,
  ])

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export default AppContext

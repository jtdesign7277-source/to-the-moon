import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts'
import {
  TrendingUp, TrendingDown, Activity, Wrench, LayoutDashboard,
  ChevronRight, Check, X, Rocket, Crown, Wallet, BarChart3,
  DollarSign, Target, Zap, Calendar, ArrowUpRight, ArrowDownRight, Clock, Info, Filter
} from 'lucide-react'
import { useApp } from '../hooks/useApp'
import { useLivePortfolio } from '../hooks/useLiveMarkets'
import { trackPageView, trackButtonClick, trackUpgradeModalOpen, trackStatView } from '../utils/analytics'
import LiveScanner from '../components/LiveScanner'
import TradeSlipViewer from '../components/TradeSlipViewer'
import { strategyApi } from '../utils/api'
import { Play, Pause, AlertCircle } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const Dashboard = ({ onNavigate }) => {
  const { 
    tradingMode, 
    isPro, 
    openUpgradeModal, 
    user,
    // Global betting state
    openBets,
    tradeHistory,
    portfolioStats,
    strategyBets,
    addStrategyBet,
    updateStrategyBetPrice,
    settleStrategyBet,
    getPortfolioByPlatform,
  } = useApp()

  // Active strategies state
  const [activeStrategies, setActiveStrategies] = useState([])
  const [isLoadingStrategies, setIsLoadingStrategies] = useState(true)
  const [strategyActivity, setStrategyActivity] = useState({})

  // User data state - starts with zeros for new users
  const [userData, setUserData] = useState({
    totalPnl: 0,
    winRate: 0,
    activeStrategies: 0,
    totalTrades: 0,
    connectedAccounts: 0,
    totalBalance: 0,
    monthlyChange: 0,
  })
  const [recentTrades, setRecentTrades] = useState([])
  const [performanceData, setPerformanceData] = useState([])
  const [portfolioData, setPortfolioData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTrade, setSelectedTrade] = useState(null)
  const [performancePeriod, setPerformancePeriod] = useState('1M') // 1D, 1W, 1M, 6M, 1Y
  const [selectedStat, setSelectedStat] = useState(null) // For stat card modal

  // Live portfolio from Kalshi (when in live mode and account connected)
  const { 
    portfolio: livePortfolio, 
    hasAccount: hasKalshiAccount,
    refresh: refreshLivePortfolio 
  } = useLivePortfolio({ 
    enabled: tradingMode === 'live',
    pollInterval: 60000 
  })

  // Track page view when dashboard loads
  useEffect(() => {
    trackPageView('Dashboard')
  }, [])

  // Fetch active strategies - check localStorage FIRST, then API
  useEffect(() => {
    const fetchActiveStrategies = async () => {
      // ALWAYS check localStorage first - this is our source of truth for deployed strategies
      let allStrategies = []
      
      try {
        const localStrategies = JSON.parse(localStorage.getItem('ttm_deployed_strategies') || '[]')
        allStrategies = [...localStrategies]
      } catch (e) {
        console.error('Failed to parse local strategies:', e)
      }
      
      // If user is logged in, also try API and merge
      if (user) {
        try {
          const response = await strategyApi.getDeployed()
          const apiStrategies = response.data?.strategies || []
          
          // Merge - add API strategies not already in local
          const localIds = new Set(allStrategies.map(s => String(s.id)))
          apiStrategies.forEach(api => {
            if (!localIds.has(String(api.id))) {
              allStrategies.push({
                id: api.id,
                name: api.name,
                capital: api.allocatedCapital,
                mode: api.mode,
                status: api.status,
                startedAt: api.deployedAt,
                icon: api.icon || '⚡',
                pnl: api.totalPnl || 0,
                trades: api.totalTrades || 0,
                markets: api.markets || ['Kalshi'],
              })
            }
          })
        } catch (error) {
          console.error('Failed to fetch strategies from API:', error)
        }
      }
      
      const running = allStrategies.filter(s => s.status === 'running')
      setActiveStrategies(running)
      
      // Update stats with actual count
      setUserData(prev => ({
        ...prev,
        activeStrategies: running.length
      }))
      
      // Initialize activity state for each strategy
      const activity = {}
      running.forEach(s => {
        activity[s.id] = {
          message: { text: 'Monitoring markets...', icon: '🔍' },
          marketsScanned: Math.floor(Math.random() * 30) + 10,
          lastActive: new Date(),
        }
      })
      setStrategyActivity(activity)
      setIsLoadingStrategies(false)
    }
    
    fetchActiveStrategies()
    
    // Poll for updates every 3 seconds (since storage events don't fire on same page)
    const interval = setInterval(fetchActiveStrategies, 3000)
    return () => clearInterval(interval)
  }, [user])

  // Simulate strategy activity updates
  useEffect(() => {
    if (activeStrategies.length === 0) return
    
    const messages = [
      { text: 'Scanning for arbitrage opportunities...', icon: '🔍' },
      { text: 'Analyzing market sentiment...', icon: '📊' },
      { text: 'Checking price discrepancies...', icon: '💹' },
      { text: 'Monitoring volume changes...', icon: '📈' },
      { text: 'Evaluating entry points...', icon: '🎯' },
    ]
    
    const interval = setInterval(() => {
      setStrategyActivity(prev => {
        const updated = { ...prev }
        activeStrategies.forEach(s => {
          if (s.status === 'running') {
            const randomMsg = messages[Math.floor(Math.random() * messages.length)]
            updated[s.id] = {
              message: randomMsg,
              marketsScanned: Math.floor(Math.random() * 50) + 10,
              lastActive: new Date(),
            }
          }
        })
        return updated
      })
    }, 5000)
    
    return () => clearInterval(interval)
  }, [activeStrategies])

  // Simulate strategy bets being placed by active strategies
  useEffect(() => {
    if (activeStrategies.length === 0 || !addStrategyBet) return
    
    // Sample markets that strategies might trade
    const sampleMarkets = [
      { ticker: 'FED-JAN', event: 'Fed raises rates in January', platform: 'Kalshi' },
      { ticker: 'BTC-90K', event: 'Bitcoin above $90K by Feb', platform: 'Kalshi' },
      { ticker: 'INAUG', event: 'Inauguration proceeds without incident', platform: 'Manifold' },
      { ticker: 'AAPL-ER', event: 'Apple beats Q1 earnings', platform: 'Polymarket' },
      { ticker: 'NVDA-200', event: 'NVIDIA hits $200 by March', platform: 'Kalshi' },
      { ticker: 'OIL-80', event: 'Oil stays above $80/barrel', platform: 'Manifold' },
    ]
    
    // Max 3 simulated bets at a time
    const maxSimulatedBets = 3
    
    // Place initial bet immediately when strategy starts (if none exist)
    if (strategyBets.length === 0) {
      const strategy = activeStrategies[0]
      const market = sampleMarkets[Math.floor(Math.random() * sampleMarkets.length)]
      const position = Math.random() > 0.5 ? 'YES' : 'NO'
      const entryPrice = 0.35 + Math.random() * 0.30
      const contracts = Math.floor(30 + Math.random() * 70)
      
      addStrategyBet({
        ticker: market.ticker,
        event: market.event,
        platform: market.platform,
        position,
        contracts,
        entryPrice: Math.round(entryPrice * 100) / 100,
        strategy: strategy.name,
        strategyId: strategy.id,
        strategyIcon: strategy.icon || '⚡',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      })
    }
    
    // Continue placing bets periodically
    const interval = setInterval(() => {
      if (strategyBets.length >= maxSimulatedBets) return
      
      // 50% chance to place a bet each interval (increased from 30%)
      if (Math.random() > 0.50) return
      
      const strategy = activeStrategies[Math.floor(Math.random() * activeStrategies.length)]
      const market = sampleMarkets[Math.floor(Math.random() * sampleMarkets.length)]
      
      // Don't duplicate existing bets
      if (strategyBets.some(b => b.ticker === market.ticker)) return
      
      const position = Math.random() > 0.5 ? 'YES' : 'NO'
      const entryPrice = 0.30 + Math.random() * 0.40
      const contracts = Math.floor(20 + Math.random() * 80)
      
      addStrategyBet({
        ticker: market.ticker,
        event: market.event,
        platform: market.platform,
        position,
        contracts,
        entryPrice: Math.round(entryPrice * 100) / 100,
        strategy: strategy.name,
        strategyId: strategy.id,
        strategyIcon: strategy.icon || '⚡',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      })
    }, 15000) // Every 15 seconds (faster)
    
    return () => clearInterval(interval)
  }, [activeStrategies, strategyBets, addStrategyBet])

  // Simulate price updates for strategy bets
  useEffect(() => {
    if (!strategyBets || strategyBets.length === 0 || !updateStrategyBetPrice) return
    
    const interval = setInterval(() => {
      strategyBets.forEach(bet => {
        // Small random price movement
        const direction = Math.random() > 0.45 ? 1 : -1 // Slightly bullish bias
        const movement = direction * (Math.random() * 0.03)
        const newPrice = Math.max(0.01, Math.min(0.99, (bet.currentPrice || bet.entryPrice) + movement))
        updateStrategyBetPrice(bet.id, Math.round(newPrice * 100) / 100)
      })
    }, 8000) // Every 8 seconds
    
    return () => clearInterval(interval)
  }, [strategyBets, updateStrategyBetPrice])

  // Simulate settling strategy bets (auto-close after some time)
  useEffect(() => {
    if (!strategyBets || strategyBets.length === 0 || !settleStrategyBet) return
    
    const interval = setInterval(() => {
      strategyBets.forEach(bet => {
        const ageMinutes = (Date.now() - new Date(bet.placedAt).getTime()) / 60000
        
        // 10% chance to settle after 2 minutes, increasing over time
        const settleChance = Math.min(0.3, 0.1 + (ageMinutes - 2) * 0.05)
        if (ageMinutes > 2 && Math.random() < settleChance) {
          // Determine outcome based on current price movement
          const won = bet.profit >= 0
          const outcome = bet.position === 'YES' ? (won ? 'YES' : 'NO') : (won ? 'NO' : 'YES')
          settleStrategyBet(bet.id, outcome, bet.currentPrice)
        }
      })
    }, 15000) // Check every 15 seconds
    
    return () => clearInterval(interval)
  }, [strategyBets, settleStrategyBet])

  // Fetch user data from API - filtered by trading mode
  const fetchUserData = async () => {
    const token = localStorage.getItem('ttm_access_token')
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/user/dashboard?mode=${tradingMode}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        
        // If in live mode and have Kalshi portfolio, use that balance
        let totalBalance = data.totalBalance || 0
        let connectedAccounts = data.connectedAccounts || 0
        
        if (tradingMode === 'live' && livePortfolio?.balance) {
          totalBalance = livePortfolio.balance.balance || totalBalance
          connectedAccounts = Math.max(1, connectedAccounts)
        }
        
        setUserData({
          totalPnl: data.totalPnl || 0,
          winRate: data.winRate || 0,
          activeStrategies: data.activeStrategies || 0,
          totalTrades: data.totalTrades || 0,
          connectedAccounts,
          totalBalance,
          monthlyChange: data.monthlyChange || 0,
        })
        setRecentTrades(data.recentTrades || [])
        setPerformanceData(data.performanceData || [])
        setPortfolioData(data.portfolioData || [])
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Refetch when trading mode changes
  useEffect(() => {
    fetchUserData()
  }, [user, tradingMode])

  // Callback when a trade is placed from the scanner
  const handleTradeComplete = (trade) => {
    // Immediately refetch dashboard data to show the new trade
    fetchUserData()
  }

  // Format currency
  const formatCurrency = (value) => {
    if (value === 0) return '$0.00'
    const prefix = value >= 0 ? '' : '-'
    return `${prefix}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Format percentage
  const formatPercent = (value) => {
    if (value === 0) return '0%'
    const prefix = value >= 0 ? '+' : ''
    return `${prefix}${value.toFixed(1)}%`
  }

  // Merge API userData with global portfolioStats for display
  // portfolioStats from context takes precedence for bet-related data
  const displayStats = {
    totalPnl: portfolioStats.totalPnl || userData.totalPnl,
    winRate: portfolioStats.winRate || userData.winRate,
    totalTrades: portfolioStats.totalTrades + portfolioStats.openPositions || userData.totalTrades,
    openPositions: portfolioStats.openPositions,
    winningTrades: portfolioStats.winningTrades,
    losingTrades: portfolioStats.losingTrades,
    realizedPnl: portfolioStats.realizedPnl,
    unrealizedPnl: portfolioStats.unrealizedPnl,
    bestTrade: portfolioStats.bestTrade,
    worstTrade: portfolioStats.worstTrade,
    avgWin: portfolioStats.avgWin || 0,
    avgLoss: portfolioStats.avgLoss || 0,
    winLossRatio: portfolioStats.winLossRatio || 0,
    activeStrategies: userData.activeStrategies,
    totalBalance: userData.totalBalance,
    monthlyChange: userData.monthlyChange,
  }

  const stats = [
    {
      label: 'Total P&L',
      value: formatCurrency(displayStats.totalPnl),
      change: formatPercent(displayStats.monthlyChange),
      positive: displayStats.totalPnl >= 0,
      icon: TrendingUp,
      detailIcon: DollarSign,
      color: displayStats.totalPnl >= 0 ? 'green' : 'red',
      details: {
        title: 'Profit & Loss Overview',
        description: 'Your total earnings from all trading activity',
        metrics: [
          { label: 'Total P&L', value: formatCurrency(displayStats.totalPnl), icon: DollarSign },
          { label: 'Realized P&L', value: formatCurrency(displayStats.realizedPnl), icon: Check },
          { label: 'Unrealized P&L', value: formatCurrency(displayStats.unrealizedPnl), icon: Clock },
          { label: 'Avg Win/Loss', value: displayStats.avgWin > 0 || displayStats.avgLoss > 0 ? `${formatCurrency(displayStats.avgWin)} / ${formatCurrency(-displayStats.avgLoss)}` : '—', icon: ArrowUpRight },
          { label: 'Win/Loss Ratio', value: displayStats.winLossRatio > 0 ? (displayStats.winLossRatio === Infinity ? '∞' : displayStats.winLossRatio.toFixed(2)) : '—', icon: Target },
        ],
        tip: 'Pro tip: Diversify across multiple strategies to reduce volatility.'
      }
    },
    {
      label: 'Win Rate',
      value: displayStats.totalTrades > 0 ? `${displayStats.winRate}%` : '—',
      change: displayStats.totalTrades > 0 ? '+0%' : '—',
      positive: true,
      icon: Activity,
      detailIcon: Target,
      color: 'indigo',
      details: {
        title: 'Win Rate Analysis',
        description: 'Percentage of profitable trades out of total trades',
        metrics: [
          { label: 'Win Rate', value: displayStats.totalTrades > 0 ? `${displayStats.winRate}%` : '—', icon: Target },
          { label: 'Winning Trades', value: displayStats.winningTrades.toString(), icon: Check },
          { label: 'Losing Trades', value: displayStats.losingTrades.toString(), icon: X },
          { label: 'Open Positions', value: displayStats.openPositions.toString(), icon: Clock },
        ],
        tip: 'A win rate above 50% combined with good risk management leads to profitability.'
      }
    },
    {
      label: 'Active Strategies',
      value: displayStats.activeStrategies.toString(),
      change: displayStats.activeStrategies > 0 ? '+0' : '—',
      positive: true,
      icon: Wrench,
      detailIcon: Zap,
      color: 'purple',
      details: {
        title: 'Strategy Overview',
        description: 'Automated strategies currently running on your account',
        metrics: [
          { label: 'Active Strategies', value: displayStats.activeStrategies.toString(), icon: Zap },
          { label: 'Total Capital', value: formatCurrency(displayStats.totalBalance || 0), icon: DollarSign },
          { label: 'Avg Allocation', value: displayStats.activeStrategies > 0 ? formatCurrency((displayStats.totalBalance || 0) / displayStats.activeStrategies) : '—', icon: Target },
          { label: 'Last Execution', value: displayStats.activeStrategies > 0 ? '2 min ago' : '—', icon: Clock },
        ],
        tip: 'Running multiple uncorrelated strategies can improve overall returns.'
      }
    },
    {
      label: 'Open Bets',
      value: openBets.length.toString(),
      change: displayStats.unrealizedPnl !== 0 ? formatCurrency(displayStats.unrealizedPnl) : '—',
      positive: displayStats.unrealizedPnl >= 0,
      icon: Clock,
      detailIcon: Activity,
      color: 'teal',
      details: {
        title: 'Open Positions',
        description: 'Active bets currently in your portfolio',
        metrics: [
          { label: 'Open Bets', value: openBets.length.toString(), icon: Activity },
          { label: 'Unrealized P&L', value: formatCurrency(displayStats.unrealizedPnl), icon: DollarSign },
          { label: 'Total Invested', value: formatCurrency(openBets.reduce((sum, b) => sum + (b.amount || 0), 0)), icon: Target },
          { label: 'Avg Position', value: openBets.length > 0 ? formatCurrency(openBets.reduce((sum, b) => sum + (b.amount || 0), 0) / openBets.length) : '—', icon: Clock },
        ],
        tip: 'Monitor your open positions regularly and set stop-losses to manage risk.'
      }
    },
    {
      label: 'Total Trades',
      value: displayStats.totalTrades.toLocaleString(),
      change: displayStats.openPositions > 0 ? `${displayStats.openPositions} open` : '—',
      positive: true,
      icon: LayoutDashboard,
      detailIcon: Activity,
      color: 'amber',
      details: {
        title: 'Trading Activity',
        description: 'Summary of all trades executed on your account',
        metrics: [
          { label: 'Total Trades', value: displayStats.totalTrades.toLocaleString(), icon: Activity },
          { label: 'Open Positions', value: displayStats.openPositions.toString(), icon: Clock },
          { label: 'Closed Trades', value: portfolioStats.totalTrades.toString(), icon: Check },
          { label: 'Win Rate', value: `${displayStats.winRate}%`, icon: Target },
        ],
        tip: 'Consistent trading with proper position sizing is key to long-term success.'
      }
    },
  ]

  // Handle upgrade button click with tracking
  const handleUpgradeClick = () => {
    trackUpgradeModalOpen('dashboard_banner')
    trackButtonClick('Upgrade to Pro', 'dashboard')
    openUpgradeModal()
  }

  // Handle stat card click with tracking
  const handleStatClick = (stat) => {
    trackStatView(stat.label, stat.value)
    setSelectedStat(stat)
  }

  // Handle View All trades click
  const handleViewAllTrades = () => {
    trackButtonClick('View All Trades', 'dashboard')
  }

  // Check if user has any data - include global state
  const hasData = userData.totalTrades > 0 || recentTrades.length > 0 || openBets.length > 0 || tradeHistory.length > 0
  
  // Check if user has COMPLETED trades (for showing real chart data)
  const hasCompletedTrades = tradeHistory.length > 0

  // Default sample performance data - shows a realistic growth curve like Kalshi
  // This displays before users complete their first bet
  const defaultPerformanceData = [
    { date: 'Oct 1', pnl: 0 },
    { date: 'Oct 15', pnl: 120 },
    { date: 'Nov 1', pnl: 85 },
    { date: 'Nov 15', pnl: 210 },
    { date: 'Dec 1', pnl: 180 },
    { date: 'Dec 15', pnl: 340 },
    { date: 'Jan 1', pnl: 290 },
    { date: 'Jan 10', pnl: 425 },
    { date: 'Jan 15', pnl: 380 },
    { date: 'Jan 21', pnl: 520 },
  ]

  // Empty state for charts (flat line)
  const emptyPerformanceData = [
    { date: 'Jan', pnl: 0 },
    { date: 'Feb', pnl: 0 },
    { date: 'Mar', pnl: 0 },
    { date: 'Apr', pnl: 0 },
    { date: 'May', pnl: 0 },
    { date: 'Jun', pnl: 0 },
  ]

  const emptyPortfolioData = [
    { name: 'No Data', value: 100, color: '#e5e7eb' },
  ]

  // Vibrant colors for portfolio allocation
  const portfolioColors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']
  
  // Chart data priority: 1) Real performance data from API, 2) Generated from trade history, 3) Default sample curve
  const chartData = performanceData.length > 0 
    ? performanceData 
    : hasCompletedTrades 
      ? generateChartFromTrades(tradeHistory)
      : defaultPerformanceData
  
  // Generate performance chart from completed trades
  function generateChartFromTrades(trades) {
    if (!trades || trades.length === 0) return defaultPerformanceData
    
    // Sort trades by date
    const sortedTrades = [...trades].sort((a, b) => new Date(a.closedAt || a.timestamp) - new Date(b.closedAt || b.timestamp))
    
    let runningPnl = 0
    return sortedTrades.map(trade => {
      runningPnl += (trade.pnl || 0)
      const tradeDate = new Date(trade.closedAt || trade.timestamp)
      return {
        date: tradeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        pnl: runningPnl
      }
    })
  }
  
  // Use global portfolio breakdown from context
  const platformBreakdown = getPortfolioByPlatform()
  const totalInvested = platformBreakdown.reduce((sum, p) => sum + p.value, 0)
  
  // Generate pie data from global state
  const pieData = platformBreakdown.length > 0 
    ? platformBreakdown.map((item, i) => ({
        name: item.name,
        value: totalInvested > 0 ? Math.round((item.value / totalInvested) * 100) : 0,
        color: item.name === 'Kalshi' ? '#3B82F6' : 
               item.name === 'Polymarket' ? '#8B5CF6' : 
               item.name === 'Manifold' ? '#F97316' : 
               portfolioColors[i % portfolioColors.length],
        count: item.count,
        profit: item.profit,
      }))
    : portfolioData.length > 0 
      ? portfolioData.map((item, i) => ({
          ...item,
          color: item.color || portfolioColors[i % portfolioColors.length]
        }))
      : emptyPortfolioData

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            {hasData ? "Here's your trading overview." : "Welcome! Connect an account to start trading."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 ${
            tradingMode === 'live'
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${
              tradingMode === 'live' ? 'bg-green-500' : 'bg-yellow-500'
            }`} />
            {tradingMode === 'live' ? 'Live Trading' : 'Paper Trading'}
          </span>
        </div>
      </div>

      {/* Pro Upgrade Banner */}
      {!isPro && (
        <div className="bg-linear-to-r from-indigo-500 to-purple-600 rounded-xl p-4 sm:p-6 text-white shadow-lg shadow-indigo-500/25">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Rocket className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Unlock Strategy Builder Pro</h3>
                <p className="text-indigo-100 text-sm mt-1">
                  Create custom strategies, backtest with real data, and go live.
                </p>
              </div>
            </div>
            <button
              onClick={handleUpgradeClick}
              className="px-4 py-2 bg-white text-indigo-600 font-medium rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-2 shadow-lg"
            >
              <Crown className="w-4 h-4" />
              Upgrade to Pro
            </button>
          </div>
        </div>
      )}

      {/* TradeZella-style Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Trade Expectancy / Total P&L Card */}
        <div 
          onClick={() => handleStatClick(stats[0])}
          className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-gray-600">Net P&L</span>
              <Info className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-3xl font-bold ${displayStats.totalPnl >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              {formatCurrency(displayStats.totalPnl)}
            </span>
            <div className={`p-2.5 rounded-xl ${displayStats.totalPnl >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <DollarSign className={`w-5 h-5 ${displayStats.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>

        {/* Profit Factor Card with Gauge */}
        <div 
          onClick={() => handleStatClick(stats[0])}
          className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-sm font-medium text-gray-600">Profit Factor</span>
            <Info className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-gray-900">
              {displayStats.winLossRatio > 0 && displayStats.winLossRatio !== Infinity 
                ? displayStats.winLossRatio.toFixed(2) 
                : displayStats.avgWin > 0 && displayStats.avgLoss > 0 
                  ? (displayStats.avgWin / displayStats.avgLoss).toFixed(2)
                  : '—'}
            </span>
            {/* Semi-circle gauge */}
            <div className="relative w-16 h-8 overflow-hidden">
              <svg viewBox="0 0 100 50" className="w-full h-full">
                {/* Background arc */}
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                {/* Colored arc based on profit factor */}
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke={displayStats.winLossRatio >= 1 ? '#22c55e' : '#ef4444'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.min(displayStats.winLossRatio || 0, 3) / 3 * 126} 126`}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Win % Card with Donut */}
        <div 
          onClick={() => handleStatClick(stats[1])}
          className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-sm font-medium text-gray-600">Win %</span>
            <Info className="w-3.5 h-3.5 text-gray-400" />
            {displayStats.winningTrades > 0 && (
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                  {displayStats.winningTrades}
                </span>
                <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                  {displayStats.losingTrades}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-gray-900">
              {displayStats.totalTrades > 0 ? `${displayStats.winRate}%` : '—'}
            </span>
            {/* Donut chart */}
            <div className="w-12 h-12">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { value: displayStats.winRate || 0 },
                      { value: 100 - (displayStats.winRate || 0) }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={14}
                    outerRadius={20}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#3b82f6" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Avg Win/Loss Card with Bar */}
        <div 
          onClick={() => handleStatClick(stats[0])}
          className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-sm font-medium text-gray-600">Avg win/loss trade</span>
            <Info className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-3xl font-bold text-gray-900">
              {displayStats.winLossRatio > 0 && displayStats.winLossRatio !== Infinity 
                ? displayStats.winLossRatio.toFixed(1) 
                : '—'}
            </span>
            {/* Horizontal bar visualization */}
            <div className="flex-1 max-w-[120px]">
              <div className="flex items-center gap-2 mb-1">
                <div 
                  className="h-2 bg-green-500 rounded-full" 
                  style={{ width: `${Math.min(displayStats.avgWin / (displayStats.avgWin + displayStats.avgLoss || 1) * 100, 100) || 50}%` }}
                />
                <div 
                  className="h-2 bg-red-500 rounded-full flex-1" 
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-green-600 font-medium">${displayStats.avgWin?.toFixed(2) || '0.00'}</span>
                <span className="text-red-600 font-medium">${displayStats.avgLoss?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Row - Additional metrics */}
      <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Open Positions</p>
          <p className="text-xl font-bold text-gray-900">{displayStats.openPositions}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Total Trades</p>
          <p className="text-xl font-bold text-gray-900">{displayStats.totalTrades}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Realized P&L</p>
          <p className={`text-xl font-bold ${displayStats.realizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(displayStats.realizedPnl)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Unrealized P&L</p>
          <p className={`text-xl font-bold ${displayStats.unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(displayStats.unrealizedPnl)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Active Strategies</p>
          <p className="text-xl font-bold text-indigo-600">{displayStats.activeStrategies}</p>
        </div>
      </div>

      {/* Active Strategies & Strategy Bets - Side by Side */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Strategies Section */}
        {activeStrategies.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Zap className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Active Strategies</h2>
                  <p className="text-sm text-gray-500">{activeStrategies.length} running now</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('strategies')}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                Manage <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
              {activeStrategies.map(strategy => {
                const activity = strategyActivity[strategy.id] || {}
                const isLive = strategy.mode === 'live'
                
                return (
                  <div 
                    key={strategy.id}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => onNavigate && onNavigate('strategies')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{strategy.icon || '⚡'}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{strategy.name}</h3>
                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                              isLive 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {isLive ? '🔴 LIVE' : '📝 Paper'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            ${strategy.allocatedCapital?.toLocaleString() || '0'} allocated
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {/* Activity indicator */}
                        <div className="text-right hidden sm:block">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span>{activity.message?.icon} {activity.message?.text || 'Running...'}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {activity.marketsScanned || 0} markets scanned
                          </p>
                        </div>
                        
                        {/* P&L */}
                        <div className="text-right">
                          <p className={`font-semibold ${
                            (strategy.totalPnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(strategy.totalPnl || 0) >= 0 ? '+' : ''}${(strategy.totalPnl || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">{strategy.totalTrades || 0} trades</p>
                        </div>
                        
                        <div className="p-2 bg-green-50 rounded-lg">
                          <Play className="w-4 h-4 text-green-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Strategy Bets - Live trades executed by automated strategies */}
        {strategyBets && strategyBets.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Rocket className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Strategy Bets</h2>
                  <p className="text-xs text-gray-500">{strategyBets.length} live position{strategyBets.length !== 1 ? 's' : ''} from automated strategies</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                AUTO
              </span>
            </div>
            
            <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
            {strategyBets.map(bet => {
              const isProfit = (bet.profit || 0) >= 0
              const timeSincePlaced = bet.placedAt ? Math.floor((Date.now() - new Date(bet.placedAt).getTime()) / 60000) : 0
              const timeLabel = timeSincePlaced < 60 
                ? `${timeSincePlaced}m ago` 
                : timeSincePlaced < 1440 
                  ? `${Math.floor(timeSincePlaced / 60)}h ago`
                  : `${Math.floor(timeSincePlaced / 1440)}d ago`
              
              return (
                <div 
                  key={bet.id}
                  className="px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Left: Strategy & Market Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex flex-col items-center">
                        <span className="text-lg">{bet.strategyIcon || '⚡'}</span>
                        <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                          bet.position === 'YES' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {bet.position}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{bet.ticker}</p>
                        <p className="text-xs text-gray-500 truncate">{bet.event}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-purple-600 font-medium">{bet.strategy}</span>
                          <span className="text-[10px] text-gray-400">•</span>
                          <span className="text-[10px] text-gray-400">{bet.platform}</span>
                          <span className="text-[10px] text-gray-400">•</span>
                          <span className="text-[10px] text-gray-400">{timeLabel}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right: Trade Details & P&L */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-500">{bet.contracts} @ ${bet.entryPrice?.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">→ ${bet.currentPrice?.toFixed(2) || bet.entryPrice?.toFixed(2)}</p>
                      </div>
                      <div className={`text-right min-w-[70px] px-2 py-1 rounded-lg ${
                        isProfit ? 'bg-green-50' : 'bg-red-50'
                      }`}>
                        <p className={`text-sm font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                          {isProfit ? '+' : ''}${(bet.profit || 0).toFixed(2)}
                        </p>
                        <p className={`text-[10px] ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                          {isProfit ? '+' : ''}{(bet.profitPercent || 0).toFixed(1)}%
                        </p>
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        )}
      </div>

      {/* Live Market Scanner */}
      <LiveScanner 
        maxEvents={50} 
        scanInterval={3000} 
        onTradeComplete={handleTradeComplete}
        tradingMode={tradingMode}
        isPro={isPro}
      />

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Performance</h2>
              {!hasCompletedTrades && (
                <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">
                  Sample Data
                </span>
              )}
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {[
                { key: '1D', label: '1D' },
                { key: '1W', label: '1W' },
                { key: '1M', label: '1M' },
                { key: '6M', label: '6M' },
                { key: '1Y', label: '1Y' },
              ].map(period => (
                <button
                  key={period.key}
                  onClick={() => setPerformancePeriod(period.key)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                    performancePeriod === period.key
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>
          {/* Always show chart - sample data until user has completed trades */}
          <div className="h-64 relative">
            {!hasCompletedTrades && (
              <div className="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none z-10">
                <p className="text-xs text-gray-400 bg-white/80 px-3 py-1 rounded-full">
                  Complete your first bet to see your real performance
                </p>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={hasCompletedTrades ? "#10B981" : "#6366f1"} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={hasCompletedTrades ? "#10B981" : "#6366f1"} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`$${value.toLocaleString()}`, 'P&L']}
                />
                <Area 
                  type="monotone" 
                  dataKey="pnl" 
                  stroke={hasCompletedTrades ? "#10B981" : "#6366f1"} 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorPnl)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Portfolio Allocation */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Portfolio Allocation</h2>
          {!hasData ? (
            <div className="h-48 flex flex-col items-center justify-center text-center">
              <Wallet className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm font-medium">No positions yet</p>
              <p className="text-gray-400 text-xs mt-1">
                Connect an account to see your allocation
              </p>
            </div>
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {pieData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Bets */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Recent Bets</h2>
          {openBets.length > 0 && (
            <button
              onClick={handleViewAllTrades}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors"
            >
              View All <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {openBets.length === 0 ? (
          <div className="p-6 text-center">
            <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm font-medium">No bets yet</p>
            <p className="text-gray-400 text-xs mt-0.5">
              Place your first trade to see it here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {openBets.slice(0, 3).map((bet) => (
              <div
                key={bet.id}
                onClick={() => setSelectedTrade(bet)}
                className="px-3 py-2 hover:bg-indigo-50 cursor-pointer transition-colors"
              >
                {/* Compact single row */}
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-gray-900 text-xs">{bet.ticker}</span>
                  <span className={`px-1 py-0.5 text-[9px] font-semibold rounded ${
                    bet.platform === 'Kalshi' ? 'bg-blue-100 text-blue-700' :
                    bet.platform === 'Polymarket' ? 'bg-purple-100 text-purple-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {bet.platform}
                  </span>
                  <span className={`px-1 py-0.5 text-[9px] font-bold rounded ${
                    bet.position === 'YES' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {bet.position}
                  </span>
                  <span className="text-gray-400 text-[10px] truncate flex-1 max-w-[120px]">{bet.event}</span>
                  <span className="text-[10px] text-gray-500">
                    {bet.contracts}@${bet.entryPrice.toFixed(2)}
                  </span>
                  <span className={`font-mono font-bold text-xs ${bet.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {bet.profit >= 0 ? '+' : ''}${bet.profit.toFixed(2)}
                  </span>
                  <div className={`w-1 h-4 rounded-full ${bet.profit >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trade Slip Viewer Modal */}
      {selectedTrade && (
        <TradeSlipViewer
          trade={selectedTrade}
          onClose={() => setSelectedTrade(null)}
        />
      )}

      {/* Stat Detail Modal */}
      {selectedStat && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedStat(null)}>
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`px-6 py-4 ${
              selectedStat.color === 'green' ? 'bg-linear-to-r from-green-500 to-emerald-600' :
              selectedStat.color === 'red' ? 'bg-linear-to-r from-red-500 to-rose-600' :
              selectedStat.color === 'indigo' ? 'bg-linear-to-r from-indigo-500 to-purple-600' :
              selectedStat.color === 'purple' ? 'bg-linear-to-r from-purple-500 to-violet-600' :
              'bg-linear-to-r from-amber-500 to-orange-600'
            } text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    {selectedStat.detailIcon && <selectedStat.detailIcon className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedStat.details.title}</h3>
                    <p className="text-white/80 text-sm">{selectedStat.details.description}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedStat(null)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Value */}
            <div className="px-6 py-6 text-center border-b border-gray-100">
              <p className="text-sm text-gray-500 mb-1">{selectedStat.label}</p>
              <p className={`text-4xl font-bold ${
                selectedStat.color === 'green' ? 'text-green-600' :
                selectedStat.color === 'red' ? 'text-red-600' :
                selectedStat.color === 'indigo' ? 'text-indigo-600' :
                selectedStat.color === 'purple' ? 'text-purple-600' :
                'text-amber-600'
              }`}>{selectedStat.value}</p>
              {selectedStat.change !== '—' && (
                <p className={`text-sm mt-1 ${selectedStat.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedStat.change} vs last month
                </p>
              )}
            </div>

            {/* Metrics Grid */}
            <div className="px-6 py-4 grid grid-cols-2 gap-3">
              {selectedStat.details.metrics.map((metric, i) => {
                const MetricIcon = metric.icon
                return (
                  <div key={i} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                      <MetricIcon className="w-3 h-3" />
                      {metric.label}
                    </div>
                    <p className="font-semibold text-gray-900">{metric.value}</p>
                  </div>
                )
              })}
            </div>

            {/* Pro Tip */}
            <div className="px-6 py-4 bg-linear-to-r from-indigo-50 to-purple-50 border-t border-indigo-100">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                <p className="text-sm text-indigo-700">{selectedStat.details.tip}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => setSelectedStat(null)}
                className="w-full py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard

import { useState, useEffect, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import {
  TrendingUp, TrendingDown, Check, X, Clock, Calendar, DollarSign,
  Target, Filter, Search, ChevronDown, Download, BarChart3,
  ArrowUpRight, ArrowDownRight, Zap, RefreshCw, BookOpen, PieChart as PieChartIcon,
  ChevronUp, Briefcase, FileText, HelpCircle, Settings, ArrowDown, ArrowUp, Menu
} from 'lucide-react'
import { useApp } from '../hooks/useApp'
import { trackPageView } from '../utils/analytics'
import TradingCalendar from '../components/TradingCalendar'
import TradingAnalytics from '../components/TradingAnalytics'
import TradeJournal from '../components/TradeJournal'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const TradeHistory = () => {
  const {
    tradingMode,
    isPro,
    user,
    openBets,
    tradeHistory: globalTradeHistory,
    portfolioStats,
    deleteTrade,
    updateTradeDetails,
  } = useApp()

  const [apiTrades, setApiTrades] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [activeTab, setActiveTab] = useState('trades')
  const [chartPeriod, setChartPeriod] = useState('All')
  const [chartMode, setChartMode] = useState('value')
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Merge global trade history with API trades
  const trades = useMemo(() => {
    const openPositions = openBets.map(bet => ({
      id: bet.id,
      pair: bet.ticker,
      event: bet.event,
      platform: bet.platform,
      type: bet.position,
      entry: bet.entryPrice,
      exit: bet.currentPrice,
      pnl: `${bet.profit >= 0 ? '+' : ''}$${bet.profit.toFixed(2)}`,
      pnlValue: bet.profit,
      status: 'Open',
      timestamp: bet.placedAt,
      strategy: bet.strategy,
      contracts: bet.contracts,
    }))

    const closedTrades = globalTradeHistory.map(trade => ({
      id: trade.id,
      pair: trade.ticker,
      event: trade.event,
      platform: trade.platform,
      type: trade.position,
      entry: trade.entryPrice,
      exit: trade.exitPrice,
      pnl: `${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)}`,
      pnlValue: trade.pnl,
      status: trade.status === 'won' ? 'Won' : 'Lost',
      timestamp: trade.settledAt,
      strategy: trade.strategy,
      contracts: trade.contracts,
      outcome: trade.outcome,
    }))

    const allTrades = [...openPositions, ...closedTrades]
    const tradeIds = new Set(allTrades.map(t => t.id))
    const uniqueApiTrades = apiTrades.filter(t => !tradeIds.has(t.id))

    return [...allTrades, ...uniqueApiTrades]
  }, [openBets, globalTradeHistory, apiTrades])

  // Format trades for calendar/analytics
  const calendarTrades = useMemo(() => {
    return globalTradeHistory.map(trade => ({
      id: trade.id,
      market: trade.ticker || trade.event,
      title: trade.event,
      platform: trade.platform,
      position: trade.position,
      price: trade.entryPrice,
      settledPrice: trade.exitPrice,
      pnl: trade.pnl,
      profit: trade.pnl,
      settledAt: trade.settledAt,
      placedAt: trade.placedAt,
      strategy: trade.strategy,
      contracts: trade.contracts,
      rating: trade.rating || 0,
      tags: trade.tags || [],
      notes: trade.notes || '',
    }))
  }, [globalTradeHistory])

  // Calculate stats
  const stats = useMemo(() => {
    const wonTrades = trades.filter(t => t.status === 'Won')
    const lostTrades = trades.filter(t => t.status === 'Lost')
    const openTrades = trades.filter(t => t.status === 'Open')
    const closedTrades = wonTrades.length + lostTrades.length

    const totalPnl = trades.reduce((sum, t) => sum + (t.pnlValue || 0), 0)
    const wonPnl = wonTrades.reduce((sum, t) => sum + (t.pnlValue || 0), 0)
    const lostPnl = lostTrades.reduce((sum, t) => sum + Math.abs(t.pnlValue || 0), 0)

    return {
      totalTrades: trades.length,
      wonTrades: wonTrades.length,
      lostTrades: lostTrades.length,
      openTrades: openTrades.length,
      winRate: closedTrades > 0 ? Math.round((wonTrades.length / closedTrades) * 100) : 0,
      totalPnl,
      avgWin: wonTrades.length > 0 ? wonPnl / wonTrades.length : 0,
      avgLoss: lostTrades.length > 0 ? lostPnl / lostTrades.length : 0,
      bestTrade: portfolioStats.bestTrade,
      worstTrade: portfolioStats.worstTrade,
      realizedPnl: portfolioStats.realizedPnl || 0,
      unrealizedPnl: portfolioStats.unrealizedPnl || 0,
    }
  }, [trades, portfolioStats])

  // Generate equity curve data
  const equityCurveData = useMemo(() => {
    if (globalTradeHistory.length === 0) {
      // Sample data
      const now = new Date()
      const data = []
      let value = 1000
      for (let i = 90; i >= 0; i -= 3) {
        const date = new Date(now - i * 24 * 60 * 60 * 1000)
        value = Math.max(0, value + (Math.random() - 0.45) * 30)
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: Math.round(value * 100) / 100,
          timestamp: date.getTime()
        })
      }
      return data
    }

    const sortedTrades = [...globalTradeHistory].sort((a, b) =>
      new Date(a.settledAt || a.timestamp) - new Date(b.settledAt || b.timestamp)
    )

    let runningPnl = 0
    return sortedTrades.map(trade => {
      runningPnl += (trade.pnl || 0)
      const tradeDate = new Date(trade.settledAt || trade.timestamp)
      return {
        date: tradeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: runningPnl,
        timestamp: tradeDate.getTime()
      }
    })
  }, [globalTradeHistory])

  // Filter chart data by period
  const filteredChartData = useMemo(() => {
    if (chartPeriod === 'All') return equityCurveData

    const now = Date.now()
    const periodDays = {
      '7D': 7,
      'MTD': new Date().getDate(),
      'YTD': Math.floor((now - new Date(new Date().getFullYear(), 0, 1).getTime()) / (24 * 60 * 60 * 1000)),
      '1Y': 365,
    }

    const days = periodDays[chartPeriod] || 365
    const cutoff = now - days * 24 * 60 * 60 * 1000

    return equityCurveData.filter(d => d.timestamp >= cutoff)
  }, [equityCurveData, chartPeriod])

  useEffect(() => {
    trackPageView('Trade History')
    fetchTrades()
  }, [tradingMode])

  const fetchTrades = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('ttm_access_token')
      if (!token) {
        setIsLoading(false)
        return
      }

      const response = await fetch(`${API_URL}/api/user/trades/history?mode=${tradingMode}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setApiTrades(data.trades || [])
      }
    } catch (error) {
      console.error('Failed to fetch trade history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter and sort trades
  const filteredTrades = trades
    .filter(trade => {
      if (filter === 'all') return true
      if (filter === 'won') return trade.status === 'Won'
      if (filter === 'lost') return trade.status === 'Lost'
      if (filter === 'open') return trade.status === 'Open'
      return true
    })
    .filter(trade => {
      if (!searchQuery) return true
      return trade.pair?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             trade.platform?.toLowerCase().includes(searchQuery.toLowerCase())
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.timestamp) - new Date(a.timestamp)
      if (sortBy === 'oldest') return new Date(a.timestamp) - new Date(b.timestamp)
      if (sortBy === 'pnl-high') return (b.pnlValue || 0) - (a.pnlValue || 0)
      if (sortBy === 'pnl-low') return (a.pnlValue || 0) - (b.pnlValue || 0)
      return 0
    })

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  const formatCurrency = (value, showSign = false) => {
    if (value === undefined || value === null) return '0.00'
    const num = parseFloat(value)
    const formatted = Math.abs(num).toLocaleString('en-US', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    })
    if (showSign && num !== 0) {
      return num >= 0 ? `+${formatted}` : `-${formatted}`
    }
    return num < 0 ? `-${formatted}` : formatted
  }

  // Tab config for main content
  const mainTabs = [
    { id: 'trades', label: 'Trade List' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'journal', label: 'Journal' },
  ]

  const periods = ['7D', 'MTD', 'YTD', '1Y', 'All']

  // Sidebar stats
  const sidebarStats = [
    { label: 'Realized P&L', value: formatCurrency(stats.realizedPnl), color: stats.realizedPnl >= 0 ? 'green' : 'red' },
    { label: 'Unrealized P&L', value: formatCurrency(stats.unrealizedPnl), color: stats.unrealizedPnl >= 0 ? 'green' : 'red' },
    { label: 'Win Rate', value: `${stats.winRate}%` },
    { label: 'Total Trades', value: stats.totalTrades.toString() },
    { label: 'Winning Trades', value: stats.wonTrades.toString(), color: 'green' },
    { label: 'Losing Trades', value: stats.lostTrades.toString(), color: 'red' },
    { label: 'Open Positions', value: stats.openTrades.toString() },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5 dark:text-gray-400" /> : <Menu className="w-5 h-5 dark:text-gray-400" />}
        </button>
        <h1 className="font-semibold text-gray-900 dark:text-white">Trade History</h1>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${tradingMode === 'live' ? 'bg-green-500' : 'bg-yellow-500'}`} />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Left Sidebar - Account Stats */}
        <aside className={`
          ${mobileSidebarOpen ? 'block' : 'hidden'} lg:block
          w-full lg:w-72 xl:w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
          h-fit shrink-0 self-start
        `}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Trading Stats</span>
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                  <Settings className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
              <button
                onClick={() => setSidebarExpanded(!sidebarExpanded)}
                className="hidden lg:block p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                {sidebarExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
          </div>

          {/* Total P&L */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Total P&L</span>
              <span className={`text-xl font-semibold tabular-nums ${stats.totalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {stats.totalPnl >= 0 ? '+' : ''}{formatCurrency(stats.totalPnl)}
              </span>
            </div>
          </div>

          {/* Stats List */}
          {sidebarExpanded && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
              {sidebarStats.map((stat, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</span>
                  <span className={`text-sm tabular-nums font-medium ${
                    stat.color === 'green' ? 'text-green-600 dark:text-green-400' :
                    stat.color === 'red' ? 'text-red-600 dark:text-red-400' :
                    'text-gray-900 dark:text-white'
                  }`}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Best/Worst Trade */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Best Trade</span>
              <span className="text-sm tabular-nums font-medium text-green-600 dark:text-green-400">
                {stats.bestTrade ? `+${formatCurrency(stats.bestTrade)}` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Worst Trade</span>
              <span className="text-sm tabular-nums font-medium text-red-600 dark:text-red-400">
                {stats.worstTrade ? formatCurrency(stats.worstTrade) : '—'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <button
                onClick={fetchTrades}
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button className="flex-1 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Page Header - Desktop */}
          <div className="hidden lg:flex items-center justify-between px-6 py-5 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trade History</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Track your trading performance and analyze results</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                tradingMode === 'live' ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${tradingMode === 'live' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                {tradingMode === 'live' ? 'Live' : 'Paper'}
              </span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between px-4 lg:px-6">
              <nav className="flex gap-1 overflow-x-auto no-scrollbar py-1">
                {mainTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400'
                        : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
              <span className={`hidden sm:flex lg:hidden items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                tradingMode === 'live' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${tradingMode === 'live' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                {tradingMode === 'live' ? 'Live' : 'Paper'}
              </span>
            </div>
          </div>

          <div className="p-4 lg:p-6 space-y-6">
            {/* Equity Curve Chart */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              {/* Chart Header */}
              <div className="p-4 lg:p-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-6">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Equity Curve</p>
                      <p className="text-3xl lg:text-4xl font-semibold text-gray-900 dark:text-white tabular-nums">
                        ${formatCurrency(stats.totalPnl)}
                      </p>
                    </div>
                    <div className="pt-5">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Change ({chartPeriod})</span>
                      <div className={`flex items-center gap-1 ${stats.totalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {stats.totalPnl >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                        <span className="text-lg font-semibold tabular-nums">
                          {formatCurrency(Math.abs(stats.totalPnl), true)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <button
                      onClick={() => setChartMode('value')}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                        chartMode === 'value' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      Value
                    </button>
                    <button
                      onClick={() => setChartMode('performance')}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                        chartMode === 'performance' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      Performance
                    </button>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="p-4 lg:p-6">
                <div className="h-52 lg:h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredChartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                        interval="preserveStartEnd"
                        minTickGap={50}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                        tickFormatter={(v) => `$${v.toLocaleString()}`}
                        domain={['dataMin - 10', 'dataMax + 10']}
                        width={60}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          padding: '8px 12px'
                        }}
                        formatter={(value) => [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'P&L']}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#6366f1"
                        strokeWidth={1.5}
                        dot={false}
                        activeDot={{ r: 4, fill: '#6366f1' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Period Selector */}
                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  {periods.map(period => (
                    <button
                      key={period}
                      onClick={() => setChartPeriod(period)}
                      className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                        chartPeriod === period
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-800'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Calendar View */}
            {activeTab === 'calendar' && (
              <TradingCalendar
                trades={calendarTrades}
                onDayClick={(date, dayTrades) => console.log('Day clicked:', date, dayTrades)}
              />
            )}

            {/* Analytics View */}
            {activeTab === 'analytics' && <TradingAnalytics trades={calendarTrades} />}

            {/* Journal View */}
            {activeTab === 'journal' && (
              <TradeJournal
                trades={calendarTrades}
                onUpdateTrade={(tradeId, updates) => updateTradeDetails && updateTradeDetails(tradeId, updates)}
              />
            )}

            {/* Trade List View */}
            {activeTab === 'trades' && (
              <>
                {/* Filters */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by market or platform..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      {[
                        { key: 'all', label: 'All', count: trades.length },
                        { key: 'won', label: 'Won', count: stats.wonTrades, color: 'green' },
                        { key: 'lost', label: 'Lost', count: stats.lostTrades, color: 'red' },
                        { key: 'open', label: 'Open', count: stats.openTrades, color: 'amber' },
                      ].map(f => (
                        <button
                          key={f.key}
                          onClick={() => setFilter(f.key)}
                          className={`px-3 py-2 text-sm font-medium transition-all flex items-center gap-2 ${
                            filter === f.key
                              ? f.color === 'green' ? 'text-green-600 dark:text-green-400 font-bold' :
                                f.color === 'red' ? 'text-red-600 dark:text-red-400 font-bold' :
                                f.color === 'amber' ? 'text-amber-600 dark:text-amber-400 font-bold' :
                                'text-indigo-600 dark:text-indigo-400 font-bold'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                        >
                          {f.label}
                          <span className={`text-xs ${filter === f.key ? 'opacity-70' : 'opacity-50'}`}>
                            {f.count}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none pl-4 pr-10 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white cursor-pointer"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="pnl-high">Highest P&L</option>
                        <option value="pnl-low">Lowest P&L</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Trades Table */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                  {filteredTrades.length === 0 ? (
                    <div className="p-12 text-center">
                      <BarChart3 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No trades found</h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        {trades.length === 0 ? 'Start trading to see your history here' : 'Try adjusting your filters'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Market</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Platform</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Entry</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Exit</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">P&L</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {filteredTrades.map((trade, i) => (
                            <tr key={trade.id || i} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                              <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  {formatDate(trade.timestamp)}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <p className="text-sm font-medium text-gray-900 dark:text-white max-w-xs truncate">{trade.pair}</p>
                              </td>
                              <td className="px-4 py-4 text-sm">
                                <span className={`text-xs font-bold ${
                                  trade.platform?.toLowerCase() === 'kalshi' ? 'text-blue-600 dark:text-blue-400' :
                                  trade.platform?.toLowerCase() === 'polymarket' ? 'text-purple-600 dark:text-purple-400' :
                                  trade.platform?.toLowerCase() === 'manifold' ? 'text-orange-600 dark:text-orange-400' :
                                  'text-gray-600 dark:text-gray-400'
                                }`}>
                                  {trade.platform || 'Unknown'}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-sm">
                                <span className={`inline-flex items-center gap-1 text-xs font-bold ${
                                  trade.type === 'YES' || trade.type === 'Long' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {trade.type === 'YES' || trade.type === 'Long' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                  {trade.type}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{trade.entry}</td>
                              <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{trade.exit || '—'}</td>
                              <td className={`px-4 py-4 text-sm font-semibold tabular-nums ${
                                (trade.pnlValue || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                              }`}>
                                {trade.pnl}
                              </td>
                              <td className="px-4 py-4 text-sm">
                                <span className={`inline-flex items-center gap-1 text-xs font-bold ${
                                  trade.status === 'Won' ? 'text-green-600 dark:text-green-400' :
                                  trade.status === 'Open' ? 'text-amber-600 dark:text-amber-400' :
                                  'text-red-600 dark:text-red-400'
                                }`}>
                                  {trade.status === 'Won' ? <Check className="w-3 h-3" /> :
                                   trade.status === 'Open' ? <Clock className="w-3 h-3" /> :
                                   <X className="w-3 h-3" />}
                                  {trade.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default TradeHistory

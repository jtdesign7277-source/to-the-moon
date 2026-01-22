import { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp, TrendingDown, Check, X, Clock, Calendar, DollarSign,
  Target, Activity, Filter, Search, ChevronDown, Download, BarChart3,
  ArrowUpRight, ArrowDownRight, Zap, RefreshCw, BookOpen, PieChart
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
    // Global state
    openBets,
    tradeHistory: globalTradeHistory,
    portfolioStats,
    deleteTrade,
    updateTradeDetails,
  } = useApp()
  
  const [apiTrades, setApiTrades] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, won, lost, open
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest') // newest, oldest, pnl-high, pnl-low
  const [activeTab, setActiveTab] = useState('trades') // trades, calendar, analytics, journal

  // Merge global trade history with API trades
  const trades = useMemo(() => {
    // Convert open bets to trade format for "open" filter
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
    
    // Convert closed trades from global history
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
    
    // Merge with API trades (dedupe by id)
    const allTrades = [...openPositions, ...closedTrades]
    const tradeIds = new Set(allTrades.map(t => t.id))
    const uniqueApiTrades = apiTrades.filter(t => !tradeIds.has(t.id))
    
    return [...allTrades, ...uniqueApiTrades]
  }, [openBets, globalTradeHistory, apiTrades])

  // Format trades for calendar/analytics components
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

  // Calculate stats from merged data
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
    }
  }, [trades, portfolioStats])

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
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
      if (sortBy === 'pnl-high') return parsePnl(b.pnl) - parsePnl(a.pnl)
      if (sortBy === 'pnl-low') return parsePnl(a.pnl) - parsePnl(b.pnl)
      return 0
    })

  const parsePnl = (pnl) => {
    if (!pnl) return 0
    const cleaned = pnl.replace(/[^0-9.-]/g, '')
    return parseFloat(cleaned) || 0
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const StatCard = ({ label, value, icon: Icon, color, subValue }) => (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`p-2 rounded-lg ${
          color === 'green' ? 'bg-green-50' :
          color === 'red' ? 'bg-red-50' :
          color === 'indigo' ? 'bg-indigo-50' :
          color === 'amber' ? 'bg-amber-50' :
          'bg-gray-50'
        }`}>
          <Icon className={`w-4 h-4 ${
            color === 'green' ? 'text-green-600' :
            color === 'red' ? 'text-red-600' :
            color === 'indigo' ? 'text-indigo-600' :
            color === 'amber' ? 'text-amber-600' :
            'text-gray-600'
          }`} />
        </div>
      </div>
      <p className={`text-2xl font-bold mt-2 ${
        color === 'green' ? 'text-green-600' :
        color === 'red' ? 'text-red-600' :
        'text-gray-900'
      }`}>{value}</p>
      {subValue && (
        <p className="text-xs text-gray-400 mt-1">{subValue}</p>
      )}
    </div>
  )

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
          <h1 className="text-2xl font-bold text-gray-900">Trade History</h1>
          <p className="text-gray-500 mt-1">
            View all your {tradingMode === 'paper' ? 'paper' : 'live'} trades and performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTrades}
            className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total P&L"
          value={stats.totalPnl >= 0 ? `+$${stats.totalPnl.toFixed(2)}` : `-$${Math.abs(stats.totalPnl).toFixed(2)}`}
          icon={DollarSign}
          color={stats.totalPnl >= 0 ? 'green' : 'red'}
          subValue={`${filteredTrades.length} total trades`}
        />
        <StatCard
          label="Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
          icon={Target}
          color="indigo"
          subValue={`${stats.wonTrades}W / ${stats.lostTrades}L`}
        />
        <StatCard
          label="Avg Win/Loss"
          value={stats.avgWin > 0 || stats.avgLoss > 0 ? `+$${stats.avgWin.toFixed(2)} / -$${stats.avgLoss.toFixed(2)}` : '$0.00'}
          icon={ArrowUpRight}
          color="green"
          subValue="Average per trade"
        />
        <StatCard
          label="Win/Loss Ratio"
          value={stats.avgLoss > 0 ? (stats.avgWin / stats.avgLoss).toFixed(2) : stats.avgWin > 0 ? '∞' : '—'}
          icon={Target}
          color="purple"
          subValue="Risk/reward"
        />
        <StatCard
          label="Open Positions"
          value={stats.openTrades.toString()}
          icon={Clock}
          color="amber"
          subValue="Currently active"
        />
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl p-1 shadow-sm border border-gray-100 flex gap-1">
        {[
          { id: 'trades', label: 'Trade List', icon: BarChart3 },
          { id: 'calendar', label: 'Calendar', icon: Calendar },
          { id: 'analytics', label: 'Analytics', icon: PieChart },
          { id: 'journal', label: 'Journal', icon: BookOpen },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Calendar View */}
      {activeTab === 'calendar' && (
        <TradingCalendar 
          trades={calendarTrades} 
          onDayClick={(date, dayTrades) => {
            console.log('Day clicked:', date, dayTrades)
          }}
        />
      )}

      {/* Analytics View */}
      {activeTab === 'analytics' && (
        <TradingAnalytics trades={calendarTrades} />
      )}

      {/* Journal View */}
      {activeTab === 'journal' && (
        <TradeJournal 
          trades={calendarTrades}
          onUpdateTrade={(tradeId, updates) => {
            if (updateTradeDetails) {
              updateTradeDetails(tradeId, updates)
            }
          }}
        />
      )}

      {/* Filters and Search - Only show for trades tab */}
      {activeTab === 'trades' && (
        <>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by market or platform..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Filter Buttons */}
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
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  filter === f.key
                    ? f.color === 'green' ? 'bg-green-100 text-green-700' :
                      f.color === 'red' ? 'bg-red-100 text-red-700' :
                      f.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                      'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  filter === f.key ? 'bg-white/50' : 'bg-gray-200'
                }`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white cursor-pointer"
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredTrades.length === 0 ? (
          <div className="p-12 text-center">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No trades found</h3>
            <p className="text-gray-500">
              {trades.length === 0
                ? 'Start trading to see your history here'
                : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Market
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Entry
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Exit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    P&L
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTrades.map((trade, i) => (
                  <tr key={trade.id || i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(trade.timestamp)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-gray-900 max-w-xs truncate">
                        {trade.pair}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.platform?.toLowerCase() === 'kalshi' ? 'bg-blue-100 text-blue-700' :
                        trade.platform?.toLowerCase() === 'polymarket' ? 'bg-purple-100 text-purple-700' :
                        trade.platform?.toLowerCase() === 'manifold' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {trade.platform || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        trade.type === 'Long' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {trade.type === 'Long' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {trade.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {trade.entry}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {trade.exit || '—'}
                    </td>
                    <td className={`px-4 py-4 text-sm font-semibold ${
                      trade.pnl?.startsWith('+') || parsePnl(trade.pnl) > 0 ? 'text-green-600' : 
                      parsePnl(trade.pnl) < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {trade.pnl}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        trade.status === 'Won' ? 'bg-green-100 text-green-700' :
                        trade.status === 'Open' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
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

      {/* Performance Insights */}
      {trades.length > 0 && activeTab === 'trades' && (
        <div className="bg-linear-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Performance Insights</h3>
              <p className="text-sm text-gray-600 mt-1">
                {stats.winRate >= 60
                  ? `Great job! Your win rate of ${stats.winRate.toFixed(1)}% is above average. Keep up the consistent trading strategy.`
                  : stats.winRate >= 50
                  ? `Your win rate is ${stats.winRate.toFixed(1)}%. Consider reviewing your losing trades to identify patterns and improve.`
                  : stats.winRate > 0
                  ? `Your current win rate is ${stats.winRate.toFixed(1)}%. Focus on risk management and consider paper trading new strategies before going live.`
                  : `Start placing trades to see your performance insights here.`}
              </p>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}

export default TradeHistory

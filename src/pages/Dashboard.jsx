import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import {
  TrendingUp, TrendingDown, Activity, Wrench, LayoutDashboard,
  ChevronRight, Check, X, Rocket, Crown, Wallet, BarChart3
} from 'lucide-react'
import { useApp } from '../hooks/useApp'
import { trackPageView, trackButtonClick, trackUpgradeModalOpen, trackStatView } from '../utils/analytics'
import LiveScanner from '../components/LiveScanner'
import TradeSlipViewer from '../components/TradeSlipViewer'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const Dashboard = () => {
  const { tradingMode, isPro, openUpgradeModal, user } = useApp()

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

  // Track page view when dashboard loads
  useEffect(() => {
    trackPageView('Dashboard')
  }, [])

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
        setUserData({
          totalPnl: data.totalPnl || 0,
          winRate: data.winRate || 0,
          activeStrategies: data.activeStrategies || 0,
          totalTrades: data.totalTrades || 0,
          connectedAccounts: data.connectedAccounts || 0,
          totalBalance: data.totalBalance || 0,
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

  const stats = [
    {
      label: 'Total P&L',
      value: formatCurrency(userData.totalPnl),
      change: formatPercent(userData.monthlyChange),
      positive: userData.totalPnl >= 0,
      icon: TrendingUp,
    },
    {
      label: 'Win Rate',
      value: userData.totalTrades > 0 ? `${userData.winRate}%` : '—',
      change: userData.totalTrades > 0 ? '+0%' : '—',
      positive: true,
      icon: Activity,
    },
    {
      label: 'Active Strategies',
      value: userData.activeStrategies.toString(),
      change: userData.activeStrategies > 0 ? '+0' : '—',
      positive: true,
      icon: Wrench,
    },
    {
      label: 'Total Trades',
      value: userData.totalTrades.toLocaleString(),
      change: userData.totalTrades > 0 ? '+0' : '—',
      positive: true,
      icon: LayoutDashboard,
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
  }

  // Handle View All trades click
  const handleViewAllTrades = () => {
    trackButtonClick('View All Trades', 'dashboard')
  }

  // Check if user has any data
  const hasData = userData.totalTrades > 0 || recentTrades.length > 0

  // Empty state for charts
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

  const chartData = performanceData.length > 0 ? performanceData : emptyPerformanceData
  const pieData = portfolioData.length > 0 ? portfolioData : emptyPortfolioData

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
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 sm:p-6 text-white shadow-lg shadow-indigo-500/25">
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          const showChange = stat.change !== '—'
          return (
            <div
              key={i}
              onClick={() => handleStatClick(stat)}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{stat.label}</p>
                <div className={`p-2 rounded-lg ${stat.positive ? 'bg-green-50' : 'bg-red-50'}`}>
                  <Icon className={`w-4 h-4 ${stat.positive ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
              {showChange ? (
                <div className="flex items-center gap-1 mt-1">
                  {stat.positive ? (
                    <TrendingUp className="w-3 h-3 text-green-600" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-600" />
                  )}
                  <span className={`text-sm ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </span>
                  <span className="text-xs text-gray-400">vs last month</span>
                </div>
              ) : (
                <p className="text-xs text-gray-400 mt-1">No data yet</p>
              )}
            </div>
          )
        })}
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
            <h2 className="text-lg font-semibold text-gray-900">Performance</h2>
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
          {!hasData ? (
            <div className="h-64 flex flex-col items-center justify-center text-center">
              <BarChart3 className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">No trading data yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Your performance chart will appear here once you start trading
              </p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => `$${v/1000}k`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`$${value.toLocaleString()}`, 'P&L']}
                  />
                  <Area type="monotone" dataKey="pnl" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorPnl)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
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

      {/* Recent Trades */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Trades</h2>
          {recentTrades.length > 0 && (
            <button
              onClick={handleViewAllTrades}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {recentTrades.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No trades yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Your trading history will appear here once you make your first trade
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pair</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Entry</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Exit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTrades.map((trade, i) => (
                  <tr 
                    key={i} 
                    onClick={() => setSelectedTrade(trade)}
                    className="hover:bg-indigo-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      <span className="hover:text-indigo-600">{trade.pair}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        trade.type === 'Long' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {trade.type === 'Long' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {trade.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{trade.entry}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{trade.exit}</td>
                    <td className={`px-4 py-3 text-sm font-medium ${
                      trade.pnl.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}>{trade.pnl}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        trade.status === 'Won' ? 'bg-green-100 text-green-700' : 
                        trade.status === 'Open' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {trade.status === 'Won' ? <Check className="w-3 h-3" /> : 
                         trade.status === 'Open' ? <Activity className="w-3 h-3" /> :
                         <X className="w-3 h-3" />}
                        {trade.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-400 text-center py-2 border-t border-gray-100">
              Click any trade to view bet slip
            </p>
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
    </div>
  )
}

export default Dashboard

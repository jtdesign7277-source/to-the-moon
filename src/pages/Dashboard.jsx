import { useEffect, useState, useMemo } from 'react'
import { SkeletonDashboard } from '../components/animations/SkeletonLoader'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import {
  ChevronDown, ChevronUp, Briefcase, FileText, HelpCircle,
  Settings, ArrowDown, ArrowUp, Menu, X
} from 'lucide-react'
import { useApp } from '../hooks/useApp'
import { useLivePortfolio } from '../hooks/useLiveMarkets'
import { trackPageView } from '../utils/analytics'
import LiveScanner from '../components/LiveScanner'
import TradeSlipViewer from '../components/TradeSlipViewer'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// IBKR-style Dashboard Component
const Dashboard = ({ onNavigate }) => {
  const {
    tradingMode,
    isPro,
    user,
    openBets,
    tradeHistory,
    portfolioStats,
    strategyBets,
  } = useApp()

  const [isLoading, setIsLoading] = useState(true)
  const [selectedTrade, setSelectedTrade] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [chartPeriod, setChartPeriod] = useState('All')
  const [chartMode, setChartMode] = useState('value') // 'value' or 'performance'
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // User account data
  const [accountData, setAccountData] = useState({
    accountId: 'U' + (user?.id?.toString().padStart(8, '0') || '00000001'),
    totalBalance: 0,
    settledCash: 0,
    unrealizedPnl: 0,
    realizedPnl: 0,
    maintenanceMargin: 0,
    excessLiquidity: 0,
    buyingPower: 0,
    dividends: 0,
    totalChange: 0,
    totalChangePercent: 0,
  })

  const [performanceData, setPerformanceData] = useState([])

  // Live portfolio from connected account
  const {
    portfolio: livePortfolio,
  } = useLivePortfolio({
    enabled: tradingMode === 'live',
    pollInterval: 60000
  })

  // Track page view
  useEffect(() => {
    trackPageView('Dashboard')
  }, [])

  // Fetch and calculate account data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('ttm_access_token')
        if (token) {
          const response = await fetch(`${API_URL}/api/user/dashboard?mode=${tradingMode}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })
          if (response.ok) {
            const data = await response.json()
            setPerformanceData(data.performanceData || [])
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [tradingMode, user])

  // Calculate account stats from portfolio data
  useEffect(() => {
    const totalBalance = livePortfolio?.balance?.balance ||
      openBets.reduce((sum, b) => sum + (b.amount || b.contracts * b.entryPrice), 0) +
      portfolioStats.realizedPnl

    const settledCash = totalBalance - portfolioStats.unrealizedPnl
    const buyingPower = settledCash > 0 ? settledCash : 0

    // Calculate total change (all-time P&L)
    const totalChange = portfolioStats.totalPnl || 0
    const initialInvestment = totalBalance - totalChange
    const totalChangePercent = initialInvestment > 0 ? (totalChange / initialInvestment) * 100 : 0

    setAccountData(prev => ({
      ...prev,
      accountId: 'U' + (user?.id?.toString().padStart(8, '0') || '00000001'),
      totalBalance: Math.max(0, totalBalance),
      settledCash: Math.max(0, settledCash),
      unrealizedPnl: portfolioStats.unrealizedPnl || 0,
      realizedPnl: portfolioStats.realizedPnl || 0,
      maintenanceMargin: 0,
      excessLiquidity: Math.max(0, buyingPower),
      buyingPower: Math.max(0, buyingPower),
      dividends: 0,
      totalChange,
      totalChangePercent,
    }))
  }, [portfolioStats, openBets, livePortfolio, user])

  // Generate chart data from trade history
  const chartData = useMemo(() => {
    if (tradeHistory.length === 0 && performanceData.length === 0) {
      // Sample data to show chart structure
      const now = new Date()
      const data = []
      let value = 500
      for (let i = 365; i >= 0; i -= 7) {
        const date = new Date(now - i * 24 * 60 * 60 * 1000)
        // Simulate some volatility
        value = Math.max(0, value + (Math.random() - 0.45) * 50)
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: Math.round(value * 100) / 100,
          timestamp: date.getTime()
        })
      }
      // End at current balance
      data[data.length - 1].value = accountData.totalBalance || 29.35
      return data
    }

    if (performanceData.length > 0) {
      return performanceData.map(d => ({
        date: d.date,
        value: d.pnl + (accountData.totalBalance - portfolioStats.totalPnl),
        timestamp: new Date(d.date).getTime()
      }))
    }

    // Generate from trade history
    const sortedTrades = [...tradeHistory].sort((a, b) =>
      new Date(a.closedAt || a.timestamp) - new Date(b.closedAt || b.timestamp)
    )

    let runningBalance = accountData.totalBalance - portfolioStats.totalPnl
    return sortedTrades.map(trade => {
      runningBalance += (trade.pnl || 0)
      const tradeDate = new Date(trade.closedAt || trade.timestamp)
      return {
        date: tradeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: runningBalance,
        timestamp: tradeDate.getTime()
      }
    })
  }, [tradeHistory, performanceData, accountData.totalBalance, portfolioStats.totalPnl])

  // Filter chart data by period
  const filteredChartData = useMemo(() => {
    if (chartPeriod === 'All') return chartData

    const now = Date.now()
    const periodDays = {
      '7D': 7,
      'MTD': new Date().getDate(),
      'YTD': Math.floor((now - new Date(new Date().getFullYear(), 0, 1).getTime()) / (24 * 60 * 60 * 1000)),
      '1Y': 365,
    }

    const days = periodDays[chartPeriod] || 365
    const cutoff = now - days * 24 * 60 * 60 * 1000

    return chartData.filter(d => d.timestamp >= cutoff)
  }, [chartData, chartPeriod])

  // Format currency IBKR style
  const formatCurrency = (value, showSign = false) => {
    if (value === undefined || value === null) return '0.00'
    const num = parseFloat(value)
    const formatted = Math.abs(num).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    if (showSign && num !== 0) {
      return num >= 0 ? `+${formatted}` : `-${formatted}`
    }
    return num < 0 ? `-${formatted}` : formatted
  }

  // Callback when a trade is placed
  const handleTradeComplete = () => {
    // Refresh happens via context
  }

  // Tab configuration
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'positions', label: 'Positions' },
    { id: 'performance', label: 'Performance' },
    { id: 'balances', label: 'Balances' },
  ]

  // Period options
  const periods = ['7D', 'MTD', 'YTD', '1Y', 'All']

  if (isLoading) {
    return <SkeletonDashboard />
  }

  // Account sidebar stats
  const sidebarStats = [
    { label: 'Settled Cash', value: formatCurrency(accountData.settledCash), info: true },
    { label: 'Unrealized P&L', value: formatCurrency(accountData.unrealizedPnl), color: accountData.unrealizedPnl >= 0 ? 'green' : 'red' },
    { label: 'Realized P&L', value: formatCurrency(accountData.realizedPnl), color: accountData.realizedPnl >= 0 ? 'green' : 'red' },
    { label: 'Maintenance Margin', value: formatCurrency(accountData.maintenanceMargin) },
    { label: 'Excess Liquidity', value: formatCurrency(accountData.excessLiquidity) },
    { label: 'Buying Power', value: formatCurrency(accountData.buyingPower) },
    { label: 'Dividends', value: formatCurrency(accountData.dividends) },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${tradingMode === 'live' ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <span className="text-sm font-medium text-gray-600">
            {tradingMode === 'live' ? 'Live' : 'Paper'}
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Left Sidebar - Account Info */}
        <aside className={`
          ${mobileSidebarOpen ? 'block' : 'hidden'} lg:block
          w-full lg:w-72 xl:w-80 bg-white border-r border-gray-200
          lg:min-h-[calc(100vh-64px)] shrink-0
        `}>
          {/* Account Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Account</span>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <Settings className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
              <button
                onClick={() => setSidebarExpanded(!sidebarExpanded)}
                className="hidden lg:block p-1 hover:bg-gray-100 rounded"
              >
                {sidebarExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
            <p className="text-sm text-gray-900 font-mono mt-1">{accountData.accountId}</p>
          </div>

          {/* Account Balance */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-gray-500">USD</span>
              <span className="text-xl font-semibold text-gray-900 tabular-nums">
                {formatCurrency(accountData.totalBalance)}
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm text-gray-400"></span>
              <span className="text-sm text-gray-500 tabular-nums">0.00</span>
            </div>
          </div>

          {/* Account Stats */}
          {sidebarExpanded && (
            <div className="p-4 border-b border-gray-200 space-y-3">
              {sidebarStats.map((stat, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-600">{stat.label}</span>
                    {stat.info && (
                      <button className="p-0.5 hover:bg-gray-100 rounded">
                        <HelpCircle className="w-3 h-3 text-gray-400" />
                      </button>
                    )}
                  </div>
                  <span className={`text-sm tabular-nums font-medium ${
                    stat.color === 'green' ? 'text-green-600' :
                    stat.color === 'red' ? 'text-red-600' :
                    'text-gray-900'
                  }`}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Customize Link */}
          <div className="p-4 border-b border-gray-200">
            <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Customize <Settings className="w-3 h-3" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => onNavigate && onNavigate('trade-history')}
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <Briefcase className="w-4 h-4" />
                Orders & Trades
              </button>
              <button className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                Deposit
              </button>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                Withdraw
              </button>
              <button className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5">
                <FileText className="w-4 h-4" />
                Statements
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onNavigate && onNavigate('analytics')}
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Analytics
              </button>
              <button className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                Support
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Tab Navigation */}
          <div className="bg-white border-b border-gray-200">
            <div className="flex items-center justify-between px-4 lg:px-6">
              <nav className="flex gap-1 overflow-x-auto no-scrollbar py-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'text-blue-600 border-blue-600'
                        : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
              <button className="hidden sm:block text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap">
                Add/Edit Widgets
              </button>
            </div>
          </div>

          {/* Chart Section */}
          <div className="p-4 lg:p-6">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Chart Header */}
              <div className="p-4 lg:p-6 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-6">
                    {/* Account Value */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{accountData.accountId}</p>
                      <p className="text-3xl lg:text-4xl font-semibold text-gray-900 tabular-nums">
                        {formatCurrency(accountData.totalBalance)}
                      </p>
                    </div>

                    {/* Change */}
                    <div className="pt-5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Change ({chartPeriod})</span>
                      </div>
                      <div className={`flex items-center gap-1 ${
                        accountData.totalChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {accountData.totalChange >= 0 ? (
                          <ArrowUp className="w-4 h-4" />
                        ) : (
                          <ArrowDown className="w-4 h-4" />
                        )}
                        <span className="text-lg font-semibold tabular-nums">
                          {formatCurrency(Math.abs(accountData.totalChange), true)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Value/Performance Toggle */}
                  <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setChartMode('value')}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                        chartMode === 'value'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Value
                    </button>
                    <button
                      onClick={() => setChartMode('performance')}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                        chartMode === 'performance'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Performance
                    </button>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="p-4 lg:p-6">
                <div className="h-64 lg:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={filteredChartData}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
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
                        labelStyle={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}
                        formatter={(value) => [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Value']}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#2563eb"
                        strokeWidth={1.5}
                        dot={false}
                        activeDot={{ r: 4, fill: '#2563eb' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Period Selector */}
                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  {periods.map(period => (
                    <button
                      key={period}
                      onClick={() => setChartPeriod(period)}
                      className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                        chartPeriod === period
                          ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Positions Tab Content */}
            {activeTab === 'positions' && (
              <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">Open Positions</h2>
                  <p className="text-sm text-gray-500">{openBets.length} active position{openBets.length !== 1 ? 's' : ''}</p>
                </div>
                {openBets.length === 0 ? (
                  <div className="p-8 text-center">
                    <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No open positions</p>
                    <p className="text-sm text-gray-400 mt-1">Place a trade to see it here</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {openBets.map(bet => (
                      <div
                        key={bet.id}
                        onClick={() => setSelectedTrade(bet)}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${bet.profit >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-semibold text-gray-900">{bet.ticker}</span>
                                <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                                  bet.position === 'YES' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {bet.position}
                                </span>
                                <span className={`px-1.5 py-0.5 text-xs rounded ${
                                  bet.platform === 'Kalshi' ? 'bg-blue-50 text-blue-600' :
                                  bet.platform === 'Polymarket' ? 'bg-purple-50 text-purple-600' :
                                  'bg-orange-50 text-orange-600'
                                }`}>
                                  {bet.platform}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{bet.event}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              {bet.contracts} @ ${bet.entryPrice.toFixed(2)}
                            </p>
                            <p className={`font-semibold tabular-nums ${bet.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {bet.profit >= 0 ? '+' : ''}{formatCurrency(bet.profit)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Dashboard Tab - Additional Widgets */}
            {activeTab === 'dashboard' && (
              <>
                {/* Quick Stats Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 mb-1">Open Positions</p>
                    <p className="text-2xl font-semibold text-gray-900">{openBets.length}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 mb-1">Total Trades</p>
                    <p className="text-2xl font-semibold text-gray-900">{tradeHistory.length + openBets.length}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 mb-1">Win Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {portfolioStats.totalTrades > 0 ? `${portfolioStats.winRate}%` : '—'}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 mb-1">Realized P&L</p>
                    <p className={`text-2xl font-semibold tabular-nums ${
                      portfolioStats.realizedPnl >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {portfolioStats.realizedPnl >= 0 ? '+' : ''}{formatCurrency(portfolioStats.realizedPnl)}
                    </p>
                  </div>
                </div>

                {/* Live Market Scanner */}
                <div className="mt-6">
                  <LiveScanner
                    maxEvents={50}
                    scanInterval={3000}
                    onTradeComplete={handleTradeComplete}
                    tradingMode={tradingMode}
                    isPro={isPro}
                  />
                </div>

                {/* Recent Activity */}
                {(openBets.length > 0 || strategyBets?.length > 0) && (
                  <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <h2 className="font-semibold text-gray-900">Recent Activity</h2>
                      <button
                        onClick={() => setActiveTab('positions')}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View All
                      </button>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {[...openBets, ...(strategyBets || [])].slice(0, 5).map((bet, i) => (
                        <div
                          key={bet.id || i}
                          onClick={() => setSelectedTrade(bet)}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="font-mono font-medium text-gray-900">{bet.ticker}</span>
                              <span className={`px-1.5 py-0.5 text-xs font-medium rounded shrink-0 ${
                                bet.position === 'YES' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {bet.position}
                              </span>
                              {bet.strategy && (
                                <span className="text-xs text-purple-600 truncate">{bet.strategy}</span>
                              )}
                            </div>
                            <span className={`font-medium tabular-nums shrink-0 ${
                              (bet.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {(bet.profit || 0) >= 0 ? '+' : ''}{formatCurrency(bet.profit || 0)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Performance Tab Content */}
            {activeTab === 'performance' && (
              <div className="mt-6 grid lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Total Return</span>
                      <span className={`font-semibold ${portfolioStats.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(portfolioStats.totalPnl, true)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Win Rate</span>
                      <span className="font-semibold text-gray-900">
                        {portfolioStats.totalTrades > 0 ? `${portfolioStats.winRate}%` : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Total Trades</span>
                      <span className="font-semibold text-gray-900">{portfolioStats.totalTrades}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Best Trade</span>
                      <span className="font-semibold text-green-600">
                        {portfolioStats.bestTrade ? `+${formatCurrency(portfolioStats.bestTrade)}` : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Worst Trade</span>
                      <span className="font-semibold text-red-600">
                        {portfolioStats.worstTrade ? formatCurrency(portfolioStats.worstTrade) : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Win/Loss Distribution */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Win/Loss Distribution</h3>
                  <div className="h-48 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Wins', value: portfolioStats.winningTrades || 1 },
                            { name: 'Losses', value: portfolioStats.losingTrades || 1 }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          <Cell fill="#22c55e" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip formatter={(value, name) => [value, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm text-gray-600">Wins ({portfolioStats.winningTrades})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-sm text-gray-600">Losses ({portfolioStats.losingTrades})</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Balances Tab Content */}
            {activeTab === 'balances' && (
              <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">Account Balances</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {[
                    { label: 'Total Account Value', value: accountData.totalBalance, primary: true },
                    { label: 'Settled Cash', value: accountData.settledCash },
                    { label: 'Buying Power', value: accountData.buyingPower },
                    { label: 'Unrealized P&L', value: accountData.unrealizedPnl, colored: true },
                    { label: 'Realized P&L', value: accountData.realizedPnl, colored: true },
                    { label: 'Excess Liquidity', value: accountData.excessLiquidity },
                  ].map((item, i) => (
                    <div key={i} className="px-4 py-3 flex items-center justify-between">
                      <span className={`${item.primary ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                        {item.label}
                      </span>
                      <span className={`font-medium tabular-nums ${
                        item.colored
                          ? (item.value >= 0 ? 'text-green-600' : 'text-red-600')
                          : item.primary ? 'text-gray-900 text-lg' : 'text-gray-900'
                      }`}>
                        ${formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
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

import { useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import {
  TrendingUp, TrendingDown, Activity, Wrench, LayoutDashboard,
  ChevronRight, Check, X, Rocket, Crown
} from 'lucide-react'
import { useApp } from '../hooks/useApp'
import { trackPageView, trackButtonClick, trackUpgradeModalOpen, trackStatView } from '../utils/analytics'

const performanceData = [
  { date: 'Jan', pnl: 2400, trades: 24 },
  { date: 'Feb', pnl: 1398, trades: 18 },
  { date: 'Mar', pnl: 9800, trades: 42 },
  { date: 'Apr', pnl: 3908, trades: 31 },
  { date: 'May', pnl: 4800, trades: 28 },
  { date: 'Jun', pnl: 3800, trades: 35 },
  { date: 'Jul', pnl: 7300, trades: 47 },
  { date: 'Aug', pnl: 8200, trades: 52 },
  { date: 'Sep', pnl: 6100, trades: 38 },
  { date: 'Oct', pnl: 9400, trades: 61 },
  { date: 'Nov', pnl: 11200, trades: 58 },
  { date: 'Dec', pnl: 12456, trades: 64 },
]

const portfolioData = [
  { name: 'Crypto', value: 45, color: '#6366f1' },
  { name: 'Sports', value: 25, color: '#8b5cf6' },
  { name: 'Politics', value: 20, color: '#a855f7' },
  { name: 'Other', value: 10, color: '#d946ef' },
]

const Dashboard = () => {
  const { tradingMode, isPro, openUpgradeModal } = useApp()

  // Track page view when dashboard loads
  useEffect(() => {
    trackPageView('Dashboard')
  }, [])

  const stats = [
    {
      label: 'Total P&L',
      value: tradingMode === 'live' ? '$12,456.78' : '$45,230.00',
      change: '+12.4%',
      positive: true,
      icon: TrendingUp,
    },
    {
      label: 'Win Rate',
      value: '68%',
      change: '+5.2%',
      positive: true,
      icon: Activity,
    },
    {
      label: 'Active Strategies',
      value: '4',
      change: '+1',
      positive: true,
      icon: Wrench,
    },
    {
      label: 'Total Trades',
      value: tradingMode === 'live' ? '156' : '1,247',
      change: '+23',
      positive: true,
      icon: LayoutDashboard,
    },
  ]

  const recentTrades = [
    { pair: 'BTC/USD', type: 'Long', entry: '$43,250', exit: '$44,100', pnl: '+$850', status: 'Won' },
    { pair: 'ETH/USD', type: 'Short', entry: '$2,650', exit: '$2,580', pnl: '+$140', status: 'Won' },
    { pair: 'SOL/USD', type: 'Long', entry: '$98.50', exit: '$95.20', pnl: '-$66', status: 'Lost' },
    { pair: 'AVAX/USD', type: 'Long', entry: '$34.20', exit: '$36.80', pnl: '+$260', status: 'Won' },
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back! Here's your trading overview.</p>
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
            </div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Performance</h2>
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
              <option>Last 12 months</option>
              <option>Last 6 months</option>
              <option>Last 30 days</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
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
        </div>

        {/* Portfolio Allocation */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Portfolio Allocation</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={portfolioData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {portfolioData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {portfolioData.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Trades</h2>
          <button
            onClick={handleViewAllTrades}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
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
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{trade.pair}</td>
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
                      trade.status === 'Won' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {trade.status === 'Won' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {trade.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

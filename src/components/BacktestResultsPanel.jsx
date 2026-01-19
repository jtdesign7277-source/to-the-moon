/**
 * BacktestResultsPanel Component
 * Displays comprehensive backtest results with charts and metrics
 */

import { useState, useEffect } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ReferenceLine,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
  Calendar,
  DollarSign,
  Percent,
  BarChart3,
  Award,
  Clock,
  RefreshCw,
} from 'lucide-react'

// Generate cumulative P&L data from monthly returns
const generateCumulativePnL = (monthlyReturns, initialCapital = 10000) => {
  if (!monthlyReturns || monthlyReturns.length === 0) return []

  let cumulative = initialCapital
  const data = [{ month: 'Start', pnl: 0, cumulative: initialCapital }]

  monthlyReturns.forEach((item) => {
    cumulative += item.pnl
    data.push({
      month: item.month,
      pnl: item.pnl,
      cumulative,
      cumulativePnL: cumulative - initialCapital,
    })
  })

  return data
}

// Generate win/loss distribution data
const generateWinLossDistribution = (stats) => {
  if (!stats) return []

  const winningTrades = Math.round(stats.totalTrades * (stats.winRate / 100))
  const losingTrades = stats.totalTrades - winningTrades

  return [
    { name: 'Wins', value: winningTrades, color: '#22c55e' },
    { name: 'Losses', value: losingTrades, color: '#ef4444' },
  ]
}

// Generate trade distribution by size
const generateTradeDistribution = (stats) => {
  if (!stats) return []

  // Simulate trade distribution buckets
  const avgWin = Math.abs(stats.avgWin || 50)
  const avgLoss = Math.abs(stats.avgLoss || 30)

  return [
    { range: `$0-${Math.round(avgWin * 0.5)}`, wins: Math.round(stats.totalTrades * 0.15), losses: Math.round(stats.totalTrades * 0.08) },
    { range: `$${Math.round(avgWin * 0.5)}-${Math.round(avgWin)}`, wins: Math.round(stats.totalTrades * 0.25), losses: Math.round(stats.totalTrades * 0.12) },
    { range: `$${Math.round(avgWin)}-${Math.round(avgWin * 1.5)}`, wins: Math.round(stats.totalTrades * 0.20), losses: Math.round(stats.totalTrades * 0.08) },
    { range: `$${Math.round(avgWin * 1.5)}+`, wins: Math.round(stats.totalTrades * 0.10), losses: Math.round(stats.totalTrades * 0.02) },
  ]
}

// Risk level badge
const RiskBadge = ({ level }) => {
  const styles = {
    low: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'medium-high': 'bg-orange-100 text-orange-700 border-orange-200',
    high: 'bg-red-100 text-red-700 border-red-200',
  }

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[level] || styles.medium}`}>
      {level?.charAt(0).toUpperCase() + level?.slice(1)} Risk
    </span>
  )
}

// Metric card component
const MetricCard = ({ icon: Icon, label, value, subValue, trend, color = 'indigo' }) => {
  const colorStyles = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${colorStyles[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        {trend && (
          <span className={`text-xs font-medium flex items-center gap-0.5 ${
            trend > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {subValue && (
        <p className="text-xs text-gray-400 mt-1">{subValue}</p>
      )}
    </div>
  )
}

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {prefix}{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}{suffix}
          </p>
        ))}
      </div>
    )
  }
  return null
}

const BacktestResultsPanel = ({
  strategy,
  backtestStats,
  monthlyReturns,
  isLoading = false,
  onRerunBacktest,
  initialCapital = 10000,
}) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [showDetails, setShowDetails] = useState(false)

  // Use strategy data or provided stats
  const stats = backtestStats || strategy?.backtestStats || {}
  const returns = monthlyReturns || strategy?.monthlyReturns || []
  const riskLevel = strategy?.riskLevel || 'medium'

  // Generate chart data
  const cumulativeData = generateCumulativePnL(returns, initialCapital)
  const winLossData = generateWinLossDistribution(stats)
  const tradeDistribution = generateTradeDistribution(stats)

  // Calculate additional metrics
  const totalReturn = stats.profitLoss ? ((stats.profitLoss / initialCapital) * 100).toFixed(1) : '0'
  const winningTrades = Math.round((stats.totalTrades || 0) * ((stats.winRate || 0) / 100))
  const losingTrades = (stats.totalTrades || 0) - winningTrades
  const profitFactor = stats.avgLoss && stats.avgWin
    ? ((winningTrades * Math.abs(stats.avgWin)) / (losingTrades * Math.abs(stats.avgLoss) || 1)).toFixed(2)
    : '0'
  const expectancy = stats.avgWin && stats.avgLoss && stats.winRate
    ? (((stats.winRate / 100) * stats.avgWin) + ((1 - stats.winRate / 100) * stats.avgLoss)).toFixed(2)
    : '0'

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-8">
        <div className="flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-600 font-medium">Running Backtest...</p>
          <p className="text-sm text-gray-400 mt-1">Analyzing 6 months of historical data</p>
        </div>
      </div>
    )
  }

  if (!stats || Object.keys(stats).length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <Activity className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-600 font-medium">No Backtest Data</p>
          <p className="text-sm text-gray-400 mt-1">Run a backtest to see results</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{strategy?.icon || '📊'}</div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {strategy?.name || 'Strategy'} Backtest Results
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <RiskBadge level={riskLevel} />
                <span className="text-sm text-gray-500">
                  6-month simulation on ${initialCapital.toLocaleString()} capital
                </span>
              </div>
            </div>
          </div>
          {onRerunBacktest && (
            <button
              onClick={onRerunBacktest}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Re-run
            </button>
          )}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={DollarSign}
          label="Total P&L"
          value={`${stats.profitLoss >= 0 ? '+' : ''}$${(stats.profitLoss || 0).toLocaleString()}`}
          subValue={`${totalReturn}% return`}
          color={stats.profitLoss >= 0 ? 'green' : 'red'}
        />
        <MetricCard
          icon={Target}
          label="Win Rate"
          value={`${stats.winRate || 0}%`}
          subValue={`${winningTrades}W / ${losingTrades}L`}
          color="indigo"
        />
        <MetricCard
          icon={Activity}
          label="Total Trades"
          value={stats.totalTrades || 0}
          subValue={`~${Math.round((stats.totalTrades || 0) / 6)} per month`}
          color="purple"
        />
        <MetricCard
          icon={Shield}
          label="Max Drawdown"
          value={`${stats.maxDrawdown || 0}%`}
          subValue="Peak to trough"
          color={Math.abs(stats.maxDrawdown || 0) > 15 ? 'red' : 'yellow'}
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <nav className="flex">
            {['overview', 'performance', 'trades', 'risk'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Cumulative P&L Chart */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">Cumulative P&L</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cumulativeData}>
                      <defs>
                        <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip content={<CustomTooltip prefix="$" />} />
                      <ReferenceLine y={initialCapital} stroke="#9ca3af" strokeDasharray="3 3" />
                      <Area
                        type="monotone"
                        dataKey="cumulative"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fill="url(#colorPnL)"
                        name="Portfolio Value"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Returns */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">Monthly Returns</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={returns}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip content={<CustomTooltip prefix="$" />} />
                      <ReferenceLine y={0} stroke="#e5e7eb" />
                      <Bar
                        dataKey="pnl"
                        name="P&L"
                        radius={[4, 4, 0, 0]}
                      >
                        {returns.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              {/* Performance Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Sharpe Ratio</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.sharpeRatio || '-'}</p>
                  <p className="text-xs text-gray-400 mt-1">Risk-adjusted return</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Sortino Ratio</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.sortinoRatio || '-'}</p>
                  <p className="text-xs text-gray-400 mt-1">Downside risk adjusted</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Profit Factor</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{profitFactor}</p>
                  <p className="text-xs text-gray-400 mt-1">Gross profit / loss</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Expectancy</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">${expectancy}</p>
                  <p className="text-xs text-gray-400 mt-1">Expected per trade</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Avg Win</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">+${Math.abs(stats.avgWin || 0)}</p>
                  <p className="text-xs text-gray-400 mt-1">Per winning trade</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Avg Loss</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">-${Math.abs(stats.avgLoss || 0)}</p>
                  <p className="text-xs text-gray-400 mt-1">Per losing trade</p>
                </div>
              </div>

              {/* Win/Loss Ratio Chart */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Win/Loss Ratio</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={winLossData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {winLossData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(value, entry) => (
                            <span className="text-sm text-gray-600">
                              {value}: {entry.payload.value}
                            </span>
                          )}
                        />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Win/Loss by Size</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tradeDistribution} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                        <YAxis type="category" dataKey="range" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} width={80} />
                        <Tooltip />
                        <Bar dataKey="wins" name="Wins" fill="#22c55e" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="losses" name="Losses" fill="#ef4444" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trades Tab */}
          {activeTab === 'trades' && (
            <div className="space-y-6">
              {/* Trade Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <p className="text-sm text-green-700">Winning Trades</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{winningTrades}</p>
                  <p className="text-xs text-green-500 mt-1">{stats.winRate}% of total</p>
                </div>
                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-sm text-red-700">Losing Trades</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{losingTrades}</p>
                  <p className="text-xs text-red-500 mt-1">{100 - (stats.winRate || 0)}% of total</p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <p className="text-sm text-indigo-700">Best Month</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">
                    +${Math.max(...returns.map(r => r.pnl)).toLocaleString()}
                  </p>
                  <p className="text-xs text-indigo-500 mt-1">
                    {returns.find(r => r.pnl === Math.max(...returns.map(r => r.pnl)))?.month}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-600">Worst Month</p>
                  <p className="text-2xl font-bold text-gray-700 mt-1">
                    ${Math.min(...returns.map(r => r.pnl)).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {returns.find(r => r.pnl === Math.min(...returns.map(r => r.pnl)))?.month}
                  </p>
                </div>
              </div>

              {/* Monthly Breakdown Table */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">Monthly Breakdown</h3>
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">P&L</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Return %</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cumulative</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {cumulativeData.slice(1).map((row, index) => (
                        <tr key={row.month} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.month}</td>
                          <td className={`px-4 py-3 text-sm text-right font-medium ${
                            row.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {row.pnl >= 0 ? '+' : ''}${row.pnl.toLocaleString()}
                          </td>
                          <td className={`px-4 py-3 text-sm text-right ${
                            row.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {row.pnl >= 0 ? '+' : ''}{((row.pnl / initialCapital) * 100).toFixed(1)}%
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600">
                            ${row.cumulative.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">Total</td>
                        <td className={`px-4 py-3 text-sm text-right font-bold ${
                          stats.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stats.profitLoss >= 0 ? '+' : ''}${(stats.profitLoss || 0).toLocaleString()}
                        </td>
                        <td className={`px-4 py-3 text-sm text-right font-bold ${
                          stats.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stats.profitLoss >= 0 ? '+' : ''}{totalReturn}%
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                          ${(initialCapital + (stats.profitLoss || 0)).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Risk Tab */}
          {activeTab === 'risk' && (
            <div className="space-y-6">
              {/* Risk Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Max Drawdown</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{stats.maxDrawdown}%</p>
                  <p className="text-xs text-gray-400 mt-1">Largest peak-to-trough decline</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Risk/Reward Ratio</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    1:{(Math.abs(stats.avgWin || 0) / Math.abs(stats.avgLoss || 1)).toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Avg win vs avg loss</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Value at Risk (95%)</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ${Math.round(initialCapital * Math.abs(stats.maxDrawdown || 10) / 100).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Maximum expected loss</p>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Risk Assessment</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      {Math.abs(stats.maxDrawdown || 0) <= 10
                        ? 'This strategy shows conservative risk characteristics with controlled drawdowns.'
                        : Math.abs(stats.maxDrawdown || 0) <= 20
                        ? 'Moderate risk profile. Be prepared for potential 10-20% drawdowns.'
                        : 'Higher risk strategy. Significant drawdowns possible. Use appropriate position sizing.'}
                    </p>
                    <ul className="mt-3 space-y-1 text-sm text-yellow-700">
                      <li>- Sharpe Ratio {(stats.sharpeRatio || 0) >= 2 ? 'above' : 'below'} 2.0 ({(stats.sharpeRatio || 0) >= 2 ? 'excellent' : 'acceptable'})</li>
                      <li>- Win rate of {stats.winRate}% {(stats.winRate || 0) >= 60 ? 'provides good cushion' : 'requires strict risk management'}</li>
                      <li>- {profitFactor >= 1.5 ? 'Strong' : 'Adequate'} profit factor of {profitFactor}</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Drawdown Chart */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">Equity Curve with Drawdowns</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cumulativeData}>
                      <defs>
                        <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip prefix="$" />} />
                      <Area type="monotone" dataKey="cumulative" stroke="#22c55e" strokeWidth={2} fill="url(#colorEquity)" name="Equity" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-600">Important Disclaimer</p>
            <p className="text-xs text-gray-500 mt-1">
              These backtest results are based on historical simulation data and Monte Carlo modeling.
              <strong> Past performance does not guarantee future results.</strong> Actual trading involves
              real market conditions including slippage, fees, and liquidity constraints that may differ
              from simulated results. Always use proper risk management and never trade with money you
              cannot afford to lose.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BacktestResultsPanel

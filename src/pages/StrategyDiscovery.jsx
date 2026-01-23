/**
 * Strategy Discovery Page
 * Browse, filter, compare, and fork pre-built strategies
 */

import { useState, useMemo } from 'react'
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Shield,
  Target,
  Zap,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Copy,
  ArrowRight,
  Info,
  Star,
  Award,
  Activity,
  DollarSign,
  Percent,
  GitFork,
  Eye,
  SortAsc,
  SortDesc,
  Layers,
  AlertTriangle,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts'
import { STRATEGY_TEMPLATES, MARKET_CATEGORIES } from '../data/prebuiltStrategies'
import { trackStrategyView, trackStrategyFork } from '../utils/analytics'

// Risk level configuration
const RISK_LEVELS = [
  { id: 'all', label: 'All Risks', color: 'gray' },
  { id: 'very-low', label: 'Very Low', color: 'emerald', description: 'Conservative, capital preservation' },
  { id: 'low', label: 'Low', color: 'green', description: 'Steady, low volatility' },
  { id: 'low-medium', label: 'Low-Medium', color: 'teal', description: 'Balanced approach' },
  { id: 'medium', label: 'Medium', color: 'yellow', description: 'Moderate risk/reward' },
  { id: 'medium-high', label: 'Medium-High', color: 'orange', description: 'Growth focused' },
  { id: 'high', label: 'High', color: 'red', description: 'Aggressive, high volatility' },
]

// Sort options
const SORT_OPTIONS = [
  { id: 'sharpe', label: 'Sharpe Ratio', key: 'sharpeRatio', desc: true },
  { id: 'winRate', label: 'Win Rate', key: 'winRate', desc: true },
  { id: 'pnl', label: 'Total P&L', key: 'profitLoss', desc: true },
  { id: 'trades', label: 'Trade Count', key: 'totalTrades', desc: true },
  { id: 'drawdown', label: 'Max Drawdown', key: 'maxDrawdown', desc: false },
  { id: 'sortino', label: 'Sortino Ratio', key: 'sortinoRatio', desc: true },
]

// Get difficulty badge style
const getDifficultyStyle = (difficulty) => {
  const styles = {
    'Beginner': 'bg-green-100 text-green-700 border-green-200',
    'Intermediate': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Advanced': 'bg-orange-100 text-orange-700 border-orange-200',
    'Expert': 'bg-red-100 text-red-700 border-red-200',
  }
  return styles[difficulty] || 'bg-gray-100 text-gray-700 border-gray-200'
}

// Get risk level style
const getRiskStyle = (risk) => {
  const styles = {
    'very-low': 'bg-emerald-100 text-emerald-700',
    'low': 'bg-green-100 text-green-700',
    'low-medium': 'bg-teal-100 text-teal-700',
    'medium': 'bg-yellow-100 text-yellow-700',
    'medium-high': 'bg-orange-100 text-orange-700',
    'high': 'bg-red-100 text-red-700',
  }
  return styles[risk] || 'bg-gray-100 text-gray-700'
}

// Strategy card component
const StrategyCard = ({ strategy, rank, onCompare, isComparing, onFork, onView }) => {
  const stats = strategy.backtestStats || {}

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border-2 transition-all hover:shadow-lg ${
      isComparing ? 'border-indigo-500 shadow-md' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {rank <= 3 && (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                rank === 1 ? 'bg-yellow-100 text-yellow-600' :
                rank === 2 ? 'bg-gray-100 text-gray-500' :
                'bg-orange-100 text-orange-600'
              }`}>
                {rank === 1 ? <Award className="w-4 h-4" /> : <span className="text-sm font-bold">#{rank}</span>}
              </div>
            )}
            <div className="text-3xl">{strategy.icon}</div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{strategy.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getDifficultyStyle(strategy.difficulty)}`}>
                  {strategy.difficulty}
                </span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRiskStyle(strategy.riskLevel)}`}>
                  {strategy.riskLevel.replace('-', ' ')}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onCompare(strategy.id)}
            className={`p-2 rounded-lg transition-colors ${
              isComparing
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400'
            }`}
            title={isComparing ? 'Remove from comparison' : 'Add to comparison'}
          >
            {isComparing ? <Check className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{strategy.description}</p>
      </div>

      {/* Stats Grid */}
      <div className="p-4 grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Sharpe</p>
          <p className={`text-lg font-bold ${stats.sharpeRatio >= 2 ? 'text-green-600' : stats.sharpeRatio >= 1 ? 'text-yellow-600' : 'text-red-600'}`}>
            {stats.sharpeRatio || '-'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Win Rate</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.winRate || 0}%</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">6mo P&L</p>
          <p className={`text-lg font-bold ${(stats.profitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${(stats.profitLoss || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="px-4 pb-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{stats.totalTrades || 0} trades</span>
        <span>Max DD: {stats.maxDrawdown || 0}%</span>
        <span>Sortino: {stats.sortinoRatio || '-'}</span>
      </div>

      {/* Categories */}
      <div className="px-4 pb-3">
        <div className="flex flex-wrap gap-1">
          {strategy.categories?.map(cat => (
            <span key={cat} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded">
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex gap-2">
        <button
          onClick={() => onView(strategy)}
          className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          <Eye className="w-4 h-4" />
          View Details
        </button>
        <button
          onClick={() => onFork(strategy)}
          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          <GitFork className="w-4 h-4" />
          Fork & Customize
        </button>
      </div>
    </div>
  )
}

// Comparison panel component
const ComparisonPanel = ({ strategies, onRemove, onClose }) => {
  if (strategies.length === 0) return null

  // Prepare radar chart data
  const radarData = [
    { metric: 'Sharpe', fullMark: 3 },
    { metric: 'Win Rate', fullMark: 100 },
    { metric: 'Sortino', fullMark: 4 },
    { metric: 'Trades', fullMark: 250 },
    { metric: 'Return', fullMark: 100 },
  ].map(item => {
    const result = { ...item }
    strategies.forEach(s => {
      const stats = s.backtestStats || {}
      switch (item.metric) {
        case 'Sharpe':
          result[s.name] = (stats.sharpeRatio || 0) * 33.3 // Scale to 100
          break
        case 'Win Rate':
          result[s.name] = stats.winRate || 0
          break
        case 'Sortino':
          result[s.name] = (stats.sortinoRatio || 0) * 25 // Scale to 100
          break
        case 'Trades':
          result[s.name] = ((stats.totalTrades || 0) / 250) * 100
          break
        case 'Return':
          result[s.name] = Math.min(((stats.profitLoss || 0) / 10000) * 100, 100)
          break
      }
    })
    return result
  })

  const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444']

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-2xl z-40 max-h-[60vh] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Comparing {strategies.length} Strategies
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-x-auto">
          <div className="flex gap-6 min-w-max">
            {/* Radar Chart */}
            <div className="w-80 h-64 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  {strategies.map((s, i) => (
                    <Radar
                      key={s.id}
                      name={s.name}
                      dataKey={s.name}
                      stroke={colors[i]}
                      fill={colors[i]}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Comparison Table */}
            <div className="flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">Metric</th>
                    {strategies.map((s, i) => (
                      <th key={s.id} className="text-center py-2 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i] }} />
                          <span className="font-medium text-gray-900 dark:text-white">{s.icon} {s.name}</span>
                          <button
                            onClick={() => onRemove(s.id)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            <X className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Sharpe Ratio', key: 'sharpeRatio', format: (v) => v?.toFixed(1) || '-', best: 'high' },
                    { label: 'Sortino Ratio', key: 'sortinoRatio', format: (v) => v?.toFixed(1) || '-', best: 'high' },
                    { label: 'Win Rate', key: 'winRate', format: (v) => `${v || 0}%`, best: 'high' },
                    { label: 'Total P&L', key: 'profitLoss', format: (v) => `$${(v || 0).toLocaleString()}`, best: 'high' },
                    { label: 'Total Trades', key: 'totalTrades', format: (v) => v || 0, best: 'high' },
                    { label: 'Avg Win', key: 'avgWin', format: (v) => `$${v || 0}`, best: 'high' },
                    { label: 'Avg Loss', key: 'avgLoss', format: (v) => `$${Math.abs(v || 0)}`, best: 'low' },
                    { label: 'Max Drawdown', key: 'maxDrawdown', format: (v) => `${v || 0}%`, best: 'low' },
                  ].map(row => {
                    const values = strategies.map(s => s.backtestStats?.[row.key] || 0)
                    const best = row.best === 'high' ? Math.max(...values) : Math.min(...values)

                    return (
                      <tr key={row.key} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-2 pr-4 text-gray-600 dark:text-gray-400">{row.label}</td>
                        {strategies.map((s, i) => {
                          const value = s.backtestStats?.[row.key] || 0
                          const isBest = value === best && strategies.length > 1
                          return (
                            <td key={s.id} className={`py-2 px-4 text-center font-medium ${
                              isBest ? 'text-green-600 bg-green-50 dark:bg-green-900/30' : 'text-gray-900 dark:text-white'
                            }`}>
                              {row.format(value)}
                              {isBest && <Star className="w-3 h-3 inline ml-1" />}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Strategy detail modal
const StrategyDetailModal = ({ strategy, onClose, onFork }) => {
  if (!strategy) return null

  const stats = strategy.backtestStats || {}
  const monthlyReturns = strategy.monthlyReturns || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-linear-to-r from-indigo-500 to-purple-600">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="text-5xl bg-white/20 rounded-xl p-3">{strategy.icon}</div>
              <div className="text-white">
                <h2 className="text-2xl font-bold">{strategy.name}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-1 bg-white/20 rounded text-sm">{strategy.difficulty}</span>
                  <span className="px-2 py-1 bg-white/20 rounded text-sm">{strategy.riskLevel.replace('-', ' ')} risk</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-6">{strategy.description}</p>

          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-4 text-center">
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Sharpe Ratio</p>
              <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{stats.sharpeRatio || '-'}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-4 text-center">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">Win Rate</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.winRate || 0}%</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-4 text-center">
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Total P&L</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">${(stats.profitLoss || 0).toLocaleString()}</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/30 rounded-xl p-4 text-center">
              <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Max Drawdown</p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stats.maxDrawdown || 0}%</p>
            </div>
          </div>

          {/* Monthly Returns Chart */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Monthly Returns (6 months)</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyReturns}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(value) => [`$${value}`, 'P&L']} />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {monthlyReturns.map((entry, index) => (
                      <rect key={index} fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Strategy Settings */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Strategy Settings</h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Min Edge</span>
                  <span className="font-medium dark:text-white">{strategy.settings?.minEdge || 0}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Max Position</span>
                  <span className="font-medium dark:text-white">${strategy.settings?.maxPosition || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Stop Loss</span>
                  <span className="font-medium text-red-600">-{strategy.settings?.stopLoss || 0}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Take Profit</span>
                  <span className="font-medium text-green-600">+{strategy.settings?.takeProfit || 0}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Kelly Fraction</span>
                  <span className="font-medium dark:text-white">{strategy.settings?.kellyFraction || 0}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Performance Metrics</h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Total Trades</span>
                  <span className="font-medium dark:text-white">{stats.totalTrades || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Avg Win</span>
                  <span className="font-medium text-green-600">${stats.avgWin || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Avg Loss</span>
                  <span className="font-medium text-red-600">-${Math.abs(stats.avgLoss || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Sortino Ratio</span>
                  <span className="font-medium dark:text-white">{stats.sortinoRatio || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Monthly Return</span>
                  <span className="font-medium text-indigo-600">+{strategy.expectedMonthlyReturn || 0}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Markets & Categories */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Target Markets</h3>
            <div className="flex flex-wrap gap-2">
              {strategy.markets?.map(market => (
                <span key={market} className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium">
                  {market}
                </span>
              ))}
              {strategy.categories?.map(cat => (
                <span key={cat} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                Past performance does not guarantee future results. These backtest results are based on
                historical simulation and may not reflect actual trading conditions.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
          >
            Close
          </button>
          <button
            onClick={() => onFork(strategy)}
            className="flex-1 px-4 py-3 text-white bg-linear-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <GitFork className="w-4 h-4" />
            Fork & Customize
          </button>
        </div>
      </div>
    </div>
  )
}

const StrategyDiscovery = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRisk, setSelectedRisk] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('sharpe')
  const [sortDesc, setSortDesc] = useState(true)
  const [compareIds, setCompareIds] = useState([])
  const [viewStrategy, setViewStrategy] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  // Filter and sort strategies
  const filteredStrategies = useMemo(() => {
    let result = [...STRATEGY_TEMPLATES]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.categories?.some(c => c.toLowerCase().includes(query))
      )
    }

    // Risk filter
    if (selectedRisk !== 'all') {
      result = result.filter(s => s.riskLevel === selectedRisk)
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(s => s.categories?.includes(selectedCategory))
    }

    // Sort
    const sortOption = SORT_OPTIONS.find(o => o.id === sortBy)
    if (sortOption) {
      result.sort((a, b) => {
        const aVal = a.backtestStats?.[sortOption.key] || 0
        const bVal = b.backtestStats?.[sortOption.key] || 0
        return sortDesc ? bVal - aVal : aVal - bVal
      })
    }

    return result
  }, [searchQuery, selectedRisk, selectedCategory, sortBy, sortDesc])

  // Get comparison strategies
  const comparisonStrategies = useMemo(() => {
    return STRATEGY_TEMPLATES.filter(s => compareIds.includes(s.id))
  }, [compareIds])

  // Toggle comparison
  const toggleCompare = (id) => {
    setCompareIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id)
      }
      if (prev.length >= 4) {
        return prev // Max 4 comparisons
      }
      return [...prev, id]
    })
  }

  // Handle fork
  const handleFork = (strategy) => {
    // Track strategy fork in Google Analytics
    trackStrategyFork(strategy.name)
    // Navigate to strategy builder with this strategy as base
    // For now, just show an alert
    alert(`Forking "${strategy.name}" - This would navigate to Strategy Builder with pre-filled settings`)
  }

  // Handle view
  const handleView = (strategy) => {
    // Track strategy view in Google Analytics
    trackStrategyView(strategy.name)
    setViewStrategy(strategy)
  }

  // Categories for filter
  const categories = [
    { id: 'all', label: 'All Categories' },
    ...MARKET_CATEGORIES.map(c => ({ id: c.id, label: c.name, icon: c.icon }))
  ]

  return (
    <div className={`space-y-6 ${compareIds.length > 0 ? 'pb-96' : ''}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Strategy Discovery</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Explore {STRATEGY_TEMPLATES.length} pre-built strategies ranked by performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          {compareIds.length > 0 && (
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-sm font-medium">
              {compareIds.length} selected
            </span>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search strategies..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
            <button
              onClick={() => setSortDesc(!sortDesc)}
              className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
            >
              {sortDesc ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
            </button>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${
              showFilters ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {(selectedRisk !== 'all' || selectedCategory !== 'all') && (
              <span className="w-2 h-2 bg-indigo-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 grid md:grid-cols-2 gap-4">
            {/* Risk Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Risk Level</label>
              <div className="flex flex-wrap gap-2">
                {RISK_LEVELS.map(risk => (
                  <button
                    key={risk.id}
                    onClick={() => setSelectedRisk(risk.id)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      selectedRisk === risk.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {risk.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                      selectedCategory === cat.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {cat.icon && <span>{cat.icon}</span>}
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredStrategies.length} of {STRATEGY_TEMPLATES.length} strategies
        </p>
        {(selectedRisk !== 'all' || selectedCategory !== 'all' || searchQuery) && (
          <button
            onClick={() => {
              setSelectedRisk('all')
              setSelectedCategory('all')
              setSearchQuery('')
            }}
            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear filters
          </button>
        )}
      </div>

      {/* Strategy Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStrategies.map((strategy, index) => (
          <StrategyCard
            key={strategy.id}
            strategy={strategy}
            rank={index + 1}
            onCompare={toggleCompare}
            isComparing={compareIds.includes(strategy.id)}
            onFork={handleFork}
            onView={handleView}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredStrategies.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No strategies found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Try adjusting your search or filters</p>
          <button
            onClick={() => {
              setSelectedRisk('all')
              setSelectedCategory('all')
              setSearchQuery('')
            }}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Comparison Panel */}
      <ComparisonPanel
        strategies={comparisonStrategies}
        onRemove={toggleCompare}
        onClose={() => setCompareIds([])}
      />

      {/* Strategy Detail Modal */}
      <StrategyDetailModal
        strategy={viewStrategy}
        onClose={() => setViewStrategy(null)}
        onFork={handleFork}
      />
    </div>
  )
}

export default StrategyDiscovery

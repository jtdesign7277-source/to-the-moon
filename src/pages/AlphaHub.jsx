import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Pause,
  Play,
  Square,
  Settings,
  AlertTriangle,
  Zap,
  Clock,
  BarChart3,
  RefreshCw,
  ChevronRight,
  Shield,
  Crosshair,
  Radio,
  Eye,
  XCircle,
  CheckCircle,
  MinusCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Radar scanning animation component
const RadarScanner = ({ isActive }) => (
  <div className="relative w-12 h-12">
    <div className={`absolute inset-0 rounded-full border-2 ${isActive ? 'border-emerald-500' : 'border-gray-300'}`} />
    {isActive && (
      <>
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-emerald-500"
          animate={{ scale: [1, 1.5, 1.5], opacity: [0.8, 0, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-1/2 h-0.5 bg-gradient-to-r from-emerald-500 to-transparent origin-left"
          style={{ marginTop: '-1px', marginLeft: '0' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      </>
    )}
    <div className={`absolute top-1/2 left-1/2 w-2 h-2 -mt-1 -ml-1 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
  </div>
)

// Status badge component
const StatusBadge = ({ status }) => {
  const configs = {
    won: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle, label: 'Won' },
    lost: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Lost' },
    'in-play': { bg: 'bg-amber-100', text: 'text-amber-700', icon: MinusCircle, label: 'In Play' },
    active: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: Play, label: 'Active' },
    paused: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Pause, label: 'Paused' },
    stopped: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Square, label: 'Stopped' },
  }
  const config = configs[status] || configs.active
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  )
}

// Strategy card component
const StrategyCard = ({ strategy, onPause, onStop, onResume }) => {
  const isActive = strategy.status === 'active'
  const pnlPositive = strategy.unrealizedPnl >= 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <RadarScanner isActive={isActive} />
          <div>
            <h3 className="font-semibold text-gray-900">{strategy.name}</h3>
            <p className="text-sm text-gray-500">{strategy.symbol}</p>
          </div>
        </div>
        <StatusBadge status={strategy.status} />
      </div>

      {/* Market conditions */}
      <div className="bg-gray-50 rounded-xl p-3 mb-3">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-500">Current Price</span>
          <span className="font-semibold text-gray-900">${strategy.currentPrice?.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-500">RSI (14)</span>
          <span className={`font-semibold ${strategy.rsi < 30 ? 'text-emerald-600' : strategy.rsi > 70 ? 'text-red-600' : 'text-gray-900'}`}>
            {strategy.rsi?.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Signal</span>
          <span className={`font-semibold ${strategy.signal === 'BUY' ? 'text-emerald-600' : strategy.signal === 'SELL' ? 'text-red-600' : 'text-gray-500'}`}>
            {strategy.signal || 'Scanning...'}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Capital</p>
          <p className="font-semibold text-sm">${strategy.capital?.toLocaleString()}</p>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Trades</p>
          <p className="font-semibold text-sm">{strategy.totalTrades}</p>
        </div>
        <div className={`text-center p-2 rounded-lg ${pnlPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <p className="text-xs text-gray-500">P&L</p>
          <p className={`font-semibold text-sm ${pnlPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {pnlPositive ? '+' : ''}{strategy.unrealizedPnl?.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Running time */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Running for {strategy.runningTime}
        </div>
        <span>{strategy.mode === 'paper' ? 'Paper' : 'Live'} Trading</span>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {strategy.status === 'active' ? (
          <button
            onClick={() => onPause(strategy.id)}
            className="flex-1 flex items-center justify-center gap-1 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium"
          >
            <Pause className="w-4 h-4" />
            Pause
          </button>
        ) : (
          <button
            onClick={() => onResume(strategy.id)}
            className="flex-1 flex items-center justify-center gap-1 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium"
          >
            <Play className="w-4 h-4" />
            Resume
          </button>
        )}
        <button
          onClick={() => onStop(strategy.id)}
          className="flex items-center justify-center gap-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium"
        >
          <Square className="w-4 h-4" />
          Stop
        </button>
        <button className="flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

// Trade row component
const TradeRow = ({ trade }) => {
  const isWin = trade.status === 'won'
  const isLoss = trade.status === 'lost'
  const isOpen = trade.status === 'in-play'

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100"
    >
      {/* Status indicator */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        isWin ? 'bg-emerald-100' : isLoss ? 'bg-red-100' : 'bg-amber-100'
      }`}>
        {isWin ? (
          <ArrowUpRight className="w-5 h-5 text-emerald-600" />
        ) : isLoss ? (
          <ArrowDownRight className="w-5 h-5 text-red-600" />
        ) : (
          <Activity className="w-5 h-5 text-amber-600" />
        )}
      </div>

      {/* Trade info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">{trade.symbol}</span>
          <span className={`text-xs font-bold ${trade.side === 'BUY' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
            {trade.side}
          </span>
          <StatusBadge status={trade.status} />
        </div>
        <p className="text-xs text-gray-500 truncate">
          {trade.strategy} • {trade.shares} shares @ ${trade.entryPrice?.toFixed(2)}
        </p>
      </div>

      {/* P&L */}
      <div className="text-right">
        <p className={`font-semibold ${isWin ? 'text-emerald-600' : isLoss ? 'text-red-600' : 'text-amber-600'}`}>
          {trade.pnl >= 0 ? '+' : ''}${trade.pnl?.toFixed(2)}
        </p>
        <p className={`text-xs ${isWin ? 'text-emerald-600' : isLoss ? 'text-red-600' : 'text-amber-600'}`}>
          {trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent?.toFixed(2)}%
        </p>
      </div>
    </motion.div>
  )
}

export default function AlphaHub() {
  const [strategies, setStrategies] = useState([])
  const [trades, setTrades] = useState([])
  const [stats, setStats] = useState({
    totalPnl: 0,
    todayPnl: 0,
    winRate: 0,
    activePositions: 0,
    capitalDeployed: 0,
    capitalAvailable: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [showKillSwitch, setShowKillSwitch] = useState(false)

  // Load data
  useEffect(() => {
    loadData()
    // Poll for updates every 5 seconds
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      // In production, fetch from API
      // For now, use mock data
      setStrategies([
        {
          id: '1',
          name: 'RSI Oversold Bounce',
          symbol: 'TSLA',
          status: 'active',
          currentPrice: 248.50,
          rsi: 28.5,
          signal: 'BUY',
          capital: 5000,
          totalTrades: 12,
          unrealizedPnl: 8.5,
          runningTime: '2h 34m',
          mode: 'paper',
        },
        {
          id: '2',
          name: 'MA Crossover Strategy',
          symbol: 'AAPL',
          status: 'active',
          currentPrice: 182.30,
          rsi: 55.2,
          signal: null,
          capital: 3000,
          totalTrades: 8,
          unrealizedPnl: -2.1,
          runningTime: '5h 12m',
          mode: 'paper',
        },
        {
          id: '3',
          name: 'Momentum Breakout',
          symbol: 'NVDA',
          status: 'paused',
          currentPrice: 875.20,
          rsi: 72.8,
          signal: 'SELL',
          capital: 10000,
          totalTrades: 5,
          unrealizedPnl: 15.3,
          runningTime: '1d 4h',
          mode: 'paper',
        },
      ])

      setTrades([
        {
          id: '1',
          symbol: 'TSLA',
          side: 'BUY',
          status: 'in-play',
          strategy: 'RSI Oversold Bounce',
          shares: 20,
          entryPrice: 245.00,
          currentPrice: 248.50,
          pnl: 70.00,
          pnlPercent: 1.43,
          timestamp: new Date(),
        },
        {
          id: '2',
          symbol: 'AAPL',
          side: 'BUY',
          status: 'won',
          strategy: 'MA Crossover Strategy',
          shares: 15,
          entryPrice: 178.50,
          exitPrice: 183.20,
          pnl: 70.50,
          pnlPercent: 2.63,
          timestamp: new Date(Date.now() - 3600000),
        },
        {
          id: '3',
          symbol: 'NVDA',
          side: 'BUY',
          status: 'won',
          strategy: 'Momentum Breakout',
          shares: 5,
          entryPrice: 850.00,
          exitPrice: 878.50,
          pnl: 142.50,
          pnlPercent: 3.35,
          timestamp: new Date(Date.now() - 7200000),
        },
        {
          id: '4',
          symbol: 'AMD',
          side: 'BUY',
          status: 'lost',
          strategy: 'RSI Oversold Bounce',
          shares: 25,
          entryPrice: 155.00,
          exitPrice: 151.20,
          pnl: -95.00,
          pnlPercent: -2.45,
          timestamp: new Date(Date.now() - 86400000),
        },
        {
          id: '5',
          symbol: 'MSFT',
          side: 'SELL',
          status: 'won',
          strategy: 'MA Crossover Strategy',
          shares: 10,
          entryPrice: 402.50,
          exitPrice: 395.00,
          pnl: 75.00,
          pnlPercent: 1.86,
          timestamp: new Date(Date.now() - 172800000),
        },
      ])

      setStats({
        totalPnl: 263.00,
        todayPnl: 140.50,
        winRate: 75,
        activePositions: 1,
        capitalDeployed: 18000,
        capitalAvailable: 82000,
      })

      setIsLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      setIsLoading(false)
    }
  }

  const handlePause = (id) => {
    setStrategies(prev => prev.map(s => s.id === id ? { ...s, status: 'paused' } : s))
  }

  const handleResume = (id) => {
    setStrategies(prev => prev.map(s => s.id === id ? { ...s, status: 'active' } : s))
  }

  const handleStop = (id) => {
    setStrategies(prev => prev.filter(s => s.id !== id))
  }

  const handleKillSwitch = () => {
    setStrategies(prev => prev.map(s => ({ ...s, status: 'stopped' })))
    setShowKillSwitch(false)
  }

  const filteredTrades = trades.filter(t => {
    if (activeTab === 'all') return true
    return t.status === activeTab
  })

  const pnlPositive = stats.totalPnl >= 0
  const todayPnlPositive = stats.todayPnl >= 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-violet-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Loading Command Center...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white px-4 pt-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Alpha Hub</h1>
            <p className="text-violet-200 text-sm">Strategy Command Center</p>
          </div>
          <button
            onClick={() => setShowKillSwitch(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-400/50 rounded-xl text-red-100 text-sm font-medium"
          >
            <Shield className="w-4 h-4" />
            Kill Switch
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-violet-200 text-xs mb-1">Total P&L</p>
            <p className={`text-xl font-bold ${pnlPositive ? 'text-emerald-300' : 'text-red-300'}`}>
              {pnlPositive ? '+' : ''}${stats.totalPnl.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-violet-200 text-xs mb-1">Today</p>
            <p className={`text-xl font-bold ${todayPnlPositive ? 'text-emerald-300' : 'text-red-300'}`}>
              {todayPnlPositive ? '+' : ''}${stats.todayPnl.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-violet-200 text-xs mb-1">Win Rate</p>
            <p className="text-xl font-bold">{stats.winRate}%</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-violet-200 text-xs mb-1">Active Positions</p>
            <p className="text-xl font-bold">{stats.activePositions}</p>
          </div>
        </div>

        {/* Capital bar */}
        <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-violet-200">Capital Deployed</span>
            <span className="font-semibold">${stats.capitalDeployed.toLocaleString()} / ${(stats.capitalDeployed + stats.capitalAvailable).toLocaleString()}</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"
              style={{ width: `${(stats.capitalDeployed / (stats.capitalDeployed + stats.capitalAvailable)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Active Strategies Section */}
      <div className="px-4 -mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-violet-600" />
            Active Strategies
          </h2>
          <span className="text-sm text-gray-500">{strategies.filter(s => s.status === 'active').length} running</span>
        </div>

        {strategies.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <Crosshair className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No active strategies</p>
            <button className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium">
              Deploy from Alpha Lab
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {strategies.map(strategy => (
              <StrategyCard
                key={strategy.id}
                strategy={strategy}
                onPause={handlePause}
                onResume={handleResume}
                onStop={handleStop}
              />
            ))}
          </div>
        )}
      </div>

      {/* Trade Execution Log */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-violet-600" />
            Trade Log
          </h2>
          <button className="text-sm text-violet-600 font-medium flex items-center gap-1">
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'in-play', label: 'In Play' },
            { id: 'won', label: 'Won' },
            { id: 'lost', label: 'Lost' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {tab.label}
              {tab.id !== 'all' && (
                <span className="ml-1 opacity-70">
                  ({trades.filter(t => t.status === tab.id).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Trade list */}
        <div className="space-y-2">
          {filteredTrades.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center border border-gray-100">
              <Eye className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No trades in this category</p>
            </div>
          ) : (
            filteredTrades.map(trade => (
              <TradeRow key={trade.id} trade={trade} />
            ))
          )}
        </div>
      </div>

      {/* Recent Signals */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Recent Signals
          </h2>
        </div>

        <div className="space-y-2">
          {[
            { symbol: 'TSLA', signal: 'BUY', reason: 'RSI dropped below 30', time: '2m ago', strategy: 'RSI Oversold Bounce' },
            { symbol: 'NVDA', signal: 'SELL', reason: 'RSI above 70', time: '15m ago', strategy: 'Momentum Breakout' },
            { symbol: 'AAPL', signal: 'HOLD', reason: 'Waiting for MA crossover', time: '1h ago', strategy: 'MA Crossover Strategy' },
          ].map((signal, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                signal.signal === 'BUY' ? 'bg-emerald-100' : signal.signal === 'SELL' ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                {signal.signal === 'BUY' ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                ) : signal.signal === 'SELL' ? (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                ) : (
                  <Activity className="w-4 h-4 text-gray-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{signal.symbol}</span>
                  <span className={`text-xs font-bold ${
                    signal.signal === 'BUY' ? 'text-emerald-700 dark:text-emerald-400' :
                    signal.signal === 'SELL' ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-400'
                  }`}>
                    {signal.signal}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{signal.reason}</p>
              </div>
              <span className="text-xs text-gray-400">{signal.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Kill Switch Modal */}
      <AnimatePresence>
        {showKillSwitch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowKillSwitch(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Emergency Kill Switch</h3>
                <p className="text-gray-600 mb-6">
                  This will immediately stop ALL active strategies and close any pending orders. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowKillSwitch(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleKillSwitch}
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium"
                  >
                    Stop All
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

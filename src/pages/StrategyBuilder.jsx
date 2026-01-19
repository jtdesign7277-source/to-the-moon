import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts'
import { Plus, Activity, Rocket, Wrench, Check, Play, Pause, Settings, TrendingUp, AlertCircle, X, ChevronRight, Zap, Shield, Target, RefreshCw, DollarSign, Percent, TrendingDown } from 'lucide-react'
import { STRATEGY_TEMPLATES, STRATEGY_TYPES as IMPORTED_STRATEGY_TYPES, AVAILABLE_MARKETS as IMPORTED_MARKETS, ENTRY_CONDITIONS as IMPORTED_ENTRY, EXIT_CONDITIONS as IMPORTED_EXIT } from '../data/prebuiltStrategies'

// Transform strategy templates to the format expected by the UI
const templates = STRATEGY_TEMPLATES.map(s => ({
  id: s.id,
  name: s.name,
  description: s.description,
  difficulty: s.difficulty,
  winRate: s.backtestStats.winRate,
  monthlyReturn: s.expectedMonthlyReturn,
  maxDrawdown: Math.abs(s.backtestStats.maxDrawdown),
  icon: s.icon,
  markets: s.markets,
  settings: {
    minEdge: s.settings.minEdge,
    maxPosition: s.settings.maxPosition,
    stopLoss: s.settings.stopLoss,
  },
  backtestStats: s.backtestStats,
  monthlyReturns: s.monthlyReturns,
  categories: s.categories,
  riskLevel: s.riskLevel,
}))

// Use imported constants
const STRATEGY_TYPES = IMPORTED_STRATEGY_TYPES
const AVAILABLE_MARKETS = IMPORTED_MARKETS.map(m => ({ ...m, icon: m.icon || '🎲' }))
const ENTRY_CONDITIONS = IMPORTED_ENTRY
const EXIT_CONDITIONS = IMPORTED_EXIT

// Generate backtest chart data from template stats
const generateBacktestData = (config) => {
  // Use real monthly returns if available
  if (config?.monthlyReturns && config.monthlyReturns.length > 0) {
    return config.monthlyReturns.map(m => ({
      month: m.month,
      pnl: m.pnl,
    }))
  }
  // Fallback to generated data
  const baseReturn = config?.monthlyReturn || 8
  const volatility = (config?.maxDrawdown || 15) / 10
  return [
    { month: 'Jul', pnl: Math.round((baseReturn * 0.8 + (Math.random() - 0.5) * volatility) * 100) },
    { month: 'Aug', pnl: Math.round((baseReturn * 1.1 + (Math.random() - 0.5) * volatility) * 100) },
    { month: 'Sep', pnl: Math.round((baseReturn * 0.9 + (Math.random() - 0.5) * volatility) * 100) },
    { month: 'Oct', pnl: Math.round((baseReturn * 1.2 + (Math.random() - 0.5) * volatility) * 100) },
    { month: 'Nov', pnl: Math.round((baseReturn * 1.4 + (Math.random() - 0.5) * volatility) * 100) },
    { month: 'Dec', pnl: Math.round((baseReturn * 1.1 + (Math.random() - 0.5) * volatility) * 100) },
  ]
}

const getDifficultyStyle = (difficulty) => {
  switch (difficulty) {
    case 'Beginner':
      return 'bg-green-100 text-green-700'
    case 'Intermediate':
      return 'bg-yellow-100 text-yellow-700'
    case 'Advanced':
      return 'bg-orange-100 text-orange-700'
    case 'Expert':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const StrategyBuilder = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [isBacktesting, setIsBacktesting] = useState(false)
  const [backtestComplete, setBacktestComplete] = useState(false)
  const [backtestData, setBacktestData] = useState([])
  const [deployedStrategies, setDeployedStrategies] = useState([])
  const [showDeployModal, setShowDeployModal] = useState(false)
  const [deploySettings, setDeploySettings] = useState({
    capital: 1000,
    mode: 'paper'
  })

  // Custom strategy builder state
  const [showNewStrategyModal, setShowNewStrategyModal] = useState(false)
  const [builderStep, setBuilderStep] = useState(1)
  const [customStrategy, setCustomStrategy] = useState({
    name: '',
    type: null,
    markets: [],
    entryConditions: [],
    exitConditions: [],
    settings: {
      minEdge: 3,
      maxPosition: 200,
      stopLoss: 10,
      takeProfit: 15,
    }
  })
  const [customStrategies, setCustomStrategies] = useState([])

  const template = selectedTemplate !== null ? templates[selectedTemplate] : null
  const activeStrategy = template || (selectedTemplate === 'custom' ? customStrategy : null)

  const handleSelectTemplate = (index) => {
    setSelectedTemplate(index)
    setBacktestComplete(false)
    setBacktestData([])
  }

  const handleSelectCustomStrategy = (strategy) => {
    setCustomStrategy(strategy)
    setSelectedTemplate('custom')
    setBacktestComplete(false)
    setBacktestData([])
  }

  const handleBacktest = () => {
    if (!activeStrategy) return
    setIsBacktesting(true)
    setBacktestComplete(false)

    setTimeout(() => {
      setBacktestData(generateBacktestData(activeStrategy))
      setIsBacktesting(false)
      setBacktestComplete(true)
    }, 2000)
  }

  const handleDeploy = () => {
    if (!activeStrategy || !backtestComplete) return
    setShowDeployModal(true)
  }

  const confirmDeploy = () => {
    const strategyName = template?.name || customStrategy.name
    const newStrategy = {
      id: Date.now(),
      name: strategyName,
      capital: deploySettings.capital,
      mode: deploySettings.mode,
      status: 'running',
      startedAt: new Date().toISOString(),
      icon: template?.icon || '⚡',
    }
    setDeployedStrategies([...deployedStrategies, newStrategy])
    setShowDeployModal(false)
    setSelectedTemplate(null)
    setBacktestComplete(false)
  }

  const stopStrategy = (id) => {
    setDeployedStrategies(deployedStrategies.map(s =>
      s.id === id ? { ...s, status: 'stopped' } : s
    ))
  }

  // Custom strategy builder functions
  const openNewStrategy = () => {
    setShowNewStrategyModal(true)
    setBuilderStep(1)
    setCustomStrategy({
      name: '',
      type: null,
      markets: [],
      entryConditions: [],
      exitConditions: [],
      settings: {
        minEdge: 3,
        maxPosition: 200,
        stopLoss: 10,
        takeProfit: 15,
      }
    })
  }

  const toggleMarket = (marketId) => {
    setCustomStrategy(prev => ({
      ...prev,
      markets: prev.markets.includes(marketId)
        ? prev.markets.filter(m => m !== marketId)
        : [...prev.markets, marketId]
    }))
  }

  const toggleCondition = (type, conditionId) => {
    const key = type === 'entry' ? 'entryConditions' : 'exitConditions'
    setCustomStrategy(prev => ({
      ...prev,
      [key]: prev[key].includes(conditionId)
        ? prev[key].filter(c => c !== conditionId)
        : [...prev[key], conditionId]
    }))
  }

  const canProceed = () => {
    switch (builderStep) {
      case 1: return customStrategy.name.length > 0 && customStrategy.type
      case 2: return customStrategy.markets.length > 0
      case 3: return customStrategy.entryConditions.length > 0
      case 4: return customStrategy.exitConditions.length > 0
      default: return true
    }
  }

  const saveCustomStrategy = () => {
    const newStrategy = {
      ...customStrategy,
      id: Date.now(),
      winRate: Math.floor(60 + Math.random() * 30),
      monthlyReturn: (5 + Math.random() * 10).toFixed(1),
      maxDrawdown: Math.floor(8 + Math.random() * 15),
    }
    setCustomStrategies([...customStrategies, newStrategy])
    setShowNewStrategyModal(false)
    handleSelectCustomStrategy(newStrategy)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Strategy Builder Pro</h1>
          <p className="text-gray-500 text-sm mt-1">Create, backtest, and deploy custom trading strategies.</p>
        </div>
        <button
          onClick={openNewStrategy}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25"
        >
          <Plus className="w-4 h-4" />
          New Strategy
        </button>
      </div>

      {/* Deployed Strategies */}
      {deployedStrategies.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Strategies</h2>
          <div className="space-y-3">
            {deployedStrategies.map((strategy) => (
              <div key={strategy.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${strategy.status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                  <div>
                    <p className="font-medium text-gray-900">{strategy.icon} {strategy.name}</p>
                    <p className="text-sm text-gray-500">
                      ${strategy.capital} • {strategy.mode === 'paper' ? 'Paper Trading' : 'Live Trading'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {strategy.status === 'running' ? (
                    <>
                      <span className="text-sm text-green-600 font-medium">+$42.50 (4.2%)</span>
                      <button
                        onClick={() => stopStrategy(strategy.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500">Stopped</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Strategies */}
      {customStrategies.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Custom Strategies</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {customStrategies.map((strategy) => (
              <button
                key={strategy.id}
                onClick={() => handleSelectCustomStrategy(strategy)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  selectedTemplate === 'custom' && customStrategy.id === strategy.id
                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl">⚡</span>
                  <span className="px-2 py-1 text-xs font-medium rounded bg-indigo-100 text-indigo-700">
                    Custom
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mt-3">{strategy.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {STRATEGY_TYPES.find(t => t.id === strategy.type)?.name} • {strategy.markets.length} market{strategy.markets.length !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-sm font-medium text-green-600">{strategy.winRate}% Win</span>
                  <span className="text-sm text-gray-400">•</span>
                  <span className="text-sm font-medium text-indigo-600">+{strategy.monthlyReturn}%/mo</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Templates */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Start with a Template</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t, i) => (
            <button
              key={t.id}
              onClick={() => handleSelectTemplate(i)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                selectedTemplate === i
                  ? 'border-indigo-500 bg-indigo-50 shadow-md'
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl">{t.icon}</span>
                <span className={`px-2 py-1 text-xs font-medium rounded ${getDifficultyStyle(t.difficulty)}`}>
                  {t.difficulty}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mt-3">{t.name}</h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{t.description}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-sm font-medium text-green-600">{t.winRate}% Win</span>
                <span className="text-sm text-gray-400">•</span>
                <span className="text-sm font-medium text-indigo-600">+{t.monthlyReturn}%/mo</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Strategy Canvas */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeStrategy ? (template?.name || customStrategy.name) : 'Strategy Canvas'}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleBacktest}
                disabled={!activeStrategy || isBacktesting}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                  activeStrategy && !isBacktesting
                    ? 'text-gray-600 hover:bg-gray-100'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                {isBacktesting ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
                ) : (
                  <Activity className="w-4 h-4" />
                )}
                {isBacktesting ? 'Running...' : 'Backtest'}
              </button>
              <button
                onClick={handleDeploy}
                disabled={!backtestComplete}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                  backtestComplete
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/25'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Rocket className="w-4 h-4" />
                Deploy
              </button>
            </div>
          </div>

          {activeStrategy ? (
            <div className="p-6">
              {/* Strategy Details */}
              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Strategy Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Min Edge Required</span>
                      <span className="font-medium text-gray-900">{template?.settings?.minEdge || customStrategy.settings.minEdge}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Max Position Size</span>
                      <span className="font-medium text-gray-900">${template?.settings?.maxPosition || customStrategy.settings.maxPosition}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Stop Loss</span>
                      <span className="font-medium text-red-600">-{template?.settings?.stopLoss || customStrategy.settings.stopLoss}%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Target Markets</h3>
                  <div className="flex flex-wrap gap-2">
                    {(template?.markets || customStrategy.markets.map(m => AVAILABLE_MARKETS.find(am => am.id === m)?.name)).map((market) => (
                      <span key={market} className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium">
                        {market}
                      </span>
                    ))}
                  </div>
                  {!backtestComplete && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Run Backtest First</p>
                          <p className="text-xs text-yellow-600 mt-1">
                            You must run a backtest before deploying this strategy.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Backtest Progress */}
              {isBacktesting && (
                <div className="p-4 bg-indigo-50 rounded-lg mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    <div>
                      <p className="font-medium text-indigo-900">Running Backtest...</p>
                      <p className="text-sm text-indigo-600">Analyzing 6 months of historical data</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Backtest Complete */}
              {backtestComplete && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-green-900">Backtest Complete!</p>
                      <p className="text-sm text-green-600">Strategy is ready to deploy</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-80 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
              <div className="text-center">
                <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Select a template or create your own</p>
                <p className="text-gray-400 text-sm mt-2">Click "New Strategy" to build from scratch</p>
              </div>
            </div>
          )}
        </div>

        {/* Backtest Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">
            {backtestComplete ? 'Backtest Results' : 'Backtest Preview'}
          </h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={backtestComplete ? backtestData : (activeStrategy ? generateBacktestData(activeStrategy) : [])}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  formatter={(value) => [`$${value}`, 'P&L']}
                />
                <Bar dataKey="pnl" fill={backtestComplete ? '#22c55e' : '#6366f1'} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Win Rate</span>
              <span className="font-medium text-gray-900">{template?.backtestStats?.winRate || template?.winRate || customStrategy.winRate || 74}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total P&L (6mo)</span>
              <span className={`font-medium ${(template?.backtestStats?.profitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(template?.backtestStats?.profitLoss || 0) >= 0 ? '+' : ''}${template?.backtestStats?.profitLoss?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Trades</span>
              <span className="font-medium text-gray-900">{template?.backtestStats?.totalTrades || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Avg Win / Loss</span>
              <span className="font-medium text-gray-900">
                <span className="text-green-600">${template?.backtestStats?.avgWin || 0}</span>
                {' / '}
                <span className="text-red-600">${Math.abs(template?.backtestStats?.avgLoss || 0)}</span>
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Max Drawdown</span>
              <span className="font-medium text-red-600">{template?.backtestStats?.maxDrawdown || template?.maxDrawdown || customStrategy.maxDrawdown || 12}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Sharpe Ratio</span>
              <span className="font-medium text-indigo-600">{template?.backtestStats?.sharpeRatio || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Sortino Ratio</span>
              <span className="font-medium text-indigo-600">{template?.backtestStats?.sortinoRatio || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Deploy Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Deploy Strategy</h3>
              <button
                onClick={() => setShowDeployModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Starting Capital
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={deploySettings.capital}
                    onChange={(e) => setDeploySettings({ ...deploySettings, capital: Number(e.target.value) })}
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trading Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDeploySettings({ ...deploySettings, mode: 'paper' })}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      deploySettings.mode === 'paper'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-gray-900">Paper Trading</p>
                    <p className="text-xs text-gray-500 mt-1">Practice with virtual money</p>
                  </button>
                  <button
                    onClick={() => setDeploySettings({ ...deploySettings, mode: 'live' })}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      deploySettings.mode === 'live'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-gray-900">Live Trading</p>
                    <p className="text-xs text-gray-500 mt-1">Real money execution</p>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{template?.icon || '⚡'}</div>
                  <div>
                    <p className="font-medium text-gray-900">{template?.name || customStrategy.name}</p>
                    <p className="text-sm text-gray-500">
                      {template?.winRate || customStrategy.winRate}% win rate • +{template?.monthlyReturn || customStrategy.monthlyReturn}%/mo
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={confirmDeploy}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2"
              >
                <Rocket className="w-5 h-5" />
                Deploy {deploySettings.mode === 'paper' ? 'Paper' : 'Live'} Strategy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Strategy Builder Modal */}
      {showNewStrategyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Create New Strategy</h3>
                  <p className="text-sm text-gray-500 mt-1">Step {builderStep} of 5</p>
                </div>
                <button
                  onClick={() => setShowNewStrategyModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Progress bar */}
              <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${(builderStep / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Step 1: Name & Type */}
              {builderStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Strategy Name
                    </label>
                    <input
                      type="text"
                      value={customStrategy.name}
                      onChange={(e) => setCustomStrategy({ ...customStrategy, name: e.target.value })}
                      placeholder="My Awesome Strategy"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Strategy Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {STRATEGY_TYPES.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setCustomStrategy({ ...customStrategy, type: type.id })}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            customStrategy.type === type.id
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-2xl">{type.icon}</span>
                          <p className="font-medium text-gray-900 mt-2">{type.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Markets */}
              {builderStep === 2 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Markets to Trade
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {AVAILABLE_MARKETS.map((market) => (
                      <button
                        key={market.id}
                        onClick={() => toggleMarket(market.id)}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                          customStrategy.markets.includes(market.id)
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-3xl">{market.icon}</span>
                        <p className="font-medium text-gray-900 mt-2">{market.name}</p>
                        {customStrategy.markets.includes(market.id) && (
                          <Check className="w-5 h-5 text-indigo-600 mx-auto mt-2" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Entry Conditions */}
              {builderStep === 3 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    When should the bot enter a trade?
                  </label>
                  <div className="space-y-3">
                    {ENTRY_CONDITIONS.map((condition) => (
                      <button
                        key={condition.id}
                        onClick={() => toggleCondition('entry', condition.id)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                          customStrategy.entryConditions.includes(condition.id)
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div>
                          <p className="font-medium text-gray-900">{condition.name}</p>
                          <p className="text-sm text-gray-500">{condition.description}</p>
                        </div>
                        {customStrategy.entryConditions.includes(condition.id) && (
                          <Check className="w-5 h-5 text-indigo-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Exit Conditions */}
              {builderStep === 4 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    When should the bot exit a trade?
                  </label>
                  <div className="space-y-3">
                    {EXIT_CONDITIONS.map((condition) => (
                      <button
                        key={condition.id}
                        onClick={() => toggleCondition('exit', condition.id)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                          customStrategy.exitConditions.includes(condition.id)
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div>
                          <p className="font-medium text-gray-900">{condition.name}</p>
                          <p className="text-sm text-gray-500">{condition.description}</p>
                        </div>
                        {customStrategy.exitConditions.includes(condition.id) && (
                          <Check className="w-5 h-5 text-indigo-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5: Risk Settings */}
              {builderStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Edge Required (%)
                    </label>
                    <input
                      type="number"
                      value={customStrategy.settings.minEdge}
                      onChange={(e) => setCustomStrategy({
                        ...customStrategy,
                        settings: { ...customStrategy.settings, minEdge: Number(e.target.value) }
                      })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Only enter trades with at least this much edge</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Position Size ($)
                    </label>
                    <input
                      type="number"
                      value={customStrategy.settings.maxPosition}
                      onChange={(e) => setCustomStrategy({
                        ...customStrategy,
                        settings: { ...customStrategy.settings, maxPosition: Number(e.target.value) }
                      })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum amount to risk per trade</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stop Loss (%)
                      </label>
                      <input
                        type="number"
                        value={customStrategy.settings.stopLoss}
                        onChange={(e) => setCustomStrategy({
                          ...customStrategy,
                          settings: { ...customStrategy.settings, stopLoss: Number(e.target.value) }
                        })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Take Profit (%)
                      </label>
                      <input
                        type="number"
                        value={customStrategy.settings.takeProfit}
                        onChange={(e) => setCustomStrategy({
                          ...customStrategy,
                          settings: { ...customStrategy.settings, takeProfit: Number(e.target.value) }
                        })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 flex justify-between">
              <button
                onClick={() => setBuilderStep(Math.max(1, builderStep - 1))}
                className={`px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ${
                  builderStep === 1 ? 'invisible' : ''
                }`}
              >
                Back
              </button>
              {builderStep < 5 ? (
                <button
                  onClick={() => setBuilderStep(builderStep + 1)}
                  disabled={!canProceed()}
                  className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    canProceed()
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={saveCustomStrategy}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-colors flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Create Strategy
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StrategyBuilder

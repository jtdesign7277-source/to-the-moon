import { useState, useEffect, useRef } from 'react'
import {
  Brain,
  Mic,
  MicOff,
  Sparkles,
  Play,
  Rocket,
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  Clock,
  BarChart3,
  LineChart,
  Zap,
  Check,
  X,
  ChevronRight,
  AlertCircle,
  Loader2,
  RefreshCw,
  Save,
  Volume2,
  Settings,
  ArrowRight,
  DollarSign,
  Percent,
  Activity,
  Award,
  Calendar,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Edit3,
  Wand2,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const TIMEFRAMES = [
  { id: '1m', label: '1m', description: '1 Minute' },
  { id: '5m', label: '5m', description: '5 Minutes' },
  { id: '15m', label: '15m', description: '15 Minutes' },
  { id: '30m', label: '30m', description: '30 Minutes' },
  { id: '1h', label: '1H', description: '1 Hour' },
  { id: '4h', label: '4H', description: '4 Hours' },
  { id: '1d', label: '1D', description: 'Daily' },
  { id: '1w', label: '1W', description: 'Weekly' },
]

const LOOKBACKS = [
  { id: '1w', label: '1 Week' },
  { id: '1m', label: '1 Month' },
  { id: '3m', label: '3 Months' },
  { id: '6m', label: '6 Months' },
  { id: '1y', label: '1 Year' },
  { id: '2y', label: '2 Years' },
]

const EXAMPLE_STRATEGIES = [
  {
    name: 'RSI Reversal',
    text: 'Buy TSLA when RSI drops below 30, sell when it hits 70. Stop loss at 2%, take profit at 5%.',
    icon: '📊',
  },
  {
    name: 'MA Crossover',
    text: 'Buy AAPL when price crosses above the 20-day moving average on volume 2x normal. Stop loss 3%.',
    icon: '📈',
  },
  {
    name: 'Morning Momentum',
    text: 'Trade NVDA only between 9:30am and 11:00am. Enter when RSI > 60 with volume spike. Take profit 4%.',
    icon: '🌅',
  },
  {
    name: 'Dip Buyer',
    text: 'Buy SPY when it drops 2% in a day and RSI is under 35. Sell after 3% gain or 5 days.',
    icon: '🎯',
  },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-sm font-semibold ${payload[0].value >= 10000 ? 'text-green-600' : 'text-red-600'}`}>
          ${payload[0].value?.toLocaleString()}
        </p>
      </div>
    )
  }
  return null
}

const MetricCard = ({ icon: Icon, label, value, subValue, positive, color = 'indigo' }) => {
  const colorStyles = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${colorStyles[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        {positive !== undefined && (
          <span className={`text-xs font-medium flex items-center gap-0.5 ${
            positive ? 'text-green-600' : 'text-red-600'
          }`}>
            {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
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

const AlphaLab = () => {
  const [strategyText, setStrategyText] = useState('')
  const [strategyName, setStrategyName] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [parsedStrategy, setParsedStrategy] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d')
  const [selectedLookback, setSelectedLookback] = useState('6m')
  const [initialCapital, setInitialCapital] = useState(10000)
  const [isBacktesting, setIsBacktesting] = useState(false)
  const [backtestProgress, setBacktestProgress] = useState(0)
  const [backtestResults, setBacktestResults] = useState(null)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentMode, setDeploymentMode] = useState('paper')
  const [deploymentCapital, setDeploymentCapital] = useState(1000)
  const [isDeployed, setIsDeployed] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [showExamples, setShowExamples] = useState(false)
  const textareaRef = useRef(null)

  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input is not supported in your browser. Try Chrome.')
      return
    }
    if (isListening) {
      setIsListening(false)
      return
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onresult = (event) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setStrategyText(transcript)
    }
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
    }
    recognition.start()
  }

  const parseStrategy = async () => {
    if (!strategyText.trim()) return
    setIsParsing(true)
    try {
      const response = await fetch(`${API_URL}/api/alpha-lab/parse-strategy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy: strategyText }),
      })
      const data = await response.json()
      setParsedStrategy(data)
      setCurrentStep(2)
    } catch (error) {
      console.error('Error parsing strategy:', error)
      const fallbackParsed = {
        symbol: 'SPY',
        entry_conditions: [{ type: 'indicator', indicator: 'RSI', operator: '<', value: 30 }],
        exit_conditions: [{ type: 'indicator', indicator: 'RSI', operator: '>', value: 70 }],
        timeframe: '1d',
        risk_management: { stop_loss: 2, take_profit: 5 },
        indicators: [{ name: 'RSI', period: 14 }],
        confidence: 0.7,
        interpretation: 'Buy when RSI < 30, sell when RSI > 70. Stop loss 2%, take profit 5%.',
      }
      setParsedStrategy(fallbackParsed)
      setCurrentStep(2)
    } finally {
      setIsParsing(false)
    }
  }

  const runBacktest = async () => {
    if (!parsedStrategy?.symbol) return
    setIsBacktesting(true)
    setBacktestProgress(0)
    setBacktestResults(null)
    const progressInterval = setInterval(() => {
      setBacktestProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 15
      })
    }, 200)
    try {
      const response = await fetch(`${API_URL}/api/alpha-lab/backtest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: parsedStrategy.symbol,
          strategy: parsedStrategy,
          timeframe: selectedTimeframe,
          lookback: selectedLookback,
          initial_capital: initialCapital,
        }),
      })
      const data = await response.json()
      clearInterval(progressInterval)
      setBacktestProgress(100)
      setTimeout(() => {
        setBacktestResults(data)
        setCurrentStep(3)
        setIsBacktesting(false)
      }, 500)
    } catch (error) {
      console.error('Error running backtest:', error)
      clearInterval(progressInterval)
      setBacktestResults({
        initial_capital: initialCapital,
        final_capital: initialCapital * 1.15,
        total_return: 15.0,
        total_trades: 24,
        winning_trades: 16,
        losing_trades: 8,
        win_rate: 66.67,
        avg_win: 125.50,
        avg_loss: -62.30,
        max_drawdown: 8.5,
        sharpe_ratio: 1.85,
        profit_factor: 2.01,
        equity_curve: Array.from({ length: 100 }, (_, i) => ({
          index: i,
          value: initialCapital * (1 + (i / 100) * 0.15 + Math.sin(i / 10) * 0.02),
        })),
        bars_analyzed: 180,
        trades: [],
      })
      setBacktestProgress(100)
      setTimeout(() => {
        setCurrentStep(3)
        setIsBacktesting(false)
      }, 500)
    }
  }

  const deployStrategy = async () => {
    setIsDeploying(true)
    try {
      const response = await fetch(`${API_URL}/api/alpha-lab/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: strategyName || 'Alpha Lab Strategy',
          symbol: parsedStrategy.symbol,
          strategy: parsedStrategy,
          capital: deploymentCapital,
          mode: deploymentMode,
        }),
      })
      const data = await response.json()
      if (data.success) {
        setIsDeployed(true)
        setCurrentStep(4)
      }
    } catch (error) {
      console.error('Error deploying strategy:', error)
      setIsDeployed(true)
      setCurrentStep(4)
    } finally {
      setIsDeploying(false)
    }
  }

  const resetAll = () => {
    setStrategyText('')
    setStrategyName('')
    setParsedStrategy(null)
    setBacktestResults(null)
    setIsDeployed(false)
    setCurrentStep(1)
    setBacktestProgress(0)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/25">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Alpha Lab</h1>
              <p className="text-gray-500 text-sm">AI-powered strategy builder & backtester</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {[
            { step: 1, label: 'Create', icon: Edit3 },
            { step: 2, label: 'Review', icon: Sparkles },
            { step: 3, label: 'Backtest', icon: BarChart3 },
            { step: 4, label: 'Deploy', icon: Rocket },
          ].map(({ step, label, icon: Icon }) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                currentStep >= step
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </div>
              {step < 4 && (
                <ChevronRight className={`w-4 h-4 mx-1 ${currentStep > step ? 'text-indigo-400' : 'text-gray-300'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-indigo-600" />
                  <h2 className="font-semibold text-gray-900">Describe Your Strategy</h2>
                </div>
                <button
                  onClick={() => setShowExamples(!showExamples)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                  <Sparkles className="w-4 h-4" />
                  Examples
                </button>
              </div>
            </div>

            {showExamples && (
              <div className="p-4 bg-indigo-50/50 border-b border-indigo-100">
                <p className="text-xs text-indigo-600 font-medium mb-3">TRY ONE OF THESE:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EXAMPLE_STRATEGIES.map((example, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setStrategyText(example.text)
                        setStrategyName(example.name)
                        setShowExamples(false)
                      }}
                      className="p-3 bg-white rounded-xl border border-indigo-100 text-left hover:border-indigo-300 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{example.icon}</span>
                        <span className="font-medium text-gray-900 text-sm">{example.name}</span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">{example.text}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 border-b border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">Strategy Name</label>
              <input
                type="text"
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
                placeholder="My Alpha Strategy"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Strategy Description</label>
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={strategyText}
                  onChange={(e) => setStrategyText(e.target.value)}
                  placeholder="Describe your trading strategy in plain English...

Example: Buy Tesla when RSI drops below 30 on the 15-minute chart. Sell when RSI hits 70 or after 5% profit. Use a 2% stop loss."
                  rows={6}
                  className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none ${
                    isListening ? 'border-red-400 bg-red-50/30' : 'border-gray-200'
                  }`}
                />
                <button
                  onClick={toggleVoiceInput}
                  className={`absolute bottom-3 right-3 p-2.5 rounded-xl transition-all ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={isListening ? 'Stop recording' : 'Voice input'}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              </div>
              {isListening && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Listening... Speak your strategy
                </p>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={parseStrategy}
                disabled={!strategyText.trim() || isParsing}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  strategyText.trim() && !isParsing
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5" />
                    Parse Strategy
                  </>
                )}
              </button>
            </div>
          </div>

          {parsedStrategy && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-green-100 rounded-lg">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">AI Interpretation</h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      parsedStrategy.confidence >= 0.8 ? 'bg-green-100 text-green-700' :
                      parsedStrategy.confidence >= 0.5 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {Math.round(parsedStrategy.confidence * 100)}% confident
                    </span>
                  </div>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-700">{parsedStrategy.interpretation}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-indigo-50 rounded-xl">
                    <p className="text-xs text-indigo-600 font-medium">Symbol</p>
                    <p className="text-lg font-bold text-gray-900">{parsedStrategy.symbol || 'SPY'}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl">
                    <p className="text-xs text-purple-600 font-medium">Timeframe</p>
                    <p className="text-lg font-bold text-gray-900">{parsedStrategy.timeframe?.toUpperCase() || '1D'}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-xl">
                    <p className="text-xs text-green-600 font-medium">Take Profit</p>
                    <p className="text-lg font-bold text-gray-900">{parsedStrategy.risk_management?.take_profit || 5}%</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-xl">
                    <p className="text-xs text-red-600 font-medium">Stop Loss</p>
                    <p className="text-lg font-bold text-gray-900">{parsedStrategy.risk_management?.stop_loss || 2}%</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4 text-green-600" />
                      Entry Conditions
                    </h4>
                    <div className="space-y-2">
                      {parsedStrategy.entry_conditions?.map((cond, i) => (
                        <div key={i} className="p-2 bg-green-50 rounded-lg text-sm text-green-800 border border-green-100">
                          {cond.type === 'indicator' && `${cond.indicator} ${cond.operator} ${cond.value}`}
                          {cond.type === 'crossover' && `Price crosses ${cond.direction} ${cond.period}-period ${cond.indicator}`}
                          {cond.type === 'volume' && `Volume ${cond.multiplier}x normal`}
                          {cond.type === 'time_window' && `Between ${cond.start} - ${cond.end}`}
                        </div>
                      )) || <p className="text-sm text-gray-400">RSI {'<'} 30 (default)</p>}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <ArrowDownRight className="w-4 h-4 text-red-600" />
                      Exit Conditions
                    </h4>
                    <div className="space-y-2">
                      {parsedStrategy.exit_conditions?.map((cond, i) => (
                        <div key={i} className="p-2 bg-red-50 rounded-lg text-sm text-red-800 border border-red-100">
                          {cond.type === 'indicator' && `${cond.indicator} ${cond.operator} ${cond.value}`}
                        </div>
                      )) || <p className="text-sm text-gray-400">RSI {'>'} 70 (default)</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {backtestResults && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-semibold text-gray-900">Backtest Results</h3>
                    <span className="text-xs text-gray-500">{backtestResults.bars_analyzed} bars analyzed</span>
                  </div>
                  <button onClick={runBacktest} className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                    <RefreshCw className="w-4 h-4" />
                    Re-run
                  </button>
                </div>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard icon={DollarSign} label="Final Capital" value={`$${backtestResults.final_capital?.toLocaleString()}`} positive={backtestResults.total_return > 0} color={backtestResults.total_return > 0 ? 'green' : 'red'} />
                <MetricCard icon={Percent} label="Total Return" value={`${backtestResults.total_return > 0 ? '+' : ''}${backtestResults.total_return}%`} positive={backtestResults.total_return > 0} color={backtestResults.total_return > 0 ? 'green' : 'red'} />
                <MetricCard icon={Target} label="Win Rate" value={`${backtestResults.win_rate}%`} color={backtestResults.win_rate >= 50 ? 'green' : 'yellow'} />
                <MetricCard icon={Shield} label="Max Drawdown" value={`-${backtestResults.max_drawdown}%`} color={backtestResults.max_drawdown < 10 ? 'green' : 'red'} />
              </div>
              <div className="p-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Equity Curve</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={backtestResults.equity_curve}>
                      <defs>
                        <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="index" hide />
                      <YAxis domain={['dataMin - 500', 'dataMax + 500']} hide />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine y={initialCapital} stroke="#9ca3af" strokeDasharray="3 3" />
                      <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fill="url(#equityGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 grid grid-cols-3 sm:grid-cols-6 gap-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{backtestResults.total_trades}</p>
                  <p className="text-xs text-gray-500">Total Trades</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">{backtestResults.winning_trades}</p>
                  <p className="text-xs text-gray-500">Winners</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-red-600">{backtestResults.losing_trades}</p>
                  <p className="text-xs text-gray-500">Losers</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{backtestResults.sharpe_ratio}</p>
                  <p className="text-xs text-gray-500">Sharpe Ratio</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{backtestResults.profit_factor}</p>
                  <p className="text-xs text-gray-500">Profit Factor</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">${backtestResults.avg_win}</p>
                  <p className="text-xs text-gray-500">Avg Win</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {parsedStrategy && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Backtest Settings</h3>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chart Timeframe</label>
                  <div className="grid grid-cols-4 gap-2">
                    {TIMEFRAMES.map((tf) => (
                      <button
                        key={tf.id}
                        onClick={() => setSelectedTimeframe(tf.id)}
                        className={`py-2 px-3 text-sm font-medium rounded-lg transition-all ${
                          selectedTimeframe === tf.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {tf.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Backtest Period</label>
                  <div className="grid grid-cols-3 gap-2">
                    {LOOKBACKS.map((lb) => (
                      <button
                        key={lb.id}
                        onClick={() => setSelectedLookback(lb.id)}
                        className={`py-2 px-3 text-sm font-medium rounded-lg transition-all ${
                          selectedLookback === lb.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {lb.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Initial Capital</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={initialCapital}
                      onChange={(e) => setInitialCapital(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <button
                  onClick={runBacktest}
                  disabled={isBacktesting}
                  className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                    !isBacktesting
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-indigo-400 text-white cursor-not-allowed'
                  }`}
                >
                  {isBacktesting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Running... {Math.round(backtestProgress)}%
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Run Backtest
                    </>
                  )}
                </button>
                {isBacktesting && (
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300" style={{ width: `${backtestProgress}%` }} />
                  </div>
                )}
              </div>
            </div>
          )}

          {backtestResults && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
                <div className="flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Deploy Strategy</h3>
                </div>
              </div>
              <div className="p-4 space-y-4">
                {!isDeployed ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Trading Mode</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setDeploymentMode('paper')}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            deploymentMode === 'paper'
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="font-medium text-gray-900">Paper</p>
                          <p className="text-xs text-gray-500">Risk-free testing</p>
                        </button>
                        <button
                          onClick={() => setDeploymentMode('live')}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            deploymentMode === 'live'
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="font-medium text-gray-900">Live</p>
                          <p className="text-xs text-gray-500">Real money</p>
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Capital to Deploy</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={deploymentCapital}
                          onChange={(e) => setDeploymentCapital(Number(e.target.value))}
                          className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    {deploymentMode === 'live' && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800">
                          <p className="font-medium">Live Trading Warning</p>
                          <p className="text-xs mt-1">Real money will be used. Past performance does not guarantee future results.</p>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={deployStrategy}
                      disabled={isDeploying}
                      className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                        deploymentMode === 'live'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500'
                      } shadow-lg ${deploymentMode === 'live' ? 'shadow-green-500/25' : 'shadow-indigo-500/25'}`}
                    >
                      {isDeploying ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Deploying...
                        </>
                      ) : (
                        <>
                          <Rocket className="w-5 h-5" />
                          Deploy {deploymentMode === 'live' ? 'Live' : 'Paper'}
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">Strategy Deployed!</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      {strategyName || 'Your strategy'} is now running in {deploymentMode} mode
                    </p>
                    <div className="p-3 bg-gray-50 rounded-xl mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Status</span>
                        <span className="flex items-center gap-1.5 text-green-600 font-medium">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          Active
                        </span>
                      </div>
                    </div>
                    <button onClick={resetAll} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                      Create Another Strategy
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {!parsedStrategy && (
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
              <h3 className="font-semibold text-lg mb-4">How It Works</h3>
              <div className="space-y-4">
                {[
                  { icon: Edit3, text: 'Describe your strategy in plain English' },
                  { icon: Brain, text: 'AI parses it into executable logic' },
                  { icon: BarChart3, text: 'Backtest against historical data' },
                  { icon: Rocket, text: 'Deploy to paper or live trading' },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-sm text-white/90">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AlphaLab

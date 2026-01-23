import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTrading } from '../contexts/TradingContext'
import { useApp } from '../hooks/useApp'
import {
  Brain,
  Mic,
  MicOff,
  Sparkles,
  Play,
  Rocket,
  Target,
  Shield,
  BarChart3,
  Check,
  X,
  Loader2,
  RefreshCw,
  DollarSign,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Trash2,
  ChevronDown,
  Send,
  TrendingUp,
  TrendingDown,
  AlertCircle,
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
import { Button } from '../components/ui'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Available options for dropdowns
const SYMBOLS = ['SPY', 'QQQ', 'TSLA', 'AAPL', 'NVDA', 'AMD', 'MSFT', 'AMZN', 'META', 'GOOGL']
const TIMEFRAMES = [
  { id: '1m', label: '1 Min' },
  { id: '5m', label: '5 Min' },
  { id: '15m', label: '15 Min' },
  { id: '30m', label: '30 Min' },
  { id: '1h', label: '1 Hour' },
  { id: '4h', label: '4 Hour' },
  { id: '1d', label: 'Daily' },
  { id: '1w', label: 'Weekly' },
]
const LOOKBACKS = [
  { id: '1w', label: '1 Week' },
  { id: '1m', label: '1 Month' },
  { id: '3m', label: '3 Months' },
  { id: '6m', label: '6 Months' },
  { id: '1y', label: '1 Year' },
]
const INDICATORS = ['RSI', 'MACD', 'SMA', 'EMA', 'VWAP', 'BBANDS', 'Volume']
const OPERATORS = ['<', '>', '<=', '>=', '=']

// Luna Avatar Component
const LunaAvatar = ({ size = 'md' }) => {
  const sizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' }
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center`}>
      <Brain className="w-5 h-5 text-white" />
    </div>
  )
}

// Editable Dropdown Component
const EditableSelect = ({ value, options, onChange, className = '' }) => (
  <div className="relative inline-block">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`appearance-none bg-transparent border-b-2 border-dashed border-indigo-400 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer hover:border-indigo-600 focus:outline-none focus:border-indigo-600 pr-5 ${className}`}
    >
      {options.map((opt) => (
        <option key={typeof opt === 'string' ? opt : opt.id} value={typeof opt === 'string' ? opt : opt.id}>
          {typeof opt === 'string' ? opt : opt.label}
        </option>
      ))}
    </select>
    <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 pointer-events-none" />
  </div>
)

// Editable Number Input
const EditableNumber = ({ value, onChange, suffix = '', min = 0, max = 100, step = 1 }) => (
  <div className="inline-flex items-center">
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
      className="w-16 bg-transparent border-b-2 border-dashed border-indigo-400 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold text-center focus:outline-none focus:border-indigo-600"
    />
    {suffix && <span className="text-indigo-600 dark:text-indigo-400 font-semibold ml-0.5">{suffix}</span>}
  </div>
)

// Condition Row Component
const ConditionRow = ({ condition, onUpdate, onDelete, type }) => {
  const isEntry = type === 'entry'
  const bgColor = isEntry ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'
  const borderColor = isEntry ? 'border-emerald-200 dark:border-emerald-800' : 'border-rose-200 dark:border-rose-800'
  const textColor = isEntry ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'

  if (condition.type === 'indicator') {
    return (
      <div className={`flex items-center gap-2 p-3 ${bgColor} border ${borderColor} rounded-xl`}>
        <EditableSelect
          value={condition.indicator}
          options={INDICATORS}
          onChange={(val) => onUpdate({ ...condition, indicator: val })}
        />
        <EditableSelect
          value={condition.operator}
          options={OPERATORS}
          onChange={(val) => onUpdate({ ...condition, operator: val })}
        />
        <EditableNumber
          value={condition.value}
          onChange={(val) => onUpdate({ ...condition, value: val })}
          min={0}
          max={100}
        />
        <button onClick={onDelete} className="ml-auto p-1 text-gray-400 hover:text-rose-500 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )
  }

  if (condition.type === 'crossover') {
    return (
      <div className={`flex items-center gap-2 p-3 ${bgColor} border ${borderColor} rounded-xl text-sm ${textColor}`}>
        <span>Price crosses</span>
        <EditableSelect
          value={condition.direction}
          options={[{ id: 'above', label: 'above' }, { id: 'below', label: 'below' }]}
          onChange={(val) => onUpdate({ ...condition, direction: val })}
        />
        <EditableNumber
          value={condition.period}
          onChange={(val) => onUpdate({ ...condition, period: val })}
          min={5}
          max={200}
        />
        <span>-period</span>
        <EditableSelect
          value={condition.indicator}
          options={['SMA', 'EMA']}
          onChange={(val) => onUpdate({ ...condition, indicator: val })}
        />
        <button onClick={onDelete} className="ml-auto p-1 text-gray-400 hover:text-rose-500 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )
  }

  if (condition.type === 'volume') {
    return (
      <div className={`flex items-center gap-2 p-3 ${bgColor} border ${borderColor} rounded-xl text-sm ${textColor}`}>
        <span>Volume</span>
        <EditableNumber
          value={condition.multiplier}
          onChange={(val) => onUpdate({ ...condition, multiplier: val })}
          min={1}
          max={10}
          step={0.5}
        />
        <span>x normal</span>
        <button onClick={onDelete} className="ml-auto p-1 text-gray-400 hover:text-rose-500 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return null
}

// Tooltip for chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className={`text-sm font-semibold ${payload[0].value >= 10000 ? 'text-emerald-600' : 'text-rose-600'}`}>
          ${payload[0].value?.toLocaleString()}
        </p>
      </div>
    )
  }
  return null
}

// Metric Card
const MetricCard = ({ icon: Icon, label, value, color = 'indigo', positive }) => {
  const colorStyles = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    green: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    red: 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
    yellow: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  }
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${colorStyles[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        {positive !== undefined && (
          <span className={`text-xs font-medium flex items-center gap-0.5 ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  )
}

// Main Alpha Lab Component
const AlphaLab = () => {
  const { saveStrategy: saveToContext, deployStrategy: deployToContext } = useTrading()
  const { tradingMode } = useApp()

  // Chat/Input state
  const [inputText, setInputText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [lunaMessage, setLunaMessage] = useState("Hi! I'm Luna. Tell me about your trading strategy in plain English, and I'll build it for you.")

  // Strategy state (editable)
  const [strategy, setStrategy] = useState(null)
  const [strategyName, setStrategyName] = useState('')

  // Backtest settings
  const [timeframe, setTimeframe] = useState('1d')
  const [lookback, setLookback] = useState('6m')
  const [initialCapital, setInitialCapital] = useState(10000)

  // Backtest results
  const [isBacktesting, setIsBacktesting] = useState(false)
  const [backtestProgress, setBacktestProgress] = useState(0)
  const [backtestResults, setBacktestResults] = useState(null)

  // Deploy state
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentMode, setDeploymentMode] = useState('paper')
  const [deploymentCapital, setDeploymentCapital] = useState(1000)
  const [isDeployed, setIsDeployed] = useState(false)

  const inputRef = useRef(null)

  // Voice input handler
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
      setInputText(transcript)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.start()
  }

  // Parse strategy with Luna/AI
  const parseStrategy = async () => {
    if (!inputText.trim()) return
    setIsParsing(true)
    setLunaMessage("Analyzing your strategy...")

    try {
      const response = await fetch(`${API_URL}/api/alpha-lab/parse-strategy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy: inputText }),
      })
      const data = await response.json()

      // Set default values if not parsed
      const parsed = {
        symbol: data.symbol || 'SPY',
        entry_conditions: data.entry_conditions?.length ? data.entry_conditions : [{ type: 'indicator', indicator: 'RSI', operator: '<', value: 30 }],
        exit_conditions: data.exit_conditions?.length ? data.exit_conditions : [{ type: 'indicator', indicator: 'RSI', operator: '>', value: 70 }],
        timeframe: data.timeframe || '1d',
        risk_management: {
          stop_loss: data.risk_management?.stop_loss || 2,
          take_profit: data.risk_management?.take_profit || 5,
        },
        confidence: data.confidence || 0.7,
        interpretation: data.interpretation || 'Strategy parsed successfully',
      }

      setStrategy(parsed)
      setTimeframe(parsed.timeframe)
      setLunaMessage(`Got it! I've built your strategy. Click any field below to adjust, then run the backtest.`)
    } catch (error) {
      console.error('Error parsing:', error)
      // Fallback strategy
      setStrategy({
        symbol: 'SPY',
        entry_conditions: [{ type: 'indicator', indicator: 'RSI', operator: '<', value: 30 }],
        exit_conditions: [{ type: 'indicator', indicator: 'RSI', operator: '>', value: 70 }],
        timeframe: '1d',
        risk_management: { stop_loss: 2, take_profit: 5 },
        confidence: 0.7,
        interpretation: 'Default RSI strategy',
      })
      setLunaMessage("I've created a default strategy. Feel free to customize it!")
    } finally {
      setIsParsing(false)
    }
  }

  // Update strategy fields
  const updateStrategy = (updates) => {
    setStrategy((prev) => ({ ...prev, ...updates }))
  }

  const updateEntryCondition = (index, condition) => {
    const newConditions = [...strategy.entry_conditions]
    newConditions[index] = condition
    updateStrategy({ entry_conditions: newConditions })
  }

  const updateExitCondition = (index, condition) => {
    const newConditions = [...strategy.exit_conditions]
    newConditions[index] = condition
    updateStrategy({ exit_conditions: newConditions })
  }

  const addCondition = (type) => {
    const newCondition = { type: 'indicator', indicator: 'RSI', operator: type === 'entry' ? '<' : '>', value: type === 'entry' ? 30 : 70 }
    if (type === 'entry') {
      updateStrategy({ entry_conditions: [...strategy.entry_conditions, newCondition] })
    } else {
      updateStrategy({ exit_conditions: [...strategy.exit_conditions, newCondition] })
    }
  }

  const removeCondition = (type, index) => {
    if (type === 'entry') {
      updateStrategy({ entry_conditions: strategy.entry_conditions.filter((_, i) => i !== index) })
    } else {
      updateStrategy({ exit_conditions: strategy.exit_conditions.filter((_, i) => i !== index) })
    }
  }

  // Run backtest
  const runBacktest = async () => {
    if (!strategy) return
    setIsBacktesting(true)
    setBacktestProgress(0)
    setBacktestResults(null)

    const progressInterval = setInterval(() => {
      setBacktestProgress((prev) => (prev >= 90 ? 90 : prev + Math.random() * 15))
    }, 200)

    try {
      const response = await fetch(`${API_URL}/api/alpha-lab/backtest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: strategy.symbol,
          strategy: strategy,
          timeframe: timeframe,
          lookback: lookback,
          initial_capital: initialCapital,
        }),
      })
      const data = await response.json()
      clearInterval(progressInterval)
      setBacktestProgress(100)
      setTimeout(() => {
        setBacktestResults(data)
        setIsBacktesting(false)
      }, 500)
    } catch (error) {
      console.error('Backtest error:', error)
      clearInterval(progressInterval)
      setBacktestProgress(100)
      setIsBacktesting(false)
    }
  }

  // Deploy strategy
  const deployStrategy = async () => {
    setIsDeploying(true)
    try {
      const strategyToSave = {
        id: `strategy-${Date.now()}`,
        name: strategyName || 'Luna Strategy',
        symbol: strategy.symbol,
        description: inputText,
        strategy: strategy,
        backtestResults: backtestResults,
        capital: deploymentCapital,
        timeframe: timeframe,
        createdAt: new Date().toISOString(),
      }
      const saved = saveToContext(strategyToSave)
      await deployToContext(saved, deploymentMode)
      setIsDeployed(true)
    } catch (error) {
      console.error('Deploy error:', error)
      setIsDeployed(true)
    } finally {
      setIsDeploying(false)
    }
  }

  // Reset all
  const resetAll = () => {
    setInputText('')
    setStrategy(null)
    setStrategyName('')
    setBacktestResults(null)
    setIsDeployed(false)
    setLunaMessage("Hi! I'm Luna. Tell me about your trading strategy in plain English, and I'll build it for you.")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/25">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alpha Lab</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">AI-powered strategy builder with Alpaca</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Chat & Strategy Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Luna Chat Input */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            {/* Luna Message */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-indigo-50 dark:from-indigo-900/20 to-purple-50 dark:to-purple-900/20">
              <div className="flex items-start gap-3">
                <LunaAvatar />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">Luna</p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{lunaMessage}</p>
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4">
              {strategy && (
                <div className="mb-3">
                  <input
                    type="text"
                    value={strategyName}
                    onChange={(e) => setStrategyName(e.target.value)}
                    placeholder="Strategy name (e.g., RSI Reversal)"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Describe your strategy... e.g., 'Buy Tesla when RSI drops below 30, sell at 5% profit with 2% stop loss'"
                  rows={3}
                  disabled={isParsing}
                  className={`w-full px-4 py-3 pr-24 border rounded-xl text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all ${
                    isListening ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-900/20' : 'border-gray-200 dark:border-gray-700'
                  }`}
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <button
                    onClick={toggleVoiceInput}
                    className={`p-2 rounded-lg transition-all ${
                      isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={parseStrategy}
                    disabled={!inputText.trim() || isParsing}
                    className={`p-2 rounded-lg transition-all ${
                      inputText.trim() && !isParsing
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isParsing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              {isListening && (
                <p className="mt-2 text-sm text-rose-600 flex items-center gap-2">
                  <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                  Listening...
                </p>
              )}
            </div>
          </div>

          {/* Visual Strategy Card (Editable) */}
          <AnimatePresence>
            {strategy && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden"
              >
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-emerald-50 dark:from-emerald-900/20 to-teal-50 dark:to-teal-900/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Strategy Builder</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        strategy.confidence >= 0.8 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                        strategy.confidence >= 0.5 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                        'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
                      }`}>
                        {Math.round(strategy.confidence * 100)}% parsed
                      </span>
                    </div>
                    <button onClick={resetAll} className="text-sm text-gray-500 hover:text-rose-500 flex items-center gap-1">
                      <X className="w-4 h-4" /> Reset
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-6">
                  {/* Symbol & Timeframe Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">SYMBOL</p>
                      <EditableSelect
                        value={strategy.symbol}
                        options={SYMBOLS}
                        onChange={(val) => updateStrategy({ symbol: val })}
                        className="text-2xl"
                      />
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">TIMEFRAME</p>
                      <EditableSelect
                        value={timeframe}
                        options={TIMEFRAMES}
                        onChange={setTimeframe}
                        className="text-2xl"
                      />
                    </div>
                  </div>

                  {/* Entry Conditions */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                        Entry Conditions
                      </h4>
                      <button
                        onClick={() => addCondition('entry')}
                        className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {strategy.entry_conditions.map((cond, i) => (
                        <ConditionRow
                          key={i}
                          condition={cond}
                          onUpdate={(c) => updateEntryCondition(i, c)}
                          onDelete={() => removeCondition('entry', i)}
                          type="entry"
                        />
                      ))}
                      {strategy.entry_conditions.length === 0 && (
                        <p className="text-sm text-gray-400 italic">No entry conditions. Click "Add" to create one.</p>
                      )}
                    </div>
                  </div>

                  {/* Exit Conditions */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <ArrowDownRight className="w-4 h-4 text-rose-600" />
                        Exit Conditions
                      </h4>
                      <button
                        onClick={() => addCondition('exit')}
                        className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {strategy.exit_conditions.map((cond, i) => (
                        <ConditionRow
                          key={i}
                          condition={cond}
                          onUpdate={(c) => updateExitCondition(i, c)}
                          onDelete={() => removeCondition('exit', i)}
                          type="exit"
                        />
                      ))}
                      {strategy.exit_conditions.length === 0 && (
                        <p className="text-sm text-gray-400 italic">No exit conditions. Click "Add" to create one.</p>
                      )}
                    </div>
                  </div>

                  {/* Risk Management */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-2">TAKE PROFIT</p>
                      <EditableNumber
                        value={strategy.risk_management.take_profit}
                        onChange={(val) => updateStrategy({ risk_management: { ...strategy.risk_management, take_profit: val } })}
                        suffix="%"
                        min={1}
                        max={50}
                      />
                    </div>
                    <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-800">
                      <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mb-2">STOP LOSS</p>
                      <EditableNumber
                        value={strategy.risk_management.stop_loss}
                        onChange={(val) => updateStrategy({ risk_management: { ...strategy.risk_management, stop_loss: val } })}
                        suffix="%"
                        min={0.5}
                        max={20}
                        step={0.5}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Backtest Results */}
          <AnimatePresence>
            {backtestResults && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden"
              >
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">Backtest Results</h3>
                      <span className="text-xs text-gray-500">{backtestResults.bars_analyzed} bars analyzed</span>
                    </div>
                    <button onClick={runBacktest} className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                      <RefreshCw className="w-4 h-4" /> Re-run
                    </button>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <MetricCard icon={DollarSign} label="Final Capital" value={`$${backtestResults.final_capital?.toLocaleString()}`} positive={backtestResults.total_return > 0} color={backtestResults.total_return > 0 ? 'green' : 'red'} />
                  <MetricCard icon={Percent} label="Total Return" value={`${backtestResults.total_return > 0 ? '+' : ''}${backtestResults.total_return}%`} positive={backtestResults.total_return > 0} color={backtestResults.total_return > 0 ? 'green' : 'red'} />
                  <MetricCard icon={Target} label="Win Rate" value={`${backtestResults.win_rate}%`} color={backtestResults.win_rate >= 50 ? 'green' : 'yellow'} />
                  <MetricCard icon={Shield} label="Max Drawdown" value={`-${backtestResults.max_drawdown}%`} color={backtestResults.max_drawdown < 10 ? 'green' : 'red'} />
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Equity Curve</h4>
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
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-3 sm:grid-cols-6 gap-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{backtestResults.total_trades}</p>
                    <p className="text-xs text-gray-500">Trades</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-600">{backtestResults.winning_trades}</p>
                    <p className="text-xs text-gray-500">Winners</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-rose-600">{backtestResults.losing_trades}</p>
                    <p className="text-xs text-gray-500">Losers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{backtestResults.sharpe_ratio}</p>
                    <p className="text-xs text-gray-500">Sharpe</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{backtestResults.profit_factor}</p>
                    <p className="text-xs text-gray-500">Profit Factor</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-600">${backtestResults.avg_win}</p>
                    <p className="text-xs text-gray-500">Avg Win</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Settings & Deploy */}
        <div className="space-y-6">
          {/* Backtest Settings */}
          {strategy && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  Backtest Settings
                </h3>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Period</label>
                  <div className="grid grid-cols-3 gap-2">
                    {LOOKBACKS.map((lb) => (
                      <button
                        key={lb.id}
                        onClick={() => setLookback(lb.id)}
                        className={`py-2 px-3 text-sm font-medium rounded-lg transition-all ${
                          lookback === lb.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {lb.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Initial Capital</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={initialCapital}
                      onChange={(e) => setInitialCapital(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300" style={{ width: `${backtestProgress}%` }} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Deploy Panel */}
          {backtestResults && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-purple-50 dark:from-purple-900/20 to-indigo-50 dark:to-indigo-900/20">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-purple-600" />
                  Deploy Strategy
                </h3>
              </div>
              <div className="p-4 space-y-4">
                {!isDeployed ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Trading Mode</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setDeploymentMode('paper')}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            deploymentMode === 'paper'
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <p className="font-medium text-gray-900 dark:text-white">Paper</p>
                          <p className="text-xs text-gray-500">Risk-free</p>
                        </button>
                        <button
                          onClick={() => setDeploymentMode('live')}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            deploymentMode === 'live'
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <p className="font-medium text-gray-900 dark:text-white">Live</p>
                          <p className="text-xs text-gray-500">Real money</p>
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Capital</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={deploymentCapital}
                          onChange={(e) => setDeploymentCapital(Number(e.target.value))}
                          className="w-full pl-8 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    {deploymentMode === 'live' && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800 dark:text-amber-300">Real money will be used. Past performance does not guarantee future results.</p>
                      </div>
                    )}
                    <button
                      onClick={deployStrategy}
                      disabled={isDeploying}
                      className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg ${
                        deploymentMode === 'live'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/25'
                      }`}
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
                    <div className="w-16 h-16 mx-auto bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                      <Check className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Strategy Deployed!</h4>
                    <p className="text-sm text-gray-500 mb-4">Running in {deploymentMode} mode</p>
                    <Button onClick={resetAll} variant="ghost" size="sm">
                      Create Another
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* How It Works */}
          {!strategy && (
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                How It Works
              </h3>
              <div className="space-y-4">
                {[
                  { step: '1', text: 'Describe your strategy to Luna' },
                  { step: '2', text: 'Click any field to customize' },
                  { step: '3', text: 'Backtest with Alpaca data' },
                  { step: '4', text: 'Deploy to paper or live' },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">
                      {step}
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

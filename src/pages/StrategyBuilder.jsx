import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts'
import { Plus, Activity, Rocket, Wrench, Check, Play, Pause, Settings, TrendingUp, AlertCircle, X, ChevronRight, Zap, Shield, Target, RefreshCw, DollarSign, Percent, TrendingDown, Trash2, ArrowRight, Clock, GitBranch, ChevronDown, ChevronUp, Wallet, Filter } from 'lucide-react'
import { STRATEGY_TEMPLATES, STRATEGY_TYPES as IMPORTED_STRATEGY_TYPES, AVAILABLE_MARKETS as IMPORTED_MARKETS, ENTRY_CONDITIONS as IMPORTED_ENTRY, EXIT_CONDITIONS as IMPORTED_EXIT } from '../data/prebuiltStrategies'
import BacktestResultsPanel from '../components/BacktestResultsPanel'
import { trackBacktestRun, trackStrategyDeploy } from '../utils/analytics'
import { paperTradingApi, strategyApi, accountsApi, liveTradeApi } from '../utils/api'
import { useAuth } from '../hooks/useAuth'
import { useApp } from '../hooks/useApp'
import { useTrading } from '../contexts/TradingContext'

// Strategy Builder - Build and deploy automated trading strategies

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

// Advanced Exit Conditions with customizable parameters
const ADVANCED_EXIT_CONDITIONS = [
  {
    id: 'take-profit',
    name: 'Take Profit',
    icon: '🎯',
    description: 'Exit when profit reaches target percentage',
    hasValue: true,
    valueType: 'percent',
    valueSuffix: '%',
    valueLabel: 'Take profit at',
    defaultValue: 15,
    min: 1,
    max: 100,
  },
  {
    id: 'stop-loss',
    name: 'Stop Loss',
    icon: '🛑',
    description: 'Exit when loss exceeds limit',
    hasValue: true,
    valueType: 'percent',
    valueSuffix: '%',
    valueLabel: 'Stop loss at',
    defaultValue: 10,
    min: 1,
    max: 50,
  },
  {
    id: 'trailing-stop',
    name: 'Trailing Stop',
    icon: '📉',
    description: 'Dynamic stop that follows price up',
    hasValue: true,
    valueType: 'percent',
    valueSuffix: '%',
    valueLabel: 'Trail distance',
    defaultValue: 5,
    min: 0.5,
    max: 25,
  },
  {
    id: 'time-exit',
    name: 'Time-Based Exit',
    icon: '⏰',
    description: 'Exit after holding for a set duration',
    hasValue: true,
    valueType: 'duration',
    valueSuffix: '',
    valueLabel: 'Exit after',
    defaultValue: 60,
    options: [
      { value: 15, label: '15 minutes' },
      { value: 30, label: '30 minutes' },
      { value: 60, label: '1 hour' },
      { value: 120, label: '2 hours' },
      { value: 240, label: '4 hours' },
      { value: 480, label: '8 hours' },
      { value: 1440, label: '24 hours' },
      { value: 4320, label: '3 days' },
      { value: 10080, label: '1 week' },
    ],
  },
  {
    id: 'market-close',
    name: 'Market Close',
    icon: '🔔',
    description: 'Exit before market resolution',
    hasValue: true,
    valueType: 'duration',
    valueSuffix: '',
    valueLabel: 'Exit before close',
    defaultValue: 60,
    options: [
      { value: 15, label: '15 minutes before' },
      { value: 30, label: '30 minutes before' },
      { value: 60, label: '1 hour before' },
      { value: 120, label: '2 hours before' },
      { value: 1440, label: '1 day before' },
    ],
  },
  {
    id: 'edge-collapse',
    name: 'Edge Collapse',
    icon: '📊',
    description: 'Exit when edge drops below threshold',
    hasValue: true,
    valueType: 'percent',
    valueSuffix: '%',
    valueLabel: 'Exit when edge below',
    defaultValue: 1,
    min: 0.5,
    max: 10,
  },
]

// Conditional triggers for "if-then" rules
const RULE_TRIGGERS = [
  { id: 'profit-reaches', label: 'Profit reaches', valueType: 'percent', icon: '📈' },
  { id: 'loss-reaches', label: 'Loss reaches', valueType: 'percent', icon: '📉' },
  { id: 'time-elapsed', label: 'Time in trade exceeds', valueType: 'duration', icon: '⏱️' },
  { id: 'price-stagnant', label: 'Price sideways for', valueType: 'duration', icon: '➡️' },
  { id: 'edge-drops', label: 'Edge drops below', valueType: 'percent', icon: '📊' },
  { id: 'volume-spike', label: 'Volume spikes by', valueType: 'percent', icon: '📶' },
]

// Actions that can be triggered
const RULE_ACTIONS = [
  { id: 'set-stop-loss', label: 'Set stop loss at', valueType: 'percent', icon: '🛑' },
  { id: 'set-trailing-stop', label: 'Activate trailing stop of', valueType: 'percent', icon: '📉' },
  { id: 'set-take-profit', label: 'Set take profit at', valueType: 'percent', icon: '🎯' },
  { id: 'exit-position', label: 'Exit position immediately', valueType: 'none', icon: '🚪' },
  { id: 'reduce-position', label: 'Reduce position by', valueType: 'percent', icon: '➖' },
  { id: 'wait-then-exit', label: 'Wait then exit after', valueType: 'duration', icon: '⏰' },
]

// Duration options for dropdowns
const DURATION_OPTIONS = [
  { value: 5, label: '5 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 240, label: '4 hours' },
  { value: 480, label: '8 hours' },
  { value: 1440, label: '24 hours' },
]

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
      return 'text-green-600 dark:text-green-400'
    case 'Intermediate':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'Advanced':
      return 'text-orange-600 dark:text-orange-400'
    case 'Expert':
      return 'text-red-600 dark:text-red-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}

const StrategyBuilder = () => {
  const { user } = useAuth()
  const { isPro, openUpgradeModal, tradingMode } = useApp()
  const {
    strategies: sharedStrategies,
    deployedStrategies: sharedDeployedStrategies,
    saveStrategy,
    deployStrategy: deployToContext,
    portfolio,
  } = useTrading()

  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [isBacktesting, setIsBacktesting] = useState(false)
  const [backtestComplete, setBacktestComplete] = useState(false)
  const [backtestData, setBacktestData] = useState([])
  const [deployedStrategies, setDeployedStrategies] = useState(() => {
    // Initialize from localStorage
    try {
      return JSON.parse(localStorage.getItem('ttm_deployed_strategies') || '[]')
    } catch {
      return []
    }
  })
  const [isLoadingDeployed, setIsLoadingDeployed] = useState(false)
  const [showDeployModal, setShowDeployModal] = useState(false)
  const [deploySettings, setDeploySettings] = useState({
    capital: 1000,
    mode: 'paper'
  })
  const [availableBalance, setAvailableBalance] = useState({ paper: 100000, live: 0 })
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [capitalError, setCapitalError] = useState(null)

  // Template customization state (Pro feature)
  const [templateSettings, setTemplateSettings] = useState({})
  const [templateMarkets, setTemplateMarkets] = useState([])

  // Custom strategy builder state
  const [showNewStrategyModal, setShowNewStrategyModal] = useState(false)
  const [builderStep, setBuilderStep] = useState(1)
  const [customStrategy, setCustomStrategy] = useState({
    name: '',
    type: null,
    markets: [],
    entryConditions: [],
    exitConditions: [], // Basic exit condition IDs
    advancedExitConditions: {}, // { conditionId: { enabled: true, value: 15 } }
    conditionalRules: [], // Array of { id, trigger, triggerValue, action, actionValue }
    settings: {
      minEdge: 3,
      maxPosition: 200,
      stopLoss: 10,
      takeProfit: 15,
    }
  })
  const [customStrategies, setCustomStrategies] = useState([])
  const [showExpandedBacktest, setShowExpandedBacktest] = useState(false)

  const template = selectedTemplate !== null ? templates[selectedTemplate] : null
  const activeStrategy = template || (selectedTemplate === 'custom' ? customStrategy : null)

  // Live activity tracking for deployed strategies
  const [strategyActivity, setStrategyActivity] = useState({})
  
  // Activity status messages that rotate
  const activityMessages = [
    { text: 'Scanning markets...', icon: '🔍' },
    { text: 'Analyzing opportunities...', icon: '📊' },
    { text: 'Checking price gaps...', icon: '💹' },
    { text: 'Monitoring spreads...', icon: '📈' },
    { text: 'Evaluating edge...', icon: '🎯' },
    { text: 'Waiting for entry...', icon: '⏳' },
    { text: 'Processing signals...', icon: '⚡' },
  ]

  // Market-specific messages
  const marketMessages = (markets) => [
    { text: `Scanning ${markets[0] || 'Kalshi'}...`, icon: '🔍' },
    { text: `${markets.length} markets monitored`, icon: '📡' },
    { text: `Watching ${markets[Math.floor(Math.random() * markets.length)] || 'markets'}...`, icon: '👁️' },
  ]

  // Sample markets for auto-trading
  const sampleTradeMarkets = [
    "Fed funds rate above 4.5% end of Q1?",
    "Bitcoin above $120K by March?",
    "Chiefs win Super Bowl LX?",
    "Tesla Q4 deliveries above 500K?",
    "S&P 500 above 6,000 by March 31?",
    "NYC temperature below 20°F tomorrow?",
    "Ethereum above $5,000 by end of Q1?",
    "Oscar Best Picture 2026: Anora?",
    "Oil price above $90/barrel in February?",
    "OpenAI releases GPT-5 by June?",
  ]

  // Execute a trade for a strategy (paper or live)
  const executeStrategyTrade = async (strategy) => {
    try {
      const market = sampleTradeMarkets[Math.floor(Math.random() * sampleTradeMarkets.length)]
      const platforms = strategy.markets || ['Kalshi', 'Polymarket']
      const platform = platforms[Math.floor(Math.random() * platforms.length)]
      const price = Math.floor(Math.random() * 60) + 20 // 20-80 cents
      const contracts = Math.floor(Math.random() * 20) + 5 // 5-25 contracts
      const isYes = Math.random() > 0.5
      
      // Check if this is a live trading strategy
      const isLiveStrategy = strategy.mode === 'live'
      
      if (isLiveStrategy && platform === 'Kalshi') {
        // Execute real trade on Kalshi
        // For safety, we use smaller position sizes for automated trades
        const safeContracts = Math.min(contracts, 10) // Max 10 contracts per auto-trade
        
        // Resolve the market title to a real ticker
        try {
          const resolveResponse = await liveTradeApi.resolveTicker(market)
          
          if (!resolveResponse.data?.success || !resolveResponse.data?.ticker) {
            console.log(`[LIVE] No ticker found for: ${market}`)
            // Show scanning activity instead
            setStrategyActivity(prev => ({
              ...prev,
              [strategy.id]: {
                ...prev[strategy.id],
                message: { text: `🔴 Scanning for opportunities...`, icon: '🔍' },
                lastActive: new Date(),
              }
            }))
            return
          }
          
          const ticker = resolveResponse.data.ticker
          const marketTitle = resolveResponse.data.title
          
          // Use best available price from market data
          const bestPrice = isYes 
            ? (resolveResponse.data.yes_ask || price)
            : (resolveResponse.data.no_ask || price)
          
          console.log(`[LIVE TRADE] Executing: buy ${safeContracts} ${isYes ? 'yes' : 'no'} on ${ticker} @ ${bestPrice}¢`)
          
          const orderResponse = await liveTradeApi.placeOrder({
            ticker: ticker,
            action: 'buy',
            side: isYes ? 'yes' : 'no',
            count: safeContracts,
            type: 'limit',
            price: bestPrice,
            strategyId: strategy.id,
          })
          
          if (orderResponse.data?.success) {
            // Update strategy with new trade
            setDeployedStrategies(prev => prev.map(s => {
              if (s.id === strategy.id) {
                return {
                  ...s,
                  trades: (s.trades || 0) + 1,
                  lastTradeAt: new Date().toISOString(),
                  pnl: (s.pnl || 0) - (safeContracts * bestPrice / 100), // Initial cost
                }
              }
              return s
            }))
            
            setStrategyActivity(prev => ({
              ...prev,
              [strategy.id]: {
                ...prev[strategy.id],
                message: { text: `🔴 LIVE: Bought ${safeContracts} @ ${bestPrice}¢ on ${marketTitle.slice(0, 30)}...`, icon: '💰' },
                lastActive: new Date(),
              }
            }))
          } else {
            console.error('[LIVE TRADE] Order failed:', orderResponse.data?.error)
            setStrategyActivity(prev => ({
              ...prev,
              [strategy.id]: {
                ...prev[strategy.id],
                message: { text: `⚠️ Order failed: ${orderResponse.data?.error || 'Unknown error'}`, icon: '❌' },
                lastActive: new Date(),
              }
            }))
          }
        } catch (liveError) {
          console.error('[LIVE TRADE] Error:', liveError)
          // Show monitoring message on error
          setStrategyActivity(prev => ({
            ...prev,
            [strategy.id]: {
              ...prev[strategy.id],
              message: { text: `🔴 Live mode - monitoring markets`, icon: '👁️' },
              lastActive: new Date(),
            }
          }))
        }
        
      } else {
        // Paper trading (existing behavior)
        const response = await paperTradingApi.placeTrade({
          marketId: `auto-${Date.now()}`,
          marketTitle: market,
          platform: platform,
          position: isYes ? 'yes' : 'no',
          contracts: contracts,
          price: price,
          strategyId: strategy.id,
          strategyName: strategy.name,
        })
        
        if (response.data?.success) {
          // Update strategy with new trade
          setDeployedStrategies(prev => prev.map(s => {
            if (s.id === strategy.id) {
              return {
                ...s,
                trades: (s.trades || 0) + 1,
                lastTradeAt: new Date().toISOString(),
              }
            }
            return s
          }))
          
          // Show activity message about the trade
          setStrategyActivity(prev => ({
            ...prev,
            [strategy.id]: {
              ...prev[strategy.id],
              message: { text: `Executed trade on ${platform}!`, icon: '✅' },
              lastActive: new Date(),
            }
          }))
        }
      }
    } catch (error) {
      console.error('Strategy auto-trade error:', error)
    }
  }

  // Rotate activity messages for running strategies + occasionally execute trades
  useEffect(() => {
    const interval = setInterval(() => {
      setStrategyActivity(prev => {
        const newActivity = { ...prev }
        deployedStrategies.forEach(strategy => {
          if (strategy.status === 'running') {
            const allMessages = [...activityMessages, ...marketMessages(strategy.markets || ['Kalshi', 'Polymarket'])]
            const randomIndex = Math.floor(Math.random() * allMessages.length)
            const marketsScanned = Math.floor(Math.random() * 50) + 10
            const opportunitiesFound = Math.floor(Math.random() * 5)
            
            // 8% chance to execute a trade each interval (roughly 1-2 trades per minute)
            if (Math.random() < 0.08) {
              executeStrategyTrade(strategy)
            }
            
            newActivity[strategy.id] = {
              message: allMessages[randomIndex],
              marketsScanned,
              opportunitiesFound,
              lastActive: new Date(),
            }
          }
        })
        return newActivity
      })
    }, 3000 + Math.random() * 2000) // Vary interval 3-5 seconds for realism

    return () => clearInterval(interval)
  }, [deployedStrategies])

  // Initialize activity for newly deployed strategies
  useEffect(() => {
    deployedStrategies.forEach(strategy => {
      if (strategy.status === 'running' && !strategyActivity[strategy.id]) {
        setStrategyActivity(prev => ({
          ...prev,
          [strategy.id]: {
            message: activityMessages[0],
            marketsScanned: Math.floor(Math.random() * 30) + 5,
            opportunitiesFound: 0,
            lastActive: new Date(),
          }
        }))
      }
    })
  }, [deployedStrategies])

  // Format "time ago" for last active
  const formatTimeAgo = (date) => {
    if (!date) return 'just now'
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  // Sync deployedStrategies to localStorage whenever it changes
  useEffect(() => {
    // Always save to localStorage, even when empty (so deletions persist)
    localStorage.setItem('ttm_deployed_strategies', JSON.stringify(deployedStrategies))
  }, [deployedStrategies])

  // Fetch deployed strategies on mount
  useEffect(() => {
    if (user) {
      fetchDeployedStrategies()
    }
  }, [user])

  const fetchDeployedStrategies = async () => {
    try {
      setIsLoadingDeployed(true)
      const response = await strategyApi.getDeployed()
      // Handle response - axios puts data in response.data
      const strategies = response.data?.strategies || response.strategies || []
      if (strategies.length > 0) {
        const mapped = strategies.map(s => ({
          id: s.id,
          name: s.name,
          capital: s.allocatedCapital,
          mode: s.mode,
          status: s.status,
          startedAt: s.deployedAt,
          stoppedAt: s.stoppedAt,
          icon: s.icon || '⚡',
          pnl: s.totalPnl || 0,
          trades: s.totalTrades || 0,
          winRate: s.winRate || 0,
          winningTrades: s.winningTrades || 0,
          losingTrades: s.losingTrades || 0,
          markets: s.markets || ['Kalshi', 'Polymarket'],
          lastTradeAt: s.lastTradeAt,
        }))
        setDeployedStrategies(mapped)
        // Sync to localStorage for Dashboard
        localStorage.setItem('ttm_deployed_strategies', JSON.stringify(mapped))
      } else {
        // Check localStorage for any strategies
        const local = JSON.parse(localStorage.getItem('ttm_deployed_strategies') || '[]')
        if (local.length > 0) {
          setDeployedStrategies(local)
        }
      }
    } catch (error) {
      console.error('Failed to fetch deployed strategies:', error)
      // Fallback to localStorage
      const local = JSON.parse(localStorage.getItem('ttm_deployed_strategies') || '[]')
      if (local.length > 0) {
        setDeployedStrategies(local)
      }
    } finally {
      setIsLoadingDeployed(false)
    }
  }

  const handleSelectTemplate = (index) => {
    setSelectedTemplate(index)
    setBacktestComplete(false)
    setBacktestData([])
    // Initialize template customization with default values
    const t = templates[index]
    if (t) {
      setTemplateSettings({
        minEdge: t.settings.minEdge,
        maxPosition: t.settings.maxPosition,
        stopLoss: t.settings.stopLoss,
        takeProfit: t.settings.takeProfit || 15,
      })
      setTemplateMarkets([...t.markets])
    }
  }

  // Reset template settings to defaults
  const resetTemplateSettings = () => {
    if (template) {
      setTemplateSettings({
        minEdge: template.settings.minEdge,
        maxPosition: template.settings.maxPosition,
        stopLoss: template.settings.stopLoss,
        takeProfit: template.settings.takeProfit || 15,
      })
      setTemplateMarkets([...template.markets])
      setBacktestComplete(false)
    }
  }

  // Update a template setting (Pro only)
  const updateTemplateSetting = (key, value) => {
    if (!isPro) {
      openUpgradeModal()
      return
    }
    setTemplateSettings(prev => ({ ...prev, [key]: value }))
    setBacktestComplete(false) // Require re-backtest after changes
  }

  // Toggle a market for template (Pro only)
  const toggleTemplateMarket = (market) => {
    if (!isPro) {
      openUpgradeModal()
      return
    }
    setTemplateMarkets(prev => {
      if (prev.includes(market)) {
        return prev.filter(m => m !== market)
      }
      return [...prev, market]
    })
    setBacktestComplete(false)
  }

  // Get current template settings (customized or default)
  const getCurrentTemplateSettings = () => {
    if (template && Object.keys(templateSettings).length > 0) {
      return templateSettings
    }
    return template?.settings || {}
  }

  // Check if template has been customized
  const isTemplateCustomized = () => {
    if (!template) return false
    const current = getCurrentTemplateSettings()
    const original = template.settings
    return (
      current.minEdge !== original.minEdge ||
      current.maxPosition !== original.maxPosition ||
      current.stopLoss !== original.stopLoss ||
      JSON.stringify(templateMarkets.sort()) !== JSON.stringify(template.markets.sort())
    )
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

    // Track backtest run in Google Analytics
    const strategyName = template?.name || customStrategy.name || 'Custom Strategy'
    trackBacktestRun(strategyName)

    setTimeout(() => {
      setBacktestData(generateBacktestData(activeStrategy))
      setIsBacktesting(false)
      setBacktestComplete(true)
    }, 2000)
  }

  const handleDeploy = async () => {
    if (!activeStrategy || !backtestComplete) return
    
    setIsLoadingBalance(true)
    setCapitalError(null)
    
    try {
      // Fetch paper trading balance
      const paperResponse = await paperTradingApi.getPortfolio()
      const paperBalance = paperResponse.data?.portfolio?.currentBalance || 100000
      
      // Fetch live trading balance from connected accounts
      let liveBalance = 0
      try {
        const accountsResponse = await accountsApi.getAll()
        const connectedAccounts = accountsResponse.data?.accounts || []
        // Sum all connected account balances
        liveBalance = connectedAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
      } catch (e) {
        console.log('No connected accounts or error fetching:', e)
      }
      
      setAvailableBalance({ paper: paperBalance, live: liveBalance })
      
      // Set default capital to 10% of available balance or $100, whichever is greater
      const currentModeBalance = deploySettings.mode === 'paper' ? paperBalance : liveBalance
      const defaultCapital = Math.max(100, Math.floor(currentModeBalance * 0.1))
      setDeploySettings(prev => ({ ...prev, capital: Math.min(defaultCapital, currentModeBalance) }))
      
    } catch (error) {
      console.error('Error fetching balances:', error)
    } finally {
      setIsLoadingBalance(false)
    }
    
    setShowDeployModal(true)
  }

  const confirmDeploy = async () => {
    const strategyName = template?.name || customStrategy.name
    const customizedName = template && isTemplateCustomized() 
      ? `${strategyName} (Custom)` 
      : strategyName
    
    // Track strategy deployment in Google Analytics
    trackStrategyDeploy(customizedName)

    // Use customized settings for templates, or custom strategy settings
    const deployConfig = template 
      ? getCurrentTemplateSettings()
      : customStrategy.settings || {}
    const deployMarkets = template 
      ? templateMarkets 
      : customStrategy.markets || []

    // If user is logged in, save to backend
    if (user) {
      try {
        const response = await strategyApi.deploy({
          name: customizedName,
          description: template?.description || customStrategy.description || '',
          icon: template?.icon || '⚡',
          templateId: template?.id,
          config: deployConfig,
          markets: deployMarkets,
          categories: template?.categories || [],
          capital: deploySettings.capital,
          mode: deploySettings.mode,
        })

        if (response.data?.strategy) {
          const s = response.data.strategy
          const newStrategy = {
            id: s.id,
            name: s.name,
            capital: s.allocatedCapital || deploySettings.capital,
            mode: s.mode,
            status: s.status || 'running',
            startedAt: s.deployedAt,
            icon: s.icon || '⚡',
            pnl: 0,
            trades: 0,
            markets: deployMarkets,
          }
          setDeployedStrategies([...deployedStrategies, newStrategy])
          
          // Save to localStorage for Dashboard to read
          const existing = JSON.parse(localStorage.getItem('ttm_deployed_strategies') || '[]')
          existing.push(newStrategy)
          localStorage.setItem('ttm_deployed_strategies', JSON.stringify(existing))
        }
      } catch (error) {
        console.error('Failed to deploy strategy:', error)
        // Fall back to local state
        const newStrategy = {
          id: Date.now(),
          name: customizedName,
          capital: deploySettings.capital,
          mode: deploySettings.mode,
          status: 'running',
          startedAt: new Date().toISOString(),
          icon: template?.icon || '⚡',
          pnl: 0,
          trades: 0,
        }
        setDeployedStrategies([...deployedStrategies, newStrategy])
      }
    } else {
      // Not logged in - store locally
      const newStrategy = {
        id: Date.now(),
        name: customizedName,
        capital: deploySettings.capital,
        mode: deploySettings.mode,
        status: 'running',
        startedAt: new Date().toISOString(),
        icon: template?.icon || '⚡',
        pnl: 0,
        trades: 0,
        markets: deployMarkets,
      }
      setDeployedStrategies([...deployedStrategies, newStrategy])
      
      // Save to localStorage for Dashboard to read
      const existing = JSON.parse(localStorage.getItem('ttm_deployed_strategies') || '[]')
      existing.push(newStrategy)
      localStorage.setItem('ttm_deployed_strategies', JSON.stringify(existing))
    }

    setShowDeployModal(false)
    setSelectedTemplate(null)
    setTemplateSettings({})
    setTemplateMarkets([])
    setBacktestComplete(false)
  }

  // Helper to sync deployed strategies to localStorage
  const syncToLocalStorage = (strategies) => {
    localStorage.setItem('ttm_deployed_strategies', JSON.stringify(strategies))
  }

  const stopStrategy = async (id) => {
    // Update UI immediately
    const updated = deployedStrategies.map(s =>
      s.id === id ? { ...s, status: 'stopped', stoppedAt: new Date().toISOString() } : s
    )
    setDeployedStrategies(updated)
    syncToLocalStorage(updated)
    
    // Call backend if user is logged in and ID is a string (backend ID)
    if (user && typeof id === 'string') {
      try {
        await strategyApi.stopDeployed(id)
      } catch (error) {
        console.error('Failed to stop strategy on server:', error)
      }
    }
  }

  // Resume a stopped strategy
  const resumeStrategy = async (id) => {
    // Update UI immediately
    setDeployedStrategies(deployedStrategies.map(s =>
      s.id === id ? { ...s, status: 'running', resumedAt: new Date().toISOString() } : s
    ))
    
    // Call backend if user is logged in and ID is a string (backend ID)
    if (user && typeof id === 'string') {
      try {
        await strategyApi.resumeDeployed(id)
      } catch (error) {
        console.error('Failed to resume strategy on server:', error)
      }
    }
  }

  // Remove deployed strategy (doesn't delete the strategy config, just removes from running)
  const removeDeployedStrategy = async (id) => {
    // Update UI immediately
    setDeployedStrategies(deployedStrategies.filter(s => s.id !== id))
    setShowRemoveDeployedConfirm(null)
    
    // Call backend if user is logged in and ID is a string (backend ID)
    if (user && typeof id === 'string') {
      try {
        await strategyApi.deleteDeployed(id)
      } catch (error) {
        console.error('Failed to delete strategy on server:', error)
      }
    }
  }

  // State for edit mode and delete confirmation
  const [editingStrategyId, setEditingStrategyId] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [showRemoveDeployedConfirm, setShowRemoveDeployedConfirm] = useState(null)

  // Calculate realistic stats based on strategy configuration
  const calculateStrategyStats = (strategy) => {
    // Base stats affected by strategy type
    const typeMultipliers = {
      'arbitrage': { winRate: 0.82, trades: 1.2, sharpe: 1.1 },
      'momentum': { winRate: 0.68, trades: 1.0, sharpe: 0.9 },
      'mean-reversion': { winRate: 0.72, trades: 0.9, sharpe: 1.0 },
      'news-based': { winRate: 0.75, trades: 0.6, sharpe: 1.05 },
      'market-making': { winRate: 0.80, trades: 1.5, sharpe: 1.0 },
    }
    const typeMult = typeMultipliers[strategy.type] || { winRate: 0.70, trades: 1.0, sharpe: 1.0 }

    // Get exit condition values from advanced config or fallback to settings
    const advancedExits = strategy.advancedExitConditions || {}
    const takeProfit = advancedExits['take-profit']?.enabled
      ? advancedExits['take-profit'].value
      : (strategy.settings?.takeProfit || 15)
    const stopLoss = advancedExits['stop-loss']?.enabled
      ? advancedExits['stop-loss'].value
      : (strategy.settings?.stopLoss || 10)
    const hasTrailingStop = advancedExits['trailing-stop']?.enabled
    const trailingStopValue = advancedExits['trailing-stop']?.value || 5

    // Conditional rules boost performance slightly
    const ruleCount = strategy.conditionalRules?.length || 0
    const ruleBonus = 1 + (ruleCount * 0.02) // 2% boost per rule

    // Higher minEdge = higher win rate but fewer trades
    const edgeFactor = Math.min(strategy.settings?.minEdge / 3 || 1, 1.5)
    const baseWinRate = 65 + (edgeFactor * 15)
    let winRate = Math.min(95, Math.round(baseWinRate * typeMult.winRate * ruleBonus))

    // Trailing stop can improve win rate
    if (hasTrailingStop) {
      winRate = Math.min(95, winRate + 3)
    }

    // More markets = more trades
    const marketFactor = (strategy.markets?.length || 1)
    const baseTrades = 80 + (marketFactor * 40)
    const totalTrades = Math.round(baseTrades * typeMult.trades * (1 + Math.random() * 0.2))

    // Calculate P&L based on win rate and position sizing
    const maxPosition = strategy.settings?.maxPosition || 200
    const avgWin = Math.round(maxPosition * (takeProfit / 100) * 0.8)
    const avgLoss = -Math.round(maxPosition * (stopLoss / 100) * 0.7)
    const winningTrades = Math.round(totalTrades * (winRate / 100))
    const losingTrades = totalTrades - winningTrades
    let profitLoss = Math.round((winningTrades * avgWin) + (losingTrades * avgLoss))

    // Trailing stop can capture more profit
    if (hasTrailingStop) {
      profitLoss = Math.round(profitLoss * 1.15)
    }

    // Risk metrics
    const maxDrawdown = Math.round(stopLoss * (1.5 + Math.random() * 0.5))
    const sharpeRatio = Math.round((1.2 + (edgeFactor * 0.8) * typeMult.sharpe * ruleBonus) * 10) / 10
    const sortinoRatio = Math.round((sharpeRatio * 1.3) * 10) / 10

    // Monthly returns (6 months)
    const monthlyReturn = profitLoss / 6
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthlyReturns = months.map(month => ({
      month,
      pnl: Math.round(monthlyReturn * (0.7 + Math.random() * 0.6))
    }))

    return {
      winRate,
      totalTrades,
      profitLoss,
      avgWin,
      avgLoss,
      maxDrawdown: -maxDrawdown,
      sharpeRatio,
      sortinoRatio,
      monthlyReturn: Math.round((profitLoss / 10000) * 100 * 10) / 10, // % based on $10k
      monthlyReturns,
    }
  }

  // Custom strategy builder functions
  const openNewStrategy = () => {
    setEditingStrategyId(null)
    setShowNewStrategyModal(true)
    setBuilderStep(1)
    setCustomStrategy({
      name: '',
      type: null,
      markets: [],
      entryConditions: [],
      exitConditions: [],
      advancedExitConditions: {},
      conditionalRules: [],
      settings: {
        minEdge: 3,
        maxPosition: 200,
        stopLoss: 10,
        takeProfit: 15,
      }
    })
  }

  // Toggle advanced exit condition
  const toggleAdvancedExitCondition = (conditionId) => {
    const condition = ADVANCED_EXIT_CONDITIONS.find(c => c.id === conditionId)
    setCustomStrategy(prev => ({
      ...prev,
      advancedExitConditions: {
        ...prev.advancedExitConditions,
        [conditionId]: prev.advancedExitConditions[conditionId]?.enabled
          ? { ...prev.advancedExitConditions[conditionId], enabled: false }
          : { enabled: true, value: condition?.defaultValue || 10 }
      }
    }))
  }

  // Update advanced exit condition value
  const updateAdvancedExitValue = (conditionId, value) => {
    setCustomStrategy(prev => ({
      ...prev,
      advancedExitConditions: {
        ...prev.advancedExitConditions,
        [conditionId]: { ...prev.advancedExitConditions[conditionId], value: Number(value) }
      }
    }))
  }

  // Add a new conditional rule
  const addConditionalRule = () => {
    const newRule = {
      id: Date.now(),
      trigger: 'profit-reaches',
      triggerValue: 15,
      action: 'set-trailing-stop',
      actionValue: 5,
    }
    setCustomStrategy(prev => ({
      ...prev,
      conditionalRules: [...prev.conditionalRules, newRule]
    }))
  }

  // Update a conditional rule
  const updateConditionalRule = (ruleId, field, value) => {
    setCustomStrategy(prev => ({
      ...prev,
      conditionalRules: prev.conditionalRules.map(rule =>
        rule.id === ruleId ? { ...rule, [field]: value } : rule
      )
    }))
  }

  // Remove a conditional rule
  const removeConditionalRule = (ruleId) => {
    setCustomStrategy(prev => ({
      ...prev,
      conditionalRules: prev.conditionalRules.filter(rule => rule.id !== ruleId)
    }))
  }

  // Edit existing custom strategy
  const editCustomStrategy = (strategy, e) => {
    e.stopPropagation()
    setEditingStrategyId(strategy.id)
    setCustomStrategy({
      ...strategy,
      advancedExitConditions: strategy.advancedExitConditions || {},
      conditionalRules: strategy.conditionalRules || [],
      settings: strategy.settings || {
        minEdge: 3,
        maxPosition: 200,
        stopLoss: 10,
        takeProfit: 15,
      }
    })
    setBuilderStep(1)
    setShowNewStrategyModal(true)
  }

  // Delete custom strategy
  const deleteCustomStrategy = (strategyId) => {
    setCustomStrategies(customStrategies.filter(s => s.id !== strategyId))
    setShowDeleteConfirm(null)
    // Clear selection if deleted strategy was selected
    if (selectedTemplate === 'custom' && customStrategy.id === strategyId) {
      setSelectedTemplate(null)
      setBacktestComplete(false)
    }
  }

  // Re-run backtest with current settings
  const rerunBacktest = () => {
    if (selectedTemplate === 'custom' && customStrategy.id) {
      const newStats = calculateStrategyStats(customStrategy)
      const updatedStrategy = {
        ...customStrategy,
        ...newStats,
        backtestStats: {
          totalTrades: newStats.totalTrades,
          winRate: newStats.winRate,
          profitLoss: newStats.profitLoss,
          avgWin: newStats.avgWin,
          avgLoss: newStats.avgLoss,
          maxDrawdown: newStats.maxDrawdown,
          sharpeRatio: newStats.sharpeRatio,
          sortinoRatio: newStats.sortinoRatio,
        }
      }
      setCustomStrategy(updatedStrategy)
      setCustomStrategies(customStrategies.map(s =>
        s.id === customStrategy.id ? updatedStrategy : s
      ))
      handleBacktest()
    } else {
      handleBacktest()
    }
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
      case 4: {
        // Check if at least one advanced exit condition is enabled
        const hasAdvancedExit = Object.values(customStrategy.advancedExitConditions || {}).some(c => c.enabled)
        return hasAdvancedExit
      }
      default: return true
    }
  }

  const saveCustomStrategy = () => {
    // Calculate realistic stats based on configuration
    const stats = calculateStrategyStats(customStrategy)

    const strategyToSave = {
      ...customStrategy,
      id: editingStrategyId || Date.now(),
      ...stats,
      backtestStats: {
        totalTrades: stats.totalTrades,
        winRate: stats.winRate,
        profitLoss: stats.profitLoss,
        avgWin: stats.avgWin,
        avgLoss: stats.avgLoss,
        maxDrawdown: stats.maxDrawdown,
        sharpeRatio: stats.sharpeRatio,
        sortinoRatio: stats.sortinoRatio,
      }
    }

    if (editingStrategyId) {
      // Update existing strategy
      setCustomStrategies(customStrategies.map(s =>
        s.id === editingStrategyId ? strategyToSave : s
      ))
    } else {
      // Add new strategy
      setCustomStrategies([...customStrategies, strategyToSave])
    }

    setShowNewStrategyModal(false)
    setEditingStrategyId(null)
    handleSelectCustomStrategy(strategyToSave)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Strategy Builder Pro</h1>
          <button
            onClick={openNewStrategy}
            className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:text-indigo-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Strategy
          </button>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Create, backtest, and deploy custom trading strategies.</p>
      </div>

      {/* Deployed Strategies */}
      {deployedStrategies.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Strategies</h2>
          <div className="space-y-3">
            {deployedStrategies.map((strategy) => {
              const activity = strategyActivity[strategy.id]
              return (
                <div key={strategy.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Animated Scanner Indicator */}
                      <div className="relative">
                        {strategy.status === 'running' ? (
                          <>
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-400 animate-ping" />
                            <div className="absolute -inset-1 w-5 h-5 rounded-full border-2 border-green-400/30 animate-pulse" />
                          </>
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{strategy.icon} {strategy.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          ${strategy.capital?.toLocaleString()} • {strategy.mode === 'paper' ? 'Paper Trading' : 'Live Trading'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {strategy.status === 'running' ? (
                        <>
                          <span className={`text-sm font-medium ${(strategy.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(strategy.pnl || 0) >= 0 ? '+' : ''}${(strategy.pnl || 0).toFixed(2)} ({((strategy.pnl || 0) / strategy.capital * 100).toFixed(1)}%)
                          </span>
                          <button
                            onClick={() => stopStrategy(strategy.id)}
                            className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Pause strategy"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-sm text-gray-500">Paused</span>
                          <button
                            onClick={() => resumeStrategy(strategy.id)}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Resume strategy"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setShowRemoveDeployedConfirm(strategy.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove from active"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Live Activity Bar - Only show for running strategies */}
                  {strategy.status === 'running' && activity && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* Spinning scanner icon */}
                          <div className="relative w-4 h-4">
                            <div className="absolute inset-0 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                          </div>
                          <span className="text-sm text-gray-600 animate-pulse">
                            {activity.message?.icon} {activity.message?.text}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {strategy.trades > 0 && (
                            <>
                              <span className="flex items-center gap-1 text-green-600 font-medium">
                                {strategy.trades} trades
                              </span>
                              <span>•</span>
                            </>
                          )}
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            {activity.marketsScanned} scanned
                          </span>
                          <span>•</span>
                          <span>{strategy.lastTradeAt ? formatTimeAgo(strategy.lastTradeAt) : formatTimeAgo(activity.lastActive)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Custom Strategies */}
      {customStrategies.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Custom Strategies</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {customStrategies.map((strategy) => (
              <div
                key={strategy.id}
                onClick={() => handleSelectCustomStrategy(strategy)}
                className={`relative text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  selectedTemplate === 'custom' && customStrategy.id === strategy.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-md'
                    : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl">⚡</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => editCustomStrategy(strategy, e)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
                      title="Edit strategy"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDeleteConfirm(strategy.id)
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                      title="Delete strategy"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mt-3">{strategy.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {STRATEGY_TYPES.find(t => t.id === strategy.type)?.name} • {strategy.markets.length} market{strategy.markets.length !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">{strategy.winRate}% Win</span>
                  <span className="text-sm text-gray-400">•</span>
                  <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">+{strategy.monthlyReturn}%/mo</span>
                </div>
                {strategy.backtestStats && (
                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                    {strategy.backtestStats.totalTrades} trades • ${strategy.backtestStats.profitLoss?.toLocaleString()} P&L
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Strategy?</h3>
              <p className="text-sm text-gray-500 mb-6">
                This will permanently delete this custom strategy. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteCustomStrategy(showDeleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Deployed Strategy Confirmation Modal */}
      {showRemoveDeployedConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Remove Active Strategy?</h3>
              <p className="text-sm text-gray-500 mb-6">
                This will stop and remove the strategy from your active list. Your strategy configuration and backtest data will be preserved - you can redeploy it anytime.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRemoveDeployedConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => removeDeployedStrategy(showRemoveDeployedConfirm)}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Start with a Template</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t, i) => (
            <button
              key={t.id}
              onClick={() => handleSelectTemplate(i)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                selectedTemplate === i
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-md'
                  : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl">{t.icon}</span>
                <span className={`text-xs font-bold ${getDifficultyStyle(t.difficulty)}`}>
                  {t.difficulty}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mt-3">{t.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{t.description}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-sm font-medium text-green-600 dark:text-green-400">{t.winRate}% Win</span>
                <span className="text-sm text-gray-400">•</span>
                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">+{t.monthlyReturn}%/mo</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Strategy Canvas */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {activeStrategy ? (template?.name || customStrategy.name) : 'Strategy Canvas'}
            </h2>
            <div className="flex gap-2">
              {/* Edit button for custom strategies */}
              {selectedTemplate === 'custom' && customStrategy.id && (
                <button
                  onClick={(e) => editCustomStrategy(customStrategy, e)}
                  className="px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Settings className="w-4 h-4" />
                  Edit
                </button>
              )}
              <button
                onClick={backtestComplete ? rerunBacktest : handleBacktest}
                disabled={!activeStrategy || isBacktesting}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                  activeStrategy && !isBacktesting
                    ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                {isBacktesting ? (
                  <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-indigo-600 rounded-full animate-spin" />
                ) : backtestComplete ? (
                  <RefreshCw className="w-4 h-4" />
                ) : (
                  <Activity className="w-4 h-4" />
                )}
                {isBacktesting ? 'Running...' : backtestComplete ? 'Re-run' : 'Backtest'}
              </button>
              <button
                onClick={handleDeploy}
                disabled={!backtestComplete}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                  backtestComplete
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/25'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
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
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Strategy Settings</h3>
                    {template && (
                      <div className="flex items-center gap-2">
                        {isTemplateCustomized() && (
                          <button
                            onClick={resetTemplateSettings}
                            className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Reset
                          </button>
                        )}
                        {!isPro && (
                          <span className="text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded font-medium">
                            PRO to edit
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {/* Min Edge - Editable for templates */}
                    <div className={`flex items-center justify-between p-3 rounded-lg ${template ? 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors' : 'bg-gray-50 dark:bg-gray-800'}`}>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Min Edge Required</span>
                      {template ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            max="20"
                            value={getCurrentTemplateSettings().minEdge || 3}
                            onChange={(e) => updateTemplateSetting('minEdge', parseFloat(e.target.value))}
                            onClick={(e) => !isPro && e.preventDefault()}
                            className={`w-16 px-2 py-1 text-right text-sm font-medium border rounded ${
                              isPro
                                ? 'border-gray-200 dark:border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                                : 'border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 cursor-pointer text-gray-900 dark:text-white'
                            }`}
                            readOnly={!isPro}
                          />
                          <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                        </div>
                      ) : (
                        <span className="font-medium text-gray-900 dark:text-white">{customStrategy.settings.minEdge}%</span>
                      )}
                    </div>
                    {/* Max Position - Editable for templates */}
                    <div className={`flex items-center justify-between p-3 rounded-lg ${template ? 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors' : 'bg-gray-50 dark:bg-gray-800'}`}>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Max Position Size</span>
                      {template ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">$</span>
                          <input
                            type="number"
                            step="50"
                            min="50"
                            max="10000"
                            value={getCurrentTemplateSettings().maxPosition || 100}
                            onChange={(e) => updateTemplateSetting('maxPosition', parseInt(e.target.value))}
                            onClick={(e) => !isPro && e.preventDefault()}
                            className={`w-20 px-2 py-1 text-right text-sm font-medium border rounded ${
                              isPro
                                ? 'border-gray-200 dark:border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                                : 'border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 cursor-pointer text-gray-900 dark:text-white'
                            }`}
                            readOnly={!isPro}
                          />
                        </div>
                      ) : (
                        <span className="font-medium text-gray-900 dark:text-white">${customStrategy.settings.maxPosition}</span>
                      )}
                    </div>
                    {/* Stop Loss - Editable for templates */}
                    <div className={`flex items-center justify-between p-3 rounded-lg ${template ? 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors' : 'bg-gray-50 dark:bg-gray-800'}`}>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Stop Loss</span>
                      {template ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-red-500">-</span>
                          <input
                            type="number"
                            step="1"
                            min="1"
                            max="50"
                            value={getCurrentTemplateSettings().stopLoss || 10}
                            onChange={(e) => updateTemplateSetting('stopLoss', parseInt(e.target.value))}
                            onClick={(e) => !isPro && e.preventDefault()}
                            className={`w-16 px-2 py-1 text-right text-sm font-medium border rounded ${
                              isPro
                                ? 'border-gray-200 dark:border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-red-600 bg-white dark:bg-gray-700'
                                : 'border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 cursor-pointer text-red-600'
                            }`}
                            readOnly={!isPro}
                          />
                          <span className="text-sm text-red-500">%</span>
                        </div>
                      ) : (
                        <span className="font-medium text-red-600">-{customStrategy.settings.stopLoss}%</span>
                      )}
                    </div>
                    {/* Take Profit - Editable for templates */}
                    <div className={`flex items-center justify-between p-3 rounded-lg ${template ? 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors' : 'bg-gray-50 dark:bg-gray-800'}`}>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Take Profit</span>
                      {template ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-green-500">+</span>
                          <input
                            type="number"
                            step="1"
                            min="1"
                            max="100"
                            value={getCurrentTemplateSettings().takeProfit || 15}
                            onChange={(e) => updateTemplateSetting('takeProfit', parseInt(e.target.value))}
                            onClick={(e) => !isPro && e.preventDefault()}
                            className={`w-16 px-2 py-1 text-right text-sm font-medium border rounded ${
                              isPro
                                ? 'border-gray-200 dark:border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-green-600 bg-white dark:bg-gray-700'
                                : 'border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 cursor-pointer text-green-600'
                            }`}
                            readOnly={!isPro}
                          />
                          <span className="text-sm text-green-500">%</span>
                        </div>
                      ) : (
                        <span className="font-medium text-green-600">+{customStrategy.settings.takeProfit}%</span>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Target Markets</h3>
                    {template && !isPro && (
                      <span className="text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded font-medium">
                        PRO to edit
                      </span>
                    )}
                  </div>
                  {template ? (
                    <div className="flex flex-wrap gap-2">
                      {['Kalshi', 'Manifold', 'Polymarket', 'PredictIt'].map((market) => {
                        const isSelected = templateMarkets.includes(market)
                        return (
                          <button
                            key={market}
                            onClick={() => toggleTemplateMarket(market)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            } ${!isPro ? 'cursor-pointer' : ''}`}
                          >
                            {market}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {customStrategy.markets.map(m => AVAILABLE_MARKETS.find(am => am.id === m)?.name).map((market) => (
                        <span key={market} className="px-3 py-2 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium">
                          {market}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {!backtestComplete && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Run Backtest First</p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                        You must run a backtest before deploying this strategy.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Backtest Progress */}
              {isBacktesting && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-indigo-200 dark:border-indigo-700 border-t-indigo-600 rounded-full animate-spin" />
                    <div>
                      <p className="font-medium text-indigo-900 dark:text-indigo-300">Running Backtest...</p>
                      <p className="text-sm text-indigo-600 dark:text-indigo-400">Analyzing 6 months of historical data</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Backtest Complete */}
              {backtestComplete && (
                <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-300">Backtest Complete!</p>
                      <p className="text-sm text-green-600 dark:text-green-400">Strategy is ready to deploy</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-80 bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
              <div className="text-center">
                <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300 font-medium">Select a template or create your own</p>
                <p className="text-gray-400 text-sm mt-2">Click "New Strategy" to build from scratch</p>
              </div>
            </div>
          )}
        </div>

        {/* Backtest Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {backtestComplete ? 'Backtest Results' : 'Backtest Preview'}
            </h3>
            {backtestComplete && activeStrategy && (
              <button
                onClick={() => setShowExpandedBacktest(true)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                View Full Report
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={backtestComplete ? backtestData : (activeStrategy ? generateBacktestData(activeStrategy) : [])}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #374151', backgroundColor: '#1f2937' }}
                  formatter={(value) => [`$${value}`, 'P&L']}
                />
                <Bar dataKey="pnl" fill={backtestComplete ? '#22c55e' : '#6366f1'} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Win Rate</span>
              <span className="font-medium text-gray-900 dark:text-white">{template?.backtestStats?.winRate || template?.winRate || customStrategy.winRate || 74}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Total P&L (6mo)</span>
              <span className={`font-medium ${(template?.backtestStats?.profitLoss || customStrategy?.backtestStats?.profitLoss || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {(template?.backtestStats?.profitLoss || customStrategy?.backtestStats?.profitLoss || 0) >= 0 ? '+' : ''}${(template?.backtestStats?.profitLoss || customStrategy?.backtestStats?.profitLoss || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Total Trades</span>
              <span className="font-medium text-gray-900 dark:text-white">{template?.backtestStats?.totalTrades || customStrategy?.backtestStats?.totalTrades || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Avg Win / Loss</span>
              <span className="font-medium text-gray-900 dark:text-white">
                <span className="text-green-600 dark:text-green-400">${template?.backtestStats?.avgWin || customStrategy?.backtestStats?.avgWin || 0}</span>
                {' / '}
                <span className="text-red-600 dark:text-red-400">${Math.abs(template?.backtestStats?.avgLoss || customStrategy?.backtestStats?.avgLoss || 0)}</span>
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Max Drawdown</span>
              <span className="font-medium text-red-600 dark:text-red-400">{template?.backtestStats?.maxDrawdown || customStrategy?.backtestStats?.maxDrawdown || template?.maxDrawdown || customStrategy.maxDrawdown || 12}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Sharpe Ratio</span>
              <span className="font-medium text-indigo-600 dark:text-indigo-400">{template?.backtestStats?.sharpeRatio || customStrategy?.backtestStats?.sharpeRatio || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Sortino Ratio</span>
              <span className="font-medium text-indigo-600 dark:text-indigo-400">{template?.backtestStats?.sortinoRatio || customStrategy?.backtestStats?.sortinoRatio || '-'}</span>
            </div>
          </div>
          {/* View Full Report Button */}
          {backtestComplete && activeStrategy && (
            <button
              onClick={() => setShowExpandedBacktest(true)}
              className="w-full mt-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Activity className="w-4 h-4" />
              View Full Backtest Report
            </button>
          )}
        </div>
      </div>

      {/* Expanded Backtest Results Modal */}
      {showExpandedBacktest && activeStrategy && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
          <div className="min-h-full flex items-start justify-center py-8">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {template?.name || customStrategy?.name || 'Strategy'} - Full Backtest Report
                </h2>
                <button
                  onClick={() => setShowExpandedBacktest(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <BacktestResultsPanel
                  strategy={template || customStrategy}
                  backtestStats={template?.backtestStats || customStrategy?.backtestStats}
                  monthlyReturns={template?.monthlyReturns || customStrategy?.monthlyReturns}
                  isLoading={isBacktesting}
                  onRerunBacktest={() => {
                    setShowExpandedBacktest(false)
                    rerunBacktest()
                  }}
                  initialCapital={10000}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deploy Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Deploy Strategy</h3>
              <button
                onClick={() => setShowDeployModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Available Balance Display */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Available Balance</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {isLoadingBalance ? '...' : `$${(deploySettings.mode === 'paper' ? availableBalance.paper : availableBalance.live).toLocaleString()}`}
                  </span>
                </div>
                {deploySettings.mode === 'live' && availableBalance.live === 0 && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    No connected accounts. Go to Accounts to connect.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Allocate Capital
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
                  <input
                    type="number"
                    value={deploySettings.capital}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      const maxBalance = deploySettings.mode === 'paper' ? availableBalance.paper : availableBalance.live
                      setDeploySettings({ ...deploySettings, capital: value })
                      if (value > maxBalance) {
                        setCapitalError(`Cannot exceed available balance of $${maxBalance.toLocaleString()}`)
                      } else if (value < 10) {
                        setCapitalError('Minimum allocation is $10')
                      } else {
                        setCapitalError(null)
                      }
                    }}
                    min={10}
                    max={deploySettings.mode === 'paper' ? availableBalance.paper : availableBalance.live}
                    className={`w-full pl-8 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                      capitalError ? 'border-red-300 bg-red-50 dark:bg-red-900/30' : 'border-gray-200 dark:border-gray-700'
                    }`}
                  />
                </div>
                {capitalError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {capitalError}
                  </p>
                )}
                {!capitalError && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This is the amount the strategy will use for trading
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Trading Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      const newCapital = Math.min(deploySettings.capital, availableBalance.paper)
                      setDeploySettings({ ...deploySettings, mode: 'paper', capital: newCapital })
                      setCapitalError(null)
                    }}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      deploySettings.mode === 'paper'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <p className="font-medium text-gray-900 dark:text-white">Paper Trading</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Practice with virtual money</p>
                  </button>
                  <button
                    onClick={() => {
                      if (isPro) {
                        const newCapital = Math.min(deploySettings.capital, availableBalance.live)
                        setDeploySettings({ ...deploySettings, mode: 'live', capital: newCapital > 0 ? newCapital : 0 })
                        if (availableBalance.live === 0) {
                          setCapitalError('Connect an account first to trade live')
                        } else {
                          setCapitalError(null)
                        }
                      } else {
                        setShowDeployModal(false)
                        openUpgradeModal()
                      }
                    }}
                    className={`p-3 rounded-xl border-2 text-left transition-all relative ${
                      deploySettings.mode === 'live'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    } ${!isPro ? 'opacity-75' : ''}`}
                  >
                    {!isPro && (
                      <span className="absolute top-2 right-2 text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded font-medium">PRO</span>
                    )}
                    <p className="font-medium text-gray-900 dark:text-white">Live Trading</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{isPro ? 'Real money execution' : '$9.99/mo - Real money'}</p>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{template?.icon || '⚡'}</div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{template?.name || customStrategy.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {template?.winRate || customStrategy.winRate}% win rate • +{template?.monthlyReturn || customStrategy.monthlyReturn}%/mo
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={confirmDeploy}
                disabled={!!capitalError || deploySettings.capital <= 0 || isLoadingBalance}
                className={`w-full py-3 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  capitalError || deploySettings.capital <= 0 || isLoadingBalance
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-linear-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500'
                }`}
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
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {editingStrategyId ? 'Edit Strategy' : 'Create New Strategy'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Step {builderStep} of 5</p>
                </div>
                <button
                  onClick={() => {
                    setShowNewStrategyModal(false)
                    setEditingStrategyId(null)
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Progress bar */}
              <div className="mt-4 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Strategy Name
                    </label>
                    <input
                      type="text"
                      value={customStrategy.name}
                      onChange={(e) => setCustomStrategy({ ...customStrategy, name: e.target.value })}
                      placeholder="My Awesome Strategy"
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Strategy Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {STRATEGY_TYPES.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setCustomStrategy({ ...customStrategy, type: type.id })}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            customStrategy.type === type.id
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <span className="text-2xl">{type.icon}</span>
                          <p className="font-medium text-gray-900 dark:text-white mt-2">{type.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{type.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Markets */}
              {builderStep === 2 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Select Markets to Trade
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {AVAILABLE_MARKETS.map((market) => (
                      <button
                        key={market.id}
                        onClick={() => toggleMarket(market.id)}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                          customStrategy.markets.includes(market.id)
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <span className="text-3xl">{market.icon}</span>
                        <p className="font-medium text-gray-900 dark:text-white mt-2">{market.name}</p>
                        {customStrategy.markets.includes(market.id) && (
                          <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mx-auto mt-2" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Entry Conditions */}
              {builderStep === 3 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    When should the bot enter a trade?
                  </label>
                  <div className="space-y-3">
                    {ENTRY_CONDITIONS.map((condition) => (
                      <button
                        key={condition.id}
                        onClick={() => toggleCondition('entry', condition.id)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                          customStrategy.entryConditions.includes(condition.id)
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{condition.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{condition.description}</p>
                        </div>
                        {customStrategy.entryConditions.includes(condition.id) && (
                          <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Exit Conditions (Advanced) */}
              {builderStep === 4 && (
                <div className="space-y-6">
                  {/* Basic Exit Conditions with Customizable Values */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Exit Conditions
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Select conditions and customize their values</p>
                    <div className="space-y-3">
                      {ADVANCED_EXIT_CONDITIONS.map((condition) => {
                        const isEnabled = customStrategy.advancedExitConditions?.[condition.id]?.enabled
                        const currentValue = customStrategy.advancedExitConditions?.[condition.id]?.value ?? condition.defaultValue

                        return (
                          <div
                            key={condition.id}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              isEnabled
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <button
                                onClick={() => toggleAdvancedExitCondition(condition.id)}
                                className="flex items-start gap-3 text-left flex-1"
                              >
                                <span className="text-xl mt-0.5">{condition.icon}</span>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">{condition.name}</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{condition.description}</p>
                                </div>
                              </button>
                              {isEnabled && (
                                <Check className="w-5 h-5 text-indigo-600 shrink-0" />
                              )}
                            </div>

                            {/* Value Input - only show when enabled */}
                            {isEnabled && condition.hasValue && (
                              <div className="mt-3 ml-9">
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                  {condition.valueLabel}
                                </label>
                                {condition.options ? (
                                  <select
                                    value={currentValue}
                                    onChange={(e) => updateAdvancedExitValue(condition.id, e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                  >
                                    {condition.options.map(opt => (
                                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      value={currentValue}
                                      onChange={(e) => updateAdvancedExitValue(condition.id, e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      min={condition.min}
                                      max={condition.max}
                                      step={condition.valueType === 'percent' ? 0.5 : 1}
                                      className="w-24 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                    <span className="text-sm text-gray-500 dark:text-gray-400">{condition.valueSuffix}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Conditional Rules Section */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <GitBranch className="w-4 h-4" />
                          Conditional Rules (If-Then)
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Create advanced logic: "If X happens, then do Y"</p>
                      </div>
                      <button
                        onClick={addConditionalRule}
                        className="px-3 py-1.5 text-sm bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/70 transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Add Rule
                      </button>
                    </div>

                    {/* Existing Rules */}
                    {customStrategy.conditionalRules?.length > 0 ? (
                      <div className="space-y-3">
                        {customStrategy.conditionalRules.map((rule, index) => {
                          const trigger = RULE_TRIGGERS.find(t => t.id === rule.trigger)
                          const action = RULE_ACTIONS.find(a => a.id === rule.action)

                          return (
                            <div
                              key={rule.id}
                              className="p-4 bg-linear-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl border border-purple-200 dark:border-purple-800"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                                  Rule {index + 1}
                                </span>
                                <button
                                  onClick={() => removeConditionalRule(rule.id)}
                                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              {/* IF Section */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">IF</span>
                                <select
                                  value={rule.trigger}
                                  onChange={(e) => updateConditionalRule(rule.id, 'trigger', e.target.value)}
                                  className="flex-1 min-w-35 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                  {RULE_TRIGGERS.map(t => (
                                    <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                                  ))}
                                </select>

                                {trigger?.valueType === 'percent' && (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      value={rule.triggerValue}
                                      onChange={(e) => updateConditionalRule(rule.id, 'triggerValue', Number(e.target.value))}
                                      className="w-20 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                      min={0}
                                      max={100}
                                    />
                                    <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                                  </div>
                                )}

                                {trigger?.valueType === 'duration' && (
                                  <select
                                    value={rule.triggerValue}
                                    onChange={(e) => updateConditionalRule(rule.id, 'triggerValue', Number(e.target.value))}
                                    className="w-28 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  >
                                    {DURATION_OPTIONS.map(opt => (
                                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                  </select>
                                )}
                              </div>

                              {/* Arrow */}
                              <div className="flex justify-center my-2">
                                <ArrowRight className="w-5 h-5 text-purple-400 rotate-90" />
                              </div>

                              {/* THEN Section */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-1 rounded">THEN</span>
                                <select
                                  value={rule.action}
                                  onChange={(e) => updateConditionalRule(rule.id, 'action', e.target.value)}
                                  className="flex-1 min-w-40 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                  {RULE_ACTIONS.map(a => (
                                    <option key={a.id} value={a.id}>{a.icon} {a.label}</option>
                                  ))}
                                </select>

                                {action?.valueType === 'percent' && (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      value={rule.actionValue}
                                      onChange={(e) => updateConditionalRule(rule.id, 'actionValue', Number(e.target.value))}
                                      className="w-20 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                      min={0}
                                      max={100}
                                    />
                                    <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                                  </div>
                                )}

                                {action?.valueType === 'duration' && (
                                  <select
                                    value={rule.actionValue}
                                    onChange={(e) => updateConditionalRule(rule.id, 'actionValue', Number(e.target.value))}
                                    className="w-28 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  >
                                    {DURATION_OPTIONS.map(opt => (
                                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-center">
                        <GitBranch className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No conditional rules yet</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Example: "If profit reaches 17%, then activate trailing stop of 2%"
                        </p>
                      </div>
                    )}

                    {/* Rule Examples */}
                    {customStrategy.conditionalRules?.length === 0 && (
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Example strategies you can create:</p>
                        <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                          <li>• If profit reaches 17% → Set stop loss at 10% (lock in gains)</li>
                          <li>• If profit reaches 20% → Activate trailing stop of 2%</li>
                          <li>• If price sideways for 60min after profit goal → Exit position</li>
                          <li>• If loss reaches 5% → Reduce position by 50%</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 5: Risk & Position Settings */}
              {builderStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Minimum Edge Required (%)
                    </label>
                    <input
                      type="number"
                      value={customStrategy.settings.minEdge}
                      onChange={(e) => setCustomStrategy({
                        ...customStrategy,
                        settings: { ...customStrategy.settings, minEdge: Number(e.target.value) }
                      })}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      min={0.5}
                      max={20}
                      step={0.5}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Only enter trades with at least this much edge</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Position Size ($)
                    </label>
                    <input
                      type="number"
                      value={customStrategy.settings.maxPosition}
                      onChange={(e) => setCustomStrategy({
                        ...customStrategy,
                        settings: { ...customStrategy.settings, maxPosition: Number(e.target.value) }
                      })}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      min={10}
                      max={10000}
                      step={10}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Maximum amount to risk per trade</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Concurrent Positions
                    </label>
                    <input
                      type="number"
                      value={customStrategy.settings.maxConcurrent || 5}
                      onChange={(e) => setCustomStrategy({
                        ...customStrategy,
                        settings: { ...customStrategy.settings, maxConcurrent: Number(e.target.value) }
                      })}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      min={1}
                      max={20}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Maximum number of open positions at once</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Daily Loss Limit ($)
                    </label>
                    <input
                      type="number"
                      value={customStrategy.settings.dailyLossLimit || 500}
                      onChange={(e) => setCustomStrategy({
                        ...customStrategy,
                        settings: { ...customStrategy.settings, dailyLossLimit: Number(e.target.value) }
                      })}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      min={50}
                      max={10000}
                      step={50}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Stop trading for the day if losses exceed this amount</p>
                  </div>

                  {/* Summary of Exit Conditions */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Exit Conditions Summary</h4>
                    <div className="space-y-2">
                      {Object.entries(customStrategy.advancedExitConditions || {})
                        .filter(([_, config]) => config.enabled)
                        .map(([condId, config]) => {
                          const cond = ADVANCED_EXIT_CONDITIONS.find(c => c.id === condId)
                          if (!cond) return null
                          const displayValue = cond.options
                            ? cond.options.find(o => o.value === config.value)?.label
                            : `${config.value}${cond.valueSuffix}`
                          return (
                            <div key={condId} className="flex items-center gap-2 text-sm">
                              <span>{cond.icon}</span>
                              <span className="text-gray-600 dark:text-gray-400">{cond.name}:</span>
                              <span className="font-medium text-gray-900 dark:text-white">{displayValue}</span>
                            </div>
                          )
                        })}
                      {customStrategy.conditionalRules?.length > 0 && (
                        <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-xs font-medium text-purple-600">
                            + {customStrategy.conditionalRules.length} conditional rule{customStrategy.conditionalRules.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-between">
              <button
                onClick={() => setBuilderStep(Math.max(1, builderStep - 1))}
                className={`px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ${
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
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={saveCustomStrategy}
                  className="px-6 py-2 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-colors flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  {editingStrategyId ? 'Save Changes' : 'Create Strategy'}
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

import { useState, useEffect } from 'react'
import { Plus, AlertCircle, Check, TrendingUp, TrendingDown, X, ExternalLink, Eye, EyeOff, Copy, Shield, Key, ChevronRight, ArrowLeft, RefreshCw } from 'lucide-react'
import { useApp } from '../hooks/useApp'
import { useAuth } from '../hooks/useAuth'
import { trackAccountConnect } from '../utils/analytics'
import { paperTradingApi, accountsApi } from '../utils/api'

// Available platforms to connect
const AVAILABLE_PLATFORMS = [
  {
    id: 'kalshi',
    name: 'Kalshi',
    icon: '🎯',
    type: 'Prediction Market',
    description: 'CFTC-regulated prediction market for trading on real-world events.',
    features: ['Regulated in US', 'Real USD trading', 'Event contracts'],
    apiDocsUrl: 'https://docs.kalshi.com/getting_started/api_keys',
    setupSteps: [
      'Log in to your Kalshi account at kalshi.com',
      'Navigate to Settings → API Keys',
      'Click "Create New API Key"',
      'Copy your API Key ID and Private Key (store safely, it won\'t be shown again)',
      'Paste both keys below to connect your account'
    ],
    fields: [
      { id: 'apiKeyId', label: 'API Key ID', placeholder: 'ab1ed02f-24c4-4a81-aef0-c411cf939762' },
      { id: 'apiSecret', label: 'RSA Private Key', placeholder: '-----BEGIN RSA PRIVATE KEY-----\nMIIEow...\n-----END RSA PRIVATE KEY-----', isSecret: true, isMultiline: true }
    ],
    color: 'indigo'
  },
  {
    id: 'polymarket',
    name: 'Polymarket',
    icon: '📊',
    type: 'Prediction Market',
    description: 'Decentralized prediction market built on Polygon for global events.',
    features: ['Crypto-based (USDC)', 'Global access', 'High liquidity'],
    apiDocsUrl: 'https://docs.polymarket.com/',
    setupSteps: [
      'Connect your wallet to Polymarket at polymarket.com',
      'Go to your Profile → Settings → API',
      'Generate a new API key pair',
      'Copy your API Key and Secret',
      'Paste the credentials below to enable trading'
    ],
    fields: [
      { id: 'apiKey', label: 'API Key', placeholder: 'Enter your Polymarket API Key' },
      { id: 'apiSecret', label: 'API Secret', placeholder: 'Enter your Polymarket Secret', isSecret: true },
      { id: 'walletAddress', label: 'Wallet Address (optional)', placeholder: '0x...' }
    ],
    color: 'purple'
  },
  {
    id: 'manifold',
    name: 'Manifold Markets',
    icon: '🔮',
    type: 'Prediction Market',
    description: 'Play-money prediction market for practicing and community forecasting.',
    features: ['Free to use', 'Play money (Mana)', 'Great for practice'],
    apiDocsUrl: 'https://docs.manifold.markets/api',
    setupSteps: [
      'Sign in to Manifold Markets at manifold.markets',
      'Click your profile picture → Edit Profile',
      'Scroll down to "API Key" section',
      'Click "Generate new key" and copy it',
      'Paste the API key below'
    ],
    fields: [
      { id: 'apiKey', label: 'API Key', placeholder: 'Enter your Manifold API Key' }
    ],
    color: 'violet'
  },
  {
    id: 'predictit',
    name: 'PredictIt',
    icon: '🏛️',
    type: 'Prediction Market',
    description: 'Political prediction market operated by Victoria University.',
    features: ['Political markets', 'US-based', 'Academic research'],
    apiDocsUrl: 'https://www.predictit.org/api/marketdata/all/',
    setupSteps: [
      'Log in to PredictIt at predictit.org',
      'Currently PredictIt has limited API access',
      'Contact support@predictit.org for API access request',
      'Once approved, you\'ll receive API credentials via email',
      'Enter your credentials below'
    ],
    fields: [
      { id: 'username', label: 'PredictIt Username', placeholder: 'Your PredictIt username' },
      { id: 'apiKey', label: 'API Key', placeholder: 'Enter your PredictIt API Key' }
    ],
    color: 'blue'
  },
  {
    id: 'betfair',
    name: 'Betfair Exchange',
    icon: '🏇',
    type: 'Betting Exchange',
    description: 'World\'s largest online betting exchange with deep liquidity.',
    features: ['Sports & politics', 'High liquidity', 'Exchange model'],
    apiDocsUrl: 'https://developer.betfair.com/',
    setupSteps: [
      'Create a Betfair developer account at developer.betfair.com',
      'Register your application to get an App Key',
      'Generate session tokens using your Betfair credentials',
      'For automated trading, set up certificate-based authentication',
      'Enter your App Key and session token below'
    ],
    fields: [
      { id: 'appKey', label: 'Application Key', placeholder: 'Enter your Betfair App Key' },
      { id: 'sessionToken', label: 'Session Token', placeholder: 'Enter your session token', isSecret: true },
      { id: 'username', label: 'Betfair Username', placeholder: 'Your Betfair username' }
    ],
    color: 'yellow'
  },
  {
    id: 'metaculus',
    name: 'Metaculus',
    icon: '🔬',
    type: 'Forecasting Platform',
    description: 'Community forecasting platform focused on science and technology.',
    features: ['Reputation-based', 'Science focus', 'Community driven'],
    apiDocsUrl: 'https://www.metaculus.com/api/',
    setupSteps: [
      'Create an account at metaculus.com',
      'Go to your account settings',
      'Navigate to the API section',
      'Generate your personal API token',
      'Copy and paste it below'
    ],
    fields: [
      { id: 'apiToken', label: 'API Token', placeholder: 'Enter your Metaculus API Token' }
    ],
    color: 'teal'
  }
]

const Accounts = () => {
  const { tradingMode, setTradingMode, isPro, openUpgradeModal } = useApp()
  const { user } = useAuth()
  const [showAddAccountModal, setShowAddAccountModal] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [apiCredentials, setApiCredentials] = useState({})
  const [showSecrets, setShowSecrets] = useState({})
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionSuccess, setConnectionSuccess] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isResetting, setIsResetting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [accounts, setAccounts] = useState([])
  
  // Paper trading portfolio state
  const [paperPortfolio, setPaperPortfolio] = useState({
    currentBalance: 100000,
    startingBalance: 100000,
    monthlyPnl: 0,
    monthlyPnlPercent: 0,
    totalPnl: 0,
    totalPnlPercent: 0,
    totalTrades: 0,
    winRate: 0,
  })
  const [paperPositions, setPaperPositions] = useState([])
  const [recentTrades, setRecentTrades] = useState([])

  // Fetch paper trading portfolio on mount
  useEffect(() => {
    if (user && tradingMode === 'paper') {
      fetchPaperPortfolio()
    } else if (user && tradingMode === 'live') {
      fetchConnectedAccounts()
    } else {
      setIsLoading(false)
    }
  }, [user, tradingMode])

  const fetchConnectedAccounts = async () => {
    try {
      setIsLoading(true)
      const response = await accountsApi.getAll()
      const data = response.data
      
      if (data.accounts) {
        // Transform backend accounts to frontend format
        const transformedAccounts = data.accounts.map(acc => {
          const platform = AVAILABLE_PLATFORMS.find(p => p.id === acc.platform)
          return {
            id: acc.id,
            name: platform?.name || acc.platform,
            balance: formatCurrency(acc.balance),
            rawBalance: acc.balance,
            status: acc.status === 'connected' ? 'Connected' : acc.status,
            type: platform?.type?.split(' ')[0] || 'Platform',
            icon: platform?.icon || '📊',
            lastUpdate: acc.lastBalanceUpdate,
            errorMessage: acc.errorMessage
          }
        })
        setAccounts(transformedAccounts)
      }
    } catch (error) {
      console.error('Failed to fetch connected accounts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefreshBalances = async () => {
    try {
      setIsRefreshing(true)
      const response = await accountsApi.refreshAll()
      const data = response.data
      
      if (data.accounts) {
        const transformedAccounts = data.accounts.map(acc => {
          const platform = AVAILABLE_PLATFORMS.find(p => p.id === acc.platform)
          return {
            id: acc.id,
            name: platform?.name || acc.platform,
            balance: formatCurrency(acc.balance),
            rawBalance: acc.balance,
            status: acc.status === 'connected' ? 'Connected' : acc.status,
            type: platform?.type?.split(' ')[0] || 'Platform',
            icon: platform?.icon || '📊',
            lastUpdate: acc.lastBalanceUpdate,
            errorMessage: acc.errorMessage
          }
        })
        setAccounts(transformedAccounts)
      }
    } catch (error) {
      console.error('Failed to refresh balances:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const fetchPaperPortfolio = async () => {
    try {
      setIsLoading(true)
      const response = await paperTradingApi.getPortfolio()
      const data = response.data
      
      if (data.portfolio) {
        setPaperPortfolio(data.portfolio)
      }
      if (data.positions) {
        setPaperPositions(data.positions)
      }
      if (data.recentTrades) {
        setRecentTrades(data.recentTrades)
      }
    } catch (error) {
      console.error('Failed to fetch paper portfolio:', error)
      // Keep default values on error
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPortfolio = async () => {
    if (!confirm('Are you sure you want to reset your paper trading account? This will clear all trades and reset your balance to $100,000.')) {
      return
    }
    
    try {
      setIsResetting(true)
      await paperTradingApi.resetPortfolio()
      await fetchPaperPortfolio()
    } catch (error) {
      console.error('Failed to reset portfolio:', error)
    } finally {
      setIsResetting(false)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value || 0)
  }

  const formatPercent = (value) => {
    const prefix = value >= 0 ? '+' : ''
    return `${prefix}${(value || 0).toFixed(1)}%`
  }

  const paperAccount = {
    name: 'Paper Trading',
    balance: formatCurrency(paperPortfolio.currentBalance),
    status: 'Active',
    type: 'Simulated',
    icon: '📝'
  }

  const totalBalance = tradingMode === 'paper' 
    ? formatCurrency(paperPortfolio.currentBalance)
    : formatCurrency(accounts.reduce((sum, acc) => sum + (acc.rawBalance || 0), 0))

  const openAddAccount = () => {
    setShowAddAccountModal(true)
    setSelectedPlatform(null)
    setApiCredentials({})
    setShowSecrets({})
    setConnectionSuccess(false)
    setConnectionError(null)
  }

  const selectPlatform = (platform) => {
    setSelectedPlatform(platform)
    setApiCredentials({})
    setShowSecrets({})
  }

  const handleCredentialChange = (fieldId, value) => {
    setApiCredentials(prev => ({ ...prev, [fieldId]: value }))
  }

  const toggleSecretVisibility = (fieldId) => {
    setShowSecrets(prev => ({ ...prev, [fieldId]: !prev[fieldId] }))
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const isFormValid = () => {
    if (!selectedPlatform) return false
    return selectedPlatform.fields.every(field => {
      if (field.id.includes('optional')) return true
      return apiCredentials[field.id]?.trim()
    })
  }

  const handleConnect = async () => {
    if (!isFormValid()) return

    setIsConnecting(true)
    setConnectionError(null)

    try {
      // Call the real API to connect the account
      const response = await accountsApi.connect(selectedPlatform.id, apiCredentials)
      const data = response.data

      if (data.success) {
        // Add the new account from the API response
        const accData = data.account
        const newAccount = {
          id: accData.id,
          name: selectedPlatform.name,
          balance: formatCurrency(accData.balance),
          rawBalance: accData.balance,
          status: 'Connected',
          type: selectedPlatform.type.split(' ')[0],
          icon: selectedPlatform.icon,
          lastUpdate: accData.lastBalanceUpdate
        }

        setAccounts(prev => [...prev, newAccount])
        setConnectionSuccess(true)

        // Track account connection in Google Analytics
        trackAccountConnect(selectedPlatform.name)

        // Close modal after showing success
        setTimeout(() => {
          setShowAddAccountModal(false)
          setSelectedPlatform(null)
          setConnectionSuccess(false)
          setApiCredentials({})
        }, 1500)
      }
    } catch (error) {
      console.error('Failed to connect account:', error)
      setConnectionError(error.message || 'Failed to connect. Please check your credentials.')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async (accountId) => {
    if (!confirm('Are you sure you want to disconnect this account?')) {
      return
    }

    try {
      await accountsApi.disconnect(accountId)
      setAccounts(prev => prev.filter(acc => acc.id !== accountId))
    } catch (error) {
      console.error('Failed to disconnect account:', error)
      alert('Failed to disconnect account. Please try again.')
    }
  }

  const getColorClasses = (color) => {
    const colors = {
      indigo: { bg: 'bg-indigo-50', border: 'border-indigo-500', text: 'text-indigo-600', button: 'bg-indigo-600 hover:bg-indigo-700' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-600', button: 'bg-purple-600 hover:bg-purple-700' },
      violet: { bg: 'bg-violet-50', border: 'border-violet-500', text: 'text-violet-600', button: 'bg-violet-600 hover:bg-violet-700' },
      blue: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-600', button: 'bg-blue-600 hover:bg-blue-700' },
      yellow: { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-600', button: 'bg-yellow-600 hover:bg-yellow-700' },
      teal: { bg: 'bg-teal-50', border: 'border-teal-500', text: 'text-teal-600', button: 'bg-teal-600 hover:bg-teal-700' },
    }
    return colors[color] || colors.indigo
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your connected trading platforms and portfolios.</p>
      </div>

      {/* Paper Trading Notice */}
      {tradingMode === 'paper' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">Paper Trading Mode Active</h3>
              <p className="text-sm text-yellow-700 mt-1">
                You're using simulated funds. Switch to live trading to use real accounts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Paper Trading Mode Content */}
      {tradingMode === 'paper' ? (
        <div className="space-y-6">
          {/* Paper Account Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center text-3xl">
                  {paperAccount.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{paperAccount.name}</h3>
                  <p className="text-sm text-gray-500">{paperAccount.type}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{paperAccount.balance}</p>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                  <Check className="w-3 h-3" />
                  {paperAccount.status}
                </span>
              </div>
            </div>
            
            {/* Paper Trading Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div>
                <p className="text-sm text-gray-500">Total P&L</p>
                <p className={`text-lg font-semibold ${paperPortfolio.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {paperPortfolio.totalPnl >= 0 ? '+' : ''}{formatCurrency(paperPortfolio.totalPnl)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Win Rate</p>
                <p className="text-lg font-semibold text-gray-900">
                  {paperPortfolio.totalTrades > 0 ? `${paperPortfolio.winRate.toFixed(1)}%` : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Trades</p>
                <p className="text-lg font-semibold text-gray-900">{paperPortfolio.totalTrades}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Open Positions</p>
                <p className="text-lg font-semibold text-gray-900">{paperPositions.length}</p>
              </div>
            </div>
            
            {/* Reset Button */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={handleResetPortfolio}
                disabled={isResetting}
                className="text-sm text-gray-500 hover:text-red-600 transition-colors"
              >
                {isResetting ? 'Resetting...' : 'Reset Paper Account to $100,000'}
              </button>
              <button
                onClick={fetchPaperPortfolio}
                disabled={isLoading}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh portfolio"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Open Positions */}
          {paperPositions.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Open Positions</h3>
              <div className="space-y-3">
                {paperPositions.map((position) => (
                  <div key={position.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{position.marketTitle}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {position.quantity} {position.side.toUpperCase()} @ {formatCurrency(position.avgEntryPrice)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${position.unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {position.unrealizedPnl >= 0 ? '+' : ''}{formatCurrency(position.unrealizedPnl)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatPercent(position.unrealizedPnlPercent)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Trades */}
          {recentTrades.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Trades</h3>
              <div className="space-y-2">
                {recentTrades.slice(0, 5).map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm text-gray-900">{trade.action.toUpperCase()} {trade.quantity} {trade.side.toUpperCase()}</p>
                      <p className="text-xs text-gray-500">{trade.marketTitle?.substring(0, 40)}...</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trade.status === 'closed' ? (trade.pnl >= 0 ? '+' : '') + formatCurrency(trade.pnl) : 'Open'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Platforms Preview (Paper Mode) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Available Platforms</h3>
              <span className="text-xs text-gray-500">Switch to Live to connect</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {AVAILABLE_PLATFORMS.map((platform) => {
                const colors = getColorClasses(platform.color)
                return (
                  <div
                    key={platform.id}
                    className="p-4 rounded-xl border-2 border-gray-100 bg-gray-50 opacity-75"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{platform.icon}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">{platform.name}</h4>
                        <p className="text-xs text-gray-500">{platform.type}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {platform.features.slice(0, 2).map((feature, i) => (
                        <span key={i} className={`px-2 py-0.5 text-xs rounded ${colors.bg} ${colors.text}`}>
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Ready for Live Trading CTA */}
            <div className="mt-6 p-5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-4">
                <div className="text-3xl">🚀</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Ready for Live Trading?</h4>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {isPro ? 'Switch to live mode to connect real accounts.' : 'Upgrade to Pro ($9.99/mo) to connect real accounts.'}
                  </p>
                </div>
                <button
                  onClick={() => isPro ? setTradingMode('live') : openUpgradeModal()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  {isPro ? 'Switch to Live' : 'Upgrade to Pro'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Live Trading Mode Content */
        <div className="space-y-6">
          {/* Connected Accounts Section */}
          {accounts.length > 0 && (
            <>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Connected Accounts</h3>
                  <button
                    onClick={handleRefreshBalances}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Refreshing...' : 'Refresh All'}
                  </button>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accounts.map((account) => {
                    const platform = AVAILABLE_PLATFORMS.find(p => p.name === account.name)
                    const colors = platform ? getColorClasses(platform.color) : getColorClasses('indigo')
                    return (
                      <div
                        key={account.id}
                        className={`bg-white rounded-xl p-5 shadow-sm border-2 border-l-4 ${colors.border} hover:shadow-md transition-all`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{account.icon}</span>
                            <div>
                              <h4 className="font-semibold text-gray-900">{account.name}</h4>
                              <p className="text-xs text-gray-500">{account.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Live
                            </span>
                            <button
                              onClick={() => handleDisconnect(account.id)}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              title="Disconnect account"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Balance</p>
                          <p className="text-2xl font-bold text-gray-900">{account.balance}</p>
                          {account.lastUpdate && (
                            <p className="text-xs text-gray-400 mt-1">
                              Updated {new Date(account.lastUpdate).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Total Balance Summary */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg shadow-indigo-500/25">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm">Total Across All Platforms</p>
                    <p className="text-3xl font-bold mt-1">{totalBalance}</p>
                    <p className="text-sm text-indigo-200 mt-1">{accounts.length} platform{accounts.length !== 1 ? 's' : ''} connected</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      <span className="text-lg font-semibold">$0.00 (0.0%)</span>
                    </div>
                    <p className="text-indigo-200 text-sm mt-1">This month</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Available Platforms Grid - 3 and 3 side by side */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">
              {accounts.length > 0 ? 'Connect More Platforms' : 'Connect a Platform to Get Started'}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {AVAILABLE_PLATFORMS.map((platform) => {
                const colors = getColorClasses(platform.color)
                const isConnected = accounts.some(a => a.name === platform.name)
                const isSelected = selectedPlatform?.id === platform.id
                const connectedAccount = accounts.find(a => a.name === platform.name)

                return (
                  <div key={platform.id} className="relative">
                    {/* Platform Card */}
                    <button
                      onClick={() => {
                        if (isConnected) return
                        setSelectedPlatform(isSelected ? null : platform)
                        setApiCredentials({})
                        setShowSecrets({})
                        setConnectionSuccess(false)
                      }}
                      disabled={isConnected}
                      className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                        isConnected
                          ? 'border-green-300 bg-green-50'
                          : isSelected
                          ? `${colors.border} ${colors.bg}`
                          : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{platform.icon}</span>
                          <div>
                            <h4 className="font-semibold text-gray-900">{platform.name}</h4>
                            <p className="text-xs text-gray-500">{platform.type}</p>
                          </div>
                        </div>
                        {isConnected ? (
                          <div className="text-right">
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                              Connected
                            </span>
                            <p className="text-lg font-bold text-gray-900 mt-2">{connectedAccount?.balance}</p>
                          </div>
                        ) : (
                          <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                        )}
                      </div>
                      
                      {/* Description & Features */}
                      {!isConnected && (
                        <>
                          <p className="text-sm text-gray-600 mt-3 line-clamp-2">{platform.description}</p>
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {platform.features.map((feature, i) => (
                              <span key={i} className={`px-2 py-0.5 text-xs rounded ${colors.bg} ${colors.text}`}>
                                {feature}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </button>

                    {/* Expanded Setup Form */}
                    {isSelected && !isConnected && (
                      <div className={`mt-3 p-5 rounded-xl border-2 ${colors.border} ${colors.bg} animate-in slide-in-from-top-2 duration-200`}>
                        {connectionSuccess ? (
                          <div className="text-center py-6">
                            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Check className="w-7 h-7 text-green-600" />
                            </div>
                            <p className="font-semibold text-gray-900">Connected Successfully!</p>
                            <p className="text-sm text-gray-500 mt-1">Your {platform.name} account is now linked.</p>
                          </div>
                        ) : (
                          <>
                            {/* Setup Steps */}
                            <div className="mb-5">
                              <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                <Key className="w-4 h-4" />
                                How to get your API keys
                              </p>
                              <ol className="text-sm text-gray-600 space-y-1.5">
                                {platform.setupSteps.map((step, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="flex-shrink-0 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                                      {i + 1}
                                    </span>
                                    <span className="pt-0.5">{step}</span>
                                  </li>
                                ))}
                              </ol>
                              <a
                                href={platform.apiDocsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1 mt-3 text-sm ${colors.text} hover:underline`}
                              >
                                View API Documentation <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>

                            {/* Credential Fields */}
                            <div className="space-y-4">
                              <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Enter your credentials
                              </p>
                              {platform.fields.map((field) => (
                                <div key={field.id}>
                                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {field.label}
                                  </label>
                                  <div className="relative">
                                    {field.isMultiline ? (
                                      <textarea
                                        value={apiCredentials[field.id] || ''}
                                        onChange={(e) => handleCredentialChange(field.id, e.target.value)}
                                        placeholder={field.placeholder}
                                        rows={6}
                                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white font-mono text-xs resize-none"
                                        style={{ whiteSpace: 'pre-wrap' }}
                                      />
                                    ) : (
                                      <input
                                        type={field.isSecret && !showSecrets[field.id] ? 'password' : 'text'}
                                        value={apiCredentials[field.id] || ''}
                                        onChange={(e) => handleCredentialChange(field.id, e.target.value)}
                                        placeholder={field.placeholder}
                                        className="w-full px-4 py-3 pr-16 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                      />
                                    )}
                                    {!field.isMultiline && (
                                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                        {field.isSecret && (
                                          <button
                                            type="button"
                                            onClick={() => toggleSecretVisibility(field.id)}
                                            className="p-1.5 text-gray-400 hover:text-gray-600"
                                          >
                                            {showSecrets[field.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Security Notice */}
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <Shield className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs font-medium text-green-800">Your credentials are secure</p>
                                  <p className="text-xs text-green-700 mt-0.5">
                                    Encrypted with AES-256. Never stored in plain text.
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Connection Error */}
                            {connectionError && (
                              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-xs font-medium text-red-800">Connection Failed</p>
                                    <p className="text-xs text-red-700 mt-0.5">
                                      {connectionError}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Connect Button */}
                            <button
                              onClick={handleConnect}
                              disabled={!isFormValid() || isConnecting}
                              className={`w-full mt-5 py-3 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                                isFormValid() && !isConnecting
                                  ? `${colors.button} shadow-md hover:shadow-lg`
                                  : 'bg-gray-300 cursor-not-allowed'
                              }`}
                            >
                              {isConnecting ? (
                                <>
                                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  Connecting...
                                </>
                              ) : (
                                <>
                                  <Shield className="w-5 h-5" />
                                  Connect {platform.name}
                                </>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Accounts

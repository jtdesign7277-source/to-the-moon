import { useState } from 'react'
import { Plus, AlertCircle, Check, TrendingUp, X, ExternalLink, Eye, EyeOff, Copy, Shield, Key, ChevronRight, ArrowLeft } from 'lucide-react'
import { useApp } from '../hooks/useApp'
import { trackAccountConnect } from '../utils/analytics'

// Available platforms to connect
const AVAILABLE_PLATFORMS = [
  {
    id: 'kalshi',
    name: 'Kalshi',
    icon: '🎯',
    type: 'Prediction Market',
    description: 'CFTC-regulated prediction market for trading on real-world events.',
    features: ['Regulated in US', 'Real USD trading', 'Event contracts'],
    apiDocsUrl: 'https://trading-api.readme.io/reference/getting-started',
    setupSteps: [
      'Log in to your Kalshi account at kalshi.com',
      'Navigate to Settings → API Keys',
      'Click "Create New API Key"',
      'Copy your API Key ID and Secret Key (store secret safely, it won\'t be shown again)',
      'Paste both keys below to connect your account'
    ],
    fields: [
      { id: 'apiKeyId', label: 'API Key ID', placeholder: 'Enter your Kalshi API Key ID' },
      { id: 'apiSecret', label: 'API Secret Key', placeholder: 'Enter your Kalshi API Secret', isSecret: true }
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
  const { tradingMode } = useApp()
  const [showAddAccountModal, setShowAddAccountModal] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [apiCredentials, setApiCredentials] = useState({})
  const [showSecrets, setShowSecrets] = useState({})
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionSuccess, setConnectionSuccess] = useState(false)

  const [accounts, setAccounts] = useState([
    { id: 1, name: 'Kalshi', balance: '$24,500.00', status: 'Connected', type: 'Prediction', icon: '🎯' },
    { id: 2, name: 'Polymarket', balance: '$12,350.00', status: 'Connected', type: 'Prediction', icon: '📊' },
    { id: 3, name: 'Manifold', balance: '$8,420.00', status: 'Connected', type: 'Prediction', icon: '🔮' },
  ])

  const paperAccount = {
    name: 'Paper Trading',
    balance: '$100,000.00',
    status: 'Active',
    type: 'Simulated',
    icon: '📝'
  }

  const totalBalance = tradingMode === 'paper' ? '$100,000.00' : '$' + accounts.reduce((sum, acc) => {
    return sum + parseFloat(acc.balance.replace(/[$,]/g, ''))
  }, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })

  const openAddAccount = () => {
    setShowAddAccountModal(true)
    setSelectedPlatform(null)
    setApiCredentials({})
    setShowSecrets({})
    setConnectionSuccess(false)
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

    // Simulate API connection
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Add the new account
    const newAccount = {
      id: Date.now(),
      name: selectedPlatform.name,
      balance: '$0.00',
      status: 'Connected',
      type: selectedPlatform.type.split(' ')[0],
      icon: selectedPlatform.icon
    }

    setAccounts(prev => [...prev, newAccount])
    setIsConnecting(false)
    setConnectionSuccess(true)

    // Track account connection in Google Analytics
    trackAccountConnect(selectedPlatform.name)

    // Close modal after showing success
    setTimeout(() => {
      setShowAddAccountModal(false)
      setSelectedPlatform(null)
      setConnectionSuccess(false)
    }, 1500)
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your connected trading platforms.</p>
        </div>
        <button
          onClick={openAddAccount}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25"
        >
          <Plus className="w-4 h-4" />
          Add Account
        </button>
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

      {/* Total Balance Card */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg shadow-indigo-500/25">
        <p className="text-indigo-100 text-sm">Total Balance</p>
        <p className="text-3xl font-bold mt-1">{totalBalance}</p>
        <div className="flex items-center gap-2 mt-2">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm">+$4,230.50 (7.4%) this month</span>
        </div>
      </div>

      {/* Account Cards */}
      <div className="grid gap-4">
        {tradingMode === 'paper' ? (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-2xl">
                  {paperAccount.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{paperAccount.name}</h3>
                  <p className="text-sm text-gray-500">{paperAccount.type}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{paperAccount.balance}</p>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                  <Check className="w-3 h-3" />
                  {paperAccount.status}
                </span>
              </div>
            </div>
          </div>
        ) : (
          accounts.map((account) => (
            <div
              key={account.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl">
                    {account.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{account.name}</h3>
                    <p className="text-sm text-gray-500">{account.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">{account.balance}</p>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                    <Check className="w-3 h-3" />
                    {account.status}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Add Account Card (when in live mode) */}
        {tradingMode !== 'paper' && (
          <button
            onClick={openAddAccount}
            className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group"
          >
            <div className="flex items-center justify-center gap-3 text-gray-500 group-hover:text-indigo-600">
              <Plus className="w-5 h-5" />
              <span className="font-medium">Connect Another Account</span>
            </div>
          </button>
        )}
      </div>

      {/* Add Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedPlatform && (
                    <button
                      onClick={() => setSelectedPlatform(null)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedPlatform ? `Connect ${selectedPlatform.name}` : 'Add Trading Account'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {selectedPlatform ? 'Enter your API credentials to connect' : 'Select a platform to connect'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddAccountModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {connectionSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Connected Successfully!</h3>
                  <p className="text-gray-500 mt-2">Your {selectedPlatform?.name} account is now linked.</p>
                </div>
              ) : !selectedPlatform ? (
                // Platform Selection Grid
                <div className="grid sm:grid-cols-2 gap-4">
                  {AVAILABLE_PLATFORMS.map((platform) => {
                    const colors = getColorClasses(platform.color)
                    const isConnected = accounts.some(a => a.name === platform.name)

                    return (
                      <button
                        key={platform.id}
                        onClick={() => !isConnected && selectPlatform(platform)}
                        disabled={isConnected}
                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                          isConnected
                            ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                            : `border-gray-100 hover:${colors.border} hover:${colors.bg}`
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-3xl">{platform.icon}</span>
                          {isConnected && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                              Connected
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-900 mt-3">{platform.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{platform.type}</p>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{platform.description}</p>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {platform.features.map((feature, i) => (
                            <span key={i} className={`px-2 py-0.5 ${colors.bg} ${colors.text} text-xs rounded`}>
                              {feature}
                            </span>
                          ))}
                        </div>
                        {!isConnected && (
                          <div className={`flex items-center gap-1 mt-3 ${colors.text} text-sm font-medium`}>
                            Connect
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              ) : (
                // Platform Setup Form
                <div className="space-y-6">
                  {/* Platform Info */}
                  <div className={`p-4 rounded-xl ${getColorClasses(selectedPlatform.color).bg}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{selectedPlatform.icon}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">{selectedPlatform.name}</h4>
                        <p className="text-sm text-gray-600">{selectedPlatform.type}</p>
                      </div>
                    </div>
                  </div>

                  {/* Setup Instructions */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      How to get your API keys
                    </h4>
                    <ol className="space-y-2">
                      {selectedPlatform.setupSteps.map((step, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                            {i + 1}
                          </span>
                          <span className="text-gray-600 pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                    <a
                      href={selectedPlatform.apiDocsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 mt-3 text-sm ${getColorClasses(selectedPlatform.color).text} hover:underline`}
                    >
                      View API Documentation
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Credential Fields */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Enter your credentials
                    </h4>
                    {selectedPlatform.fields.map((field) => (
                      <div key={field.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {field.label}
                        </label>
                        <div className="relative">
                          <input
                            type={field.isSecret && !showSecrets[field.id] ? 'password' : 'text'}
                            value={apiCredentials[field.id] || ''}
                            onChange={(e) => handleCredentialChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full px-4 py-3 pr-20 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            {field.isSecret && (
                              <button
                                type="button"
                                onClick={() => toggleSecretVisibility(field.id)}
                                className="p-2 text-gray-400 hover:text-gray-600"
                              >
                                {showSecrets[field.id] ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            {apiCredentials[field.id] && (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(apiCredentials[field.id])}
                                className="p-2 text-gray-400 hover:text-gray-600"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Security Notice */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-800 text-sm">Your credentials are secure</h4>
                        <p className="text-xs text-green-700 mt-1">
                          We encrypt all API keys using AES-256 encryption. Your credentials are never stored in plain text and are only used to execute trades on your behalf.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {selectedPlatform && !connectionSuccess && (
              <div className="p-6 border-t border-gray-100">
                <button
                  onClick={handleConnect}
                  disabled={!isFormValid() || isConnecting}
                  className={`w-full py-3 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                    isFormValid() && !isConnecting
                      ? `${getColorClasses(selectedPlatform.color).button} shadow-lg`
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
                      Connect {selectedPlatform.name}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Accounts

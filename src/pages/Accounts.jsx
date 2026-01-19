import { Plus, AlertCircle, Check, TrendingUp } from 'lucide-react'
import { useApp } from '../hooks/useApp'

const Accounts = () => {
  const { tradingMode } = useApp()

  const accounts = [
    { name: 'Kalshi', balance: '$24,500.00', status: 'Connected', type: 'Prediction', icon: '🎯' },
    { name: 'Polymarket', balance: '$12,350.00', status: 'Connected', type: 'Prediction', icon: '📊' },
    { name: 'Manifold', balance: '$8,420.00', status: 'Connected', type: 'Prediction', icon: '🔮' },
    { name: 'Binance', balance: '$15,780.00', status: 'Connected', type: 'Exchange', icon: '💰' },
  ]

  const paperAccount = {
    name: 'Paper Trading',
    balance: '$100,000.00',
    status: 'Active',
    type: 'Simulated',
    icon: '📝'
  }

  const totalBalance = tradingMode === 'paper' ? '$100,000.00' : '$61,050.00'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your connected trading platforms.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25">
          <Plus className="w-4 h-4" />
          Connect Account
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
          accounts.map((account, i) => (
            <div
              key={i}
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
      </div>
    </div>
  )
}

export default Accounts

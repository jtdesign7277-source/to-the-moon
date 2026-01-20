import { useState, useEffect } from 'react'
import { X, TrendingUp, TrendingDown, AlertCircle, ExternalLink, Zap, DollarSign, Percent } from 'lucide-react'

const TradeTicket = ({ opportunity, onClose, onSubmit }) => {
  const [position, setPosition] = useState('yes') // 'yes' or 'no'
  const [amount, setAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  if (!opportunity) return null

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    
    setIsSubmitting(true)
    
    // Simulate order submission
    await new Promise(resolve => setTimeout(resolve, 800))
    
    onSubmit?.({
      ...opportunity,
      position,
      amount: parseFloat(amount),
      timestamp: new Date().toISOString()
    })
    
    setIsSubmitting(false)
    onClose()
  }

  const getPlatformColor = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'kalshi': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'polymarket': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'predictit': return 'bg-green-100 text-green-700 border-green-200'
      case 'manifold': return 'bg-orange-100 text-orange-700 border-orange-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const estimatedPayout = amount ? (parseFloat(amount) / (opportunity.price / 100)).toFixed(2) : '0.00'
  const potentialProfit = amount ? (estimatedPayout - parseFloat(amount)).toFixed(2) : '0.00'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getPlatformColor(opportunity.platform)}`}>
                  {opportunity.platform}
                </span>
                {opportunity.edge > 0 && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-100 border border-green-400/30">
                    +{opportunity.edge}% edge
                  </span>
                )}
              </div>
              <h2 className="font-semibold text-lg leading-tight">
                {opportunity.market}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Strategy Badge */}
          {opportunity.strategy && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
              <Zap className="w-4 h-4 text-indigo-500" />
              <span>Found by: <span className="font-medium text-gray-900">{opportunity.strategy}</span></span>
            </div>
          )}

          {/* Current Price Display */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Current Price</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-gray-900">{opportunity.price}¢</span>
                <span className="text-sm text-gray-500 ml-1">/ share</span>
              </div>
            </div>
            {opportunity.volume && (
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-500">24h Volume</span>
                <span className="text-xs font-medium text-gray-700">${opportunity.volume.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Position Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPosition('yes')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
                  position === 'yes'
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Yes / Long
              </button>
              <button
                onClick={() => setPosition('no')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
                  position === 'no'
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <TrendingDown className="w-4 h-4" />
                No / Short
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="1"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg font-medium"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {[5, 10, 25, 50, 100].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset.toString())}
                  className="flex-1 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  ${preset}
                </button>
              ))}
            </div>
          </div>

          {/* Payout Estimate */}
          {amount && parseFloat(amount) > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <Percent className="w-4 h-4" />
                <span className="text-sm font-medium">Potential Return</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-600">If {position === 'yes' ? 'Yes' : 'No'} wins</p>
                  <p className="text-2xl font-bold text-green-700">${estimatedPayout}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-600">Profit</p>
                  <p className="text-lg font-bold text-green-700">+${potentialProfit}</p>
                </div>
              </div>
            </div>
          )}

          {/* Paper Trading Warning */}
          <div className="flex items-start gap-2 text-amber-700 bg-amber-50 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="text-xs">
              This is a <span className="font-medium">paper trade</span>. No real money will be used. 
              Connect a real account to place live trades.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!amount || parseFloat(amount) <= 0 || isSubmitting}
            className={`flex-1 py-3 px-4 font-medium rounded-xl transition-all flex items-center justify-center gap-2 ${
              !amount || parseFloat(amount) <= 0 || isSubmitting
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : position === 'yes'
                  ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25'
                  : 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Placing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Place Trade
              </>
            )}
          </button>
        </div>

        {/* External Link */}
        {opportunity.url && (
          <div className="px-4 pb-4 bg-gray-50">
            <a
              href={opportunity.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              View on {opportunity.platform}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default TradeTicket

import { useEffect } from 'react'
import { X, TrendingUp, TrendingDown, Clock, DollarSign, ExternalLink, Receipt, Calendar } from 'lucide-react'

const TradeSlipViewer = ({ trade, onClose }) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  if (!trade) return null

  // Parse platform from trade pair (e.g., "Bitcoin above $100K (Kalshi)")
  const platformMatch = trade.pair?.match(/\(([^)]+)\)/)
  const platform = platformMatch ? platformMatch[1] : 'Unknown'
  const marketName = trade.pair?.replace(/\s*\([^)]+\)\s*$/, '') || trade.pair

  const getPlatformInfo = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'kalshi':
        return { color: 'bg-blue-100 text-blue-700', url: 'https://kalshi.com' }
      case 'polymarket':
        return { color: 'bg-purple-100 text-purple-700', url: 'https://polymarket.com' }
      case 'manifold':
        return { color: 'bg-orange-100 text-orange-700', url: 'https://manifold.markets' }
      default:
        return { color: 'bg-gray-100 text-gray-700', url: null }
    }
  }

  const platformInfo = getPlatformInfo(platform)
  const isWin = trade.status === 'Won'
  const isOpen = trade.status === 'Open' || trade.exit === 'Pending'
  const isPnlPositive = trade.pnl?.startsWith('+')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`p-4 text-white ${
          isOpen ? 'bg-gradient-to-r from-indigo-500 to-purple-600' :
          isWin ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
          'bg-gradient-to-r from-red-500 to-rose-600'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              <span className="font-semibold">Bet Slip</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-3">
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${platformInfo.color}`}>
              {platform}
            </span>
          </div>
          <h2 className="font-semibold text-lg mt-2 leading-tight">
            {marketName}
          </h2>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Position & Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {trade.type === 'Long' ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full font-medium text-sm">
                  <TrendingUp className="w-4 h-4" />
                  Yes / Long
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-full font-medium text-sm">
                  <TrendingDown className="w-4 h-4" />
                  No / Short
                </div>
              )}
            </div>
            <div className={`px-3 py-1.5 rounded-full font-medium text-sm ${
              isOpen ? 'bg-indigo-100 text-indigo-700' :
              isWin ? 'bg-green-100 text-green-700' :
              'bg-red-100 text-red-700'
            }`}>
              {isOpen ? '⏳ Open' : isWin ? '✓ Won' : '✗ Lost'}
            </div>
          </div>

          {/* Trade Details */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Entry Price</span>
              <span className="font-semibold text-gray-900">{trade.entry}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Exit Price</span>
              <span className={`font-semibold ${trade.exit === 'Pending' ? 'text-indigo-600' : 'text-gray-900'}`}>
                {trade.exit}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">P&L</span>
              <span className={`text-lg font-bold ${
                isOpen ? 'text-indigo-600' :
                isPnlPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trade.pnl}
              </span>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{trade.timestamp ? new Date(trade.timestamp).toLocaleDateString() : 'Today'}</span>
            </div>
            {trade.strategy && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{trade.strategy}</span>
              </div>
            )}
          </div>

          {/* Paper Trade Notice */}
          <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-lg p-3">
            <DollarSign className="w-4 h-4 flex-shrink-0" />
            <p className="text-xs">
              This is a <span className="font-medium">paper trade</span> — no real money involved.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
          {platformInfo.url && (
            <a
              href={platformInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View on {platform}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default TradeSlipViewer

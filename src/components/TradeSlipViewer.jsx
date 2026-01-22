import { useEffect } from 'react'
import { X, DollarSign, Receipt, Calendar, Clock, Target, Zap } from 'lucide-react'

const TradeSlipViewer = ({ trade, onClose, onCloseBet }) => {
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
  const platform = trade.platform || (platformMatch ? platformMatch[1] : 'Kalshi')
  const marketName = trade.event || trade.pair?.replace(/\s*\([^)]+\)\s*$/, '') || trade.pair
  const ticker = trade.ticker || trade.id || 'TRADE'

  // Parse entry price from trade.entry (e.g., "$0.42") or use numeric value
  const entryPrice = typeof trade.entry === 'string' 
    ? parseFloat(trade.entry.replace('$', '')) 
    : (trade.entryPrice || trade.entry || 0.50)
  
  // Current price - calculate based on position or use entry if not available
  const currentPrice = trade.currentPrice || entryPrice * 1.1 // Default 10% gain
  
  // Contracts from amount or default
  const contracts = trade.contracts || (trade.amount ? Math.round(trade.amount / entryPrice) : 100)
  
  // Position type
  const position = trade.position || (trade.type === 'Long' ? 'YES' : trade.type === 'Short' ? 'NO' : 'YES')
  
  // Strategy
  const strategy = trade.strategy || 'Manual'
  
  // Calculate P&L
  const pnlValue = trade.profit || (currentPrice - entryPrice) * contracts
  const pnlPercent = trade.profitPercent || ((currentPrice - entryPrice) / entryPrice * 100)
  
  // Potential payout
  const potentialPayout = trade.potentialPayout || contracts * 1.00
  
  // Dates
  const placedAt = trade.placedAt || trade.timestamp || new Date()
  const expiresAt = trade.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  
  // Status
  const isOpen = trade.status === 'Open' || trade.exit === 'Pending' || !trade.closedAt
  const isPaperTrade = trade.is_paper !== false

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatExpiryDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const daysUntilExpiry = Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-[520px] max-w-[95vw]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] bg-[#F9FAFB] rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#10B981]/10 rounded-lg">
              <Receipt className="w-5 h-5 text-[#10B981]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[#111827] text-lg">Bet Slip</h3>
                {isPaperTrade && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-yellow-400 text-yellow-900">
                    PAPER
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B7280] font-mono">#{ticker}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#374151] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Market Info */}
          <div className="text-center pb-4 border-b border-[#E5E7EB]">
            <p className="text-lg font-semibold text-[#111827]">{marketName}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-sm text-[#6B7280] font-mono">{ticker}</span>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                platform === 'Kalshi' ? 'bg-[#DBEAFE] text-[#1D4ED8]' :
                platform === 'Polymarket' ? 'bg-[#EDE9FE] text-[#7C3AED]' :
                platform === 'Manifold' ? 'bg-[#FFEDD5] text-[#C2410C]' :
                'bg-[#F3F4F6] text-[#374151]'
              }`}>
                {platform}
              </span>
            </div>
          </div>
          
          {/* Position Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB]">
              <div className="flex items-center gap-2 text-[#6B7280] text-xs mb-1">
                <Target className="w-3.5 h-3.5" />
                Position
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-sm font-bold rounded ${
                  position === 'YES' ? 'bg-[#D1FAE5] text-[#059669]' : 'bg-[#FEE2E2] text-[#DC2626]'
                }`}>
                  {position}
                </span>
                <span className="text-[#111827] font-semibold">{contracts} contracts</span>
              </div>
            </div>
            <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB]">
              <div className="flex items-center gap-2 text-[#6B7280] text-xs mb-1">
                <Zap className="w-3.5 h-3.5" />
                Strategy
              </div>
              <span className="text-[#111827] font-semibold text-sm">{strategy}</span>
            </div>
          </div>
          
          {/* Price Info */}
          <div className="bg-[#F9FAFB] rounded-xl p-4 space-y-3 text-sm font-mono border border-[#E5E7EB]">
            <div className="flex justify-between">
              <span className="text-[#6B7280] flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5" />
                Entry Price
              </span>
              <span className="text-[#111827] font-medium">${entryPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Current Price</span>
              <span className={`font-medium ${
                currentPrice > entryPrice ? 'text-[#10B981]' : 
                currentPrice < entryPrice ? 'text-[#EF4444]' : 'text-[#111827]'
              }`}>
                ${currentPrice.toFixed(2)}
                {currentPrice !== entryPrice && (
                  <span className="ml-1 text-xs">
                    ({currentPrice > entryPrice ? '+' : ''}{((currentPrice - entryPrice) / entryPrice * 100).toFixed(1)}%)
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Potential Payout</span>
              <span className="text-[#111827] font-medium">${potentialPayout.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-[#E5E7EB] pt-3 mt-3">
              <span className="text-[#111827] font-bold">Unrealized P&L</span>
              <span className={`font-bold ${pnlValue >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {pnlValue >= 0 ? '+' : ''}${pnlValue.toFixed(2)} ({pnlValue >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%)
              </span>
            </div>
          </div>
          
          {/* Timing Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB]">
              <div className="flex items-center gap-2 text-[#6B7280] text-xs mb-1">
                <Clock className="w-3.5 h-3.5" />
                Placed
              </div>
              <span className="text-[#111827] text-sm">{formatDate(placedAt)}</span>
            </div>
            <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB]">
              <div className="flex items-center gap-2 text-[#6B7280] text-xs mb-1">
                <Calendar className="w-3.5 h-3.5" />
                Expires
              </div>
              <span className="text-[#111827] text-sm">{formatExpiryDate(expiresAt)}</span>
              <span className={`ml-2 text-xs font-medium ${
                daysUntilExpiry <= 7 ? 'text-[#EF4444]' : 
                daysUntilExpiry <= 30 ? 'text-[#F59E0B]' : 'text-[#6B7280]'
              }`}>
                ({daysUntilExpiry > 0 ? daysUntilExpiry : 0}d)
              </span>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="flex items-center justify-center">
            {isOpen ? (
              <span className="px-4 py-2 bg-[#D1FAE5] text-[#059669] text-sm font-semibold rounded-full flex items-center gap-2">
                <span className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
                Position Active
              </span>
            ) : (
              <span className={`px-4 py-2 text-sm font-semibold rounded-full ${
                pnlValue >= 0 ? 'bg-[#D1FAE5] text-[#059669]' : 'bg-[#FEE2E2] text-[#DC2626]'
              }`}>
                {pnlValue >= 0 ? '✓ Won' : '✗ Lost'}
              </span>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-[#E5E7EB] bg-[#F9FAFB] rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white hover:bg-[#F3F4F6] text-[#374151] rounded-lg transition-colors border border-[#D1D5DB] font-medium"
          >
            Close
          </button>
          {isOpen && onCloseBet && (
            <button
              onClick={() => {
                onCloseBet(trade.id, currentPrice);
                onClose();
              }}
              className="flex-1 px-4 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-lg font-semibold transition-colors shadow-sm"
            >
              Close Position
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default TradeSlipViewer

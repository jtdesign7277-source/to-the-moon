import { useState, useEffect } from 'react'
import { X, Target, Zap, DollarSign, Clock, Calendar, Receipt, CheckCircle, AlertCircle } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const TradeTicket = ({ opportunity, onClose, onSubmit, tradingMode = 'paper', isPro = false }) => {
  const [position, setPosition] = useState('YES')
  const [contracts, setContracts] = useState(100)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  
  const isLiveMode = tradingMode === 'live'

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  if (!opportunity) return null

  // Calculate values
  const entryPrice = opportunity.price / 100 // Convert cents to dollars
  const totalCost = (entryPrice * contracts).toFixed(2)
  const potentialPayout = (contracts * 1.00).toFixed(2) // $1 per contract if wins
  const potentialProfit = (potentialPayout - totalCost).toFixed(2)

  const handleSubmit = async () => {
    if (contracts <= 0) return
    
    if (isLiveMode && !isPro) {
      setSubmitError('Pro subscription required for live trading')
      return
    }
    
    setIsSubmitting(true)
    setSubmitError(null)

    const tradeData = {
      pair: `${opportunity.market} (${opportunity.platform})`,
      type: position === 'YES' ? 'Long' : 'Short',
      entry: `$${entryPrice.toFixed(2)}`,
      exit: 'Pending',
      pnl: `$${totalCost}`,
      status: 'Open',
      platform: opportunity.platform,
      strategy: opportunity.strategy || 'Manual',
      amount: parseFloat(totalCost),
      is_paper: !isLiveMode
    }

    try {
      const token = localStorage.getItem('ttm_access_token')
      
      if (!token) {
        setSubmitError('Please log in to place trades')
        setIsSubmitting(false)
        return
      }

      const response = await fetch(`${API_URL}/api/user/trades`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tradeData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to place trade')
      }
      
      setSubmitSuccess(true)
      onSubmit?.({
        ...opportunity,
        ...tradeData,
        position,
        contracts,
        timestamp: new Date().toISOString()
      })
      
      setTimeout(() => {
        setIsSubmitting(false)
        onClose()
      }, 1500)
      
    } catch (error) {
      console.error('Failed to place trade:', error)
      setSubmitError(error.message || 'Failed to place trade. Please try again.')
      setIsSubmitting(false)
    }
  }

  const getPlatformStyle = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'kalshi': return 'bg-[#DBEAFE] text-[#1D4ED8]'
      case 'polymarket': return 'bg-[#EDE9FE] text-[#7C3AED]'
      case 'manifold': return 'bg-[#FFEDD5] text-[#C2410C]'
      default: return 'bg-[#F3F4F6] text-[#374151]'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-[520px] max-w-[95vw]">
        {/* Header - Matches Bet Slip exactly */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] bg-[#F9FAFB] rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#10B981]/10 rounded-lg">
              <Receipt className="w-5 h-5 text-[#10B981]" />
            </div>
            <div>
              <h3 className="font-bold text-[#111827] text-lg">Bet Slip</h3>
              <p className="text-xs text-[#6B7280] font-mono">New Trade</p>
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
            <p className="text-lg font-semibold text-[#111827]">{opportunity.market}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              {opportunity.ticker && (
                <span className="text-sm text-[#6B7280] font-mono">{opportunity.ticker}</span>
              )}
              <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getPlatformStyle(opportunity.platform)}`}>
                {opportunity.platform}
              </span>
            </div>
          </div>
          
          {/* Position Selector - Grid layout like Bet Slip */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB]">
              <div className="flex items-center gap-2 text-[#6B7280] text-xs mb-2">
                <Target className="w-3.5 h-3.5" />
                Position
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPosition('YES')}
                  className={`flex-1 px-3 py-2 text-sm font-bold rounded transition-all ${
                    position === 'YES' 
                      ? 'bg-[#D1FAE5] text-[#059669] ring-2 ring-[#10B981]' 
                      : 'bg-white text-[#6B7280] border border-[#E5E7EB] hover:border-[#10B981]'
                  }`}
                >
                  YES
                </button>
                <button
                  onClick={() => setPosition('NO')}
                  className={`flex-1 px-3 py-2 text-sm font-bold rounded transition-all ${
                    position === 'NO' 
                      ? 'bg-[#FEE2E2] text-[#DC2626] ring-2 ring-[#EF4444]' 
                      : 'bg-white text-[#6B7280] border border-[#E5E7EB] hover:border-[#EF4444]'
                  }`}
                >
                  NO
                </button>
              </div>
            </div>
            <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB]">
              <div className="flex items-center gap-2 text-[#6B7280] text-xs mb-2">
                <Zap className="w-3.5 h-3.5" />
                Strategy
              </div>
              <span className="text-[#111827] font-semibold text-sm">{opportunity.strategy || 'Manual'}</span>
            </div>
          </div>

          {/* Contracts Input */}
          <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB]">
            <div className="flex items-center gap-2 text-[#6B7280] text-xs mb-2">
              <DollarSign className="w-3.5 h-3.5" />
              Contracts
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={contracts}
                onChange={(e) => setContracts(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className="flex-1 px-3 py-2 border border-[#E5E7EB] rounded-lg text-lg font-bold text-[#111827] focus:ring-2 focus:ring-[#10B981] focus:border-transparent outline-none"
              />
              <div className="flex gap-1">
                {[10, 50, 100, 200].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setContracts(preset)}
                    className={`px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                      contracts === preset
                        ? 'bg-[#10B981] text-white'
                        : 'bg-white text-[#6B7280] border border-[#E5E7EB] hover:border-[#10B981]'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Price Info - Matches Bet Slip exactly */}
          <div className="bg-[#F9FAFB] rounded-xl p-4 space-y-3 text-sm font-mono border border-[#E5E7EB]">
            <div className="flex justify-between">
              <span className="text-[#6B7280] flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5" />
                Entry Price
              </span>
              <span className="text-[#111827] font-medium">${entryPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Total Cost</span>
              <span className="text-[#111827] font-medium">${totalCost}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Potential Payout</span>
              <span className="text-[#111827] font-medium">${potentialPayout}</span>
            </div>
            <div className="flex justify-between border-t border-[#E5E7EB] pt-3 mt-3">
              <span className="text-[#111827] font-bold">Potential Profit</span>
              <span className="font-bold text-[#10B981]">
                +${potentialProfit} (+{((parseFloat(potentialProfit) / parseFloat(totalCost)) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
          
          {/* Trading Mode Notice */}
          {isLiveMode ? (
            <div className="flex items-center justify-center">
              <span className="px-4 py-2 bg-[#D1FAE5] text-[#059669] text-sm font-semibold rounded-full flex items-center gap-2">
                <span className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
                Live Trading
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <span className="px-4 py-2 bg-[#FEF3C7] text-[#D97706] text-sm font-semibold rounded-full flex items-center gap-2">
                <span className="w-2 h-2 bg-[#F59E0B] rounded-full" />
                Paper Trading
              </span>
            </div>
          )}

          {/* Error Display */}
          {submitError && (
            <div className="flex items-start gap-2 text-[#DC2626] bg-[#FEF2F2] rounded-lg p-3 border border-[#FECACA]">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-sm">{submitError}</p>
            </div>
          )}
        </div>
        
        {/* Footer - Matches Bet Slip exactly */}
        <div className="flex gap-3 px-5 py-4 border-t border-[#E5E7EB] bg-[#F9FAFB] rounded-b-2xl">
          {submitSuccess ? (
            <div className="flex-1 px-4 py-2.5 bg-[#10B981] text-white rounded-lg font-semibold flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {isLiveMode ? 'Trade Executed!' : 'Paper Trade Placed!'}
            </div>
          ) : (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-white hover:bg-[#F3F4F6] text-[#374151] rounded-lg transition-colors border border-[#D1D5DB] font-medium"
              >
                Close
              </button>
              <button
                onClick={handleSubmit}
                disabled={contracts <= 0 || isSubmitting}
                className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-colors shadow-sm flex items-center justify-center gap-2 ${
                  contracts <= 0 || isSubmitting
                    ? 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
                    : 'bg-[#10B981] hover:bg-[#059669] text-white'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Placing...
                  </>
                ) : (
                  'Place Trade'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default TradeTicket

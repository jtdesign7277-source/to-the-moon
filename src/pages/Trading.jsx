import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { createChart, ColorType, CrosshairMode, CandlestickSeries } from 'lightweight-charts'
import {
  Search,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  X,
  ChevronUp,
  ChevronDown,
  Plus,
  Minus,
  Star,
  StarOff,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Zap,
  AlertCircle,
  Check,
  Loader2,
  Briefcase,
  DollarSign,
  BarChart3,
  Activity,
  Eye,
  EyeOff,
} from 'lucide-react'
import { alpacaApi, accountsApi } from '../utils/api'
import { useApp } from '../hooks/useApp'

// Default watchlist symbols
const DEFAULT_WATCHLIST = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'SPY']

// Format currency
const formatCurrency = (value, compact = false) => {
  if (value === null || value === undefined) return '—'
  const num = parseFloat(value)
  if (compact && Math.abs(num) >= 1000000) {
    return `$${(num / 1000000).toFixed(2)}M`
  }
  if (compact && Math.abs(num) >= 1000) {
    return `$${(num / 1000).toFixed(1)}K`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

// Format percentage
const formatPercent = (value) => {
  if (value === null || value === undefined) return '—'
  const num = parseFloat(value)
  const sign = num >= 0 ? '+' : ''
  return `${sign}${num.toFixed(2)}%`
}

// Animated number component for price changes
const AnimatedPrice = ({ value, prevValue, className = '' }) => {
  const [flash, setFlash] = useState(null)

  useEffect(() => {
    if (prevValue && value !== prevValue) {
      setFlash(value > prevValue ? 'green' : 'red')
      const timer = setTimeout(() => setFlash(null), 300)
      return () => clearTimeout(timer)
    }
  }, [value, prevValue])

  return (
    <motion.span
      className={`${className} ${flash === 'green' ? 'text-green-500' : flash === 'red' ? 'text-red-500' : ''}`}
      animate={flash ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.2 }}
    >
      {formatCurrency(value)}
    </motion.span>
  )
}

// Market status indicator
const MarketStatus = ({ isOpen, nextChange }) => (
  <div className="flex items-center gap-2">
    <div className="relative flex items-center gap-1.5">
      <motion.div
        className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`}
        animate={isOpen ? { scale: [1, 1.2, 1], opacity: [1, 0.7, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <span className={`text-xs font-medium ${isOpen ? 'text-green-600' : 'text-red-600'}`}>
        {isOpen ? 'Market Open' : 'Market Closed'}
      </span>
    </div>
    {nextChange && (
      <span className="text-xs text-gray-500">
        <Clock className="w-3 h-3 inline mr-0.5" />
        {nextChange}
      </span>
    )}
  </div>
)

// Stock quote card for watchlist
const QuoteCard = ({ symbol, quote, isSelected, onClick, onRemove, isFavorite, onToggleFavorite }) => {
  const price = quote?.price || quote?.last || 0
  const change = quote?.change || 0
  const changePercent = quote?.changePercent || quote?.change_percent || 0
  const isPositive = change >= 0

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-gray-100 bg-white hover:border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite?.() }}
            className="text-gray-400 hover:text-yellow-500 transition-colors"
          >
            {isFavorite ? (
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ) : (
              <StarOff className="w-4 h-4" />
            )}
          </button>
          <div>
            <p className="font-bold text-gray-900">{symbol}</p>
            <p className="text-xs text-gray-500 truncate max-w-[80px]">{quote?.name || 'Stock'}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold text-gray-900">{formatCurrency(price)}</p>
          <div className={`flex items-center justify-end gap-0.5 text-xs font-medium ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{formatPercent(changePercent)}</span>
          </div>
        </div>
      </div>
    </motion.button>
  )
}

// Position card
const PositionCard = ({ position, onClick }) => {
  const unrealizedPL = parseFloat(position.unrealized_pl || 0)
  const unrealizedPLPercent = parseFloat(position.unrealized_plpc || 0) * 100
  const isPositive = unrealizedPL >= 0

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className="w-full text-left p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-bold text-gray-900">{position.symbol}</p>
          <p className="text-xs text-gray-500">{position.qty} shares @ {formatCurrency(position.avg_entry_price)}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-gray-900">{formatCurrency(position.market_value)}</p>
          <div className={`flex items-center justify-end gap-1 text-xs font-medium ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{formatCurrency(unrealizedPL)} ({formatPercent(unrealizedPLPercent)})</span>
          </div>
        </div>
      </div>
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(Math.abs(unrealizedPLPercent), 100)}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </motion.button>
  )
}

// Bottom sheet for quick trade
const QuickTradeSheet = ({ isOpen, onClose, symbol, quote, onTrade }) => {
  const [side, setSide] = useState('buy')
  const [orderType, setOrderType] = useState('market')
  const [quantity, setQuantity] = useState('1')
  const [limitPrice, setLimitPrice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const y = useMotionValue(0)
  const opacity = useTransform(y, [0, 300], [1, 0])

  const handleDragEnd = (_, info) => {
    if (info.offset.y > 100) {
      onClose()
    }
  }

  const price = quote?.price || quote?.last || 0
  const estimatedTotal = parseFloat(quantity || 0) * (orderType === 'limit' ? parseFloat(limitPrice || price) : price)

  const handleSubmit = async () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      setError('Please enter a valid quantity')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const orderData = {
        symbol,
        qty: parseFloat(quantity),
        side,
        type: orderType,
        time_in_force: 'day',
      }

      if (orderType === 'limit' && limitPrice) {
        orderData.limit_price = parseFloat(limitPrice)
      }

      const response = await alpacaApi.placeOrder(orderData)

      if (response.data) {
        setSuccess(true)
        onTrade?.(response.data)
        setTimeout(() => {
          setSuccess(false)
          onClose()
        }, 1500)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place order')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ y, opacity }}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{symbol}</h3>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(price)}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[60vh]">
          {/* Buy/Sell toggle */}
          <div className="flex rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => setSide('buy')}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                side === 'buy'
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setSide('sell')}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                side === 'sell'
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sell
            </button>
          </div>

          {/* Order type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
            <div className="flex gap-2">
              {['market', 'limit'].map((type) => (
                <button
                  key={type}
                  onClick={() => setOrderType(type)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                    orderType === type
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shares</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, parseInt(quantity || 1) - 1).toString())}
                className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <Minus className="w-5 h-5 text-gray-600" />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="flex-1 text-center text-2xl font-bold py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                min="1"
              />
              <button
                onClick={() => setQuantity((parseInt(quantity || 0) + 1).toString())}
                className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Limit price (if limit order) */}
          {orderType === 'limit' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">Limit Price</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  placeholder={price.toFixed(2)}
                  step="0.01"
                  className="w-full pl-8 pr-4 py-3 text-lg font-semibold border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </motion.div>
          )}

          {/* Estimated total */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Estimated Total</span>
              <span className="text-xl font-bold text-gray-900">{formatCurrency(estimatedTotal)}</span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          {/* Success message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center gap-2 text-green-700"
            >
              <Check className="w-5 h-5" />
              <span className="font-medium">Order placed successfully!</span>
            </motion.div>
          )}
        </div>

        {/* Submit button */}
        <div className="p-5 border-t border-gray-100 pb-safe">
          <motion.button
            onClick={handleSubmit}
            disabled={submitting || success || !quantity}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all ${
              side === 'buy'
                ? 'bg-green-500 hover:bg-green-600 disabled:bg-green-300'
                : 'bg-red-500 hover:bg-red-600 disabled:bg-red-300'
            }`}
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : success ? (
              <Check className="w-5 h-5 mx-auto" />
            ) : (
              `${side === 'buy' ? 'Buy' : 'Sell'} ${quantity || 0} ${symbol}`
            )}
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Stock chart component using Lightweight Charts
const StockChart = ({ symbol, data, timeframe, onTimeframeChange }) => {
  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)
  const seriesRef = useRef(null)

  const timeframes = [
    { id: '1D', label: '1D' },
    { id: '1W', label: '1W' },
    { id: '1M', label: '1M' },
    { id: '3M', label: '3M' },
    { id: '1Y', label: '1Y' },
  ]

  useEffect(() => {
    if (!chartContainerRef.current) return

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'white' },
        textColor: '#64748b',
      },
      grid: {
        vertLines: { color: '#f1f5f9' },
        horzLines: { color: '#f1f5f9' },
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: { color: '#6366f1', width: 1, style: 2 },
        horzLine: { color: '#6366f1', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: '#e2e8f0',
      },
      timeScale: {
        borderColor: '#e2e8f0',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    })

    // Add candlestick series (v5 API)
    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    })

    chartRef.current = chart
    seriesRef.current = series

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        })
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [])

  // Update data
  useEffect(() => {
    if (seriesRef.current && data?.length > 0) {
      const chartData = data.map(bar => ({
        time: new Date(bar.t || bar.time).getTime() / 1000,
        open: parseFloat(bar.o || bar.open),
        high: parseFloat(bar.h || bar.high),
        low: parseFloat(bar.l || bar.low),
        close: parseFloat(bar.c || bar.close),
      }))
      seriesRef.current.setData(chartData)
      chartRef.current?.timeScale().fitContent()
    }
  }, [data])

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Timeframe selector */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-900">{symbol} Chart</h3>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {timeframes.map((tf) => (
            <button
              key={tf.id}
              onClick={() => onTimeframeChange?.(tf.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                timeframe === tf.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div ref={chartContainerRef} className="h-64 md:h-80" />
    </div>
  )
}

// Main Trading Page
const Trading = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [watchlist, setWatchlist] = useState(DEFAULT_WATCHLIST)
  const [favorites, setFavorites] = useState(['AAPL', 'TSLA'])
  const [quotes, setQuotes] = useState({})
  const [positions, setPositions] = useState([])
  const [account, setAccount] = useState(null)
  const [chartData, setChartData] = useState([])
  const [chartTimeframe, setChartTimeframe] = useState('1D')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tradeSheetOpen, setTradeSheetOpen] = useState(false)
  const [marketStatus, setMarketStatus] = useState({ isOpen: false, nextChange: null })
  const [activeTab, setActiveTab] = useState('watchlist') // 'watchlist' | 'positions'
  const [alpacaConnected, setAlpacaConnected] = useState(false)
  const [hideBalances, setHideBalances] = useState(false)

  const searchInputRef = useRef(null)
  const prevQuotes = useRef({})

  // Check if Alpaca is connected
  useEffect(() => {
    const checkAlpaca = async () => {
      try {
        const response = await accountsApi.getAll()
        const alpacaAccount = response.data?.find(a => a.platform === 'alpaca')
        setAlpacaConnected(!!alpacaAccount)

        if (alpacaAccount) {
          // Fetch account info
          const accountResponse = await alpacaApi.getAccount()
          if (accountResponse.data) {
            setAccount(accountResponse.data)
          }

          // Fetch positions
          const positionsResponse = await alpacaApi.getPositions()
          if (positionsResponse.data) {
            setPositions(positionsResponse.data)
          }

          // Fetch market clock
          const clockResponse = await alpacaApi.getClock()
          if (clockResponse.data) {
            setMarketStatus({
              isOpen: clockResponse.data.is_open,
              nextChange: clockResponse.data.is_open
                ? `Closes ${new Date(clockResponse.data.next_close).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : `Opens ${new Date(clockResponse.data.next_open).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            })
          }
        }
      } catch (err) {
        console.error('Failed to check Alpaca connection:', err)
      } finally {
        setLoading(false)
      }
    }

    checkAlpaca()
  }, [])

  // Fetch quotes for watchlist
  const fetchQuotes = useCallback(async () => {
    if (!alpacaConnected) return

    try {
      const newQuotes = {}

      for (const symbol of watchlist) {
        try {
          const response = await alpacaApi.getQuote(symbol)
          if (response.data) {
            const bid = response.data.bid_price || response.data.bp || 0
            const ask = response.data.ask_price || response.data.ap || 0
            const price = ask || bid || response.data.price || 0
            newQuotes[symbol] = {
              price,
              bid,
              ask,
              // Note: Real change data would come from bars comparison
              change: 0,
              changePercent: 0,
            }
          }
        } catch (err) {
          console.error(`Failed to fetch quote for ${symbol}:`, err)
        }
      }

      prevQuotes.current = quotes
      setQuotes(newQuotes)
    } catch (err) {
      console.error('Failed to fetch quotes:', err)
    }
  }, [alpacaConnected, watchlist, quotes])

  // Fetch chart data
  const fetchChartData = useCallback(async () => {
    if (!alpacaConnected || !selectedSymbol) return

    try {
      // Map timeframe to Alpaca format and limit
      const timeframeMap = {
        '1D': { tf: '5Min', limit: 78 },
        '1W': { tf: '15Min', limit: 140 },
        '1M': { tf: '1Hour', limit: 160 },
        '3M': { tf: '1Day', limit: 63 },
        '1Y': { tf: '1Day', limit: 252 },
      }

      const { tf, limit } = timeframeMap[chartTimeframe] || timeframeMap['1D']

      const response = await alpacaApi.getBars(selectedSymbol, tf, limit)
      if (response.data?.bars || response.data) {
        setChartData(response.data.bars || response.data)
      }
    } catch (err) {
      console.error('Failed to fetch chart data:', err)
    }
  }, [alpacaConnected, selectedSymbol, chartTimeframe])

  // Initial data fetch
  useEffect(() => {
    if (alpacaConnected) {
      fetchQuotes()
      fetchChartData()
    }
  }, [alpacaConnected, fetchQuotes, fetchChartData])

  // Poll for updates
  useEffect(() => {
    if (!alpacaConnected) return

    const interval = setInterval(() => {
      fetchQuotes()
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [alpacaConnected, fetchQuotes])

  // Refresh chart when symbol or timeframe changes
  useEffect(() => {
    fetchChartData()
  }, [selectedSymbol, chartTimeframe, fetchChartData])

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchQuotes(), fetchChartData()])
    setRefreshing(false)
  }

  // Toggle favorite
  const toggleFavorite = (symbol) => {
    setFavorites(prev =>
      prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    )
  }

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault()
    const symbol = searchQuery.toUpperCase().trim()
    if (symbol && !watchlist.includes(symbol)) {
      setWatchlist(prev => [symbol, ...prev])
    }
    setSelectedSymbol(symbol)
    setSearchQuery('')
    setShowSearch(false)
  }

  // Connection card component (inline, not blocking)
  const ConnectionCard = () => {
    const [showForm, setShowForm] = useState(false)
    const [apiKey, setApiKey] = useState('')
    const [apiSecret, setApiSecret] = useState('')
    const [paperMode, setPaperMode] = useState(true)
    const [isConnecting, setIsConnecting] = useState(false)
    const [error, setError] = useState(null)

    const handleConnect = async (e) => {
      e.preventDefault()
      if (!apiKey || !apiSecret) return

      setIsConnecting(true)
      setError(null)

      try {
        const response = await accountsApi.connect('alpaca', {
          apiKey,
          apiSecret,
          paperMode
        })
        if (response.data.success) {
          window.location.reload()
        }
      } catch (err) {
        setError(err.message || 'Failed to connect. Check your credentials.')
      } finally {
        setIsConnecting(false)
      }
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-linear-to-r from-emerald-500 to-teal-600 p-5 rounded-2xl text-white shadow-lg"
      >
        {!showForm ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🦙</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">Connect Alpaca to Trade</h3>
                <p className="text-emerald-100 text-sm">Enter your API keys to enable live trading</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-5 py-2.5 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-emerald-50 transition-colors"
            >
              Connect Now
            </button>
          </div>
        ) : (
          <form onSubmit={handleConnect} className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">Enter Alpaca API Keys</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="API Key ID (PK...)"
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Secret Key"
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={paperMode}
                  onChange={(e) => setPaperMode(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm">Paper Trading (recommended)</span>
              </label>

              <button
                type="submit"
                disabled={!apiKey || !apiSecret || isConnecting}
                className="px-5 py-2 bg-white text-emerald-600 font-semibold rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Connect
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-200 text-sm bg-red-500/20 px-3 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 mt-1">
              <a
                href="https://app.alpaca.markets/paper/dashboard/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
              >
                <span>📄</span> Get Paper Trading Keys
              </a>
              <a
                href="https://app.alpaca.markets/live/dashboard/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
              >
                <span>💰</span> Get Live Trading Keys
              </a>
            </div>
          </form>
        )}
      </motion.div>
    )
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trading</h1>
          <MarketStatus isOpen={marketStatus.isOpen} nextChange={marketStatus.nextChange} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHideBalances(!hideBalances)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {hideBalances ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Connection card or Account summary cards */}
      {!alpacaConnected ? (
        <ConnectionCard />
      ) : account ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4 rounded-xl border border-gray-100"
          >
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">Portfolio Value</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {hideBalances ? '••••••' : formatCurrency(account.portfolio_value || account.equity)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white p-4 rounded-xl border border-gray-100"
          >
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">Buying Power</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {hideBalances ? '••••••' : formatCurrency(account.buying_power)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-4 rounded-xl border border-gray-100"
          >
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">Positions</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{positions.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white p-4 rounded-xl border border-gray-100"
          >
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">Day P&L</span>
            </div>
            <p className={`text-xl font-bold ${
              parseFloat(account.equity) - parseFloat(account.last_equity) >= 0
                ? 'text-green-600'
                : 'text-red-600'
            }`}>
              {hideBalances
                ? '••••••'
                : formatCurrency(parseFloat(account.equity) - parseFloat(account.last_equity))}
            </p>
          </motion.div>
        </div>
      ) : null}

      {/* Search bar */}
      <div className="relative">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearch(true)}
              placeholder="Search stocks..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setShowSearch(false) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Chart */}
      <StockChart
        symbol={selectedSymbol}
        data={chartData}
        timeframe={chartTimeframe}
        onTimeframeChange={setChartTimeframe}
      />

      {/* Tabs: Watchlist / Positions */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'watchlist'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Activity className="w-4 h-4 inline mr-1.5" />
          Watchlist
        </button>
        <button
          onClick={() => setActiveTab('positions')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'positions'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Briefcase className="w-4 h-4 inline mr-1.5" />
          Positions ({positions.length})
        </button>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'watchlist' ? (
          <motion.div
            key="watchlist"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {watchlist.map((symbol) => (
              <QuoteCard
                key={symbol}
                symbol={symbol}
                quote={quotes[symbol]}
                isSelected={symbol === selectedSymbol}
                onClick={() => setSelectedSymbol(symbol)}
                isFavorite={favorites.includes(symbol)}
                onToggleFavorite={() => toggleFavorite(symbol)}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="positions"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            {positions.length > 0 ? (
              positions.map((position) => (
                <PositionCard
                  key={position.symbol}
                  position={position}
                  onClick={() => {
                    setSelectedSymbol(position.symbol)
                    setActiveTab('watchlist')
                  }}
                />
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No open positions</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating trade button */}
      <motion.button
        onClick={() => setTradeSheetOpen(true)}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-20 md:bottom-8 right-4 md:right-8 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full shadow-lg shadow-indigo-500/30 flex items-center gap-2 z-40"
      >
        <Zap className="w-5 h-5" />
        Trade {selectedSymbol}
      </motion.button>

      {/* Quick trade bottom sheet */}
      <QuickTradeSheet
        isOpen={tradeSheetOpen}
        onClose={() => setTradeSheetOpen(false)}
        symbol={selectedSymbol}
        quote={quotes[selectedSymbol]}
        onTrade={() => {
          // Refresh positions after trade
          alpacaApi.getPositions().then(res => {
            if (res.data) setPositions(res.data)
          })
        }}
      />
    </div>
  )
}

export default Trading

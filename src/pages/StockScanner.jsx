import { useState, useEffect, useRef } from 'react'
import {
  Radio,
  TrendingUp,
  TrendingDown,
  Zap,
  Volume2,
  Target,
  Activity,
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw,
  Star,
  StarOff,
  Bell,
  BellOff,
  Eye,
  BarChart3,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Pause,
  Play,
  Settings,
  X,
  Search,
  Layers,
  Flame,
  Sparkles,
  AlertCircle,
} from 'lucide-react'

// Scanner types configuration
const SCANNER_TYPES = [
  { id: 'momentum', label: 'Momentum', icon: Zap, color: 'indigo' },
  { id: 'volume', label: 'Volume Surge', icon: Volume2, color: 'purple' },
  { id: 'gaps', label: 'Gap Scanner', icon: Target, color: 'emerald' },
  { id: 'breakouts', label: 'Breakouts', icon: TrendingUp, color: 'amber' },
  { id: 'reversals', label: 'Reversals', icon: Activity, color: 'rose' },
]

// Mock stock data generator
const generateMockStock = () => {
  const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AMD', 'NFLX', 'CRM', 'ORCL', 'INTC', 'PYPL', 'SHOP', 'SQ', 'COIN', 'PLTR', 'SNOW', 'UBER', 'LYFT', 'ABNB', 'RBLX', 'ROKU', 'DKNG', 'HOOD', 'SOFI', 'RIVN', 'LCID', 'NIO', 'XPEV']
  const scanTypes = ['momentum', 'volume', 'gaps', 'breakouts', 'reversals']
  const symbol = symbols[Math.floor(Math.random() * symbols.length)]
  const price = (Math.random() * 500 + 10).toFixed(2)
  const change = (Math.random() * 20 - 10).toFixed(2)
  const changePercent = (Math.random() * 15 - 7.5).toFixed(2)
  const volume = Math.floor(Math.random() * 50000000)
  const avgVolume = Math.floor(volume * (0.3 + Math.random() * 0.5))
  const relVolume = (volume / avgVolume).toFixed(1)
  
  return {
    id: Date.now() + Math.random(),
    symbol,
    price: parseFloat(price),
    change: parseFloat(change),
    changePercent: parseFloat(changePercent),
    volume,
    relVolume: parseFloat(relVolume),
    scanType: scanTypes[Math.floor(Math.random() * scanTypes.length)],
    timestamp: new Date(),
    signal: Math.random() > 0.5 ? 'bullish' : 'bearish',
    strength: Math.floor(Math.random() * 100),
  }
}

// Format large numbers
const formatVolume = (num) => {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

// Format time ago
const formatTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - date) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  return `${Math.floor(seconds / 3600)}h ago`
}

// Stock row component
const StockRow = ({ stock, isWatched, onToggleWatch, isNew }) => {
  const isPositive = stock.changePercent >= 0
  const scannerConfig = SCANNER_TYPES.find(s => s.id === stock.scanType)
  const ScanIcon = scannerConfig?.icon || Zap
  
  const colorClasses = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800',
    purple: 'bg-purple-50 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
    amber: 'bg-amber-50 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800',
    rose: 'bg-rose-50 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800',
  }
  
  return (
    <div
      className={`group px-4 py-3 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-all duration-200 cursor-pointer ${
        isNew ? 'animate-pulse-once bg-indigo-50/30 dark:bg-indigo-900/20' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Symbol & Signal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-white">{stock.symbol}</span>
            <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${colorClasses[scannerConfig?.color || 'indigo']}`}>
              {scannerConfig?.label}
            </span>
            {stock.signal === 'bullish' ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              {formatVolume(stock.volume)}
            </span>
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-400" />
              {stock.relVolume}x
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(stock.timestamp)}
            </span>
          </div>
        </div>
        
        {/* Price */}
        <div className="text-right">
          <p className="font-semibold text-gray-900 dark:text-white">${stock.price.toFixed(2)}</p>
          <p className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
          </p>
        </div>
        
        {/* Strength indicator */}
        <div className="w-12 flex flex-col items-center">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold relative">
            <svg className="w-8 h-8 transform -rotate-90">
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="3"
              />
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="none"
                stroke={stock.strength > 70 ? '#22c55e' : stock.strength > 40 ? '#f59e0b' : '#ef4444'}
                strokeWidth="3"
                strokeDasharray={`${(stock.strength / 100) * 88} 88`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[10px] font-bold text-gray-700 dark:text-gray-300">{stock.strength}</span>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => {
              e.stopPropagation()
              onToggleWatch(stock.symbol)
            }}
            className={`p-1.5 transition-colors ${
              isWatched
                ? 'text-amber-500'
                : 'text-gray-400 hover:text-amber-500'
            }`}
          >
            {isWatched ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
          </button>
          <button className="p-1.5 text-gray-400 hover:text-indigo-500 transition-colors">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Filter pill component
const FilterPill = ({ active, onClick, children, icon: Icon, color = 'gray' }) => {
  const colorMap = {
    gray: active ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
    indigo: active ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-gray-500 hover:text-indigo-500',
    purple: active ? 'text-purple-600 dark:text-purple-400 font-bold' : 'text-gray-500 hover:text-purple-500',
    emerald: active ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-500 hover:text-emerald-500',
    amber: active ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-gray-500 hover:text-amber-500',
    rose: active ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-gray-500 hover:text-rose-500',
  }

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${colorMap[color]}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </button>
  )
}

// Stats card component
const StatCard = ({ label, value, subValue, icon: Icon, trend }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm transition-all">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
      <div className={`p-1.5 rounded-lg ${trend === 'up' ? 'bg-green-50 dark:bg-green-900/30' : trend === 'down' ? 'bg-red-50 dark:bg-red-900/30' : 'bg-gray-50 dark:bg-gray-700'}`}>
        <Icon className={`w-4 h-4 ${trend === 'up' ? 'text-green-600 dark:text-green-400' : trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`} />
      </div>
    </div>
    <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
    {subValue && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subValue}</p>}
  </div>
)

// Main Scanner Component
const StockScanner = () => {
  const [stocks, setStocks] = useState([])
  const [watchlist, setWatchlist] = useState(['AAPL', 'NVDA', 'TSLA'])
  const [isPaused, setIsPaused] = useState(false)
  const [activeFilters, setActiveFilters] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isExpanded, setIsExpanded] = useState(true)
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const scrollRef = useRef(null)
  const [newStockIds, setNewStockIds] = useState(new Set())
  
  // Stats
  const [stats, setStats] = useState({
    scanned: 0,
    signals: 0,
    bullish: 0,
    bearish: 0,
  })

  // Generate initial stocks
  useEffect(() => {
    const initial = Array(15).fill(null).map(() => generateMockStock())
    setStocks(initial)
    setStats({
      scanned: 847,
      signals: initial.length,
      bullish: initial.filter(s => s.signal === 'bullish').length,
      bearish: initial.filter(s => s.signal === 'bearish').length,
    })
  }, [])

  // Add new stocks periodically
  useEffect(() => {
    if (isPaused) return
    
    const interval = setInterval(() => {
      const newStock = generateMockStock()
      setNewStockIds(prev => new Set([...prev, newStock.id]))
      
      setStocks(prev => {
        const updated = [newStock, ...prev.slice(0, 49)]
        return updated
      })
      
      setStats(prev => ({
        scanned: prev.scanned + Math.floor(Math.random() * 5) + 1,
        signals: prev.signals + 1,
        bullish: prev.bullish + (newStock.signal === 'bullish' ? 1 : 0),
        bearish: prev.bearish + (newStock.signal === 'bearish' ? 1 : 0),
      }))
      
      // Remove new animation after delay
      setTimeout(() => {
        setNewStockIds(prev => {
          const next = new Set(prev)
          next.delete(newStock.id)
          return next
        })
      }, 1000)
    }, 2000 + Math.random() * 3000)
    
    return () => clearInterval(interval)
  }, [isPaused])

  // Toggle filter
  const toggleFilter = (filterId) => {
    setActiveFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    )
  }

  // Toggle watchlist
  const toggleWatch = (symbol) => {
    setWatchlist(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    )
  }

  // Filter stocks
  const filteredStocks = stocks.filter(stock => {
    if (activeFilters.length > 0 && !activeFilters.includes(stock.scanType)) {
      return false
    }
    if (searchQuery && !stock.symbol.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Radio className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                Stock Scanner
                <span className="px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded-full animate-pulse">
                  LIVE
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {stats.scanned.toLocaleString()} scanned • {stats.signals} signals today
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-32 pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 dark:text-white transition-all"
              />
            </div>
            
            {/* Alerts toggle */}
            <button
              onClick={() => setAlertsEnabled(!alertsEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                alertsEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {alertsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </button>
            
            {/* Pause/Play */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`text-sm font-bold transition-colors flex items-center gap-1.5 ${
                isPaused
                  ? 'text-amber-500 hover:text-amber-400'
                  : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              {isPaused ? (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  Pause
                </>
              )}
            </button>
            
            {/* Filters toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters || activeFilters.length > 0 
                  ? 'bg-indigo-100 text-indigo-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
            
            {/* Expand/Collapse */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {/* Filter pills */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">Filters:</span>
              {SCANNER_TYPES.map(scanner => (
                <FilterPill
                  key={scanner.id}
                  active={activeFilters.includes(scanner.id)}
                  onClick={() => toggleFilter(scanner.id)}
                  icon={scanner.icon}
                  color={scanner.color}
                >
                  {scanner.label}
                </FilterPill>
              ))}
              {activeFilters.length > 0 && (
                <button
                  onClick={() => setActiveFilters([])}
                  className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Stats bar */}
      {isExpanded && (
        <div className="px-5 py-3 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 grid grid-cols-4 gap-3">
          <StatCard 
            label="Scanned" 
            value={stats.scanned.toLocaleString()} 
            subValue="stocks today"
            icon={Layers}
          />
          <StatCard 
            label="Signals" 
            value={stats.signals} 
            subValue="active alerts"
            icon={Sparkles}
            trend="up"
          />
          <StatCard 
            label="Bullish" 
            value={stats.bullish} 
            subValue={`${((stats.bullish / stats.signals) * 100 || 0).toFixed(0)}% of signals`}
            icon={TrendingUp}
            trend="up"
          />
          <StatCard 
            label="Bearish" 
            value={stats.bearish}
            subValue={`${((stats.bearish / stats.signals) * 100 || 0).toFixed(0)}% of signals`}
            icon={TrendingDown}
            trend="down"
          />
        </div>
      )}
      
      {/* Scanner feed */}
      {isExpanded && (
        <div 
          ref={scrollRef}
          className="overflow-y-auto"
          style={{ maxHeight: '480px' }}
        >
          {filteredStocks.length === 0 ? (
            <div className="py-12 text-center">
              <AlertCircle className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No stocks match your filters</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filter criteria</p>
            </div>
          ) : (
            filteredStocks.map(stock => (
              <StockRow
                key={stock.id}
                stock={stock}
                isWatched={watchlist.includes(stock.symbol)}
                onToggleWatch={toggleWatch}
                isNew={newStockIds.has(stock.id)}
              />
            ))
          )}
        </div>
      )}
      
      {/* Footer */}
      <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Real-time data
          </span>
          <span>Updated: {new Date().toLocaleTimeString()}</span>
        </div>
        <button className="text-xs text-indigo-600 font-medium hover:text-indigo-700 transition-colors flex items-center gap-1">
          View all signals
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {/* CSS for custom animation */}
      <style>{`
        @keyframes pulse-once {
          0%, 100% { background-color: transparent; }
          50% { background-color: rgb(238 242 255 / 0.5); }
        }
        .animate-pulse-once {
          animation: pulse-once 1s ease-out;
        }
      `}</style>
    </div>
  )
}

export default StockScanner

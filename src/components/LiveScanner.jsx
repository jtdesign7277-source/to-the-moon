import { useState, useEffect, useRef } from 'react'
import { Radio, TrendingUp, Eye, XCircle, Zap, ChevronDown, ChevronUp } from 'lucide-react'
import TradeTicket from './TradeTicket'

// Sample market data for realistic scanning simulation
const SAMPLE_MARKETS = [
  { market: "Will Bitcoin reach $100K by March 2026?", platform: "Kalshi", category: "Crypto" },
  { market: "Fed to cut rates at next meeting?", platform: "Polymarket", category: "Finance" },
  { market: "Super Bowl LX winner: Chiefs?", platform: "Kalshi", category: "Sports" },
  { market: "Will it snow in NYC on Feb 1st?", platform: "Kalshi", category: "Weather" },
  { market: "Oscar Best Picture 2026 prediction", platform: "Polymarket", category: "Entertainment" },
  { market: "Next iPhone to have foldable screen?", platform: "Manifold", category: "Tech" },
  { market: "SpaceX Starship orbital success Q1 2026?", platform: "Polymarket", category: "Space" },
  { market: "Will GPT-5 release before July 2026?", platform: "Manifold", category: "AI" },
  { market: "Tesla stock above $300 by EOY?", platform: "Kalshi", category: "Stocks" },
  { market: "2026 World Cup host city announcement", platform: "Polymarket", category: "Sports" },
  { market: "Will Ethereum merge with another chain?", platform: "Manifold", category: "Crypto" },
  { market: "US unemployment rate below 4%?", platform: "Kalshi", category: "Economics" },
  { market: "Next Apple product announcement date", platform: "Polymarket", category: "Tech" },
  { market: "Grammy Album of the Year 2026", platform: "Manifold", category: "Entertainment" },
  { market: "California earthquake magnitude 6+ in 2026?", platform: "Kalshi", category: "Weather" },
]

const STRATEGIES = [
  "Momentum Scanner",
  "Mean Reversion",
  "Arbitrage Finder",
  "News Catalyst",
  "Market Maker",
  "Trend Following"
]

const SCAN_ACTIONS = [
  { type: 'scanning', icon: Eye, color: 'text-gray-400', bgColor: 'bg-gray-50' },
  { type: 'watching', icon: Eye, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  { type: 'opportunity', icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50' },
  { type: 'passed', icon: XCircle, color: 'text-gray-400', bgColor: 'bg-gray-50' },
]

const generateScanEvent = () => {
  const market = SAMPLE_MARKETS[Math.floor(Math.random() * SAMPLE_MARKETS.length)]
  const strategy = STRATEGIES[Math.floor(Math.random() * STRATEGIES.length)]
  
  // 20% chance of opportunity, 30% watching, 50% scanning/passed
  const rand = Math.random()
  let action
  if (rand < 0.15) {
    action = SCAN_ACTIONS[2] // opportunity
  } else if (rand < 0.40) {
    action = SCAN_ACTIONS[1] // watching
  } else if (rand < 0.70) {
    action = SCAN_ACTIONS[0] // scanning
  } else {
    action = SCAN_ACTIONS[3] // passed
  }
  
  const price = Math.floor(Math.random() * 80) + 10 // 10-90 cents
  const edge = action.type === 'opportunity' ? Math.floor(Math.random() * 15) + 3 : 0
  const volume = Math.floor(Math.random() * 50000) + 1000
  
  return {
    id: Date.now() + Math.random(),
    timestamp: new Date(),
    market: market.market,
    platform: market.platform,
    category: market.category,
    strategy,
    action,
    price,
    edge,
    volume,
    isClickable: action.type === 'opportunity' || action.type === 'watching'
  }
}

const formatTime = (date) => {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false 
  })
}

const LiveScanner = ({ maxEvents = 50, scanInterval = 1500, onTradeComplete }) => {
  const [events, setEvents] = useState([])
  const [isExpanded, setIsExpanded] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [selectedOpportunity, setSelectedOpportunity] = useState(null)
  const [stats, setStats] = useState({ scanned: 0, opportunities: 0, watching: 0 })
  const scrollRef = useRef(null)
  const [isAutoScroll, setIsAutoScroll] = useState(true)

  // Generate new scan events periodically
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      const newEvent = generateScanEvent()
      
      setEvents(prev => {
        const updated = [newEvent, ...prev].slice(0, maxEvents)
        return updated
      })

      setStats(prev => ({
        scanned: prev.scanned + 1,
        opportunities: prev.opportunities + (newEvent.action.type === 'opportunity' ? 1 : 0),
        watching: newEvent.action.type === 'watching' 
          ? prev.watching + 1 
          : newEvent.action.type === 'passed' || newEvent.action.type === 'opportunity'
            ? Math.max(0, prev.watching - 1)
            : prev.watching
      }))
    }, scanInterval)

    return () => clearInterval(interval)
  }, [isPaused, maxEvents, scanInterval])

  // Handle scroll
  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollTop } = scrollRef.current
    setIsAutoScroll(scrollTop < 10)
  }

  // Auto-scroll when new events arrive
  useEffect(() => {
    if (isAutoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [events, isAutoScroll])

  const handleEventClick = (event) => {
    if (!event.isClickable) return
    
    setSelectedOpportunity({
      market: event.market,
      platform: event.platform,
      strategy: event.strategy,
      price: event.price,
      edge: event.edge,
      volume: event.volume,
      category: event.category
    })
  }

  const handleTradeSubmit = (trade) => {
    console.log('Trade submitted:', trade)
    // Notify parent to refresh dashboard data
    if (onTradeComplete) {
      onTradeComplete(trade)
    }
  }

  const getPlatformColor = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'kalshi': return 'text-blue-600'
      case 'polymarket': return 'text-purple-600'
      case 'predictit': return 'text-green-600'
      case 'manifold': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div 
          className="px-4 py-3 border-b border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Radio className="w-5 h-5 text-indigo-600" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                Live Market Scanner
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded animate-pulse">
                  LIVE
                </span>
              </h3>
              <p className="text-xs text-gray-500">
                {stats.scanned} scanned • {stats.opportunities} opportunities • {stats.watching} watching
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsPaused(!isPaused)
              }}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                isPaused 
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Scanner Feed */}
        {isExpanded && (
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="max-h-64 overflow-y-auto bg-gray-900 font-mono text-xs"
          >
            {events.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Radio className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                <p>Initializing scanner...</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {events.map((event) => {
                  const Icon = event.action.icon
                  return (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className={`px-3 py-2 flex items-start gap-3 transition-colors ${
                        event.isClickable 
                          ? 'hover:bg-gray-800 cursor-pointer' 
                          : ''
                      } ${
                        event.action.type === 'opportunity' 
                          ? 'bg-green-900/20 border-l-2 border-green-500' 
                          : ''
                      }`}
                    >
                      {/* Timestamp */}
                      <span className="text-gray-600 shrink-0 tabular-nums">
                        {formatTime(event.timestamp)}
                      </span>

                      {/* Icon */}
                      <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${event.action.color}`} />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-medium ${getPlatformColor(event.platform)}`}>
                            [{event.platform}]
                          </span>
                          <span className="text-gray-400 truncate">
                            {event.market.length > 45 ? event.market.substring(0, 45) + '...' : event.market}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-gray-500">
                          <span>{event.strategy}</span>
                          <span>•</span>
                          <span>{event.price}¢</span>
                          {event.edge > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-green-400 font-medium flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                +{event.edge}% edge
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action Badge */}
                      {event.action.type === 'opportunity' && (
                        <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold bg-green-500 text-white rounded">
                          CLICK TO TRADE
                        </span>
                      )}
                      {event.action.type === 'watching' && (
                        <span className="shrink-0 px-2 py-0.5 text-[10px] font-medium bg-yellow-500/20 text-yellow-400 rounded">
                          WATCHING
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer hint */}
        {isExpanded && events.some(e => e.isClickable) && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Zap className="w-3 h-3 text-green-500" />
              Click any <span className="text-green-600 font-medium">opportunity</span> or <span className="text-yellow-600 font-medium">watching</span> item to open trade ticket
            </p>
          </div>
        )}
      </div>

      {/* Trade Ticket Modal */}
      {selectedOpportunity && (
        <TradeTicket
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
          onSubmit={handleTradeSubmit}
        />
      )}
    </>
  )
}

export default LiveScanner

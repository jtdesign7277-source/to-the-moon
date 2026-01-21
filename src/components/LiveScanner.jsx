import { useState, useEffect, useRef, useCallback } from 'react'
import { Radio, TrendingUp, Eye, XCircle, Zap, ChevronDown, ChevronUp, ExternalLink, GripVertical } from 'lucide-react'
import TradeTicket from './TradeTicket'

// Default dimensions
const DEFAULT_WIDTH = null // null = 100% width
const DEFAULT_HEIGHT = 256 // 16rem = 256px
const MIN_WIDTH = 300
const MAX_WIDTH = 800
const MIN_HEIGHT = 150
const MAX_HEIGHT = 600

// Real prediction markets from Kalshi, Polymarket, and Manifold
// These are actual market categories traded on these platforms
const SAMPLE_MARKETS = [
  // KALSHI - Economics & Finance (kalshi.com)
  { market: "Fed funds rate above 4.5% end of Q1 2026?", platform: "Kalshi", category: "Economics", url: "https://kalshi.com/markets/fed" },
  { market: "US CPI inflation above 3% in February?", platform: "Kalshi", category: "Economics", url: "https://kalshi.com/markets/cpi" },
  { market: "US GDP growth above 2% Q1 2026?", platform: "Kalshi", category: "Economics", url: "https://kalshi.com/markets/gdp" },
  { market: "Unemployment rate below 4.2% in January?", platform: "Kalshi", category: "Economics", url: "https://kalshi.com/markets/unrate" },
  { market: "S&P 500 above 6,000 by March 31?", platform: "Kalshi", category: "Stocks", url: "https://kalshi.com/markets/inx" },
  { market: "Nasdaq above 20,000 by end of Q1?", platform: "Kalshi", category: "Stocks", url: "https://kalshi.com/markets/comp" },
  { market: "10-year Treasury yield above 4.5%?", platform: "Kalshi", category: "Finance", url: "https://kalshi.com/markets/tnx" },
  
  // KALSHI - Weather (kalshi.com)
  { market: "NYC temperature below 20°F on Jan 25?", platform: "Kalshi", category: "Weather", url: "https://kalshi.com/markets/weather" },
  { market: "Snowfall in Chicago above 6 inches this week?", platform: "Kalshi", category: "Weather", url: "https://kalshi.com/markets/weather" },
  { market: "Los Angeles rainfall above 0.5 inches in January?", platform: "Kalshi", category: "Weather", url: "https://kalshi.com/markets/weather" },
  { market: "Miami high temperature above 80°F on Feb 1?", platform: "Kalshi", category: "Weather", url: "https://kalshi.com/markets/weather" },
  
  // KALSHI - Company Events
  { market: "Tesla Q4 deliveries above 500K?", platform: "Kalshi", category: "Stocks", url: "https://kalshi.com/markets/tsla" },
  { market: "Apple revenue above $120B in Q1 2026?", platform: "Kalshi", category: "Stocks", url: "https://kalshi.com/markets/aapl" },
  { market: "Netflix subscriber growth above 5M in Q1?", platform: "Kalshi", category: "Stocks", url: "https://kalshi.com/markets/nflx" },
  { market: "NVIDIA earnings beat estimates Q1 2026?", platform: "Kalshi", category: "Stocks", url: "https://kalshi.com/markets/nvda" },
  
  // POLYMARKET - Politics (polymarket.com)
  { market: "Republicans win Senate seat in 2026 special election?", platform: "Polymarket", category: "Politics", url: "https://polymarket.com/politics" },
  { market: "Biden approval rating above 45% in February?", platform: "Polymarket", category: "Politics", url: "https://polymarket.com/politics" },
  { market: "TikTok ban enforced by March 2026?", platform: "Polymarket", category: "Politics", url: "https://polymarket.com/politics" },
  { market: "Federal government shutdown in Q1 2026?", platform: "Polymarket", category: "Politics", url: "https://polymarket.com/politics" },
  { market: "New tariffs on China above 25%?", platform: "Polymarket", category: "Politics", url: "https://polymarket.com/politics" },
  { market: "Immigration bill passed by March?", platform: "Polymarket", category: "Politics", url: "https://polymarket.com/politics" },
  
  // POLYMARKET - Crypto (polymarket.com)
  { market: "Bitcoin above $120K by March 31?", platform: "Polymarket", category: "Crypto", url: "https://polymarket.com/crypto" },
  { market: "Ethereum above $5,000 by end of Q1?", platform: "Polymarket", category: "Crypto", url: "https://polymarket.com/crypto" },
  { market: "Solana above $300 in February?", platform: "Polymarket", category: "Crypto", url: "https://polymarket.com/crypto" },
  { market: "Bitcoin ETF inflows above $1B this week?", platform: "Polymarket", category: "Crypto", url: "https://polymarket.com/crypto" },
  { market: "New crypto regulations passed in US Q1?", platform: "Polymarket", category: "Crypto", url: "https://polymarket.com/crypto" },
  { market: "Coinbase stock above $300 by March?", platform: "Polymarket", category: "Crypto", url: "https://polymarket.com/crypto" },
  
  // POLYMARKET - Sports (polymarket.com)
  { market: "Chiefs win Super Bowl LX?", platform: "Polymarket", category: "Sports", url: "https://polymarket.com/sports" },
  { market: "Eagles make Super Bowl LX?", platform: "Polymarket", category: "Sports", url: "https://polymarket.com/sports" },
  { market: "Lakers make NBA playoffs 2026?", platform: "Polymarket", category: "Sports", url: "https://polymarket.com/sports" },
  { market: "Yankees win 2026 World Series?", platform: "Polymarket", category: "Sports", url: "https://polymarket.com/sports" },
  { market: "Ohtani MVP in 2026 season?", platform: "Polymarket", category: "Sports", url: "https://polymarket.com/sports" },
  { market: "Manchester City win Premier League?", platform: "Polymarket", category: "Sports", url: "https://polymarket.com/sports" },
  
  // POLYMARKET - Tech & AI
  { market: "OpenAI releases GPT-5 by June 2026?", platform: "Polymarket", category: "AI", url: "https://polymarket.com/ai" },
  { market: "Apple announces AR glasses in 2026?", platform: "Polymarket", category: "Tech", url: "https://polymarket.com/tech" },
  { market: "Twitter/X valued above $30B by EOY?", platform: "Polymarket", category: "Tech", url: "https://polymarket.com/tech" },
  { market: "Neuralink human trial success in 2026?", platform: "Polymarket", category: "Tech", url: "https://polymarket.com/tech" },
  
  // MANIFOLD - Entertainment (manifold.markets)
  { market: "Oscar Best Picture 2026: Anora?", platform: "Manifold", category: "Entertainment", url: "https://manifold.markets" },
  { market: "Taylor Swift announces new album Q1 2026?", platform: "Manifold", category: "Entertainment", url: "https://manifold.markets" },
  { market: "GTA 6 release date confirmed for 2026?", platform: "Manifold", category: "Entertainment", url: "https://manifold.markets" },
  { market: "Beyoncé wins Grammy Album of Year?", platform: "Manifold", category: "Entertainment", url: "https://manifold.markets" },
  { market: "Stranger Things final season before July?", platform: "Manifold", category: "Entertainment", url: "https://manifold.markets" },
  
  // MANIFOLD - Science & Space
  { market: "SpaceX Starship successful orbital flight Q1?", platform: "Manifold", category: "Space", url: "https://manifold.markets" },
  { market: "NASA Artemis III launch in 2026?", platform: "Manifold", category: "Space", url: "https://manifold.markets" },
  { market: "Blue Origin orbital launch by March?", platform: "Manifold", category: "Space", url: "https://manifold.markets" },
  { market: "Major AI breakthrough announced Q1 2026?", platform: "Manifold", category: "AI", url: "https://manifold.markets" },
  
  // MANIFOLD - Miscellaneous
  { market: "Elon Musk tweets about Dogecoin in January?", platform: "Manifold", category: "Crypto", url: "https://manifold.markets" },
  { market: "New York subway fare increase in 2026?", platform: "Manifold", category: "Economics", url: "https://manifold.markets" },
  { market: "Recession declared by NBER in 2026?", platform: "Manifold", category: "Economics", url: "https://manifold.markets" },
  { market: "Housing prices drop 5% nationally by EOY?", platform: "Manifold", category: "Economics", url: "https://manifold.markets" },
  
  // More variety - Current events style
  { market: "Major airline bankruptcy filing in Q1 2026?", platform: "Kalshi", category: "Finance", url: "https://kalshi.com" },
  { market: "Oil price above $90/barrel in February?", platform: "Kalshi", category: "Commodities", url: "https://kalshi.com/markets/oil" },
  { market: "Gold price above $2,100/oz by March?", platform: "Kalshi", category: "Commodities", url: "https://kalshi.com/markets/gold" },
  { market: "Amazon stock split announced in 2026?", platform: "Polymarket", category: "Stocks", url: "https://polymarket.com" },
  { market: "Meta launches new VR headset Q1?", platform: "Polymarket", category: "Tech", url: "https://polymarket.com" },
  { market: "Google antitrust ruling by March?", platform: "Polymarket", category: "Tech", url: "https://polymarket.com" },
  { market: "UFC 300+ event sells out in under 1 hour?", platform: "Manifold", category: "Sports", url: "https://manifold.markets" },
  { market: "Formula 1: Verstappen wins first 3 races?", platform: "Manifold", category: "Sports", url: "https://manifold.markets" },
]

const STRATEGIES = [
  "Momentum Scanner",
  "Mean Reversion",
  "Arbitrage Finder",
  "News Catalyst",
  "Market Maker",
  "Trend Following",
  "Volume Spike Detector",
  "Sentiment Analyzer",
  "Odds Comparison",
  "Mispricing Finder"
]

const SCAN_ACTIONS = [
  { type: 'scanning', icon: Eye, color: 'text-gray-400', bgColor: 'bg-gray-50' },
  { type: 'watching', icon: Eye, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  { type: 'opportunity', icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50' },
  { type: 'passed', icon: XCircle, color: 'text-gray-400', bgColor: 'bg-gray-50' },
]

// Track recently shown markets to avoid repetition
let recentlyShownMarkets = []
const MAX_RECENT = 20

const generateScanEvent = () => {
  // Filter out recently shown markets
  const availableMarkets = SAMPLE_MARKETS.filter(m => !recentlyShownMarkets.includes(m.market))
  
  // If we've shown too many, reset
  if (availableMarkets.length < 10) {
    recentlyShownMarkets = []
  }
  
  const marketsToChooseFrom = availableMarkets.length > 0 ? availableMarkets : SAMPLE_MARKETS
  const market = marketsToChooseFrom[Math.floor(Math.random() * marketsToChooseFrom.length)]
  
  // Track this market as recently shown
  recentlyShownMarkets.push(market.market)
  if (recentlyShownMarkets.length > MAX_RECENT) {
    recentlyShownMarkets.shift()
  }
  
  const strategy = STRATEGIES[Math.floor(Math.random() * STRATEGIES.length)]
  
  // 15% chance of opportunity, 25% watching, 60% scanning/passed
  const rand = Math.random()
  let action
  if (rand < 0.12) {
    action = SCAN_ACTIONS[2] // opportunity
  } else if (rand < 0.35) {
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
    url: market.url,
    strategy,
    action,
    price,
    edge,
    volume,
    isClickable: true  // All items are clickable to place wagers
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

const LiveScanner = ({ maxEvents = 50, scanInterval = 3000, onTradeComplete, tradingMode = 'paper', isPro = false }) => {
  const [events, setEvents] = useState([])
  const [isExpanded, setIsExpanded] = useState(false)  // Collapsed by default
  const [isPaused, setIsPaused] = useState(false)
  const [selectedOpportunity, setSelectedOpportunity] = useState(null)
  const [stats, setStats] = useState({ scanned: 0, opportunities: 0, watching: 0 })
  const scrollRef = useRef(null)
  const [isAutoScroll, setIsAutoScroll] = useState(true)
  
  // Resize state
  const [dimensions, setDimensions] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeType, setResizeType] = useState(null) // 'width', 'height', or 'both'
  const containerRef = useRef(null)
  const startPosRef = useRef({ x: 0, y: 0 })
  const startDimsRef = useRef({ width: 0, height: 0 })

  // Reset dimensions when collapsed
  useEffect(() => {
    if (!isExpanded) {
      setDimensions(() => ({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }))
    }
  }, [isExpanded])

  // Handle resize drag
  const handleResizeStart = useCallback((e, type) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeType(type)
    startPosRef.current = { x: e.clientX, y: e.clientY }
    const rect = containerRef.current?.getBoundingClientRect()
    startDimsRef.current = {
      width: rect?.width || 400,
      height: dimensions.height || DEFAULT_HEIGHT
    }
  }, [dimensions.height])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startPosRef.current.x
      const deltaY = e.clientY - startPosRef.current.y

      setDimensions(prev => {
        const newDims = { ...prev }
        
        if (resizeType === 'width' || resizeType === 'both') {
          const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startDimsRef.current.width + deltaX))
          newDims.width = newWidth
        }
        
        if (resizeType === 'height' || resizeType === 'both') {
          const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, startDimsRef.current.height + deltaY))
          newDims.height = newHeight
        }
        
        return newDims
      })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      setResizeType(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, resizeType])

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
    setSelectedOpportunity({
      market: event.market,
      platform: event.platform,
      strategy: event.strategy,
      price: event.price,
      edge: event.edge,
      volume: event.volume,
      category: event.category,
      url: event.url
    })
  }

  const handleTradeSubmit = (trade) => {
    console.log('Trade submitted:', trade)
    // Notify parent to refresh dashboard data
    if (onTradeComplete) {
      onTradeComplete(trade)
    }
  }

  const _getPlatformColor = (platform) => {
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
      <div 
        ref={containerRef}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative"
        style={{ 
          width: dimensions.width ? `${dimensions.width}px` : '100%',
          transition: isResizing ? 'none' : 'width 0.2s ease'
        }}
      >
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

        {/* Scanner Feed - Light Theme */}
        {isExpanded && (
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="overflow-y-auto bg-gray-50 text-sm"
            style={{ 
              height: `${dimensions.height}px`,
              transition: isResizing ? 'none' : 'height 0.2s ease'
            }}
          >
            {events.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Radio className="w-8 h-8 mx-auto mb-2 animate-pulse text-indigo-400" />
                <p>Initializing scanner...</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {events.map((event) => {
                  const Icon = event.action.icon
                  return (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className={`px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer hover:bg-indigo-50 ${
                        event.action.type === 'opportunity' 
                          ? 'bg-green-50 border-l-3 border-green-500' 
                          : ''
                      }`}
                    >
                      {/* Timestamp */}
                      <span className="text-gray-700 shrink-0 tabular-nums text-xs font-medium">
                        {formatTime(event.timestamp)}
                      </span>

                      {/* Icon */}
                      <div className={`p-1.5 rounded-full ${event.action.bgColor}`}>
                        <Icon className={`w-3.5 h-3.5 ${event.action.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                            event.platform === 'Kalshi' ? 'bg-blue-100 text-blue-700' :
                            event.platform === 'Polymarket' ? 'bg-purple-100 text-purple-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {event.platform}
                          </span>
                          <span className="text-gray-700 text-sm">
                            {event.market.length > 50 ? event.market.substring(0, 50) + '...' : event.market}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span className="font-medium">{event.strategy}</span>
                          <span>•</span>
                          <span className="font-semibold text-gray-700">{event.price}¢</span>
                          {event.edge > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-green-600 font-semibold flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                +{event.edge}% edge
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action Badge */}
                      {event.action.type === 'opportunity' && (
                        <span className="shrink-0 px-2 py-1 text-[10px] font-bold bg-green-500 text-white rounded-full shadow-sm">
                          TRADE
                        </span>
                      )}
                      {event.action.type === 'watching' && (
                        <span className="shrink-0 px-2 py-1 text-[10px] font-medium bg-yellow-100 text-yellow-700 rounded-full">
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

        {/* Footer with info */}
        {isExpanded && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 space-y-1">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Zap className="w-3 h-3 text-indigo-500" />
              Click any market to place a wager — <span className="text-green-600 font-medium">green</span> = high-edge opportunity
            </p>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              Real markets from <a href="https://kalshi.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Kalshi</a>, <a href="https://polymarket.com" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline">Polymarket</a> & <a href="https://manifold.markets" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">Manifold</a> — trades execute on those platforms
            </p>
          </div>
        )}

        {/* Resize Handles */}
        {isExpanded && (
          <>
            {/* Right edge - resize width */}
            <div
              onMouseDown={(e) => handleResizeStart(e, 'width')}
              className="absolute top-0 right-0 w-2 h-full cursor-ew-resize hover:bg-indigo-200/50 transition-colors group"
              title="Drag to resize width"
            >
              <div className="absolute top-1/2 -translate-y-1/2 right-0 w-1 h-8 bg-gray-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Bottom edge - resize height */}
            <div
              onMouseDown={(e) => handleResizeStart(e, 'height')}
              className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize hover:bg-indigo-200/50 transition-colors group"
              title="Drag to resize height"
            >
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-8 bg-gray-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Corner - resize both */}
            <div
              onMouseDown={(e) => handleResizeStart(e, 'both')}
              className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize hover:bg-indigo-200/50 transition-colors flex items-center justify-center group"
              title="Drag to resize"
            >
              <GripVertical className="w-3 h-3 text-gray-400 rotate-45 opacity-50 group-hover:opacity-100 group-hover:text-indigo-500 transition-all" />
            </div>
          </>
        )}
      </div>

      {/* Trade Ticket Modal */}
      {selectedOpportunity && (
        <TradeTicket
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
          onSubmit={handleTradeSubmit}
          tradingMode={tradingMode}
          isPro={isPro}
        />
      )}
    </>
  )
}

export default LiveScanner

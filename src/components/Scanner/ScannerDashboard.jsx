/**
 * Scanner Dashboard - IBKR-Style Professional Trading UI
 * 320px fixed left panel + scrollable data grid
 * No wasted space, maximum information density
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../../hooks/useApp';
import {
  Play,
  Pause,
  Square,
  Settings,
  Plus,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Info,
  X,
  AlertTriangle,
  Loader2,
  Eye,
  XCircle,
  Zap,
  Radio,
  ExternalLink,
  Receipt,
  Clock,
  DollarSign,
  Target,
  Calendar,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ============================================
// SAMPLE MARKETS - Real markets from platforms
// ============================================

const SAMPLE_MARKETS = [
  // KALSHI - Economics & Weather
  { market: "Fed funds rate above 4.5% end of Q1 2026?", platform: "Kalshi", category: "Economics", url: "https://kalshi.com/markets/fed" },
  { market: "Snowfall in Chicago above 6 inches this week?", platform: "Kalshi", category: "Weather", url: "https://kalshi.com/markets/weather" },
  { market: "S&P 500 above 6,000 by March 31?", platform: "Kalshi", category: "Stocks", url: "https://kalshi.com/markets/inx" },
  { market: "Tesla Q4 deliveries above 500K?", platform: "Kalshi", category: "Stocks", url: "https://kalshi.com/markets/tsla" },
  { market: "Apple revenue above $120B in Q1 2026?", platform: "Kalshi", category: "Stocks", url: "https://kalshi.com/markets/aapl" },
  { market: "NYC temperature below 20°F on Jan 25?", platform: "Kalshi", category: "Weather", url: "https://kalshi.com/markets/weather" },
  { market: "NVIDIA earnings beat estimates Q1 2026?", platform: "Kalshi", category: "Stocks", url: "https://kalshi.com/markets/nvda" },
  { market: "US CPI inflation above 3% in February?", platform: "Kalshi", category: "Economics", url: "https://kalshi.com/markets/cpi" },
  
  // POLYMARKET - Politics & Sports
  { market: "Republicans win Senate seat in 2026 special election?", platform: "Polymarket", category: "Politics", url: "https://polymarket.com/politics" },
  { market: "New tariffs on China above 25%?", platform: "Polymarket", category: "Politics", url: "https://polymarket.com/politics" },
  { market: "Chiefs win Super Bowl LX?", platform: "Polymarket", category: "Sports", url: "https://polymarket.com/sports" },
  { market: "Lakers make NBA playoffs 2026?", platform: "Polymarket", category: "Sports", url: "https://polymarket.com/sports" },
  { market: "Bitcoin above $120K by March 31?", platform: "Polymarket", category: "Crypto", url: "https://polymarket.com/crypto" },
  { market: "Ethereum above $5,000 by end of Q1?", platform: "Polymarket", category: "Crypto", url: "https://polymarket.com/crypto" },
  { market: "TikTok ban enforced by March 2026?", platform: "Polymarket", category: "Politics", url: "https://polymarket.com/politics" },
  { market: "OpenAI releases GPT-5 by June 2026?", platform: "Polymarket", category: "AI", url: "https://polymarket.com/ai" },
  
  // MANIFOLD - Entertainment & Misc
  { market: "Oscar Best Picture 2026: Anora?", platform: "Manifold", category: "Entertainment", url: "https://manifold.markets" },
  { market: "GTA 6 release date confirmed for 2026?", platform: "Manifold", category: "Entertainment", url: "https://manifold.markets" },
  { market: "Stranger Things final season before July?", platform: "Manifold", category: "Entertainment", url: "https://manifold.markets" },
  { market: "SpaceX Starship successful orbital flight Q1?", platform: "Manifold", category: "Space", url: "https://manifold.markets" },
  { market: "Taylor Swift announces new album Q1 2026?", platform: "Manifold", category: "Entertainment", url: "https://manifold.markets" },
  { market: "Major AI breakthrough announced Q1 2026?", platform: "Manifold", category: "AI", url: "https://manifold.markets" },
];

const STRATEGIES = [
  "Momentum Scanner",
  "Mean Reversion", 
  "Arbitrage Finder",
  "News Catalyst",
  "Market Maker",
  "Trend Following",
  "Volume Spike Detector",
  "Odds Comparison",
];

const SCAN_ACTIONS = [
  { type: 'scanning', icon: Eye, color: 'text-[#9CA3AF]', bgColor: 'bg-[#F3F4F6]' },
  { type: 'watching', icon: Eye, color: 'text-[#D97706]', bgColor: 'bg-[#FEF3C7]' },
  { type: 'opportunity', icon: TrendingUp, color: 'text-[#059669]', bgColor: 'bg-[#D1FAE5]' },
  { type: 'passed', icon: XCircle, color: 'text-[#9CA3AF]', bgColor: 'bg-[#F3F4F6]' },
];

// Track recently shown markets
let recentlyShownMarkets = [];

const generateScanEvent = () => {
  const availableMarkets = SAMPLE_MARKETS.filter(m => !recentlyShownMarkets.includes(m.market));
  if (availableMarkets.length < 5) recentlyShownMarkets = [];
  
  const marketsToChooseFrom = availableMarkets.length > 0 ? availableMarkets : SAMPLE_MARKETS;
  const market = marketsToChooseFrom[Math.floor(Math.random() * marketsToChooseFrom.length)];
  
  recentlyShownMarkets.push(market.market);
  if (recentlyShownMarkets.length > 15) recentlyShownMarkets.shift();
  
  const strategy = STRATEGIES[Math.floor(Math.random() * STRATEGIES.length)];
  
  const rand = Math.random();
  let action;
  if (rand < 0.12) action = SCAN_ACTIONS[2]; // opportunity
  else if (rand < 0.35) action = SCAN_ACTIONS[1]; // watching
  else if (rand < 0.70) action = SCAN_ACTIONS[0]; // scanning
  else action = SCAN_ACTIONS[3]; // passed
  
  const price = Math.floor(Math.random() * 80) + 10;
  const edge = action.type === 'opportunity' ? Math.floor(Math.random() * 15) + 3 : 0;
  
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
  };
};

const formatTime = (date) => {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false 
  });
};

// ============================================
// PLATFORM DEFINITIONS
// ============================================

const PLATFORMS = [
  { id: 'kalshi', name: 'Kalshi', status: 'connected' },
  { id: 'polymarket', name: 'Polymarket', status: 'connected' },
  { id: 'predictit', name: 'PredictIt', status: 'coming_soon' },
  { id: 'betfair', name: 'Betfair', status: 'coming_soon' },
  { id: 'manifold', name: 'Manifold', status: 'coming_soon' },
  { id: 'metaculus', name: 'Metaculus', status: 'coming_soon' },
];

// ============================================
// MARKET CATEGORIES - Polymarket Style
// ============================================

const CATEGORIES = [
  {
    id: 'all',
    name: 'All',
    count: 1089,
    children: null,
  },
  {
    id: 'sports',
    name: 'Sports',
    count: 702,
    children: [
      { id: 'basketball', name: 'Basketball', count: 421 },
      { id: 'soccer', name: 'Soccer', count: 150 },
      { id: 'hockey', name: 'Hockey', count: 68 },
      { id: 'tennis', name: 'Tennis', count: 50 },
      { id: 'table-tennis', name: 'Table Tennis', count: 6 },
      { id: 'cricket', name: 'Cricket', count: 3 },
      { id: 'football', name: 'Football', count: 2 },
      { id: 'golf', name: 'Golf', count: 2 },
    ],
  },
  {
    id: 'elections',
    name: 'Elections',
    count: 128,
    children: null,
  },
  {
    id: 'esports',
    name: 'Esports',
    count: 70,
    children: null,
  },
  {
    id: 'economics',
    name: 'Economics',
    count: 28,
    children: null,
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    count: 13,
    children: null,
  },
  {
    id: 'science-tech',
    name: 'Science & Technology',
    count: 6,
    children: null,
  },
  {
    id: 'companies',
    name: 'Companies',
    count: 2,
    children: null,
  },
  {
    id: 'crypto',
    name: 'Crypto',
    count: 45,
    children: null,
  },
  {
    id: 'politics',
    name: 'Politics',
    count: 95,
    children: null,
  },
];

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  PLATFORMS: 'ttm_scanner_platforms',
  SETTINGS: 'ttm_scanner_settings',
  FILTERS: 'ttm_scanner_filters',
};

// ============================================
// MOCK DATA GENERATOR
// ============================================

const generateMockOpportunities = () => [
  {
    id: '1',
    ticker: 'CHEFSW',
    event: 'Chiefs Win vs Ravens (Sun)',
    kalshiPrice: 0.45,
    kalshiTrend: 'up',
    polyPrice: 0.48,
    polyTrend: 'up',
    edge: 6.7,
    feeImpact: 2.5,
    netEdge: 4.2,
    volume: 50000,
    lastUpdate: 1.2,
    isOpportunity: true,
    category: 'football',
  },
  {
    id: '2',
    ticker: 'DONVOT',
    event: 'Democratic Victory 2026',
    kalshiPrice: 0.32,
    kalshiTrend: 'down',
    polyPrice: 0.30,
    polyTrend: 'down',
    edge: -6.3,
    feeImpact: 2.1,
    netEdge: -8.4,
    volume: 120000,
    lastUpdate: 0.8,
    isOpportunity: false,
    category: 'elections',
  },
  {
    id: '3',
    ticker: 'BTCPX',
    event: 'Bitcoin above $100k by EOY',
    kalshiPrice: 0.62,
    kalshiTrend: 'down',
    polyPrice: 0.61,
    polyTrend: 'down',
    edge: -1.6,
    feeImpact: 2.2,
    netEdge: -3.8,
    volume: 85000,
    lastUpdate: 0.5,
    isOpportunity: false,
    category: 'crypto',
  },
  {
    id: '4',
    ticker: 'NBAMVP',
    event: 'LeBron NBA MVP 2025',
    kalshiPrice: 0.78,
    kalshiTrend: 'up',
    polyPrice: 0.76,
    polyTrend: 'up',
    edge: 2.6,
    feeImpact: 2.0,
    netEdge: 0.6,
    volume: 200000,
    lastUpdate: 2.1,
    isOpportunity: true,
    category: 'basketball',
  },
  {
    id: '5',
    ticker: 'SUPERBW',
    event: 'Super Bowl Winner (KC/SF)',
    kalshiPrice: 0.55,
    kalshiTrend: 'up',
    polyPrice: 0.54,
    polyTrend: 'up',
    edge: 1.9,
    feeImpact: 2.3,
    netEdge: -0.4,
    volume: 150000,
    lastUpdate: 1.8,
    isOpportunity: false,
    category: 'football',
  },
  {
    id: '6',
    ticker: 'NBAFIN',
    event: 'Lakers vs Celtics Finals',
    kalshiPrice: 0.35,
    kalshiTrend: 'up',
    polyPrice: 0.38,
    polyTrend: 'up',
    edge: 8.6,
    feeImpact: 2.4,
    netEdge: 6.2,
    volume: 90000,
    lastUpdate: 0.9,
    isOpportunity: true,
    category: 'basketball',
  },
  {
    id: '7',
    ticker: 'FEDCUT',
    event: 'Fed Rate Cut by March',
    kalshiPrice: 0.42,
    kalshiTrend: 'down',
    polyPrice: 0.40,
    polyTrend: 'down',
    edge: -4.8,
    feeImpact: 2.0,
    netEdge: -6.8,
    volume: 175000,
    lastUpdate: 1.5,
    isOpportunity: false,
    category: 'economics',
  },
  {
    id: '8',
    ticker: 'ETHPX',
    event: 'Ethereum above $5k by Q2',
    kalshiPrice: 0.28,
    kalshiTrend: 'up',
    polyPrice: 0.31,
    polyTrend: 'up',
    edge: 10.7,
    feeImpact: 2.6,
    netEdge: 8.1,
    volume: 65000,
    lastUpdate: 0.6,
    isOpportunity: true,
    category: 'crypto',
  },
  {
    id: '9',
    ticker: 'OSCARS',
    event: 'Best Picture Winner 2026',
    kalshiPrice: 0.35,
    kalshiTrend: 'up',
    polyPrice: 0.37,
    polyTrend: 'up',
    edge: 5.7,
    feeImpact: 2.3,
    netEdge: 3.4,
    volume: 45000,
    lastUpdate: 1.1,
    isOpportunity: true,
    category: 'entertainment',
  },
  {
    id: '10',
    ticker: 'LEAGW',
    event: 'T1 Wins Worlds 2026',
    kalshiPrice: 0.52,
    kalshiTrend: 'down',
    polyPrice: 0.50,
    polyTrend: 'down',
    edge: -3.8,
    feeImpact: 2.1,
    netEdge: -5.9,
    volume: 82000,
    lastUpdate: 0.7,
    isOpportunity: false,
    category: 'esports',
  },
  {
    id: '11',
    ticker: 'WIMBL',
    event: 'Djokovic Wins Wimbledon',
    kalshiPrice: 0.68,
    kalshiTrend: 'up',
    polyPrice: 0.71,
    polyTrend: 'up',
    edge: 4.4,
    feeImpact: 2.2,
    netEdge: 2.2,
    volume: 55000,
    lastUpdate: 1.3,
    isOpportunity: true,
    category: 'tennis',
  },
  {
    id: '12',
    ticker: 'AIPROD',
    event: 'Apple AI Product Launch Q1',
    kalshiPrice: 0.72,
    kalshiTrend: 'up',
    polyPrice: 0.74,
    polyTrend: 'up',
    edge: 2.8,
    feeImpact: 2.0,
    netEdge: 0.8,
    volume: 95000,
    lastUpdate: 0.4,
    isOpportunity: true,
    category: 'science-tech',
  },
];

// ============================================
// BET SLIP MODAL COMPONENT
// ============================================
const BetSlipModal = ({ bet, onClose, onCloseBet }) => {
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

  const daysUntilExpiry = Math.ceil((new Date(bet.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-[520px] max-w-[95vw]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] bg-[#F9FAFB] rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#10B981]/10 rounded-lg">
              <Receipt className="w-5 h-5 text-[#10B981]" />
            </div>
            <div>
              <h3 className="font-bold text-[#111827] text-lg">Bet Slip</h3>
              <p className="text-xs text-[#6B7280] font-mono">#{bet.id}</p>
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
            <p className="text-lg font-semibold text-[#111827]">{bet.event}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-sm text-[#6B7280] font-mono">{bet.ticker}</span>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                bet.platform === 'Kalshi' ? 'bg-[#DBEAFE] text-[#1D4ED8]' :
                bet.platform === 'Polymarket' ? 'bg-[#EDE9FE] text-[#7C3AED]' :
                'bg-[#FFEDD5] text-[#C2410C]'
              }`}>
                {bet.platform}
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
                  bet.position === 'YES' ? 'bg-[#D1FAE5] text-[#059669]' : 'bg-[#FEE2E2] text-[#DC2626]'
                }`}>
                  {bet.position}
                </span>
                <span className="text-[#111827] font-semibold">{bet.contracts} contracts</span>
              </div>
            </div>
            <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB]">
              <div className="flex items-center gap-2 text-[#6B7280] text-xs mb-1">
                <Zap className="w-3.5 h-3.5" />
                Strategy
              </div>
              <span className="text-[#111827] font-semibold text-sm">{bet.strategy}</span>
            </div>
          </div>
          
          {/* Price Info */}
          <div className="bg-[#F9FAFB] rounded-xl p-4 space-y-3 text-sm font-mono border border-[#E5E7EB]">
            <div className="flex justify-between">
              <span className="text-[#6B7280] flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5" />
                Entry Price
              </span>
              <span className="text-[#111827] font-medium">${bet.entryPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Current Price</span>
              <span className={`font-medium ${
                bet.currentPrice > bet.entryPrice ? 'text-[#10B981]' : 
                bet.currentPrice < bet.entryPrice ? 'text-[#EF4444]' : 'text-[#111827]'
              }`}>
                ${bet.currentPrice.toFixed(2)}
                {bet.currentPrice !== bet.entryPrice && (
                  <span className="ml-1 text-xs">
                    ({bet.currentPrice > bet.entryPrice ? '+' : ''}{((bet.currentPrice - bet.entryPrice) / bet.entryPrice * 100).toFixed(1)}%)
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Potential Payout</span>
              <span className="text-[#111827] font-medium">${bet.potentialPayout.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-[#E5E7EB] pt-3 mt-3">
              <span className="text-[#111827] font-bold">Unrealized P&L</span>
              <span className={`font-bold ${bet.profit >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {bet.profit >= 0 ? '+' : ''}${bet.profit.toFixed(2)} ({bet.profit >= 0 ? '+' : ''}{bet.profitPercent.toFixed(1)}%)
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
              <span className="text-[#111827] text-sm">{formatDate(bet.placedAt)}</span>
            </div>
            <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB]">
              <div className="flex items-center gap-2 text-[#6B7280] text-xs mb-1">
                <Calendar className="w-3.5 h-3.5" />
                Expires
              </div>
              <span className="text-[#111827] text-sm">{formatExpiryDate(bet.expiresAt)}</span>
              <span className={`ml-2 text-xs font-medium ${
                daysUntilExpiry <= 7 ? 'text-[#EF4444]' : 
                daysUntilExpiry <= 30 ? 'text-[#F59E0B]' : 'text-[#6B7280]'
              }`}>
                ({daysUntilExpiry}d)
              </span>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="flex items-center justify-center">
            <span className="px-4 py-2 bg-[#D1FAE5] text-[#059669] text-sm font-semibold rounded-full flex items-center gap-2">
              <span className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
              Position Active
            </span>
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
          <button
            onClick={() => {
              onCloseBet(bet.id, bet.currentPrice);
              onClose();
            }}
            className="flex-1 px-4 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-lg font-semibold transition-colors shadow-sm"
          >
            Close Position
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// EXECUTE MODAL COMPONENT - Kalshi Style
// ============================================

const ExecuteModal = ({ opportunity, onClose, onConfirm }) => {
  const [contracts, setContracts] = useState(100);
  
  const buyTotal = (opportunity.kalshiPrice * contracts).toFixed(2);
  const sellTotal = (opportunity.polyPrice * contracts).toFixed(2);
  const grossProfit = (sellTotal - buyTotal).toFixed(2);
  const fees = ((parseFloat(buyTotal) + parseFloat(sellTotal)) * (opportunity.feeImpact / 100)).toFixed(2);
  const netProfit = (grossProfit - fees).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-[480px] max-w-[95vw]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
          <h3 className="font-bold text-[#111827] text-lg">Confirm Arbitrage Trade</h3>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#374151] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="text-center">
            <p className="text-lg font-semibold text-[#111827]">{opportunity.event}</p>
            <p className="text-sm text-[#6B7280] font-mono">{opportunity.ticker}</p>
          </div>
          
          <div className="border-t border-b border-[#E5E7EB] py-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#6B7280]">BUY on Kalshi</span>
              <span className="text-[#10B981] font-mono font-medium">@ ${opportunity.kalshiPrice.toFixed(2)} (YES)</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#6B7280]">SELL on Polymarket</span>
              <span className="text-[#EF4444] font-mono font-medium">@ ${opportunity.polyPrice.toFixed(2)} (YES)</span>
            </div>
          </div>
          
          <div>
            <label className="text-sm text-[#6B7280] font-medium">Position Size</label>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="number"
                value={contracts}
                onChange={(e) => setContracts(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111827] font-mono focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 outline-none"
              />
              <span className="text-[#6B7280]">contracts</span>
            </div>
          </div>
          
          <div className="bg-[#F9FAFB] rounded-xl p-4 space-y-2.5 text-sm font-mono border border-[#E5E7EB]">
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Total Investment (BUY)</span>
              <span className="text-[#111827] font-medium">${buyTotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Total Revenue (SELL)</span>
              <span className="text-[#111827] font-medium">${sellTotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Gross Profit</span>
              <span className="text-[#10B981] font-medium">${grossProfit} ({opportunity.edge}%)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Estimated Fees</span>
              <span className="text-[#F59E0B] font-medium">-${fees} ({opportunity.feeImpact}%)</span>
            </div>
            <div className="flex justify-between border-t border-[#E5E7EB] pt-2.5 mt-2.5">
              <span className="text-[#111827] font-bold">NET PROFIT</span>
              <span className={`font-bold ${parseFloat(netProfit) >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                ${netProfit} ({opportunity.netEdge}%)
              </span>
            </div>
          </div>
          
          <div className="bg-[#FEF3C7] border border-[#FCD34D] rounded-xl p-4 text-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#D97706] mt-0.5 shrink-0" />
              <div className="text-[#92400E]">
                <p className="font-medium">This will execute real trades on both platforms.</p>
                <p className="mt-1 text-[#B45309]">Trades will execute simultaneously.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-[#E5E7EB] bg-[#F9FAFB] rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white hover:bg-[#F3F4F6] text-[#374151] rounded-lg transition-colors border border-[#D1D5DB] font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(contracts)}
            className="flex-1 px-4 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-semibold transition-colors shadow-sm"
          >
            Confirm Trade
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN SCANNER DASHBOARD
// ============================================

const ScannerDashboard = ({ onNavigate }) => {
  // Get global state from context
  const { 
    openBets, 
    placeBet, 
    closeBet, 
    portfolioStats,
  } = useApp();

  // Load saved preferences
  const loadSavedPrefs = () => {
    try {
      const platforms = localStorage.getItem(STORAGE_KEYS.PLATFORMS);
      const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const filters = localStorage.getItem(STORAGE_KEYS.FILTERS);
      return {
        platforms: platforms ? JSON.parse(platforms) : ['kalshi', 'polymarket'],
        settings: settings ? JSON.parse(settings) : {
          minEdge: 2.5,
          maxPosition: 600,
          stopLoss: 25,
          takeProfit: 25,
          strategy: 'manual',
        },
        filters: filters ? JSON.parse(filters) : ['all'],
      };
    } catch {
      return {
        platforms: ['kalshi', 'polymarket'],
        settings: { minEdge: 2.5, maxPosition: 600, stopLoss: 25, takeProfit: 25, strategy: 'manual' },
        filters: ['all'],
      };
    }
  };

  const saved = loadSavedPrefs();

  // State
  const [selectedPlatforms, setSelectedPlatforms] = useState(saved.platforms);
  const [settings, setSettings] = useState(saved.settings);
  const [selectedFilters, setSelectedFilters] = useState(saved.filters);
  const [expandedCategories, setExpandedCategories] = useState(['sports']);
  
  const [scannerState, setScannerState] = useState('idle'); // idle, scanning, paused
  const [opportunities, setOpportunities] = useState([]);
  const [stats, setStats] = useState({ markets: 0, opportunities: 0, lastUpdate: null });
  
  // Live feed state - same as homepage scanner
  const [liveFeed, setLiveFeed] = useState([]);
  const [liveStats, setLiveStats] = useState({ scanned: 0, opportunities: 0, watching: 0 });
  const liveFeedRef = useRef(null);
  
  const [executeModal, setExecuteModal] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  
  // Open bets UI state (using global openBets from context)
  const [selectedBetSlip, setSelectedBetSlip] = useState(null);
  const [showOpenBets, setShowOpenBets] = useState(true);
  
  const scanIntervalRef = useRef(null);
  const liveFeedIntervalRef = useRef(null);

  // Save preferences
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PLATFORMS, JSON.stringify(selectedPlatforms));
  }, [selectedPlatforms]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(selectedFilters));
  }, [selectedFilters]);

  // Platform toggle
  const togglePlatform = (id) => {
    const platform = PLATFORMS.find(p => p.id === id);
    if (platform?.status === 'coming_soon') return;
    
    setSelectedPlatforms(prev => {
      if (prev.includes(id)) {
        return prev.filter(p => p !== id);
      }
      return [...prev, id];
    });
  };

  // Category toggle
  const toggleCategory = (id) => {
    setExpandedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  // Filter toggle
  const toggleFilter = (id) => {
    if (id === 'all') {
      setSelectedFilters(['all']);
      return;
    }
    setSelectedFilters(prev => {
      const newFilters = prev.filter(f => f !== 'all');
      if (newFilters.includes(id)) {
        const result = newFilters.filter(f => f !== id);
        return result.length === 0 ? ['all'] : result;
      }
      return [...newFilters, id];
    });
  };

  // Start scanning - includes live feed
  const startScanning = useCallback(() => {
    if (selectedPlatforms.length < 2) return;
    
    setScannerState('scanning');
    setOpportunities(generateMockOpportunities());
    setStats({ markets: 23, opportunities: 3, lastUpdate: new Date() });

    // Start arbitrage grid polling
    scanIntervalRef.current = setInterval(() => {
      setOpportunities(prev => prev.map(opp => ({
        ...opp,
        kalshiPrice: Math.max(0.01, Math.min(0.99, opp.kalshiPrice + (Math.random() - 0.5) * 0.02)),
        polyPrice: Math.max(0.01, Math.min(0.99, opp.polyPrice + (Math.random() - 0.5) * 0.02)),
        kalshiTrend: Math.random() > 0.5 ? 'up' : 'down',
        polyTrend: Math.random() > 0.5 ? 'up' : 'down',
        lastUpdate: Math.random() * 3,
      })));
      setStats(prev => ({ ...prev, lastUpdate: new Date() }));
    }, 2000);

    // Start live feed - same as homepage scanner
    liveFeedIntervalRef.current = setInterval(() => {
      const newEvent = generateScanEvent();
      setLiveFeed(prev => [newEvent, ...prev].slice(0, 50));
      setLiveStats(prev => ({
        scanned: prev.scanned + 1,
        opportunities: newEvent.action.type === 'opportunity' ? prev.opportunities + 1 : prev.opportunities,
        watching: newEvent.action.type === 'watching' ? prev.watching + 1 : prev.watching,
      }));
      
      // Auto-scroll to top
      if (liveFeedRef.current) {
        liveFeedRef.current.scrollTop = 0;
      }
    }, 3000);

    // Initial events
    const initialEvents = Array.from({ length: 5 }, () => generateScanEvent());
    setLiveFeed(initialEvents);
    setLiveStats({ scanned: 5, opportunities: initialEvents.filter(e => e.action.type === 'opportunity').length, watching: initialEvents.filter(e => e.action.type === 'watching').length });
  }, [selectedPlatforms]);

  // Pause scanning
  const pauseScanning = () => {
    setScannerState('paused');
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    if (liveFeedIntervalRef.current) clearInterval(liveFeedIntervalRef.current);
  };

  // Stop scanning
  const stopScanning = () => {
    setScannerState('idle');
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    if (liveFeedIntervalRef.current) clearInterval(liveFeedIntervalRef.current);
    setOpportunities([]);
    setLiveFeed([]);
    setStats({ markets: 0, opportunities: 0, lastUpdate: null });
    setLiveStats({ scanned: 0, opportunities: 0, watching: 0 });
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      if (liveFeedIntervalRef.current) clearInterval(liveFeedIntervalRef.current);
    };
  }, []);

  // Filter opportunities
  const filteredOpportunities = opportunities.filter(opp => {
    if (selectedFilters.includes('all')) return true;
    return selectedFilters.some(f => 
      opp.category === f || 
      CATEGORIES.find(c => c.id === f)?.children?.some(child => child.id === opp.category)
    );
  });

  // Count opportunities by threshold
  const opportunityCount = filteredOpportunities.filter(o => o.netEdge >= settings.minEdge).length;

  // Time ago helper
  const formatLastUpdate = (date) => {
    if (!date) return 'Never';
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  // Handle execute
  const handleExecute = (opportunity) => {
    setExecuteModal(opportunity);
  };

  // Handle confirm trade - places bet using global state
  const handleConfirmTrade = (contracts) => {
    if (!executeModal) return;
    
    // Place bet using global context
    placeBet({
      ticker: executeModal.ticker,
      event: executeModal.event,
      platform: 'Kalshi', // Primary buy platform
      position: 'YES',
      contracts: contracts,
      entryPrice: executeModal.kalshiPrice,
      potentialPayout: contracts * 1.00,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      strategy: 'Arbitrage',
    });
    
    alert(`Trade executed: ${contracts} contracts of ${executeModal.ticker} — Check Open Bets!`);
    setExecuteModal(null);
  };

  // Add to watchlist
  const addToWatchlist = (opportunity) => {
    if (!watchlist.find(w => w.id === opportunity.id)) {
      setWatchlist(prev => [...prev, opportunity]);
    }
  };

  const canStart = selectedPlatforms.length >= 2;

  return (
    <div className="h-screen w-full bg-[#F9FAFB] text-[#111827] flex flex-col overflow-hidden">
      {/* ============================================ */}
      {/* MAIN CONTAINER - LEFT PANEL + DATA GRID */}
      {/* ============================================ */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* ============================================ */}
        {/* LEFT PANEL - 280px FIXED, NO SCROLL */}
        {/* ============================================ */}
        <div className="w-72 bg-white border-r border-[#E5E7EB] flex flex-col shrink-0 overflow-hidden">
          
          {/* SCANNER STATUS - Compact */}
          <div className="px-3 py-2 border-b border-[#E5E7EB] shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  scannerState === 'scanning' ? 'bg-[#10B981] animate-pulse' :
                  scannerState === 'paused' ? 'bg-[#F59E0B]' : 'bg-[#9CA3AF]'
                }`} />
                <span className="text-[11px] font-semibold text-[#111827] uppercase">
                  {scannerState === 'scanning' ? 'SCANNING' :
                   scannerState === 'paused' ? 'PAUSED' : 'IDLE'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-[#6B7280]">
                <span>Markets: <span className="text-[#111827]">{stats.markets}</span></span>
                <span>Opp: <span className="text-[#10B981] font-semibold">{opportunityCount}</span></span>
              </div>
            </div>
          </div>

          {/* PLATFORMS - Compact grid */}
          <div className="px-3 py-2 border-b border-[#E5E7EB] shrink-0">
            <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Platforms</p>
            <div className="grid grid-cols-2 gap-1">
              {PLATFORMS.slice(0, 4).map(platform => {
                const isSelected = selectedPlatforms.includes(platform.id);
                const isAvailable = platform.status === 'connected';
                return (
                  <label
                    key={platform.id}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#10B981]/10 border border-[#10B981]' : 'bg-[#F3F4F6] border border-[#E5E7EB] hover:border-[#10B981]'
                    } ${!isAvailable && 'opacity-40 cursor-not-allowed'}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => togglePlatform(platform.id)}
                      disabled={!isAvailable}
                      className="w-3 h-3 rounded border-[#D1D5DB] bg-white text-[#10B981] accent-[#10B981]"
                    />
                    <span className="text-[#111827]">{platform.name}</span>
                    {isAvailable && <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] ml-auto"></span>}
                  </label>
                );
              })}
            </div>
          </div>

          {/* MARKET FILTERS - Kalshi-style horizontal chips */}
          <div className="px-3 py-2 border-b border-[#E5E7EB] shrink-0">
            <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Categories</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(category => {
                const isSelected = selectedFilters.includes(category.id);
                return (
                  <button
                    key={category.id}
                    onClick={() => toggleFilter(category.id)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                      isSelected 
                        ? 'bg-[#10B981] text-white' 
                        : 'bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB] hover:border-[#10B981] hover:text-[#10B981]'
                    }`}
                  >
                    {category.name} <span className="opacity-60">({category.count})</span>
                  </button>
                );
              })}
            </div>
            {/* Subcategories for Sports */}
            {(selectedFilters.includes('sports')) && (
              <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-[#E5E7EB]">
                <span className="text-[10px] text-[#9CA3AF] mr-1 self-center">Sports:</span>
                {CATEGORIES.find(c => c.id === 'sports')?.children?.map(child => {
                  const isSelected = selectedFilters.includes(child.id);
                  return (
                    <button
                      key={child.id}
                      onClick={() => toggleFilter(child.id)}
                      className={`px-2.5 py-1 rounded-full text-[11px] transition-colors ${
                        isSelected 
                          ? 'bg-[#3B82F6] text-white' 
                          : 'bg-[#E5E7EB] text-[#6B7280] hover:bg-[#D1D5DB]'
                      }`}
                    >
                      {child.name} ({child.count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* THRESHOLDS - Compact 2x2 grid */}
          <div className="px-3 py-2 border-b border-[#E5E7EB] shrink-0">
            <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Thresholds</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-[#6B7280]">Min Edge %</label>
                <input
                  type="number"
                  value={settings.minEdge}
                  onChange={(e) => setSettings(prev => ({ ...prev, minEdge: parseFloat(e.target.value) || 0 }))}
                  className="w-full mt-0.5 px-2 py-1 bg-white border border-[#D1D5DB] rounded-lg text-[12px] font-mono text-[#111827] h-8 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] outline-none"
                  step="0.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#6B7280]">Max Pos $</label>
                <input
                  type="number"
                  value={settings.maxPosition}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxPosition: parseFloat(e.target.value) || 0 }))}
                  className="w-full mt-0.5 px-2 py-1 bg-white border border-[#D1D5DB] rounded-lg text-[12px] font-mono text-[#111827] h-8 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] outline-none"
                  step="50"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#6B7280]">Stop Loss %</label>
                <input
                  type="number"
                  value={settings.stopLoss}
                  onChange={(e) => setSettings(prev => ({ ...prev, stopLoss: parseFloat(e.target.value) || 0 }))}
                  className="w-full mt-0.5 px-2 py-1 bg-white border border-[#D1D5DB] rounded-lg text-[12px] font-mono text-[#111827] h-8 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] outline-none"
                  step="5"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#6B7280]">Take Profit %</label>
                <input
                  type="number"
                  value={settings.takeProfit}
                  onChange={(e) => setSettings(prev => ({ ...prev, takeProfit: parseFloat(e.target.value) || 0 }))}
                  className="w-full mt-0.5 px-2 py-1 bg-white border border-[#D1D5DB] rounded-lg text-[12px] font-mono text-[#111827] h-8 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] outline-none"
                  step="5"
                />
              </div>
            </div>
            {/* Strategy as horizontal pills */}
            <div className="flex gap-1.5 mt-2">
              {[
                { value: 'manual', label: 'Manual' },
                { value: 'aggressive', label: 'Auto-Agg' },
                { value: 'conservative', label: 'Auto-Con' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setSettings(prev => ({ ...prev, strategy: option.value }))}
                  className={`flex-1 py-1.5 rounded-full text-[10px] font-medium transition-colors ${
                    settings.strategy === option.value
                      ? 'bg-[#10B981] text-white'
                      : 'bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB] hover:border-[#10B981]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* CONTROL BUTTONS - Compact row */}
          <div className="px-3 py-3 shrink-0 mt-auto border-t border-[#E5E7EB] bg-[#F9FAFB]">
            <div className="flex gap-2">
              <button
                onClick={scannerState === 'scanning' ? stopScanning : startScanning}
                disabled={!canStart}
                className={`flex-1 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors text-[13px] shadow-sm ${
                  scannerState === 'scanning'
                    ? 'bg-[#1F2937] hover:bg-[#111827] text-white'
                    : 'bg-[#10B981] hover:bg-[#059669] text-white disabled:opacity-50'
                }`}
              >
                {scannerState === 'scanning' ? (
                  <><Square className="w-3.5 h-3.5" /> Stop</>
                ) : (
                  <><Play className="w-3.5 h-3.5" /> Start</>
                )}
              </button>
              {scannerState === 'scanning' && (
                <button
                  onClick={pauseScanning}
                  className="px-3 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-lg font-semibold transition-colors text-[12px] shadow-sm"
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => onNavigate?.('settings')}
                className="px-3 py-2.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#374151] rounded-lg transition-colors border border-[#E5E7EB]"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* MAIN CONTENT - Live Feed + Data Grid */}
        {/* ============================================ */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-white">
          
          {/* LIVE FEED SECTION - Same as homepage scanner */}
          <div className="border-b border-[#E5E7EB] shrink-0">
            {/* Live Feed Header */}
            <div className="px-4 py-2 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Radio className="w-4 h-4 text-[#10B981]" />
                  {scannerState === 'scanning' && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
                  )}
                </div>
                <span className="text-[13px] font-semibold text-[#111827]">Live Market Scanner</span>
                {scannerState === 'scanning' && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#D1FAE5] text-[#059669] rounded animate-pulse">
                    LIVE
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#6B7280]">
                {liveStats.scanned} scanned • <span className="text-[#10B981] font-medium">{liveStats.opportunities} opportunities</span> • {liveStats.watching} watching
              </div>
            </div>
            
            {/* Live Feed List */}
            <div 
              ref={liveFeedRef}
              className="h-[280px] overflow-y-auto bg-[#FAFAFA]"
            >
              {scannerState === 'idle' ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Radio className="w-8 h-8 text-[#D1D5DB] mb-3" />
                  <p className="text-[#6B7280] text-sm">Click <span className="text-[#10B981] font-medium">Start</span> to begin scanning markets</p>
                </div>
              ) : liveFeed.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Radio className="w-6 h-6 text-[#10B981] animate-pulse mb-2" />
                  <p className="text-[#6B7280] text-sm">Initializing scanner...</p>
                </div>
              ) : (
                <div className="divide-y divide-[#E5E7EB]">
                  {liveFeed.map((event) => {
                    const Icon = event.action.icon;
                    return (
                      <div
                        key={event.id}
                        className={`px-4 py-2.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-[#F0FDF4] ${
                          event.action.type === 'opportunity' 
                            ? 'bg-[#F0FDF4] border-l-2 border-[#10B981]' 
                            : ''
                        }`}
                      >
                        {/* Timestamp */}
                        <span className="text-[#374151] shrink-0 tabular-nums text-[11px] font-medium w-16">
                          {formatTime(event.timestamp)}
                        </span>

                        {/* Icon */}
                        <div className={`p-1 rounded-full ${event.action.bgColor}`}>
                          <Icon className={`w-3 h-3 ${event.action.color}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              event.platform === 'Kalshi' ? 'bg-[#DBEAFE] text-[#1D4ED8]' :
                              event.platform === 'Polymarket' ? 'bg-[#EDE9FE] text-[#7C3AED]' :
                              'bg-[#FFEDD5] text-[#C2410C]'
                            }`}>
                              {event.platform}
                            </span>
                            <span className="text-[#374151] text-[12px]">
                              {event.market.length > 55 ? event.market.substring(0, 55) + '...' : event.market}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#6B7280]">
                            <span className="font-medium">{event.strategy}</span>
                            <span>•</span>
                            <span className="font-semibold text-[#111827]">{event.price}¢</span>
                            {event.edge > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-[#059669] font-semibold flex items-center gap-0.5">
                                  <Zap className="w-3 h-3" />
                                  +{event.edge}% edge
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Action Badge */}
                        {event.action.type === 'opportunity' && (
                          <span className="shrink-0 px-2 py-1 text-[10px] font-bold bg-[#10B981] text-white rounded-full shadow-sm">
                            TRADE
                          </span>
                        )}
                        {event.action.type === 'watching' && (
                          <span className="shrink-0 px-2 py-1 text-[10px] font-medium bg-[#FEF3C7] text-[#D97706] rounded-full">
                            WATCHING
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Live Feed Footer */}
            <div className="px-4 py-1.5 bg-[#F9FAFB] border-t border-[#E5E7EB]">
              <p className="text-[10px] text-[#9CA3AF] flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#10B981]" />
                Click any market to place a wager — <span className="text-[#10B981] font-medium">green</span> = high-edge opportunity
              </p>
            </div>
          </div>

          {/* OPEN BETS SECTION */}
          <div className="border-b border-[#E5E7EB] shrink-0">
            {/* Open Bets Header */}
            <button
              onClick={() => setShowOpenBets(!showOpenBets)}
              className="w-full px-4 py-2.5 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center justify-between hover:bg-[#F3F4F6] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#10B981]" />
                <span className="font-semibold text-[#111827] text-sm">Open Bets</span>
                <span className="px-1.5 py-0.5 bg-[#10B981] text-white text-[10px] font-bold rounded-full min-w-[20px] text-center">
                  {openBets.length}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-[11px] text-[#6B7280]">
                  <span className="text-[#10B981] font-semibold">
                    +${openBets.reduce((sum, bet) => sum + Math.max(0, bet.profit), 0).toFixed(2)}
                  </span>
                  <span className="mx-1">•</span>
                  <span className="text-[#EF4444] font-semibold">
                    ${openBets.reduce((sum, bet) => sum + Math.min(0, bet.profit), 0).toFixed(2)}
                  </span>
                </div>
                {showOpenBets ? (
                  <ChevronDown className="w-4 h-4 text-[#6B7280]" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[#6B7280]" />
                )}
              </div>
            </button>

            {/* Open Bets List */}
            {showOpenBets && (
              <div className="max-h-[200px] overflow-y-auto bg-white">
                {openBets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Receipt className="w-8 h-8 text-[#D1D5DB] mb-2" />
                    <p className="text-[#6B7280] text-sm">No open positions</p>
                    <p className="text-[#9CA3AF] text-xs mt-1">Place a trade to see it here</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#E5E7EB]">
                    {openBets.map((bet) => (
                      <div
                        key={bet.id}
                        onClick={() => setSelectedBetSlip(bet)}
                        className="px-4 py-3 flex items-center gap-4 hover:bg-[#F9FAFB] cursor-pointer transition-colors group"
                      >
                        {/* Position Indicator */}
                        <div className={`w-1 h-10 rounded-full ${
                          bet.profit >= 0 ? 'bg-[#10B981]' : 'bg-[#EF4444]'
                        }`} />
                        
                        {/* Main Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#111827] text-sm">{bet.ticker}</span>
                            <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                              bet.platform === 'Kalshi' ? 'bg-[#DBEAFE] text-[#1D4ED8]' :
                              bet.platform === 'Polymarket' ? 'bg-[#EDE9FE] text-[#7C3AED]' :
                              'bg-[#FFEDD5] text-[#C2410C]'
                            }`}>
                              {bet.platform}
                            </span>
                            <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                              bet.position === 'YES' ? 'bg-[#D1FAE5] text-[#059669]' : 'bg-[#FEE2E2] text-[#DC2626]'
                            }`}>
                              {bet.position}
                            </span>
                          </div>
                          <p className="text-[#6B7280] text-xs truncate mt-0.5">{bet.event}</p>
                        </div>
                        
                        {/* Position Size */}
                        <div className="text-right shrink-0">
                          <p className="text-[#111827] font-medium text-sm">{bet.contracts} contracts</p>
                          <p className="text-[#6B7280] text-[11px]">@ ${bet.entryPrice.toFixed(2)}</p>
                        </div>
                        
                        {/* P&L */}
                        <div className="text-right shrink-0 w-20">
                          <p className={`font-mono font-bold text-sm ${bet.profit >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                            {bet.profit >= 0 ? '+' : ''}${bet.profit.toFixed(2)}
                          </p>
                          <p className={`text-[11px] font-medium ${bet.profit >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                            {bet.profit >= 0 ? '+' : ''}{bet.profitPercent.toFixed(1)}%
                          </p>
                        </div>
                        
                        {/* View Button */}
                        <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="px-2 py-1 text-[10px] font-medium bg-[#F3F4F6] text-[#374151] rounded border border-[#E5E7EB]">
                            View Slip
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ARBITRAGE DATA GRID - Below live feed */}
          <div className="flex-1 overflow-auto">
            <table className="w-full min-w-[900px] text-[13px]">
              {/* Sticky Header */}
              <thead className="bg-[#F9FAFB] sticky top-0 z-10 border-b border-[#E5E7EB]">
                <tr className="text-[11px] text-[#6B7280] uppercase">
                  <th className="px-3 py-3 text-left font-semibold w-24">Ticker</th>
                  <th className="px-3 py-3 text-left font-semibold">Event</th>
                  <th className="px-3 py-3 text-right font-semibold w-20">Kalshi</th>
                  <th className="px-3 py-3 text-right font-semibold w-20">Poly</th>
                  <th className="px-3 py-3 text-right font-semibold w-16">Edge</th>
                  <th className="px-3 py-3 text-right font-semibold w-14">Fee</th>
                  <th className="px-3 py-3 text-right font-semibold w-16">Net</th>
                  <th className="px-3 py-3 text-right font-semibold w-20">Volume</th>
                  <th className="px-3 py-3 text-center font-semibold w-24">Action</th>
                </tr>
              </thead>
              <tbody>
                {scannerState === 'idle' ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="text-4xl mb-4">🔍</div>
                        <p className="text-lg font-semibold text-[#111827] mb-2">Ready to Scan</p>
                        <p className="text-[13px] text-[#6B7280] max-w-sm">
                          Select platforms and click Start to find arbitrage opportunities
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredOpportunities.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Loader2 className="w-8 h-8 text-[#10B981] animate-spin mb-4" />
                        <p className="text-lg font-semibold text-[#111827] mb-2">Scanning Markets...</p>
                        <p className="text-[13px] text-[#6B7280]">No opportunities found yet</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOpportunities.map((opp, idx) => {
                    const isOpportunity = opp.netEdge >= settings.minEdge;
                    return (
                      <tr
                        key={opp.id}
                        className={`border-b border-[#E5E7EB] h-12 transition-colors cursor-pointer ${
                          isOpportunity 
                            ? 'bg-[#10B981]/5 hover:bg-[#10B981]/10' 
                            : idx % 2 === 0 
                              ? 'bg-white hover:bg-[#F9FAFB]' 
                              : 'bg-[#F9FAFB] hover:bg-[#F3F4F6]'
                        }`}
                      >
                        <td className="px-3 py-2 font-mono font-bold text-[#111827]">
                          {opp.ticker}
                        </td>
                        <td className="px-3 py-2 truncate max-w-[200px] text-[#374151]" title={opp.event}>
                          {opp.event}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          <span className={`flex items-center justify-end gap-1 ${
                            opp.kalshiTrend === 'up' ? 'text-[#10B981]' : 'text-[#EF4444]'
                          }`}>
                            {opp.kalshiPrice.toFixed(2)}
                            {opp.kalshiTrend === 'up' ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          <span className={`flex items-center justify-end gap-1 ${
                            opp.polyTrend === 'up' ? 'text-[#10B981]' : 'text-[#EF4444]'
                          }`}>
                            {opp.polyPrice.toFixed(2)}
                            {opp.polyTrend === 'up' ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                          </span>
                        </td>
                        <td className={`px-3 py-2 text-right font-mono font-medium ${
                          opp.edge >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                        }`}>
                          {opp.edge >= 0 ? '+' : ''}{opp.edge.toFixed(1)}%
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-[#6B7280]">
                          {opp.feeImpact.toFixed(1)}%
                        </td>
                        <td className={`px-3 py-2 text-right font-mono font-bold ${
                          opp.netEdge >= settings.minEdge ? 'text-[#10B981]' : 
                          opp.netEdge >= 0 ? 'text-[#F59E0B]' : 'text-[#EF4444]'
                        }`}>
                          {opp.netEdge >= 0 ? '+' : ''}{opp.netEdge.toFixed(1)}%
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-[#6B7280]">
                          ${(opp.volume / 1000).toFixed(0)}K
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-2">
                            {isOpportunity ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleExecute(opp); }}
                                className="px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-[11px] rounded-lg font-semibold transition-colors shadow-sm"
                              >
                                Trade
                              </button>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleExecute(opp); }}
                                className="px-3 py-1.5 bg-[#1F2937] hover:bg-[#111827] text-white text-[11px] rounded-lg font-medium transition-colors"
                              >
                                View
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); addToWatchlist(opp); }}
                              className={`p-1 rounded-lg transition-colors ${
                                watchlist.find(w => w.id === opp.id)
                                  ? 'bg-[#10B981] text-white'
                                  : 'bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#6B7280] border border-[#E5E7EB]'
                              }`}
                              title="Add to watchlist"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Execute Modal */}
      {executeModal && (
        <ExecuteModal
          opportunity={executeModal}
          onClose={() => setExecuteModal(null)}
          onConfirm={handleConfirmTrade}
        />
      )}

      {/* Bet Slip Modal */}
      {selectedBetSlip && (
        <BetSlipModal
          bet={selectedBetSlip}
          onClose={() => setSelectedBetSlip(null)}
          onCloseBet={closeBet}
        />
      )}
    </div>
  );
};

export default ScannerDashboard;

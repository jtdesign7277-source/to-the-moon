/**
 * Scanner Dashboard - IBKR-Style Professional Trading UI
 * 320px fixed left panel + scrollable data grid
 * No wasted space, maximum information density
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
// MARKET CATEGORIES
// ============================================

const CATEGORIES = [
  {
    id: 'all',
    name: 'All Markets',
    count: 23,
    children: null,
  },
  {
    id: 'sports',
    name: 'Sports',
    count: 19,
    children: [
      { id: 'nfl', name: 'NFL', count: 8 },
      { id: 'nba', name: 'NBA', count: 6 },
      { id: 'cfb', name: 'College Football', count: 5 },
    ],
  },
  {
    id: 'politics',
    name: 'Politics',
    count: 3,
    children: null,
  },
  {
    id: 'crypto',
    name: 'Crypto',
    count: 1,
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
    category: 'nfl',
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
    category: 'politics',
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
    ticker: 'NFLMVP',
    event: 'Mahomes NFL MVP 2025',
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
    category: 'nfl',
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
    category: 'nfl',
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
    category: 'nba',
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
    category: 'politics',
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
];

// ============================================
// EXECUTE MODAL COMPONENT
// ============================================

const ExecuteModal = ({ opportunity, onClose, onConfirm }) => {
  const [contracts, setContracts] = useState(100);
  
  const buyTotal = (opportunity.kalshiPrice * contracts).toFixed(2);
  const sellTotal = (opportunity.polyPrice * contracts).toFixed(2);
  const grossProfit = (sellTotal - buyTotal).toFixed(2);
  const fees = ((parseFloat(buyTotal) + parseFloat(sellTotal)) * (opportunity.feeImpact / 100)).toFixed(2);
  const netProfit = (grossProfit - fees).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg border border-slate-600 w-[480px] max-w-[95vw]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-600">
          <h3 className="font-semibold text-white">Confirm Arbitrage Trade</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="text-center">
            <p className="text-lg font-medium text-white">{opportunity.event}</p>
            <p className="text-sm text-gray-400">{opportunity.ticker}</p>
          </div>
          
          <div className="border-t border-b border-slate-600 py-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">💰 BUY on Kalshi</span>
              <span className="text-green-400 font-mono">@ ${opportunity.kalshiPrice.toFixed(2)} per contract (YES)</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">💸 SELL on Polymarket</span>
              <span className="text-red-400 font-mono">@ ${opportunity.polyPrice.toFixed(2)} per contract (YES)</span>
            </div>
          </div>
          
          <div>
            <label className="text-sm text-gray-400">Position Size:</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                value={contracts}
                onChange={(e) => setContracts(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white font-mono"
              />
              <span className="text-gray-400">contracts</span>
            </div>
          </div>
          
          <div className="bg-slate-900 rounded-lg p-3 space-y-2 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-gray-400">💵 Total Investment (BUY):</span>
              <span className="text-white">${buyTotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">💵 Total Revenue (SELL):</span>
              <span className="text-white">${sellTotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">✅ Gross Profit:</span>
              <span className="text-green-400">${grossProfit} ({opportunity.edge}% edge)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">⚠️ Estimated Fees:</span>
              <span className="text-yellow-400">${fees} ({opportunity.feeImpact}%)</span>
            </div>
            <div className="flex justify-between border-t border-slate-600 pt-2">
              <span className="text-white font-semibold">✅ NET PROFIT:</span>
              <span className={`font-semibold ${parseFloat(netProfit) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${netProfit} ({opportunity.netEdge}% net)
              </span>
            </div>
          </div>
          
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
              <div className="text-yellow-200">
                <p>⚠️ This will execute REAL MONEY trades on both platforms!</p>
                <p className="mt-1">⚠️ Trades will execute simultaneously.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex gap-3 px-4 py-3 border-t border-slate-600">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
          >
            ❌ Cancel
          </button>
          <button
            onClick={() => onConfirm(contracts)}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition-colors"
          >
            ✅ Confirm & Execute
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
  
  const [executeModal, setExecuteModal] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  
  const scanIntervalRef = useRef(null);

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

  // Start scanning
  const startScanning = useCallback(() => {
    if (selectedPlatforms.length < 2) return;
    
    setScannerState('scanning');
    setOpportunities(generateMockOpportunities());
    setStats({ markets: 23, opportunities: 3, lastUpdate: new Date() });

    // Start polling
    scanIntervalRef.current = setInterval(() => {
      // Simulate price updates
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
  }, [selectedPlatforms]);

  // Pause scanning
  const pauseScanning = () => {
    setScannerState('paused');
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
  };

  // Stop scanning
  const stopScanning = () => {
    setScannerState('idle');
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    setOpportunities([]);
    setStats({ markets: 0, opportunities: 0, lastUpdate: null });
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
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

  // Handle confirm trade
  const handleConfirmTrade = (contracts) => {
    alert(`Trade executed: ${contracts} contracts of ${executeModal.ticker}`);
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
    <div className="h-screen w-full bg-[#0F172A] text-[#F1F5F9] flex flex-col overflow-hidden">
      {/* ============================================ */}
      {/* MAIN CONTAINER - LEFT PANEL + DATA GRID */}
      {/* ============================================ */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ============================================ */}
        {/* LEFT PANEL - 320px FIXED */}
        {/* ============================================ */}
        <div className="w-80 bg-[#1E293B] border-r border-[#334155] flex flex-col shrink-0 overflow-y-auto">
          
          {/* SCANNER STATUS */}
          <div className="p-4 border-b border-[#334155]">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${
                scannerState === 'scanning' ? 'bg-green-500 animate-pulse' :
                scannerState === 'paused' ? 'bg-yellow-500' : 'bg-gray-500'
              }`} />
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Scanner Status</span>
            </div>
            <div className="text-sm space-y-1">
              <p className="font-medium">
                {scannerState === 'scanning' ? 'SCANNING' :
                 scannerState === 'paused' ? 'PAUSED' : 'IDLE'}
              </p>
              <p className="text-[#94A3B8]">Markets: {stats.markets}</p>
              <p className="text-[#94A3B8]">Opportunities: {opportunityCount}</p>
              <p className="text-[#94A3B8] font-mono text-xs">Last: {formatLastUpdate(stats.lastUpdate)}</p>
            </div>
          </div>

          {/* PLATFORMS */}
          <div className="p-4 border-b border-[#334155]">
            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">Platforms to Scan</p>
            <div className="space-y-2">
              {PLATFORMS.map(platform => {
                const isSelected = selectedPlatforms.includes(platform.id);
                const isAvailable = platform.status === 'connected';
                return (
                  <label
                    key={platform.id}
                    className={`flex items-center gap-2 cursor-pointer ${!isAvailable && 'opacity-50 cursor-not-allowed'}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => togglePlatform(platform.id)}
                      disabled={!isAvailable}
                      className="w-4 h-4 rounded border-[#334155] bg-[#0F172A] text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-sm">{platform.name}</span>
                    <span className={`text-xs ml-auto ${
                      isAvailable ? 'text-green-400' : 'text-[#94A3B8]'
                    }`}>
                      ({isAvailable ? 'Connected' : 'Soon'})
                    </span>
                  </label>
                );
              })}
            </div>
            {selectedPlatforms.length < 2 && (
              <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Select at least 2 platforms
              </p>
            )}
          </div>

          {/* MARKET FILTERS */}
          <div className="p-4 border-b border-[#334155] max-h-48 overflow-y-auto">
            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">Market Categories</p>
            <div className="space-y-1">
              {CATEGORIES.map(category => (
                <div key={category.id}>
                  <div className="flex items-center gap-2">
                    {category.children && (
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className="text-[#94A3B8] hover:text-white"
                      >
                        {expandedCategories.includes(category.id) ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </button>
                    )}
                    <label className={`flex items-center gap-2 cursor-pointer flex-1 ${!category.children && 'ml-5'}`}>
                      <input
                        type="checkbox"
                        checked={selectedFilters.includes(category.id)}
                        onChange={() => toggleFilter(category.id)}
                        className="w-4 h-4 rounded border-[#334155] bg-[#0F172A] text-indigo-500 focus:ring-indigo-500"
                      />
                      <span className="text-sm">{category.name}</span>
                      <span className="text-xs text-[#94A3B8] ml-auto">({category.count})</span>
                    </label>
                  </div>
                  {category.children && expandedCategories.includes(category.id) && (
                    <div className="ml-8 mt-1 space-y-1">
                      {category.children.map(child => (
                        <label key={child.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedFilters.includes(child.id)}
                            onChange={() => toggleFilter(child.id)}
                            className="w-4 h-4 rounded border-[#334155] bg-[#0F172A] text-indigo-500 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-[#94A3B8]">{child.name}</span>
                          <span className="text-xs text-[#94A3B8] ml-auto">({child.count})</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* THRESHOLDS */}
          <div className="p-4 border-b border-[#334155] flex-1">
            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">Arbitrage Thresholds</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#94A3B8] flex items-center gap-1">
                  Min. Edge Required (%)
                  <Info className="w-3 h-3" />
                </label>
                <input
                  type="number"
                  value={settings.minEdge}
                  onChange={(e) => setSettings(prev => ({ ...prev, minEdge: parseFloat(e.target.value) || 0 }))}
                  className="w-full mt-1 px-3 py-1.5 bg-[#0F172A] border border-[#334155] rounded text-sm font-mono"
                  step="0.5"
                />
              </div>
              
              <div>
                <label className="text-xs text-[#94A3B8] flex items-center gap-1">
                  Max Position Size ($)
                  <Info className="w-3 h-3" />
                </label>
                <input
                  type="number"
                  value={settings.maxPosition}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxPosition: parseFloat(e.target.value) || 0 }))}
                  className="w-full mt-1 px-3 py-1.5 bg-[#0F172A] border border-[#334155] rounded text-sm font-mono"
                  step="50"
                />
              </div>

              <div>
                <label className="text-xs text-[#94A3B8]">Auto-Execute Strategy</label>
                <div className="mt-1 space-y-1">
                  {[
                    { value: 'manual', label: 'Manual Review Only' },
                    { value: 'aggressive', label: 'Auto (Aggressive)' },
                    { value: 'conservative', label: 'Auto (Conservative)' },
                  ].map(option => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="strategy"
                        value={option.value}
                        checked={settings.strategy === option.value}
                        onChange={(e) => setSettings(prev => ({ ...prev, strategy: e.target.value }))}
                        className="w-4 h-4 border-[#334155] bg-[#0F172A] text-indigo-500 focus:ring-indigo-500"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#94A3B8] flex items-center gap-1">
                    Stop Loss (%)
                    <Info className="w-3 h-3" />
                  </label>
                  <input
                    type="number"
                    value={settings.stopLoss}
                    onChange={(e) => setSettings(prev => ({ ...prev, stopLoss: parseFloat(e.target.value) || 0 }))}
                    className="w-full mt-1 px-3 py-1.5 bg-[#0F172A] border border-[#334155] rounded text-sm font-mono"
                    step="5"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#94A3B8] flex items-center gap-1">
                    Take Profit (%)
                    <Info className="w-3 h-3" />
                  </label>
                  <input
                    type="number"
                    value={settings.takeProfit}
                    onChange={(e) => setSettings(prev => ({ ...prev, takeProfit: parseFloat(e.target.value) || 0 }))}
                    className="w-full mt-1 px-3 py-1.5 bg-[#0F172A] border border-[#334155] rounded text-sm font-mono"
                    step="5"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CONTROL BUTTONS */}
          <div className="p-4 space-y-2 shrink-0">
            <button
              onClick={startScanning}
              disabled={!canStart || scannerState === 'scanning'}
              className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Play className="w-4 h-4" />
              Start Scan
            </button>
            <button
              onClick={pauseScanning}
              disabled={scannerState !== 'scanning'}
              className="w-full py-2.5 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Pause className="w-4 h-4" />
              Pause Scan
            </button>
            <button
              onClick={stopScanning}
              disabled={scannerState === 'idle'}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Square className="w-4 h-4" />
              Stop Scan
            </button>
            <button
              onClick={() => onNavigate?.('settings')}
              className="w-full py-2.5 bg-[#334155] hover:bg-[#475569] text-white rounded font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>

        {/* ============================================ */}
        {/* MAIN DATA GRID */}
        {/* ============================================ */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Data Grid Container */}
          <div className="flex-1 overflow-auto">
            <table className="w-full min-w-[1000px] text-sm">
              {/* Sticky Header */}
              <thead className="bg-[#1E293B] sticky top-0 z-10">
                <tr className="text-xs text-[#94A3B8] uppercase">
                  <th className="px-3 py-3 text-left font-semibold w-24">Ticker</th>
                  <th className="px-3 py-3 text-left font-semibold w-52">Event</th>
                  <th className="px-3 py-3 text-right font-semibold w-20">Kalshi</th>
                  <th className="px-3 py-3 text-right font-semibold w-24">Polymarket</th>
                  <th className="px-3 py-3 text-right font-semibold w-16">Edge %</th>
                  <th className="px-3 py-3 text-right font-semibold w-16">Fee %</th>
                  <th className="px-3 py-3 text-right font-semibold w-20">Net Edge</th>
                  <th className="px-3 py-3 text-right font-semibold w-24">Volume</th>
                  <th className="px-3 py-3 text-right font-semibold w-20">Updated</th>
                  <th className="px-3 py-3 text-center font-semibold w-28">Action</th>
                </tr>
              </thead>
              <tbody>
                {scannerState === 'idle' ? (
                  <tr>
                    <td colSpan={10} className="h-80">
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="text-4xl mb-4">🔍</div>
                        <p className="text-xl font-medium text-white mb-2">Ready to Scan</p>
                        <p className="text-[#94A3B8] max-w-md">
                          Select at least 2 platforms and click "Start Scan" to begin 
                          searching for arbitrage opportunities across prediction markets.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredOpportunities.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="h-80">
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
                        <p className="text-lg font-medium text-white mb-2">Scanning Markets...</p>
                        <p className="text-[#94A3B8] max-w-md mb-4">
                          No arbitrage opportunities found yet matching your criteria.
                        </p>
                        <div className="text-sm text-[#94A3B8] space-y-1">
                          <p>📊 Monitoring: {stats.markets} markets</p>
                          <p>📈 Edge Threshold: {settings.minEdge}%</p>
                          <p>🕐 Last Update: {formatLastUpdate(stats.lastUpdate)}</p>
                        </div>
                        <div className="mt-4 p-3 bg-[#1E293B] rounded-lg text-sm text-[#94A3B8] max-w-sm">
                          <p className="font-medium text-yellow-400 mb-1">💡 TIP:</p>
                          <p>Lower your minimum edge threshold to see more opportunities (profits will be smaller).</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOpportunities.map((opp, idx) => {
                    const isOpportunity = opp.netEdge >= settings.minEdge;
                    return (
                      <tr
                        key={opp.id}
                        className={`border-b border-[#334155] h-9 transition-colors cursor-pointer ${
                          isOpportunity 
                            ? 'bg-green-500/10 hover:bg-green-500/20' 
                            : idx % 2 === 0 
                              ? 'bg-[#1E293B]/30 hover:bg-[#334155]' 
                              : 'hover:bg-[#334155]'
                        }`}
                      >
                        <td className="px-3 py-2 font-mono font-medium text-indigo-400">
                          {opp.ticker}
                        </td>
                        <td className="px-3 py-2 truncate max-w-[200px]" title={opp.event}>
                          {opp.event}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          <span className={`flex items-center justify-end gap-1 ${
                            opp.kalshiTrend === 'up' ? 'text-green-400' : 'text-red-400'
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
                            opp.polyTrend === 'up' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {opp.polyPrice.toFixed(2)}
                            {opp.polyTrend === 'up' ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                          </span>
                        </td>
                        <td className={`px-3 py-2 text-right font-mono ${
                          opp.edge >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {opp.edge >= 0 ? '+' : ''}{opp.edge.toFixed(1)}%
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-[#94A3B8]">
                          {opp.feeImpact.toFixed(1)}%
                        </td>
                        <td className={`px-3 py-2 text-right font-mono font-semibold ${
                          opp.netEdge >= settings.minEdge ? 'text-green-400' : 
                          opp.netEdge >= 0 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {opp.netEdge >= 0 ? '+' : ''}{opp.netEdge.toFixed(1)}%
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-[#94A3B8]">
                          ${(opp.volume / 1000).toFixed(0)}K
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-xs text-[#94A3B8]">
                          {opp.lastUpdate.toFixed(1)}s
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            {isOpportunity ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleExecute(opp); }}
                                className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded font-medium transition-colors"
                              >
                                EXECUTE
                              </button>
                            ) : (
                              <div className="w-16" />
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); addToWatchlist(opp); }}
                              className={`p-1 rounded transition-colors ${
                                watchlist.find(w => w.id === opp.id)
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-[#334155] hover:bg-[#475569] text-[#94A3B8]'
                              }`}
                              title="Add to watchlist"
                            >
                              <Plus className="w-4 h-4" />
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
    </div>
  );
};

export default ScannerDashboard;

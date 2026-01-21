/**
 * Scanner Dashboard - IBKR-Style Full Page Layout
 * No scrolling - everything fits on one screen
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Square,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  LayoutDashboard,
  History,
  Wallet,
  BookOpen,
  Trophy,
  Settings,
  Zap,
  Shield,
  Scale,
  Flame,
  Check,
  Clock,
  ExternalLink,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ============================================
// PLATFORM DEFINITIONS
// ============================================

const PLATFORMS = [
  { id: 'kalshi', name: 'Kalshi', icon: '🎯', status: 'live' },
  { id: 'polymarket', name: 'Polymarket', icon: '📊', status: 'coming_soon' },
  { id: 'manifold', name: 'Manifold', icon: '🔮', status: 'coming_soon' },
  { id: 'predictit', name: 'PredictIt', icon: '🏛️', status: 'coming_soon' },
  { id: 'betfair', name: 'Betfair', icon: '🏇', status: 'coming_soon' },
  { id: 'metaculus', name: 'Metaculus', icon: '🔬', status: 'coming_soon' },
];

// ============================================
// RISK PRESETS
// ============================================

const RISK_PRESETS = {
  conservative: { label: 'Conservative', icon: Shield, minEdge: 5, maxPosition: 100, stopLoss: 10, takeProfit: 10 },
  moderate: { label: 'Moderate', icon: Scale, minEdge: 2.5, maxPosition: 350, stopLoss: 15, takeProfit: 15 },
  aggressive: { label: 'Aggressive', icon: Flame, minEdge: 1.5, maxPosition: 1000, stopLoss: 25, takeProfit: 25 },
};

// ============================================
// NAV ITEMS
// ============================================

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'scanner', label: 'Scanner', icon: Zap, active: true },
  { id: 'history', label: 'Trade History', icon: History },
  { id: 'accounts', label: 'Accounts', icon: Wallet },
  { id: 'education', label: 'Education', icon: BookOpen },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
];

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  PLATFORMS: 'ttm_scanner_platforms',
  RISK_SETTINGS: 'ttm_scanner_risk',
  SIGNALS: 'ttm_scanner_signals',
};

// ============================================
// MOCK DATA
// ============================================

const generateMockMarkets = () => [
  { ticker: 'KXBTC-26JAN', title: 'Bitcoin > $100k', last: 62, change: 5.40, changePct: 3.03, volume: 199000, edge: 5.2, platform: 'kalshi' },
  { ticker: 'KXETH-26JAN', title: 'Ethereum > $4k', last: 58, change: 2.15, changePct: 1.64, volume: 145000, edge: 4.5, platform: 'kalshi' },
  { ticker: 'KXFED-26JAN', title: 'Fed Rate Cut', last: 45, change: -1.20, changePct: -2.14, volume: 87000, edge: 3.8, platform: 'kalshi' },
  { ticker: 'KXSPY-26JAN', title: 'S&P 500 > 5000', last: 72, change: 0.50, changePct: 0.22, volume: 234000, edge: 2.1, platform: 'kalshi' },
  { ticker: 'KXGOLD-26JAN', title: 'Gold > $2100', last: 55, change: 6.81, changePct: 2.11, volume: 156000, edge: 3.2, platform: 'kalshi' },
  { ticker: 'KXTSLA-26JAN', title: 'Tesla > $300', last: 48, change: 13.85, changePct: 3.30, volume: 289000, edge: 4.1, platform: 'kalshi' },
  { ticker: 'KXNVDA-26JAN', title: 'NVIDIA > $600', last: 67, change: 9.88, changePct: 1.64, volume: 312000, edge: 2.8, platform: 'kalshi' },
  { ticker: 'KXAAPL-26JAN', title: 'Apple > $200', last: 71, change: 1.18, changePct: 0.48, volume: 178000, edge: 1.9, platform: 'kalshi' },
  { ticker: 'KXMSFT-26JAN', title: 'Microsoft > $450', last: 63, change: -9.72, changePct: -2.14, volume: 145000, edge: 3.5, platform: 'kalshi' },
  { ticker: 'KXAMZN-26JAN', title: 'Amazon > $200', last: 54, change: 0.50, changePct: 0.22, volume: 198000, edge: 2.4, platform: 'kalshi' },
];

// ============================================
// MAIN COMPONENT
// ============================================

const ScannerDashboard = ({ onNavigate }) => {
  // Load saved preferences
  const loadSavedPrefs = () => {
    try {
      const platforms = localStorage.getItem(STORAGE_KEYS.PLATFORMS);
      const risk = localStorage.getItem(STORAGE_KEYS.RISK_SETTINGS);
      const signals = localStorage.getItem(STORAGE_KEYS.SIGNALS);
      return {
        platforms: platforms ? JSON.parse(platforms) : ['kalshi'],
        risk: risk ? JSON.parse(risk) : { preset: 'moderate', ...RISK_PRESETS.moderate },
        signals: signals ? JSON.parse(signals) : [],
      };
    } catch {
      return { platforms: ['kalshi'], risk: { preset: 'moderate', ...RISK_PRESETS.moderate }, signals: [] };
    }
  };

  const saved = loadSavedPrefs();

  // State
  const [selectedPlatforms, setSelectedPlatforms] = useState(saved.platforms);
  const [riskPreset, setRiskPreset] = useState(saved.risk.preset || 'moderate');
  const [riskSettings, setRiskSettings] = useState({
    minEdge: saved.risk.minEdge || 2.5,
    maxPosition: saved.risk.maxPosition || 350,
    stopLoss: saved.risk.stopLoss || 15,
    takeProfit: saved.risk.takeProfit || 15,
  });
  const [signals, setSignals] = useState(saved.signals);
  const [markets, setMarkets] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerStats, setScannerStats] = useState({ count: 0, lastScan: null });

  // Auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('ttm_access_token') || localStorage.getItem('token');
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  };

  // Save preferences
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PLATFORMS, JSON.stringify(selectedPlatforms));
  }, [selectedPlatforms]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RISK_SETTINGS, JSON.stringify({ preset: riskPreset, ...riskSettings }));
  }, [riskPreset, riskSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SIGNALS, JSON.stringify(signals));
  }, [signals]);

  // Toggle platform
  const togglePlatform = (id) => {
    const platform = PLATFORMS.find(p => p.id === id);
    if (platform?.status !== 'live') return;
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  // Apply preset
  const applyPreset = (key) => {
    setRiskPreset(key);
    const preset = RISK_PRESETS[key];
    setRiskSettings({
      minEdge: preset.minEdge,
      maxPosition: preset.maxPosition,
      stopLoss: preset.stopLoss,
      takeProfit: preset.takeProfit,
    });
  };

  // Start scanner
  const startScanner = async () => {
    if (selectedPlatforms.length === 0) return;
    setIsScanning(true);
    setMarkets(generateMockMarkets());
    
    try {
      await fetch(`${API_BASE}/api/scanner/start`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          platforms: selectedPlatforms,
          minEdge: riskSettings.minEdge,
          maxPosition: riskSettings.maxPosition,
          stopLoss: riskSettings.stopLoss,
          takeProfit: riskSettings.takeProfit,
        })
      });
    } catch (err) {
      console.error('Scanner start error:', err);
    }
  };

  // Stop scanner
  const stopScanner = async () => {
    setIsScanning(false);
    try {
      await fetch(`${API_BASE}/api/scanner/stop`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (err) {
      console.error('Scanner stop error:', err);
    }
  };

  // Fetch status
  const fetchStatus = useCallback(async () => {
    if (!isScanning) return;
    try {
      const response = await fetch(`${API_BASE}/api/scanner/status`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setScannerStats({ count: data.scanCount || 0, lastScan: data.lastScan });
        if (data.signals?.length > 0) {
          setSignals(prev => {
            const existingIds = new Set(prev.map(s => s.id));
            const newSignals = data.signals.filter(s => !existingIds.has(s.id));
            return [...newSignals, ...prev].slice(0, 10);
          });
        }
      }
    } catch (err) {
      console.error('Status fetch error:', err);
    }
  }, [isScanning]);

  // Poll for updates
  useEffect(() => {
    if (!isScanning) return;
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [isScanning, fetchStatus]);

  // Simulate market updates when scanning
  useEffect(() => {
    if (!isScanning) return;
    const interval = setInterval(() => {
      setMarkets(prev => prev.map(m => ({
        ...m,
        last: Math.max(1, Math.min(99, m.last + (Math.random() - 0.5) * 2)),
        change: m.change + (Math.random() - 0.5),
        changePct: m.changePct + (Math.random() - 0.5) * 0.5,
      })));
      setScannerStats(prev => ({ ...prev, count: prev.count + 1, lastScan: new Date().toISOString() }));
      
      // Randomly generate signals
      if (Math.random() > 0.7) {
        const market = markets[Math.floor(Math.random() * markets.length)];
        if (market && market.edge >= riskSettings.minEdge) {
          const newSignal = {
            id: Date.now().toString(),
            ticker: market.ticker,
            title: market.title,
            edge: market.edge,
            direction: Math.random() > 0.5 ? 'up' : 'down',
            side: Math.random() > 0.5 ? 'YES' : 'NO',
            entryPrice: market.last,
            strength: market.edge > 4 ? 'strong' : market.edge > 2.5 ? 'moderate' : 'weak',
            timestamp: new Date().toISOString(),
            platform: market.platform,
          };
          setSignals(prev => [newSignal, ...prev].slice(0, 10));
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isScanning, markets, riskSettings.minEdge]);

  // Handle trade
  const handleTrade = (signal) => {
    alert(`Opening trade: ${signal.ticker} - ${signal.side} @ ${signal.entryPrice}¢`);
  };

  // Time ago helper
  const timeAgo = (timestamp) => {
    if (!timestamp) return '';
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  return (
    <div className="h-screen w-full bg-slate-900 text-white flex flex-col overflow-hidden">
      {/* TOP BAR - Platform Selection */}
      <div className="h-12 bg-slate-800 border-b border-slate-700 flex items-center px-4 shrink-0">
        <span className="text-sm font-medium text-gray-400 mr-4">My Screeners</span>
        <div className="flex items-center gap-2">
          {PLATFORMS.map(platform => {
            const isSelected = selectedPlatforms.includes(platform.id);
            const isLive = platform.status === 'live';
            return (
              <button
                key={platform.id}
                onClick={() => togglePlatform(platform.id)}
                disabled={!isLive}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : isLive
                      ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      : 'bg-slate-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                <span>{platform.icon}</span>
                <span>{platform.name}</span>
                {isSelected && <Check className="w-3 h-3" />}
                {!isLive && <span className="text-[10px] text-gray-500 ml-1">Soon</span>}
              </button>
            );
          })}
        </div>
        
        {/* Scanner Status */}
        <div className="ml-auto flex items-center gap-4 text-sm">
          {isScanning && (
            <>
              <span className="flex items-center gap-1 text-green-400">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Scanning...
              </span>
              <span className="text-gray-400">Scans: {scannerStats.count}</span>
            </>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR */}
        <div className="w-56 bg-slate-800 border-r border-slate-700 flex flex-col shrink-0">
          {/* Navigation */}
          <div className="p-2 border-b border-slate-700">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => item.id !== 'scanner' && onNavigate?.(item.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                    item.active
                      ? 'bg-indigo-600/20 text-indigo-400'
                      : 'text-gray-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Custom Screener Settings */}
          <div className="flex-1 p-3 overflow-y-auto">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Custom Screener</h3>
            
            {/* Risk Presets */}
            <div className="space-y-1 mb-4">
              {Object.entries(RISK_PRESETS).map(([key, preset]) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                      riskPreset === key
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/50'
                        : 'text-gray-400 hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Settings Inputs */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-500 uppercase">Min Edge Required</label>
                <div className="flex items-center mt-1">
                  <input
                    type="number"
                    value={riskSettings.minEdge}
                    onChange={(e) => setRiskSettings(prev => ({ ...prev, minEdge: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm"
                    step="0.5"
                  />
                  <span className="ml-1 text-gray-500 text-xs">%</span>
                </div>
              </div>
              
              <div>
                <label className="text-[10px] text-gray-500 uppercase">Max Position Size</label>
                <div className="flex items-center mt-1">
                  <span className="mr-1 text-gray-500 text-xs">$</span>
                  <input
                    type="number"
                    value={riskSettings.maxPosition}
                    onChange={(e) => setRiskSettings(prev => ({ ...prev, maxPosition: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm"
                    step="50"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-[10px] text-gray-500 uppercase">Stop Loss</label>
                <div className="flex items-center mt-1">
                  <span className="mr-1 text-gray-500 text-xs">-</span>
                  <input
                    type="number"
                    value={riskSettings.stopLoss}
                    onChange={(e) => setRiskSettings(prev => ({ ...prev, stopLoss: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm"
                    step="5"
                  />
                  <span className="ml-1 text-gray-500 text-xs">%</span>
                </div>
              </div>
              
              <div>
                <label className="text-[10px] text-gray-500 uppercase">Take Profit</label>
                <div className="flex items-center mt-1">
                  <span className="mr-1 text-gray-500 text-xs">+</span>
                  <input
                    type="number"
                    value={riskSettings.takeProfit}
                    onChange={(e) => setRiskSettings(prev => ({ ...prev, takeProfit: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm"
                    step="5"
                  />
                  <span className="ml-1 text-gray-500 text-xs">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Start/Stop Button */}
          <div className="p-3 border-t border-slate-700">
            <button
              onClick={isScanning ? stopScanner : startScanner}
              disabled={selectedPlatforms.length === 0}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded font-semibold transition-colors disabled:opacity-50 ${
                isScanning
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isScanning ? (
                <>
                  <Square className="w-4 h-4" />
                  Stop Scan
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start Scan
                </>
              )}
            </button>
          </div>
        </div>

        {/* MAIN AREA */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Results Header */}
          <div className="h-8 bg-slate-800/50 border-b border-slate-700 flex items-center px-4 text-xs text-gray-400 shrink-0">
            <span>Displaying {markets.length} of {markets.length} Results</span>
            <span className="mx-4">•</span>
            <span>Generated at {new Date().toLocaleTimeString()}</span>
            <button
              onClick={() => setMarkets(generateMockMarkets())}
              className="ml-4 flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh results
            </button>
          </div>

          {/* Markets Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 sticky top-0">
                <tr className="text-left text-xs text-gray-400 uppercase">
                  <th className="px-4 py-2 font-medium">Ticker</th>
                  <th className="px-4 py-2 font-medium">Market</th>
                  <th className="px-4 py-2 font-medium text-right">Last</th>
                  <th className="px-4 py-2 font-medium text-right">Change</th>
                  <th className="px-4 py-2 font-medium text-right">Change %</th>
                  <th className="px-4 py-2 font-medium text-right">Volume</th>
                  <th className="px-4 py-2 font-medium text-right">Edge</th>
                  <th className="px-4 py-2 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {markets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                      {isScanning ? 'Scanning for markets...' : 'Click "Start Scan" to begin'}
                    </td>
                  </tr>
                ) : (
                  markets.map((market, i) => (
                    <tr
                      key={market.ticker}
                      className={`border-b border-slate-700/50 hover:bg-slate-800/50 ${
                        i % 2 === 0 ? 'bg-slate-800/20' : ''
                      }`}
                    >
                      <td className="px-4 py-2 font-medium text-indigo-400">{market.ticker}</td>
                      <td className="px-4 py-2 text-gray-300">{market.title}</td>
                      <td className="px-4 py-2 text-right font-mono">{market.last.toFixed(0)}¢</td>
                      <td className={`px-4 py-2 text-right font-mono ${market.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {market.change >= 0 ? '+' : ''}{market.change.toFixed(2)}
                      </td>
                      <td className={`px-4 py-2 text-right font-mono ${market.changePct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {market.changePct >= 0 ? '+' : ''}{market.changePct.toFixed(2)}%
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-gray-300">
                        ${(market.volume / 1000).toFixed(0)}K
                      </td>
                      <td className={`px-4 py-2 text-right font-mono ${
                        market.edge >= riskSettings.minEdge ? 'text-green-400' : 'text-gray-500'
                      }`}>
                        {market.edge.toFixed(1)}%
                      </td>
                      <td className="px-4 py-2 text-center">
                        <a
                          href={`https://kalshi.com/markets/${market.ticker}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300"
                        >
                          <ExternalLink className="w-4 h-4 inline" />
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* SIGNALS SECTION */}
          <div className="h-36 bg-slate-800/50 border-t border-slate-700 shrink-0">
            <div className="h-7 px-4 flex items-center justify-between border-b border-slate-700 bg-slate-800">
              <span className="text-xs font-medium text-gray-400 uppercase flex items-center gap-2">
                <Zap className="w-3 h-3 text-yellow-400" />
                Signals ({signals.length})
              </span>
              {signals.length > 0 && (
                <button
                  onClick={() => setSignals([])}
                  className="text-xs text-gray-500 hover:text-gray-400"
                >
                  Clear All
                </button>
              )}
            </div>
            
            <div className="h-[calc(100%-28px)] overflow-x-auto overflow-y-hidden">
              {signals.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                  {isScanning ? 'Scanning for signals...' : 'Signals will appear here when scanner is running'}
                </div>
              ) : (
                <div className="flex gap-3 p-3 h-full">
                  {signals.map(signal => (
                    <div
                      key={signal.id}
                      className={`shrink-0 w-56 h-full rounded-lg border p-3 flex flex-col justify-between ${
                        signal.strength === 'strong'
                          ? 'border-green-500/50 bg-green-500/10'
                          : signal.strength === 'moderate'
                            ? 'border-yellow-500/50 bg-yellow-500/10'
                            : 'border-gray-500/50 bg-gray-500/10'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {signal.direction === 'up' ? (
                              <TrendingUp className="w-3 h-3 text-green-400" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-red-400" />
                            )}
                            <span className="font-semibold text-sm">{signal.ticker}</span>
                          </div>
                          <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {timeAgo(signal.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 truncate">{signal.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <span className="text-green-400">{signal.edge}% edge</span>
                          <span className={signal.side === 'YES' ? 'text-green-400' : 'text-red-400'}>
                            {signal.side}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleTrade(signal)}
                        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded text-xs font-medium transition-colors"
                      >
                        Trade @ {signal.entryPrice}¢
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScannerDashboard;

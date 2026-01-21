/**
 * Scanner Dashboard v2
 * - Platform selection (Kalshi, Polymarket, Manifold, etc.)
 * - Risk presets (Conservative, Moderate, Aggressive, Custom)
 * - Continuous background scanning
 * - Persistent signals storage with timestamps
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Square,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Bell,
  Zap,
  Target,
  Settings,
  Check,
  Clock,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Shield,
  Flame,
  Scale,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ============================================
// PLATFORM DEFINITIONS
// ============================================

const PLATFORMS = [
  {
    id: 'kalshi',
    name: 'Kalshi',
    icon: '🎯',
    description: 'Prediction Market',
    details: ['Regulated in US', 'Real USD trading'],
    status: 'live', // 'live' | 'coming_soon'
  },
  {
    id: 'polymarket',
    name: 'Polymarket',
    icon: '📊',
    description: 'Prediction Market',
    details: ['Crypto-based (USDC)', 'Global access'],
    status: 'coming_soon',
  },
  {
    id: 'manifold',
    name: 'Manifold Markets',
    icon: '🔮',
    description: 'Prediction Market',
    details: ['Free to use', 'Play money (Mana)'],
    status: 'coming_soon',
  },
  {
    id: 'predictit',
    name: 'PredictIt',
    icon: '🏛️',
    description: 'Prediction Market',
    details: ['Political markets', 'US-based'],
    status: 'coming_soon',
  },
  {
    id: 'betfair',
    name: 'Betfair Exchange',
    icon: '🏇',
    description: 'Betting Exchange',
    details: ['Sports & politics', 'High liquidity'],
    status: 'coming_soon',
  },
  {
    id: 'metaculus',
    name: 'Metaculus',
    icon: '🔬',
    description: 'Forecasting Platform',
    details: ['Reputation-based', 'Science focus'],
    status: 'coming_soon',
  },
];

// ============================================
// RISK PRESETS
// ============================================

const RISK_PRESETS = {
  conservative: {
    label: 'Conservative',
    icon: Shield,
    color: 'green',
    minEdge: 5,
    maxPosition: 100,
    stopLoss: 10,
    takeProfit: 10,
  },
  moderate: {
    label: 'Moderate',
    icon: Scale,
    color: 'yellow',
    minEdge: 2.5,
    maxPosition: 350,
    stopLoss: 15,
    takeProfit: 15,
  },
  aggressive: {
    label: 'Aggressive',
    icon: Flame,
    color: 'red',
    minEdge: 1.5,
    maxPosition: 1000,
    stopLoss: 25,
    takeProfit: 25,
  },
};

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  PLATFORMS: 'ttm_scanner_platforms',
  RISK_SETTINGS: 'ttm_scanner_risk',
  SIGNALS: 'ttm_scanner_signals',
};

// ============================================
// COMPONENTS
// ============================================

// Platform Card
function PlatformCard({ platform, selected, onToggle }) {
  const isLive = platform.status === 'live';
  
  return (
    <button
      onClick={() => isLive && onToggle(platform.id)}
      disabled={!isLive}
      className={`relative p-4 rounded-xl border-2 transition-all text-left ${
        selected
          ? 'border-indigo-500 bg-indigo-500/20'
          : isLive
            ? 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
            : 'border-slate-700 bg-slate-800/30 opacity-60 cursor-not-allowed'
      }`}
    >
      {/* Selection indicator */}
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
      
      {/* Status badge */}
      <div className={`absolute top-2 right-2 ${selected ? 'hidden' : ''}`}>
        {isLive ? (
          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
            LIVE
          </span>
        ) : (
          <span className="px-2 py-0.5 bg-slate-600/50 text-slate-400 text-xs rounded-full">
            SOON
          </span>
        )}
      </div>
      
      <div className="text-2xl mb-2">{platform.icon}</div>
      <h3 className="font-semibold text-white">{platform.name}</h3>
      <p className="text-xs text-gray-400 mb-2">{platform.description}</p>
      <div className="space-y-0.5">
        {platform.details.map((detail, i) => (
          <p key={i} className="text-xs text-gray-500">{detail}</p>
        ))}
      </div>
    </button>
  );
}

// Risk Preset Button
function RiskPresetButton({ preset, presetKey, selected, onClick }) {
  const Icon = preset.icon;
  const colors = {
    green: 'border-green-500 bg-green-500/20 text-green-400',
    yellow: 'border-yellow-500 bg-yellow-500/20 text-yellow-400',
    red: 'border-red-500 bg-red-500/20 text-red-400',
  };
  
  return (
    <button
      onClick={() => onClick(presetKey)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
        selected
          ? colors[preset.color]
          : 'border-slate-600 bg-slate-800/50 text-gray-400 hover:border-slate-500'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="font-medium">{preset.label}</span>
    </button>
  );
}

// Signal Card
function SignalCard({ signal, onTrade, onDismiss }) {
  const [expanded, setExpanded] = useState(false);
  
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };
  
  const strengthColors = {
    strong: 'border-green-500 bg-green-500/10',
    moderate: 'border-yellow-500 bg-yellow-500/10',
    weak: 'border-gray-500 bg-gray-500/10',
  };
  
  const isStale = signal.timestamp && 
    (Date.now() - new Date(signal.timestamp).getTime()) > 10 * 60 * 1000; // 10 min
  
  return (
    <div className={`rounded-xl border-2 p-4 ${strengthColors[signal.strength]} ${isStale ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {signal.direction === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span className="font-semibold text-white">{signal.ticker}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              signal.strength === 'strong' ? 'bg-green-500/30 text-green-300' :
              signal.strength === 'moderate' ? 'bg-yellow-500/30 text-yellow-300' :
              'bg-gray-500/30 text-gray-300'
            }`}>
              {signal.strength.toUpperCase()}
            </span>
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
              {signal.platform}
            </span>
          </div>
          
          <p className="text-sm text-gray-300 mt-2">{signal.reason}</p>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
            <span>Edge: <span className="text-green-400 font-medium">{signal.edge?.toFixed(1)}%</span></span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {getTimeAgo(signal.timestamp)}
              {isStale && <span className="text-yellow-500">(stale)</span>}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => onDismiss(signal.id)}
            className="p-1 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400"
            title="Dismiss"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-white/10 rounded"
          >
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-600">
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div>
              <span className="text-gray-400">Entry Price:</span>
              <span className="ml-2 font-medium text-white">{signal.entryPrice}¢</span>
            </div>
            <div>
              <span className="text-gray-400">Target:</span>
              <span className="ml-2 font-medium text-green-400">{signal.targetPrice}¢</span>
            </div>
            <div>
              <span className="text-gray-400">Side:</span>
              <span className={`ml-2 font-medium ${signal.side === 'YES' ? 'text-green-400' : 'text-red-400'}`}>
                {signal.side}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Expected:</span>
              <span className="ml-2 font-medium text-green-400">+${signal.expectedProfit?.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={() => onTrade(signal)}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors text-sm"
          >
            Place Trade
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

const ScannerDashboard = () => {
  // Load saved preferences from localStorage
  const loadSavedPreferences = () => {
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
      return {
        platforms: ['kalshi'],
        risk: { preset: 'moderate', ...RISK_PRESETS.moderate },
        signals: [],
      };
    }
  };
  
  const saved = loadSavedPreferences();
  
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
  const [scannerStatus, setScannerStatus] = useState({ running: false, lastScan: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('setup'); // 'setup' | 'signals'

  // Auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('ttm_access_token') || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PLATFORMS, JSON.stringify(selectedPlatforms));
  }, [selectedPlatforms]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RISK_SETTINGS, JSON.stringify({
      preset: riskPreset,
      ...riskSettings
    }));
  }, [riskPreset, riskSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SIGNALS, JSON.stringify(signals));
  }, [signals]);

  // Toggle platform selection
  const togglePlatform = (platformId) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  // Apply risk preset
  const applyPreset = (presetKey) => {
    setRiskPreset(presetKey);
    if (presetKey !== 'custom') {
      const preset = RISK_PRESETS[presetKey];
      setRiskSettings({
        minEdge: preset.minEdge,
        maxPosition: preset.maxPosition,
        stopLoss: preset.stopLoss,
        takeProfit: preset.takeProfit,
      });
    }
  };

  // Update individual risk setting (switches to custom)
  const updateRiskSetting = (key, value) => {
    setRiskPreset('custom');
    setRiskSettings(prev => ({ ...prev, [key]: value }));
  };

  // Start scanner
  const startScanner = async () => {
    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/scanner/start`, {
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

      if (response.ok) {
        setScannerStatus({ running: true, lastScan: new Date().toISOString() });
        setActiveTab('signals');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to start scanner');
      }
    } catch (err) {
      console.error('Start scanner error:', err);
      // For demo, still show as running
      setScannerStatus({ running: true, lastScan: new Date().toISOString() });
      setActiveTab('signals');
    } finally {
      setLoading(false);
    }
  };

  // Stop scanner
  const stopScanner = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/api/scanner/stop`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      setScannerStatus({ running: false, lastScan: null });
    } catch (err) {
      console.error('Stop scanner error:', err);
      setScannerStatus({ running: false, lastScan: null });
    } finally {
      setLoading(false);
    }
  };

  // Fetch scanner status and signals
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/scanner/status`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setScannerStatus({
          running: data.running,
          lastScan: data.lastScan,
        });
        if (data.signals && data.signals.length > 0) {
          setSignals(prev => {
            const existingIds = new Set(prev.map(s => s.id));
            const newSignals = data.signals.filter(s => !existingIds.has(s.id));
            return [...newSignals, ...prev];
          });
        }
      }
    } catch (err) {
      console.error('Fetch status error:', err);
    }
  }, []);

  // Poll for new signals
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Handle trade
  const handleTrade = (signal) => {
    console.log('Trade signal:', signal);
    alert(`Opening trade ticket for ${signal.ticker} - ${signal.side} @ ${signal.entryPrice}¢`);
  };

  // Dismiss signal
  const dismissSignal = (signalId) => {
    setSignals(prev => prev.filter(s => s.id !== signalId));
  };

  // Clear all signals
  const clearAllSignals = () => {
    setSignals([]);
  };

  // Remove stale signals (older than 30 min)
  useEffect(() => {
    const interval = setInterval(() => {
      const thirtyMinAgo = Date.now() - 30 * 60 * 1000;
      setSignals(prev => prev.filter(s => 
        !s.timestamp || new Date(s.timestamp).getTime() > thirtyMinAgo
      ));
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Activity className="w-8 h-8 text-indigo-400" />
              Market Scanner
            </h1>
            <p className="text-gray-400 mt-1">
              {scannerStatus.running 
                ? '🟢 Scanning continuously in background...'
                : 'Configure platforms and risk settings, then start scanning'
              }
            </p>
          </div>

          <div className="flex items-center gap-3">
            {scannerStatus.running ? (
              <button
                onClick={stopScanner}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                <Square className="w-5 h-5" />
                Stop Scanner
              </button>
            ) : (
              <button
                onClick={startScanner}
                disabled={loading || selectedPlatforms.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                <Play className="w-5 h-5" />
                Start Scanner
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-300 hover:text-white">✕</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-800/50 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setActiveTab('setup')}
            className={`px-5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'setup'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            Setup
          </button>
          <button
            onClick={() => setActiveTab('signals')}
            className={`px-5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'signals'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Bell className="w-4 h-4" />
            Signals
            {signals.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                {signals.length}
              </span>
            )}
          </button>
        </div>

        {/* Setup Tab */}
        {activeTab === 'setup' && (
          <div className="space-y-6">
            {/* Platforms Section */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-400" />
                Select Platforms to Scan
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                Choose which prediction markets the scanner should monitor. More platforms = more opportunities.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {PLATFORMS.map(platform => (
                  <PlatformCard
                    key={platform.id}
                    platform={platform}
                    selected={selectedPlatforms.includes(platform.id)}
                    onToggle={togglePlatform}
                  />
                ))}
              </div>
            </div>

            {/* Risk Settings Section */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                Risk Settings
              </h2>
              
              {/* Presets */}
              <div className="flex flex-wrap gap-3 mb-6">
                {Object.entries(RISK_PRESETS).map(([key, preset]) => (
                  <RiskPresetButton
                    key={key}
                    preset={preset}
                    presetKey={key}
                    selected={riskPreset === key}
                    onClick={applyPreset}
                  />
                ))}
                <button
                  onClick={() => setRiskPreset('custom')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    riskPreset === 'custom'
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400'
                      : 'border-slate-600 bg-slate-800/50 text-gray-400 hover:border-slate-500'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span className="font-medium">Custom</span>
                </button>
              </div>

              {/* Custom Settings */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Min Edge Required</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={riskSettings.minEdge}
                      onChange={(e) => updateRiskSetting('minEdge', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 pr-8"
                      step="0.5"
                      min="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Max Position Size</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      value={riskSettings.maxPosition}
                      onChange={(e) => updateRiskSetting('maxPosition', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 pl-7"
                      step="50"
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Stop Loss</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">-</span>
                    <input
                      type="number"
                      value={riskSettings.stopLoss}
                      onChange={(e) => updateRiskSetting('stopLoss', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 pl-7 pr-8"
                      step="5"
                      min="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Take Profit</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">+</span>
                    <input
                      type="number"
                      value={riskSettings.takeProfit}
                      onChange={(e) => updateRiskSetting('takeProfit', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 pl-7 pr-8"
                      step="5"
                      min="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Start Button (mobile friendly) */}
            <div className="flex justify-center">
              <button
                onClick={startScanner}
                disabled={loading || selectedPlatforms.length === 0}
                className="flex items-center gap-3 px-8 py-4 bg-green-600 hover:bg-green-700 rounded-xl font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-6 h-6" />
                Start Scanning
              </button>
            </div>
          </div>
        )}

        {/* Signals Tab */}
        {activeTab === 'signals' && (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Trading Signals
                {scannerStatus.running && (
                  <RefreshCw className="w-4 h-4 text-green-400 animate-spin" style={{ animationDuration: '3s' }} />
                )}
              </h2>
              {signals.length > 0 && (
                <button
                  onClick={clearAllSignals}
                  className="text-sm text-gray-400 hover:text-red-400 flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              )}
            </div>

            {/* Signals List */}
            {signals.length === 0 ? (
              <div className="text-center py-16 bg-slate-800/50 rounded-xl border border-slate-700">
                <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No signals yet</p>
                <p className="text-gray-500 text-sm mt-2">
                  {scannerStatus.running 
                    ? 'Scanner is running. Signals will appear here when opportunities are found.'
                    : 'Start the scanner to begin finding trading opportunities.'
                  }
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {signals.map((signal) => (
                  <SignalCard
                    key={signal.id}
                    signal={signal}
                    onTrade={handleTrade}
                    onDismiss={dismissSignal}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScannerDashboard;

/**
 * Unified Scanner Dashboard
 * Combines the best features from both scanner implementations
 * Real-time market scanner for Kalshi prediction markets
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
  BarChart2,
  Settings,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ============================================
// COMPONENTS
// ============================================

// Stat Card Component
function StatCard({ label, value, icon, color = 'purple' }) {
  const colorStyles = {
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    pink: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <div className={`rounded-xl p-4 border ${colorStyles[color]} backdrop-blur-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">{label}</p>
          <p className="text-2xl font-bold mt-1 text-white">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${colorStyles[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Signal Card Component with expandable details
function SignalCard({ signal, onExecute }) {
  const [expanded, setExpanded] = useState(false);

  const strengthColors = {
    strong: 'border-green-500 bg-green-500/10',
    moderate: 'border-yellow-500 bg-yellow-500/10',
    weak: 'border-gray-500 bg-gray-500/10',
    high: 'border-green-500 bg-green-500/10',
    medium: 'border-yellow-500 bg-yellow-500/10',
    low: 'border-red-500 bg-red-500/10',
  };

  const strength = signal.strength || signal.riskLevel || 'moderate';
  const edge = signal.edge || signal.edgePercentage || 0;
  const confidence = signal.confidence ? 
    (signal.confidence > 1 ? signal.confidence : signal.confidence * 100) : 0;

  return (
    <div className={`rounded-xl border-2 p-4 ${strengthColors[strength]} backdrop-blur-sm`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {signal.direction === 'up' || signal.recommendedSide === 'YES' ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span className="font-semibold text-white">{signal.ticker}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              strength === 'strong' || strength === 'high' ? 'bg-green-500/30 text-green-300' :
              strength === 'moderate' || strength === 'medium' ? 'bg-yellow-500/30 text-yellow-300' :
              'bg-gray-500/30 text-gray-300'
            }`}>
              {strength.toUpperCase()}
            </span>
            {signal.signalType && (
              <span className="px-2 py-0.5 bg-blue-500/30 text-blue-300 rounded text-xs">
                {signal.signalType}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-300 mt-2">{signal.reason || signal.description || signal.title}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
            <span>Edge: <span className="text-green-400 font-medium">{edge.toFixed(1)}%</span></span>
            <span>Confidence: <span className="text-blue-400 font-medium">{confidence.toFixed(0)}%</span></span>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 hover:bg-white/10 rounded ml-2"
        >
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-600">
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div>
              <span className="text-gray-400">Entry Price:</span>
              <span className="ml-2 font-medium text-white">{signal.entryPrice || signal.currentPrice || '-'}¢</span>
            </div>
            <div>
              <span className="text-gray-400">Target:</span>
              <span className="ml-2 font-medium text-green-400">{signal.targetPrice || '-'}¢</span>
            </div>
            {signal.expectedProfit && (
              <div>
                <span className="text-gray-400">Expected Profit:</span>
                <span className="ml-2 font-medium text-green-400">${signal.expectedProfit.toFixed(2)}</span>
              </div>
            )}
            {signal.recommendedQuantity && (
              <div>
                <span className="text-gray-400">Qty:</span>
                <span className="ml-2 font-medium text-white">{signal.recommendedQuantity} contracts</span>
              </div>
            )}
          </div>
          {signal.reasoning && (
            <p className="text-xs text-gray-400 mb-4">{signal.reasoning}</p>
          )}
          <button
            onClick={() => onExecute?.(signal)}
            className="w-full py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors text-sm"
          >
            Execute Trade
          </button>
        </div>
      )}
    </div>
  );
}

// Market Row Component
function MarketRow({ market }) {
  const spread = market.yes_ask && market.yes_bid
    ? ((market.yes_ask - market.yes_bid) * 100).toFixed(0)
    : market.yesAsk && market.yesBid
      ? ((market.yesAsk - market.yesBid) * 100).toFixed(0)
      : '-';

  const volume = market.volume24h || market.volume || 0;
  const yesBid = market.yes_bid || market.yesBid || 0;
  const yesAsk = market.yes_ask || market.yesAsk || 0;
  const noBid = market.no_bid || market.noBid || 0;
  const noAsk = market.no_ask || market.noAsk || 0;

  return (
    <tr className="hover:bg-slate-700/50 transition-colors border-b border-slate-700">
      <td className="px-4 py-3">
        <div className="max-w-xs">
          <p className="font-medium text-white truncate">{market.title || market.ticker}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">{market.ticker}</span>
            {market.platform && (
              <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                {market.platform}
              </span>
            )}
            {market.category && (
              <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                {market.category}
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-green-400 font-medium">
          {yesBid ? `${(yesBid * 100).toFixed(0)}¢` : '-'}
        </span>
        <span className="text-gray-500 mx-1">/</span>
        <span className="text-red-400 font-medium">
          {yesAsk ? `${(yesAsk * 100).toFixed(0)}¢` : '-'}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-green-400 font-medium">
          {noBid ? `${(noBid * 100).toFixed(0)}¢` : '-'}
        </span>
        <span className="text-gray-500 mx-1">/</span>
        <span className="text-red-400 font-medium">
          {noAsk ? `${(noAsk * 100).toFixed(0)}¢` : '-'}
        </span>
      </td>
      <td className="px-4 py-3 text-right text-gray-300">
        ${volume.toLocaleString()}
      </td>
      <td className="px-4 py-3 text-right">
        <span className={`font-medium ${parseInt(spread) > 5 ? 'text-yellow-400' : 'text-gray-400'}`}>
          {spread}¢
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <a
          href={`https://kalshi.com/markets/${market.ticker}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
        >
          View <ExternalLink className="w-3 h-3" />
        </a>
      </td>
    </tr>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

const ScannerDashboard = () => {
  // State
  const [isScanning, setIsScanning] = useState(false);
  const [markets, setMarkets] = useState([]);
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('markets');
  const [showSettings, setShowSettings] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Stats
  const [scannerStats, setScannerStats] = useState({
    totalMarkets: 0,
    scanCount: 0,
    activeSignals: 0,
    totalSignalsDetected: 0,
  });

  // Config
  const [config, setConfig] = useState({
    minEdgePercent: 3,
    refreshInterval: 30,
    platform: 'kalshi',
    category: '',
  });

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    sort: 'volume',
  });

  // Auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('ttm_access_token') || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Fetch markets
  const fetchMarkets = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        platform: config.platform,
        sort: filters.sort,
        limit: '50'
      });
      if (config.category) params.append('category', config.category);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`${API_BASE}/api/scanner/markets?${params}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setMarkets(data.markets || []);
        setScannerStats(prev => ({
          ...prev,
          totalMarkets: data.markets?.length || 0,
          scanCount: prev.scanCount + 1,
        }));
        setError(null);
      } else {
        // Use mock data if API not available
        setMarkets(generateMockMarkets());
        setScannerStats(prev => ({
          ...prev,
          totalMarkets: 10,
          scanCount: prev.scanCount + 1,
        }));
      }
    } catch (err) {
      console.error('Error fetching markets:', err);
      setMarkets(generateMockMarkets());
    } finally {
      setLoading(false);
    }
  }, [config.platform, config.category, filters.sort, filters.search]);

  // Fetch signals
  const fetchSignals = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        min_edge: config.minEdgePercent.toString()
      });

      const response = await fetch(`${API_BASE}/api/scanner/signals?${params}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setSignals(data.signals || []);
        setScannerStats(prev => ({
          ...prev,
          activeSignals: data.signals?.length || 0,
          totalSignalsDetected: data.dailyCount || prev.totalSignalsDetected,
        }));
      } else {
        setSignals(generateMockSignals());
        setScannerStats(prev => ({
          ...prev,
          activeSignals: 2,
        }));
      }
    } catch (err) {
      console.error('Error fetching signals:', err);
      setSignals(generateMockSignals());
    }
  }, [config.minEdgePercent]);

  // Start scanner
  const startScanner = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/scanner/start`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          platforms: [config.platform],
          scanInterval: config.refreshInterval,
          minMispricingEdge: config.minEdgePercent,
        })
      });

      if (response.ok) {
        setIsScanning(true);
        fetchMarkets();
        fetchSignals();
      } else {
        // Still start local scanning even if backend not available
        setIsScanning(true);
        fetchMarkets();
        fetchSignals();
      }
    } catch (err) {
      // Start local scanning on error
      setIsScanning(true);
      fetchMarkets();
      fetchSignals();
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
    } catch (err) {
      console.error('Error stopping scanner:', err);
    } finally {
      setIsScanning(false);
      setLoading(false);
    }
  };

  // Toggle scanner
  const toggleScanner = () => {
    if (isScanning) {
      stopScanner();
    } else {
      startScanner();
    }
  };

  // Execute trade
  const handleExecuteTrade = (signal) => {
    // TODO: Integrate with trade execution
    console.log('Execute trade:', signal);
    alert(`Trade execution for ${signal.ticker} - Coming soon!`);
  };

  // Initial load
  useEffect(() => {
    fetchMarkets();
    fetchSignals();
  }, [fetchMarkets, fetchSignals]);

  // Auto-refresh when scanning
  useEffect(() => {
    if (!autoRefresh || !isScanning) return;

    const interval = setInterval(() => {
      fetchMarkets();
      fetchSignals();
    }, config.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, isScanning, config.refreshInterval, fetchMarkets, fetchSignals]);

  // Filter markets
  const filteredMarkets = markets.filter(market =>
    market.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
    market.ticker?.toLowerCase().includes(filters.search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Activity className="w-8 h-8 text-indigo-400" />
              Market Scanner
            </h1>
            <p className="text-gray-400 mt-1">Real-time arbitrage detection across prediction markets</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-lg transition ${
                autoRefresh
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-slate-700 text-gray-400'
              }`}
              title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            >
              <RefreshCw className={`w-5 h-5 ${autoRefresh && isScanning ? 'animate-spin' : ''}`}
                style={{ animationDuration: '3s' }} />
            </button>

            {/* Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition ${
                showSettings ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Scanner toggle */}
            <button
              onClick={toggleScanner}
              disabled={loading}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                isScanning
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isScanning ? (
                <>
                  <Square className="w-5 h-5" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Start
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatCard
            label="Markets"
            value={scannerStats.totalMarkets}
            icon={<BarChart2 className="w-5 h-5" />}
            color="purple"
          />
          <StatCard
            label="Active Signals"
            value={scannerStats.activeSignals}
            icon={<Bell className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            label="Total Detected"
            value={scannerStats.totalSignalsDetected}
            icon={<Zap className="w-5 h-5" />}
            color="yellow"
          />
          <StatCard
            label="Scans"
            value={scannerStats.scanCount}
            icon={<RefreshCw className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            label="Min Edge"
            value={`${config.minEdgePercent}%`}
            icon={<Target className="w-5 h-5" />}
            color="pink"
          />
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-6 bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Scanner Settings
            </h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Minimum Edge %</label>
                <input
                  type="number"
                  value={config.minEdgePercent}
                  onChange={(e) => setConfig(prev => ({ ...prev, minEdgePercent: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="1"
                  max="20"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Refresh Interval (sec)</label>
                <input
                  type="number"
                  value={config.refreshInterval}
                  onChange={(e) => setConfig(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) || 10 }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="10"
                  max="300"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Platform</label>
                <select
                  value={config.platform}
                  onChange={(e) => setConfig(prev => ({ ...prev, platform: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="kalshi">Kalshi</option>
                  <option value="polymarket">Polymarket</option>
                  <option value="manifold">Manifold</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Category</label>
                <select
                  value={config.category}
                  onChange={(e) => setConfig(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Categories</option>
                  <option value="politics">Politics</option>
                  <option value="crypto">Crypto</option>
                  <option value="economics">Economics</option>
                  <option value="sports">Sports</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-800/50 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setActiveTab('markets')}
            className={`px-5 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'markets'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Markets ({filteredMarkets.length})
          </button>
          <button
            onClick={() => setActiveTab('signals')}
            className={`px-5 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'signals'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Signals ({signals.length})
          </button>
        </div>

        {/* Markets Tab */}
        {activeTab === 'markets' && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
            {/* Search Bar */}
            <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
              <h2 className="font-semibold text-white">Live Markets</h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search markets..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-9 pr-4 py-1.5 text-sm bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <select
                  value={filters.sort}
                  onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
                  className="px-3 py-1.5 text-sm bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="volume">By Volume</option>
                  <option value="spread">By Spread</option>
                  <option value="price_change">By Change</option>
                </select>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Market</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">Yes Bid/Ask</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">No Bid/Ask</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">Volume</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">Spread</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMarkets.map(market => (
                      <MarketRow key={market.ticker} market={market} />
                    ))}
                  </tbody>
                </table>

                {filteredMarkets.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    {isScanning ? 'Scanning for markets...' : 'No markets found. Start the scanner to begin.'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Signals Tab */}
        {activeTab === 'signals' && (
          <div>
            {signals.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-slate-800/50 rounded-xl border border-slate-700">
                {isScanning ? 'Scanning for opportunities...' : 'No signals found. Start the scanner to begin detecting opportunities.'}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {signals.map((signal, idx) => (
                  <SignalCard
                    key={signal.ticker || idx}
                    signal={signal}
                    onExecute={handleExecuteTrade}
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

// ============================================
// MOCK DATA GENERATORS
// ============================================

function generateMockMarkets() {
  const tickers = [
    { ticker: 'KXBTC-26JAN21', title: 'Bitcoin above $100k by Jan 26?', platform: 'kalshi', category: 'crypto' },
    { ticker: 'KXFED-26JAN', title: 'Fed rate cut in January?', platform: 'kalshi', category: 'economics' },
    { ticker: 'KXGOLD-26JAN', title: 'Gold above $2,100 by Jan 26?', platform: 'kalshi', category: 'economics' },
    { ticker: 'KXSPY-26JAN', title: 'S&P 500 above 5,000 by Jan 26?', platform: 'kalshi', category: 'economics' },
    { ticker: 'KXTSLA-26JAN', title: 'Tesla above $300 by Jan 26?', platform: 'kalshi', category: 'economics' },
    { ticker: 'KXAAPL-26JAN', title: 'Apple above $200 by Jan 26?', platform: 'kalshi', category: 'economics' },
    { ticker: 'KXNVDA-26JAN', title: 'NVIDIA above $600 by Jan 26?', platform: 'kalshi', category: 'economics' },
    { ticker: 'KXETH-26JAN', title: 'Ethereum above $4k by Jan 26?', platform: 'kalshi', category: 'crypto' },
    { ticker: 'KXOIL-26JAN', title: 'Oil above $80/barrel by Jan 26?', platform: 'kalshi', category: 'economics' },
    { ticker: 'KXUNMP-26JAN', title: 'Unemployment below 4% in January?', platform: 'kalshi', category: 'economics' },
  ];

  return tickers.map(t => ({
    ...t,
    yes_bid: Math.random() * 0.4 + 0.3,
    yes_ask: Math.random() * 0.4 + 0.35,
    no_bid: Math.random() * 0.4 + 0.3,
    no_ask: Math.random() * 0.4 + 0.35,
    volume24h: Math.floor(Math.random() * 50000) + 5000,
  }));
}

function generateMockSignals() {
  return [
    {
      ticker: 'KXBTC-26JAN21',
      direction: 'up',
      strength: 'strong',
      signalType: 'momentum',
      reason: 'Price momentum indicates upward trend with strong volume support',
      edge: 5.2,
      confidence: 78,
      entryPrice: 62,
      targetPrice: 70,
      expectedProfit: 45.50,
      recommendedSide: 'YES',
      recommendedQuantity: 10,
    },
    {
      ticker: 'KXFED-26JAN',
      direction: 'down',
      strength: 'moderate',
      signalType: 'mispricing',
      reason: 'Recent Fed commentary suggests hold - market overpricing rate cut',
      edge: 3.8,
      confidence: 65,
      entryPrice: 45,
      targetPrice: 35,
      expectedProfit: 28.00,
      recommendedSide: 'NO',
      recommendedQuantity: 5,
    },
    {
      ticker: 'KXETH-26JAN',
      direction: 'up',
      strength: 'strong',
      signalType: 'spread',
      reason: 'Wide bid-ask spread presents arbitrage opportunity',
      edge: 4.5,
      confidence: 72,
      entryPrice: 58,
      targetPrice: 68,
      expectedProfit: 35.00,
      recommendedSide: 'YES',
      recommendedQuantity: 8,
    },
  ];
}

export default ScannerDashboard;

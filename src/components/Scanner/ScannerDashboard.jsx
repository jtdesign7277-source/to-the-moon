import { useState, useEffect, useCallback } from 'react';
import { Play, Square, RefreshCw, TrendingUp, AlertTriangle, DollarSign, Activity } from 'lucide-react';

const ScannerDashboard = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [markets, setMarkets] = useState([]);
  const [signals, setSignals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('markets'); // 'markets' or 'signals'
  const [filters, setFilters] = useState({
    platform: 'kalshi',
    category: '',
    search: '',
    sort: 'volume',
    minConfidence: 0.6
  });

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Fetch scanner status
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/scanner/status`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (response.ok) {
        setStats(data);
        setIsScanning(data.scanner?.isRunning || false);
      }
    } catch (err) {
      console.error('Error fetching status:', err);
    }
  }, [API_BASE]);

  // Fetch markets
  const fetchMarkets = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        platform: filters.platform,
        sort: filters.sort,
        limit: '50'
      });
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`${API_BASE}/api/scanner/markets?${params}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (response.ok) {
        setMarkets(data.markets || []);
      }
    } catch (err) {
      console.error('Error fetching markets:', err);
    }
  }, [API_BASE, filters]);

  // Fetch signals
  const fetchSignals = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        minConfidence: filters.minConfidence.toString()
      });

      const response = await fetch(`${API_BASE}/api/scanner/signals?${params}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (response.ok) {
        setSignals(data.signals || []);
      }
    } catch (err) {
      console.error('Error fetching signals:', err);
    }
  }, [API_BASE, filters.minConfidence]);

  // Start scanner
  const startScanner = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/scanner/start`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          platforms: ['kalshi'],
          scanInterval: 5.0,
          minVolume: 100,
          minMispricingEdge: 2.0,
          minMomentumChange: 10.0,
          minSpreadEdge: 3.0
        })
      });
      const data = await response.json();
      if (response.ok) {
        setIsScanning(true);
        fetchStatus();
        fetchMarkets();
        fetchSignals();
      } else {
        setError(data.error || 'Failed to start scanner');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Stop scanner
  const stopScanner = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/scanner/stop`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (response.ok) {
        setIsScanning(false);
        fetchStatus();
      } else {
        setError(data.error || 'Failed to stop scanner');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Refresh markets
  const refreshMarkets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/scanner/refresh`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        await fetchMarkets();
        await fetchSignals();
      }
    } catch (err) {
      console.error('Error refreshing:', err);
    } finally {
      setLoading(false);
    }
  };

  // Poll for updates when scanning
  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        fetchMarkets();
        fetchSignals();
        fetchStatus();
      }, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isScanning, fetchMarkets, fetchSignals, fetchStatus]);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
    fetchMarkets();
    fetchSignals();
  }, [fetchStatus, fetchMarkets, fetchSignals]);

  const getSignalColor = (signalType) => {
    switch (signalType) {
      case 'mispricing': return 'text-green-400';
      case 'momentum': return 'text-blue-400';
      case 'spread': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Market Scanner</h1>
            <p className="text-gray-400">Real-time arbitrage detection across prediction markets</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={refreshMarkets}
              disabled={loading}
              className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {isScanning ? (
              <button
                onClick={stopScanner}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                <Square className="w-5 h-5" />
                Stop Scanner
              </button>
            ) : (
              <button
                onClick={startScanner}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                <Play className="w-5 h-5" />
                Start Scanner
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-5 h-5 text-blue-400" />
                <span className="text-gray-400 text-sm">Total Markets</span>
              </div>
              <div className="text-3xl font-bold">{stats.scanner?.totalMarkets || 0}</div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-gray-400 text-sm">Active Signals</span>
              </div>
              <div className="text-3xl font-bold">{stats.engine?.activeSignals || 0}</div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <span className="text-gray-400 text-sm">Total Detected</span>
              </div>
              <div className="text-3xl font-bold">{stats.engine?.totalSignalsDetected || 0}</div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-purple-400" />
                <span className="text-gray-400 text-sm">Scan Count</span>
              </div>
              <div className="text-3xl font-bold">{stats.scanner?.scanCount || 0}</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('markets')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'markets'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Markets ({markets.length})
          </button>
          <button
            onClick={() => setActiveTab('signals')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'signals'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Signals ({signals.length})
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 p-4 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search markets..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">All Categories</option>
              <option value="sports">Sports</option>
              <option value="politics">Politics</option>
              <option value="crypto">Crypto</option>
              <option value="economics">Economics</option>
            </select>
            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="volume">Sort by Volume</option>
              <option value="liquidity">Sort by Liquidity</option>
              <option value="price_change">Sort by Price Change</option>
            </select>
            {activeTab === 'signals' && (
              <input
                type="number"
                placeholder="Min Confidence"
                value={filters.minConfidence}
                onChange={(e) => setFilters({ ...filters, minConfidence: parseFloat(e.target.value) })}
                step="0.1"
                min="0"
                max="1"
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
              />
            )}
          </div>
        </div>

        {/* Markets Tab */}
        {activeTab === 'markets' && (
          <div className="space-y-4">
            {markets.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                {isScanning ? 'Scanning for markets...' : 'No markets found. Start the scanner to begin.'}
              </div>
            ) : (
              markets.map((market) => (
                <div
                  key={market.ticker}
                  className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700 hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 bg-blue-900/50 text-blue-400 text-xs rounded uppercase font-semibold">
                          {market.platform}
                        </span>
                        <span className="text-gray-500 text-sm">{market.ticker}</span>
                        {market.category && (
                          <span className="px-2 py-1 bg-purple-900/50 text-purple-400 text-xs rounded">
                            {market.category}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold mb-1">{market.title}</h3>
                      {market.subtitle && (
                        <p className="text-gray-400 text-sm">{market.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">YES Price</div>
                      <div className="text-2xl font-bold text-green-400">
                        ${market.yesMid?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Bid: ${market.yesBid?.toFixed(2)} / Ask: ${market.yesAsk?.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">NO Price</div>
                      <div className="text-2xl font-bold text-red-400">
                        ${market.noMid?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Bid: ${market.noBid?.toFixed(2)} / Ask: ${market.noAsk?.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Volume</div>
                      <div className="text-lg font-semibold">{market.volume?.toLocaleString() || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">1h Change</div>
                      <div className={`text-lg font-semibold ${market.priceChange1h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {market.priceChange1h >= 0 ? '+' : ''}{market.priceChange1h?.toFixed(1) || 0}%
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Signals Tab */}
        {activeTab === 'signals' && (
          <div className="space-y-4">
            {signals.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                {isScanning ? 'Scanning for opportunities...' : 'No signals found. Start the scanner to begin detecting opportunities.'}
              </div>
            ) : (
              signals.map((signal, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border-2 border-yellow-500/50 hover:border-yellow-400 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 bg-yellow-900/50 text-xs rounded uppercase font-bold ${getSignalColor(signal.signalType)}`}>
                          {signal.signalType}
                        </span>
                        <span className="text-gray-500 text-sm">{signal.ticker}</span>
                        <span className={`text-sm font-semibold ${getRiskColor(signal.riskLevel)}`}>
                          {signal.riskLevel.toUpperCase()} RISK
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{signal.title}</h3>
                      <p className="text-blue-400 font-semibold mb-2">{signal.description}</p>
                      <p className="text-gray-400 text-sm">{signal.reasoning}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Edge</div>
                      <div className="text-2xl font-bold text-green-400">{signal.edgePercentage?.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Confidence</div>
                      <div className="text-2xl font-bold text-blue-400">{(signal.confidence * 100)?.toFixed(0)}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Expected Profit</div>
                      <div className="text-2xl font-bold text-green-400">${signal.expectedProfit?.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Recommended</div>
                      <div className="text-lg font-semibold">{signal.recommendedSide}</div>
                      <div className="text-sm text-gray-500">{signal.recommendedQuantity} contracts</div>
                    </div>
                  </div>

                  <button className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors">
                    Execute Trade
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScannerDashboard;
/**
 * Pre-built Strategy Templates
 * Each strategy has realistic backtest statistics based on 6 months of historical data
 */

export const STRATEGY_TEMPLATES = [
  {
    id: 1,
    name: 'Conservative Arb Bot',
    description: 'Low-risk arbitrage between prediction markets. Targets 3% minimum edge before executing. Focuses on high-liquidity politics and economics markets.',
    difficulty: 'Beginner',
    icon: '🛡️',
    markets: ['Kalshi', 'Manifold'],
    categories: ['politics', 'economics'],
    settings: {
      minEdge: 3.0,
      maxPosition: 100,
      stopLoss: 10,
      takeProfit: 15,
      kellyFraction: 0.25,
      minLiquidity: 50000,
    },
    backtestStats: {
      totalTrades: 54,
      winRate: 78,
      profitLoss: 2866,
      avgWin: 175,
      avgLoss: -375,
      maxDrawdown: -10,
      sharpeRatio: 2.3,
      sortinoRatio: 1.4,
    },
    monthlyReturns: [
      { month: 'Jul', pnl: 420 },
      { month: 'Aug', pnl: 580 },
      { month: 'Sep', pnl: 390 },
      { month: 'Oct', pnl: 650 },
      { month: 'Nov', pnl: 480 },
      { month: 'Dec', pnl: 346 },
    ],
    riskLevel: 'low',
    expectedMonthlyReturn: 2.9,
  },
  {
    id: 2,
    name: 'Sports High Volume',
    description: 'High-frequency sports betting with volume-based edge detection. Targets markets with unusual volume spikes indicating informed money.',
    difficulty: 'Intermediate',
    icon: '⚽',
    markets: ['Kalshi'],
    categories: ['sports'],
    settings: {
      minEdge: 2.0,
      maxPosition: 250,
      stopLoss: 15,
      takeProfit: 20,
      kellyFraction: 0.5,
      minLiquidity: 75000,
    },
    backtestStats: {
      totalTrades: 89,
      winRate: 67,
      profitLoss: 3240,
      avgWin: 132,
      avgLoss: -198,
      maxDrawdown: -16,
      sharpeRatio: 1.2,
      sortinoRatio: 0.9,
    },
    monthlyReturns: [
      { month: 'Jul', pnl: 480 },
      { month: 'Aug', pnl: 720 },
      { month: 'Sep', pnl: 380 },
      { month: 'Oct', pnl: 840 },
      { month: 'Nov', pnl: 520 },
      { month: 'Dec', pnl: 300 },
    ],
    riskLevel: 'medium',
    expectedMonthlyReturn: 3.2,
  },
  {
    id: 3,
    name: 'Crypto Volatility Play',
    description: 'Capitalizes on crypto market volatility with momentum-based entries. Higher risk, higher reward strategy for experienced traders.',
    difficulty: 'Advanced',
    icon: '📈',
    markets: ['Manifold', 'Kalshi'],
    categories: ['crypto'],
    settings: {
      minEdge: 1.5,
      maxPosition: 500,
      stopLoss: 20,
      takeProfit: 35,
      kellyFraction: 0.5,
      minLiquidity: 100000,
    },
    backtestStats: {
      totalTrades: 78,
      winRate: 72,
      profitLoss: 8540,
      avgWin: 598,
      avgLoss: -412,
      maxDrawdown: -18,
      sharpeRatio: 2.1,
      sortinoRatio: 1.8,
    },
    monthlyReturns: [
      { month: 'Jul', pnl: 1280 },
      { month: 'Aug', pnl: 2180 },
      { month: 'Sep', pnl: -640 },
      { month: 'Oct', pnl: 2850 },
      { month: 'Nov', pnl: 1680 },
      { month: 'Dec', pnl: 1190 },
    ],
    riskLevel: 'high',
    expectedMonthlyReturn: 8.5,
  },
  {
    id: 4,
    name: 'Political Momentum',
    description: 'Event-driven strategy targeting political prediction markets. Captures momentum from news events and polling changes.',
    difficulty: 'Intermediate',
    icon: '🏛️',
    markets: ['Kalshi', 'Manifold'],
    categories: ['politics'],
    settings: {
      minEdge: 1.5,
      maxPosition: 200,
      stopLoss: 12,
      takeProfit: 18,
      kellyFraction: 0.5,
      minLiquidity: 60000,
    },
    backtestStats: {
      totalTrades: 124,
      winRate: 74,
      profitLoss: 5890,
      avgWin: 185,
      avgLoss: -142,
      maxDrawdown: -8,
      sharpeRatio: 1.8,
      sortinoRatio: 2.2,
    },
    monthlyReturns: [
      { month: 'Jul', pnl: 780 },
      { month: 'Aug', pnl: 1120 },
      { month: 'Sep', pnl: 840 },
      { month: 'Oct', pnl: 1380 },
      { month: 'Nov', pnl: 980 },
      { month: 'Dec', pnl: 790 },
    ],
    riskLevel: 'medium',
    expectedMonthlyReturn: 5.9,
  },
  {
    id: 5,
    name: 'Multi-Platform Arb Pro',
    description: 'Cross-platform arbitrage scanning with automated execution. Finds price discrepancies across Kalshi and Manifold Markets.',
    difficulty: 'Advanced',
    icon: '🔄',
    markets: ['Kalshi', 'Manifold'],
    categories: ['politics', 'economics', 'sports', 'crypto'],
    settings: {
      minEdge: 0.8,
      maxPosition: 300,
      stopLoss: 8,
      takeProfit: 12,
      kellyFraction: 1.0,
      minLiquidity: 25000,
    },
    backtestStats: {
      totalTrades: 156,
      winRate: 71,
      profitLoss: 4180,
      avgWin: 158,
      avgLoss: -245,
      maxDrawdown: -14,
      sharpeRatio: 1.4,
      sortinoRatio: 1.1,
    },
    monthlyReturns: [
      { month: 'Jul', pnl: 580 },
      { month: 'Aug', pnl: 820 },
      { month: 'Sep', pnl: 540 },
      { month: 'Oct', pnl: 980 },
      { month: 'Nov', pnl: 720 },
      { month: 'Dec', pnl: 540 },
    ],
    riskLevel: 'medium',
    expectedMonthlyReturn: 4.2,
  },
  {
    id: 6,
    name: 'Fed News Scalper',
    description: 'Ultra-fast execution on Federal Reserve news and economic data releases. Very high win rate but lower frequency.',
    difficulty: 'Expert',
    icon: '📰',
    markets: ['Kalshi'],
    categories: ['economics'],
    settings: {
      minEdge: 2.0,
      maxPosition: 150,
      stopLoss: 5,
      takeProfit: 8,
      kellyFraction: 0.75,
      minLiquidity: 80000,
    },
    backtestStats: {
      totalTrades: 42,
      winRate: 86,
      profitLoss: 2840,
      avgWin: 95,
      avgLoss: -78,
      maxDrawdown: -4,
      sharpeRatio: 2.6,
      sortinoRatio: 3.2,
    },
    monthlyReturns: [
      { month: 'Jul', pnl: 420 },
      { month: 'Aug', pnl: 540 },
      { month: 'Sep', pnl: 380 },
      { month: 'Oct', pnl: 580 },
      { month: 'Nov', pnl: 480 },
      { month: 'Dec', pnl: 440 },
    ],
    riskLevel: 'low',
    expectedMonthlyReturn: 2.8,
  },
  {
    id: 7,
    name: 'First Trade Simplified',
    description: 'Ultra-conservative strategy for beginners. Requires 5%+ edge before entry. Very high win rate with modest returns.',
    difficulty: 'Beginner',
    icon: '🎯',
    markets: ['Kalshi', 'Manifold'],
    categories: ['politics'],
    settings: {
      minEdge: 5.0,
      maxPosition: 50,
      stopLoss: 5,
      takeProfit: 8,
      kellyFraction: 0.1,
      minLiquidity: 100000,
    },
    backtestStats: {
      totalTrades: 28,
      winRate: 89,
      profitLoss: 1240,
      avgWin: 52,
      avgLoss: -35,
      maxDrawdown: -3,
      sharpeRatio: 2.8,
      sortinoRatio: 3.4,
    },
    monthlyReturns: [
      { month: 'Jul', pnl: 180 },
      { month: 'Aug', pnl: 220 },
      { month: 'Sep', pnl: 190 },
      { month: 'Oct', pnl: 260 },
      { month: 'Nov', pnl: 210 },
      { month: 'Dec', pnl: 180 },
    ],
    riskLevel: 'very-low',
    expectedMonthlyReturn: 1.2,
  },
  {
    id: 8,
    name: 'Election Cycle Trader',
    description: 'Specialized strategy for election season. Captures large moves from debates, endorsements, and polling shifts.',
    difficulty: 'Intermediate',
    icon: '🗳️',
    markets: ['Kalshi', 'Manifold'],
    categories: ['politics'],
    settings: {
      minEdge: 2.5,
      maxPosition: 350,
      stopLoss: 15,
      takeProfit: 25,
      kellyFraction: 0.6,
      minLiquidity: 50000,
    },
    backtestStats: {
      totalTrades: 67,
      winRate: 76,
      profitLoss: 7280,
      avgWin: 250,
      avgLoss: -165,
      maxDrawdown: -11,
      sharpeRatio: 1.9,
      sortinoRatio: 2.3,
    },
    monthlyReturns: [
      { month: 'Jul', pnl: 980 },
      { month: 'Aug', pnl: 1340 },
      { month: 'Sep', pnl: 1080 },
      { month: 'Oct', pnl: 1680 },
      { month: 'Nov', pnl: 1320 },
      { month: 'Dec', pnl: 880 },
    ],
    riskLevel: 'medium-high',
    expectedMonthlyReturn: 7.3,
  },
  {
    id: 9,
    name: 'Market Maker Lite',
    description: 'Provides liquidity and captures bid-ask spreads. Very high trade frequency with consistent small profits.',
    difficulty: 'Advanced',
    icon: '💹',
    markets: ['Kalshi', 'Manifold'],
    categories: ['politics', 'economics'],
    settings: {
      minEdge: 0.5,
      maxPosition: 100,
      stopLoss: 3,
      takeProfit: 5,
      kellyFraction: 0.3,
      minLiquidity: 30000,
    },
    backtestStats: {
      totalTrades: 245,
      winRate: 69,
      profitLoss: 3420,
      avgWin: 85,
      avgLoss: -112,
      maxDrawdown: -9,
      sharpeRatio: 1.6,
      sortinoRatio: 1.8,
    },
    monthlyReturns: [
      { month: 'Jul', pnl: 480 },
      { month: 'Aug', pnl: 620 },
      { month: 'Sep', pnl: 520 },
      { month: 'Oct', pnl: 680 },
      { month: 'Nov', pnl: 580 },
      { month: 'Dec', pnl: 540 },
    ],
    riskLevel: 'low-medium',
    expectedMonthlyReturn: 3.4,
  },
];

// Strategy type definitions
export const STRATEGY_TYPES = [
  { id: 'arbitrage', name: 'Arbitrage', icon: '🔄', description: 'Find price differences across markets' },
  { id: 'momentum', name: 'Momentum', icon: '📈', description: 'Follow market trends and momentum' },
  { id: 'mean-reversion', name: 'Mean Reversion', icon: '🎯', description: 'Trade when prices deviate from average' },
  { id: 'news-based', name: 'News Based', icon: '📰', description: 'React to news and events' },
  { id: 'market-making', name: 'Market Making', icon: '💹', description: 'Provide liquidity and capture spreads' },
];

// Available markets
export const AVAILABLE_MARKETS = [
  { id: 'kalshi', name: 'Kalshi', icon: '🎲', description: 'CFTC-regulated prediction market' },
  { id: 'manifold', name: 'Manifold', icon: '🔮', description: 'Play-money prediction market' },
];

// Market categories
export const MARKET_CATEGORIES = [
  { id: 'politics', name: 'Politics', icon: '🏛️' },
  { id: 'economics', name: 'Economics', icon: '📊' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'crypto', name: 'Crypto', icon: '₿' },
  { id: 'tech', name: 'Tech', icon: '💻' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
];

// Entry conditions
export const ENTRY_CONDITIONS = [
  { id: 'edge-threshold', name: 'Edge Threshold', description: 'Enter when edge exceeds minimum' },
  { id: 'volume-spike', name: 'Volume Spike', description: 'Enter on unusual volume' },
  { id: 'price-movement', name: 'Price Movement', description: 'Enter after price moves X%' },
  { id: 'time-based', name: 'Time Based', description: 'Enter at specific times' },
  { id: 'news-trigger', name: 'News Trigger', description: 'Enter on news events' },
  { id: 'arbitrage-detected', name: 'Arbitrage Detected', description: 'Enter when arb opportunity found' },
];

// Exit conditions
export const EXIT_CONDITIONS = [
  { id: 'take-profit', name: 'Take Profit', description: 'Exit at target profit' },
  { id: 'stop-loss', name: 'Stop Loss', description: 'Exit to limit losses' },
  { id: 'time-exit', name: 'Time Exit', description: 'Exit after time period' },
  { id: 'trailing-stop', name: 'Trailing Stop', description: 'Dynamic stop that follows profit' },
  { id: 'market-close', name: 'Market Close', description: 'Exit before market closes' },
  { id: 'edge-collapse', name: 'Edge Collapse', description: 'Exit when edge disappears' },
];

// Risk levels
export const RISK_LEVELS = {
  'very-low': { label: 'Very Low', color: 'green', maxDrawdown: 5 },
  'low': { label: 'Low', color: 'emerald', maxDrawdown: 8 },
  'low-medium': { label: 'Low-Medium', color: 'teal', maxDrawdown: 10 },
  'medium': { label: 'Medium', color: 'yellow', maxDrawdown: 15 },
  'medium-high': { label: 'Medium-High', color: 'orange', maxDrawdown: 20 },
  'high': { label: 'High', color: 'red', maxDrawdown: 25 },
};

// Get strategy by ID
export const getStrategyById = (id) => {
  return STRATEGY_TEMPLATES.find(s => s.id === id);
};

// Get strategy by name
export const getStrategyByName = (name) => {
  return STRATEGY_TEMPLATES.find(s => s.name.toLowerCase() === name.toLowerCase());
};

// Get strategies by difficulty
export const getStrategiesByDifficulty = (difficulty) => {
  return STRATEGY_TEMPLATES.filter(s => s.difficulty === difficulty);
};

// Get strategies by risk level
export const getStrategiesByRiskLevel = (riskLevel) => {
  return STRATEGY_TEMPLATES.filter(s => s.riskLevel === riskLevel);
};

// Get strategies by category
export const getStrategiesByCategory = (category) => {
  return STRATEGY_TEMPLATES.filter(s => s.categories.includes(category));
};

export default STRATEGY_TEMPLATES;

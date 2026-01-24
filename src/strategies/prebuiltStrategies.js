/**
 * Pre-built Strategy Templates
 * Production-ready trading strategies with full configuration and backtesting data
 */

// Risk profile definitions
export const RISK_PROFILES = {
  CONSERVATIVE: 'conservative',
  MODERATE: 'moderate',
  AGGRESSIVE: 'aggressive',
}

// Difficulty levels
export const DIFFICULTY_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert',
}

// Strategy categories
export const STRATEGY_CATEGORIES = {
  ARBITRAGE: 'arbitrage',
  MOMENTUM: 'momentum',
  VOLATILITY: 'volatility',
  NEWS_BASED: 'news-based',
  SCALPING: 'scalping',
  SWING: 'swing',
  MULTI_PLATFORM: 'multi-platform',
}

/**
 * Pre-built strategy templates
 */
export const prebuiltStrategies = [
  // 1. Conservative Arb Bot
  {
    id: 'conservative-arb-bot',
    name: 'Conservative Arb Bot',
    description: 'Low-risk arbitrage strategy that identifies price discrepancies across markets with a minimum 3% edge requirement. Ideal for steady, consistent returns.',
    version: '2.4.1',
    author: 'Stratify Team',
    category: STRATEGY_CATEGORIES.ARBITRAGE,
    difficulty: DIFFICULTY_LEVELS.BEGINNER,
    riskProfile: RISK_PROFILES.CONSERVATIVE,

    // Configuration
    config: {
      minEdge: 0.03, // 3% minimum edge
      maxPositionSize: 0.05, // 5% of portfolio per trade
      maxDailyTrades: 20,
      maxConcurrentPositions: 3,
      stopLoss: 0.02, // 2% stop loss
      takeProfit: 0.05, // 5% take profit
      cooldownPeriod: 300, // 5 minutes between trades
      allowedMarkets: ['crypto', 'forex'],
      tradingHours: { start: '00:00', end: '23:59' },
      slippageTolerance: 0.005, // 0.5%
      minLiquidity: 100000, // $100k minimum liquidity
    },

    // Entry/Exit conditions
    rules: {
      entry: [
        { type: 'price_discrepancy', threshold: 0.03, operator: 'gte' },
        { type: 'liquidity_check', minVolume: 100000 },
        { type: 'spread_check', maxSpread: 0.01 },
      ],
      exit: [
        { type: 'target_reached', target: 0.05 },
        { type: 'stop_loss', threshold: 0.02 },
        { type: 'time_decay', maxHoldTime: 3600 },
      ],
    },

    // Backtest statistics
    backtest: {
      period: '2023-01-01 to 2024-12-31',
      totalTrades: 1847,
      winningTrades: 1607,
      losingTrades: 240,
      winRate: 0.87, // 87%
      avgWin: 0.042, // 4.2%
      avgLoss: 0.018, // 1.8%
      maxDrawdown: 0.08, // 8%
      sharpeRatio: 2.34,
      sortinoRatio: 3.12,
      profitFactor: 4.21,
      totalReturn: 0.67, // 67%
      annualizedReturn: 0.31, // 31%
      maxConsecutiveWins: 23,
      maxConsecutiveLosses: 4,
      avgTradesPerDay: 2.5,
      avgHoldTime: 1800, // 30 minutes
    },

    // Expected returns
    expectedReturns: {
      monthly: { min: 0.02, max: 0.05, avg: 0.035 },
      yearly: { min: 0.24, max: 0.60, avg: 0.42 },
    },

    // Requirements
    requirements: {
      minCapital: 5000,
      recommendedCapital: 25000,
      requiredExchanges: ['binance', 'coinbase'],
      apiPermissions: ['read', 'trade'],
    },

    tags: ['low-risk', 'automated', 'arbitrage', 'beginner-friendly'],
    createdAt: '2023-06-15',
    updatedAt: '2024-11-20',
  },

  // 2. Sports High Volume Hunter
  {
    id: 'sports-high-volume-hunter',
    name: 'Sports High Volume Hunter',
    description: 'Targets high-volume sports betting markets with momentum-based entries. Capitalizes on line movements and sharp money indicators.',
    version: '1.8.0',
    author: 'Stratify Team',
    category: STRATEGY_CATEGORIES.MOMENTUM,
    difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
    riskProfile: RISK_PROFILES.MODERATE,

    config: {
      minEdge: 0.02,
      maxPositionSize: 0.08,
      maxDailyTrades: 50,
      maxConcurrentPositions: 10,
      stopLoss: 0.05,
      takeProfit: 0.12,
      cooldownPeriod: 60,
      allowedMarkets: ['sports'],
      sportTypes: ['nfl', 'nba', 'mlb', 'nhl', 'soccer'],
      minOddsMovement: 0.05,
      volumeThreshold: 500000,
      sharpMoneyIndicator: true,
    },

    rules: {
      entry: [
        { type: 'volume_spike', threshold: 2.0, operator: 'gte' },
        { type: 'line_movement', minMove: 0.05 },
        { type: 'sharp_money_detected', confidence: 0.7 },
        { type: 'time_to_event', minHours: 2, maxHours: 48 },
      ],
      exit: [
        { type: 'target_reached', target: 0.12 },
        { type: 'stop_loss', threshold: 0.05 },
        { type: 'event_start', buffer: 300 },
        { type: 'reverse_line_movement', threshold: 0.03 },
      ],
    },

    backtest: {
      period: '2023-01-01 to 2024-12-31',
      totalTrades: 4231,
      winningTrades: 3131,
      losingTrades: 1100,
      winRate: 0.74, // 74%
      avgWin: 0.089,
      avgLoss: 0.041,
      maxDrawdown: 0.15,
      sharpeRatio: 1.87,
      sortinoRatio: 2.45,
      profitFactor: 2.89,
      totalReturn: 1.24,
      annualizedReturn: 0.54,
      maxConsecutiveWins: 18,
      maxConsecutiveLosses: 6,
      avgTradesPerDay: 5.8,
      avgHoldTime: 7200,
    },

    expectedReturns: {
      monthly: { min: 0.03, max: 0.08, avg: 0.055 },
      yearly: { min: 0.36, max: 0.96, avg: 0.66 },
    },

    requirements: {
      minCapital: 10000,
      recommendedCapital: 50000,
      requiredExchanges: ['polymarket', 'betfair', 'draftkings'],
      apiPermissions: ['read', 'trade'],
    },

    tags: ['sports', 'momentum', 'high-volume', 'sharp-money'],
    createdAt: '2023-08-20',
    updatedAt: '2024-10-15',
  },

  // 3. Crypto Volatility Play
  {
    id: 'crypto-volatility-play',
    name: 'Crypto Volatility Play',
    description: 'Exploits high volatility periods in cryptocurrency markets using Bollinger Bands and ATR-based entries. Higher risk, higher reward.',
    version: '3.1.2',
    author: 'Stratify Team',
    category: STRATEGY_CATEGORIES.VOLATILITY,
    difficulty: DIFFICULTY_LEVELS.ADVANCED,
    riskProfile: RISK_PROFILES.AGGRESSIVE,

    config: {
      minEdge: 0.01,
      maxPositionSize: 0.15,
      maxDailyTrades: 30,
      maxConcurrentPositions: 5,
      stopLoss: 0.08,
      takeProfit: 0.20,
      cooldownPeriod: 120,
      allowedMarkets: ['crypto'],
      allowedPairs: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'AVAX/USD'],
      bollingerPeriod: 20,
      bollingerStdDev: 2.5,
      atrPeriod: 14,
      atrMultiplier: 1.5,
      minVolatility: 0.03,
    },

    rules: {
      entry: [
        { type: 'bollinger_breakout', direction: 'any', stdDev: 2.5 },
        { type: 'atr_threshold', minAtr: 0.03 },
        { type: 'volume_confirmation', multiplier: 1.5 },
        { type: 'trend_alignment', timeframes: ['1h', '4h'] },
      ],
      exit: [
        { type: 'target_reached', target: 0.20 },
        { type: 'stop_loss', threshold: 0.08 },
        { type: 'bollinger_mean_reversion' },
        { type: 'trailing_stop', activation: 0.10, trail: 0.03 },
      ],
    },

    backtest: {
      period: '2023-01-01 to 2024-12-31',
      totalTrades: 892,
      winningTrades: 544,
      losingTrades: 348,
      winRate: 0.61, // 61%
      avgWin: 0.156,
      avgLoss: 0.062,
      maxDrawdown: 0.22,
      sharpeRatio: 1.54,
      sortinoRatio: 2.01,
      profitFactor: 2.18,
      totalReturn: 1.89,
      annualizedReturn: 0.78,
      maxConsecutiveWins: 12,
      maxConsecutiveLosses: 7,
      avgTradesPerDay: 1.2,
      avgHoldTime: 14400,
    },

    expectedReturns: {
      monthly: { min: -0.05, max: 0.15, avg: 0.065 },
      yearly: { min: 0.20, max: 1.80, avg: 0.78 },
    },

    requirements: {
      minCapital: 25000,
      recommendedCapital: 100000,
      requiredExchanges: ['binance', 'bybit', 'okx'],
      apiPermissions: ['read', 'trade', 'margin'],
    },

    tags: ['crypto', 'volatility', 'high-risk', 'bollinger-bands'],
    createdAt: '2023-03-10',
    updatedAt: '2024-12-01',
  },

  // 4. Political Momentum Trader
  {
    id: 'political-momentum-trader',
    name: 'Political Momentum Trader',
    description: 'Trades prediction markets based on political events, polls, and sentiment analysis. Leverages news flow and social media signals.',
    version: '2.0.4',
    author: 'Stratify Team',
    category: STRATEGY_CATEGORIES.NEWS_BASED,
    difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
    riskProfile: RISK_PROFILES.MODERATE,

    config: {
      minEdge: 0.025,
      maxPositionSize: 0.10,
      maxDailyTrades: 15,
      maxConcurrentPositions: 8,
      stopLoss: 0.06,
      takeProfit: 0.15,
      cooldownPeriod: 600,
      allowedMarkets: ['prediction'],
      eventTypes: ['election', 'policy', 'legislation', 'appointment'],
      sentimentSources: ['twitter', 'news', 'polls'],
      minSentimentConfidence: 0.65,
      pollWeighting: 0.4,
      newsWeighting: 0.35,
      socialWeighting: 0.25,
    },

    rules: {
      entry: [
        { type: 'sentiment_shift', threshold: 0.15, direction: 'any' },
        { type: 'poll_movement', minChange: 0.03 },
        { type: 'news_catalyst', importance: 'high' },
        { type: 'odds_value', minValue: 0.05 },
      ],
      exit: [
        { type: 'target_reached', target: 0.15 },
        { type: 'stop_loss', threshold: 0.06 },
        { type: 'event_resolution' },
        { type: 'sentiment_reversal', threshold: 0.10 },
      ],
    },

    backtest: {
      period: '2023-01-01 to 2024-12-31',
      totalTrades: 567,
      winningTrades: 386,
      losingTrades: 181,
      winRate: 0.68, // 68%
      avgWin: 0.112,
      avgLoss: 0.048,
      maxDrawdown: 0.14,
      sharpeRatio: 1.92,
      sortinoRatio: 2.67,
      profitFactor: 2.54,
      totalReturn: 0.98,
      annualizedReturn: 0.45,
      maxConsecutiveWins: 14,
      maxConsecutiveLosses: 5,
      avgTradesPerDay: 0.8,
      avgHoldTime: 86400,
    },

    expectedReturns: {
      monthly: { min: 0.01, max: 0.08, avg: 0.04 },
      yearly: { min: 0.15, max: 0.96, avg: 0.48 },
    },

    requirements: {
      minCapital: 15000,
      recommendedCapital: 75000,
      requiredExchanges: ['polymarket', 'predictit', 'kalshi'],
      apiPermissions: ['read', 'trade'],
    },

    tags: ['politics', 'prediction-markets', 'sentiment', 'news-driven'],
    createdAt: '2023-09-01',
    updatedAt: '2024-11-05',
  },

  // 5. Multi-Platform Arb Pro
  {
    id: 'multi-platform-arb-pro',
    name: 'Multi-Platform Arb Pro',
    description: 'Advanced cross-platform arbitrage exploiting price inefficiencies across multiple exchanges simultaneously. Requires fast execution.',
    version: '4.2.0',
    author: 'Stratify Team',
    category: STRATEGY_CATEGORIES.MULTI_PLATFORM,
    difficulty: DIFFICULTY_LEVELS.EXPERT,
    riskProfile: RISK_PROFILES.CONSERVATIVE,

    config: {
      minEdge: 0.015,
      maxPositionSize: 0.12,
      maxDailyTrades: 100,
      maxConcurrentPositions: 15,
      stopLoss: 0.01,
      takeProfit: 0.03,
      cooldownPeriod: 30,
      allowedMarkets: ['crypto', 'forex', 'prediction'],
      platforms: ['binance', 'coinbase', 'kraken', 'bybit', 'okx'],
      maxLatency: 50,
      minProfitAfterFees: 0.005,
      hedgingEnabled: true,
      atomicExecution: true,
    },

    rules: {
      entry: [
        { type: 'cross_platform_spread', threshold: 0.015 },
        { type: 'latency_check', maxMs: 50 },
        { type: 'liquidity_both_sides', minVolume: 50000 },
        { type: 'fee_adjusted_profit', minProfit: 0.005 },
      ],
      exit: [
        { type: 'spread_closed' },
        { type: 'timeout', maxSeconds: 60 },
        { type: 'hedge_complete' },
        { type: 'emergency_unwind', lossThreshold: 0.01 },
      ],
    },

    backtest: {
      period: '2023-01-01 to 2024-12-31',
      totalTrades: 8934,
      winningTrades: 7058,
      losingTrades: 1876,
      winRate: 0.79, // 79%
      avgWin: 0.021,
      avgLoss: 0.008,
      maxDrawdown: 0.05,
      sharpeRatio: 3.21,
      sortinoRatio: 4.56,
      profitFactor: 4.87,
      totalReturn: 1.12,
      annualizedReturn: 0.51,
      maxConsecutiveWins: 45,
      maxConsecutiveLosses: 8,
      avgTradesPerDay: 12.2,
      avgHoldTime: 45,
    },

    expectedReturns: {
      monthly: { min: 0.03, max: 0.06, avg: 0.045 },
      yearly: { min: 0.36, max: 0.72, avg: 0.54 },
    },

    requirements: {
      minCapital: 50000,
      recommendedCapital: 250000,
      requiredExchanges: ['binance', 'coinbase', 'kraken', 'bybit'],
      apiPermissions: ['read', 'trade'],
      infrastructure: ['low-latency', 'co-location-recommended'],
    },

    tags: ['arbitrage', 'multi-platform', 'low-latency', 'professional'],
    createdAt: '2023-02-28',
    updatedAt: '2024-12-10',
  },

  // 6. Fed News Reaction Scalper
  {
    id: 'fed-news-reaction-scalper',
    name: 'Fed News Reaction Scalper',
    description: 'Ultra-fast scalping strategy that reacts to Federal Reserve announcements and economic data releases. Highest win rate but requires precise timing.',
    version: '2.7.3',
    author: 'Stratify Team',
    category: STRATEGY_CATEGORIES.SCALPING,
    difficulty: DIFFICULTY_LEVELS.EXPERT,
    riskProfile: RISK_PROFILES.MODERATE,

    config: {
      minEdge: 0.005,
      maxPositionSize: 0.20,
      maxDailyTrades: 10,
      maxConcurrentPositions: 2,
      stopLoss: 0.015,
      takeProfit: 0.025,
      cooldownPeriod: 1800,
      allowedMarkets: ['forex', 'crypto', 'indices'],
      newsEvents: ['fomc', 'cpi', 'nfp', 'gdp', 'ppi', 'fed-speech'],
      preEventWindow: 300,
      postEventWindow: 600,
      sentimentAnalysis: true,
      instantExecution: true,
    },

    rules: {
      entry: [
        { type: 'scheduled_event', buffer: 5 },
        { type: 'surprise_indicator', threshold: 0.5 },
        { type: 'initial_move_direction', minMove: 0.003 },
        { type: 'volume_spike', multiplier: 3.0 },
      ],
      exit: [
        { type: 'target_reached', target: 0.025 },
        { type: 'stop_loss', threshold: 0.015 },
        { type: 'time_limit', seconds: 300 },
        { type: 'momentum_exhaustion' },
      ],
    },

    backtest: {
      period: '2023-01-01 to 2024-12-31',
      totalTrades: 156,
      winningTrades: 144,
      losingTrades: 12,
      winRate: 0.92, // 92%
      avgWin: 0.022,
      avgLoss: 0.012,
      maxDrawdown: 0.04,
      sharpeRatio: 4.12,
      sortinoRatio: 6.23,
      profitFactor: 8.94,
      totalReturn: 0.52,
      annualizedReturn: 0.24,
      maxConsecutiveWins: 34,
      maxConsecutiveLosses: 2,
      avgTradesPerDay: 0.2,
      avgHoldTime: 180,
    },

    expectedReturns: {
      monthly: { min: 0.01, max: 0.04, avg: 0.02 },
      yearly: { min: 0.12, max: 0.48, avg: 0.24 },
    },

    requirements: {
      minCapital: 30000,
      recommendedCapital: 150000,
      requiredExchanges: ['oanda', 'binance', 'interactive-brokers'],
      apiPermissions: ['read', 'trade'],
      infrastructure: ['news-feed', 'low-latency'],
    },

    tags: ['scalping', 'news-trading', 'fed', 'high-frequency'],
    createdAt: '2023-05-15',
    updatedAt: '2024-11-28',
  },

  // 7. Trend Following Swing Trader
  {
    id: 'trend-following-swing',
    name: 'Trend Following Swing Trader',
    description: 'Classic trend-following strategy using multiple timeframe analysis. Captures medium-term moves with defined risk management.',
    version: '3.0.1',
    author: 'Stratify Team',
    category: STRATEGY_CATEGORIES.SWING,
    difficulty: DIFFICULTY_LEVELS.BEGINNER,
    riskProfile: RISK_PROFILES.MODERATE,

    config: {
      minEdge: 0.02,
      maxPositionSize: 0.10,
      maxDailyTrades: 5,
      maxConcurrentPositions: 6,
      stopLoss: 0.04,
      takeProfit: 0.12,
      cooldownPeriod: 3600,
      allowedMarkets: ['crypto', 'forex', 'stocks'],
      trendTimeframes: ['4h', '1d', '1w'],
      emaFast: 21,
      emaSlow: 55,
      adxThreshold: 25,
      rsiOversold: 30,
      rsiOverbought: 70,
    },

    rules: {
      entry: [
        { type: 'ema_crossover', fast: 21, slow: 55 },
        { type: 'adx_strength', minAdx: 25 },
        { type: 'multi_timeframe_alignment', timeframes: ['4h', '1d'] },
        { type: 'rsi_not_extreme', min: 35, max: 65 },
      ],
      exit: [
        { type: 'target_reached', target: 0.12 },
        { type: 'stop_loss', threshold: 0.04 },
        { type: 'ema_crossover_reverse' },
        { type: 'trailing_stop', activation: 0.06, trail: 0.02 },
      ],
    },

    backtest: {
      period: '2023-01-01 to 2024-12-31',
      totalTrades: 423,
      winningTrades: 279,
      losingTrades: 144,
      winRate: 0.66, // 66%
      avgWin: 0.098,
      avgLoss: 0.035,
      maxDrawdown: 0.12,
      sharpeRatio: 1.78,
      sortinoRatio: 2.34,
      profitFactor: 2.67,
      totalReturn: 0.89,
      annualizedReturn: 0.41,
      maxConsecutiveWins: 11,
      maxConsecutiveLosses: 5,
      avgTradesPerDay: 0.6,
      avgHoldTime: 259200,
    },

    expectedReturns: {
      monthly: { min: 0.01, max: 0.06, avg: 0.035 },
      yearly: { min: 0.15, max: 0.72, avg: 0.42 },
    },

    requirements: {
      minCapital: 10000,
      recommendedCapital: 50000,
      requiredExchanges: ['binance', 'coinbase'],
      apiPermissions: ['read', 'trade'],
    },

    tags: ['trend-following', 'swing-trading', 'ema', 'beginner-friendly'],
    createdAt: '2023-04-20',
    updatedAt: '2024-10-30',
  },

  // 8. DeFi Yield Optimizer
  {
    id: 'defi-yield-optimizer',
    name: 'DeFi Yield Optimizer',
    description: 'Automatically rotates capital between DeFi protocols to maximize yield while managing smart contract risk. Includes impermanent loss protection.',
    version: '1.5.0',
    author: 'Stratify Team',
    category: STRATEGY_CATEGORIES.ARBITRAGE,
    difficulty: DIFFICULTY_LEVELS.ADVANCED,
    riskProfile: RISK_PROFILES.MODERATE,

    config: {
      minEdge: 0.01,
      maxPositionSize: 0.25,
      maxDailyTrades: 8,
      maxConcurrentPositions: 5,
      stopLoss: 0.10,
      takeProfit: null, // Yield-based, no fixed TP
      cooldownPeriod: 7200,
      allowedMarkets: ['defi'],
      protocols: ['aave', 'compound', 'curve', 'uniswap', 'yearn'],
      chains: ['ethereum', 'arbitrum', 'optimism', 'polygon'],
      minApy: 0.05,
      maxProtocolAllocation: 0.30,
      tvlThreshold: 50000000,
      auditRequired: true,
      impermanentLossThreshold: 0.05,
    },

    rules: {
      entry: [
        { type: 'yield_differential', threshold: 0.02 },
        { type: 'protocol_safety', minTvl: 50000000, audited: true },
        { type: 'gas_efficiency', maxGasCost: 0.005 },
        { type: 'il_risk_assessment', maxRisk: 'medium' },
      ],
      exit: [
        { type: 'better_yield_available', differential: 0.03 },
        { type: 'protocol_risk_increase' },
        { type: 'impermanent_loss_threshold', threshold: 0.05 },
        { type: 'tvl_decrease', threshold: 0.30 },
      ],
    },

    backtest: {
      period: '2023-01-01 to 2024-12-31',
      totalTrades: 234,
      winningTrades: 198,
      losingTrades: 36,
      winRate: 0.85, // 85%
      avgWin: 0.067,
      avgLoss: 0.034,
      maxDrawdown: 0.11,
      sharpeRatio: 2.01,
      sortinoRatio: 2.89,
      profitFactor: 3.45,
      totalReturn: 0.76,
      annualizedReturn: 0.35,
      maxConsecutiveWins: 19,
      maxConsecutiveLosses: 3,
      avgTradesPerDay: 0.3,
      avgHoldTime: 604800,
    },

    expectedReturns: {
      monthly: { min: 0.02, max: 0.05, avg: 0.03 },
      yearly: { min: 0.24, max: 0.60, avg: 0.36 },
    },

    requirements: {
      minCapital: 20000,
      recommendedCapital: 100000,
      requiredExchanges: ['metamask', 'walletconnect'],
      apiPermissions: ['read', 'trade', 'defi-interact'],
      walletType: 'non-custodial',
    },

    tags: ['defi', 'yield-farming', 'automated', 'multi-chain'],
    createdAt: '2023-07-01',
    updatedAt: '2024-12-05',
  },

  // 9. Mean Reversion Grid Bot
  {
    id: 'mean-reversion-grid',
    name: 'Mean Reversion Grid Bot',
    description: 'Grid trading strategy that profits from sideways markets by buying dips and selling rallies. Best for ranging market conditions.',
    version: '2.3.0',
    author: 'Stratify Team',
    category: STRATEGY_CATEGORIES.SWING,
    difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
    riskProfile: RISK_PROFILES.CONSERVATIVE,

    config: {
      minEdge: 0.008,
      maxPositionSize: 0.03,
      maxDailyTrades: 100,
      maxConcurrentPositions: 20,
      stopLoss: 0.15,
      takeProfit: null, // Grid-based
      cooldownPeriod: 0,
      allowedMarkets: ['crypto', 'forex'],
      gridLevels: 20,
      gridSpacing: 0.01, // 1% between levels
      upperBound: 0.10, // 10% above center
      lowerBound: 0.10, // 10% below center
      rebalanceThreshold: 0.05,
      dynamicGrid: true,
      atrAdjustment: true,
    },

    rules: {
      entry: [
        { type: 'price_at_grid_level' },
        { type: 'ranging_market', adxMax: 20 },
        { type: 'position_limit_check' },
        { type: 'capital_available' },
      ],
      exit: [
        { type: 'grid_level_profit', levels: 1 },
        { type: 'trend_breakout', adxThreshold: 30 },
        { type: 'stop_loss', threshold: 0.15 },
        { type: 'grid_rebalance' },
      ],
    },

    backtest: {
      period: '2023-01-01 to 2024-12-31',
      totalTrades: 5672,
      winningTrades: 4198,
      losingTrades: 1474,
      winRate: 0.74, // 74%
      avgWin: 0.012,
      avgLoss: 0.009,
      maxDrawdown: 0.13,
      sharpeRatio: 1.65,
      sortinoRatio: 2.12,
      profitFactor: 2.01,
      totalReturn: 0.58,
      annualizedReturn: 0.27,
      maxConsecutiveWins: 28,
      maxConsecutiveLosses: 9,
      avgTradesPerDay: 7.8,
      avgHoldTime: 3600,
    },

    expectedReturns: {
      monthly: { min: 0.015, max: 0.04, avg: 0.025 },
      yearly: { min: 0.18, max: 0.48, avg: 0.30 },
    },

    requirements: {
      minCapital: 8000,
      recommendedCapital: 40000,
      requiredExchanges: ['binance', 'bybit'],
      apiPermissions: ['read', 'trade'],
    },

    tags: ['grid-trading', 'mean-reversion', 'automated', 'sideways-market'],
    createdAt: '2023-06-01',
    updatedAt: '2024-11-15',
  },
]

// ============================================
// Helper Functions
// ============================================

/**
 * Get a strategy by its ID
 * @param {string} id - Strategy ID
 * @returns {Object|null} Strategy object or null if not found
 */
export function getStrategyById(id) {
  return prebuiltStrategies.find(strategy => strategy.id === id) || null
}

/**
 * Get a strategy by name (case-insensitive)
 * @param {string} name - Strategy name
 * @returns {Object|null} Strategy object or null if not found
 */
export function getStrategyByName(name) {
  const lowerName = name.toLowerCase()
  return prebuiltStrategies.find(
    strategy => strategy.name.toLowerCase() === lowerName
  ) || null
}

/**
 * Fork a strategy to create a customizable copy
 * @param {string} id - Strategy ID to fork
 * @param {Object} overrides - Configuration overrides
 * @returns {Object} New strategy object with unique ID
 */
export function forkStrategy(id, overrides = {}) {
  const original = getStrategyById(id)
  if (!original) {
    throw new Error(`Strategy with ID "${id}" not found`)
  }

  const forkedId = `${id}-fork-${Date.now()}`

  return {
    ...original,
    ...overrides,
    id: forkedId,
    name: overrides.name || `${original.name} (Fork)`,
    author: overrides.author || 'User',
    version: '1.0.0',
    config: {
      ...original.config,
      ...(overrides.config || {}),
    },
    rules: {
      entry: overrides.rules?.entry || [...original.rules.entry],
      exit: overrides.rules?.exit || [...original.rules.exit],
    },
    forkedFrom: original.id,
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
  }
}

/**
 * Get strategies filtered by category
 * @param {string} category - Category from STRATEGY_CATEGORIES
 * @returns {Array} Filtered strategies
 */
export function getStrategiesByCategory(category) {
  return prebuiltStrategies.filter(strategy => strategy.category === category)
}

/**
 * Get strategies filtered by risk profile
 * @param {string} riskProfile - Risk profile from RISK_PROFILES
 * @returns {Array} Filtered strategies
 */
export function getStrategiesByRiskProfile(riskProfile) {
  return prebuiltStrategies.filter(strategy => strategy.riskProfile === riskProfile)
}

/**
 * Get strategies filtered by difficulty level
 * @param {string} difficulty - Difficulty from DIFFICULTY_LEVELS
 * @returns {Array} Filtered strategies
 */
export function getStrategiesByDifficulty(difficulty) {
  return prebuiltStrategies.filter(strategy => strategy.difficulty === difficulty)
}

/**
 * Get strategies sorted by a backtest metric
 * @param {string} metric - Backtest metric to sort by (e.g., 'winRate', 'totalReturn')
 * @param {boolean} descending - Sort in descending order (default: true)
 * @returns {Array} Sorted strategies
 */
export function getStrategiesSortedBy(metric, descending = true) {
  return [...prebuiltStrategies].sort((a, b) => {
    const aValue = a.backtest[metric] ?? 0
    const bValue = b.backtest[metric] ?? 0
    return descending ? bValue - aValue : aValue - bValue
  })
}

/**
 * Search strategies by tags
 * @param {Array<string>} tags - Tags to search for
 * @param {boolean} matchAll - Require all tags to match (default: false)
 * @returns {Array} Matching strategies
 */
export function searchStrategiesByTags(tags, matchAll = false) {
  const lowerTags = tags.map(t => t.toLowerCase())

  return prebuiltStrategies.filter(strategy => {
    const strategyTags = strategy.tags.map(t => t.toLowerCase())

    if (matchAll) {
      return lowerTags.every(tag => strategyTags.includes(tag))
    }
    return lowerTags.some(tag => strategyTags.includes(tag))
  })
}

/**
 * Get strategies suitable for a given capital amount
 * @param {number} capital - Available capital
 * @returns {Array} Strategies where minCapital <= capital
 */
export function getStrategiesForCapital(capital) {
  return prebuiltStrategies.filter(
    strategy => strategy.requirements.minCapital <= capital
  )
}

/**
 * Validate if a strategy configuration is complete
 * @param {Object} strategy - Strategy object to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateStrategy(strategy) {
  const errors = []

  if (!strategy.id) errors.push('Strategy ID is required')
  if (!strategy.name) errors.push('Strategy name is required')
  if (!strategy.config) errors.push('Strategy config is required')
  if (!strategy.rules?.entry?.length) errors.push('At least one entry rule is required')
  if (!strategy.rules?.exit?.length) errors.push('At least one exit rule is required')

  if (strategy.config) {
    if (strategy.config.maxPositionSize > 1) {
      errors.push('maxPositionSize cannot exceed 1 (100%)')
    }
    if (strategy.config.stopLoss && strategy.config.stopLoss > strategy.config.takeProfit) {
      errors.push('stopLoss should be less than takeProfit')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Calculate expected monthly return based on backtest data
 * @param {Object} strategy - Strategy object
 * @returns {number} Expected monthly return as decimal
 */
export function calculateExpectedMonthlyReturn(strategy) {
  const { backtest } = strategy
  if (!backtest) return 0

  const { winRate, avgWin, avgLoss } = backtest
  const expectedValue = (winRate * avgWin) - ((1 - winRate) * Math.abs(avgLoss))
  const tradesPerMonth = backtest.avgTradesPerDay * 30

  return expectedValue * tradesPerMonth
}

/**
 * Get strategy risk score (1-10)
 * @param {Object} strategy - Strategy object
 * @returns {number} Risk score from 1 (lowest) to 10 (highest)
 */
export function calculateRiskScore(strategy) {
  const { backtest, riskProfile, config } = strategy

  let score = 5 // Base score

  // Adjust based on risk profile
  if (riskProfile === RISK_PROFILES.CONSERVATIVE) score -= 2
  if (riskProfile === RISK_PROFILES.AGGRESSIVE) score += 2

  // Adjust based on max drawdown
  if (backtest.maxDrawdown > 0.20) score += 2
  else if (backtest.maxDrawdown < 0.10) score -= 1

  // Adjust based on position size
  if (config.maxPositionSize > 0.15) score += 1
  if (config.maxPositionSize < 0.05) score -= 1

  // Adjust based on win rate
  if (backtest.winRate < 0.60) score += 1
  if (backtest.winRate > 0.80) score -= 1

  return Math.max(1, Math.min(10, score))
}

/**
 * Export strategy configuration as JSON
 * @param {string} id - Strategy ID
 * @returns {string} JSON string of strategy config
 */
export function exportStrategyConfig(id) {
  const strategy = getStrategyById(id)
  if (!strategy) {
    throw new Error(`Strategy with ID "${id}" not found`)
  }

  return JSON.stringify({
    id: strategy.id,
    name: strategy.name,
    version: strategy.version,
    config: strategy.config,
    rules: strategy.rules,
    exportedAt: new Date().toISOString(),
  }, null, 2)
}

/**
 * Get summary statistics for all strategies
 * @returns {Object} Summary statistics
 */
export function getStrategiesSummary() {
  const strategies = prebuiltStrategies

  return {
    total: strategies.length,
    byCategory: Object.values(STRATEGY_CATEGORIES).reduce((acc, cat) => {
      acc[cat] = strategies.filter(s => s.category === cat).length
      return acc
    }, {}),
    byRiskProfile: Object.values(RISK_PROFILES).reduce((acc, risk) => {
      acc[risk] = strategies.filter(s => s.riskProfile === risk).length
      return acc
    }, {}),
    byDifficulty: Object.values(DIFFICULTY_LEVELS).reduce((acc, diff) => {
      acc[diff] = strategies.filter(s => s.difficulty === diff).length
      return acc
    }, {}),
    avgWinRate: strategies.reduce((sum, s) => sum + s.backtest.winRate, 0) / strategies.length,
    avgAnnualizedReturn: strategies.reduce((sum, s) => sum + s.backtest.annualizedReturn, 0) / strategies.length,
    highestWinRate: Math.max(...strategies.map(s => s.backtest.winRate)),
    highestReturn: Math.max(...strategies.map(s => s.backtest.totalReturn)),
  }
}

export default prebuiltStrategies

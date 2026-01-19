-- ============================================
-- TO THE MOON - Database Schema
-- PostgreSQL Database
-- ============================================

-- Drop existing tables (for clean setup)
DROP TABLE IF EXISTS strategy_follows CASCADE;
DROP TABLE IF EXISTS leaderboard_snapshot CASCADE;
DROP TABLE IF EXISTS trades CASCADE;
DROP TABLE IF EXISTS strategies CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- ============================================
-- 2. SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    tier VARCHAR(20) NOT NULL DEFAULT 'free',  -- 'free' or 'pro'
    stripe_subscription_id VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_tier ON subscriptions(tier);

-- ============================================
-- 3. STRATEGIES TABLE
-- ============================================
CREATE TABLE strategies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'custom',  -- crypto, sports, politics, etc.
    config JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    is_template BOOLEAN DEFAULT FALSE,
    win_rate DECIMAL(5, 2) DEFAULT 0,
    total_profit DECIMAL(15, 2) DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_strategies_user_id ON strategies(user_id);
CREATE INDEX idx_strategies_category ON strategies(category);
CREATE INDEX idx_strategies_is_public ON strategies(is_public);
CREATE INDEX idx_strategies_is_template ON strategies(is_template);

-- ============================================
-- 4. TRADES TABLE
-- ============================================
CREATE TABLE trades (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    strategy_id INTEGER REFERENCES strategies(id) ON DELETE SET NULL,
    market VARCHAR(50) NOT NULL,  -- BTC/USD, ETH/USD, Will Trump Win, etc.
    side VARCHAR(10) NOT NULL,    -- 'long' or 'short' (or 'yes'/'no' for predictions)
    size DECIMAL(20, 8) NOT NULL,
    entry_price DECIMAL(20, 8) NOT NULL,
    exit_price DECIMAL(20, 8),
    profit DECIMAL(15, 2),
    status VARCHAR(20) DEFAULT 'open',  -- 'open', 'closed', 'cancelled'
    is_paper BOOLEAN DEFAULT TRUE,
    platform VARCHAR(50),  -- kalshi, polymarket, binance, etc.
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_strategy_id ON trades(strategy_id);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_is_paper ON trades(is_paper);
CREATE INDEX idx_trades_opened_at ON trades(opened_at DESC);

-- ============================================
-- 5. LEADERBOARD_SNAPSHOT TABLE
-- ============================================
CREATE TABLE leaderboard_snapshot (
    id SERIAL PRIMARY KEY,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    period VARCHAR(20) NOT NULL DEFAULT 'monthly',  -- 'daily', 'weekly', 'monthly', 'alltime'
    rankings JSONB NOT NULL,  -- Array of {user_id, username, rank, pnl, win_rate, trades, followers}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leaderboard_snapshot_date ON leaderboard_snapshot(snapshot_date);
CREATE INDEX idx_leaderboard_snapshot_period ON leaderboard_snapshot(period);
CREATE UNIQUE INDEX idx_leaderboard_snapshot_date_period ON leaderboard_snapshot(snapshot_date, period);

-- ============================================
-- 6. STRATEGY_FOLLOWS TABLE
-- ============================================
CREATE TABLE strategy_follows (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    strategy_id INTEGER NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, strategy_id)
);

CREATE INDEX idx_strategy_follows_user_id ON strategy_follows(user_id);
CREATE INDEX idx_strategy_follows_strategy_id ON strategy_follows(strategy_id);

-- ============================================
-- AUTO-UPDATE TIMESTAMPS TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_strategies_updated_at
    BEFORE UPDATE ON strategies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SEED DATA: 9 Pre-built Strategy Templates
-- ============================================
INSERT INTO strategies (user_id, name, description, category, config, is_public, is_template, win_rate) VALUES
(NULL, 'Conservative Arb Bot', 'Low-risk arbitrage with 87% win rate. Minimum 3% edge requirement.', 'arbitrage',
 '{"risk_level": "low", "min_edge": 0.03, "max_position": 0.05, "difficulty": "beginner"}', TRUE, TRUE, 87.0),

(NULL, 'Sports High Volume', 'High-frequency sports betting. 74% win rate, targets volume over edge.', 'sports',
 '{"risk_level": "medium", "min_edge": 0.01, "max_position": 0.02, "difficulty": "intermediate"}', TRUE, TRUE, 74.0),

(NULL, 'Crypto Volatility Play', 'Aggressive crypto strategy. 61% win rate but high returns on wins.', 'crypto',
 '{"risk_level": "high", "min_edge": 0.05, "max_position": 0.10, "difficulty": "advanced"}', TRUE, TRUE, 61.0),

(NULL, 'Political Momentum', 'Event-driven political predictions. 68% win rate on momentum shifts.', 'politics',
 '{"risk_level": "medium", "min_edge": 0.04, "max_position": 0.05, "difficulty": "intermediate"}', TRUE, TRUE, 68.0),

(NULL, 'Multi-Platform Arb Pro', 'Cross-platform arbitrage. 79% win rate exploiting price discrepancies.', 'arbitrage',
 '{"risk_level": "medium", "min_edge": 0.02, "platforms": ["kalshi", "polymarket"], "difficulty": "advanced"}', TRUE, TRUE, 79.0),

(NULL, 'Fed News Scalper', 'High-precision Fed announcement scalping. 92% win rate, expert level.', 'macro',
 '{"risk_level": "high", "news_sources": ["fed"], "reaction_time": "fast", "difficulty": "expert"}', TRUE, TRUE, 92.0),

(NULL, 'Weather Derivatives', 'Weather-based prediction markets. 71% win rate, low risk.', 'weather',
 '{"risk_level": "low", "data_sources": ["noaa"], "difficulty": "beginner"}', TRUE, TRUE, 71.0),

(NULL, 'Earnings Momentum', 'Trade earnings surprises. 65% win rate on momentum plays.', 'earnings',
 '{"risk_level": "medium", "lookback_quarters": 4, "difficulty": "intermediate"}', TRUE, TRUE, 65.0),

(NULL, 'Market Maker Lite', 'Simple market-making for prediction markets. 83% win rate.', 'market-making',
 '{"risk_level": "low", "spread": 0.02, "inventory_limit": 0.1, "difficulty": "advanced"}', TRUE, TRUE, 83.0);

-- ============================================
-- SEED DATA: Sample Leaderboard
-- ============================================
INSERT INTO leaderboard_snapshot (snapshot_date, period, rankings) VALUES
(CURRENT_DATE, 'monthly', '[
  {"rank": 1, "user_id": null, "username": "CryptoKing", "pnl": 24560.78, "return_pct": 245.6, "win_rate": 78, "trades": 432, "followers": 1234},
  {"rank": 2, "user_id": null, "username": "AlgoMaster", "pnl": 19830.50, "return_pct": 198.3, "win_rate": 72, "trades": 651, "followers": 987},
  {"rank": 3, "user_id": null, "username": "MoonShot", "pnl": 15670.25, "return_pct": 156.7, "win_rate": 69, "trades": 289, "followers": 756},
  {"rank": 4, "user_id": null, "username": "TradingBot99", "pnl": 13420.00, "return_pct": 134.2, "win_rate": 65, "trades": 1203, "followers": 543},
  {"rank": 5, "user_id": null, "username": "WhaleTrades", "pnl": 12890.33, "return_pct": 128.9, "win_rate": 71, "trades": 178, "followers": 421},
  {"rank": 6, "user_id": null, "username": "DiamondHands", "pnl": 11240.00, "return_pct": 112.4, "win_rate": 63, "trades": 567, "followers": 387},
  {"rank": 7, "user_id": null, "username": "BullRunner", "pnl": 9870.50, "return_pct": 98.7, "win_rate": 67, "trades": 345, "followers": 298},
  {"rank": 8, "user_id": null, "username": "SmartMoney", "pnl": 8730.25, "return_pct": 87.3, "win_rate": 70, "trades": 234, "followers": 234}
]');

-- ============================================
-- HELPFUL VIEWS
-- ============================================

-- View: User stats summary
CREATE OR REPLACE VIEW v_user_stats AS
SELECT
    u.id,
    u.username,
    u.email,
    s.tier,
    s.is_active AS subscription_active,
    COUNT(t.id) AS total_trades,
    COUNT(CASE WHEN t.profit > 0 THEN 1 END) AS winning_trades,
    COALESCE(SUM(t.profit), 0) AS total_profit,
    CASE WHEN COUNT(t.id) > 0
         THEN ROUND(COUNT(CASE WHEN t.profit > 0 THEN 1 END)::DECIMAL / COUNT(t.id) * 100, 2)
         ELSE 0 END AS win_rate
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
LEFT JOIN trades t ON u.id = t.user_id AND t.status = 'closed'
GROUP BY u.id, u.username, u.email, s.tier, s.is_active;

-- View: Strategy leaderboard
CREATE OR REPLACE VIEW v_strategy_leaderboard AS
SELECT
    s.id,
    s.name,
    s.category,
    u.username AS author,
    s.win_rate,
    s.total_profit,
    s.total_trades,
    s.followers_count,
    s.is_public,
    s.created_at
FROM strategies s
LEFT JOIN users u ON s.user_id = u.id
WHERE s.is_template = FALSE AND s.is_public = TRUE
ORDER BY s.total_profit DESC;

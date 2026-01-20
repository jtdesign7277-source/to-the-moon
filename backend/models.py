"""
TO THE MOON - SQLAlchemy Models
Database ORM models matching the PostgreSQL schema.
"""
import uuid
from datetime import datetime, timedelta

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def generate_uuid():
    """Generate a unique ID."""
    return uuid.uuid4().hex[:12]


# ============================================
# 1. USER MODEL
# ============================================
class User(db.Model):
    """User account model."""
    __tablename__ = 'users'

    id = db.Column(db.String(50), primary_key=True, default=lambda: f'user_{generate_uuid()}')
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    tier = db.Column(db.String(20), default='free')  # 'free' or 'pro'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    subscription = db.relationship('Subscription', backref='user', uselist=False, lazy=True, cascade='all, delete-orphan')
    stats = db.relationship('UserStats', backref='user', uselist=False, lazy=True, cascade='all, delete-orphan')
    strategies = db.relationship('Strategy', backref='user', lazy='dynamic')
    trades = db.relationship('Trade', backref='user', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        """Serialize user to dictionary."""
        return {
            'id': self.id,
            'email': self.email,
            'username': self.username,
            'tier': self.tier,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def sanitize(self):
        """Return user data safe for API response (no sensitive data)."""
        return {
            'id': self.id,
            'email': self.email,
            'username': self.username,
            'tier': self.tier,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f'<User {self.username}>'


# ============================================
# 2. SUBSCRIPTION MODEL
# ============================================
class Subscription(db.Model):
    """User subscription model (free/pro tier)."""
    __tablename__ = 'subscriptions'

    id = db.Column(db.String(50), primary_key=True, default=lambda: f'sub_{generate_uuid()}')
    user_id = db.Column(db.String(50), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True)
    status = db.Column(db.String(20), default='active')  # active, cancelled, expired
    billing_cycle = db.Column(db.String(20), default='monthly')  # monthly, yearly
    price = db.Column(db.Float, default=9.99)
    stripe_subscription_id = db.Column(db.String(255), unique=True, nullable=True)
    expires_at = db.Column(db.DateTime, nullable=True)
    renews_at = db.Column(db.DateTime, nullable=True)
    cancelled_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def is_active(self):
        """Check if subscription is currently active."""
        if self.status != 'active':
            return False
        if self.expires_at and self.expires_at < datetime.utcnow():
            return False
        return True

    def to_dict(self):
        """Serialize subscription to dictionary."""
        return {
            'id': self.id,
            'status': self.status,
            'billing_cycle': self.billing_cycle,
            'price': self.price,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'renews_at': self.renews_at.isoformat() if self.renews_at else None,
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
        }

    def __repr__(self):
        return f'<Subscription user_id={self.user_id} status={self.status}>'


# ============================================
# 3. USER STATS MODEL
# ============================================
class UserStats(db.Model):
    """User statistics/dashboard data model."""
    __tablename__ = 'user_stats'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(50), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True)
    total_pnl = db.Column(db.Float, default=0)
    win_rate = db.Column(db.Float, default=0)
    active_strategies = db.Column(db.Integer, default=0)
    total_trades = db.Column(db.Integer, default=0)
    connected_accounts = db.Column(db.Integer, default=0)
    total_balance = db.Column(db.Float, default=0)
    monthly_change = db.Column(db.Float, default=0)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        """Serialize stats to dictionary (camelCase for frontend)."""
        return {
            'totalPnl': self.total_pnl or 0,
            'winRate': self.win_rate or 0,
            'activeStrategies': self.active_strategies or 0,
            'totalTrades': self.total_trades or 0,
            'connectedAccounts': self.connected_accounts or 0,
            'totalBalance': self.total_balance or 0,
            'monthlyChange': self.monthly_change or 0,
        }

    def __repr__(self):
        return f'<UserStats user_id={self.user_id}>'


# ============================================
# 4. TRADE MODEL
# ============================================
class Trade(db.Model):
    """Trade record model."""
    __tablename__ = 'trades'

    id = db.Column(db.String(50), primary_key=True, default=lambda: f'trade_{generate_uuid()}')
    user_id = db.Column(db.String(50), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    strategy_id = db.Column(db.String(50), db.ForeignKey('strategies.id', ondelete='SET NULL'), nullable=True)

    # Trade details (stored as strings for frontend compatibility)
    pair = db.Column(db.String(50), default='Unknown')
    trade_type = db.Column(db.String(20), default='Long')  # Long, Short
    entry = db.Column(db.String(50), default='$0.00')
    exit = db.Column(db.String(50), default='$0.00')
    pnl = db.Column(db.String(50), default='+$0')
    status = db.Column(db.String(20), default='Won')  # Won, Lost, Open
    
    # Paper vs Live trading
    is_paper = db.Column(db.Boolean, default=True)  # True = paper trade, False = live trade
    platform = db.Column(db.String(50), nullable=True)  # Kalshi, Polymarket, Manifold
    amount = db.Column(db.Float, nullable=True)  # Trade amount in dollars

    # Timestamps
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        """Serialize trade to dictionary."""
        return {
            'id': self.id,
            'pair': self.pair,
            'type': self.trade_type,
            'entry': self.entry,
            'exit': self.exit,
            'pnl': self.pnl,
            'status': self.status,
            'is_paper': self.is_paper if self.is_paper is not None else True,
            'platform': self.platform,
            'amount': self.amount,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
        }

    def __repr__(self):
        return f'<Trade {self.id} {self.pair}>'


# ============================================
# 5. STRATEGY MODEL
# ============================================
class Strategy(db.Model):
    """Trading strategy model."""
    __tablename__ = 'strategies'

    id = db.Column(db.String(50), primary_key=True, default=lambda: f'strat_{generate_uuid()}')
    user_id = db.Column(db.String(50), db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, default='')
    category = db.Column(db.String(50), default='custom')
    risk_profile = db.Column(db.String(20), default='moderate')
    difficulty = db.Column(db.String(20), default='intermediate')
    is_public = db.Column(db.Boolean, default=False)
    config = db.Column(db.JSON, default=dict)
    rules = db.Column(db.JSON, default=dict)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    trades = db.relationship('Trade', backref='strategy', lazy='dynamic')

    def to_dict(self):
        """Serialize strategy to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'risk_profile': self.risk_profile,
            'difficulty': self.difficulty,
            'is_public': self.is_public,
            'config': self.config or {},
            'rules': self.rules or {},
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f'<Strategy {self.name}>'


# ============================================
# 6. WAITLIST MODEL
# ============================================
class WaitlistEntry(db.Model):
    """Beta waitlist entry model."""
    __tablename__ = 'waitlist'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    source = db.Column(db.String(50), default='landing')  # landing, signup
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        """Serialize waitlist entry to dictionary."""
        return {
            'email': self.email,
            'source': self.source,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None,
        }

    def __repr__(self):
        return f'<WaitlistEntry {self.email}>'


# ============================================
# 7. BACKTEST RESULT MODEL
# ============================================
class BacktestResult(db.Model):
    """Backtest result storage model."""
    __tablename__ = 'backtest_results'

    id = db.Column(db.String(50), primary_key=True, default=lambda: f'bt_{generate_uuid()}')
    user_id = db.Column(db.String(50), db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    strategy_id = db.Column(db.String(50), nullable=True)
    status = db.Column(db.String(20), default='completed')
    parameters = db.Column(db.JSON, default=dict)
    results = db.Column(db.JSON, default=dict)
    equity_curve = db.Column(db.JSON, default=list)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        """Serialize backtest result to dictionary."""
        return {
            'backtest_id': self.id,
            'strategy_id': self.strategy_id,
            'status': self.status,
            'parameters': self.parameters or {},
            'results': self.results or {},
            'equity_curve': self.equity_curve or [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
        }

    def __repr__(self):
        return f'<BacktestResult {self.id}>'


# ============================================
# 8. PAPER PORTFOLIO MODEL
# ============================================
class PaperPortfolio(db.Model):
    """Paper trading portfolio - tracks virtual balance and P&L."""
    __tablename__ = 'paper_portfolios'

    id = db.Column(db.String(50), primary_key=True, default=lambda: f'pp_{generate_uuid()}')
    user_id = db.Column(db.String(50), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    
    # Balance tracking
    starting_balance = db.Column(db.Float, default=100000.0)  # $100,000 starting
    current_balance = db.Column(db.Float, default=100000.0)
    available_balance = db.Column(db.Float, default=100000.0)  # Balance not in open positions
    
    # Performance metrics
    total_pnl = db.Column(db.Float, default=0.0)
    total_pnl_percent = db.Column(db.Float, default=0.0)
    realized_pnl = db.Column(db.Float, default=0.0)
    unrealized_pnl = db.Column(db.Float, default=0.0)
    
    # Trade stats
    total_trades = db.Column(db.Integer, default=0)
    winning_trades = db.Column(db.Integer, default=0)
    losing_trades = db.Column(db.Integer, default=0)
    win_rate = db.Column(db.Float, default=0.0)
    
    # Monthly tracking
    month_start_balance = db.Column(db.Float, default=100000.0)
    monthly_pnl = db.Column(db.Float, default=0.0)
    monthly_pnl_percent = db.Column(db.Float, default=0.0)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_trade_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    trades = db.relationship('PaperTrade', backref='portfolio', lazy='dynamic', cascade='all, delete-orphan')
    positions = db.relationship('PaperPosition', backref='portfolio', lazy='dynamic', cascade='all, delete-orphan')

    def update_stats(self):
        """Recalculate portfolio statistics."""
        if self.total_trades > 0:
            self.win_rate = (self.winning_trades / self.total_trades) * 100
        else:
            self.win_rate = 0.0
        
        self.total_pnl = self.current_balance - self.starting_balance
        if self.starting_balance > 0:
            self.total_pnl_percent = (self.total_pnl / self.starting_balance) * 100
        
        self.monthly_pnl = self.current_balance - self.month_start_balance
        if self.month_start_balance > 0:
            self.monthly_pnl_percent = (self.monthly_pnl / self.month_start_balance) * 100

    def to_dict(self):
        """Serialize portfolio to dictionary."""
        return {
            'id': self.id,
            'userId': self.user_id,
            'startingBalance': self.starting_balance,
            'currentBalance': self.current_balance,
            'availableBalance': self.available_balance,
            'totalPnl': self.total_pnl,
            'totalPnlPercent': self.total_pnl_percent,
            'realizedPnl': self.realized_pnl,
            'unrealizedPnl': self.unrealized_pnl,
            'totalTrades': self.total_trades,
            'winningTrades': self.winning_trades,
            'losingTrades': self.losing_trades,
            'winRate': self.win_rate,
            'monthlyPnl': self.monthly_pnl,
            'monthlyPnlPercent': self.monthly_pnl_percent,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
            'lastTradeAt': self.last_trade_at.isoformat() if self.last_trade_at else None,
        }

    def __repr__(self):
        return f'<PaperPortfolio user_id={self.user_id} balance=${self.current_balance:.2f}>'


# ============================================
# 9. PAPER TRADE MODEL
# ============================================
class PaperTrade(db.Model):
    """Individual paper trade record."""
    __tablename__ = 'paper_trades'

    id = db.Column(db.String(50), primary_key=True, default=lambda: f'pt_{generate_uuid()}')
    portfolio_id = db.Column(db.String(50), db.ForeignKey('paper_portfolios.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = db.Column(db.String(50), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    strategy_id = db.Column(db.String(50), nullable=True)
    
    # Market info
    platform = db.Column(db.String(50), default='kalshi')  # kalshi, polymarket, manifold
    market_id = db.Column(db.String(100), nullable=False)
    market_title = db.Column(db.String(500), nullable=False)
    
    # Trade details
    side = db.Column(db.String(10), nullable=False)  # 'yes' or 'no'
    action = db.Column(db.String(10), nullable=False)  # 'buy' or 'sell'
    quantity = db.Column(db.Integer, nullable=False)  # Number of contracts
    entry_price = db.Column(db.Float, nullable=False)  # Price per contract (0.01 to 0.99)
    exit_price = db.Column(db.Float, nullable=True)  # Price when closed
    
    # Cost basis
    cost_basis = db.Column(db.Float, nullable=False)  # Total cost of position
    current_value = db.Column(db.Float, nullable=True)  # Current market value
    
    # P&L
    pnl = db.Column(db.Float, default=0.0)
    pnl_percent = db.Column(db.Float, default=0.0)
    
    # Status
    status = db.Column(db.String(20), default='open')  # open, closed, expired
    result = db.Column(db.String(20), nullable=True)  # win, loss, breakeven
    
    # Timestamps
    opened_at = db.Column(db.DateTime, default=datetime.utcnow)
    closed_at = db.Column(db.DateTime, nullable=True)

    def close_trade(self, exit_price: float):
        """Close the trade and calculate P&L."""
        self.exit_price = exit_price
        self.current_value = self.quantity * exit_price
        self.pnl = self.current_value - self.cost_basis
        if self.cost_basis > 0:
            self.pnl_percent = (self.pnl / self.cost_basis) * 100
        self.status = 'closed'
        self.closed_at = datetime.utcnow()
        
        if self.pnl > 0:
            self.result = 'win'
        elif self.pnl < 0:
            self.result = 'loss'
        else:
            self.result = 'breakeven'

    def to_dict(self):
        """Serialize trade to dictionary."""
        return {
            'id': self.id,
            'portfolioId': self.portfolio_id,
            'strategyId': self.strategy_id,
            'platform': self.platform,
            'marketId': self.market_id,
            'marketTitle': self.market_title,
            'side': self.side,
            'action': self.action,
            'quantity': self.quantity,
            'entryPrice': self.entry_price,
            'exitPrice': self.exit_price,
            'costBasis': self.cost_basis,
            'currentValue': self.current_value,
            'pnl': self.pnl,
            'pnlPercent': self.pnl_percent,
            'status': self.status,
            'result': self.result,
            'openedAt': self.opened_at.isoformat() if self.opened_at else None,
            'closedAt': self.closed_at.isoformat() if self.closed_at else None,
        }

    def __repr__(self):
        return f'<PaperTrade {self.id} {self.market_title[:30]}>'


# ============================================
# 10. PAPER POSITION MODEL
# ============================================
class PaperPosition(db.Model):
    """Current open position in paper trading."""
    __tablename__ = 'paper_positions'

    id = db.Column(db.String(50), primary_key=True, default=lambda: f'pos_{generate_uuid()}')
    portfolio_id = db.Column(db.String(50), db.ForeignKey('paper_portfolios.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = db.Column(db.String(50), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Market info
    platform = db.Column(db.String(50), default='kalshi')
    market_id = db.Column(db.String(100), nullable=False)
    market_title = db.Column(db.String(500), nullable=False)
    
    # Position details
    side = db.Column(db.String(10), nullable=False)  # 'yes' or 'no'
    quantity = db.Column(db.Integer, nullable=False)
    avg_entry_price = db.Column(db.Float, nullable=False)
    current_price = db.Column(db.Float, nullable=True)
    
    # Value
    cost_basis = db.Column(db.Float, nullable=False)
    current_value = db.Column(db.Float, nullable=True)
    unrealized_pnl = db.Column(db.Float, default=0.0)
    unrealized_pnl_percent = db.Column(db.Float, default=0.0)
    
    # Timestamps
    opened_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def update_price(self, new_price: float):
        """Update position with new market price."""
        self.current_price = new_price
        self.current_value = self.quantity * new_price
        self.unrealized_pnl = self.current_value - self.cost_basis
        if self.cost_basis > 0:
            self.unrealized_pnl_percent = (self.unrealized_pnl / self.cost_basis) * 100

    def to_dict(self):
        """Serialize position to dictionary."""
        return {
            'id': self.id,
            'platform': self.platform,
            'marketId': self.market_id,
            'marketTitle': self.market_title,
            'side': self.side,
            'quantity': self.quantity,
            'avgEntryPrice': self.avg_entry_price,
            'currentPrice': self.current_price,
            'costBasis': self.cost_basis,
            'currentValue': self.current_value,
            'unrealizedPnl': self.unrealized_pnl,
            'unrealizedPnlPercent': self.unrealized_pnl_percent,
            'openedAt': self.opened_at.isoformat() if self.opened_at else None,
        }

    def __repr__(self):
        return f'<PaperPosition {self.market_title[:30]} qty={self.quantity}>'


# ============================================
# 11. DEPLOYED STRATEGY MODEL
# ============================================
class DeployedStrategy(db.Model):
    """A strategy that has been deployed for paper or live trading."""
    __tablename__ = 'deployed_strategies'

    id = db.Column(db.String(50), primary_key=True, default=lambda: f'dep_{generate_uuid()}')
    user_id = db.Column(db.String(50), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    portfolio_id = db.Column(db.String(50), db.ForeignKey('paper_portfolios.id', ondelete='SET NULL'), nullable=True)
    
    # Strategy info
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, default='')
    icon = db.Column(db.String(10), default='⚡')
    template_id = db.Column(db.Integer, nullable=True)  # If based on a template
    
    # Configuration
    config = db.Column(db.JSON, default=dict)  # Strategy settings (minEdge, stopLoss, etc.)
    markets = db.Column(db.JSON, default=list)  # ['Kalshi', 'Manifold']
    categories = db.Column(db.JSON, default=list)  # ['politics', 'sports']
    
    # Deployment settings
    mode = db.Column(db.String(20), default='paper')  # 'paper' or 'live'
    allocated_capital = db.Column(db.Float, default=1000.0)
    status = db.Column(db.String(20), default='running')  # running, stopped, paused
    
    # Performance tracking
    total_trades = db.Column(db.Integer, default=0)
    winning_trades = db.Column(db.Integer, default=0)
    losing_trades = db.Column(db.Integer, default=0)
    total_pnl = db.Column(db.Float, default=0.0)
    unrealized_pnl = db.Column(db.Float, default=0.0)
    win_rate = db.Column(db.Float, default=0.0)
    
    # Timestamps
    deployed_at = db.Column(db.DateTime, default=datetime.utcnow)
    stopped_at = db.Column(db.DateTime, nullable=True)
    last_trade_at = db.Column(db.DateTime, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        """Serialize deployed strategy to dictionary."""
        return {
            'id': self.id,
            'userId': self.user_id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'templateId': self.template_id,
            'config': self.config or {},
            'markets': self.markets or [],
            'categories': self.categories or [],
            'mode': self.mode,
            'allocatedCapital': self.allocated_capital,
            'status': self.status,
            'totalTrades': self.total_trades,
            'winningTrades': self.winning_trades,
            'losingTrades': self.losing_trades,
            'totalPnl': self.total_pnl,
            'unrealizedPnl': self.unrealized_pnl,
            'winRate': self.win_rate,
            'deployedAt': self.deployed_at.isoformat() if self.deployed_at else None,
            'stoppedAt': self.stopped_at.isoformat() if self.stopped_at else None,
            'lastTradeAt': self.last_trade_at.isoformat() if self.last_trade_at else None,
        }

    def __repr__(self):
        return f'<DeployedStrategy {self.name} ({self.status})>'


# ============================================
# DATABASE INITIALIZATION HELPERS
# ============================================
def init_db(app):
    """Initialize the database with the Flask app."""
    db.init_app(app)
    with app.app_context():
        db.create_all()
        print("[Database] Tables created successfully")


def create_demo_user():
    """Create a demo user if it doesn't exist."""
    import bcrypt

    demo_email = 'demo@example.com'
    existing = User.query.filter_by(email=demo_email).first()

    if not existing:
        password_hash = bcrypt.hashpw('demo123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        demo_user = User(
            id='user_1',
            email=demo_email,
            username='DemoUser',
            password_hash=password_hash,
            tier='pro',
        )
        db.session.add(demo_user)
        db.session.flush()  # Get the user ID

        demo_subscription = Subscription(
            user_id='user_1',
            status='active',
            billing_cycle='monthly',
            price=9.99,
            expires_at=datetime.utcnow() + timedelta(days=30),
            renews_at=datetime.utcnow() + timedelta(days=30),
        )
        db.session.add(demo_subscription)

        demo_stats = UserStats(
            user_id='user_1',
            total_pnl=0,
            win_rate=0,
            active_strategies=0,
            total_trades=0,
            connected_accounts=0,
            total_balance=0,
            monthly_change=0,
        )
        db.session.add(demo_stats)

        db.session.commit()
        print("[Database] Demo user created")
    else:
        print("[Database] Demo user already exists")

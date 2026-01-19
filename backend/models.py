"""
TO THE MOON - SQLAlchemy Models
Database ORM models matching the PostgreSQL schema.
"""
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


# ============================================
# 1. USER MODEL
# ============================================
class User(db.Model):
    """User account model."""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    subscription = db.relationship('Subscription', backref='user', uselist=False, lazy=True, cascade='all, delete-orphan')
    strategies = db.relationship('Strategy', backref='user', lazy=True)
    trades = db.relationship('Trade', backref='user', lazy=True, cascade='all, delete-orphan')
    followed_strategies = db.relationship('StrategyFollow', backref='user', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        """Serialize user to dictionary."""
        return {
            'id': self.id,
            'email': self.email,
            'username': self.username,
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

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True)
    tier = db.Column(db.String(20), nullable=False, default='free')  # 'free' or 'pro'
    stripe_subscription_id = db.Column(db.String(255), unique=True, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    expires_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def is_pro(self):
        """Check if user has active Pro subscription."""
        if self.tier != 'pro':
            return False
        if not self.is_active:
            return False
        if self.expires_at and self.expires_at < datetime.utcnow():
            return False
        return True

    def to_dict(self):
        """Serialize subscription to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'tier': self.tier,
            'is_active': self.is_active,
            'is_pro': self.is_pro,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f'<Subscription user_id={self.user_id} tier={self.tier}>'


# ============================================
# 3. STRATEGY MODEL
# ============================================
class Strategy(db.Model):
    """Trading strategy model."""
    __tablename__ = 'strategies'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(50), nullable=False, default='custom')
    config = db.Column(db.JSON, default=dict)
    is_public = db.Column(db.Boolean, default=False)
    is_template = db.Column(db.Boolean, default=False)

    # Performance metrics
    win_rate = db.Column(db.Numeric(5, 2), default=0)
    total_profit = db.Column(db.Numeric(15, 2), default=0)
    total_trades = db.Column(db.Integer, default=0)
    followers_count = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    trades = db.relationship('Trade', backref='strategy', lazy=True)
    followers = db.relationship('StrategyFollow', backref='strategy', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        """Serialize strategy to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'config': self.config or {},
            'is_public': self.is_public,
            'is_template': self.is_template,
            'win_rate': float(self.win_rate) if self.win_rate else 0,
            'total_profit': float(self.total_profit) if self.total_profit else 0,
            'total_trades': self.total_trades or 0,
            'followers_count': self.followers_count or 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f'<Strategy {self.name}>'


# ============================================
# 4. TRADE MODEL
# ============================================
class Trade(db.Model):
    """Trade record model."""
    __tablename__ = 'trades'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    strategy_id = db.Column(db.Integer, db.ForeignKey('strategies.id', ondelete='SET NULL'), nullable=True)

    # Trade details
    market = db.Column(db.String(50), nullable=False)  # BTC/USD, ETH/USD, prediction market name
    side = db.Column(db.String(10), nullable=False)    # 'long', 'short', 'yes', 'no'
    size = db.Column(db.Numeric(20, 8), nullable=False)
    entry_price = db.Column(db.Numeric(20, 8), nullable=False)
    exit_price = db.Column(db.Numeric(20, 8), nullable=True)
    profit = db.Column(db.Numeric(15, 2), nullable=True)
    status = db.Column(db.String(20), default='open')  # 'open', 'closed', 'cancelled'

    # Mode & Platform
    is_paper = db.Column(db.Boolean, default=True)
    platform = db.Column(db.String(50), nullable=True)  # kalshi, polymarket, binance

    # Timestamps
    opened_at = db.Column(db.DateTime, default=datetime.utcnow)
    closed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def calculate_profit(self):
        """Calculate P&L when closing trade."""
        if self.exit_price is None:
            return None

        entry = float(self.entry_price)
        exit_p = float(self.exit_price)
        qty = float(self.size)

        if self.side in ('long', 'yes'):
            return (exit_p - entry) * qty
        else:  # short, no
            return (entry - exit_p) * qty

    def to_dict(self):
        """Serialize trade to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'strategy_id': self.strategy_id,
            'market': self.market,
            'side': self.side,
            'size': float(self.size) if self.size else 0,
            'entry_price': float(self.entry_price) if self.entry_price else 0,
            'exit_price': float(self.exit_price) if self.exit_price else None,
            'profit': float(self.profit) if self.profit else None,
            'status': self.status,
            'is_paper': self.is_paper,
            'platform': self.platform,
            'opened_at': self.opened_at.isoformat() if self.opened_at else None,
            'closed_at': self.closed_at.isoformat() if self.closed_at else None,
        }

    def __repr__(self):
        return f'<Trade {self.id} {self.market} {self.side}>'


# ============================================
# 5. LEADERBOARD SNAPSHOT MODEL
# ============================================
class LeaderboardSnapshot(db.Model):
    """Leaderboard snapshot model (cached rankings)."""
    __tablename__ = 'leaderboard_snapshot'

    id = db.Column(db.Integer, primary_key=True)
    snapshot_date = db.Column(db.Date, nullable=False, default=datetime.utcnow().date)
    period = db.Column(db.String(20), nullable=False, default='monthly')  # daily, weekly, monthly, alltime
    rankings = db.Column(db.JSON, nullable=False)  # Array of ranking objects
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('snapshot_date', 'period', name='unique_snapshot_date_period'),
    )

    def to_dict(self):
        """Serialize leaderboard snapshot to dictionary."""
        return {
            'id': self.id,
            'snapshot_date': self.snapshot_date.isoformat() if self.snapshot_date else None,
            'period': self.period,
            'rankings': self.rankings or [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f'<LeaderboardSnapshot {self.snapshot_date} {self.period}>'


# ============================================
# 6. STRATEGY FOLLOW MODEL
# ============================================
class StrategyFollow(db.Model):
    """Strategy follow/subscription model."""
    __tablename__ = 'strategy_follows'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    strategy_id = db.Column(db.Integer, db.ForeignKey('strategies.id', ondelete='CASCADE'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'strategy_id', name='unique_user_strategy_follow'),
    )

    def to_dict(self):
        """Serialize strategy follow to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'strategy_id': self.strategy_id,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f'<StrategyFollow user={self.user_id} strategy={self.strategy_id}>'

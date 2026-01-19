"""
Database models for TO THE MOON.
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    """User account model."""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Stripe
    stripe_customer_id = db.Column(db.String(255), unique=True, nullable=True)

    # Relationships
    subscription = db.relationship('Subscription', backref='user', uselist=False, lazy=True)
    strategies = db.relationship('Strategy', backref='user', lazy=True)
    trades = db.relationship('Trade', backref='user', lazy=True)
    followed_strategies = db.relationship('StrategyFollow', backref='user', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'username': self.username,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Subscription(db.Model):
    """User subscription model."""
    __tablename__ = 'subscriptions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    tier = db.Column(db.String(20), default='free', nullable=False)  # 'free' or 'pro'
    stripe_subscription_id = db.Column(db.String(255), unique=True, nullable=True)
    stripe_price_id = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(20), default='active')  # active, cancelled, past_due
    current_period_start = db.Column(db.DateTime, nullable=True)
    current_period_end = db.Column(db.DateTime, nullable=True)
    cancelled_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'tier': self.tier,
            'status': self.status,
            'current_period_start': self.current_period_start.isoformat() if self.current_period_start else None,
            'current_period_end': self.current_period_end.isoformat() if self.current_period_end else None,
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
        }

    @property
    def is_pro(self):
        return self.tier == 'pro' and self.status == 'active'


class Strategy(db.Model):
    """Trading strategy model."""
    __tablename__ = 'strategies'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(50), nullable=False)  # crypto, sports, politics, etc.
    config = db.Column(db.JSON, nullable=True)  # Strategy configuration
    is_public = db.Column(db.Boolean, default=False)
    is_template = db.Column(db.Boolean, default=False)

    # Performance metrics
    total_trades = db.Column(db.Integer, default=0)
    winning_trades = db.Column(db.Integer, default=0)
    total_pnl = db.Column(db.Numeric(15, 2), default=0)
    win_rate = db.Column(db.Numeric(5, 2), default=0)

    # Marketplace
    price_monthly = db.Column(db.Numeric(10, 2), nullable=True)
    subscribers_count = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    trades = db.relationship('Trade', backref='strategy', lazy=True)
    followers = db.relationship('StrategyFollow', backref='strategy', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'config': self.config,
            'is_public': self.is_public,
            'total_trades': self.total_trades,
            'winning_trades': self.winning_trades,
            'total_pnl': float(self.total_pnl) if self.total_pnl else 0,
            'win_rate': float(self.win_rate) if self.win_rate else 0,
            'price_monthly': float(self.price_monthly) if self.price_monthly else None,
            'subscribers_count': self.subscribers_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Trade(db.Model):
    """Trade record model."""
    __tablename__ = 'trades'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    strategy_id = db.Column(db.Integer, db.ForeignKey('strategies.id'), nullable=True)

    # Trade details
    symbol = db.Column(db.String(20), nullable=False)  # BTC/USD, ETH/USD, etc.
    side = db.Column(db.String(10), nullable=False)  # 'long' or 'short'
    entry_price = db.Column(db.Numeric(20, 8), nullable=False)
    exit_price = db.Column(db.Numeric(20, 8), nullable=True)
    quantity = db.Column(db.Numeric(20, 8), nullable=False)
    pnl = db.Column(db.Numeric(15, 2), nullable=True)
    status = db.Column(db.String(20), default='open')  # open, closed, cancelled

    # Mode
    is_paper = db.Column(db.Boolean, default=True)

    # Platform
    platform = db.Column(db.String(50), nullable=True)  # kalshi, polymarket, binance

    # Timestamps
    opened_at = db.Column(db.DateTime, default=datetime.utcnow)
    closed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'strategy_id': self.strategy_id,
            'symbol': self.symbol,
            'side': self.side,
            'entry_price': float(self.entry_price) if self.entry_price else None,
            'exit_price': float(self.exit_price) if self.exit_price else None,
            'quantity': float(self.quantity) if self.quantity else None,
            'pnl': float(self.pnl) if self.pnl else None,
            'status': self.status,
            'is_paper': self.is_paper,
            'platform': self.platform,
            'opened_at': self.opened_at.isoformat() if self.opened_at else None,
            'closed_at': self.closed_at.isoformat() if self.closed_at else None,
        }


class StrategyFollow(db.Model):
    """Strategy follow/subscription model."""
    __tablename__ = 'strategy_follows'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    strategy_id = db.Column(db.Integer, db.ForeignKey('strategies.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'strategy_id', name='unique_user_strategy_follow'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'strategy_id': self.strategy_id,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class LeaderboardEntry(db.Model):
    """Leaderboard ranking cache model."""
    __tablename__ = 'leaderboard'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    username = db.Column(db.String(50), nullable=False)
    rank = db.Column(db.Integer, nullable=False)
    total_pnl = db.Column(db.Numeric(15, 2), default=0)
    total_return_pct = db.Column(db.Numeric(10, 2), default=0)
    win_rate = db.Column(db.Numeric(5, 2), default=0)
    total_trades = db.Column(db.Integer, default=0)
    followers_count = db.Column(db.Integer, default=0)
    period = db.Column(db.String(20), default='monthly')  # daily, weekly, monthly, alltime
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.username,
            'rank': self.rank,
            'total_pnl': float(self.total_pnl) if self.total_pnl else 0,
            'total_return_pct': float(self.total_return_pct) if self.total_return_pct else 0,
            'win_rate': float(self.win_rate) if self.win_rate else 0,
            'total_trades': self.total_trades,
            'followers_count': self.followers_count,
            'period': self.period,
        }

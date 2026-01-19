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
    status = db.Column(db.String(20), default='Won')  # Won, Lost

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

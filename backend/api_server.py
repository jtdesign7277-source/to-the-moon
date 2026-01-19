"""
ToTheMoon API Server
Flask backend with subscription, strategies, and backtesting endpoints
PostgreSQL database for persistent storage
"""

import os
import re
import uuid
import random
from datetime import datetime, timedelta
from functools import wraps

import jwt
import bcrypt
from flask import Flask, request, jsonify, g
from flask_cors import CORS

# Initialize Sentry for error tracking (before Flask app)
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

SENTRY_DSN = os.environ.get('SENTRY_DSN')

if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[FlaskIntegration()],
        environment=os.environ.get('ENVIRONMENT', 'development'),

        # Performance monitoring
        traces_sample_rate=0.1,  # 10% of transactions

        # Filter out common/expected errors
        before_send=lambda event, hint: None if os.environ.get('ENVIRONMENT') == 'development' else event,

        # Don't send PII by default
        send_default_pii=False,
    )
    print("[Sentry] Initialized error tracking")

# Initialize Flask app
app = Flask(__name__)

# Database configuration
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    # Railway uses postgres:// but SQLAlchemy needs postgresql://
    if DATABASE_URL.startswith('postgres://'):
        DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
else:
    # Fallback to SQLite for local development
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tothemoon.db'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 300,
}

# Import and initialize database models
from models import (
    db, User, Subscription, UserStats, Trade, Strategy,
    WaitlistEntry, BacktestResult, PaperPortfolio, PaperTrade, PaperPosition,
    create_demo_user
)

# Import paper trading service
from services.paper_trading_service import PaperTradingService

db.init_app(app)

# CORS configuration - allow frontend origins
ALLOWED_ORIGINS = [
    'http://localhost:5173',      # Vite dev server
    'http://localhost:3000',      # Alternative dev server
    'https://to-the-moon-three.vercel.app',  # Production frontend (Vercel)
]

# Add any origins from environment variable
if os.environ.get('ALLOWED_ORIGINS'):
    env_origins = [o.strip() for o in os.environ.get('ALLOWED_ORIGINS').split(',') if o.strip()]
    ALLOWED_ORIGINS.extend(env_origins)

CORS(app,
     origins=ALLOWED_ORIGINS,
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization', 'X-Admin-Key'],
     expose_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', 'sk_test_placeholder')
STRIPE_PRICE_ID = os.environ.get('STRIPE_PRICE_ID', 'price_placeholder')

# JWT Configuration
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_DAYS = int(os.environ.get('JWT_EXPIRATION_DAYS', 30))

# Initialize database tables and create demo user
with app.app_context():
    db.create_all()
    create_demo_user()
    print("[Database] PostgreSQL initialized successfully")

# Sample leaderboard data
leaderboard_data = [
    {'rank': 1, 'username': 'CryptoKing', 'strategy': 'Momentum Pro', 'returns': 245.6, 'win_rate': 78, 'trades': 432, 'sharpe': 2.84},
    {'rank': 2, 'username': 'AlgoMaster', 'strategy': 'DCA Bot Elite', 'returns': 198.3, 'win_rate': 72, 'trades': 651, 'sharpe': 2.45},
    {'rank': 3, 'username': 'MoonShot', 'strategy': 'Volatility Hunter', 'returns': 156.7, 'win_rate': 69, 'trades': 289, 'sharpe': 2.12},
    {'rank': 4, 'username': 'TradingBot99', 'strategy': 'Grid Master', 'returns': 134.2, 'win_rate': 65, 'trades': 1203, 'sharpe': 1.98},
    {'rank': 5, 'username': 'WhaleTrades', 'strategy': 'Arb Scanner', 'returns': 128.9, 'win_rate': 71, 'trades': 178, 'sharpe': 2.34},
    {'rank': 6, 'username': 'DiamondHands', 'strategy': 'HODL Strategy', 'returns': 112.4, 'win_rate': 63, 'trades': 567, 'sharpe': 1.76},
    {'rank': 7, 'username': 'BullRunner', 'strategy': 'Trend Follower', 'returns': 98.7, 'win_rate': 67, 'trades': 345, 'sharpe': 1.89},
    {'rank': 8, 'username': 'SmartMoney', 'strategy': 'News Scalper', 'returns': 87.3, 'win_rate': 70, 'trades': 234, 'sharpe': 2.01},
    {'rank': 9, 'username': 'QuickFlip', 'strategy': 'Scalp Master', 'returns': 82.1, 'win_rate': 74, 'trades': 2341, 'sharpe': 1.67},
    {'rank': 10, 'username': 'SteadyGains', 'strategy': 'Conservative Arb', 'returns': 76.5, 'win_rate': 82, 'trades': 156, 'sharpe': 2.56},
]

# Extend to 50 entries
for i in range(11, 51):
    leaderboard_data.append({
        'rank': i,
        'username': f'Trader{i}',
        'strategy': f'Strategy_{i}',
        'returns': round(76.5 - (i - 10) * 1.5 + random.uniform(-5, 5), 1),
        'win_rate': random.randint(55, 75),
        'trades': random.randint(100, 1000),
        'sharpe': round(random.uniform(1.2, 2.2), 2),
    })


# ============================================
# JWT Token Helpers
# ============================================

def generate_jwt_token(user_id, expires_days=None):
    """Generate a JWT token for a user."""
    if expires_days is None:
        expires_days = JWT_EXPIRATION_DAYS

    payload = {
        'user_id': user_id,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(days=expires_days),
    }
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token


def decode_jwt_token(token):
    """Decode and validate a JWT token. Returns user_id or None."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload.get('user_id')
    except jwt.ExpiredSignatureError:
        return None  # Token expired
    except jwt.InvalidTokenError:
        return None  # Invalid token


def hash_password(password):
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password, password_hash):
    """Verify a password against its hash."""
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))


def validate_email(email):
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password(password):
    """Validate password strength. Returns (is_valid, error_message)."""
    if len(password) < 8:
        return False, 'Password must be at least 8 characters long'
    if not re.search(r'[A-Za-z]', password):
        return False, 'Password must contain at least one letter'
    if not re.search(r'[0-9]', password):
        return False, 'Password must contain at least one number'
    return True, None


def validate_username(username):
    """Validate username format. Returns (is_valid, error_message)."""
    if len(username) < 3:
        return False, 'Username must be at least 3 characters long'
    if len(username) > 30:
        return False, 'Username must be 30 characters or less'
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        return False, 'Username can only contain letters, numbers, and underscores'
    return True, None


# Note: sanitize_user is now a method on the User model (user.sanitize())


# ============================================
# Middleware & Helpers
# ============================================

def get_current_user():
    """Extract user from JWT token in Authorization header."""
    auth_header = request.headers.get('Authorization', '')

    if not auth_header.startswith('Bearer '):
        return None

    token = auth_header[7:]  # Remove 'Bearer ' prefix

    if not token:
        return None

    # Decode JWT token
    user_id = decode_jwt_token(token)

    if not user_id:
        return None

    # Look up user in PostgreSQL database
    user = User.query.get(user_id)
    return user


def require_auth(f):
    """Decorator to require valid JWT authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()

        if not user:
            return jsonify({
                'error': 'Unauthorized',
                'message': 'Valid authentication token required'
            }), 401

        g.user = user

        # Set Sentry user context for better error tracking
        if SENTRY_DSN:
            sentry_sdk.set_user({
                'id': user.id,
                'email': user.email,
                'username': user.username,
            })

        return f(*args, **kwargs)
    return decorated


def require_pro(f):
    """Decorator to require Pro subscription."""
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()

        if not user:
            return jsonify({
                'error': 'Unauthorized',
                'message': 'Valid authentication token required'
            }), 401

        if user.tier != 'pro':
            return jsonify({
                'error': 'Forbidden',
                'message': 'Pro subscription required for this feature'
            }), 403

        g.user = user
        return f(*args, **kwargs)
    return decorated


def validate_strategy_config(config):
    """Validate strategy configuration"""
    errors = []

    if not config.get('name'):
        errors.append('Strategy name is required')

    if config.get('max_position_size', 0) > 1:
        errors.append('max_position_size cannot exceed 1 (100%)')

    if config.get('max_position_size', 0) <= 0:
        errors.append('max_position_size must be positive')

    if config.get('stop_loss', 0) < 0:
        errors.append('stop_loss must be non-negative')

    if config.get('take_profit', 0) <= 0:
        errors.append('take_profit must be positive')

    return errors


# ============================================
# Routes
# ============================================

@app.route('/', methods=['GET'])
def root():
    """Root endpoint - redirects to health check"""
    return jsonify({
        'status': 'ok',
        'message': 'ToTheMoon API v1.0.0',
        'health': '/api/health'
    })


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    # Check database connection
    db_status = 'healthy'
    try:
        db.session.execute(db.text('SELECT 1'))
    except Exception as e:
        db_status = f'unhealthy: {str(e)}'

    return jsonify({
        'status': 'healthy' if db_status == 'healthy' else 'degraded',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0',
        'database': db_status,
        'sentry': 'enabled' if SENTRY_DSN else 'disabled'
    })


@app.route('/api/debug/sentry-test', methods=['POST'])
def sentry_test():
    """Test endpoint to verify Sentry is working (admin only)."""
    # Require admin key for this endpoint
    admin_key = request.headers.get('X-Admin-Key')
    if admin_key != os.environ.get('ADMIN_KEY', 'dev-admin-key'):
        return jsonify({'error': 'Unauthorized'}), 401

    if not SENTRY_DSN:
        return jsonify({
            'success': False,
            'message': 'Sentry is not configured. Set SENTRY_DSN environment variable.'
        })

    try:
        # Capture a test message
        sentry_sdk.capture_message("Sentry test message from ToTheMoon API")

        # Optionally trigger a real error (commented out by default)
        # raise Exception("Sentry test exception")

        return jsonify({
            'success': True,
            'message': 'Test message sent to Sentry. Check your Sentry dashboard.'
        })
    except Exception as e:
        sentry_sdk.capture_exception(e)
        return jsonify({
            'success': True,
            'message': f'Test exception captured: {str(e)}'
        })


# --------------------------------------------
# Waitlist Routes
# --------------------------------------------

@app.route('/api/waitlist', methods=['POST'])
def join_waitlist():
    """Add email to beta waitlist."""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'error': 'Bad Request',
                'message': 'Request body is required'
            }), 400

        email = data.get('email', '').strip().lower()

        # Validate email
        if not email:
            return jsonify({
                'error': 'Validation Error',
                'message': 'Email is required'
            }), 400

        if not validate_email(email):
            return jsonify({
                'error': 'Validation Error',
                'message': 'Invalid email format'
            }), 400

        # Check if already on waitlist
        existing = WaitlistEntry.query.filter_by(email=email).first()
        if existing:
            return jsonify({
                'success': True,
                'message': 'You are already on the waitlist!'
            })

        # Add to waitlist
        entry = WaitlistEntry(email=email, source='landing')
        db.session.add(entry)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Successfully joined the waitlist!'
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'Server Error',
            'message': str(e)
        }), 500


@app.route('/api/waitlist/count', methods=['GET'])
def get_waitlist_count():
    """Get total number of waitlist signups."""
    count = WaitlistEntry.query.count()
    return jsonify({
        'count': count + 500  # Add base count for social proof
    })


@app.route('/api/waitlist/admin', methods=['GET'])
def get_waitlist_admin():
    """Get all waitlist entries (admin endpoint).

    Protected by a simple admin key for now.
    In production, use proper authentication.
    """
    admin_key = request.headers.get('X-Admin-Key')
    expected_key = os.environ.get('ADMIN_KEY', 'admin-secret-key')

    if admin_key != expected_key:
        return jsonify({
            'error': 'Unauthorized',
            'message': 'Invalid or missing admin key'
        }), 401

    # Return all waitlist entries sorted by join date
    entries = WaitlistEntry.query.order_by(WaitlistEntry.joined_at.desc()).all()

    return jsonify({
        'total': len(entries),
        'entries': [e.to_dict() for e in entries]
    })


# --------------------------------------------
# Authentication Routes
# --------------------------------------------

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    """Register a new user account."""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'error': 'Bad Request',
                'message': 'Request body is required'
            }), 400

        # Extract fields
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        username = data.get('username', '').strip()

        # Validate email
        if not email:
            return jsonify({
                'error': 'Validation Error',
                'message': 'Email is required'
            }), 400

        if not validate_email(email):
            return jsonify({
                'error': 'Validation Error',
                'message': 'Invalid email format'
            }), 400

        # Check if email already exists
        existing_email = User.query.filter_by(email=email).first()
        if existing_email:
            return jsonify({
                'error': 'Conflict',
                'message': 'An account with this email already exists'
            }), 409

        # Validate password
        if not password:
            return jsonify({
                'error': 'Validation Error',
                'message': 'Password is required'
            }), 400

        is_valid, password_error = validate_password(password)
        if not is_valid:
            return jsonify({
                'error': 'Validation Error',
                'message': password_error
            }), 400

        # Validate username
        if not username:
            return jsonify({
                'error': 'Validation Error',
                'message': 'Username is required'
            }), 400

        is_valid, username_error = validate_username(username)
        if not is_valid:
            return jsonify({
                'error': 'Validation Error',
                'message': username_error
            }), 400

        # Check if username already exists
        existing_username = User.query.filter(
            db.func.lower(User.username) == username.lower()
        ).first()
        if existing_username:
            return jsonify({
                'error': 'Conflict',
                'message': 'This username is already taken'
            }), 409

        # Create new user
        password_hash = hash_password(password)

        new_user = User(
            email=email,
            username=username,
            password_hash=password_hash,
            tier='free',
        )
        db.session.add(new_user)
        db.session.flush()  # Get the user ID

        # Create default user stats
        user_stats = UserStats(user_id=new_user.id)
        db.session.add(user_stats)

        # Also add to waitlist (so admin can see all registered users)
        existing_waitlist = WaitlistEntry.query.filter_by(email=email).first()
        if not existing_waitlist:
            waitlist_entry = WaitlistEntry(email=email, source='signup')
            db.session.add(waitlist_entry)

        db.session.commit()

        # Generate JWT token
        access_token = generate_jwt_token(new_user.id)

        return jsonify({
            'success': True,
            'message': 'Account created successfully',
            'access_token': access_token,
            'user': new_user.sanitize()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'Server Error',
            'message': str(e)
        }), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate user and return JWT token."""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'error': 'Bad Request',
                'message': 'Request body is required'
            }), 400

        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        # Validate input
        if not email or not password:
            return jsonify({
                'error': 'Validation Error',
                'message': 'Email and password are required'
            }), 400

        # Find user by email in PostgreSQL
        user = User.query.filter_by(email=email).first()

        if not user:
            return jsonify({
                'error': 'Unauthorized',
                'message': 'Invalid email or password'
            }), 401

        # Verify password
        if not verify_password(password, user.password_hash):
            return jsonify({
                'error': 'Unauthorized',
                'message': 'Invalid email or password'
            }), 401

        # Generate JWT token
        access_token = generate_jwt_token(user.id)

        return jsonify({
            'success': True,
            'message': 'Login successful',
            'access_token': access_token,
            'user': user.sanitize()
        })

    except Exception as e:
        return jsonify({
            'error': 'Server Error',
            'message': str(e)
        }), 500


@app.route('/api/auth/me', methods=['GET'])
@require_auth
def get_current_user_info():
    """Get current authenticated user's information."""
    user = g.user

    # Include subscription details from database
    subscription_info = None
    if user.subscription:
        subscription_info = user.subscription.to_dict()

    return jsonify({
        'success': True,
        'user': {
            **user.sanitize(),
            'subscription': subscription_info,
        }
    })


@app.route('/api/auth/logout', methods=['POST'])
@require_auth
def logout():
    """Logout user (client should discard token)."""
    # JWT tokens are stateless, so we just return success
    # Client should delete the token from storage
    return jsonify({
        'success': True,
        'message': 'Logged out successfully'
    })


@app.route('/api/auth/refresh', methods=['POST'])
@require_auth
def refresh_token():
    """Refresh the JWT token (extend expiration)."""
    user = g.user

    # Generate new token
    new_token = generate_jwt_token(user.id)

    return jsonify({
        'success': True,
        'access_token': new_token,
        'user': user.sanitize()
    })


# --------------------------------------------
# User Dashboard Routes
# --------------------------------------------

@app.route('/api/user/dashboard', methods=['GET'])
@require_auth
def get_user_dashboard():
    """Get user's dashboard data including stats, trades, and performance."""
    user = g.user

    # Get user's stats from database (or create defaults for new users)
    stats = user.stats
    if not stats:
        stats = UserStats(user_id=user.id)
        db.session.add(stats)
        db.session.commit()

    stats_dict = stats.to_dict()

    # Get user's recent trades from database
    trades = Trade.query.filter_by(user_id=user.id).order_by(
        Trade.timestamp.desc()
    ).limit(10).all()

    # Get performance data (empty for new users)
    performance_data = []
    portfolio_data = []

    return jsonify({
        'success': True,
        'totalPnl': stats_dict.get('totalPnl', 0),
        'winRate': stats_dict.get('winRate', 0),
        'activeStrategies': stats_dict.get('activeStrategies', 0),
        'totalTrades': stats_dict.get('totalTrades', 0),
        'connectedAccounts': stats_dict.get('connectedAccounts', 0),
        'totalBalance': stats_dict.get('totalBalance', 0),
        'monthlyChange': stats_dict.get('monthlyChange', 0),
        'recentTrades': [t.to_dict() for t in trades],
        'performanceData': performance_data,
        'portfolioData': portfolio_data,
    })


@app.route('/api/user/stats', methods=['PUT'])
@require_auth
def update_user_stats():
    """Update user's stats (called when trades are made)."""
    user = g.user

    data = request.get_json() or {}

    # Get or create user stats
    stats = user.stats
    if not stats:
        stats = UserStats(user_id=user.id)
        db.session.add(stats)

    # Update stats with camelCase to snake_case mapping
    field_mapping = {
        'totalPnl': 'total_pnl',
        'winRate': 'win_rate',
        'activeStrategies': 'active_strategies',
        'totalTrades': 'total_trades',
        'connectedAccounts': 'connected_accounts',
        'totalBalance': 'total_balance',
        'monthlyChange': 'monthly_change',
    }

    for camel_key, snake_key in field_mapping.items():
        if camel_key in data:
            setattr(stats, snake_key, data[camel_key])

    db.session.commit()

    return jsonify({
        'success': True,
        'stats': stats.to_dict(),
    })


@app.route('/api/user/trades', methods=['POST'])
@require_auth
def add_user_trade():
    """Add a trade to user's history."""
    user = g.user

    data = request.get_json()

    if not data:
        return jsonify({
            'error': 'Bad Request',
            'message': 'Trade data is required'
        }), 400

    # Create new trade in database
    trade = Trade(
        user_id=user.id,
        pair=data.get('pair', 'Unknown'),
        trade_type=data.get('type', 'Long'),
        entry=data.get('entry', '$0.00'),
        exit=data.get('exit', '$0.00'),
        pnl=data.get('pnl', '+$0'),
        status=data.get('status', 'Won'),
    )
    db.session.add(trade)

    # Get or create user stats
    stats = user.stats
    if not stats:
        stats = UserStats(user_id=user.id)
        db.session.add(stats)

    # Update stats
    total_trades = Trade.query.filter_by(user_id=user.id).count() + 1  # +1 for the new trade
    wins = Trade.query.filter_by(user_id=user.id, status='Won').count()
    if data.get('status') == 'Won':
        wins += 1

    stats.total_trades = total_trades
    stats.win_rate = round((wins / total_trades) * 100) if total_trades else 0

    db.session.commit()

    return jsonify({
        'success': True,
        'trade': trade.to_dict(),
        'stats': stats.to_dict(),
    }), 201


# --------------------------------------------
# Subscription Routes
# --------------------------------------------

@app.route('/api/subscription/status', methods=['GET'])
def get_subscription_status():
    """Get current user's subscription status"""
    user = get_current_user()

    if not user:
        # Return free tier for unauthenticated users
        return jsonify({
            'tier': 'free',
            'features': ['dashboard', 'accounts', 'leaderboard', 'marketplace-browse', 'paper-trading']
        })

    subscription = user.subscription
    tier = user.tier or 'free'

    # Define features by tier
    free_features = ['dashboard', 'accounts', 'leaderboard', 'marketplace-browse', 'paper-trading']
    pro_features = free_features + [
        'strategy-builder', 'live-trading', 'advanced-analytics',
        'priority-support', 'api-access', 'custom-alerts', 'backtesting'
    ]

    sub_data = subscription.to_dict() if subscription else {}

    return jsonify({
        'tier': tier,
        'expires_at': sub_data.get('expires_at'),
        'renews_at': sub_data.get('renews_at'),
        'cancelled_at': sub_data.get('cancelled_at'),
        'billing_cycle': sub_data.get('billing_cycle', 'monthly'),
        'price': sub_data.get('price', 9.99),
        'features': pro_features if tier == 'pro' else free_features,
        'subscription_id': sub_data.get('id')
    })


@app.route('/api/subscription/upgrade', methods=['POST'])
@require_auth
def upgrade_subscription():
    """Upgrade user to Pro tier"""
    user = g.user

    # In production, this would process payment through Stripe
    # For demo, just upgrade the user

    user.tier = 'pro'

    # Create or update subscription
    if user.subscription:
        user.subscription.status = 'active'
        user.subscription.expires_at = datetime.utcnow() + timedelta(days=30)
        user.subscription.renews_at = datetime.utcnow() + timedelta(days=30)
        user.subscription.cancelled_at = None
    else:
        subscription = Subscription(
            user_id=user.id,
            status='active',
            billing_cycle='monthly',
            price=9.99,
            expires_at=datetime.utcnow() + timedelta(days=30),
            renews_at=datetime.utcnow() + timedelta(days=30),
        )
        db.session.add(subscription)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Successfully upgraded to Pro!',
        'tier': 'pro',
        'expires_at': user.subscription.expires_at.isoformat() if user.subscription else None,
        'renews_at': user.subscription.renews_at.isoformat() if user.subscription else None,
        'features': [
            'dashboard', 'accounts', 'leaderboard', 'marketplace-browse',
            'paper-trading', 'strategy-builder', 'live-trading',
            'advanced-analytics', 'priority-support', 'api-access',
            'custom-alerts', 'backtesting'
        ],
        'billing_cycle': 'monthly',
        'price': 9.99
    })


@app.route('/api/subscription/checkout', methods=['POST'])
@require_auth
def create_subscription_checkout():
    """Create Stripe checkout session for Pro subscription"""
    try:
        data = request.get_json() or {}
        success_url = data.get('success_url', 'http://localhost:5173/accounts?upgraded=true')
        cancel_url = data.get('cancel_url', 'http://localhost:5173/accounts')

        # In production, use Stripe SDK:
        # import stripe
        # stripe.api_key = STRIPE_SECRET_KEY
        # session = stripe.checkout.Session.create(
        #     payment_method_types=['card'],
        #     line_items=[{'price': STRIPE_PRICE_ID, 'quantity': 1}],
        #     mode='subscription',
        #     success_url=success_url,
        #     cancel_url=cancel_url,
        #     customer_email=g.user.get('email'),
        # )

        # For demo, return mock checkout session
        session_id = f'cs_{uuid.uuid4().hex}'

        return jsonify({
            'success': True,
            'session_id': session_id,
            'url': f'https://checkout.stripe.com/c/pay/{session_id}#fidkdWxOYHwnPyd1blpxYHZxWjA0T',
        })

    except Exception as e:
        return jsonify({
            'error': 'Checkout Error',
            'message': str(e)
        }), 500


@app.route('/api/subscription/cancel', methods=['POST'])
@require_auth
def cancel_subscription():
    """Cancel user's subscription"""
    user = g.user

    if user.tier != 'pro':
        return jsonify({
            'error': 'Bad Request',
            'message': 'No active subscription to cancel'
        }), 400

    subscription = user.subscription
    if subscription:
        subscription.cancelled_at = datetime.utcnow()
        subscription.status = 'cancelled'
        db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Subscription cancelled. Access continues until end of billing period.',
        'cancelled_at': subscription.cancelled_at.isoformat() if subscription and subscription.cancelled_at else None,
        'expires_at': subscription.expires_at.isoformat() if subscription and subscription.expires_at else None
    })


# --------------------------------------------
# Checkout Routes
# --------------------------------------------

@app.route('/api/checkout', methods=['POST'])
def create_checkout_session():
    """Create Stripe checkout session"""
    try:
        data = request.get_json() or {}

        # In production, use Stripe SDK:
        # import stripe
        # stripe.api_key = STRIPE_SECRET_KEY
        # session = stripe.checkout.Session.create(...)

        # For demo, return mock checkout session
        session_id = f'cs_{uuid.uuid4().hex}'

        return jsonify({
            'success': True,
            'session_id': session_id,
            'url': f'https://checkout.stripe.com/pay/{session_id}',
            'price': data.get('price', 9.99),
            'billing_cycle': data.get('billing_cycle', 'monthly')
        })

    except Exception as e:
        return jsonify({
            'error': 'Checkout Error',
            'message': str(e)
        }), 500


@app.route('/api/checkout/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhooks"""
    # In production, verify webhook signature
    # payload = request.get_data()
    # sig_header = request.headers.get('Stripe-Signature')

    try:
        data = request.get_json() or {}
        event_type = data.get('type', '')

        if event_type == 'checkout.session.completed':
            # Handle successful payment
            pass
        elif event_type == 'customer.subscription.deleted':
            # Handle subscription cancellation
            pass
        elif event_type == 'invoice.payment_failed':
            # Handle failed payment
            pass

        return jsonify({'received': True})

    except Exception as e:
        return jsonify({
            'error': 'Webhook Error',
            'message': str(e)
        }), 400


# --------------------------------------------
# Leaderboard Routes
# --------------------------------------------

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    """Get top 50 strategies leaderboard"""
    try:
        # Query parameters
        period = request.args.get('period', 'monthly')  # weekly, monthly, all-time
        limit = min(int(request.args.get('limit', 50)), 100)
        offset = int(request.args.get('offset', 0))
        sort_by = request.args.get('sort_by', 'returns')  # returns, win_rate, sharpe

        # Sort leaderboard
        sorted_data = sorted(
            leaderboard_data,
            key=lambda x: x.get(sort_by, 0),
            reverse=True
        )

        # Apply pagination
        paginated = sorted_data[offset:offset + limit]

        # Update ranks after sorting
        for i, entry in enumerate(paginated):
            entry['rank'] = offset + i + 1

        return jsonify({
            'success': True,
            'period': period,
            'total': len(leaderboard_data),
            'limit': limit,
            'offset': offset,
            'sort_by': sort_by,
            'data': paginated
        })

    except ValueError as e:
        return jsonify({
            'error': 'Invalid Parameters',
            'message': 'limit and offset must be integers'
        }), 400
    except Exception as e:
        return jsonify({
            'error': 'Server Error',
            'message': str(e)
        }), 500


# --------------------------------------------
# Strategy Routes
# --------------------------------------------

@app.route('/api/strategies', methods=['GET'])
def list_strategies():
    """List all strategies (public ones or user's own)"""
    user = get_current_user()

    # Filter strategies
    category = request.args.get('category')
    risk_profile = request.args.get('risk_profile')
    difficulty = request.args.get('difficulty')
    limit = min(int(request.args.get('limit', 20)), 100)
    offset = int(request.args.get('offset', 0))

    # Build query
    query = Strategy.query

    # Apply filters
    if category:
        query = query.filter_by(category=category)
    if risk_profile:
        query = query.filter_by(risk_profile=risk_profile)
    if difficulty:
        query = query.filter_by(difficulty=difficulty)

    # Filter to public or user's own
    if user:
        query = query.filter(
            db.or_(Strategy.is_public == True, Strategy.user_id == user.id)
        )
    else:
        query = query.filter_by(is_public=True)

    # Get total before pagination
    total = query.count()

    # Paginate
    strategies = query.offset(offset).limit(limit).all()

    return jsonify({
        'success': True,
        'total': total,
        'limit': limit,
        'offset': offset,
        'data': [s.to_dict() for s in strategies]
    })


@app.route('/api/strategies', methods=['POST'])
@require_pro
def create_strategy():
    """Create a new strategy"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'error': 'Bad Request',
                'message': 'Request body is required'
            }), 400

        # Validate configuration
        errors = validate_strategy_config(data)
        if errors:
            return jsonify({
                'error': 'Validation Error',
                'message': 'Strategy configuration is invalid',
                'errors': errors
            }), 400

        # Create strategy in database
        strategy = Strategy(
            user_id=g.user.id,
            name=data.get('name'),
            description=data.get('description', ''),
            category=data.get('category', 'custom'),
            risk_profile=data.get('risk_profile', 'moderate'),
            difficulty=data.get('difficulty', 'intermediate'),
            is_public=data.get('is_public', False),
            config={
                'min_edge': data.get('min_edge', 0.02),
                'max_position_size': data.get('max_position_size', 0.10),
                'max_daily_trades': data.get('max_daily_trades', 20),
                'stop_loss': data.get('stop_loss', 0.05),
                'take_profit': data.get('take_profit', 0.10),
                'allowed_markets': data.get('allowed_markets', ['crypto']),
            },
            rules={
                'entry': data.get('entry_rules', []),
                'exit': data.get('exit_rules', []),
            },
        )

        db.session.add(strategy)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Strategy created successfully',
            'data': strategy.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'Server Error',
            'message': str(e)
        }), 500


@app.route('/api/strategies/<strategy_id>', methods=['GET'])
def get_strategy(strategy_id):
    """Get strategy details by ID"""
    strategy = Strategy.query.get(strategy_id)

    if not strategy:
        return jsonify({
            'error': 'Not Found',
            'message': f'Strategy with ID {strategy_id} not found'
        }), 404

    # Check access permissions
    user = get_current_user()
    if not strategy.is_public:
        if not user or strategy.user_id != user.id:
            return jsonify({
                'error': 'Forbidden',
                'message': 'You do not have access to this strategy'
            }), 403

    return jsonify({
        'success': True,
        'data': strategy.to_dict()
    })


@app.route('/api/strategies/<strategy_id>', methods=['PUT'])
@require_auth
def update_strategy(strategy_id):
    """Update an existing strategy"""
    strategy = Strategy.query.get(strategy_id)

    if not strategy:
        return jsonify({
            'error': 'Not Found',
            'message': f'Strategy with ID {strategy_id} not found'
        }), 404

    # Check ownership
    if strategy.user_id != g.user.id:
        return jsonify({
            'error': 'Forbidden',
            'message': 'You can only update your own strategies'
        }), 403

    try:
        data = request.get_json() or {}

        # Update allowed fields
        if 'name' in data:
            strategy.name = data['name']
        if 'description' in data:
            strategy.description = data['description']
        if 'category' in data:
            strategy.category = data['category']
        if 'risk_profile' in data:
            strategy.risk_profile = data['risk_profile']
        if 'difficulty' in data:
            strategy.difficulty = data['difficulty']
        if 'is_public' in data:
            strategy.is_public = data['is_public']
        if 'config' in data:
            strategy.config = data['config']
        if 'rules' in data:
            strategy.rules = data['rules']

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Strategy updated successfully',
            'data': strategy.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'Server Error',
            'message': str(e)
        }), 500


@app.route('/api/strategies/<strategy_id>', methods=['DELETE'])
@require_auth
def delete_strategy(strategy_id):
    """Delete a strategy"""
    strategy = Strategy.query.get(strategy_id)

    if not strategy:
        return jsonify({
            'error': 'Not Found',
            'message': f'Strategy with ID {strategy_id} not found'
        }), 404

    # Check ownership
    if strategy.user_id != g.user.id:
        return jsonify({
            'error': 'Forbidden',
            'message': 'You can only delete your own strategies'
        }), 403

    db.session.delete(strategy)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Strategy deleted successfully'
    })


# --------------------------------------------
# Backtest Routes
# --------------------------------------------

@app.route('/api/backtest', methods=['POST'])
@require_pro
def run_backtest():
    """Run a backtest simulation"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'error': 'Bad Request',
                'message': 'Request body is required'
            }), 400

        # Required parameters
        strategy_id = data.get('strategy_id')
        strategy_config = data.get('strategy_config')

        if not strategy_id and not strategy_config:
            return jsonify({
                'error': 'Bad Request',
                'message': 'Either strategy_id or strategy_config is required'
            }), 400

        # Backtest parameters
        start_date = data.get('start_date', '2023-01-01')
        end_date = data.get('end_date', '2024-12-31')
        initial_capital = data.get('initial_capital', 10000)
        markets = data.get('markets', ['BTC/USD'])

        # Simulate backtest results (in production, run actual backtest)
        backtest_id = f'bt_{uuid.uuid4().hex[:12]}'

        # Generate simulated results
        total_trades = random.randint(100, 500)
        win_rate = random.uniform(0.55, 0.85)
        winning_trades = int(total_trades * win_rate)
        losing_trades = total_trades - winning_trades

        avg_win = random.uniform(0.03, 0.08)
        avg_loss = random.uniform(0.02, 0.05)

        total_return = (winning_trades * avg_win) - (losing_trades * avg_loss)
        final_capital = initial_capital * (1 + total_return)

        results = {
            'backtest_id': backtest_id,
            'strategy_id': strategy_id,
            'status': 'completed',
            'parameters': {
                'start_date': start_date,
                'end_date': end_date,
                'initial_capital': initial_capital,
                'markets': markets,
            },
            'results': {
                'total_trades': total_trades,
                'winning_trades': winning_trades,
                'losing_trades': losing_trades,
                'win_rate': round(win_rate, 4),
                'avg_win': round(avg_win, 4),
                'avg_loss': round(avg_loss, 4),
                'profit_factor': round((winning_trades * avg_win) / (losing_trades * avg_loss), 2),
                'total_return': round(total_return, 4),
                'total_return_pct': round(total_return * 100, 2),
                'initial_capital': initial_capital,
                'final_capital': round(final_capital, 2),
                'max_drawdown': round(random.uniform(0.05, 0.20), 4),
                'sharpe_ratio': round(random.uniform(1.2, 3.0), 2),
                'sortino_ratio': round(random.uniform(1.5, 4.0), 2),
                'max_consecutive_wins': random.randint(5, 20),
                'max_consecutive_losses': random.randint(2, 8),
                'avg_trade_duration': random.randint(300, 86400),  # seconds
            },
            'equity_curve': [
                {'date': f'2023-{str(i).zfill(2)}-01', 'equity': initial_capital * (1 + total_return * i / 24)}
                for i in range(25)
            ],
            'created_at': datetime.now().isoformat(),
            'completed_at': datetime.now().isoformat(),
        }

        # Store results in database
        backtest = BacktestResult(
            id=backtest_id,
            user_id=g.user.id if hasattr(g, 'user') and g.user else None,
            strategy_id=strategy_id,
            status='completed',
            parameters=results['parameters'],
            results=results['results'],
            equity_curve=results['equity_curve'],
        )
        db.session.add(backtest)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Backtest completed successfully',
            'data': results
        })

    except Exception as e:
        return jsonify({
            'error': 'Backtest Error',
            'message': str(e)
        }), 500


@app.route('/api/backtest/<backtest_id>', methods=['GET'])
@require_auth
def get_backtest_results(backtest_id):
    """Get backtest results by ID"""
    backtest = BacktestResult.query.get(backtest_id)

    if not backtest:
        return jsonify({
            'error': 'Not Found',
            'message': f'Backtest with ID {backtest_id} not found'
        }), 404

    return jsonify({
        'success': True,
        'data': backtest.to_dict()
    })


# --------------------------------------------
# Market Data Routes
# --------------------------------------------

@app.route('/api/markets/kalshi', methods=['POST'])
def get_kalshi_markets():
    """Fetch markets from Kalshi API."""
    try:
        from services.market_data_service import fetch_kalshi_markets

        data = request.get_json() or {}
        category = data.get('category')
        limit = data.get('limit', 100)
        status = data.get('status', 'open')

        markets = fetch_kalshi_markets(category=category, limit=limit, status=status)

        return jsonify({
            'success': True,
            'markets': markets,
            'count': len(markets),
        })

    except Exception as e:
        return jsonify({
            'error': 'Market Data Error',
            'message': str(e)
        }), 500


@app.route('/api/markets/manifold', methods=['POST'])
def get_manifold_markets():
    """Fetch markets from Manifold Markets API."""
    try:
        from services.market_data_service import fetch_manifold_markets

        data = request.get_json() or {}
        category = data.get('category')
        limit = data.get('limit', 100)
        sort = data.get('sort', 'liquidity')

        markets = fetch_manifold_markets(category=category, limit=limit, sort=sort)

        return jsonify({
            'success': True,
            'markets': markets,
            'count': len(markets),
        })

    except Exception as e:
        return jsonify({
            'error': 'Market Data Error',
            'message': str(e)
        }), 500


@app.route('/api/markets/history', methods=['POST'])
def get_market_history():
    """Get historical price data for a market."""
    try:
        from services.market_data_service import get_historical_prices

        data = request.get_json() or {}
        market_id = data.get('marketId')
        platform = data.get('platform')
        days = data.get('days', 180)

        if not market_id or not platform:
            return jsonify({
                'error': 'Bad Request',
                'message': 'marketId and platform are required'
            }), 400

        history = get_historical_prices(market_id, platform, days)

        return jsonify({
            'success': True,
            **history,
        })

    except Exception as e:
        return jsonify({
            'error': 'Market Data Error',
            'message': str(e)
        }), 500


@app.route('/api/markets/arbitrage', methods=['GET'])
def find_arbitrage():
    """Find arbitrage opportunities between platforms."""
    try:
        from services.market_data_service import find_arbitrage_opportunities

        min_edge = float(request.args.get('min_edge', 0.02))
        opportunities = find_arbitrage_opportunities(min_edge=min_edge)

        return jsonify({
            'success': True,
            'opportunities': opportunities,
            'count': len(opportunities),
        })

    except Exception as e:
        return jsonify({
            'error': 'Arbitrage Error',
            'message': str(e)
        }), 500


# --------------------------------------------
# Historical Backtest Routes
# --------------------------------------------

@app.route('/api/backtest/strategy/<strategy_name>', methods=['POST'])
def run_strategy_backtest(strategy_name):
    """Run backtest for a specific strategy template."""
    try:
        from services.backtest_runner import BacktestRunner

        data = request.get_json() or {}
        days = data.get('days', 180)
        initial_capital = data.get('initialCapital', 10000)

        runner = BacktestRunner(initial_capital=initial_capital, days=days)
        result = runner.run_backtest(strategy_name)

        return jsonify({
            'success': True,
            'strategy': strategy_name,
            'results': result.to_dict(),
        })

    except Exception as e:
        return jsonify({
            'error': 'Backtest Error',
            'message': str(e)
        }), 500


@app.route('/api/backtest/all', methods=['POST'])
def run_all_backtests():
    """Run backtests for all strategy templates."""
    try:
        from services.backtest_runner import run_all_strategy_backtests

        data = request.get_json() or {}
        days = data.get('days', 180)
        initial_capital = data.get('initialCapital', 10000)

        results = run_all_strategy_backtests(
            initial_capital=initial_capital,
            days=days
        )

        return jsonify({
            'success': True,
            'results': {name: result.to_dict() for name, result in results.items()},
            'count': len(results),
        })

    except Exception as e:
        return jsonify({
            'error': 'Backtest Error',
            'message': str(e)
        }), 500


@app.route('/api/backtest/cached', methods=['GET'])
def get_cached_backtests():
    """Get pre-computed backtest statistics for all strategies."""
    try:
        from services.backtest_runner import PRECOMPUTED_BACKTEST_STATS

        return jsonify({
            'success': True,
            'strategies': PRECOMPUTED_BACKTEST_STATS,
        })

    except Exception as e:
        return jsonify({
            'error': 'Cache Error',
            'message': str(e)
        }), 500


@app.route('/api/backtest/stats/<strategy_name>', methods=['GET'])
def get_strategy_stats(strategy_name):
    """Get backtest statistics for a specific strategy."""
    try:
        from services.backtest_runner import PRECOMPUTED_BACKTEST_STATS, get_strategy_backtest_stats

        # First check pre-computed stats
        if strategy_name in PRECOMPUTED_BACKTEST_STATS:
            return jsonify({
                'success': True,
                'strategy': strategy_name,
                'stats': PRECOMPUTED_BACKTEST_STATS[strategy_name],
                'source': 'cached',
            })

        # Otherwise, compute fresh
        days = int(request.args.get('days', 180))
        stats = get_strategy_backtest_stats(strategy_name, days=days)

        return jsonify({
            'success': True,
            'strategy': strategy_name,
            'stats': stats,
            'source': 'computed',
        })

    except Exception as e:
        return jsonify({
            'error': 'Stats Error',
            'message': str(e)
        }), 500


# --------------------------------------------
# Real Historical Backtest Routes
# --------------------------------------------

@app.route('/api/backtest/real/run', methods=['POST'])
def run_real_backtest():
    """Run real backtests using historical market data from Kalshi/Manifold."""
    try:
        from services.real_backtest_engine import RealBacktestEngine, STRATEGY_CONFIGS

        data = request.get_json() or {}
        strategy_name = data.get('strategyName')
        days = data.get('days', 180)
        initial_capital = data.get('initialCapital', 10000)

        if not strategy_name:
            return jsonify({
                'error': 'Bad Request',
                'message': 'strategyName is required'
            }), 400

        if strategy_name not in STRATEGY_CONFIGS:
            return jsonify({
                'error': 'Bad Request',
                'message': f'Unknown strategy: {strategy_name}. Available: {list(STRATEGY_CONFIGS.keys())}'
            }), 400

        engine = RealBacktestEngine(initial_capital=initial_capital, days=days)
        result = engine.run_backtest(strategy_name)

        return jsonify({
            'success': True,
            'strategy': strategy_name,
            'results': result.to_dict(),
            'frontendStats': result.to_frontend_format(),
        })

    except Exception as e:
        return jsonify({
            'error': 'Real Backtest Error',
            'message': str(e)
        }), 500


@app.route('/api/backtest/real/all', methods=['POST'])
def run_all_real_backtests_endpoint():
    """Run real backtests for all strategies using historical market data."""
    try:
        from services.real_backtest_engine import run_all_real_backtests

        data = request.get_json() or {}
        days = data.get('days', 180)
        initial_capital = data.get('initialCapital', 10000)

        results = run_all_real_backtests(
            initial_capital=initial_capital,
            days=days
        )

        return jsonify({
            'success': True,
            'results': {name: result.to_dict() for name, result in results.items()},
            'frontendStats': {name: result.to_frontend_format() for name, result in results.items()},
            'count': len(results),
        })

    except Exception as e:
        return jsonify({
            'error': 'Real Backtest Error',
            'message': str(e)
        }), 500


@app.route('/api/backtest/real/refresh', methods=['POST'])
def refresh_real_backtest_data():
    """Refresh historical data and re-run all backtests."""
    try:
        from services.historical_data_collector import HistoricalDataCollector
        from services.real_backtest_engine import run_all_real_backtests
        import json

        # Clear cache and fetch fresh data
        collector = HistoricalDataCollector(cache_enabled=False)
        data = collector.fetch_all_historical_data(days=180)

        # Run backtests on fresh data
        results = run_all_real_backtests(initial_capital=10000, days=180)

        # Save results to file
        import os
        filepath = os.path.join(
            os.path.dirname(__file__), 'data',
            'real_backtest_results.json'
        )
        os.makedirs(os.path.dirname(filepath), exist_ok=True)

        export_data = {
            'generated_at': datetime.now().isoformat(),
            'days_analyzed': 180,
            'markets_fetched': {
                'kalshi': len(data['kalshi']),
                'manifold': len(data['manifold']),
                'total': len(data['all']),
            },
            'results': {name: result.to_dict() for name, result in results.items()},
            'frontend_stats': {name: result.to_frontend_format() for name, result in results.items()},
        }

        with open(filepath, 'w') as f:
            json.dump(export_data, f, indent=2)

        return jsonify({
            'success': True,
            'message': 'Backtest data refreshed successfully',
            'marketsFetched': export_data['markets_fetched'],
            'frontendStats': export_data['frontend_stats'],
        })

    except Exception as e:
        return jsonify({
            'error': 'Refresh Error',
            'message': str(e)
        }), 500


@app.route('/api/backtest/real/cached', methods=['GET'])
def get_cached_real_backtest():
    """Get cached real backtest results from file."""
    try:
        import json
        import os

        filepath = os.path.join(
            os.path.dirname(__file__), 'data',
            'real_backtest_results.json'
        )

        if not os.path.exists(filepath):
            return jsonify({
                'success': False,
                'message': 'No cached results. Call /api/backtest/real/refresh first.',
            }), 404

        with open(filepath, 'r') as f:
            data = json.load(f)

        return jsonify({
            'success': True,
            'generatedAt': data.get('generated_at'),
            'daysAnalyzed': data.get('days_analyzed'),
            'marketsFetched': data.get('markets_fetched'),
            'frontendStats': data.get('frontend_stats'),
        })

    except Exception as e:
        return jsonify({
            'error': 'Cache Error',
            'message': str(e)
        }), 500


# --------------------------------------------
# Strategy Execution Routes
# --------------------------------------------

# In-memory storage for running strategies
running_executors = {}


@app.route('/api/executor/strategy-types', methods=['GET'])
def get_strategy_types():
    """Get available strategy types with descriptions."""
    strategy_types = [
        {
            'id': 'arbitrage',
            'name': 'Arbitrage',
            'icon': '🔄',
            'description': 'Find price differences across platforms',
            'details': 'Scans for price discrepancies between Kalshi and Manifold Markets, executing offsetting trades to lock in risk-free profits.',
            'features': [
                'Cross-platform price scanning',
                'Automatic market matching',
                'Risk-free profit when both legs fill',
                'Best for: Low-risk, consistent returns',
            ],
            'risk_level': 'low',
            'recommended_settings': {
                'minEdge': 2.0,
                'maxPosition': 200,
                'kellyFraction': 0.5,
            },
        },
        {
            'id': 'momentum',
            'name': 'Momentum',
            'icon': '📈',
            'description': 'Follow market trends and momentum',
            'details': 'Identifies and follows price trends using rate of change and volume analysis. Enters when strong momentum is confirmed.',
            'features': [
                'Trend detection with lookback periods',
                'Volume spike confirmation',
                'Moving average crossovers',
                'Best for: Trending markets',
            ],
            'risk_level': 'medium',
            'recommended_settings': {
                'minEdge': 1.5,
                'maxPosition': 300,
                'kellyFraction': 0.4,
                'lookbackPeriods': 10,
            },
        },
        {
            'id': 'mean-reversion',
            'name': 'Mean Reversion',
            'icon': '🎯',
            'description': 'Trade when prices deviate from average',
            'details': 'Uses Z-score and Bollinger Band analysis to identify overbought/oversold conditions, betting on price returning to historical mean.',
            'features': [
                'Statistical deviation detection',
                'Z-score based entries',
                'Bollinger Band analysis',
                'Best for: Range-bound markets',
            ],
            'risk_level': 'medium',
            'recommended_settings': {
                'minEdge': 2.0,
                'maxPosition': 250,
                'kellyFraction': 0.35,
                'zScoreThreshold': 2.0,
            },
        },
        {
            'id': 'news-based',
            'name': 'News Based',
            'icon': '📰',
            'description': 'React to news and events',
            'details': 'Monitors news feeds and analyzes sentiment to trade on market-moving events. Speed is critical for first-mover advantage.',
            'features': [
                'Real-time news monitoring',
                'Sentiment analysis',
                'Keyword and topic matching',
                'Best for: Event-driven markets',
            ],
            'risk_level': 'high',
            'recommended_settings': {
                'minEdge': 1.0,
                'maxPosition': 200,
                'kellyFraction': 0.3,
                'sentimentThreshold': 0.6,
            },
        },
        {
            'id': 'market-making',
            'name': 'Market Making',
            'icon': '💹',
            'description': 'Provide liquidity and capture spreads',
            'details': 'Places both buy and sell orders around fair value, earning the spread when both orders fill. Requires active inventory management.',
            'features': [
                'Bid-ask spread capture',
                'Fair value estimation',
                'Inventory risk management',
                'Best for: High-frequency, liquid markets',
            ],
            'risk_level': 'medium-high',
            'recommended_settings': {
                'minEdge': 0.5,
                'maxPosition': 100,
                'kellyFraction': 0.25,
                'targetSpread': 3.0,
            },
        },
    ]

    return jsonify({
        'success': True,
        'strategyTypes': strategy_types,
    })


@app.route('/api/executor/create', methods=['POST'])
@require_pro
def create_executor():
    """Create and start a new strategy executor."""
    try:
        from services.strategies import StrategyExecutor

        data = request.get_json()

        if not data:
            return jsonify({
                'error': 'Bad Request',
                'message': 'Strategy configuration is required'
            }), 400

        # Create executor from user config
        paper_trading = data.get('paperTrading', True)
        executor = StrategyExecutor.from_user_config(data, paper_trading=paper_trading)

        # Generate executor ID
        executor_id = f'exec_{uuid.uuid4().hex[:12]}'

        # Store executor
        running_executors[executor_id] = {
            'executor': executor,
            'user_id': g.user['id'],
            'created_at': datetime.now().isoformat(),
            'config': data,
        }

        return jsonify({
            'success': True,
            'message': 'Strategy executor created',
            'executorId': executor_id,
            'status': executor.get_status(),
        }), 201

    except ValueError as e:
        return jsonify({
            'error': 'Configuration Error',
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'error': 'Server Error',
            'message': str(e)
        }), 500


@app.route('/api/executor/<executor_id>/start', methods=['POST'])
@require_pro
def start_executor(executor_id):
    """Start a strategy executor."""
    try:
        import asyncio

        executor_data = running_executors.get(executor_id)

        if not executor_data:
            return jsonify({
                'error': 'Not Found',
                'message': f'Executor {executor_id} not found'
            }), 404

        if executor_data['user_id'] != g.user['id']:
            return jsonify({
                'error': 'Forbidden',
                'message': 'You can only control your own executors'
            }), 403

        executor = executor_data['executor']

        # Start the executor (would use asyncio in production)
        # For now, just update status
        executor.status = executor.status.__class__('running')
        executor.started_at = datetime.utcnow()
        executor.strategy.is_running = True

        return jsonify({
            'success': True,
            'message': 'Executor started',
            'status': executor.get_status(),
        })

    except Exception as e:
        return jsonify({
            'error': 'Start Error',
            'message': str(e)
        }), 500


@app.route('/api/executor/<executor_id>/stop', methods=['POST'])
@require_pro
def stop_executor(executor_id):
    """Stop a strategy executor."""
    try:
        executor_data = running_executors.get(executor_id)

        if not executor_data:
            return jsonify({
                'error': 'Not Found',
                'message': f'Executor {executor_id} not found'
            }), 404

        if executor_data['user_id'] != g.user['id']:
            return jsonify({
                'error': 'Forbidden',
                'message': 'You can only control your own executors'
            }), 403

        executor = executor_data['executor']
        executor.status = executor.status.__class__('stopped')
        executor.stopped_at = datetime.utcnow()
        executor.strategy.is_running = False

        return jsonify({
            'success': True,
            'message': 'Executor stopped',
            'status': executor.get_status(),
        })

    except Exception as e:
        return jsonify({
            'error': 'Stop Error',
            'message': str(e)
        }), 500


@app.route('/api/executor/<executor_id>/pause', methods=['POST'])
@require_pro
def pause_executor(executor_id):
    """Pause a strategy executor."""
    try:
        executor_data = running_executors.get(executor_id)

        if not executor_data:
            return jsonify({
                'error': 'Not Found',
                'message': f'Executor {executor_id} not found'
            }), 404

        if executor_data['user_id'] != g.user['id']:
            return jsonify({
                'error': 'Forbidden',
                'message': 'You can only control your own executors'
            }), 403

        executor = executor_data['executor']
        executor.status = executor.status.__class__('paused')
        executor.strategy.is_running = False

        return jsonify({
            'success': True,
            'message': 'Executor paused',
            'status': executor.get_status(),
        })

    except Exception as e:
        return jsonify({
            'error': 'Pause Error',
            'message': str(e)
        }), 500


@app.route('/api/executor/<executor_id>/resume', methods=['POST'])
@require_pro
def resume_executor(executor_id):
    """Resume a paused strategy executor."""
    try:
        executor_data = running_executors.get(executor_id)

        if not executor_data:
            return jsonify({
                'error': 'Not Found',
                'message': f'Executor {executor_id} not found'
            }), 404

        if executor_data['user_id'] != g.user['id']:
            return jsonify({
                'error': 'Forbidden',
                'message': 'You can only control your own executors'
            }), 403

        executor = executor_data['executor']

        if executor.status.value != 'paused':
            return jsonify({
                'error': 'Bad Request',
                'message': 'Executor is not paused'
            }), 400

        executor.status = executor.status.__class__('running')
        executor.strategy.is_running = True

        return jsonify({
            'success': True,
            'message': 'Executor resumed',
            'status': executor.get_status(),
        })

    except Exception as e:
        return jsonify({
            'error': 'Resume Error',
            'message': str(e)
        }), 500


@app.route('/api/executor/<executor_id>/status', methods=['GET'])
@require_auth
def get_executor_status(executor_id):
    """Get status of a strategy executor."""
    try:
        executor_data = running_executors.get(executor_id)

        if not executor_data:
            return jsonify({
                'error': 'Not Found',
                'message': f'Executor {executor_id} not found'
            }), 404

        if executor_data['user_id'] != g.user['id']:
            return jsonify({
                'error': 'Forbidden',
                'message': 'You can only view your own executors'
            }), 403

        executor = executor_data['executor']

        return jsonify({
            'success': True,
            'executorId': executor_id,
            'status': executor.get_status(),
            'performance': executor.get_performance_summary(),
        })

    except Exception as e:
        return jsonify({
            'error': 'Status Error',
            'message': str(e)
        }), 500


@app.route('/api/executor/<executor_id>', methods=['DELETE'])
@require_auth
def delete_executor(executor_id):
    """Delete a strategy executor (keeps trade history)."""
    try:
        executor_data = running_executors.get(executor_id)

        if not executor_data:
            return jsonify({
                'error': 'Not Found',
                'message': f'Executor {executor_id} not found'
            }), 404

        if executor_data['user_id'] != g.user['id']:
            return jsonify({
                'error': 'Forbidden',
                'message': 'You can only delete your own executors'
            }), 403

        # Get final status before deletion
        executor = executor_data['executor']
        final_status = executor.get_status()
        trade_history = executor.strategy.trade_history

        # Remove from running executors
        del running_executors[executor_id]

        return jsonify({
            'success': True,
            'message': 'Executor deleted',
            'finalStatus': final_status,
            'tradeHistory': trade_history,
        })

    except Exception as e:
        return jsonify({
            'error': 'Delete Error',
            'message': str(e)
        }), 500


@app.route('/api/executor/list', methods=['GET'])
@require_auth
def list_executors():
    """List all executors for the current user."""
    try:
        user_executors = []

        for executor_id, executor_data in running_executors.items():
            if executor_data['user_id'] == g.user['id']:
                executor = executor_data['executor']
                user_executors.append({
                    'executorId': executor_id,
                    'name': executor.config.name,
                    'strategyType': executor.config.strategy_type,
                    'status': executor.status.value,
                    'paperTrading': executor.paper_trading,
                    'createdAt': executor_data['created_at'],
                    'totalPnl': executor.total_pnl,
                    'totalTrades': executor.total_trades,
                    'openPositions': len(executor.strategy.positions),
                })

        return jsonify({
            'success': True,
            'executors': user_executors,
            'count': len(user_executors),
        })

    except Exception as e:
        return jsonify({
            'error': 'List Error',
            'message': str(e)
        }), 500


@app.route('/api/executor/<executor_id>/signals', methods=['GET'])
@require_auth
def get_executor_signals(executor_id):
    """Get recent signals from a strategy executor."""
    try:
        executor_data = running_executors.get(executor_id)

        if not executor_data:
            return jsonify({
                'error': 'Not Found',
                'message': f'Executor {executor_id} not found'
            }), 404

        if executor_data['user_id'] != g.user['id']:
            return jsonify({
                'error': 'Forbidden',
                'message': 'You can only view your own executors'
            }), 403

        executor = executor_data['executor']
        signals = [s.to_dict() for s in executor.strategy.signals[-50:]]

        return jsonify({
            'success': True,
            'signals': signals,
            'count': len(signals),
        })

    except Exception as e:
        return jsonify({
            'error': 'Signals Error',
            'message': str(e)
        }), 500


@app.route('/api/executor/<executor_id>/positions', methods=['GET'])
@require_auth
def get_executor_positions(executor_id):
    """Get open positions from a strategy executor."""
    try:
        executor_data = running_executors.get(executor_id)

        if not executor_data:
            return jsonify({
                'error': 'Not Found',
                'message': f'Executor {executor_id} not found'
            }), 404

        if executor_data['user_id'] != g.user['id']:
            return jsonify({
                'error': 'Forbidden',
                'message': 'You can only view your own executors'
            }), 403

        executor = executor_data['executor']
        positions = [p.to_dict() for p in executor.strategy.positions.values()]

        return jsonify({
            'success': True,
            'positions': positions,
            'count': len(positions),
        })

    except Exception as e:
        return jsonify({
            'error': 'Positions Error',
            'message': str(e)
        }), 500


@app.route('/api/executor/<executor_id>/trades', methods=['GET'])
@require_auth
def get_executor_trades(executor_id):
    """Get trade history from a strategy executor."""
    try:
        executor_data = running_executors.get(executor_id)

        if not executor_data:
            return jsonify({
                'error': 'Not Found',
                'message': f'Executor {executor_id} not found'
            }), 404

        if executor_data['user_id'] != g.user['id']:
            return jsonify({
                'error': 'Forbidden',
                'message': 'You can only view your own executors'
            }), 403

        executor = executor_data['executor']
        trades = executor.strategy.trade_history

        # Pagination
        limit = min(int(request.args.get('limit', 100)), 500)
        offset = int(request.args.get('offset', 0))

        paginated_trades = trades[offset:offset + limit]

        return jsonify({
            'success': True,
            'trades': paginated_trades,
            'total': len(trades),
            'limit': limit,
            'offset': offset,
        })

    except Exception as e:
        return jsonify({
            'error': 'Trades Error',
            'message': str(e)
        }), 500


# --------------------------------------------
# Error Handlers
# --------------------------------------------

@app.errorhandler(400)
def bad_request(e):
    return jsonify({
        'error': 'Bad Request',
        'message': str(e)
    }), 400


@app.errorhandler(401)
def unauthorized(e):
    return jsonify({
        'error': 'Unauthorized',
        'message': 'Authentication required'
    }), 401


@app.errorhandler(403)
def forbidden(e):
    return jsonify({
        'error': 'Forbidden',
        'message': 'Access denied'
    }), 403


@app.errorhandler(404)
def not_found(e):
    return jsonify({
        'error': 'Not Found',
        'message': 'Resource not found'
    }), 404


@app.errorhandler(500)
def internal_error(e):
    return jsonify({
        'error': 'Internal Server Error',
        'message': 'An unexpected error occurred'
    }), 500


# ============================================
# PAPER TRADING API ENDPOINTS
# ============================================

@app.route('/api/paper/portfolio', methods=['GET'])
@token_required
def get_paper_portfolio():
    """Get user's paper trading portfolio."""
    try:
        summary = PaperTradingService.get_portfolio_summary(g.current_user.id)
        return jsonify(summary), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/paper/portfolio/reset', methods=['POST'])
@token_required
def reset_paper_portfolio():
    """Reset paper trading portfolio to starting balance."""
    try:
        portfolio = PaperTradingService.reset_portfolio(g.current_user.id)
        return jsonify({
            'message': 'Portfolio reset to $100,000',
            'portfolio': portfolio.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/paper/trade', methods=['POST'])
@token_required
def execute_paper_trade():
    """
    Execute a paper trade.
    
    Request body:
    {
        "platform": "kalshi",
        "marketId": "MARKET-123",
        "marketTitle": "Will X happen?",
        "side": "yes",
        "action": "buy",
        "quantity": 10,
        "price": 0.65,  // optional
        "strategyId": "strat_123"  // optional
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required = ['platform', 'marketId', 'marketTitle', 'side', 'action', 'quantity']
        for field in required:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        if data['side'] not in ['yes', 'no']:
            return jsonify({'error': 'Side must be "yes" or "no"'}), 400
        
        if data['action'] not in ['buy', 'sell']:
            return jsonify({'error': 'Action must be "buy" or "sell"'}), 400
        
        if not isinstance(data['quantity'], int) or data['quantity'] <= 0:
            return jsonify({'error': 'Quantity must be a positive integer'}), 400
        
        success, message, trade = PaperTradingService.execute_trade(
            user_id=g.current_user.id,
            platform=data['platform'],
            market_id=data['marketId'],
            market_title=data['marketTitle'],
            side=data['side'],
            action=data['action'],
            quantity=data['quantity'],
            price=data.get('price'),
            strategy_id=data.get('strategyId'),
        )
        
        if success:
            summary = PaperTradingService.get_portfolio_summary(g.current_user.id)
            return jsonify({
                'message': message,
                'trade': trade.to_dict() if trade else None,
                'portfolio': summary['portfolio'],
            }), 200
        else:
            return jsonify({'error': message}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/paper/positions', methods=['GET'])
@token_required
def get_paper_positions():
    """Get all open positions."""
    try:
        positions = PaperTradingService.get_open_positions(g.current_user.id)
        return jsonify({'positions': positions}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/paper/positions/<position_id>/close', methods=['POST'])
@token_required
def close_paper_position(position_id):
    """Close an open position at current market price."""
    try:
        success, message = PaperTradingService.close_position(g.current_user.id, position_id)
        
        if success:
            summary = PaperTradingService.get_portfolio_summary(g.current_user.id)
            return jsonify({
                'message': message,
                'portfolio': summary['portfolio'],
            }), 200
        else:
            return jsonify({'error': message}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/paper/trades', methods=['GET'])
@token_required
def get_paper_trades():
    """Get paper trade history."""
    try:
        limit = request.args.get('limit', 50, type=int)
        trades = PaperTradingService.get_trade_history(g.current_user.id, limit=limit)
        return jsonify({'trades': trades}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/paper/quick-buy', methods=['POST'])
@token_required
def paper_quick_buy():
    """
    Quick buy for strategy execution.
    Calculates quantity from dollar amount.
    
    Request body:
    {
        "platform": "kalshi",
        "marketId": "MARKET-123",
        "marketTitle": "Will X happen?",
        "side": "yes",
        "amount": 100,  // Dollar amount
        "strategyId": "strat_123"  // optional
    }
    """
    try:
        data = request.get_json()
        
        # Get current price
        price = PaperTradingService.get_market_price(
            data.get('platform', 'kalshi'),
            data.get('marketId')
        )
        
        trade_price = price if data.get('side') == 'yes' else (1 - price)
        amount = data.get('amount', 100)
        quantity = int(amount / trade_price)
        
        if quantity <= 0:
            return jsonify({'error': 'Amount too small for trade'}), 400
        
        success, message, trade = PaperTradingService.execute_trade(
            user_id=g.current_user.id,
            platform=data.get('platform', 'kalshi'),
            market_id=data.get('marketId'),
            market_title=data.get('marketTitle', 'Unknown Market'),
            side=data.get('side', 'yes'),
            action='buy',
            quantity=quantity,
            price=trade_price,
            strategy_id=data.get('strategyId'),
        )
        
        if success:
            summary = PaperTradingService.get_portfolio_summary(g.current_user.id)
            return jsonify({
                'message': message,
                'trade': trade.to_dict() if trade else None,
                'portfolio': summary['portfolio'],
            }), 200
        else:
            return jsonify({'error': message}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================
# Run Server
# ============================================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'

    print(f"""
    ╔══════════════════════════════════════════╗
    ║       ToTheMoon API Server v1.0.0        ║
    ╠══════════════════════════════════════════╣
    ║  Running on: http://localhost:{port}        ║
    ║  Debug mode: {debug}                       ║
    ╚══════════════════════════════════════════╝
    """)

    app.run(host='0.0.0.0', port=port, debug=debug)

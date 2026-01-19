"""
ToTheMoon API Server
Flask backend with subscription, strategies, and backtesting endpoints
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

# Initialize Flask app
app = Flask(__name__)

# CORS configuration - allow frontend origins
ALLOWED_ORIGINS = [
    'http://localhost:5173',      # Vite dev server
    'http://localhost:3000',      # Alternative dev server
    'https://to-the-moon-yoursite.com',  # Production frontend
]

# Add any origins from environment variable
if os.environ.get('ALLOWED_ORIGINS'):
    ALLOWED_ORIGINS.extend(os.environ.get('ALLOWED_ORIGINS').split(','))

CORS(app,
     origins=ALLOWED_ORIGINS,
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization'],
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

# In-memory storage (replace with database in production)
# Users are now stored with hashed passwords
users_db = {}
users_by_email = {}  # Index for quick email lookup

# Create demo user with hashed password
demo_password_hash = bcrypt.hashpw('demo123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
demo_user = {
    'id': 'user_1',
    'email': 'demo@example.com',
    'username': 'DemoUser',
    'password_hash': demo_password_hash,
    'tier': 'pro',
    'created_at': datetime.now().isoformat(),
    'subscription': {
        'id': 'sub_demo123',
        'status': 'active',
        'expires_at': (datetime.now() + timedelta(days=30)).isoformat(),
        'renews_at': (datetime.now() + timedelta(days=30)).isoformat(),
        'billing_cycle': 'monthly',
        'price': 9.99,
    }
}
users_db['user_1'] = demo_user
users_by_email['demo@example.com'] = demo_user

strategies_db = {}
backtest_results_db = {}
waitlist_db = {}  # Email waitlist storage

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


def sanitize_user(user):
    """Remove sensitive fields from user object for API response."""
    return {
        'id': user['id'],
        'email': user['email'],
        'username': user.get('username'),
        'tier': user.get('tier', 'free'),
        'created_at': user.get('created_at'),
    }


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

    # Look up user in database
    user = users_db.get(user_id)
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

        if user.get('tier') != 'pro':
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
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
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
        if email in waitlist_db:
            return jsonify({
                'success': True,
                'message': 'You are already on the waitlist!'
            })

        # Add to waitlist
        waitlist_db[email] = {
            'email': email,
            'joined_at': datetime.now().isoformat(),
        }

        return jsonify({
            'success': True,
            'message': 'Successfully joined the waitlist!'
        }), 201

    except Exception as e:
        return jsonify({
            'error': 'Server Error',
            'message': str(e)
        }), 500


@app.route('/api/waitlist/count', methods=['GET'])
def get_waitlist_count():
    """Get total number of waitlist signups."""
    return jsonify({
        'count': len(waitlist_db) + 500  # Add base count for social proof
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
        if email in users_by_email:
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
        for user in users_db.values():
            if user.get('username', '').lower() == username.lower():
                return jsonify({
                    'error': 'Conflict',
                    'message': 'This username is already taken'
                }), 409

        # Create new user
        user_id = f'user_{uuid.uuid4().hex[:12]}'
        password_hash = hash_password(password)

        new_user = {
            'id': user_id,
            'email': email,
            'username': username,
            'password_hash': password_hash,
            'tier': 'free',
            'created_at': datetime.now().isoformat(),
            'subscription': None,
        }

        # Store user
        users_db[user_id] = new_user
        users_by_email[email] = new_user

        # Generate JWT token
        access_token = generate_jwt_token(user_id)

        return jsonify({
            'success': True,
            'message': 'Account created successfully',
            'access_token': access_token,
            'user': sanitize_user(new_user)
        }), 201

    except Exception as e:
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

        # Find user by email
        user = users_by_email.get(email)

        if not user:
            return jsonify({
                'error': 'Unauthorized',
                'message': 'Invalid email or password'
            }), 401

        # Verify password
        if not verify_password(password, user['password_hash']):
            return jsonify({
                'error': 'Unauthorized',
                'message': 'Invalid email or password'
            }), 401

        # Generate JWT token
        access_token = generate_jwt_token(user['id'])

        return jsonify({
            'success': True,
            'message': 'Login successful',
            'access_token': access_token,
            'user': sanitize_user(user)
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

    # Include subscription details
    subscription = user.get('subscription')
    subscription_info = None

    if subscription:
        subscription_info = {
            'id': subscription.get('id'),
            'status': subscription.get('status'),
            'expires_at': subscription.get('expires_at'),
            'renews_at': subscription.get('renews_at'),
        }

    return jsonify({
        'success': True,
        'user': {
            **sanitize_user(user),
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
    new_token = generate_jwt_token(user['id'])

    return jsonify({
        'success': True,
        'access_token': new_token,
        'user': sanitize_user(user)
    })


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

    subscription = user.get('subscription', {})
    tier = user.get('tier', 'free')

    # Define features by tier
    free_features = ['dashboard', 'accounts', 'leaderboard', 'marketplace-browse', 'paper-trading']
    pro_features = free_features + [
        'strategy-builder', 'live-trading', 'advanced-analytics',
        'priority-support', 'api-access', 'custom-alerts', 'backtesting'
    ]

    return jsonify({
        'tier': tier,
        'expires_at': subscription.get('expires_at'),
        'renews_at': subscription.get('renews_at'),
        'cancelled_at': subscription.get('cancelled_at'),
        'billing_cycle': subscription.get('billing_cycle', 'monthly'),
        'price': subscription.get('price', 9.99),
        'features': pro_features if tier == 'pro' else free_features,
        'subscription_id': subscription.get('id')
    })


@app.route('/api/subscription/upgrade', methods=['POST'])
@require_auth
def upgrade_subscription():
    """Upgrade user to Pro tier"""
    user = g.user

    # In production, this would process payment through Stripe
    # For demo, just upgrade the user

    user['tier'] = 'pro'
    user['subscription'] = {
        'id': f'sub_{uuid.uuid4().hex[:12]}',
        'status': 'active',
        'expires_at': (datetime.now() + timedelta(days=30)).isoformat(),
        'renews_at': (datetime.now() + timedelta(days=30)).isoformat(),
        'billing_cycle': 'monthly',
        'price': 9.99,
    }

    return jsonify({
        'success': True,
        'message': 'Successfully upgraded to Pro!',
        'tier': 'pro',
        'expires_at': user['subscription']['expires_at'],
        'renews_at': user['subscription']['renews_at'],
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

    if user.get('tier') != 'pro':
        return jsonify({
            'error': 'Bad Request',
            'message': 'No active subscription to cancel'
        }), 400

    subscription = user.get('subscription', {})
    subscription['cancelled_at'] = datetime.now().isoformat()
    subscription['status'] = 'cancelled'

    return jsonify({
        'success': True,
        'message': 'Subscription cancelled. Access continues until end of billing period.',
        'cancelled_at': subscription['cancelled_at'],
        'expires_at': subscription.get('expires_at')
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

    strategies = list(strategies_db.values())

    # Apply filters
    if category:
        strategies = [s for s in strategies if s.get('category') == category]
    if risk_profile:
        strategies = [s for s in strategies if s.get('risk_profile') == risk_profile]
    if difficulty:
        strategies = [s for s in strategies if s.get('difficulty') == difficulty]

    # Filter to public or user's own
    if user:
        strategies = [
            s for s in strategies
            if s.get('is_public') or s.get('user_id') == user['id']
        ]
    else:
        strategies = [s for s in strategies if s.get('is_public')]

    # Paginate
    total = len(strategies)
    strategies = strategies[offset:offset + limit]

    return jsonify({
        'success': True,
        'total': total,
        'limit': limit,
        'offset': offset,
        'data': strategies
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

        # Create strategy
        strategy_id = f'strat_{uuid.uuid4().hex[:12]}'
        strategy = {
            'id': strategy_id,
            'user_id': g.user['id'],
            'name': data.get('name'),
            'description': data.get('description', ''),
            'category': data.get('category', 'custom'),
            'risk_profile': data.get('risk_profile', 'moderate'),
            'difficulty': data.get('difficulty', 'intermediate'),
            'is_public': data.get('is_public', False),
            'config': {
                'min_edge': data.get('min_edge', 0.02),
                'max_position_size': data.get('max_position_size', 0.10),
                'max_daily_trades': data.get('max_daily_trades', 20),
                'stop_loss': data.get('stop_loss', 0.05),
                'take_profit': data.get('take_profit', 0.10),
                'allowed_markets': data.get('allowed_markets', ['crypto']),
            },
            'rules': {
                'entry': data.get('entry_rules', []),
                'exit': data.get('exit_rules', []),
            },
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
        }

        strategies_db[strategy_id] = strategy

        return jsonify({
            'success': True,
            'message': 'Strategy created successfully',
            'data': strategy
        }), 201

    except Exception as e:
        return jsonify({
            'error': 'Server Error',
            'message': str(e)
        }), 500


@app.route('/api/strategies/<strategy_id>', methods=['GET'])
def get_strategy(strategy_id):
    """Get strategy details by ID"""
    strategy = strategies_db.get(strategy_id)

    if not strategy:
        return jsonify({
            'error': 'Not Found',
            'message': f'Strategy with ID {strategy_id} not found'
        }), 404

    # Check access permissions
    user = get_current_user()
    if not strategy.get('is_public'):
        if not user or strategy.get('user_id') != user['id']:
            return jsonify({
                'error': 'Forbidden',
                'message': 'You do not have access to this strategy'
            }), 403

    return jsonify({
        'success': True,
        'data': strategy
    })


@app.route('/api/strategies/<strategy_id>', methods=['PUT'])
@require_auth
def update_strategy(strategy_id):
    """Update an existing strategy"""
    strategy = strategies_db.get(strategy_id)

    if not strategy:
        return jsonify({
            'error': 'Not Found',
            'message': f'Strategy with ID {strategy_id} not found'
        }), 404

    # Check ownership
    if strategy.get('user_id') != g.user['id']:
        return jsonify({
            'error': 'Forbidden',
            'message': 'You can only update your own strategies'
        }), 403

    try:
        data = request.get_json() or {}

        # Update allowed fields
        updatable_fields = [
            'name', 'description', 'category', 'risk_profile',
            'difficulty', 'is_public', 'config', 'rules'
        ]

        for field in updatable_fields:
            if field in data:
                strategy[field] = data[field]

        strategy['updated_at'] = datetime.now().isoformat()

        return jsonify({
            'success': True,
            'message': 'Strategy updated successfully',
            'data': strategy
        })

    except Exception as e:
        return jsonify({
            'error': 'Server Error',
            'message': str(e)
        }), 500


@app.route('/api/strategies/<strategy_id>', methods=['DELETE'])
@require_auth
def delete_strategy(strategy_id):
    """Delete a strategy"""
    strategy = strategies_db.get(strategy_id)

    if not strategy:
        return jsonify({
            'error': 'Not Found',
            'message': f'Strategy with ID {strategy_id} not found'
        }), 404

    # Check ownership
    if strategy.get('user_id') != g.user['id']:
        return jsonify({
            'error': 'Forbidden',
            'message': 'You can only delete your own strategies'
        }), 403

    del strategies_db[strategy_id]

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

        # Store results
        backtest_results_db[backtest_id] = results

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
    results = backtest_results_db.get(backtest_id)

    if not results:
        return jsonify({
            'error': 'Not Found',
            'message': f'Backtest with ID {backtest_id} not found'
        }), 404

    return jsonify({
        'success': True,
        'data': results
    })


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

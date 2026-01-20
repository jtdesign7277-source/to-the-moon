"""
Live Trading Routes
Handles real order execution on connected exchanges (Kalshi, etc.)
"""
from flask import Blueprint, request, jsonify, g
from datetime import datetime
from functools import wraps
import logging
import jwt
import os

from models import db, User, Trade, ConnectedAccount, Subscription
from services.kalshi_service import KalshiService

# Set up logging
logger = logging.getLogger(__name__)

live_trading_bp = Blueprint('live_trading', __name__)

# JWT Configuration
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-change-in-production')
JWT_ALGORITHM = 'HS256'


def require_auth(f):
    """Decorator to require valid JWT authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No valid authorization token provided'}), 401
        
        token = auth_header.split(' ')[1]
        
        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            user_id = payload.get('sub') or payload.get('user_id')
            
            if not user_id:
                return jsonify({'error': 'Invalid token payload'}), 401
            
            user = User.query.filter_by(id=user_id).first()
            
            if not user:
                return jsonify({'error': 'User not found'}), 401
            
            g.user = user
            return f(*args, **kwargs)
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError as e:
            return jsonify({'error': f'Invalid token: {str(e)}'}), 401
    
    return decorated


def require_pro(f):
    """Decorator to require Pro subscription."""
    @wraps(f)
    def decorated(*args, **kwargs):
        user = g.user
        
        # Check subscription status
        subscription = Subscription.query.filter_by(user_id=user.id).first()
        
        if subscription and subscription.is_pro:
            return f(*args, **kwargs)
        
        return jsonify({
            'error': 'Pro subscription required for live trading',
            'code': 'PRO_REQUIRED'
        }), 403
    
    return decorated


def get_kalshi_service(user_id: str) -> tuple:
    """
    Get a KalshiService instance for a user's connected account.
    
    Returns:
        Tuple of (service, account, error_message)
    """
    from api_server import decrypt_credentials
    
    account = ConnectedAccount.query.filter_by(
        user_id=user_id,
        platform='kalshi',
        status='connected'
    ).first()
    
    if not account:
        return None, None, 'No connected Kalshi account found'
    
    try:
        api_key_id = decrypt_credentials(account.api_key_id)
        api_secret = decrypt_credentials(account.api_secret)
        
        service = KalshiService(api_key_id, api_secret)
        return service, account, None
    except Exception as e:
        logger.error(f"Error initializing Kalshi service: {e}")
        return None, None, f'Failed to initialize Kalshi service: {str(e)}'


@live_trading_bp.route('/api/live/order', methods=['POST'])
@require_auth
@require_pro
def place_live_order():
    """
    Place a real order on Kalshi.
    
    Request body:
    {
        "ticker": "KXBTC-24JAN20-B50000",
        "action": "buy",  # "buy" or "sell"
        "side": "yes",    # "yes" or "no"
        "count": 10,      # number of contracts
        "type": "limit",  # "limit" or "market"
        "price": 45,      # price in cents (1-99) for limit orders
        "strategyId": "optional-strategy-id"
    }
    """
    user = g.user
    data = request.get_json() or {}
    
    # Validate required fields
    required = ['ticker', 'action', 'side', 'count']
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400
    
    # Get Kalshi service
    service, account, error = get_kalshi_service(user.id)
    if error:
        return jsonify({'error': error}), 400
    
    # Extract order parameters
    ticker = data['ticker']
    action = data['action']
    side = data['side']
    count = int(data['count'])
    order_type = data.get('type', 'limit')
    price = data.get('price')
    strategy_id = data.get('strategyId')
    
    # Safety check: ensure price is in valid range
    if order_type == 'limit':
        if price is None:
            return jsonify({'error': 'Price required for limit orders'}), 400
        price = int(price)
        if price < 1 or price > 99:
            return jsonify({'error': 'Price must be between 1 and 99 cents'}), 400
    
    # Safety check: max position size
    MAX_CONTRACTS_PER_ORDER = 100
    if count > MAX_CONTRACTS_PER_ORDER:
        return jsonify({'error': f'Max {MAX_CONTRACTS_PER_ORDER} contracts per order'}), 400
    
    # Calculate max cost for safety
    max_cost_cents = count * (price if price else 99)
    max_cost_dollars = max_cost_cents / 100
    
    # Get current balance to verify funds
    balance_success, balance_data = service.get_balance()
    if not balance_success:
        return jsonify({'error': 'Failed to verify account balance'}), 500
    
    available_balance = balance_data.get('availableBalance', 0)
    if action == 'buy' and max_cost_dollars > available_balance:
        return jsonify({
            'error': f'Insufficient funds. Need ${max_cost_dollars:.2f}, have ${available_balance:.2f}'
        }), 400
    
    # Place the order
    logger.info(f"Placing live order: {action} {count} {side} contracts on {ticker} at {price}¢")
    
    success, result = service.place_order(
        ticker=ticker,
        action=action,
        side=side,
        count=count,
        order_type=order_type,
        price=price
    )
    
    if not success:
        logger.error(f"Order failed: {result}")
        return jsonify({'error': result.get('error', 'Order placement failed')}), 400
    
    # Log the trade to database
    try:
        trade = Trade(
            user_id=user.id,
            strategy_id=strategy_id,
            pair=ticker,
            trade_type=f'{action}_{side}',
            entry=price / 100 if price else 0,
            amount=count,
            platform='kalshi',
            status='executed',
            is_paper=False,
            timestamp=datetime.utcnow()
        )
        db.session.add(trade)
        
        # Update account's last activity
        account.last_balance_update = datetime.utcnow()
        db.session.commit()
    except Exception as e:
        logger.error(f"Error logging trade: {e}")
        # Don't fail the request - order was already placed
    
    return jsonify({
        'success': True,
        'order': result,
        'message': f'Order placed: {action} {count} {side} @ {price}¢'
    }), 201


@live_trading_bp.route('/api/live/orders', methods=['GET'])
@require_auth
@require_pro
def get_live_orders():
    """Get user's orders on Kalshi."""
    user = g.user
    
    service, account, error = get_kalshi_service(user.id)
    if error:
        return jsonify({'error': error}), 400
    
    status = request.args.get('status')  # 'resting', 'executed', 'canceled'
    ticker = request.args.get('ticker')
    
    success, result = service.get_orders(status=status, ticker=ticker)
    
    if not success:
        return jsonify({'error': result.get('error', 'Failed to fetch orders')}), 500
    
    return jsonify({'orders': result.get('orders', [])})


@live_trading_bp.route('/api/live/orders/<order_id>', methods=['GET'])
@require_auth
@require_pro
def get_live_order(order_id):
    """Get a specific order by ID."""
    user = g.user
    
    service, account, error = get_kalshi_service(user.id)
    if error:
        return jsonify({'error': error}), 400
    
    success, result = service.get_order(order_id)
    
    if not success:
        return jsonify({'error': result.get('error', 'Order not found')}), 404
    
    return jsonify({'order': result})


@live_trading_bp.route('/api/live/orders/<order_id>', methods=['DELETE'])
@require_auth
@require_pro
def cancel_live_order(order_id):
    """Cancel an order."""
    user = g.user
    
    service, account, error = get_kalshi_service(user.id)
    if error:
        return jsonify({'error': error}), 400
    
    logger.info(f"Canceling order {order_id} for user {user.id}")
    
    success, result = service.cancel_order(order_id)
    
    if not success:
        return jsonify({'error': result.get('error', 'Failed to cancel order')}), 400
    
    return jsonify({'success': True, 'message': 'Order cancelled'})


@live_trading_bp.route('/api/live/markets', methods=['GET'])
@require_auth
def get_markets():
    """Get open markets (doesn't require connected account)."""
    from services.kalshi_service import KalshiService
    import requests
    
    # Public endpoint - no auth needed
    try:
        response = requests.get(
            'https://api.elections.kalshi.com/trade-api/v2/markets',
            params={'limit': 50, 'status': 'open'},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return jsonify({'markets': data.get('markets', [])})
        else:
            return jsonify({'error': 'Failed to fetch markets'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@live_trading_bp.route('/api/live/market/<ticker>', methods=['GET'])
@require_auth
def get_market(ticker):
    """Get market details by ticker."""
    import requests
    
    try:
        response = requests.get(
            f'https://api.elections.kalshi.com/trade-api/v2/markets/{ticker}',
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return jsonify({'market': data.get('market', data)})
        else:
            return jsonify({'error': 'Market not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@live_trading_bp.route('/api/live/positions', methods=['GET'])
@require_auth
@require_pro
def get_live_positions():
    """Get user's positions on Kalshi."""
    user = g.user
    
    service, account, error = get_kalshi_service(user.id)
    if error:
        return jsonify({'error': error}), 400
    
    success, result = service.get_positions()
    
    if not success:
        return jsonify({'error': result.get('error', 'Failed to fetch positions')}), 500
    
    return jsonify({
        'positions': result.get('positions', []),
        'count': result.get('count', 0)
    })


@live_trading_bp.route('/api/live/kill-switch', methods=['POST'])
@require_auth
@require_pro
def kill_switch():
    """
    Emergency kill switch - cancel all open orders.
    """
    user = g.user
    
    service, account, error = get_kalshi_service(user.id)
    if error:
        return jsonify({'error': error}), 400
    
    logger.warning(f"KILL SWITCH activated by user {user.id}")
    
    # Get all resting orders
    success, result = service.get_orders(status='resting')
    
    if not success:
        return jsonify({'error': 'Failed to fetch orders'}), 500
    
    orders = result.get('orders', [])
    cancelled = []
    failed = []
    
    for order in orders:
        order_id = order.get('order_id')
        cancel_success, cancel_result = service.cancel_order(order_id)
        if cancel_success:
            cancelled.append(order_id)
        else:
            failed.append({'order_id': order_id, 'error': cancel_result.get('error')})
    
    return jsonify({
        'success': True,
        'cancelled': len(cancelled),
        'failed': len(failed),
        'cancelled_orders': cancelled,
        'failed_orders': failed,
        'message': f'Cancelled {len(cancelled)} orders, {len(failed)} failed'
    })

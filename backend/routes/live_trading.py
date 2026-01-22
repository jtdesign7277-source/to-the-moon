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
    from routes.accounts import decrypt_credential
    
    account = ConnectedAccount.query.filter_by(
        user_id=user_id,
        platform='kalshi',
        status='connected'
    ).first()
    
    if not account:
        return None, None, 'No connected Kalshi account found'
    
    try:
        api_key_id = decrypt_credential(account.api_key_id)
        api_secret = decrypt_credential(account.api_secret)
        
        service = KalshiService(api_key_id, api_secret)
        return service, account, None
    except Exception as e:
        logger.error(f"Error initializing Kalshi service: {e}")
        return None, None, f'Failed to initialize Kalshi service: {str(e)}'


@live_trading_bp.route('/api/live/order', methods=['POST'])
@require_auth
#@require_pro
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
#@require_pro
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
#@require_pro
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
#@require_pro
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
    """Get open markets with optional search."""
    user = g.user
    
    query = request.args.get('q')
    limit = min(int(request.args.get('limit', 50)), 100)
    
    # Try to use connected Kalshi account if available
    service, account, error = get_kalshi_service(user.id)
    
    if service:
        # Use authenticated search
        success, result = service.search_markets(query=query, limit=limit)
        if success:
            return jsonify({
                'markets': result.get('markets', []),
                'count': result.get('count', 0)
            })
    
    # Fall back to public API
    import requests
    try:
        response = requests.get(
            'https://api.elections.kalshi.com/trade-api/v2/markets',
            params={'limit': limit, 'status': 'open'},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            markets = data.get('markets', [])
            
            # Filter by query if provided
            if query and markets:
                query_lower = query.lower()
                keywords = [kw.strip() for kw in query_lower.split() if len(kw.strip()) > 2]
                markets = [
                    m for m in markets
                    if all(kw in (m.get('title', '') + m.get('subtitle', '')).lower() for kw in keywords)
                ]
            
            return jsonify({'markets': markets, 'count': len(markets)})
        else:
            return jsonify({'error': 'Failed to fetch markets'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@live_trading_bp.route('/api/live/resolve-ticker', methods=['POST'])
@require_auth
def resolve_ticker():
    """
    Resolve a market title to an actual Kalshi ticker.
    
    Request body:
    {
        "title": "Will Bitcoin hit $100k by January 2026?",
        "platform": "kalshi"  # optional, defaults to kalshi
    }
    
    Returns the best matching ticker and alternatives.
    """
    user = g.user
    data = request.get_json() or {}
    
    title = data.get('title')
    platform = data.get('platform', 'kalshi')
    
    if not title:
        return jsonify({'error': 'Market title is required'}), 400
    
    # Get Kalshi service for authenticated search
    service, account, error = get_kalshi_service(user.id)
    
    if not service:
        # Try public API fallback
        import requests
        try:
            response = requests.get(
                'https://api.elections.kalshi.com/trade-api/v2/markets',
                params={'limit': 50, 'status': 'open'},
                timeout=10
            )
            
            if response.status_code != 200:
                return jsonify({'error': 'Failed to search markets'}), 500
            
            data = response.json()
            markets = data.get('markets', [])
            
            # Manual fuzzy search
            title_lower = title.lower()
            keywords = [kw.strip() for kw in title_lower.split() if len(kw.strip()) > 2]
            
            scored = []
            for m in markets:
                m_title = (m.get('title', '') or '').lower()
                m_subtitle = (m.get('subtitle', '') or '').lower()
                searchable = f"{m_title} {m_subtitle}"
                
                if all(kw in searchable for kw in keywords):
                    # Score by how many keywords match
                    score = sum(1 for kw in keywords if kw in searchable) * 20
                    if title_lower in m_title:
                        score += 40
                    scored.append((score, m))
            
            scored.sort(key=lambda x: x[0], reverse=True)
            
            if not scored or scored[0][0] < 20:
                return jsonify({
                    'success': False,
                    'error': f'No markets found matching: {title}',
                    'suggestions': [
                        {'ticker': m.get('ticker'), 'title': m.get('title')}
                        for _, m in scored[:5]
                    ] if scored else []
                }), 404
            
            best = scored[0][1]
            return jsonify({
                'success': True,
                'ticker': best.get('ticker'),
                'title': best.get('title'),
                'subtitle': best.get('subtitle'),
                'yes_bid': best.get('yes_bid'),
                'no_bid': best.get('no_bid'),
                'yes_ask': best.get('yes_ask'),
                'no_ask': best.get('no_ask'),
                'volume': best.get('volume'),
                'alternatives': [
                    {'ticker': m.get('ticker'), 'title': m.get('title'), 'score': s}
                    for s, m in scored[1:4]
                ]
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    # Use authenticated service with built-in resolve_ticker
    success, result = service.resolve_ticker(title, platform)
    
    if success:
        return jsonify({
            'success': True,
            **result
        })
    else:
        return jsonify({
            'success': False,
            **result
        }), 404


@live_trading_bp.route('/api/live/search-markets', methods=['GET'])
@require_auth
def search_markets():
    """
    Search for markets by query.
    
    Query params:
        q: Search query
        status: Market status (open, closed, settled)
        limit: Max results
    """
    user = g.user
    
    query = request.args.get('q', '')
    status = request.args.get('status', 'open')
    limit = min(int(request.args.get('limit', 30)), 100)
    
    service, account, error = get_kalshi_service(user.id)
    
    if service:
        success, result = service.search_markets(
            query=query,
            status=status,
            limit=limit
        )
        
        if success:
            return jsonify({
                'markets': result.get('markets', []),
                'count': result.get('count', 0)
            })
        else:
            return jsonify({'error': result.get('error', 'Search failed')}), 500
    
    # Fallback - no connected account
    return jsonify({
        'error': 'Connect a Kalshi account for market search',
        'markets': []
    }), 400


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
#@require_pro
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
#@require_pro
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


# ============================================
# SDK-BASED TRADING ENDPOINTS (Enhanced)
# ============================================

@live_trading_bp.route('/api/live/sdk/order', methods=['POST'])
@require_auth
def place_sdk_order():
    """
    Place an order using the Kalshi SDK (enhanced version).
    
    Request body:
    {
        "ticker": "KXBTC-24JAN20-B50000",
        "action": "buy",
        "side": "yes",
        "count": 10,
        "type": "limit",
        "price": 45,
        "clientOrderId": "optional-uuid"
    }
    """
    from services.kalshi_sdk_service import get_authenticated_client
    from routes.accounts import decrypt_credential
    
    user = g.user
    data = request.get_json() or {}
    
    # Validate required fields
    required = ['ticker', 'action', 'side', 'count']
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400
    
    # Get connected account
    account = ConnectedAccount.query.filter_by(
        user_id=user.id,
        platform='kalshi',
        status='connected'
    ).first()
    
    if not account:
        return jsonify({'error': 'No connected Kalshi account found'}), 400
    
    try:
        api_key_id = decrypt_credential(account.api_key_id)
        api_secret = decrypt_credential(account.api_secret)
    except Exception as e:
        return jsonify({'error': 'Failed to decrypt credentials'}), 500
    
    # Create authenticated SDK client
    sdk_client = get_authenticated_client(api_key_id, api_secret)
    
    if not sdk_client.is_authenticated:
        return jsonify({'error': 'SDK authentication failed'}), 401
    
    # Extract parameters
    ticker = data['ticker']
    action = data['action']
    side = data['side']
    count = int(data['count'])
    order_type = data.get('type', 'limit')
    price = data.get('price')
    client_order_id = data.get('clientOrderId')
    
    # Validation
    if order_type == 'limit' and price is None:
        return jsonify({'error': 'Price required for limit orders'}), 400
    
    if price is not None:
        price = int(price)
        if price < 1 or price > 99:
            return jsonify({'error': 'Price must be 1-99 cents'}), 400
    
    if count > 100:
        return jsonify({'error': 'Max 100 contracts per order'}), 400
    
    # Verify balance first
    balance_success, balance_data = sdk_client.get_balance()
    if not balance_success:
        return jsonify({'error': 'Failed to verify balance'}), 500
    
    available = balance_data.get('available_balance', 0)
    max_cost = (count * (price if price else 99)) / 100
    
    if action == 'buy' and max_cost > available:
        return jsonify({
            'error': f'Insufficient funds. Need ${max_cost:.2f}, have ${available:.2f}'
        }), 400
    
    # Place order via SDK
    logger.info(f"SDK order: {action} {count} {side} on {ticker} @ {price}¢")
    
    success, result = sdk_client.place_order(
        ticker=ticker,
        action=action,
        side=side,
        count=count,
        order_type=order_type,
        price=price,
        client_order_id=client_order_id
    )
    
    if not success:
        logger.error(f"SDK order failed: {result}")
        return jsonify({'error': result.get('error', 'Order failed')}), 400
    
    # Log to database
    try:
        trade = Trade(
            user_id=user.id,
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
        account.last_balance_update = datetime.utcnow()
        db.session.commit()
    except Exception as e:
        logger.error(f"Failed to log trade: {e}")
    
    return jsonify({
        'success': True,
        'order': result,
        'message': f'Order placed: {action} {count} {side} @ {price}¢'
    }), 201


@live_trading_bp.route('/api/live/sdk/portfolio', methods=['GET'])
@require_auth
def get_sdk_portfolio():
    """
    Get complete portfolio data via SDK.
    Returns balance, positions, and recent trades.
    """
    from services.kalshi_sdk_service import get_authenticated_client
    from routes.accounts import decrypt_credential
    
    user = g.user
    
    account = ConnectedAccount.query.filter_by(
        user_id=user.id,
        platform='kalshi',
        status='connected'
    ).first()
    
    if not account:
        return jsonify({'error': 'No connected Kalshi account'}), 400
    
    try:
        api_key_id = decrypt_credential(account.api_key_id)
        api_secret = decrypt_credential(account.api_secret)
    except Exception as e:
        return jsonify({'error': 'Credential error'}), 500
    
    sdk_client = get_authenticated_client(api_key_id, api_secret)
    
    if not sdk_client.is_authenticated:
        return jsonify({'error': 'Authentication failed'}), 401
    
    # Fetch all portfolio data
    balance_success, balance_data = sdk_client.get_balance()
    positions_success, positions_data = sdk_client.get_positions()
    fills_success, fills_data = sdk_client.get_fills(limit=50)
    orders_success, orders_data = sdk_client.get_orders(status='resting', limit=50)
    
    # Calculate total portfolio value
    total_exposure = 0
    if positions_success:
        for pos in positions_data.get('positions', []):
            total_exposure += pos.get('market_exposure', 0)
    
    portfolio = {
        'balance': balance_data if balance_success else {'error': 'Failed to fetch'},
        'positions': positions_data.get('positions', []) if positions_success else [],
        'positionCount': len(positions_data.get('positions', [])) if positions_success else 0,
        'totalExposure': total_exposure,
        'recentFills': fills_data.get('fills', []) if fills_success else [],
        'openOrders': orders_data.get('orders', []) if orders_success else [],
        'openOrderCount': len(orders_data.get('orders', [])) if orders_success else 0,
        'account': {
            'id': account.id,
            'platform': account.platform,
            'status': account.status,
            'lastUpdate': account.last_balance_update.isoformat() if account.last_balance_update else None
        }
    }
    
    # Update cached balance
    if balance_success:
        account.balance = balance_data.get('balance', 0)
        account.last_balance_update = datetime.utcnow()
        db.session.commit()
    
    return jsonify(portfolio)


@live_trading_bp.route('/api/live/sdk/execute-signal', methods=['POST'])
@require_auth
def execute_signal():
    """
    Execute a trading signal from the scanner.
    This is the main endpoint for one-click trading from opportunities.
    
    Request body:
    {
        "ticker": "MARKET-TICKER",
        "side": "yes",
        "action": "buy",
        "contracts": 10,
        "price": 45,
        "signalId": "optional-signal-reference"
    }
    """
    from services.kalshi_sdk_service import get_authenticated_client, get_market_price
    from routes.accounts import decrypt_credential
    
    user = g.user
    data = request.get_json() or {}
    
    ticker = data.get('ticker')
    side = data.get('side', 'yes')
    action = data.get('action', 'buy')
    contracts = int(data.get('contracts', 1))
    price = data.get('price')
    
    if not ticker:
        return jsonify({'error': 'Ticker required'}), 400
    
    # Get current market price if no price specified
    if price is None:
        market = get_market_price(ticker)
        if market:
            if side == 'yes':
                price = market.get('yes_ask') or market.get('last_price')
            else:
                price = market.get('no_ask') or (100 - (market.get('last_price') or 50))
        
        if not price:
            return jsonify({'error': 'Could not determine market price'}), 400
    
    price = int(price)
    
    # Get connected account
    account = ConnectedAccount.query.filter_by(
        user_id=user.id,
        platform='kalshi',
        status='connected'
    ).first()
    
    if not account:
        return jsonify({
            'error': 'Connect a Kalshi account to execute trades',
            'code': 'NO_ACCOUNT'
        }), 400
    
    try:
        api_key_id = decrypt_credential(account.api_key_id)
        api_secret = decrypt_credential(account.api_secret)
    except Exception:
        return jsonify({'error': 'Credential error'}), 500
    
    sdk_client = get_authenticated_client(api_key_id, api_secret)
    
    if not sdk_client.is_authenticated:
        return jsonify({'error': 'Authentication failed'}), 401
    
    # Quick balance check
    balance_success, balance_data = sdk_client.get_balance()
    if balance_success:
        available = balance_data.get('available_balance', 0)
        cost = (contracts * price) / 100
        if action == 'buy' and cost > available:
            return jsonify({
                'error': f'Insufficient funds: need ${cost:.2f}, have ${available:.2f}'
            }), 400
    
    # Execute the trade
    logger.info(f"Executing signal: {action} {contracts} {side} on {ticker} @ {price}¢")
    
    success, result = sdk_client.place_order(
        ticker=ticker,
        action=action,
        side=side,
        count=contracts,
        order_type='limit',
        price=price
    )
    
    if not success:
        return jsonify({'error': result.get('error', 'Execution failed')}), 400
    
    # Log trade
    try:
        trade = Trade(
            user_id=user.id,
            pair=ticker,
            trade_type=f'{action}_{side}',
            entry=price / 100,
            amount=contracts,
            platform='kalshi',
            status='executed',
            is_paper=False,
            timestamp=datetime.utcnow()
        )
        db.session.add(trade)
        db.session.commit()
    except Exception as e:
        logger.error(f"Trade logging failed: {e}")
    
    return jsonify({
        'success': True,
        'order': result,
        'executed': {
            'ticker': ticker,
            'side': side,
            'action': action,
            'contracts': contracts,
            'price': price,
            'cost': (contracts * price) / 100
        }
    }), 201

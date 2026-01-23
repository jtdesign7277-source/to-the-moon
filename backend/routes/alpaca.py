"""
Alpaca trading routes for TO THE MOON.
Handles stock trading operations via Alpaca API.
"""
from datetime import datetime
from flask import Blueprint, request, jsonify, g
from cryptography.fernet import Fernet
import os

from models import db, ConnectedAccount
from utils.auth import jwt_required_custom
from services.alpaca_service import AlpacaService

alpaca_bp = Blueprint('alpaca', __name__)

# Encryption key for decrypting stored credentials
ENCRYPTION_KEY = os.environ.get('CREDENTIALS_ENCRYPTION_KEY')
if not ENCRYPTION_KEY:
    # Generate a fallback key if not set (not recommended for production)
    ENCRYPTION_KEY = Fernet.generate_key()
    print("[WARNING] CREDENTIALS_ENCRYPTION_KEY not set. Using generated key - credentials from previous sessions won't decrypt!")
else:
    ENCRYPTION_KEY = ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY

fernet = Fernet(ENCRYPTION_KEY)


def decrypt_credential(encrypted_value: str) -> str:
    """Decrypt a stored credential."""
    if not encrypted_value or not fernet:
        return None
    return fernet.decrypt(encrypted_value.encode()).decode()


def get_alpaca_service(user_id: str):
    """Get Alpaca service for the connected account."""
    account = ConnectedAccount.query.filter_by(
        user_id=user_id,
        platform='alpaca'
    ).first()

    if not account:
        return None, 'No Alpaca account connected. Please connect your Alpaca account first.'

    api_key = decrypt_credential(account.api_key_id)
    api_secret = decrypt_credential(account.api_secret)
    paper = account.extra_credentials.get('paper', True) if account.extra_credentials else True

    if not api_key or not api_secret:
        return None, 'Failed to decrypt Alpaca credentials.'

    try:
        service = AlpacaService(api_key, api_secret, paper=paper)
        return service, None
    except Exception as e:
        return None, f'Failed to initialize Alpaca service: {str(e)}'


# ============================================
# ACCOUNT ENDPOINTS
# ============================================

@alpaca_bp.route('/account', methods=['GET'])
@jwt_required_custom
def get_account():
    """Get Alpaca account information."""
    try:
        user = g.current_user
        service, error = get_alpaca_service(user.id)

        if error:
            return jsonify({'error': error}), 400

        success, data = service.get_account()

        if success:
            return jsonify(data), 200
        else:
            return jsonify({'error': data.get('error', 'Failed to get account')}), 400

    except Exception as e:
        return jsonify({'error': f'Failed to get account: {str(e)}'}), 500


@alpaca_bp.route('/history', methods=['GET'])
@jwt_required_custom
def get_history():
    """Get portfolio history."""
    try:
        user = g.current_user
        service, error = get_alpaca_service(user.id)

        if error:
            return jsonify({'error': error}), 400

        period = request.args.get('period', '1M')
        timeframe = request.args.get('timeframe', '1D')

        success, data = service.get_portfolio_history(period=period, timeframe=timeframe)

        if success:
            return jsonify(data), 200
        else:
            return jsonify({'error': data.get('error', 'Failed to get history')}), 400

    except Exception as e:
        return jsonify({'error': f'Failed to get history: {str(e)}'}), 500


# ============================================
# POSITIONS ENDPOINTS
# ============================================

@alpaca_bp.route('/positions', methods=['GET'])
@jwt_required_custom
def get_positions():
    """Get all open positions."""
    try:
        user = g.current_user
        service, error = get_alpaca_service(user.id)

        if error:
            return jsonify({'error': error}), 400

        success, data = service.get_positions()

        if success:
            return jsonify(data), 200
        else:
            return jsonify({'error': data.get('error', 'Failed to get positions')}), 400

    except Exception as e:
        return jsonify({'error': f'Failed to get positions: {str(e)}'}), 500


@alpaca_bp.route('/positions/<symbol>', methods=['GET'])
@jwt_required_custom
def get_position(symbol):
    """Get position for a specific symbol."""
    try:
        user = g.current_user
        service, error = get_alpaca_service(user.id)

        if error:
            return jsonify({'error': error}), 400

        success, data = service.get_position(symbol.upper())

        if success:
            return jsonify(data), 200
        else:
            return jsonify({'error': data.get('error', 'Failed to get position')}), 400

    except Exception as e:
        return jsonify({'error': f'Failed to get position: {str(e)}'}), 500


@alpaca_bp.route('/positions/<symbol>', methods=['DELETE'])
@jwt_required_custom
def close_position(symbol):
    """Close a position (fully or partially)."""
    try:
        user = g.current_user
        service, error = get_alpaca_service(user.id)

        if error:
            return jsonify({'error': error}), 400

        qty = request.args.get('qty', type=float)
        percentage = request.args.get('percentage', type=float)

        success, data = service.close_position(symbol.upper(), qty=qty, percentage=percentage)

        if success:
            return jsonify(data), 200
        else:
            return jsonify({'error': data.get('error', 'Failed to close position')}), 400

    except Exception as e:
        return jsonify({'error': f'Failed to close position: {str(e)}'}), 500


@alpaca_bp.route('/positions', methods=['DELETE'])
@jwt_required_custom
def close_all_positions():
    """Close all open positions."""
    try:
        user = g.current_user
        service, error = get_alpaca_service(user.id)

        if error:
            return jsonify({'error': error}), 400

        cancel_orders = request.args.get('cancel_orders', 'true').lower() == 'true'

        success, data = service.close_all_positions(cancel_orders=cancel_orders)

        if success:
            return jsonify(data), 200
        else:
            return jsonify({'error': data.get('error', 'Failed to close positions')}), 400

    except Exception as e:
        return jsonify({'error': f'Failed to close positions: {str(e)}'}), 500


# ============================================
# ORDER ENDPOINTS
# ============================================

@alpaca_bp.route('/orders', methods=['POST'])
@jwt_required_custom
def place_order():
    """Place an order."""
    try:
        user = g.current_user
        service, error = get_alpaca_service(user.id)

        if error:
            return jsonify({'error': error}), 400

        data = request.get_json()

        if not data:
            return jsonify({'error': 'Request body required'}), 400

        symbol = data.get('symbol')
        if not symbol:
            return jsonify({'error': 'Symbol is required'}), 400

        success, result = service.place_order(
            symbol=symbol,
            qty=data.get('qty'),
            notional=data.get('notional'),
            side=data.get('side', 'buy'),
            order_type=data.get('type', 'market'),
            time_in_force=data.get('time_in_force', 'day'),
            limit_price=data.get('limit_price'),
            stop_price=data.get('stop_price'),
            trail_price=data.get('trail_price'),
            trail_percent=data.get('trail_percent'),
            extended_hours=data.get('extended_hours', False),
            client_order_id=data.get('client_order_id'),
        )

        if success:
            return jsonify(result), 200
        else:
            return jsonify({'error': result.get('error', 'Failed to place order')}), 400

    except Exception as e:
        return jsonify({'error': f'Failed to place order: {str(e)}'}), 500


@alpaca_bp.route('/orders', methods=['GET'])
@jwt_required_custom
def get_orders():
    """Get list of orders."""
    try:
        user = g.current_user
        service, error = get_alpaca_service(user.id)

        if error:
            return jsonify({'error': error}), 400

        status = request.args.get('status', 'open')
        limit = request.args.get('limit', 50, type=int)

        success, data = service.get_orders(status=status, limit=limit)

        if success:
            return jsonify(data), 200
        else:
            return jsonify({'error': data.get('error', 'Failed to get orders')}), 400

    except Exception as e:
        return jsonify({'error': f'Failed to get orders: {str(e)}'}), 500


@alpaca_bp.route('/orders/<order_id>', methods=['GET'])
@jwt_required_custom
def get_order(order_id):
    """Get a specific order."""
    try:
        user = g.current_user
        service, error = get_alpaca_service(user.id)

        if error:
            return jsonify({'error': error}), 400

        success, data = service.get_order(order_id)

        if success:
            return jsonify(data), 200
        else:
            return jsonify({'error': data.get('error', 'Failed to get order')}), 400

    except Exception as e:
        return jsonify({'error': f'Failed to get order: {str(e)}'}), 500


@alpaca_bp.route('/orders/<order_id>', methods=['DELETE'])
@jwt_required_custom
def cancel_order(order_id):
    """Cancel an order."""
    try:
        user = g.current_user
        service, error = get_alpaca_service(user.id)

        if error:
            return jsonify({'error': error}), 400

        success, data = service.cancel_order(order_id)

        if success:
            return jsonify(data), 200
        else:
            return jsonify({'error': data.get('error', 'Failed to cancel order')}), 400

    except Exception as e:
        return jsonify({'error': f'Failed to cancel order: {str(e)}'}), 500


@alpaca_bp.route('/orders', methods=['DELETE'])
@jwt_required_custom
def cancel_all_orders():
    """Cancel all open orders."""
    try:
        user = g.current_user
        service, error = get_alpaca_service(user.id)

        if error:
            return jsonify({'error': error}), 400

        success, data = service.cancel_all_orders()

        if success:
            return jsonify(data), 200
        else:
            return jsonify({'error': data.get('error', 'Failed to cancel orders')}), 400

    except Exception as e:
        return jsonify({'error': f'Failed to cancel orders: {str(e)}'}), 500


# ============================================
# MARKET DATA ENDPOINTS
# ============================================

@alpaca_bp.route('/quote/<symbol>', methods=['GET'])
@jwt_required_custom
def get_quote(symbol):
    """Get latest quote for a symbol."""
    try:
        user = g.current_user
        service, error = get_alpaca_service(user.id)

        if error:
            return jsonify({'error': error}), 400

        success, data = service.get_quote(symbol.upper())

        if success:
            return jsonify(data), 200
        else:
            return jsonify({'error': data.get('error', 'Failed to get quote')}), 400

    except Exception as e:
        return jsonify({'error': f'Failed to get quote: {str(e)}'}), 500


@alpaca_bp.route('/trade/<symbol>', methods=['GET'])
@jwt_required_custom
def get_trade(symbol):
    """Get latest trade for a symbol."""
    try:
        user = g.current_user
        service, error = get_alpaca_service(user.id)

        if error:
            return jsonify({'error': error}), 400

        success, data = service.get_trade(symbol.upper())

        if success:
            return jsonify(data), 200
        else:
            return jsonify({'error': data.get('error', 'Failed to get trade')}), 400

    except Exception as e:
        return jsonify({'error': f'Failed to get trade: {str(e)}'}), 500


@alpaca_bp.route('/bars/<symbol>', methods=['GET'])
@jwt_required_custom
def get_bars(symbol):
    """Get historical bars for a symbol."""
    try:
        user = g.current_user
        service, error = get_alpaca_service(user.id)

        if error:
            return jsonify({'error': error}), 400

        timeframe = request.args.get('timeframe', '1Day')
        limit = request.args.get('limit', 100, type=int)
        start = request.args.get('start')
        end = request.args.get('end')

        success, data = service.get_bars(
            symbol.upper(),
            timeframe=timeframe,
            start=start,
            end=end,
            limit=limit
        )

        if success:
            return jsonify(data), 200
        else:
            return jsonify({'error': data.get('error', 'Failed to get bars')}), 400

    except Exception as e:
        return jsonify({'error': f'Failed to get bars: {str(e)}'}), 500


@alpaca_bp.route('/asset/<symbol>', methods=['GET'])
@jwt_required_custom
def get_asset(symbol):
    """Get asset info for a symbol."""
    try:
        user = g.current_user
        service, error = get_alpaca_service(user.id)

        if error:
            return jsonify({'error': error}), 400

        success, data = service.get_asset(symbol.upper())

        if success:
            return jsonify(data), 200
        else:
            return jsonify({'error': data.get('error', 'Failed to get asset')}), 400

    except Exception as e:
        return jsonify({'error': f'Failed to get asset: {str(e)}'}), 500


# ============================================
# CLOCK & CALENDAR
# ============================================

@alpaca_bp.route('/clock', methods=['GET'])
@jwt_required_custom
def get_clock():
    """Get market clock."""
    try:
        user = g.current_user
        service, error = get_alpaca_service(user.id)

        if error:
            return jsonify({'error': error}), 400

        success, data = service.get_clock()

        if success:
            return jsonify(data), 200
        else:
            return jsonify({'error': data.get('error', 'Failed to get clock')}), 400

    except Exception as e:
        return jsonify({'error': f'Failed to get clock: {str(e)}'}), 500


@alpaca_bp.route('/calendar', methods=['GET'])
@jwt_required_custom
def get_calendar():
    """Get market calendar."""
    try:
        user = g.current_user
        service, error = get_alpaca_service(user.id)

        if error:
            return jsonify({'error': error}), 400

        start = request.args.get('start')
        end = request.args.get('end')

        success, data = service.get_calendar(start=start, end=end)

        if success:
            return jsonify(data), 200
        else:
            return jsonify({'error': data.get('error', 'Failed to get calendar')}), 400

    except Exception as e:
        return jsonify({'error': f'Failed to get calendar: {str(e)}'}), 500

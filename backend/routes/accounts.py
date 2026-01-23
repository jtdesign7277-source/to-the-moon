"""
Account routes for TO THE MOON.
Handles connecting external trading platforms and fetching balances.
"""
from datetime import datetime
from flask import Blueprint, request, jsonify, g

from models import db, ConnectedAccount, UserStats
from utils.auth import jwt_required_custom
from utils.encryption import encrypt_credential, decrypt_credential
from services.kalshi_service import connect_kalshi_account, refresh_kalshi_balance
from services.alpaca_service import connect_alpaca_account, refresh_alpaca_balance

accounts_bp = Blueprint('accounts', __name__)


@accounts_bp.route('', methods=['GET'])
@jwt_required_custom
def get_connected_accounts():
    """Get all connected accounts for the current user."""
    try:
        user = g.current_user
        accounts = ConnectedAccount.query.filter_by(user_id=user.id).all()
        
        return jsonify({
            'accounts': [acc.to_dict() for acc in accounts],
            'count': len(accounts)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get accounts: {str(e)}'}), 500


@accounts_bp.route('/connect', methods=['POST'])
@jwt_required_custom
def connect_account():
    """Connect a new trading platform account."""
    try:
        user = g.current_user
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request body required'}), 400
        
        platform = data.get('platform', '').lower()
        if not platform:
            return jsonify({'error': 'Platform is required'}), 400
        
        # Check if already connected
        existing = ConnectedAccount.query.filter_by(
            user_id=user.id, 
            platform=platform
        ).first()
        
        if existing:
            return jsonify({'error': f'{platform.title()} account is already connected'}), 400
        
        # Handle platform-specific connection
        if platform == 'kalshi':
            return _connect_kalshi(user, data)
        elif platform == 'polymarket':
            return _connect_polymarket(user, data)
        elif platform == 'manifold':
            return _connect_manifold(user, data)
        elif platform == 'alpaca':
            return _connect_alpaca(user, data)
        else:
            return jsonify({'error': f'Unsupported platform: {platform}'}), 400
            
    except Exception as e:
        return jsonify({'error': f'Failed to connect account: {str(e)}'}), 500


def _connect_kalshi(user, data):
    """Connect a Kalshi account."""
    api_key_id = data.get('apiKeyId')
    api_secret = data.get('apiSecret')
    
    if not api_key_id or not api_secret:
        return jsonify({'error': 'API Key ID and Secret are required'}), 400
    
    # Verify credentials and get balance
    success, result = connect_kalshi_account(api_key_id, api_secret)
    
    if not success:
        error_msg = result.get('error', 'Failed to connect to Kalshi')
        return jsonify({'error': error_msg}), 400
    
    # Create connected account record
    account = ConnectedAccount(
        user_id=user.id,
        platform='kalshi',
        api_key_id=encrypt_credential(api_key_id),
        api_secret=encrypt_credential(api_secret),
        balance=result.get('balance', 0),
        status='connected',
        last_balance_update=datetime.utcnow()
    )
    
    db.session.add(account)
    
    # Update user stats
    stats = UserStats.query.filter_by(user_id=user.id).first()
    if stats:
        stats.connected_accounts = (stats.connected_accounts or 0) + 1
        stats.total_balance = (stats.total_balance or 0) + result.get('balance', 0)
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Kalshi account connected successfully',
        'account': account.to_dict(),
        'portfolio': {
            'balance': result.get('balance', 0),
            'availableBalance': result.get('availableBalance', 0),
            'positionCount': result.get('positionCount', 0)
        }
    }), 200


def _connect_polymarket(user, data):
    """Connect a Polymarket account (placeholder)."""
    # TODO: Implement Polymarket connection
    return jsonify({'error': 'Polymarket connection not yet implemented'}), 501


def _connect_manifold(user, data):
    """Connect a Manifold account (placeholder)."""
    # TODO: Implement Manifold connection
    return jsonify({'error': 'Manifold connection not yet implemented'}), 501


def _connect_alpaca(user, data):
    """Connect an Alpaca brokerage account."""
    api_key = data.get('apiKey')
    api_secret = data.get('apiSecret')
    paper_mode = data.get('paperMode', True)  # Default to paper trading

    if not api_key or not api_secret:
        return jsonify({'error': 'API Key and Secret are required'}), 400

    # Verify credentials and get account info
    success, result = connect_alpaca_account(api_key, api_secret, paper=paper_mode)

    if not success:
        error_msg = result.get('error', 'Failed to connect to Alpaca')
        return jsonify({'error': error_msg}), 400

    # Create connected account record
    account = ConnectedAccount(
        user_id=user.id,
        platform='alpaca',
        platform_user_id=result.get('account_id'),
        api_key_id=encrypt_credential(api_key),
        api_secret=encrypt_credential(api_secret),
        extra_credentials={'paper': paper_mode},
        balance=result.get('balance', 0),
        status='connected',
        last_balance_update=datetime.utcnow()
    )

    db.session.add(account)

    # Update user stats
    stats = UserStats.query.filter_by(user_id=user.id).first()
    if stats:
        stats.connected_accounts = (stats.connected_accounts or 0) + 1
        stats.total_balance = (stats.total_balance or 0) + result.get('balance', 0)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Alpaca {"paper" if paper_mode else "live"} account connected successfully',
        'account': account.to_dict(),
        'portfolio': {
            'balance': result.get('balance', 0),
            'buyingPower': result.get('buying_power', 0),
            'cash': result.get('cash', 0),
            'portfolioValue': result.get('portfolio_value', 0),
            'positionCount': result.get('positionCount', 0),
            'paper': paper_mode,
        }
    }), 200


@accounts_bp.route('/<account_id>/refresh', methods=['POST'])
@jwt_required_custom
def refresh_account_balance(account_id):
    """Refresh the balance for a connected account."""
    try:
        user = g.current_user
        account = ConnectedAccount.query.filter_by(
            id=account_id,
            user_id=user.id
        ).first()
        
        if not account:
            return jsonify({'error': 'Account not found'}), 404
        
        if account.platform == 'kalshi':
            # Decrypt credentials
            api_key_id = decrypt_credential(account.api_key_id)
            api_secret = decrypt_credential(account.api_secret)
            
            # Fetch new balance
            success, result = refresh_kalshi_balance(api_key_id, api_secret)
            
            if success:
                old_balance = account.balance
                account.balance = result.get('balance', 0)
                account.last_balance_update = datetime.utcnow()
                account.status = 'connected'
                account.error_message = None

                # Update user stats total balance
                stats = UserStats.query.filter_by(user_id=user.id).first()
                if stats:
                    stats.total_balance = (stats.total_balance or 0) - old_balance + account.balance

                db.session.commit()

                return jsonify({
                    'success': True,
                    'account': account.to_dict(),
                    'portfolio': {
                        'balance': result.get('balance', 0),
                        'availableBalance': result.get('availableBalance', 0),
                        'positionCount': result.get('positionCount', 0)
                    }
                }), 200
            else:
                account.status = 'error'
                account.error_message = result.get('error', 'Failed to refresh balance')
                db.session.commit()
                return jsonify({'error': result.get('error', 'Failed to refresh')}), 400
        elif account.platform == 'alpaca':
            api_key = decrypt_credential(account.api_key_id)
            api_secret = decrypt_credential(account.api_secret)
            paper = account.extra_credentials.get('paper', True) if account.extra_credentials else True

            success, result = refresh_alpaca_balance(api_key, api_secret, paper=paper)

            if success:
                old_balance = account.balance
                account.balance = result.get('balance', 0)
                account.last_balance_update = datetime.utcnow()
                account.status = 'connected'
                account.error_message = None

                # Update user stats total balance
                stats = UserStats.query.filter_by(user_id=user.id).first()
                if stats:
                    stats.total_balance = (stats.total_balance or 0) - old_balance + account.balance

                db.session.commit()

                return jsonify({
                    'success': True,
                    'account': account.to_dict(),
                    'portfolio': {
                        'balance': result.get('balance', 0),
                        'buyingPower': result.get('buying_power', 0),
                        'cash': result.get('cash', 0),
                        'positionCount': result.get('positionCount', 0)
                    }
                }), 200
            else:
                account.status = 'error'
                account.error_message = result.get('error', 'Failed to refresh balance')
                db.session.commit()
                return jsonify({'error': result.get('error', 'Failed to refresh')}), 400
        else:
            return jsonify({'error': f'Refresh not implemented for {account.platform}'}), 501
            
    except Exception as e:
        return jsonify({'error': f'Failed to refresh balance: {str(e)}'}), 500


@accounts_bp.route('/refresh-all', methods=['POST'])
@jwt_required_custom
def refresh_all_balances():
    """Refresh balances for all connected accounts."""
    try:
        user = g.current_user
        accounts = ConnectedAccount.query.filter_by(user_id=user.id).all()
        
        results = []
        total_balance = 0
        
        for account in accounts:
            if account.platform == 'kalshi':
                api_key_id = decrypt_credential(account.api_key_id)
                api_secret = decrypt_credential(account.api_secret)

                success, result = refresh_kalshi_balance(api_key_id, api_secret)

                if success:
                    account.balance = result.get('balance', 0)
                    account.last_balance_update = datetime.utcnow()
                    account.status = 'connected'
                    account.error_message = None
                    total_balance += account.balance
                    results.append({
                        'platform': account.platform,
                        'success': True,
                        'balance': account.balance
                    })
                else:
                    account.status = 'error'
                    account.error_message = result.get('error')
                    results.append({
                        'platform': account.platform,
                        'success': False,
                        'error': result.get('error')
                    })
            elif account.platform == 'alpaca':
                api_key = decrypt_credential(account.api_key_id)
                api_secret = decrypt_credential(account.api_secret)
                paper = account.extra_credentials.get('paper', True) if account.extra_credentials else True

                success, result = refresh_alpaca_balance(api_key, api_secret, paper=paper)

                if success:
                    account.balance = result.get('balance', 0)
                    account.last_balance_update = datetime.utcnow()
                    account.status = 'connected'
                    account.error_message = None
                    total_balance += account.balance
                    results.append({
                        'platform': account.platform,
                        'success': True,
                        'balance': account.balance,
                        'paper': paper
                    })
                else:
                    account.status = 'error'
                    account.error_message = result.get('error')
                    results.append({
                        'platform': account.platform,
                        'success': False,
                        'error': result.get('error')
                    })
            else:
                results.append({
                    'platform': account.platform,
                    'success': False,
                    'error': 'Refresh not implemented'
                })
        
        # Update user stats
        stats = UserStats.query.filter_by(user_id=user.id).first()
        if stats:
            stats.total_balance = total_balance
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'results': results,
            'totalBalance': total_balance,
            'accounts': [acc.to_dict() for acc in accounts]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to refresh balances: {str(e)}'}), 500


@accounts_bp.route('/<account_id>', methods=['DELETE'])
@jwt_required_custom
def disconnect_account(account_id):
    """Disconnect a trading platform account."""
    try:
        user = g.current_user
        account = ConnectedAccount.query.filter_by(
            id=account_id,
            user_id=user.id
        ).first()
        
        if not account:
            return jsonify({'error': 'Account not found'}), 404
        
        platform = account.platform
        balance = account.balance
        
        # Update user stats
        stats = UserStats.query.filter_by(user_id=user.id).first()
        if stats:
            stats.connected_accounts = max(0, (stats.connected_accounts or 0) - 1)
            stats.total_balance = max(0, (stats.total_balance or 0) - balance)
        
        db.session.delete(account)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'{platform.title()} account disconnected'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to disconnect account: {str(e)}'}), 500

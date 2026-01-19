"""
Trade routes for TO THE MOON.
"""
from datetime import datetime
from decimal import Decimal
from flask import Blueprint, request, jsonify, g
from models import db, Trade, Strategy, Subscription
from utils.auth import jwt_required_custom

trades_bp = Blueprint('trades', __name__)


@trades_bp.route('', methods=['GET'])
@jwt_required_custom
def get_trades():
    """Get user's trades with filtering."""
    try:
        user = g.current_user

        # Query params
        status = request.args.get('status')  # open, closed, all
        is_paper = request.args.get('is_paper')
        strategy_id = request.args.get('strategy_id')
        symbol = request.args.get('symbol')
        limit = min(int(request.args.get('limit', 50)), 200)
        offset = int(request.args.get('offset', 0))

        query = Trade.query.filter_by(user_id=user.id)

        # Apply filters
        if status and status != 'all':
            query = query.filter_by(status=status)

        if is_paper is not None:
            query = query.filter_by(is_paper=is_paper.lower() == 'true')

        if strategy_id:
            query = query.filter_by(strategy_id=int(strategy_id))

        if symbol:
            query = query.filter(Trade.symbol.ilike(f'%{symbol}%'))

        # Order by most recent first
        query = query.order_by(Trade.opened_at.desc())

        trades = query.offset(offset).limit(limit).all()

        # Calculate summary
        total_pnl = sum(float(t.pnl or 0) for t in trades if t.status == 'closed')
        winning = sum(1 for t in trades if t.status == 'closed' and t.pnl and t.pnl > 0)
        losing = sum(1 for t in trades if t.status == 'closed' and t.pnl and t.pnl < 0)

        return jsonify({
            'trades': [t.to_dict() for t in trades],
            'count': len(trades),
            'summary': {
                'total_pnl': round(total_pnl, 2),
                'winning_trades': winning,
                'losing_trades': losing,
                'win_rate': round(winning / (winning + losing) * 100, 2) if (winning + losing) > 0 else 0,
            },
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to get trades: {str(e)}'}), 500


@trades_bp.route('/<int:trade_id>', methods=['GET'])
@jwt_required_custom
def get_trade(trade_id):
    """Get a specific trade."""
    try:
        user = g.current_user
        trade = Trade.query.get(trade_id)

        if not trade:
            return jsonify({'error': 'Trade not found'}), 404

        if trade.user_id != user.id:
            return jsonify({'error': 'Access denied'}), 403

        return jsonify({
            'trade': trade.to_dict(),
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to get trade: {str(e)}'}), 500


@trades_bp.route('', methods=['POST'])
@jwt_required_custom
def create_trade():
    """Place a new trade (paper or live)."""
    try:
        user = g.current_user
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Request body required'}), 400

        # Validate required fields
        symbol = data.get('symbol', '').upper().strip()
        side = data.get('side', '').lower()
        entry_price = data.get('entry_price')
        quantity = data.get('quantity')
        is_paper = data.get('is_paper', True)

        if not symbol:
            return jsonify({'error': 'Symbol required'}), 400

        if side not in ['long', 'short']:
            return jsonify({'error': 'Side must be "long" or "short"'}), 400

        if not entry_price or float(entry_price) <= 0:
            return jsonify({'error': 'Valid entry price required'}), 400

        if not quantity or float(quantity) <= 0:
            return jsonify({'error': 'Valid quantity required'}), 400

        # Check if live trading requires Pro
        if not is_paper:
            subscription = Subscription.query.filter_by(user_id=user.id).first()
            if not subscription or not subscription.is_pro:
                return jsonify({
                    'error': 'Pro subscription required for live trading',
                    'code': 'PRO_REQUIRED',
                }), 403

        # Create trade
        trade = Trade(
            user_id=user.id,
            symbol=symbol,
            side=side,
            entry_price=Decimal(str(entry_price)),
            quantity=Decimal(str(quantity)),
            is_paper=is_paper,
            status='open',
            platform=data.get('platform'),
            strategy_id=data.get('strategy_id'),
        )

        db.session.add(trade)
        db.session.commit()

        return jsonify({
            'message': 'Trade opened',
            'trade': trade.to_dict(),
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create trade: {str(e)}'}), 500


@trades_bp.route('/<int:trade_id>/close', methods=['POST'])
@jwt_required_custom
def close_trade(trade_id):
    """Close an open trade."""
    try:
        user = g.current_user
        trade = Trade.query.get(trade_id)

        if not trade:
            return jsonify({'error': 'Trade not found'}), 404

        if trade.user_id != user.id:
            return jsonify({'error': 'Access denied'}), 403

        if trade.status != 'open':
            return jsonify({'error': 'Trade is not open'}), 400

        data = request.get_json() or {}
        exit_price = data.get('exit_price')

        if not exit_price or float(exit_price) <= 0:
            return jsonify({'error': 'Valid exit price required'}), 400

        exit_price = Decimal(str(exit_price))

        # Calculate P&L
        if trade.side == 'long':
            pnl = (exit_price - trade.entry_price) * trade.quantity
        else:  # short
            pnl = (trade.entry_price - exit_price) * trade.quantity

        trade.exit_price = exit_price
        trade.pnl = pnl
        trade.status = 'closed'
        trade.closed_at = datetime.utcnow()

        # Update strategy stats if linked
        if trade.strategy_id:
            strategy = Strategy.query.get(trade.strategy_id)
            if strategy:
                strategy.total_trades += 1
                strategy.total_pnl += pnl
                if pnl > 0:
                    strategy.winning_trades += 1
                if strategy.total_trades > 0:
                    strategy.win_rate = Decimal(str(
                        (strategy.winning_trades / strategy.total_trades) * 100
                    ))

        db.session.commit()

        return jsonify({
            'message': 'Trade closed',
            'trade': trade.to_dict(),
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to close trade: {str(e)}'}), 500


@trades_bp.route('/<int:trade_id>/cancel', methods=['POST'])
@jwt_required_custom
def cancel_trade(trade_id):
    """Cancel an open trade."""
    try:
        user = g.current_user
        trade = Trade.query.get(trade_id)

        if not trade:
            return jsonify({'error': 'Trade not found'}), 404

        if trade.user_id != user.id:
            return jsonify({'error': 'Access denied'}), 403

        if trade.status != 'open':
            return jsonify({'error': 'Trade is not open'}), 400

        trade.status = 'cancelled'
        trade.closed_at = datetime.utcnow()

        db.session.commit()

        return jsonify({
            'message': 'Trade cancelled',
            'trade': trade.to_dict(),
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to cancel trade: {str(e)}'}), 500


@trades_bp.route('/stats', methods=['GET'])
@jwt_required_custom
def get_trade_stats():
    """Get trading statistics for the user."""
    try:
        user = g.current_user

        # Get all closed trades
        trades = Trade.query.filter_by(
            user_id=user.id,
            status='closed'
        ).all()

        if not trades:
            return jsonify({
                'total_trades': 0,
                'winning_trades': 0,
                'losing_trades': 0,
                'win_rate': 0,
                'total_pnl': 0,
                'avg_win': 0,
                'avg_loss': 0,
                'best_trade': 0,
                'worst_trade': 0,
            }), 200

        # Calculate stats
        winning = [t for t in trades if t.pnl and t.pnl > 0]
        losing = [t for t in trades if t.pnl and t.pnl < 0]

        total_pnl = sum(float(t.pnl or 0) for t in trades)
        avg_win = sum(float(t.pnl) for t in winning) / len(winning) if winning else 0
        avg_loss = sum(float(t.pnl) for t in losing) / len(losing) if losing else 0
        best_trade = max(float(t.pnl or 0) for t in trades) if trades else 0
        worst_trade = min(float(t.pnl or 0) for t in trades) if trades else 0

        return jsonify({
            'total_trades': len(trades),
            'winning_trades': len(winning),
            'losing_trades': len(losing),
            'win_rate': round(len(winning) / len(trades) * 100, 2) if trades else 0,
            'total_pnl': round(total_pnl, 2),
            'avg_win': round(avg_win, 2),
            'avg_loss': round(avg_loss, 2),
            'best_trade': round(best_trade, 2),
            'worst_trade': round(worst_trade, 2),
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to get stats: {str(e)}'}), 500

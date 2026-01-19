"""
Leaderboard routes for TO THE MOON.
"""
from flask import Blueprint, request, jsonify, g
from sqlalchemy import func, desc
from models import db, User, Trade, Strategy, LeaderboardEntry, StrategyFollow
from utils.auth import jwt_required_custom

leaderboard_bp = Blueprint('leaderboard', __name__)


@leaderboard_bp.route('', methods=['GET'])
@jwt_required_custom
def get_leaderboard():
    """Get leaderboard rankings."""
    try:
        # Query params
        period = request.args.get('period', 'monthly')  # daily, weekly, monthly, alltime
        limit = min(int(request.args.get('limit', 50)), 100)
        offset = int(request.args.get('offset', 0))

        # Try to get cached leaderboard
        entries = LeaderboardEntry.query.filter_by(
            period=period
        ).order_by(
            LeaderboardEntry.rank
        ).offset(offset).limit(limit).all()

        # If no cached data, generate from trades
        if not entries:
            entries = _generate_leaderboard(period, limit, offset)

        return jsonify({
            'leaderboard': [e.to_dict() for e in entries],
            'period': period,
            'count': len(entries),
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to get leaderboard: {str(e)}'}), 500


def _generate_leaderboard(period: str, limit: int, offset: int) -> list:
    """Generate leaderboard from trade data."""
    from datetime import datetime, timedelta

    # Determine date range
    now = datetime.utcnow()
    if period == 'daily':
        start_date = now - timedelta(days=1)
    elif period == 'weekly':
        start_date = now - timedelta(weeks=1)
    elif period == 'monthly':
        start_date = now - timedelta(days=30)
    else:  # alltime
        start_date = datetime(2020, 1, 1)

    # Aggregate trade data by user
    results = db.session.query(
        User.id,
        User.username,
        func.sum(Trade.pnl).label('total_pnl'),
        func.count(Trade.id).label('total_trades'),
        func.sum(
            db.case((Trade.pnl > 0, 1), else_=0)
        ).label('winning_trades'),
    ).join(
        Trade, User.id == Trade.user_id
    ).filter(
        Trade.status == 'closed',
        Trade.closed_at >= start_date,
    ).group_by(
        User.id, User.username
    ).having(
        func.count(Trade.id) >= 5  # Minimum 5 trades to rank
    ).order_by(
        desc('total_pnl')
    ).offset(offset).limit(limit).all()

    entries = []
    for i, row in enumerate(results):
        win_rate = (row.winning_trades / row.total_trades * 100) if row.total_trades > 0 else 0

        # Get follower count
        followers = StrategyFollow.query.join(
            Strategy
        ).filter(
            Strategy.user_id == row.id,
            StrategyFollow.is_active == True
        ).count()

        entry = LeaderboardEntry(
            user_id=row.id,
            username=row.username,
            rank=offset + i + 1,
            total_pnl=row.total_pnl or 0,
            total_return_pct=0,  # Would need starting balance to calculate
            win_rate=win_rate,
            total_trades=row.total_trades,
            followers_count=followers,
            period=period,
        )
        entries.append(entry)

    return entries


@leaderboard_bp.route('/my-rank', methods=['GET'])
@jwt_required_custom
def get_my_rank():
    """Get current user's leaderboard position."""
    try:
        user = g.current_user
        period = request.args.get('period', 'monthly')

        # Get user's entry
        entry = LeaderboardEntry.query.filter_by(
            user_id=user.id,
            period=period
        ).first()

        if entry:
            return jsonify({
                'rank': entry.rank,
                'stats': entry.to_dict(),
            }), 200

        # Calculate from trades if not cached
        from datetime import datetime, timedelta

        now = datetime.utcnow()
        if period == 'monthly':
            start_date = now - timedelta(days=30)
        else:
            start_date = datetime(2020, 1, 1)

        trades = Trade.query.filter(
            Trade.user_id == user.id,
            Trade.status == 'closed',
            Trade.closed_at >= start_date,
        ).all()

        if not trades:
            return jsonify({
                'rank': None,
                'message': 'Not enough trades to rank',
            }), 200

        total_pnl = sum(float(t.pnl or 0) for t in trades)
        winning = sum(1 for t in trades if t.pnl and t.pnl > 0)

        return jsonify({
            'rank': None,  # Would need full calculation
            'stats': {
                'total_pnl': round(total_pnl, 2),
                'total_trades': len(trades),
                'winning_trades': winning,
                'win_rate': round(winning / len(trades) * 100, 2) if trades else 0,
            },
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to get rank: {str(e)}'}), 500


@leaderboard_bp.route('/top-strategies', methods=['GET'])
@jwt_required_custom
def get_top_strategies():
    """Get top performing public strategies."""
    try:
        limit = min(int(request.args.get('limit', 10)), 50)
        category = request.args.get('category')

        query = Strategy.query.filter(
            Strategy.is_public == True,
            Strategy.total_trades >= 10,  # Minimum trades
        )

        if category:
            query = query.filter_by(category=category)

        strategies = query.order_by(
            Strategy.win_rate.desc(),
            Strategy.total_pnl.desc()
        ).limit(limit).all()

        return jsonify({
            'strategies': [s.to_dict() for s in strategies],
            'count': len(strategies),
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to get strategies: {str(e)}'}), 500

"""
Strategy routes for TO THE MOON.
"""
from flask import Blueprint, request, jsonify, g
from models import db, Strategy, StrategyFollow, Subscription
from utils.auth import jwt_required_custom, pro_required
from services.backtest_service import BacktestService

strategies_bp = Blueprint('strategies', __name__)


@strategies_bp.route('', methods=['GET'])
@jwt_required_custom
def get_strategies():
    """Get user's strategies."""
    try:
        user = g.current_user

        # Get query params
        include_templates = request.args.get('templates', 'false').lower() == 'true'

        # Get user's strategies
        query = Strategy.query.filter_by(user_id=user.id)

        if not include_templates:
            query = query.filter_by(is_template=False)

        strategies = query.order_by(Strategy.created_at.desc()).all()

        return jsonify({
            'strategies': [s.to_dict() for s in strategies],
            'count': len(strategies),
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to get strategies: {str(e)}'}), 500


@strategies_bp.route('/<int:strategy_id>', methods=['GET'])
@jwt_required_custom
def get_strategy(strategy_id):
    """Get a specific strategy."""
    try:
        user = g.current_user
        strategy = Strategy.query.get(strategy_id)

        if not strategy:
            return jsonify({'error': 'Strategy not found'}), 404

        # Check access - user owns it or it's public
        if strategy.user_id != user.id and not strategy.is_public:
            return jsonify({'error': 'Access denied'}), 403

        return jsonify({
            'strategy': strategy.to_dict(),
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to get strategy: {str(e)}'}), 500


@strategies_bp.route('', methods=['POST'])
@pro_required
def create_strategy():
    """Create a new strategy (Pro only)."""
    try:
        user = g.current_user
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Request body required'}), 400

        name = data.get('name', '').strip()
        if not name:
            return jsonify({'error': 'Strategy name required'}), 400

        if len(name) > 100:
            return jsonify({'error': 'Strategy name too long (max 100 chars)'}), 400

        strategy = Strategy(
            user_id=user.id,
            name=name,
            description=data.get('description', ''),
            category=data.get('category', 'crypto'),
            config=data.get('config', {}),
            is_public=data.get('is_public', False),
        )

        db.session.add(strategy)
        db.session.commit()

        return jsonify({
            'message': 'Strategy created',
            'strategy': strategy.to_dict(),
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create strategy: {str(e)}'}), 500


@strategies_bp.route('/<int:strategy_id>', methods=['PUT'])
@pro_required
def update_strategy(strategy_id):
    """Update a strategy."""
    try:
        user = g.current_user
        strategy = Strategy.query.get(strategy_id)

        if not strategy:
            return jsonify({'error': 'Strategy not found'}), 404

        if strategy.user_id != user.id:
            return jsonify({'error': 'Access denied'}), 403

        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body required'}), 400

        # Update fields
        if 'name' in data:
            strategy.name = data['name'][:100]
        if 'description' in data:
            strategy.description = data['description']
        if 'category' in data:
            strategy.category = data['category']
        if 'config' in data:
            strategy.config = data['config']
        if 'is_public' in data:
            strategy.is_public = bool(data['is_public'])

        db.session.commit()

        return jsonify({
            'message': 'Strategy updated',
            'strategy': strategy.to_dict(),
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update strategy: {str(e)}'}), 500


@strategies_bp.route('/<int:strategy_id>', methods=['DELETE'])
@jwt_required_custom
def delete_strategy(strategy_id):
    """Delete a strategy."""
    try:
        user = g.current_user
        strategy = Strategy.query.get(strategy_id)

        if not strategy:
            return jsonify({'error': 'Strategy not found'}), 404

        if strategy.user_id != user.id:
            return jsonify({'error': 'Access denied'}), 403

        db.session.delete(strategy)
        db.session.commit()

        return jsonify({'message': 'Strategy deleted'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete strategy: {str(e)}'}), 500


@strategies_bp.route('/templates', methods=['GET'])
@jwt_required_custom
def get_templates():
    """Get pre-built strategy templates."""
    try:
        templates = Strategy.query.filter_by(is_template=True).all()

        return jsonify({
            'templates': [t.to_dict() for t in templates],
            'count': len(templates),
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to get templates: {str(e)}'}), 500


@strategies_bp.route('/marketplace', methods=['GET'])
@jwt_required_custom
def get_marketplace_strategies():
    """Get public strategies for marketplace."""
    try:
        # Get query params
        category = request.args.get('category')
        sort_by = request.args.get('sort', 'popular')  # popular, returns, recent
        limit = min(int(request.args.get('limit', 50)), 100)
        offset = int(request.args.get('offset', 0))

        query = Strategy.query.filter_by(is_public=True, is_template=False)

        if category:
            query = query.filter_by(category=category)

        # Sort
        if sort_by == 'returns':
            query = query.order_by(Strategy.total_pnl.desc())
        elif sort_by == 'recent':
            query = query.order_by(Strategy.created_at.desc())
        else:  # popular
            query = query.order_by(Strategy.subscribers_count.desc())

        strategies = query.offset(offset).limit(limit).all()

        return jsonify({
            'strategies': [s.to_dict() for s in strategies],
            'count': len(strategies),
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to get marketplace: {str(e)}'}), 500


@strategies_bp.route('/<int:strategy_id>/follow', methods=['POST'])
@jwt_required_custom
def follow_strategy(strategy_id):
    """Follow/copy a strategy."""
    try:
        user = g.current_user
        strategy = Strategy.query.get(strategy_id)

        if not strategy:
            return jsonify({'error': 'Strategy not found'}), 404

        if not strategy.is_public and strategy.user_id != user.id:
            return jsonify({'error': 'Strategy not available'}), 403

        # Check if already following
        existing = StrategyFollow.query.filter_by(
            user_id=user.id,
            strategy_id=strategy_id
        ).first()

        if existing:
            existing.is_active = True
        else:
            follow = StrategyFollow(
                user_id=user.id,
                strategy_id=strategy_id,
            )
            db.session.add(follow)

            # Update subscriber count
            strategy.subscribers_count += 1

        db.session.commit()

        return jsonify({
            'message': 'Strategy followed',
            'strategy_id': strategy_id,
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to follow strategy: {str(e)}'}), 500


@strategies_bp.route('/<int:strategy_id>/unfollow', methods=['POST'])
@jwt_required_custom
def unfollow_strategy(strategy_id):
    """Unfollow a strategy."""
    try:
        user = g.current_user

        follow = StrategyFollow.query.filter_by(
            user_id=user.id,
            strategy_id=strategy_id
        ).first()

        if follow:
            follow.is_active = False

            # Update subscriber count
            strategy = Strategy.query.get(strategy_id)
            if strategy and strategy.subscribers_count > 0:
                strategy.subscribers_count -= 1

            db.session.commit()

        return jsonify({
            'message': 'Strategy unfollowed',
            'strategy_id': strategy_id,
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to unfollow strategy: {str(e)}'}), 500


@strategies_bp.route('/backtest', methods=['POST'])
@pro_required
def run_backtest():
    """Run a backtest simulation (Pro only)."""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Request body required'}), 400

        strategy_config = data.get('config', {})
        initial_capital = float(data.get('initial_capital', 10000))

        if initial_capital < 100 or initial_capital > 10000000:
            return jsonify({'error': 'Initial capital must be between $100 and $10M'}), 400

        result = BacktestService.run_backtest(
            strategy_config=strategy_config,
            initial_capital=initial_capital,
        )

        return jsonify(result), 200

    except Exception as e:
        return jsonify({'error': f'Backtest failed: {str(e)}'}), 500


# ============================================
# DEPLOYED STRATEGIES ENDPOINTS
# ============================================

def simulate_strategy_activity(strategy):
    """
    Simulate trading activity for a running strategy.
    Updates P&L and trade counts based on time elapsed since last check.
    """
    from datetime import datetime, timedelta
    import random
    
    if strategy.status != 'running':
        return
    
    # Calculate time since deployment or last trade
    last_activity = strategy.last_trade_at or strategy.deployed_at
    now = datetime.utcnow()
    hours_elapsed = (now - last_activity).total_seconds() / 3600
    
    # Don't simulate if less than 1 hour has passed
    if hours_elapsed < 1:
        return
    
    # Simulate trades based on hours elapsed (1-3 trades per day on average)
    trades_per_hour = random.uniform(0.04, 0.125)  # 1-3 trades per day
    num_trades = int(hours_elapsed * trades_per_hour)
    
    if num_trades < 1:
        return
    
    # Get strategy config for win rate simulation
    config = strategy.config or {}
    base_win_rate = config.get('winRate', 65) / 100
    
    for _ in range(num_trades):
        is_win = random.random() < base_win_rate
        
        if is_win:
            # Winning trade: 2-15% of trade size
            trade_pnl = random.uniform(0.02, 0.15) * min(strategy.allocated_capital * 0.1, 500)
            strategy.winning_trades += 1
        else:
            # Losing trade: 1-8% of trade size (smaller losses)
            trade_pnl = -random.uniform(0.01, 0.08) * min(strategy.allocated_capital * 0.1, 500)
            strategy.losing_trades += 1
        
        strategy.total_trades += 1
        strategy.total_pnl = (strategy.total_pnl or 0) + trade_pnl
    
    # Update win rate
    if strategy.total_trades > 0:
        strategy.win_rate = (strategy.winning_trades / strategy.total_trades) * 100
    
    strategy.last_trade_at = now
    

@strategies_bp.route('/deployed', methods=['GET'])
@jwt_required_custom
def get_deployed_strategies():
    """Get user's deployed strategies with simulated activity."""
    try:
        from models import DeployedStrategy
        user = g.current_user

        strategies = DeployedStrategy.query.filter_by(user_id=user.id).order_by(
            DeployedStrategy.deployed_at.desc()
        ).all()
        
        # Simulate activity for each running strategy
        for strategy in strategies:
            simulate_strategy_activity(strategy)
        
        # Save any updates from simulation
        db.session.commit()

        return jsonify({
            'strategies': [s.to_dict() for s in strategies],
            'count': len(strategies),
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to get deployed strategies: {str(e)}'}), 500


@strategies_bp.route('/deployed/<string:strategy_id>/activity', methods=['GET'])
@jwt_required_custom
def get_strategy_activity(strategy_id):
    """Get recent activity log for a deployed strategy."""
    try:
        from models import DeployedStrategy
        from datetime import datetime, timedelta
        import random
        
        user = g.current_user
        deployed = DeployedStrategy.query.get(strategy_id)

        if not deployed:
            return jsonify({'error': 'Strategy not found'}), 404

        if deployed.user_id != user.id:
            return jsonify({'error': 'Access denied'}), 403

        # Generate simulated activity based on strategy history
        activities = []
        markets = deployed.markets or ['Kalshi', 'Polymarket']
        config = deployed.config or {}
        
        now = datetime.utcnow()
        
        # If strategy has trades, generate activity
        if deployed.total_trades > 0:
            for i in range(min(deployed.total_trades, 20)):  # Last 20 activities
                hours_ago = i * random.uniform(1, 6)
                activity_time = now - timedelta(hours=hours_ago)
                
                market = random.choice(markets)
                is_win = random.random() < (deployed.win_rate / 100 if deployed.win_rate else 0.6)
                
                if is_win:
                    pnl = random.uniform(5, 50)
                    activity = {
                        'id': f'act_{i}',
                        'type': 'trade_closed',
                        'message': f'Closed winning trade on {market}',
                        'pnl': round(pnl, 2),
                        'market': market,
                        'timestamp': activity_time.isoformat(),
                    }
                else:
                    pnl = -random.uniform(3, 25)
                    activity = {
                        'id': f'act_{i}',
                        'type': 'trade_closed',
                        'message': f'Closed trade on {market}',
                        'pnl': round(pnl, 2),
                        'market': market,
                        'timestamp': activity_time.isoformat(),
                    }
                activities.append(activity)
        
        # Add recent scanning activity
        scan_messages = [
            f'Scanned {random.randint(15, 50)} opportunities on {random.choice(markets)}',
            f'Identified {random.randint(1, 5)}% edge on {random.choice(markets)}',
            f'Monitoring price movements on {random.choice(markets)}',
            f'Analyzed market conditions - waiting for entry',
        ]
        
        for i in range(5):
            minutes_ago = i * random.randint(5, 20)
            activities.insert(0, {
                'id': f'scan_{i}',
                'type': 'scan',
                'message': random.choice(scan_messages),
                'timestamp': (now - timedelta(minutes=minutes_ago)).isoformat(),
            })

        return jsonify({
            'activities': activities[:25],  # Limit to 25 most recent
            'strategy': deployed.to_dict(),
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to get activity: {str(e)}'}), 500


@strategies_bp.route('/deploy', methods=['POST'])
@jwt_required_custom
def deploy_strategy():
    """Deploy a strategy for paper or live trading."""
    try:
        from models import DeployedStrategy, PaperPortfolio
        from services.paper_trading_service import PaperTradingService
        
        user = g.current_user
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Request body required'}), 400

        name = data.get('name', '').strip()
        if not name:
            return jsonify({'error': 'Strategy name required'}), 400

        mode = data.get('mode', 'paper')
        capital = float(data.get('capital', 1000))
        
        if capital < 100 or capital > 100000:
            return jsonify({'error': 'Capital must be between $100 and $100,000'}), 400

        # Get or create paper portfolio for paper trading
        portfolio_id = None
        if mode == 'paper':
            portfolio = PaperTradingService.get_or_create_portfolio(user.id)
            portfolio_id = portfolio.id

        deployed = DeployedStrategy(
            user_id=user.id,
            portfolio_id=portfolio_id,
            name=name,
            description=data.get('description', ''),
            icon=data.get('icon', '⚡'),
            template_id=data.get('templateId'),
            config=data.get('config', {}),
            markets=data.get('markets', []),
            categories=data.get('categories', []),
            mode=mode,
            allocated_capital=capital,
            status='running',
        )

        db.session.add(deployed)
        db.session.commit()

        return jsonify({
            'message': 'Strategy deployed successfully',
            'strategy': deployed.to_dict(),
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to deploy strategy: {str(e)}'}), 500


@strategies_bp.route('/deployed/<string:strategy_id>/stop', methods=['POST'])
@jwt_required_custom
def stop_deployed_strategy(strategy_id):
    """Stop a deployed strategy."""
    try:
        from models import DeployedStrategy
        from datetime import datetime
        
        user = g.current_user
        deployed = DeployedStrategy.query.get(strategy_id)

        if not deployed:
            return jsonify({'error': 'Strategy not found'}), 404

        if deployed.user_id != user.id:
            return jsonify({'error': 'Access denied'}), 403

        deployed.status = 'stopped'
        deployed.stopped_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Strategy stopped',
            'strategy': deployed.to_dict(),
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to stop strategy: {str(e)}'}), 500


@strategies_bp.route('/deployed/<string:strategy_id>/resume', methods=['POST'])
@jwt_required_custom
def resume_deployed_strategy(strategy_id):
    """Resume a stopped strategy."""
    try:
        from models import DeployedStrategy
        
        user = g.current_user
        deployed = DeployedStrategy.query.get(strategy_id)

        if not deployed:
            return jsonify({'error': 'Strategy not found'}), 404

        if deployed.user_id != user.id:
            return jsonify({'error': 'Access denied'}), 403

        deployed.status = 'running'
        deployed.stopped_at = None
        db.session.commit()

        return jsonify({
            'message': 'Strategy resumed',
            'strategy': deployed.to_dict(),
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to resume strategy: {str(e)}'}), 500


@strategies_bp.route('/deployed/<string:strategy_id>', methods=['DELETE'])
@jwt_required_custom
def delete_deployed_strategy(strategy_id):
    """Delete a deployed strategy."""
    try:
        from models import DeployedStrategy
        
        user = g.current_user
        deployed = DeployedStrategy.query.get(strategy_id)

        if not deployed:
            return jsonify({'error': 'Strategy not found'}), 404

        if deployed.user_id != user.id:
            return jsonify({'error': 'Access denied'}), 403

        db.session.delete(deployed)
        db.session.commit()

        return jsonify({'message': 'Strategy removed'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete strategy: {str(e)}'}), 500

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

@strategies_bp.route('/deployed', methods=['GET'])
@jwt_required_custom
def get_deployed_strategies():
    """Get user's deployed strategies."""
    try:
        from models import DeployedStrategy
        user = g.current_user

        strategies = DeployedStrategy.query.filter_by(user_id=user.id).order_by(
            DeployedStrategy.deployed_at.desc()
        ).all()

        return jsonify({
            'strategies': [s.to_dict() for s in strategies],
            'count': len(strategies),
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to get deployed strategies: {str(e)}'}), 500


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

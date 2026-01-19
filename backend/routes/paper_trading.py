"""
Paper Trading API Routes
Endpoints for paper trading operations.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.paper_trading_service import PaperTradingService

paper_trading_bp = Blueprint('paper_trading', __name__)


@paper_trading_bp.route('/api/paper/portfolio', methods=['GET'])
@jwt_required()
def get_portfolio():
    """Get user's paper trading portfolio."""
    try:
        user_id = get_jwt_identity()
        summary = PaperTradingService.get_portfolio_summary(user_id)
        return jsonify(summary), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@paper_trading_bp.route('/api/paper/portfolio/reset', methods=['POST'])
@jwt_required()
def reset_portfolio():
    """Reset paper trading portfolio to starting balance."""
    try:
        user_id = get_jwt_identity()
        portfolio = PaperTradingService.reset_portfolio(user_id)
        return jsonify({
            'message': 'Portfolio reset to $100,000',
            'portfolio': portfolio.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@paper_trading_bp.route('/api/paper/trade', methods=['POST'])
@jwt_required()
def execute_trade():
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
        "price": 0.65,  // optional, uses market price if not provided
        "strategyId": "strat_123"  // optional
    }
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required = ['platform', 'marketId', 'marketTitle', 'side', 'action', 'quantity']
        for field in required:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate values
        if data['side'] not in ['yes', 'no']:
            return jsonify({'error': 'Side must be "yes" or "no"'}), 400
        
        if data['action'] not in ['buy', 'sell']:
            return jsonify({'error': 'Action must be "buy" or "sell"'}), 400
        
        if not isinstance(data['quantity'], int) or data['quantity'] <= 0:
            return jsonify({'error': 'Quantity must be a positive integer'}), 400
        
        # Execute trade
        success, message, trade = PaperTradingService.execute_trade(
            user_id=user_id,
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
            # Get updated portfolio
            summary = PaperTradingService.get_portfolio_summary(user_id)
            return jsonify({
                'message': message,
                'trade': trade.to_dict() if trade else None,
                'portfolio': summary['portfolio'],
            }), 200
        else:
            return jsonify({'error': message}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@paper_trading_bp.route('/api/paper/positions', methods=['GET'])
@jwt_required()
def get_positions():
    """Get all open positions."""
    try:
        user_id = get_jwt_identity()
        positions = PaperTradingService.get_open_positions(user_id)
        return jsonify({'positions': positions}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@paper_trading_bp.route('/api/paper/positions/<position_id>/close', methods=['POST'])
@jwt_required()
def close_position(position_id):
    """Close an open position at current market price."""
    try:
        user_id = get_jwt_identity()
        success, message = PaperTradingService.close_position(user_id, position_id)
        
        if success:
            summary = PaperTradingService.get_portfolio_summary(user_id)
            return jsonify({
                'message': message,
                'portfolio': summary['portfolio'],
            }), 200
        else:
            return jsonify({'error': message}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@paper_trading_bp.route('/api/paper/trades', methods=['GET'])
@jwt_required()
def get_trade_history():
    """Get paper trade history."""
    try:
        user_id = get_jwt_identity()
        limit = request.args.get('limit', 50, type=int)
        trades = PaperTradingService.get_trade_history(user_id, limit=limit)
        return jsonify({'trades': trades}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@paper_trading_bp.route('/api/paper/update-prices', methods=['POST'])
@jwt_required()
def update_prices():
    """Update all position prices with current market data."""
    try:
        user_id = get_jwt_identity()
        portfolio = PaperTradingService.update_positions_prices(user_id)
        
        if portfolio:
            return jsonify({
                'message': 'Prices updated',
                'portfolio': portfolio.to_dict(),
            }), 200
        else:
            return jsonify({'error': 'Portfolio not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================
# Quick Trade Endpoints (for strategy execution)
# ============================================

@paper_trading_bp.route('/api/paper/quick-buy', methods=['POST'])
@jwt_required()
def quick_buy():
    """
    Quick buy for strategy execution.
    Simplified endpoint that calculates quantity from dollar amount.
    
    Request body:
    {
        "platform": "kalshi",
        "marketId": "MARKET-123",
        "marketTitle": "Will X happen?",
        "side": "yes",
        "amount": 100,  // Dollar amount to invest
        "strategyId": "strat_123"  // optional
    }
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Get current price
        price = PaperTradingService.get_market_price(
            data.get('platform', 'kalshi'),
            data.get('marketId')
        )
        
        # Adjust for NO side
        trade_price = price if data.get('side') == 'yes' else (1 - price)
        
        # Calculate quantity from dollar amount
        amount = data.get('amount', 100)
        quantity = int(amount / trade_price)
        
        if quantity <= 0:
            return jsonify({'error': 'Amount too small for trade'}), 400
        
        success, message, trade = PaperTradingService.execute_trade(
            user_id=user_id,
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
            summary = PaperTradingService.get_portfolio_summary(user_id)
            return jsonify({
                'message': message,
                'trade': trade.to_dict() if trade else None,
                'portfolio': summary['portfolio'],
            }), 200
        else:
            return jsonify({'error': message}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

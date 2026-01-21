"""
Scanner API Routes
Endpoints for the market scanner and arbitrage engine.
"""
from flask import Blueprint, request, jsonify, g
from functools import wraps
import logging
import jwt
import os

from models import db, User, ConnectedAccount
from services.scanner.market_scanner import (
    get_scanner, start_scanner, Platform, ScannerConfig
)
from services.scanner.arbitrage_engine import get_engine, ArbitrageConfig

logger = logging.getLogger(__name__)

scanner_bp = Blueprint('scanner', __name__, url_prefix='/api/scanner')


def token_required(f):
    """Verify JWT token."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token or not token.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid token'}), 401
        
        try:
            token = token.split(' ')[1]
            payload = jwt.decode(
                token,
                os.environ.get('JWT_SECRET_KEY', 'dev-secret-key'),
                algorithms=['HS256']
            )
            g.user_id = payload['user_id']
            g.user = User.query.get(g.user_id)
            if not g.user:
                return jsonify({'error': 'User not found'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(*args, **kwargs)
    return decorated


@scanner_bp.route('/start', methods=['POST'])
@token_required
def start_scanner_endpoint():
    """
    Start the market scanner.
    POST /api/scanner/start
    Body: {
        "platforms": ["kalshi"],  // optional
        "scanInterval": 5.0,      // optional, seconds
        "categories": [],          // optional
        "minVolume": 100,          // optional
        "watchKeywords": []        // optional
    }
    """
    try:
        data = request.get_json() or {}
        
        # Build config from request
        config = ScannerConfig(
            platforms=[Platform.KALSHI],  # Start with Kalshi only
            scan_interval=data.get('scanInterval', 5.0),
            categories=data.get('categories', []),
            min_volume=data.get('minVolume', 100),
            watch_keywords=data.get('watchKeywords', []),
        )
        
        # Start scanner
        scanner = start_scanner(config)
        
        # Start engine
        arb_config = ArbitrageConfig(
            min_mispricing_edge=data.get('minMispricingEdge', 2.0),
            min_momentum_change=data.get('minMomentumChange', 10.0),
            min_spread_edge=data.get('minSpreadEdge', 3.0),
        )
        engine = get_engine()
        engine.config = arb_config
        
        # Connect engine to scanner for real-time analysis
        def analyze_on_update(market):
            signal = engine.analyze_market(market)
            if signal:
                logger.info(f"New signal: {signal.signal_type.value} on {signal.ticker}")
        
        scanner.on_price_update(analyze_on_update)
        scanner.on_new_market(analyze_on_update)
        
        return jsonify({
            'success': True,
            'message': 'Scanner started',
            'config': {
                'scanInterval': config.scan_interval,
                'platforms': [p.value for p in config.platforms],
                'minVolume': config.min_volume,
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error starting scanner: {e}")
        return jsonify({'error': str(e)}), 500


@scanner_bp.route('/stop', methods=['POST'])
@token_required
def stop_scanner_endpoint():
    """
    Stop the market scanner.
    POST /api/scanner/stop
    """
    try:
        scanner = get_scanner()
        scanner.stop()
        
        return jsonify({
            'success': True,
            'message': 'Scanner stopped'
        }), 200
        
    except Exception as e:
        logger.error(f"Error stopping scanner: {e}")
        return jsonify({'error': str(e)}), 500


@scanner_bp.route('/status', methods=['GET'])
@token_required
def get_scanner_status():
    """
    Get scanner status and statistics.
    GET /api/scanner/status
    """
    try:
        scanner = get_scanner()
        engine = get_engine()
        
        return jsonify({
            'scanner': scanner.get_stats(),
            'engine': engine.get_stats(),
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting status: {e}")
        return jsonify({'error': str(e)}), 500


@scanner_bp.route('/markets', methods=['GET'])
@token_required
def get_markets():
    """
    Get current markets from scanner.
    GET /api/scanner/markets?platform=kalshi&category=sports&search=nfl&sort=volume&limit=50
    """
    try:
        platform_str = request.args.get('platform')
        category = request.args.get('category')
        search = request.args.get('search')
        sort_by = request.args.get('sort', 'volume')
        limit = int(request.args.get('limit', 50))
        
        platform = None
        if platform_str:
            try:
                platform = Platform(platform_str)
            except ValueError:
                return jsonify({'error': f'Invalid platform: {platform_str}'}), 400
        
        scanner = get_scanner()
        markets = scanner.get_markets(
            platform=platform,
            category=category,
            search=search,
            sort_by=sort_by,
            limit=limit
        )
        
        return jsonify({
            'markets': [m.to_dict() for m in markets],
            'count': len(markets),
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting markets: {e}")
        return jsonify({'error': str(e)}), 500


@scanner_bp.route('/markets/<platform>/<ticker>', methods=['GET'])
@token_required
def get_market_detail(platform, ticker):
    """
    Get detailed info for a specific market.
    GET /api/scanner/markets/kalshi/SOME-TICKER
    """
    try:
        try:
            platform_enum = Platform(platform)
        except ValueError:
            return jsonify({'error': f'Invalid platform: {platform}'}), 400
        
        scanner = get_scanner()
        market = scanner.get_market(platform_enum, ticker)
        
        if not market:
            return jsonify({'error': 'Market not found'}), 404
        
        # Get price history
        price_history = scanner.get_price_history(platform_enum, ticker, minutes=60)
        
        return jsonify({
            'market': market.to_dict(),
            'priceHistory': [
                {'timestamp': ts.isoformat(), 'price': price}
                for ts, price in price_history
            ]
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting market detail: {e}")
        return jsonify({'error': str(e)}), 500


@scanner_bp.route('/signals', methods=['GET'])
@token_required
def get_signals():
    """
    Get active trading signals.
    GET /api/scanner/signals?minConfidence=0.7
    """
    try:
        min_confidence = request.args.get('minConfidence', type=float)
        
        engine = get_engine()
        signals = engine.get_active_signals(min_confidence=min_confidence)
        
        return jsonify({
            'signals': [s.to_dict() for s in signals],
            'count': len(signals),
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting signals: {e}")
        return jsonify({'error': str(e)}), 500


@scanner_bp.route('/signals/clear', methods=['POST'])
@token_required
def clear_signals():
    """
    Clear all active signals.
    POST /api/scanner/signals/clear
    """
    try:
        engine = get_engine()
        engine.clear_signals()
        
        return jsonify({
            'success': True,
            'message': 'Signals cleared'
        }), 200
        
    except Exception as e:
        logger.error(f"Error clearing signals: {e}")
        return jsonify({'error': str(e)}), 500


@scanner_bp.route('/refresh', methods=['POST'])
@token_required
def refresh_markets():
    """
    Force immediate market refresh.
    POST /api/scanner/refresh
    """
    try:
        scanner = get_scanner()
        scanner.refresh_now()
        
        return jsonify({
            'success': True,
            'message': 'Markets refreshed'
        }), 200
        
    except Exception as e:
        logger.error(f"Error refreshing markets: {e}")
        return jsonify({'error': str(e)}), 500
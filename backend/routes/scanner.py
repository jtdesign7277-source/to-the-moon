"""
Scanner API Routes
Endpoints for the market scanner and arbitrage engine.
Includes live Kalshi market data via SDK.
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
from services.kalshi_sdk_service import (
    get_kalshi_client, get_live_markets, get_market_price, get_market_orderbook_depth
)

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
        "platforms": ["kalshi"],  // which platforms to scan
        "minEdge": 2.5,           // minimum edge % to generate signal
        "maxPosition": 350,       // max position size in USD
        "stopLoss": 15,           // stop loss %
        "takeProfit": 15,         // take profit %
    }
    """
    try:
        data = request.get_json() or {}
        
        # Get platforms from request (frontend sends array of strings)
        requested_platforms = data.get('platforms', ['kalshi'])
        
        # Map to Platform enum (only kalshi is live for now)
        platforms = []
        for p in requested_platforms:
            if p.lower() == 'kalshi':
                platforms.append(Platform.KALSHI)
        
        if not platforms:
            platforms = [Platform.KALSHI]  # Default to Kalshi
        
        # Build scanner config
        config = ScannerConfig(
            platforms=platforms,
            scan_interval=30.0,  # Scan every 30 seconds for continuous scanning
            categories=data.get('categories', []),
            min_volume=data.get('minVolume', 100),
            watch_keywords=data.get('watchKeywords', []),
        )
        
        # Start scanner
        scanner = start_scanner(config)
        
        # Configure arbitrage engine with user's risk settings
        arb_config = ArbitrageConfig(
            min_mispricing_edge=data.get('minEdge', 2.5),
            min_momentum_change=data.get('minMomentumChange', 10.0),
            min_spread_edge=data.get('minSpreadEdge', 3.0),
        )
        engine = get_engine()
        engine.config = arb_config
        
        # Store user's risk settings for signal generation
        engine.user_config = {
            'maxPosition': data.get('maxPosition', 350),
            'stopLoss': data.get('stopLoss', 15),
            'takeProfit': data.get('takeProfit', 15),
        }
        
        # Connect engine to scanner for real-time analysis
        def analyze_on_update(market):
            signal = engine.analyze_market(market)
            if signal:
                logger.info(f"New signal: {signal.signal_type.value} on {signal.ticker}")
        
        scanner.on_price_update(analyze_on_update)
        scanner.on_new_market(analyze_on_update)
        
        logger.info(f"Scanner started with platforms={requested_platforms}, minEdge={data.get('minEdge', 2.5)}")
        
        return jsonify({
            'success': True,
            'message': 'Scanner started',
            'running': True,
            'config': {
                'platforms': requested_platforms,
                'minEdge': data.get('minEdge', 2.5),
                'maxPosition': data.get('maxPosition', 350),
                'stopLoss': data.get('stopLoss', 15),
                'takeProfit': data.get('takeProfit', 15),
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
        
        scanner_stats = scanner.get_stats()
        engine_stats = engine.get_stats()
        active_signals = engine.get_active_signals()
        
        # Return in format expected by frontend
        return jsonify({
            'running': scanner_stats.get('isRunning', False),
            'lastScan': scanner_stats.get('lastScanTime'),
            'scanCount': scanner_stats.get('scanCount', 0),
            'signalCount': len(active_signals),
            'signals': [s.to_dict() for s in active_signals[:20]],
            'config': scanner_stats.get('config'),
            'scanner': scanner_stats,
            'engine': engine_stats,
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


# ============================================
# LIVE KALSHI MARKET DATA ENDPOINTS (SDK)
# ============================================

@scanner_bp.route('/live/markets', methods=['GET'])
@token_required
def get_live_kalshi_markets():
    """
    Get real-time markets from Kalshi via SDK.
    GET /api/scanner/live/markets?status=open&limit=100&category=politics
    
    Returns actual Kalshi market data for the scanner.
    """
    try:
        status = request.args.get('status', 'open')
        limit = int(request.args.get('limit', 100))
        category = request.args.get('category')
        
        client = get_kalshi_client()
        success, data = client.get_markets(status=status, limit=limit)
        
        if not success:
            return jsonify({'error': data.get('error', 'Failed to fetch markets')}), 500
        
        markets = data.get('markets', [])
        
        # Filter by category if specified
        if category:
            markets = [m for m in markets if m.get('category') == category]
        
        # Transform to scanner-friendly format
        scanner_markets = []
        for m in markets:
            # Calculate edge/opportunity metrics
            yes_bid = m.get('yes_bid') or 0
            yes_ask = m.get('yes_ask') or 0
            spread = yes_ask - yes_bid if yes_ask and yes_bid else 0
            spread_pct = (spread / yes_ask * 100) if yes_ask else 0
            
            scanner_markets.append({
                'ticker': m.get('ticker'),
                'title': m.get('title'),
                'platform': 'kalshi',
                'category': m.get('category', 'other'),
                'status': m.get('status'),
                # Prices (in cents, 0-100)
                'yesBid': yes_bid,
                'yesAsk': yes_ask,
                'noBid': m.get('no_bid') or 0,
                'noAsk': m.get('no_ask') or 0,
                'lastPrice': m.get('last_price'),
                # Volume & liquidity
                'volume': m.get('volume', 0),
                'volume24h': m.get('volume_24h', 0),
                'openInterest': m.get('open_interest', 0),
                # Spread analysis
                'spread': spread,
                'spreadPct': round(spread_pct, 2),
                # Timing
                'closeTime': m.get('close_time'),
                'expirationTime': m.get('expiration_time'),
                # Related
                'seriesTicker': m.get('series_ticker'),
                'eventTicker': m.get('event_ticker'),
            })
        
        return jsonify({
            'markets': scanner_markets,
            'count': len(scanner_markets),
            'source': 'kalshi_live',
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching live markets: {e}")
        return jsonify({'error': str(e)}), 500


@scanner_bp.route('/live/markets/<ticker>', methods=['GET'])
@token_required
def get_live_market_detail(ticker):
    """
    Get detailed info for a specific Kalshi market.
    GET /api/scanner/live/markets/TICKER-123
    """
    try:
        client = get_kalshi_client()
        success, data = client.get_market(ticker)
        
        if not success:
            return jsonify({'error': data.get('error', 'Market not found')}), 404
        
        # Also fetch order book depth
        ob_success, orderbook = client.get_orderbook(ticker, depth=5)
        
        return jsonify({
            'market': data,
            'orderbook': orderbook if ob_success else None,
            'source': 'kalshi_live',
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching market {ticker}: {e}")
        return jsonify({'error': str(e)}), 500


@scanner_bp.route('/live/events', methods=['GET'])
@token_required
def get_live_events():
    """
    Get events (groups of related markets) from Kalshi.
    GET /api/scanner/live/events?status=open&limit=50
    """
    try:
        status = request.args.get('status', 'open')
        limit = int(request.args.get('limit', 50))
        
        client = get_kalshi_client()
        success, data = client.get_events(status=status, limit=limit)
        
        if not success:
            return jsonify({'error': data.get('error', 'Failed to fetch events')}), 500
        
        return jsonify({
            'events': data.get('events', []),
            'count': data.get('count', 0),
            'source': 'kalshi_live',
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching events: {e}")
        return jsonify({'error': str(e)}), 500


@scanner_bp.route('/live/orderbook/<ticker>', methods=['GET'])
@token_required
def get_live_orderbook(ticker):
    """
    Get order book for a specific market.
    GET /api/scanner/live/orderbook/TICKER-123?depth=10
    """
    try:
        depth = int(request.args.get('depth', 10))
        
        client = get_kalshi_client()
        success, data = client.get_orderbook(ticker, depth=depth)
        
        if not success:
            return jsonify({'error': data.get('error', 'Failed to fetch orderbook')}), 404
        
        return jsonify({
            'orderbook': data,
            'source': 'kalshi_live',
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching orderbook {ticker}: {e}")
        return jsonify({'error': str(e)}), 500


@scanner_bp.route('/live/opportunities', methods=['GET'])
@token_required
def get_live_opportunities():
    """
    Analyze live markets and return trading opportunities.
    GET /api/scanner/live/opportunities?minEdge=2.5&minVolume=100&limit=20
    
    This is the main endpoint for the scanner to get actionable opportunities.
    """
    try:
        min_edge = float(request.args.get('minEdge', 2.5))
        min_volume = int(request.args.get('minVolume', 100))
        limit = int(request.args.get('limit', 20))
        
        # Fetch live markets
        markets = get_live_markets(status='open', limit=200)
        
        if not markets:
            return jsonify({
                'opportunities': [],
                'count': 0,
                'message': 'No markets available or SDK not configured',
            }), 200
        
        opportunities = []
        
        for m in markets:
            # Skip low volume markets
            volume = m.get('volume', 0) or 0
            if volume < min_volume:
                continue
            
            yes_bid = m.get('yes_bid') or 0
            yes_ask = m.get('yes_ask') or 0
            no_bid = m.get('no_bid') or 0
            no_ask = m.get('no_ask') or 0
            
            # Calculate spread edge
            if yes_ask > 0 and yes_bid > 0:
                spread = yes_ask - yes_bid
                spread_edge = (spread / yes_ask) * 100
            else:
                spread_edge = 0
            
            # Look for mispricing (yes + no should = 100)
            if yes_ask and no_ask:
                total = yes_ask + no_ask
                mispricing_edge = abs(100 - total)
            else:
                mispricing_edge = 0
            
            # Calculate combined opportunity score
            edge = max(spread_edge, mispricing_edge)
            
            if edge >= min_edge:
                # Determine signal type
                if mispricing_edge > spread_edge:
                    signal_type = 'mispricing'
                    signal_reason = f"Yes+No={yes_ask+no_ask}¢ (should be 100¢)"
                    recommended_side = 'yes' if yes_ask + no_ask > 100 else 'no'
                else:
                    signal_type = 'spread'
                    signal_reason = f"Spread {spread}¢ ({spread_edge:.1f}%)"
                    recommended_side = 'yes'
                
                opportunities.append({
                    'ticker': m.get('ticker'),
                    'title': m.get('title'),
                    'platform': 'kalshi',
                    'category': m.get('category', 'other'),
                    'signalType': signal_type,
                    'edge': round(edge, 2),
                    'confidence': min(0.9, 0.5 + (edge / 20)),  # Simple confidence calc
                    'reason': signal_reason,
                    'recommendedSide': recommended_side,
                    'recommendedAction': 'buy',
                    # Current prices
                    'yesBid': yes_bid,
                    'yesAsk': yes_ask,
                    'noBid': no_bid,
                    'noAsk': no_ask,
                    # Volume
                    'volume': volume,
                    'volume24h': m.get('volume_24h', 0),
                    # Timing
                    'closeTime': m.get('close_time'),
                })
        
        # Sort by edge (highest first) and limit
        opportunities.sort(key=lambda x: x['edge'], reverse=True)
        opportunities = opportunities[:limit]
        
        return jsonify({
            'opportunities': opportunities,
            'count': len(opportunities),
            'totalScanned': len(markets),
            'filters': {
                'minEdge': min_edge,
                'minVolume': min_volume,
            },
            'source': 'kalshi_live',
        }), 200
        
    except Exception as e:
        logger.error(f"Error analyzing opportunities: {e}")
        return jsonify({'error': str(e)}), 500
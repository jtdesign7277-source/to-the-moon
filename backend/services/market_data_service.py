"""
Market Data Service for TO THE MOON
Fetches real market data from Kalshi and Manifold Markets APIs
"""
import os
import time
import json
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import requests

# Cache for API responses
_cache: Dict[str, Dict] = {}
CACHE_TTL = 300  # 5 minutes


def _get_cache_key(prefix: str, params: Dict) -> str:
    """Generate cache key from prefix and params."""
    param_str = json.dumps(params, sort_keys=True)
    return f"{prefix}:{hashlib.md5(param_str.encode()).hexdigest()}"


def _get_cached(key: str) -> Optional[Dict]:
    """Get cached value if not expired."""
    if key in _cache:
        cached = _cache[key]
        if time.time() < cached['expires']:
            return cached['data']
    return None


def _set_cached(key: str, data: Dict, ttl: int = CACHE_TTL):
    """Set cached value with TTL."""
    _cache[key] = {
        'data': data,
        'expires': time.time() + ttl,
    }


# ===========================================
# KALSHI API
# ===========================================

KALSHI_API_BASE = 'https://api.elections.kalshi.com/trade-api/v2'

# Category mappings for Kalshi
KALSHI_CATEGORIES = {
    'politics': ['Politics', 'Elections', 'Government'],
    'economics': ['Economics', 'Finance', 'Fed', 'Interest Rates', 'Inflation'],
    'sports': ['Sports', 'NFL', 'NBA', 'MLB', 'Soccer'],
    'crypto': ['Crypto', 'Bitcoin', 'Ethereum'],
    'tech': ['Tech', 'AI', 'Companies'],
    'weather': ['Weather', 'Climate'],
}


def fetch_kalshi_markets(
    category: Optional[str] = None,
    limit: int = 100,
    status: str = 'open'
) -> List[Dict]:
    """
    Fetch markets from Kalshi API.

    Kalshi API is public for market data.
    """
    cache_key = _get_cache_key('kalshi', {'category': category, 'limit': limit, 'status': status})
    cached = _get_cached(cache_key)
    if cached:
        return cached

    try:
        # Fetch events first
        events_url = f"{KALSHI_API_BASE}/events"
        params = {
            'limit': min(limit, 200),
            'status': status,
        }

        if category and category in KALSHI_CATEGORIES:
            params['series_ticker'] = KALSHI_CATEGORIES[category][0]

        response = requests.get(events_url, params=params, timeout=10)

        if response.status_code != 200:
            print(f"Kalshi API error: {response.status_code}")
            return _generate_mock_kalshi_markets(category, limit)

        data = response.json()
        events = data.get('events', [])

        # Transform to our format
        markets = []
        for event in events:
            for market in event.get('markets', []):
                markets.append({
                    'id': market.get('ticker'),
                    'title': market.get('title', event.get('title', '')),
                    'category': event.get('category', 'other'),
                    'yes_price': market.get('yes_bid', 0.5),
                    'no_price': market.get('no_bid', 0.5),
                    'volume': market.get('volume', 0),
                    'open_interest': market.get('open_interest', 0),
                    'close_time': market.get('close_time'),
                    'status': market.get('status', 'open'),
                    'result': market.get('result'),
                })

        _set_cached(cache_key, markets)
        return markets

    except Exception as e:
        print(f"Error fetching Kalshi markets: {e}")
        return _generate_mock_kalshi_markets(category, limit)


def _generate_mock_kalshi_markets(category: Optional[str], limit: int) -> List[Dict]:
    """Generate realistic mock Kalshi markets for testing."""
    import random

    mock_markets = {
        'politics': [
            {'title': 'Will Biden win 2024 election?', 'vol': 500000},
            {'title': 'Will Trump win 2024 election?', 'vol': 480000},
            {'title': 'Will third party candidate get >5%?', 'vol': 120000},
            {'title': 'Will there be a government shutdown in 2024?', 'vol': 85000},
            {'title': 'Will Supreme Court rule on major case?', 'vol': 65000},
        ],
        'economics': [
            {'title': 'Will Fed raise rates in next meeting?', 'vol': 250000},
            {'title': 'Will inflation be above 3% in December?', 'vol': 180000},
            {'title': 'Will unemployment exceed 4.5%?', 'vol': 95000},
            {'title': 'Will GDP growth exceed 2.5%?', 'vol': 78000},
            {'title': 'Will S&P 500 reach new ATH this month?', 'vol': 220000},
        ],
        'sports': [
            {'title': 'Will Chiefs win Super Bowl?', 'vol': 350000},
            {'title': 'Will Lakers make playoffs?', 'vol': 125000},
            {'title': 'Will Yankees win World Series?', 'vol': 98000},
            {'title': 'Total NFL games with >50 points this week?', 'vol': 75000},
        ],
        'crypto': [
            {'title': 'Will Bitcoin exceed $100k by end of year?', 'vol': 420000},
            {'title': 'Will Ethereum exceed $5k?', 'vol': 180000},
            {'title': 'Will SEC approve more crypto ETFs?', 'vol': 95000},
        ],
    }

    markets = []
    templates = mock_markets.get(category, [])
    if not templates:
        for cat_markets in mock_markets.values():
            templates.extend(cat_markets)

    for i, template in enumerate(templates[:limit]):
        yes_price = random.uniform(0.15, 0.85)
        markets.append({
            'id': f'kalshi_{category or "all"}_{i}',
            'title': template['title'],
            'category': category or 'mixed',
            'yes_price': round(yes_price, 3),
            'no_price': round(1 - yes_price, 3),
            'volume': int(template['vol'] * random.uniform(0.8, 1.2)),
            'open_interest': int(template['vol'] * random.uniform(0.3, 0.6)),
            'close_time': (datetime.utcnow() + timedelta(days=random.randint(7, 90))).isoformat(),
            'status': 'open',
            'result': None,
        })

    return markets


# ===========================================
# MANIFOLD MARKETS API
# ===========================================

MANIFOLD_API_BASE = 'https://api.manifold.markets/v0'


def fetch_manifold_markets(
    category: Optional[str] = None,
    limit: int = 100,
    sort: str = 'liquidity'
) -> List[Dict]:
    """
    Fetch markets from Manifold Markets API.

    Manifold API is fully public.
    """
    cache_key = _get_cache_key('manifold', {'category': category, 'limit': limit, 'sort': sort})
    cached = _get_cached(cache_key)
    if cached:
        return cached

    try:
        url = f"{MANIFOLD_API_BASE}/search-markets"
        params = {
            'limit': min(limit, 100),
            'sort': sort,
        }

        if category:
            params['term'] = category

        response = requests.get(url, params=params, timeout=10)

        if response.status_code != 200:
            print(f"Manifold API error: {response.status_code}")
            return _generate_mock_manifold_markets(category, limit)

        data = response.json()

        # Transform to our format
        markets = []
        for market in data:
            if market.get('outcomeType') != 'BINARY':
                continue

            markets.append({
                'id': market.get('id'),
                'title': market.get('question', ''),
                'category': market.get('groupSlugs', ['other'])[0] if market.get('groupSlugs') else 'other',
                'probability': market.get('probability', 0.5),
                'volume': market.get('volume', 0),
                'liquidity': market.get('totalLiquidity', 0),
                'close_time': market.get('closeTime'),
                'created_time': market.get('createdTime'),
                'is_resolved': market.get('isResolved', False),
                'resolution': market.get('resolution'),
            })

        _set_cached(cache_key, markets)
        return markets

    except Exception as e:
        print(f"Error fetching Manifold markets: {e}")
        return _generate_mock_manifold_markets(category, limit)


def _generate_mock_manifold_markets(category: Optional[str], limit: int) -> List[Dict]:
    """Generate realistic mock Manifold markets for testing."""
    import random

    mock_markets = [
        {'title': 'Will AI surpass human performance on benchmark X?', 'vol': 25000},
        {'title': 'Will there be a major tech acquisition this quarter?', 'vol': 18000},
        {'title': 'Will SpaceX launch Starship successfully?', 'vol': 32000},
        {'title': 'Will this movie gross over $500M?', 'vol': 8500},
        {'title': 'Will major company announce layoffs?', 'vol': 12000},
        {'title': 'Will crypto market cap exceed $3T?', 'vol': 28000},
        {'title': 'Will interest rates decrease this year?', 'vol': 15000},
        {'title': 'Will new iPhone have feature X?', 'vol': 9500},
    ]

    markets = []
    for i, template in enumerate(mock_markets[:limit]):
        prob = random.uniform(0.2, 0.8)
        markets.append({
            'id': f'manifold_{i}',
            'title': template['title'],
            'category': category or 'general',
            'probability': round(prob, 3),
            'volume': int(template['vol'] * random.uniform(0.8, 1.2)),
            'liquidity': int(template['vol'] * random.uniform(0.2, 0.5)),
            'close_time': int((datetime.utcnow() + timedelta(days=random.randint(14, 180))).timestamp() * 1000),
            'created_time': int((datetime.utcnow() - timedelta(days=random.randint(30, 180))).timestamp() * 1000),
            'is_resolved': False,
            'resolution': None,
        })

    return markets


# ===========================================
# HISTORICAL DATA
# ===========================================

def get_historical_prices(
    market_id: str,
    platform: str,
    days: int = 180
) -> Dict[str, Any]:
    """
    Get historical price data for a market.

    For now, generates realistic mock data based on market characteristics.
    In production, would fetch from platform APIs or our own database.
    """
    import random
    import math

    cache_key = _get_cache_key('history', {'id': market_id, 'platform': platform, 'days': days})
    cached = _get_cached(cache_key)
    if cached:
        return cached

    # Generate realistic price history
    prices = []
    trades = []

    # Starting price
    current_price = random.uniform(0.3, 0.7)

    # Volatility based on platform
    daily_vol = 0.02 if platform == 'kalshi' else 0.03

    start_date = datetime.utcnow() - timedelta(days=days)

    for day in range(days):
        date = start_date + timedelta(days=day)

        # Random walk with mean reversion
        drift = (0.5 - current_price) * 0.01  # Mean reversion to 0.5
        shock = random.gauss(0, daily_vol)

        current_price += drift + shock
        current_price = max(0.01, min(0.99, current_price))

        # Add some volume spikes
        base_volume = random.uniform(5000, 20000)
        if random.random() < 0.1:  # 10% chance of volume spike
            base_volume *= random.uniform(2, 5)

        prices.append({
            'date': date.strftime('%Y-%m-%d'),
            'price': round(current_price, 4),
            'volume': int(base_volume),
            'high': round(min(current_price + abs(shock), 0.99), 4),
            'low': round(max(current_price - abs(shock), 0.01), 4),
        })

        # Generate some sample trades
        num_trades = random.randint(5, 30)
        for _ in range(num_trades):
            trade_price = current_price + random.gauss(0, 0.01)
            trade_price = max(0.01, min(0.99, trade_price))
            trades.append({
                'date': (date + timedelta(hours=random.randint(0, 23))).isoformat(),
                'price': round(trade_price, 4),
                'size': random.randint(10, 500),
                'side': random.choice(['buy', 'sell']),
            })

    result = {
        'market_id': market_id,
        'platform': platform,
        'days': days,
        'prices': prices,
        'trades': trades[-500:],  # Last 500 trades
        'summary': {
            'start_price': prices[0]['price'] if prices else 0.5,
            'end_price': prices[-1]['price'] if prices else 0.5,
            'high': max(p['price'] for p in prices) if prices else 0.5,
            'low': min(p['price'] for p in prices) if prices else 0.5,
            'total_volume': sum(p['volume'] for p in prices),
            'avg_daily_volume': sum(p['volume'] for p in prices) / len(prices) if prices else 0,
        },
    }

    _set_cached(cache_key, result, ttl=3600)  # Cache for 1 hour
    return result


# ===========================================
# ARBITRAGE DETECTION
# ===========================================

def find_arbitrage_opportunities(min_edge: float = 0.02) -> List[Dict]:
    """
    Find arbitrage opportunities between platforms.

    Compares similar markets across Kalshi and Manifold.
    """
    opportunities = []

    kalshi_markets = fetch_kalshi_markets(limit=50)
    manifold_markets = fetch_manifold_markets(limit=50)

    # Simple title matching (in production, use better matching)
    for k_market in kalshi_markets:
        k_title_lower = k_market['title'].lower()

        for m_market in manifold_markets:
            m_title_lower = m_market['title'].lower()

            # Check for similar markets
            common_words = set(k_title_lower.split()) & set(m_title_lower.split())
            if len(common_words) < 3:
                continue

            k_yes = k_market['yes_price']
            m_yes = m_market.get('probability', 0.5)

            edge = abs(k_yes - m_yes)

            if edge >= min_edge:
                opportunities.append({
                    'kalshi_market': k_market,
                    'manifold_market': m_market,
                    'kalshi_yes': k_yes,
                    'manifold_yes': m_yes,
                    'edge': round(edge * 100, 2),
                    'direction': 'buy_kalshi' if k_yes < m_yes else 'buy_manifold',
                })

    return sorted(opportunities, key=lambda x: x['edge'], reverse=True)

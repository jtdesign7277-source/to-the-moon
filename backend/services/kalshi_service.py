"""
Kalshi API Service
Handles authentication and account operations with the Kalshi trading API.
Uses RSA-PSS signatures for authentication as required by Kalshi API.
"""
import os
import time
import base64
from datetime import datetime
from typing import Optional, Dict, Any, Tuple

import requests
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.backends import default_backend
from cryptography.exceptions import InvalidSignature

# Kalshi API endpoints
KALSHI_API_BASE = 'https://api.elections.kalshi.com/trade-api/v2'
KALSHI_DEMO_API_BASE = 'https://demo-api.kalshi.co/trade-api/v2'


class KalshiService:
    """Service for interacting with Kalshi trading API."""
    
    def __init__(self, api_key_id: str, private_key_pem: str, use_demo: bool = False):
        """
        Initialize Kalshi service with API credentials.
        
        Args:
            api_key_id: The Kalshi API Key ID (UUID format)
            private_key_pem: The Kalshi RSA Private Key in PEM format
            use_demo: Whether to use demo/sandbox API
        """
        self.api_key_id = api_key_id
        self.private_key_pem = private_key_pem
        self.private_key = None
        self.base_url = KALSHI_DEMO_API_BASE if use_demo else KALSHI_API_BASE
        self.session = requests.Session()
        
        # Load the private key
        self._load_private_key()
    
    def _load_private_key(self):
        """Load the RSA private key from PEM format."""
        try:
            # Handle both raw PEM and escaped newlines
            key_pem = self.private_key_pem
            if '\\n' in key_pem:
                key_pem = key_pem.replace('\\n', '\n')
            
            # Ensure proper PEM format
            if not key_pem.startswith('-----BEGIN'):
                # Try to reconstruct PEM format
                key_pem = f"-----BEGIN RSA PRIVATE KEY-----\n{key_pem}\n-----END RSA PRIVATE KEY-----"
            
            self.private_key = serialization.load_pem_private_key(
                key_pem.encode('utf-8'),
                password=None,
                backend=default_backend()
            )
        except Exception as e:
            raise ValueError(f"Failed to load RSA private key: {str(e)}")
    
    def _sign_pss(self, message: str) -> str:
        """
        Sign a message using RSA-PSS with SHA256.
        
        Args:
            message: The string to sign
            
        Returns:
            Base64-encoded signature
        """
        if not self.private_key:
            raise ValueError("Private key not loaded")
        
        try:
            signature = self.private_key.sign(
                message.encode('utf-8'),
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.DIGEST_LENGTH
                ),
                hashes.SHA256()
            )
            return base64.b64encode(signature).decode('utf-8')
        except InvalidSignature as e:
            raise ValueError("RSA sign PSS failed") from e
    
    def _get_headers(self, method: str, path: str) -> Dict[str, str]:
        """
        Generate authenticated headers for Kalshi API request.
        
        Kalshi requires:
        - KALSHI-ACCESS-KEY: The API Key ID
        - KALSHI-ACCESS-TIMESTAMP: Current timestamp in milliseconds
        - KALSHI-ACCESS-SIGNATURE: RSA-PSS signature of (timestamp + method + path)
        """
        timestamp = str(int(time.time() * 1000))
        
        # Strip query parameters from path for signing
        path_without_query = path.split('?')[0]
        
        # Message to sign: timestamp + method + path (without query params)
        message = f"{timestamp}{method.upper()}{path_without_query}"
        signature = self._sign_pss(message)
        
        return {
            'Content-Type': 'application/json',
            'KALSHI-ACCESS-KEY': self.api_key_id,
            'KALSHI-ACCESS-SIGNATURE': signature,
            'KALSHI-ACCESS-TIMESTAMP': timestamp,
        }
    
    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Tuple[bool, Any]:
        """
        Make an authenticated request to Kalshi API.
        
        Returns:
            Tuple of (success: bool, data: dict or error message)
        """
        path = f'/trade-api/v2{endpoint}'
        url = f"{self.base_url}{endpoint}"
        headers = self._get_headers(method.upper(), path)
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, headers=headers, timeout=15)
            elif method.upper() == 'POST':
                response = self.session.post(url, headers=headers, json=data, timeout=15)
            else:
                return False, f"Unsupported HTTP method: {method}"
            
            if response.status_code == 200:
                return True, response.json()
            elif response.status_code == 401:
                return False, "Invalid API credentials. Please check your API Key ID and Private Key."
            elif response.status_code == 403:
                return False, "Access forbidden. Your API key may not have the required permissions."
            else:
                error_msg = response.text
                try:
                    error_data = response.json()
                    error_msg = error_data.get('message', error_data.get('error', response.text))
                except:
                    pass
                return False, f"API error ({response.status_code}): {error_msg}"
                
        except requests.exceptions.Timeout:
            return False, "Request timed out. Please try again."
        except requests.exceptions.ConnectionError:
            return False, "Could not connect to Kalshi API. Please check your internet connection."
        except Exception as e:
            return False, f"Unexpected error: {str(e)}"
    
    def verify_credentials(self) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """
        Verify API credentials by attempting to get account info.
        
        Returns:
            Tuple of (success: bool, account_info: dict or None)
        """
        success, data = self._make_request('GET', '/portfolio/balance')
        
        if success:
            return True, data
        else:
            return False, {'error': data}
    
    def get_balance(self) -> Tuple[bool, Dict[str, Any]]:
        """
        Get account balance from Kalshi.
        
        Returns:
            Tuple of (success: bool, balance_data: dict)
            balance_data contains: balance (in cents), available_balance, etc.
        """
        success, data = self._make_request('GET', '/portfolio/balance')
        
        if success:
            # Kalshi returns balance in cents, convert to dollars
            balance_cents = data.get('balance', 0)
            payout_available = data.get('payout_available', 0)
            
            return True, {
                'balance': balance_cents / 100,  # Convert cents to dollars
                'availableBalance': payout_available / 100,
                'raw': data
            }
        else:
            return False, {'error': data}
    
    def get_positions(self) -> Tuple[bool, Dict[str, Any]]:
        """
        Get open positions from Kalshi.
        
        Returns:
            Tuple of (success: bool, positions_data: dict)
        """
        success, data = self._make_request('GET', '/portfolio/positions')
        
        if success:
            positions = data.get('market_positions', [])
            return True, {
                'positions': positions,
                'count': len(positions)
            }
        else:
            return False, {'error': data}
    
    def get_portfolio_summary(self) -> Tuple[bool, Dict[str, Any]]:
        """
        Get complete portfolio summary including balance and positions.
        
        Returns:
            Tuple of (success: bool, portfolio_data: dict)
        """
        # Get balance
        balance_success, balance_data = self.get_balance()
        if not balance_success:
            return False, balance_data
        
        # Get positions
        positions_success, positions_data = self.get_positions()
        positions = positions_data.get('positions', []) if positions_success else []
        
        # Calculate total value including positions
        position_value = sum(
            pos.get('market_exposure', 0) / 100  # Convert cents to dollars
            for pos in positions
        )
        
        return True, {
            'balance': balance_data['balance'],
            'availableBalance': balance_data['availableBalance'],
            'positionValue': position_value,
            'totalValue': balance_data['balance'] + position_value,
            'positions': positions,
            'positionCount': len(positions)
        }
    
    # ============================================
    # ORDER EXECUTION METHODS
    # ============================================
    
    def get_market(self, ticker: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Get market details by ticker.
        
        Args:
            ticker: Market ticker (e.g., "KXBTC-24JAN20-B50000")
            
        Returns:
            Tuple of (success: bool, market_data: dict)
        """
        success, data = self._make_request('GET', f'/markets/{ticker}')
        
        if success:
            return True, data.get('market', data)
        else:
            return False, {'error': data}
    
    def get_open_markets(self, limit: int = 100, cursor: str = None) -> Tuple[bool, Dict[str, Any]]:
        """
        Get list of open markets.
        
        Returns:
            Tuple of (success: bool, markets_data: dict)
        """
        endpoint = f'/markets?limit={limit}&status=open'
        if cursor:
            endpoint += f'&cursor={cursor}'
            
        success, data = self._make_request('GET', endpoint)
        
        if success:
            return True, {
                'markets': data.get('markets', []),
                'cursor': data.get('cursor')
            }
        else:
            return False, {'error': data}
    
    def place_order(
        self,
        ticker: str,
        action: str,  # 'buy' or 'sell'
        side: str,    # 'yes' or 'no'
        count: int,   # number of contracts
        order_type: str = 'limit',  # 'limit' or 'market'
        price: int = None,  # price in cents (1-99) for limit orders
        client_order_id: str = None,
        expiration_ts: int = None,  # Unix timestamp for order expiration
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Place an order on Kalshi.
        
        Args:
            ticker: Market ticker
            action: 'buy' or 'sell'
            side: 'yes' or 'no'
            count: Number of contracts
            order_type: 'limit' or 'market'
            price: Price in cents (1-99) for limit orders
            client_order_id: Unique ID for deduplication
            expiration_ts: Unix timestamp when order expires
            
        Returns:
            Tuple of (success: bool, order_data: dict)
        """
        import uuid
        
        # Validate inputs
        if action not in ['buy', 'sell']:
            return False, {'error': 'Action must be "buy" or "sell"'}
        if side not in ['yes', 'no']:
            return False, {'error': 'Side must be "yes" or "no"'}
        if count < 1:
            return False, {'error': 'Count must be at least 1'}
        if order_type == 'limit' and (price is None or price < 1 or price > 99):
            return False, {'error': 'Limit order price must be between 1 and 99 cents'}
        
        # Build order data
        order_data = {
            'ticker': ticker,
            'action': action,
            'side': side,
            'count': count,
            'type': order_type,
            'client_order_id': client_order_id or str(uuid.uuid4()),
        }
        
        # Add price for limit orders
        if order_type == 'limit' and price is not None:
            if side == 'yes':
                order_data['yes_price'] = price
            else:
                order_data['no_price'] = price
        
        # Add expiration if specified
        if expiration_ts:
            order_data['expiration_ts'] = expiration_ts
        
        success, data = self._make_request('POST', '/portfolio/orders', order_data)
        
        if success:
            order = data.get('order', data)
            return True, {
                'order_id': order.get('order_id'),
                'client_order_id': order.get('client_order_id'),
                'ticker': order.get('ticker'),
                'action': order.get('action'),
                'side': order.get('side'),
                'count': order.get('remaining_count', count),
                'price': order.get('yes_price') or order.get('no_price'),
                'status': order.get('status'),
                'created_time': order.get('created_time'),
                'raw': order
            }
        else:
            return False, {'error': data}
    
    def get_order(self, order_id: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Get order details by ID.
        
        Args:
            order_id: The order ID
            
        Returns:
            Tuple of (success: bool, order_data: dict)
        """
        success, data = self._make_request('GET', f'/portfolio/orders/{order_id}')
        
        if success:
            return True, data.get('order', data)
        else:
            return False, {'error': data}
    
    def get_orders(self, status: str = None, ticker: str = None, limit: int = 100) -> Tuple[bool, Dict[str, Any]]:
        """
        Get list of orders.
        
        Args:
            status: Filter by status ('resting', 'canceled', 'executed', 'pending')
            ticker: Filter by market ticker
            limit: Max number of orders to return
            
        Returns:
            Tuple of (success: bool, orders_data: dict)
        """
        endpoint = f'/portfolio/orders?limit={limit}'
        if status:
            endpoint += f'&status={status}'
        if ticker:
            endpoint += f'&ticker={ticker}'
            
        success, data = self._make_request('GET', endpoint)
        
        if success:
            return True, {
                'orders': data.get('orders', []),
                'cursor': data.get('cursor')
            }
        else:
            return False, {'error': data}
    
    def cancel_order(self, order_id: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Cancel an order.
        
        Args:
            order_id: The order ID to cancel
            
        Returns:
            Tuple of (success: bool, result: dict)
        """
        success, data = self._make_request('DELETE', f'/portfolio/orders/{order_id}')
        
        if success:
            return True, {'cancelled': True, 'order_id': order_id, 'raw': data}
        else:
            return False, {'error': data}
    
    def amend_order(self, order_id: str, count: int = None, price: int = None) -> Tuple[bool, Dict[str, Any]]:
        """
        Amend an existing order's count or price.
        
        Args:
            order_id: The order ID to amend
            count: New count (optional)
            price: New price in cents (optional)
            
        Returns:
            Tuple of (success: bool, order_data: dict)
        """
        amend_data = {}
        if count is not None:
            amend_data['count'] = count
        if price is not None:
            amend_data['price'] = price
            
        if not amend_data:
            return False, {'error': 'Must specify count or price to amend'}
        
        success, data = self._make_request('PUT', f'/portfolio/orders/{order_id}', amend_data)
        
        if success:
            return True, data.get('order', data)
        else:
            return False, {'error': data}


    # ============================================
    # MARKET SEARCH & TICKER LOOKUP
    # ============================================
    
    def search_markets(
        self, 
        query: str = None,
        event_ticker: str = None,
        series_ticker: str = None,
        status: str = 'open',
        limit: int = 50
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Search for markets by query string, event, or series.
        
        Args:
            query: Text search query (searches title and description)
            event_ticker: Filter by event ticker
            series_ticker: Filter by series ticker
            status: Market status ('open', 'closed', 'settled')
            limit: Max results to return
            
        Returns:
            Tuple of (success: bool, markets_data: dict)
        """
        import urllib.parse
        
        params = [f'limit={limit}']
        if status:
            params.append(f'status={status}')
        if event_ticker:
            params.append(f'event_ticker={event_ticker}')
        if series_ticker:
            params.append(f'series_ticker={series_ticker}')
        
        endpoint = '/markets?' + '&'.join(params)
        success, data = self._make_request('GET', endpoint)
        
        if not success:
            return False, {'error': data}
        
        markets = data.get('markets', [])
        
        # If query provided, filter by title/subtitle matching
        if query and markets:
            query_lower = query.lower()
            # Split query into keywords for flexible matching
            keywords = [kw.strip() for kw in query_lower.split() if len(kw.strip()) > 2]
            
            filtered = []
            for market in markets:
                title = (market.get('title', '') or '').lower()
                subtitle = (market.get('subtitle', '') or '').lower()
                event_title = (market.get('event_title', '') or '').lower()
                searchable = f"{title} {subtitle} {event_title}"
                
                # Check if all keywords appear in the searchable text
                if all(kw in searchable for kw in keywords):
                    filtered.append(market)
            
            markets = filtered
        
        return True, {
            'markets': markets,
            'count': len(markets),
            'cursor': data.get('cursor')
        }
    
    def resolve_ticker(
        self, 
        market_title: str,
        platform: str = 'kalshi'
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Resolve a market title to an actual ticker.
        Uses fuzzy matching to find the best matching market.
        
        Args:
            market_title: The human-readable market title
            platform: The platform (currently only 'kalshi' supported)
            
        Returns:
            Tuple of (success: bool, result: dict with ticker or error)
        """
        if platform.lower() != 'kalshi':
            return False, {'error': f'Platform {platform} not supported for ticker resolution'}
        
        # Search for markets matching the title
        success, data = self.search_markets(query=market_title, status='open', limit=20)
        
        if not success:
            return False, data
        
        markets = data.get('markets', [])
        
        if not markets:
            return False, {'error': f'No open markets found matching: {market_title}'}
        
        # Score markets by how well they match the title
        title_lower = market_title.lower()
        scored_markets = []
        
        for market in markets:
            market_title_lower = (market.get('title', '') or '').lower()
            subtitle = (market.get('subtitle', '') or '').lower()
            
            # Calculate simple match score
            score = 0
            
            # Exact title match gets highest score
            if title_lower == market_title_lower:
                score = 100
            elif title_lower in market_title_lower or market_title_lower in title_lower:
                score = 80
            else:
                # Count matching words
                title_words = set(title_lower.split())
                market_words = set(market_title_lower.split())
                common = title_words & market_words
                if common:
                    score = len(common) / max(len(title_words), len(market_words)) * 60
            
            # Boost if query appears in subtitle
            if title_lower in subtitle:
                score += 10
            
            scored_markets.append((score, market))
        
        # Sort by score descending
        scored_markets.sort(key=lambda x: x[0], reverse=True)
        
        if scored_markets[0][0] < 20:
            # No good match found
            return False, {
                'error': f'No good match found for: {market_title}',
                'suggestions': [
                    {
                        'ticker': m.get('ticker'),
                        'title': m.get('title'),
                        'yes_price': m.get('yes_bid'),
                        'no_price': m.get('no_bid'),
                    }
                    for _, m in scored_markets[:5]
                ]
            }
        
        best_match = scored_markets[0][1]
        
        return True, {
            'ticker': best_match.get('ticker'),
            'title': best_match.get('title'),
            'subtitle': best_match.get('subtitle'),
            'yes_price': best_match.get('yes_bid'),
            'no_price': best_match.get('no_bid'),
            'yes_ask': best_match.get('yes_ask'),
            'no_ask': best_match.get('no_ask'),
            'volume': best_match.get('volume'),
            'open_interest': best_match.get('open_interest'),
            'close_time': best_match.get('close_time'),
            'status': best_match.get('status'),
            'match_score': scored_markets[0][0],
            'alternatives': [
                {
                    'ticker': m.get('ticker'),
                    'title': m.get('title'),
                    'score': s,
                }
                for s, m in scored_markets[1:4] if s > 10
            ]
        }
    
    def get_events(self, status: str = 'open', limit: int = 50) -> Tuple[bool, Dict[str, Any]]:
        """
        Get list of events (groups of related markets).
        
        Returns:
            Tuple of (success: bool, events_data: dict)
        """
        endpoint = f'/events?status={status}&limit={limit}'
        success, data = self._make_request('GET', endpoint)
        
        if success:
            return True, {
                'events': data.get('events', []),
                'cursor': data.get('cursor')
            }
        else:
            return False, {'error': data}
    
    def get_event_markets(self, event_ticker: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Get all markets for a specific event.
        
        Args:
            event_ticker: The event ticker
            
        Returns:
            Tuple of (success: bool, markets_data: dict)
        """
        return self.search_markets(event_ticker=event_ticker, limit=100)


def connect_kalshi_account(api_key_id: str, private_key_pem: str) -> Tuple[bool, Dict[str, Any]]:
    """
    Connect and verify a Kalshi account.
    
    Args:
        api_key_id: Kalshi API Key ID (UUID format)
        private_key_pem: Kalshi RSA Private Key in PEM format
        
    Returns:
        Tuple of (success: bool, result: dict with balance or error)
    """
    try:
        service = KalshiService(api_key_id, private_key_pem)
    except ValueError as e:
        return False, {'error': str(e)}
    
    # First verify credentials
    verified, verify_data = service.verify_credentials()
    if not verified:
        return False, verify_data
    
    # Get full portfolio summary
    success, portfolio = service.get_portfolio_summary()
    if success:
        return True, portfolio
    else:
        return False, portfolio


def refresh_kalshi_balance(api_key_id: str, private_key_pem: str) -> Tuple[bool, Dict[str, Any]]:
    """
    Refresh balance for an existing Kalshi connection.
    
    Args:
        api_key_id: Kalshi API Key ID
        private_key_pem: Kalshi RSA Private Key in PEM format
        
    Returns:
        Tuple of (success: bool, result: dict with balance or error)
    """
    try:
        service = KalshiService(api_key_id, private_key_pem)
    except ValueError as e:
        return False, {'error': str(e)}
    
    return service.get_portfolio_summary()

"""
Kalshi SDK Service
Uses the official kalshi_python_sync SDK for enhanced market data and trading.
Provides real market data for the scanner and live trading for Pro users.
"""
import os
import logging
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)

# Try to import the SDK - graceful fallback if not installed
try:
    from kalshi_python_sync import (
        Configuration, KalshiClient, 
        MarketApi, EventsApi, PortfolioApi, OrdersApi
    )
    SDK_AVAILABLE = True
except ImportError:
    SDK_AVAILABLE = False
    logger.warning("kalshi_python_sync not installed. Run: pip install kalshi_python_sync")


class KalshiSDKService:
    """
    Service for interacting with Kalshi using the official SDK.
    Handles both public (unauthenticated) and private (authenticated) API calls.
    """
    
    # API base URLs
    PROD_HOST = "https://api.elections.kalshi.com/trade-api/v2"
    DEMO_HOST = "https://demo-api.kalshi.co/trade-api/v2"
    
    def __init__(
        self,
        api_key_id: Optional[str] = None,
        private_key_pem: Optional[str] = None,
        use_demo: bool = False
    ):
        """
        Initialize Kalshi SDK service.
        
        Args:
            api_key_id: API Key ID for authenticated requests (optional)
            private_key_pem: RSA Private Key in PEM format (optional)
            use_demo: Use demo/sandbox API instead of production
        """
        self.api_key_id = api_key_id
        self.private_key_pem = private_key_pem
        self.use_demo = use_demo
        self.client = None
        self.market_api = None
        self.events_api = None
        self.portfolio_api = None
        self.orders_api = None
        self.is_authenticated = False
        
        if SDK_AVAILABLE:
            self._initialize_client()
    
    def _initialize_client(self):
        """Initialize the SDK client."""
        try:
            config = Configuration(
                host=self.DEMO_HOST if self.use_demo else self.PROD_HOST
            )
            
            # Create client - authentication is optional for public endpoints
            self.client = KalshiClient(configuration=config)
            
            # If credentials provided, set up authentication
            if self.api_key_id and self.private_key_pem:
                # Handle escaped newlines in private key
                key_pem = self.private_key_pem
                if '\\n' in key_pem:
                    key_pem = key_pem.replace('\\n', '\n')
                
                # Set up authenticated client
                try:
                    self.client.set_kalshi_auth(
                        key_id=self.api_key_id,
                        private_key=key_pem
                    )
                    self.is_authenticated = True
                    logger.info("Kalshi SDK client initialized with authentication")
                except Exception as auth_e:
                    logger.error(f"Authentication setup failed: {auth_e}")
            else:
                logger.info("Kalshi SDK client initialized (unauthenticated)")
            
            # Initialize API interfaces
            self.market_api = MarketApi(self.client)
            self.events_api = EventsApi(self.client)
            
            if self.is_authenticated:
                self.portfolio_api = PortfolioApi(self.client)
                self.orders_api = OrdersApi(self.client)
            
        except Exception as e:
            logger.error(f"Failed to initialize Kalshi SDK client: {e}")
            self.client = None
    
    # ============================================
    # PUBLIC MARKET DATA (No Auth Required)
    # ============================================
    
    def get_markets(
        self,
        status: str = 'open',
        limit: int = 100,
        cursor: Optional[str] = None,
        series_ticker: Optional[str] = None,
        event_ticker: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Get list of markets from Kalshi.
        This is a PUBLIC endpoint - no authentication required.
        
        Args:
            status: Market status filter ('open', 'closed', 'settled')
            limit: Maximum number of markets to return
            cursor: Pagination cursor
            series_ticker: Filter by series
            event_ticker: Filter by event
            
        Returns:
            Tuple of (success, data dict with markets list)
        """
        if not SDK_AVAILABLE or not self.market_api:
            return self._fallback_get_markets(status, limit)
        
        try:
            # SDK call via MarketApi
            kwargs = {'status': status, 'limit': limit}
            if cursor:
                kwargs['cursor'] = cursor
            if series_ticker:
                kwargs['series_ticker'] = series_ticker
            if event_ticker:
                kwargs['event_ticker'] = event_ticker
                
            response = self.market_api.get_markets(**kwargs)
            
            markets = []
            for m in response.markets or []:
                markets.append({
                    'ticker': m.ticker,
                    'title': m.title,
                    'subtitle': getattr(m, 'subtitle', ''),
                    'status': m.status,
                    'yes_bid': getattr(m, 'yes_bid', None),
                    'yes_ask': getattr(m, 'yes_ask', None),
                    'no_bid': getattr(m, 'no_bid', None),
                    'no_ask': getattr(m, 'no_ask', None),
                    'last_price': getattr(m, 'last_price', None),
                    'volume': getattr(m, 'volume', 0),
                    'volume_24h': getattr(m, 'volume_24h', 0),
                    'open_interest': getattr(m, 'open_interest', 0),
                    'close_time': getattr(m, 'close_time', None),
                    'expiration_time': getattr(m, 'expiration_time', None),
                    'category': getattr(m, 'category', 'other'),
                    'series_ticker': getattr(m, 'series_ticker', None),
                    'event_ticker': getattr(m, 'event_ticker', None),
                })
            
            return True, {
                'markets': markets,
                'cursor': getattr(response, 'cursor', None),
                'count': len(markets)
            }
            
        except Exception as e:
            logger.error(f"SDK get_markets failed: {e}")
            return self._fallback_get_markets(status, limit)
    
    def get_market(self, ticker: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Get details for a specific market.
        
        Args:
            ticker: Market ticker
            
        Returns:
            Tuple of (success, market data dict)
        """
        if not SDK_AVAILABLE or not self.market_api:
            return False, {'error': 'SDK not available'}
        
        try:
            response = self.market_api.get_market(ticker=ticker)
            m = response.market
            
            return True, {
                'ticker': m.ticker,
                'title': m.title,
                'subtitle': getattr(m, 'subtitle', ''),
                'status': m.status,
                'yes_bid': getattr(m, 'yes_bid', None),
                'yes_ask': getattr(m, 'yes_ask', None),
                'no_bid': getattr(m, 'no_bid', None),
                'no_ask': getattr(m, 'no_ask', None),
                'last_price': getattr(m, 'last_price', None),
                'volume': getattr(m, 'volume', 0),
                'open_interest': getattr(m, 'open_interest', 0),
                'close_time': getattr(m, 'close_time', None),
                'result': getattr(m, 'result', None),
                'rules_primary': getattr(m, 'rules_primary', ''),
            }
            
        except Exception as e:
            logger.error(f"SDK get_market failed for {ticker}: {e}")
            return False, {'error': str(e)}
    
    def get_events(
        self,
        status: str = 'open',
        limit: int = 50,
        cursor: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Get list of events (groups of related markets).
        
        Returns:
            Tuple of (success, events data dict)
        """
        if not SDK_AVAILABLE or not self.events_api:
            return False, {'error': 'SDK not available'}
        
        try:
            kwargs = {'status': status, 'limit': limit}
            if cursor:
                kwargs['cursor'] = cursor
                
            response = self.events_api.get_events(**kwargs)
            
            events = []
            for e in response.events or []:
                events.append({
                    'event_ticker': e.event_ticker,
                    'title': e.title,
                    'subtitle': getattr(e, 'subtitle', ''),
                    'category': getattr(e, 'category', 'other'),
                    'series_ticker': getattr(e, 'series_ticker', None),
                    'markets_count': getattr(e, 'markets_count', 0),
                    'volume': getattr(e, 'volume', 0),
                })
            
            return True, {
                'events': events,
                'cursor': getattr(response, 'cursor', None),
                'count': len(events)
            }
            
        except Exception as e:
            logger.error(f"SDK get_events failed: {e}")
            return False, {'error': str(e)}
    
    def get_orderbook(self, ticker: str, depth: int = 10) -> Tuple[bool, Dict[str, Any]]:
        """
        Get order book for a market.
        
        Args:
            ticker: Market ticker
            depth: Number of price levels to return
            
        Returns:
            Tuple of (success, orderbook data)
        """
        if not SDK_AVAILABLE or not self.market_api:
            return False, {'error': 'SDK not available'}
        
        try:
            response = self.market_api.get_market_orderbook(ticker=ticker, depth=depth)
            
            return True, {
                'ticker': ticker,
                'yes': response.orderbook.yes if hasattr(response.orderbook, 'yes') else [],
                'no': response.orderbook.no if hasattr(response.orderbook, 'no') else [],
            }
            
        except Exception as e:
            logger.error(f"SDK get_orderbook failed for {ticker}: {e}")
            return False, {'error': str(e)}
    
    # ============================================
    # AUTHENTICATED - PORTFOLIO (Requires Auth)
    # ============================================
    
    def get_balance(self) -> Tuple[bool, Dict[str, Any]]:
        """
        Get account balance. Requires authentication.
        
        Returns:
            Tuple of (success, balance data)
        """
        if not self.is_authenticated:
            return False, {'error': 'Authentication required'}
        
        if not SDK_AVAILABLE or not self.portfolio_api:
            return False, {'error': 'SDK not available'}
        
        try:
            response = self.portfolio_api.get_balance()
            
            return True, {
                'balance': response.balance / 100 if response.balance else 0,  # cents to dollars
                'available_balance': response.available_balance / 100 if response.available_balance else 0,
                'payout_available': getattr(response, 'payout_available', 0) / 100,
            }
            
        except Exception as e:
            logger.error(f"SDK get_balance failed: {e}")
            return False, {'error': str(e)}
    
    def get_positions(self) -> Tuple[bool, Dict[str, Any]]:
        """
        Get open positions. Requires authentication.
        
        Returns:
            Tuple of (success, positions data)
        """
        if not self.is_authenticated:
            return False, {'error': 'Authentication required'}
        
        if not SDK_AVAILABLE or not self.portfolio_api:
            return False, {'error': 'SDK not available'}
        
        try:
            response = self.portfolio_api.get_positions()
            
            positions = []
            for p in response.market_positions or []:
                positions.append({
                    'ticker': p.ticker,
                    'market_exposure': getattr(p, 'market_exposure', 0) / 100,
                    'rest_count': getattr(p, 'resting_contracts_count', 0),
                    'position': getattr(p, 'position', 0),
                    'total_cost': getattr(p, 'total_traded', 0) / 100,
                    'realized_pnl': getattr(p, 'realized_pnl', 0) / 100,
                })
            
            return True, {
                'positions': positions,
                'count': len(positions)
            }
            
        except Exception as e:
            logger.error(f"SDK get_positions failed: {e}")
            return False, {'error': str(e)}
    
    def get_fills(self, limit: int = 100) -> Tuple[bool, Dict[str, Any]]:
        """
        Get trade fills (executed trades). Requires authentication.
        
        Returns:
            Tuple of (success, fills data)
        """
        if not self.is_authenticated:
            return False, {'error': 'Authentication required'}
        
        if not SDK_AVAILABLE or not self.portfolio_api:
            return False, {'error': 'SDK not available'}
        
        try:
            response = self.portfolio_api.get_fills(limit=limit)
            
            fills = []
            for f in response.fills or []:
                fills.append({
                    'trade_id': f.trade_id,
                    'ticker': f.ticker,
                    'side': f.side,
                    'action': f.action,
                    'count': f.count,
                    'price': f.price / 100 if f.price else 0,
                    'created_time': f.created_time,
                    'is_taker': getattr(f, 'is_taker', True),
                })
            
            return True, {
                'fills': fills,
                'count': len(fills)
            }
            
        except Exception as e:
            logger.error(f"SDK get_fills failed: {e}")
            return False, {'error': str(e)}
    
    # ============================================
    # AUTHENTICATED - TRADING (Requires Auth + Pro)
    # ============================================
    
    def place_order(
        self,
        ticker: str,
        action: str,  # 'buy' or 'sell'
        side: str,    # 'yes' or 'no'
        count: int,
        order_type: str = 'limit',
        price: Optional[int] = None,  # cents (1-99)
        client_order_id: Optional[str] = None,
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Place an order. Requires authentication.
        
        Args:
            ticker: Market ticker
            action: 'buy' or 'sell'
            side: 'yes' or 'no'
            count: Number of contracts
            order_type: 'limit' or 'market'
            price: Price in cents (1-99) for limit orders
            client_order_id: Unique ID for deduplication
            
        Returns:
            Tuple of (success, order data)
        """
        if not self.is_authenticated:
            return False, {'error': 'Authentication required'}
        
        if not SDK_AVAILABLE or not self.orders_api:
            return False, {'error': 'SDK not available'}
        
        try:
            import uuid
            from kalshi_python_sync import CreateOrderRequest
            
            order_request = CreateOrderRequest(
                ticker=ticker,
                action=action,
                side=side,
                count=count,
                type=order_type,
                client_order_id=client_order_id or str(uuid.uuid4()),
            )
            
            if order_type == 'limit' and price is not None:
                if side == 'yes':
                    order_request.yes_price = price
                else:
                    order_request.no_price = price
            
            response = self.orders_api.create_order(order_request)
            order = response.order
            
            return True, {
                'order_id': order.order_id,
                'client_order_id': order.client_order_id,
                'ticker': order.ticker,
                'action': order.action,
                'side': order.side,
                'price': (order.yes_price or order.no_price) / 100 if (order.yes_price or order.no_price) else None,
                'count': order.remaining_count,
                'status': order.status,
                'created_time': order.created_time,
            }
            
        except Exception as e:
            logger.error(f"SDK place_order failed: {e}")
            return False, {'error': str(e)}
    
    def cancel_order(self, order_id: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Cancel an order. Requires authentication.
        
        Args:
            order_id: Order ID to cancel
            
        Returns:
            Tuple of (success, result)
        """
        if not self.is_authenticated:
            return False, {'error': 'Authentication required'}
        
        if not SDK_AVAILABLE or not self.orders_api:
            return False, {'error': 'SDK not available'}
        
        try:
            self.orders_api.cancel_order(order_id=order_id)
            return True, {'cancelled': True, 'order_id': order_id}
            
        except Exception as e:
            logger.error(f"SDK cancel_order failed: {e}")
            return False, {'error': str(e)}
    
    def get_orders(
        self,
        status: Optional[str] = None,
        ticker: Optional[str] = None,
        limit: int = 100
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Get list of orders. Requires authentication.
        
        Args:
            status: Filter by status ('resting', 'canceled', 'executed')
            ticker: Filter by market ticker
            limit: Max orders to return
            
        Returns:
            Tuple of (success, orders data)
        """
        if not self.is_authenticated:
            return False, {'error': 'Authentication required'}
        
        if not SDK_AVAILABLE or not self.orders_api:
            return False, {'error': 'SDK not available'}
        
        try:
            kwargs = {'limit': limit}
            if status:
                kwargs['status'] = status
            if ticker:
                kwargs['ticker'] = ticker
            
            response = self.orders_api.get_orders(**kwargs)
            
            orders = []
            for o in response.orders or []:
                orders.append({
                    'order_id': o.order_id,
                    'client_order_id': o.client_order_id,
                    'ticker': o.ticker,
                    'action': o.action,
                    'side': o.side,
                    'type': o.type,
                    'price': (o.yes_price or o.no_price) / 100 if (o.yes_price or o.no_price) else None,
                    'count': o.remaining_count,
                    'status': o.status,
                    'created_time': o.created_time,
                })
            
            return True, {
                'orders': orders,
                'count': len(orders)
            }
            
        except Exception as e:
            logger.error(f"SDK get_orders failed: {e}")
            return False, {'error': str(e)}
    
    # ============================================
    # FALLBACK METHODS (When SDK not available)
    # ============================================
    
    def _fallback_get_markets(self, status: str, limit: int) -> Tuple[bool, Dict[str, Any]]:
        """Fallback using requests when SDK not available."""
        import requests
        
        try:
            url = f"{self.PROD_HOST}/markets?status={status}&limit={limit}"
            response = requests.get(url, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                return True, {
                    'markets': data.get('markets', []),
                    'cursor': data.get('cursor'),
                    'count': len(data.get('markets', []))
                }
            else:
                return False, {'error': f"API error: {response.status_code}"}
                
        except Exception as e:
            return False, {'error': str(e)}


# ============================================
# SINGLETON INSTANCE FOR PUBLIC DATA
# ============================================

_public_client: Optional[KalshiSDKService] = None


def get_kalshi_client() -> KalshiSDKService:
    """Get or create a singleton Kalshi SDK client for public data."""
    global _public_client
    if _public_client is None:
        _public_client = KalshiSDKService()
    return _public_client


def get_authenticated_client(
    api_key_id: str,
    private_key_pem: str,
    use_demo: bool = False
) -> KalshiSDKService:
    """Create an authenticated Kalshi SDK client for user-specific operations."""
    return KalshiSDKService(
        api_key_id=api_key_id,
        private_key_pem=private_key_pem,
        use_demo=use_demo
    )


# ============================================
# CONVENIENCE FUNCTIONS FOR SCANNER
# ============================================

def get_live_markets(
    status: str = 'open',
    limit: int = 200,
    categories: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """
    Fetch live markets for the scanner.
    
    Args:
        status: Market status filter
        limit: Max markets to fetch
        categories: Optional list of categories to filter
        
    Returns:
        List of market dicts with prices, volume, etc.
    """
    client = get_kalshi_client()
    success, data = client.get_markets(status=status, limit=limit)
    
    if not success:
        logger.error(f"Failed to get live markets: {data.get('error')}")
        return []
    
    markets = data.get('markets', [])
    
    # Filter by categories if specified
    if categories:
        markets = [m for m in markets if m.get('category') in categories]
    
    return markets


def get_market_price(ticker: str) -> Optional[Dict[str, Any]]:
    """
    Get current price info for a specific market.
    
    Args:
        ticker: Market ticker
        
    Returns:
        Dict with yes_bid, yes_ask, no_bid, no_ask, volume, etc.
    """
    client = get_kalshi_client()
    success, data = client.get_market(ticker)
    
    if success:
        return data
    return None


def get_market_orderbook_depth(ticker: str) -> Optional[Dict[str, Any]]:
    """
    Get order book depth for a market.
    
    Args:
        ticker: Market ticker
        
    Returns:
        Dict with yes/no bid/ask arrays
    """
    client = get_kalshi_client()
    success, data = client.get_orderbook(ticker, depth=5)
    
    if success:
        return data
    return None

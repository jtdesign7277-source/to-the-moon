"""
Alpaca Trading API Service
Handles authentication and trading operations with the Alpaca brokerage API.
Supports both paper trading and live trading.
"""
import os
from datetime import datetime
from typing import Optional, Dict, Any, Tuple

import requests


# Alpaca API endpoints
ALPACA_PAPER_BASE = 'https://paper-api.alpaca.markets'
ALPACA_LIVE_BASE = 'https://api.alpaca.markets'
ALPACA_DATA_BASE = 'https://data.alpaca.markets'


class AlpacaService:
    """Service for interacting with Alpaca trading API."""

    def __init__(self, api_key: str, api_secret: str, paper: bool = True):
        """
        Initialize Alpaca service with API credentials.

        Args:
            api_key: The Alpaca API Key ID
            api_secret: The Alpaca API Secret Key
            paper: Whether to use paper trading (default True)
        """
        self.api_key = api_key
        self.api_secret = api_secret
        self.paper = paper
        self.base_url = ALPACA_PAPER_BASE if paper else ALPACA_LIVE_BASE
        self.data_url = ALPACA_DATA_BASE
        self.session = requests.Session()
        self.session.headers.update({
            'APCA-API-KEY-ID': self.api_key,
            'APCA-API-SECRET-KEY': self.api_secret,
            'Content-Type': 'application/json',
        })

    def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        use_data_api: bool = False
    ) -> Tuple[bool, Any]:
        """
        Make an authenticated request to Alpaca API.

        Returns:
            Tuple of (success: bool, data: dict or error message)
        """
        base = self.data_url if use_data_api else self.base_url
        url = f"{base}{endpoint}"

        try:
            if method.upper() == 'GET':
                response = self.session.get(url, timeout=15)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, timeout=15)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, timeout=15)
            elif method.upper() == 'PATCH':
                response = self.session.patch(url, json=data, timeout=15)
            else:
                return False, f"Unsupported HTTP method: {method}"

            if response.status_code in [200, 201, 204]:
                if response.status_code == 204:
                    return True, {}
                return True, response.json()
            elif response.status_code == 401:
                return False, "Invalid API credentials. Please check your API Key and Secret."
            elif response.status_code == 403:
                return False, "Access forbidden. Your API key may not have the required permissions."
            elif response.status_code == 404:
                return False, "Resource not found."
            elif response.status_code == 422:
                error_data = response.json()
                return False, error_data.get('message', 'Validation error')
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
            return False, "Could not connect to Alpaca API. Please check your internet connection."
        except Exception as e:
            return False, f"Unexpected error: {str(e)}"

    # ============================================
    # ACCOUNT METHODS
    # ============================================

    def verify_credentials(self) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """
        Verify API credentials by attempting to get account info.

        Returns:
            Tuple of (success: bool, account_info: dict or error)
        """
        success, data = self._make_request('GET', '/v2/account')

        if success:
            return True, data
        else:
            return False, {'error': data}

    def get_account(self) -> Tuple[bool, Dict[str, Any]]:
        """
        Get account information including buying power and equity.

        Returns:
            Tuple of (success: bool, account_data: dict)
        """
        success, data = self._make_request('GET', '/v2/account')

        if success:
            return True, {
                'account_id': data.get('id'),
                'account_number': data.get('account_number'),
                'status': data.get('status'),
                'currency': data.get('currency', 'USD'),
                'cash': float(data.get('cash', 0)),
                'buying_power': float(data.get('buying_power', 0)),
                'portfolio_value': float(data.get('portfolio_value', 0)),
                'equity': float(data.get('equity', 0)),
                'last_equity': float(data.get('last_equity', 0)),
                'long_market_value': float(data.get('long_market_value', 0)),
                'short_market_value': float(data.get('short_market_value', 0)),
                'initial_margin': float(data.get('initial_margin', 0)),
                'maintenance_margin': float(data.get('maintenance_margin', 0)),
                'daytrade_count': int(data.get('daytrade_count', 0)),
                'pattern_day_trader': data.get('pattern_day_trader', False),
                'trading_blocked': data.get('trading_blocked', False),
                'transfers_blocked': data.get('transfers_blocked', False),
                'account_blocked': data.get('account_blocked', False),
                'created_at': data.get('created_at'),
                'paper': self.paper,
                'raw': data
            }
        else:
            return False, {'error': data}

    def get_portfolio_history(
        self,
        period: str = '1M',
        timeframe: str = '1D'
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Get portfolio history over time.

        Args:
            period: Time period ('1D', '1W', '1M', '3M', '1A', 'all')
            timeframe: Data resolution ('1Min', '5Min', '15Min', '1H', '1D')

        Returns:
            Tuple of (success: bool, history_data: dict)
        """
        endpoint = f'/v2/account/portfolio/history?period={period}&timeframe={timeframe}'
        success, data = self._make_request('GET', endpoint)

        if success:
            return True, {
                'timestamps': data.get('timestamp', []),
                'equity': data.get('equity', []),
                'profit_loss': data.get('profit_loss', []),
                'profit_loss_pct': data.get('profit_loss_pct', []),
                'base_value': data.get('base_value', 0),
                'timeframe': data.get('timeframe'),
            }
        else:
            return False, {'error': data}

    # ============================================
    # POSITIONS METHODS
    # ============================================

    def get_positions(self) -> Tuple[bool, Dict[str, Any]]:
        """
        Get all open positions.

        Returns:
            Tuple of (success: bool, positions_data: dict)
        """
        success, data = self._make_request('GET', '/v2/positions')

        if success:
            positions = []
            for pos in data:
                positions.append({
                    'asset_id': pos.get('asset_id'),
                    'symbol': pos.get('symbol'),
                    'exchange': pos.get('exchange'),
                    'asset_class': pos.get('asset_class'),
                    'qty': float(pos.get('qty', 0)),
                    'qty_available': float(pos.get('qty_available', 0)),
                    'side': pos.get('side'),
                    'avg_entry_price': float(pos.get('avg_entry_price', 0)),
                    'market_value': float(pos.get('market_value', 0)),
                    'cost_basis': float(pos.get('cost_basis', 0)),
                    'current_price': float(pos.get('current_price', 0)),
                    'lastday_price': float(pos.get('lastday_price', 0)),
                    'change_today': float(pos.get('change_today', 0)),
                    'unrealized_pl': float(pos.get('unrealized_pl', 0)),
                    'unrealized_plpc': float(pos.get('unrealized_plpc', 0)),
                    'unrealized_intraday_pl': float(pos.get('unrealized_intraday_pl', 0)),
                    'unrealized_intraday_plpc': float(pos.get('unrealized_intraday_plpc', 0)),
                })

            return True, {
                'positions': positions,
                'count': len(positions)
            }
        else:
            return False, {'error': data}

    def get_position(self, symbol: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Get position for a specific symbol.

        Args:
            symbol: The stock symbol (e.g., 'AAPL')

        Returns:
            Tuple of (success: bool, position_data: dict)
        """
        success, data = self._make_request('GET', f'/v2/positions/{symbol}')

        if success:
            return True, {
                'symbol': data.get('symbol'),
                'qty': float(data.get('qty', 0)),
                'avg_entry_price': float(data.get('avg_entry_price', 0)),
                'market_value': float(data.get('market_value', 0)),
                'unrealized_pl': float(data.get('unrealized_pl', 0)),
                'unrealized_plpc': float(data.get('unrealized_plpc', 0)),
                'current_price': float(data.get('current_price', 0)),
                'side': data.get('side'),
            }
        else:
            return False, {'error': data}

    def close_position(self, symbol: str, qty: float = None, percentage: float = None) -> Tuple[bool, Dict[str, Any]]:
        """
        Close a position (fully or partially).

        Args:
            symbol: The stock symbol
            qty: Number of shares to close (optional)
            percentage: Percentage of position to close (optional)

        Returns:
            Tuple of (success: bool, order_data: dict)
        """
        endpoint = f'/v2/positions/{symbol}'
        params = []
        if qty:
            params.append(f'qty={qty}')
        if percentage:
            params.append(f'percentage={percentage}')
        if params:
            endpoint += '?' + '&'.join(params)

        success, data = self._make_request('DELETE', endpoint)

        if success:
            return True, data
        else:
            return False, {'error': data}

    def close_all_positions(self, cancel_orders: bool = True) -> Tuple[bool, Dict[str, Any]]:
        """
        Close all open positions.

        Args:
            cancel_orders: Whether to also cancel all open orders

        Returns:
            Tuple of (success: bool, result: dict)
        """
        endpoint = f'/v2/positions?cancel_orders={str(cancel_orders).lower()}'
        success, data = self._make_request('DELETE', endpoint)

        if success:
            return True, {'closed_positions': data}
        else:
            return False, {'error': data}

    # ============================================
    # ORDER METHODS
    # ============================================

    def place_order(
        self,
        symbol: str,
        qty: float = None,
        notional: float = None,
        side: str = 'buy',
        order_type: str = 'market',
        time_in_force: str = 'day',
        limit_price: float = None,
        stop_price: float = None,
        trail_price: float = None,
        trail_percent: float = None,
        extended_hours: bool = False,
        client_order_id: str = None,
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Place an order.

        Args:
            symbol: The stock symbol
            qty: Number of shares (use qty or notional, not both)
            notional: Dollar amount to trade
            side: 'buy' or 'sell'
            order_type: 'market', 'limit', 'stop', 'stop_limit', 'trailing_stop'
            time_in_force: 'day', 'gtc', 'opg', 'cls', 'ioc', 'fok'
            limit_price: Limit price for limit orders
            stop_price: Stop price for stop orders
            trail_price: Trail amount in dollars
            trail_percent: Trail percentage
            extended_hours: Allow trading in extended hours
            client_order_id: Custom order ID for tracking

        Returns:
            Tuple of (success: bool, order_data: dict)
        """
        import uuid

        # Validate inputs
        if side not in ['buy', 'sell']:
            return False, {'error': 'Side must be "buy" or "sell"'}
        if order_type not in ['market', 'limit', 'stop', 'stop_limit', 'trailing_stop']:
            return False, {'error': 'Invalid order type'}
        if not qty and not notional:
            return False, {'error': 'Must specify qty or notional'}
        if qty and notional:
            return False, {'error': 'Specify qty or notional, not both'}

        # Build order data
        order_data = {
            'symbol': symbol.upper(),
            'side': side,
            'type': order_type,
            'time_in_force': time_in_force,
        }

        if qty:
            order_data['qty'] = str(qty)
        if notional:
            order_data['notional'] = str(notional)
        if limit_price and order_type in ['limit', 'stop_limit']:
            order_data['limit_price'] = str(limit_price)
        if stop_price and order_type in ['stop', 'stop_limit']:
            order_data['stop_price'] = str(stop_price)
        if trail_price and order_type == 'trailing_stop':
            order_data['trail_price'] = str(trail_price)
        if trail_percent and order_type == 'trailing_stop':
            order_data['trail_percent'] = str(trail_percent)
        if extended_hours:
            order_data['extended_hours'] = True
        if client_order_id:
            order_data['client_order_id'] = client_order_id
        else:
            order_data['client_order_id'] = str(uuid.uuid4())

        success, data = self._make_request('POST', '/v2/orders', order_data)

        if success:
            return True, {
                'order_id': data.get('id'),
                'client_order_id': data.get('client_order_id'),
                'symbol': data.get('symbol'),
                'side': data.get('side'),
                'type': data.get('type'),
                'qty': data.get('qty'),
                'notional': data.get('notional'),
                'filled_qty': data.get('filled_qty'),
                'filled_avg_price': data.get('filled_avg_price'),
                'status': data.get('status'),
                'created_at': data.get('created_at'),
                'submitted_at': data.get('submitted_at'),
                'filled_at': data.get('filled_at'),
                'raw': data
            }
        else:
            return False, {'error': data}

    def get_orders(
        self,
        status: str = 'open',
        limit: int = 50,
        after: str = None,
        until: str = None,
        direction: str = 'desc',
        symbols: list = None,
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Get list of orders.

        Args:
            status: 'open', 'closed', 'all'
            limit: Max number of orders
            after: Get orders after this timestamp
            until: Get orders until this timestamp
            direction: 'asc' or 'desc'
            symbols: List of symbols to filter

        Returns:
            Tuple of (success: bool, orders_data: dict)
        """
        params = [f'status={status}', f'limit={limit}', f'direction={direction}']
        if after:
            params.append(f'after={after}')
        if until:
            params.append(f'until={until}')
        if symbols:
            params.append(f'symbols={",".join(symbols)}')

        endpoint = '/v2/orders?' + '&'.join(params)
        success, data = self._make_request('GET', endpoint)

        if success:
            orders = []
            for order in data:
                orders.append({
                    'order_id': order.get('id'),
                    'client_order_id': order.get('client_order_id'),
                    'symbol': order.get('symbol'),
                    'side': order.get('side'),
                    'type': order.get('type'),
                    'qty': order.get('qty'),
                    'filled_qty': order.get('filled_qty'),
                    'filled_avg_price': order.get('filled_avg_price'),
                    'limit_price': order.get('limit_price'),
                    'stop_price': order.get('stop_price'),
                    'status': order.get('status'),
                    'created_at': order.get('created_at'),
                    'filled_at': order.get('filled_at'),
                })

            return True, {
                'orders': orders,
                'count': len(orders)
            }
        else:
            return False, {'error': data}

    def get_order(self, order_id: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Get order by ID.

        Args:
            order_id: The order ID

        Returns:
            Tuple of (success: bool, order_data: dict)
        """
        success, data = self._make_request('GET', f'/v2/orders/{order_id}')

        if success:
            return True, data
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
        success, data = self._make_request('DELETE', f'/v2/orders/{order_id}')

        if success:
            return True, {'cancelled': True, 'order_id': order_id}
        else:
            return False, {'error': data}

    def cancel_all_orders(self) -> Tuple[bool, Dict[str, Any]]:
        """
        Cancel all open orders.

        Returns:
            Tuple of (success: bool, result: dict)
        """
        success, data = self._make_request('DELETE', '/v2/orders')

        if success:
            return True, {'cancelled_orders': data}
        else:
            return False, {'error': data}

    # ============================================
    # MARKET DATA METHODS
    # ============================================

    def get_quote(self, symbol: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Get latest quote for a symbol.

        Args:
            symbol: The stock symbol

        Returns:
            Tuple of (success: bool, quote_data: dict)
        """
        endpoint = f'/v2/stocks/{symbol}/quotes/latest'
        success, data = self._make_request('GET', endpoint, use_data_api=True)

        if success:
            quote = data.get('quote', {})
            return True, {
                'symbol': data.get('symbol', symbol),
                'bid_price': float(quote.get('bp', 0)),
                'bid_size': int(quote.get('bs', 0)),
                'ask_price': float(quote.get('ap', 0)),
                'ask_size': int(quote.get('as', 0)),
                'timestamp': quote.get('t'),
            }
        else:
            return False, {'error': data}

    def get_trade(self, symbol: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Get latest trade for a symbol.

        Args:
            symbol: The stock symbol

        Returns:
            Tuple of (success: bool, trade_data: dict)
        """
        endpoint = f'/v2/stocks/{symbol}/trades/latest'
        success, data = self._make_request('GET', endpoint, use_data_api=True)

        if success:
            trade = data.get('trade', {})
            return True, {
                'symbol': data.get('symbol', symbol),
                'price': float(trade.get('p', 0)),
                'size': int(trade.get('s', 0)),
                'timestamp': trade.get('t'),
                'exchange': trade.get('x'),
            }
        else:
            return False, {'error': data}

    def get_bars(
        self,
        symbol: str,
        timeframe: str = '1Day',
        start: str = None,
        end: str = None,
        limit: int = 100,
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Get historical bars for a symbol.

        Args:
            symbol: The stock symbol
            timeframe: '1Min', '5Min', '15Min', '1Hour', '1Day'
            start: Start datetime (ISO format)
            end: End datetime (ISO format)
            limit: Max number of bars

        Returns:
            Tuple of (success: bool, bars_data: dict)
        """
        params = [f'timeframe={timeframe}', f'limit={limit}']
        if start:
            params.append(f'start={start}')
        if end:
            params.append(f'end={end}')

        endpoint = f'/v2/stocks/{symbol}/bars?' + '&'.join(params)
        success, data = self._make_request('GET', endpoint, use_data_api=True)

        if success:
            bars = data.get('bars', [])
            return True, {
                'symbol': data.get('symbol', symbol),
                'bars': [
                    {
                        'timestamp': bar.get('t'),
                        'open': float(bar.get('o', 0)),
                        'high': float(bar.get('h', 0)),
                        'low': float(bar.get('l', 0)),
                        'close': float(bar.get('c', 0)),
                        'volume': int(bar.get('v', 0)),
                        'vwap': float(bar.get('vw', 0)),
                    }
                    for bar in bars
                ],
                'count': len(bars),
            }
        else:
            return False, {'error': data}

    # ============================================
    # ASSETS METHODS
    # ============================================

    def get_assets(
        self,
        status: str = 'active',
        asset_class: str = None,
        exchange: str = None,
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Get list of tradeable assets.

        Args:
            status: 'active' or 'inactive'
            asset_class: 'us_equity', 'crypto'
            exchange: Filter by exchange

        Returns:
            Tuple of (success: bool, assets_data: dict)
        """
        params = [f'status={status}']
        if asset_class:
            params.append(f'asset_class={asset_class}')
        if exchange:
            params.append(f'exchange={exchange}')

        endpoint = '/v2/assets?' + '&'.join(params)
        success, data = self._make_request('GET', endpoint)

        if success:
            return True, {
                'assets': data,
                'count': len(data)
            }
        else:
            return False, {'error': data}

    def get_asset(self, symbol: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Get asset info for a symbol.

        Args:
            symbol: The stock symbol

        Returns:
            Tuple of (success: bool, asset_data: dict)
        """
        success, data = self._make_request('GET', f'/v2/assets/{symbol}')

        if success:
            return True, {
                'id': data.get('id'),
                'symbol': data.get('symbol'),
                'name': data.get('name'),
                'exchange': data.get('exchange'),
                'asset_class': data.get('class'),
                'status': data.get('status'),
                'tradable': data.get('tradable'),
                'marginable': data.get('marginable'),
                'shortable': data.get('shortable'),
                'easy_to_borrow': data.get('easy_to_borrow'),
                'fractionable': data.get('fractionable'),
            }
        else:
            return False, {'error': data}

    # ============================================
    # CLOCK & CALENDAR
    # ============================================

    def get_clock(self) -> Tuple[bool, Dict[str, Any]]:
        """
        Get market clock (open/close times, is market open).

        Returns:
            Tuple of (success: bool, clock_data: dict)
        """
        success, data = self._make_request('GET', '/v2/clock')

        if success:
            return True, {
                'timestamp': data.get('timestamp'),
                'is_open': data.get('is_open'),
                'next_open': data.get('next_open'),
                'next_close': data.get('next_close'),
            }
        else:
            return False, {'error': data}

    def get_calendar(self, start: str = None, end: str = None) -> Tuple[bool, Dict[str, Any]]:
        """
        Get market calendar.

        Args:
            start: Start date (YYYY-MM-DD)
            end: End date (YYYY-MM-DD)

        Returns:
            Tuple of (success: bool, calendar_data: dict)
        """
        params = []
        if start:
            params.append(f'start={start}')
        if end:
            params.append(f'end={end}')

        endpoint = '/v2/calendar'
        if params:
            endpoint += '?' + '&'.join(params)

        success, data = self._make_request('GET', endpoint)

        if success:
            return True, {
                'calendar': data,
                'count': len(data)
            }
        else:
            return False, {'error': data}


# ============================================
# CONVENIENCE FUNCTIONS
# ============================================

def connect_alpaca_account(api_key: str, api_secret: str, paper: bool = True) -> Tuple[bool, Dict[str, Any]]:
    """
    Connect and verify an Alpaca account.

    Args:
        api_key: Alpaca API Key ID
        api_secret: Alpaca API Secret Key
        paper: Whether to use paper trading (default True)

    Returns:
        Tuple of (success: bool, result: dict with account info or error)
    """
    try:
        service = AlpacaService(api_key, api_secret, paper=paper)
    except Exception as e:
        return False, {'error': str(e)}

    # Verify credentials
    verified, account_data = service.verify_credentials()
    if not verified:
        return False, account_data

    # Get full account info
    success, account = service.get_account()
    if not success:
        return False, account

    # Get positions
    pos_success, positions = service.get_positions()
    position_count = positions.get('count', 0) if pos_success else 0

    return True, {
        'account_id': account.get('account_id'),
        'account_number': account.get('account_number'),
        'status': account.get('status'),
        'balance': account.get('equity', 0),
        'buying_power': account.get('buying_power', 0),
        'cash': account.get('cash', 0),
        'portfolio_value': account.get('portfolio_value', 0),
        'long_market_value': account.get('long_market_value', 0),
        'paper': paper,
        'positionCount': position_count,
    }


def refresh_alpaca_balance(api_key: str, api_secret: str, paper: bool = True) -> Tuple[bool, Dict[str, Any]]:
    """
    Refresh balance for an existing Alpaca connection.

    Args:
        api_key: Alpaca API Key ID
        api_secret: Alpaca API Secret Key
        paper: Whether this is a paper account

    Returns:
        Tuple of (success: bool, result: dict with balance or error)
    """
    try:
        service = AlpacaService(api_key, api_secret, paper=paper)
    except Exception as e:
        return False, {'error': str(e)}

    # Get account info
    success, account = service.get_account()
    if not success:
        return False, account

    # Get positions
    pos_success, positions = service.get_positions()
    position_count = positions.get('count', 0) if pos_success else 0

    return True, {
        'balance': account.get('equity', 0),
        'buying_power': account.get('buying_power', 0),
        'cash': account.get('cash', 0),
        'portfolio_value': account.get('portfolio_value', 0),
        'positionCount': position_count,
    }

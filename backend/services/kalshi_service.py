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

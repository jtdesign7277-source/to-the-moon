"""
Kalshi API Service
Handles authentication and account operations with the Kalshi trading API.
"""
import os
import time
import hmac
import hashlib
import base64
from datetime import datetime
from typing import Optional, Dict, Any, Tuple

import requests

# Kalshi API endpoints
KALSHI_API_BASE = 'https://api.elections.kalshi.com/trade-api/v2'
# For demo/testing (use sandbox if available)
# KALSHI_DEMO_API_BASE = 'https://demo-api.kalshi.co/trade-api/v2'


class KalshiService:
    """Service for interacting with Kalshi trading API."""
    
    def __init__(self, api_key_id: str, api_secret: str, use_demo: bool = False):
        """
        Initialize Kalshi service with API credentials.
        
        Args:
            api_key_id: The Kalshi API Key ID
            api_secret: The Kalshi API Secret Key (private key)
            use_demo: Whether to use demo/sandbox API (not yet available)
        """
        self.api_key_id = api_key_id
        self.api_secret = api_secret
        self.base_url = KALSHI_API_BASE
        self.session = requests.Session()
        
    def _generate_signature(self, timestamp: str, method: str, path: str) -> str:
        """
        Generate HMAC signature for Kalshi API request.
        
        Kalshi uses HMAC-SHA256 signatures for authentication.
        The signature is generated from: timestamp + method + path
        """
        message = f"{timestamp}{method}{path}"
        signature = hmac.new(
            self.api_secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).digest()
        return base64.b64encode(signature).decode('utf-8')
    
    def _get_headers(self, method: str, path: str) -> Dict[str, str]:
        """
        Generate authenticated headers for Kalshi API request.
        """
        timestamp = str(int(time.time() * 1000))
        signature = self._generate_signature(timestamp, method, path)
        
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
                return False, "Invalid API credentials. Please check your API Key ID and Secret."
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


def connect_kalshi_account(api_key_id: str, api_secret: str) -> Tuple[bool, Dict[str, Any]]:
    """
    Connect and verify a Kalshi account.
    
    Args:
        api_key_id: Kalshi API Key ID
        api_secret: Kalshi API Secret Key
        
    Returns:
        Tuple of (success: bool, result: dict with balance or error)
    """
    service = KalshiService(api_key_id, api_secret)
    
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


def refresh_kalshi_balance(api_key_id: str, api_secret: str) -> Tuple[bool, Dict[str, Any]]:
    """
    Refresh balance for an existing Kalshi connection.
    
    Args:
        api_key_id: Kalshi API Key ID
        api_secret: Kalshi API Secret Key
        
    Returns:
        Tuple of (success: bool, result: dict with balance or error)
    """
    service = KalshiService(api_key_id, api_secret)
    return service.get_portfolio_summary()

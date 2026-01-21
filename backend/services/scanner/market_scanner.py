"""
Market Scanner Service
Real-time market monitoring for Kalshi (and future platforms).
Fetches prices, tracks changes, and feeds data to the arbitrage engine.
"""
import time
import threading
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Callable, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum
import requests

logger = logging.getLogger(__name__)


class Platform(Enum):
    KALSHI = "kalshi"
    POLYMARKET = "polymarket"
    MANIFOLD = "manifold"


@dataclass
class MarketData:
    """Represents a single market's current state."""
    platform: Platform
    ticker: str
    title: str
    subtitle: str = ""
    
    yes_bid: float = 0.0
    yes_ask: float = 0.0
    no_bid: float = 0.0
    no_ask: float = 0.0
    
    yes_mid: float = 0.0
    no_mid: float = 0.0
    
    volume: int = 0
    volume_24h: int = 0
    open_interest: int = 0
    liquidity: float = 0.0
    
    status: str = "open"
    close_time: Optional[datetime] = None
    
    last_updated: datetime = field(default_factory=datetime.utcnow)
    price_change_1h: float = 0.0
    price_change_24h: float = 0.0
    
    category: str = ""
    event_ticker: str = ""
    
    def __post_init__(self):
        if self.yes_bid and self.yes_ask:
            self.yes_mid = (self.yes_bid + self.yes_ask) / 2
        if self.no_bid and self.no_ask:
            self.no_mid = (self.no_bid + self.no_ask) / 2
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'platform': self.platform.value,
            'ticker': self.ticker,
            'title': self.title,
            'subtitle': self.subtitle,
            'yesBid': self.yes_bid,
            'yesAsk': self.yes_ask,
            'noBid': self.no_bid,
            'noAsk': self.no_ask,
            'yesMid': self.yes_mid,
            'noMid': self.no_mid,
            'volume': self.volume,
            'volume24h': self.volume_24h,
            'openInterest': self.open_interest,
            'liquidity': self.liquidity,
            'status': self.status,
            'closeTime': self.close_time.isoformat() if self.close_time else None,
            'lastUpdated': self.last_updated.isoformat(),
            'priceChange1h': self.price_change_1h,
            'priceChange24h': self.price_change_24h,
            'category': self.category,
            'eventTicker': self.event_ticker,
        }


@dataclass
class ScannerConfig:
    platforms: List[Platform] = field(default_factory=lambda: [Platform.KALSHI])
    scan_interval: float = 5.0
    full_refresh_interval: float = 60.0
    categories: List[str] = field(default_factory=list)
    min_volume: int = 0
    min_liquidity: float = 0.0
    status_filter: str = "open"
    max_markets: int = 100
    watch_keywords: List[str] = field(default_factory=list)


class MarketScanner:
    def __init__(self, config: Optional[ScannerConfig] = None):
        self.config = config or ScannerConfig()
        self._markets: Dict[str, MarketData] = {}
        self._price_history: Dict[str, List[Tuple[datetime, float]]] = {}
        self._is_running = False
        self._scan_thread: Optional[threading.Thread] = None
        self._last_scan: Optional[datetime] = None
        self._last_full_refresh: Optional[datetime] = None
        self._on_price_update: List[Callable[[MarketData], None]] = []
        self._on_new_market: List[Callable[[MarketData], None]] = []
        self._on_market_close: List[Callable[[MarketData], None]] = []
        self.KALSHI_API_BASE = 'https://api.elections.kalshi.com/trade-api/v2'
        self._scan_count = 0
        self._error_count = 0
    
    def start(self):
        if self._is_running:
            logger.warning("Scanner already running")
            return
        self._is_running = True
        self._scan_thread = threading.Thread(target=self._scan_loop, daemon=True)
        self._scan_thread.start()
        logger.info("Market scanner started")
    
    def stop(self):
        self._is_running = False
        if self._scan_thread:
            self._scan_thread.join(timeout=5.0)
        logger.info("Market scanner stopped")
    
    def get_markets(self, platform: Optional[Platform] = None, category: Optional[str] = None,
                    search: Optional[str] = None, sort_by: str = "volume", limit: int = 50) -> List[MarketData]:
        markets = list(self._markets.values())
        
        if platform:
            markets = [m for m in markets if m.platform == platform]
        if category:
            markets = [m for m in markets if category.lower() in m.category.lower()]
        if search:
            search_lower = search.lower()
            markets = [m for m in markets if search_lower in m.title.lower() or search_lower in m.subtitle.lower()]
        
        sort_keys = {
            "volume": lambda m: m.volume,
            "liquidity": lambda m: m.liquidity,
            "price_change": lambda m: abs(m.price_change_1h),
            "close_time": lambda m: m.close_time or datetime.max,
            "yes_price": lambda m: m.yes_mid,
        }
        sort_fn = sort_keys.get(sort_by, sort_keys["volume"])
        markets.sort(key=sort_fn, reverse=(sort_by != "close_time"))
        return markets[:limit]
    
    def get_market(self, platform: Platform, ticker: str) -> Optional[MarketData]:
        key = f"{platform.value}:{ticker}"
        return self._markets.get(key)
    
    def refresh_now(self):
        self._fetch_all_markets()
    
    def on_price_update(self, callback: Callable[[MarketData], None]):
        self._on_price_update.append(callback)
    
    def on_new_market(self, callback: Callable[[MarketData], None]):
        self._on_new_market.append(callback)
    
    def get_stats(self) -> Dict[str, Any]:
        return {
            'isRunning': self._is_running,
            'totalMarkets': len(self._markets),
            'scanCount': self._scan_count,
            'errorCount': self._error_count,
            'lastScan': self._last_scan.isoformat() if self._last_scan else None,
            'platforms': [p.value for p in self.config.platforms],
            'config': {
                'scanInterval': self.config.scan_interval,
                'maxMarkets': self.config.max_markets,
            }
        }
    
    def _fetch_kalshi_markets(self) -> List[MarketData]:
        markets = []
        try:
            params = {'limit': self.config.max_markets, 'status': self.config.status_filter}
            response = requests.get(f'{self.KALSHI_API_BASE}/markets', params=params, timeout=15)
            
            if response.status_code != 200:
                logger.error(f"Kalshi API error: {response.status_code}")
                self._error_count += 1
                return markets
            
            data = response.json()
            raw_markets = data.get('markets', [])
            
            for m in raw_markets:
                if self.config.watch_keywords:
                    title_lower = (m.get('title', '') + m.get('subtitle', '')).lower()
                    if not any(kw.lower() in title_lower for kw in self.config.watch_keywords):
                        continue
                
                volume = m.get('volume', 0) or 0
                if volume < self.config.min_volume:
                    continue
                
                close_time = None
                if m.get('close_time'):
                    try:
                        close_time = datetime.fromisoformat(m['close_time'].replace('Z', '+00:00'))
                    except:
                        pass
                
                category = m.get('category', '') or ''
                if not category:
                    title_lower = m.get('title', '').lower()
                    if any(word in title_lower for word in ['nfl', 'nba', 'mlb', 'sports', 'game', 'super bowl']):
                        category = 'sports'
                    elif any(word in title_lower for word in ['election', 'president', 'congress', 'senate', 'vote']):
                        category = 'politics'
                    elif any(word in title_lower for word in ['bitcoin', 'btc', 'crypto', 'ethereum', 'eth']):
                        category = 'crypto'
                    elif any(word in title_lower for word in ['fed', 'rate', 'gdp', 'inflation', 'economic']):
                        category = 'economics'
                
                market_data = MarketData(
                    platform=Platform.KALSHI,
                    ticker=m.get('ticker', ''),
                    title=m.get('title', ''),
                    subtitle=m.get('subtitle', ''),
                    yes_bid=m.get('yes_bid', 0) or 0,
                    yes_ask=m.get('yes_ask', 0) or 0,
                    no_bid=m.get('no_bid', 0) or 0,
                    no_ask=m.get('no_ask', 0) or 0,
                    volume=volume,
                    volume_24h=m.get('volume_24h', 0) or 0,
                    open_interest=m.get('open_interest', 0) or 0,
                    liquidity=m.get('liquidity', 0) or 0,
                    status=m.get('status', 'open'),
                    close_time=close_time,
                    category=category,
                    event_ticker=m.get('event_ticker', ''),
                )
                markets.append(market_data)
            
            logger.debug(f"Fetched {len(markets)} Kalshi markets")
            
        except requests.exceptions.Timeout:
            logger.error("Kalshi API timeout")
            self._error_count += 1
        except requests.exceptions.ConnectionError:
            logger.error("Kalshi API connection error")
            self._error_count += 1
        except Exception as e:
            logger.error(f"Error fetching Kalshi markets: {e}")
            self._error_count += 1
        
        return markets
    
    def _scan_loop(self):
        logger.info("Scanner loop started")
        self._fetch_all_markets()
        
        while self._is_running:
            try:
                now = datetime.utcnow()
                if (not self._last_full_refresh or 
                    (now - self._last_full_refresh).total_seconds() > self.config.full_refresh_interval):
                    self._fetch_all_markets()
                else:
                    self._update_prices()
                
                self._scan_count += 1
                self._last_scan = now
                time.sleep(self.config.scan_interval)
            except Exception as e:
                logger.error(f"Error in scan loop: {e}")
                self._error_count += 1
                time.sleep(1)
        
        logger.info("Scanner loop stopped")
    
    def _fetch_all_markets(self):
        all_markets: List[MarketData] = []
        
        if Platform.KALSHI in self.config.platforms:
            all_markets.extend(self._fetch_kalshi_markets())
        
        new_markets = []
        for market in all_markets:
            key = f"{market.platform.value}:{market.ticker}"
            
            if key not in self._markets:
                new_markets.append(market)
                for callback in self._on_new_market:
                    try:
                        callback(market)
                    except Exception as e:
                        logger.error(f"New market callback error: {e}")
            else:
                old_market = self._markets[key]
                if old_market.yes_mid != market.yes_mid:
                    if old_market.yes_mid > 0:
                        market.price_change_1h = ((market.yes_mid - old_market.yes_mid) / old_market.yes_mid) * 100
                    for callback in self._on_price_update:
                        try:
                            callback(market)
                        except Exception as e:
                            logger.error(f"Price update callback error: {e}")
            
            self._markets[key] = market
            
            if key not in self._price_history:
                self._price_history[key] = []
            self._price_history[key].append((market.last_updated, market.yes_mid))
            self._price_history[key] = self._price_history[key][-1000:]
        
        self._last_full_refresh = datetime.utcnow()
        
        if new_markets:
            logger.info(f"Found {len(new_markets)} new markets")
    
    def _update_prices(self):
        self._fetch_all_markets()
    
    def get_price_history(self, platform: Platform, ticker: str, minutes: int = 60) -> List[Tuple[datetime, float]]:
        key = f"{platform.value}:{ticker}"
        history = self._price_history.get(key, [])
        cutoff = datetime.utcnow() - timedelta(minutes=minutes)
        return [(ts, price) for ts, price in history if ts > cutoff]


_scanner_instance: Optional[MarketScanner] = None


def get_scanner() -> MarketScanner:
    global _scanner_instance
    if _scanner_instance is None:
        _scanner_instance = MarketScanner()
    return _scanner_instance


def start_scanner(config: Optional[ScannerConfig] = None):
    global _scanner_instance
    if _scanner_instance is None:
        _scanner_instance = MarketScanner(config)
    _scanner_instance.start()
    return _scanner_instance


def stop_scanner():
    global _scanner_instance
    if _scanner_instance:
        _scanner_instance.stop()
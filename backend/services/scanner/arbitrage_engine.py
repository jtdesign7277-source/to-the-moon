"""
Arbitrage Engine
Analyzes market data to detect trading opportunities:
- Mispricing (YES + NO < $1.00)
- Momentum signals (rapid price changes)
- Spread opportunities (wide bid-ask spreads)
"""
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from dataclasses import dataclass
from enum import Enum

from .market_scanner import MarketData, Platform

logger = logging.getLogger(__name__)


class SignalType(Enum):
    MISPRICING = "mispricing"
    MOMENTUM = "momentum"
    SPREAD = "spread"
    ARBITRAGE = "arbitrage"


@dataclass
class TradingSignal:
    """Represents a detected trading opportunity."""
    signal_type: SignalType
    platform: Platform
    ticker: str
    title: str
    
    # Core signal data
    edge_percentage: float
    confidence: float  # 0-1
    expected_profit: float
    
    # Market data
    yes_bid: float
    yes_ask: float
    no_bid: float
    no_ask: float
    
    # Signal details
    description: str
    reasoning: str
    
    # Recommended action
    recommended_side: str  # "YES", "NO", "BOTH"
    recommended_quantity: int
    risk_level: str  # "low", "medium", "high"
    
    # Timing
    detected_at: datetime
    expires_at: Optional[datetime] = None
    
    # Metadata
    volume: int = 0
    liquidity: float = 0.0
    category: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'signalType': self.signal_type.value,
            'platform': self.platform.value,
            'ticker': self.ticker,
            'title': self.title,
            'edgePercentage': round(self.edge_percentage, 2),
            'confidence': round(self.confidence, 2),
            'expectedProfit': round(self.expected_profit, 2),
            'yesBid': self.yes_bid,
            'yesAsk': self.yes_ask,
            'noBid': self.no_bid,
            'noAsk': self.no_ask,
            'description': self.description,
            'reasoning': self.reasoning,
            'recommendedSide': self.recommended_side,
            'recommendedQuantity': self.recommended_quantity,
            'riskLevel': self.risk_level,
            'detectedAt': self.detected_at.isoformat(),
            'expiresAt': self.expires_at.isoformat() if self.expires_at else None,
            'volume': self.volume,
            'liquidity': self.liquidity,
            'category': self.category,
        }


@dataclass
class ArbitrageConfig:
    """Configuration for arbitrage detection."""
    # Mispricing thresholds
    min_mispricing_edge: float = 2.0  # 2% edge minimum
    max_sum_threshold: float = 0.98  # YES + NO < 0.98 = opportunity
    
    # Momentum thresholds
    min_momentum_change: float = 10.0  # 10% price change
    momentum_window_minutes: int = 30
    
    # Spread thresholds
    min_spread_edge: float = 3.0  # 3% spread minimum
    
    # Risk controls
    min_volume: int = 100
    min_liquidity: float = 1000.0
    max_price: float = 0.95  # Don't buy above $0.95
    min_price: float = 0.05  # Don't sell below $0.05
    
    # Position sizing
    default_quantity: int = 10
    max_quantity: int = 100
    
    # Signal filtering
    min_confidence: float = 0.6  # 60% confidence minimum


class ArbitrageEngine:
    """Detects trading opportunities from market data."""
    
    def __init__(self, config: Optional[ArbitrageConfig] = None):
        self.config = config or ArbitrageConfig()  
        self._active_signals: Dict[str, TradingSignal] = {}
        self._signal_history: List[TradingSignal] = []
        self._stats = {
            'total_signals': 0,
            'mispricing_signals': 0,
            'momentum_signals': 0,
            'spread_signals': 0,
        }
    
    def get_active_signals(self, min_confidence: Optional[float] = None) -> List[TradingSignal]:
        """Get all active signals, optionally filtered by confidence."""
        now = datetime.utcnow()
        
        # Remove expired signals
        expired_keys = [
            key for key, signal in self._active_signals.items()
            if signal.expires_at and signal.expires_at < now
        ]
        for key in expired_keys:
            del self._active_signals[key]
        
        signals = list(self._active_signals.values())
        
        if min_confidence is not None:
            signals = [s for s in signals if s.confidence >= min_confidence]
        
        # Sort by confidence
        signals.sort(key=lambda s: s.confidence, reverse=True)
        
        return signals
    
    def get_stats(self) -> Dict[str, Any]:
        """Get engine statistics."""
        return {
            'activeSignals': len(self._active_signals),
            'totalSignalsDetected': self._stats['total_signals'],
            'mispricingSignals': self._stats['mispricing_signals'],
            'momentumSignals': self._stats['momentum_signals'],
            'spreadSignals': self._stats['spread_signals'],
            'config': {
                'minMispricingEdge': self.config.min_mispricing_edge,
                'minMomentumChange': self.config.min_momentum_change,
                'minSpreadEdge': self.config.min_spread_edge,
            }
        }
    
    def clear_signals(self):
        """Clear all active signals."""
        self._active_signals.clear()


# Singleton instance
_engine_instance: Optional[ArbitrageEngine] = None


def get_engine() -> ArbitrageEngine:
    """Get the singleton arbitrage engine instance."""
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = ArbitrageEngine()
    return _engine_instance 
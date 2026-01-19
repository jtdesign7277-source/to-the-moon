"""
Momentum Strategy Implementation
Follows price trends and enters on momentum signals
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from collections import deque
import logging
import statistics

from .base_strategy import (
    BaseStrategy,
    StrategyConfig,
    Signal,
    SignalType,
    PositionSide,
    Position,
)

logger = logging.getLogger(__name__)


class MomentumStrategy(BaseStrategy):
    """
    Momentum strategy that identifies and follows price trends.

    How it works:
    1. Tracks price movements over configurable lookback period
    2. Calculates momentum indicators (rate of change, moving averages)
    3. Generates BUY signal when price breaks out with strong momentum
    4. Generates SELL signal when momentum reverses

    Key indicators:
    - Rate of Change (ROC): (current - past) / past
    - Volume confirmation: Volume spike with price movement
    - Trend strength: Consecutive moves in same direction
    """

    @property
    def strategy_type(self) -> str:
        return "momentum"

    def __init__(self, config: StrategyConfig):
        super().__init__(config)

        # Momentum-specific settings
        self.lookback_periods = config.custom_settings.get('lookback_periods', 10)
        self.momentum_threshold = config.custom_settings.get('momentum_threshold', 0.05)  # 5% move
        self.volume_multiplier = config.custom_settings.get('volume_multiplier', 1.5)
        self.trend_confirmation = config.custom_settings.get('trend_confirmation', 3)  # Consecutive periods
        self.use_volume_filter = config.custom_settings.get('use_volume_filter', True)

        # Price history for each market
        self.price_history: Dict[str, deque] = {}
        self.volume_history: Dict[str, deque] = {}

        # Maximum history to keep
        self.max_history = 100

    def analyze(self, market_data: Dict[str, Any]) -> List[Signal]:
        """
        Analyze markets for momentum signals.

        Args:
            market_data: Dict containing:
                - markets: List of market data with prices and volumes
                - historical: Optional historical price data

        Returns:
            List of momentum signals
        """
        signals = []
        markets = market_data.get('markets', [])

        for market in markets:
            market_id = market.get('id')
            if not market_id:
                continue

            # Filter by configured categories
            if self.config.categories:
                market_cat = market.get('category', '').lower()
                if not any(cat.lower() in market_cat for cat in self.config.categories):
                    continue

            # Check liquidity
            volume = market.get('volume', 0)
            liquidity = market.get('liquidity', volume)
            if liquidity < self.config.min_liquidity:
                continue

            # Get current price
            current_price = market.get('yes_price') or market.get('probability', 0.5)

            # Update price history
            self._update_history(market_id, current_price, volume)

            # Skip if not enough history
            if len(self.price_history.get(market_id, [])) < self.lookback_periods:
                continue

            # Calculate momentum indicators
            momentum_data = self._calculate_momentum(market_id)

            if not momentum_data:
                continue

            # Generate signal if momentum is strong enough
            signal = self._generate_momentum_signal(market, momentum_data)

            if signal:
                signals.append(signal)

        # Sort by momentum strength
        signals.sort(key=lambda s: abs(s.metadata.get('momentum', 0)), reverse=True)

        self.signals = signals
        self.last_update = datetime.utcnow()

        return signals

    def _update_history(self, market_id: str, price: float, volume: float):
        """Update price and volume history for a market"""
        if market_id not in self.price_history:
            self.price_history[market_id] = deque(maxlen=self.max_history)
            self.volume_history[market_id] = deque(maxlen=self.max_history)

        self.price_history[market_id].append({
            'price': price,
            'timestamp': datetime.utcnow(),
        })

        self.volume_history[market_id].append({
            'volume': volume,
            'timestamp': datetime.utcnow(),
        })

    def _calculate_momentum(self, market_id: str) -> Optional[Dict]:
        """
        Calculate momentum indicators for a market.

        Returns dict with:
        - roc: Rate of change
        - trend_strength: Number of consecutive same-direction moves
        - volume_spike: Whether volume is above average
        - direction: 'up' or 'down'
        """
        prices = list(self.price_history[market_id])
        volumes = list(self.volume_history[market_id])

        if len(prices) < self.lookback_periods:
            return None

        # Get lookback prices
        recent_prices = [p['price'] for p in prices[-self.lookback_periods:]]
        current_price = recent_prices[-1]
        past_price = recent_prices[0]

        # Rate of Change
        if past_price == 0:
            return None
        roc = (current_price - past_price) / past_price

        # Direction
        direction = 'up' if roc > 0 else 'down'

        # Trend strength (consecutive moves)
        trend_strength = 0
        for i in range(len(recent_prices) - 1, 0, -1):
            move = recent_prices[i] - recent_prices[i-1]
            if (direction == 'up' and move > 0) or (direction == 'down' and move < 0):
                trend_strength += 1
            else:
                break

        # Volume analysis
        recent_volumes = [v['volume'] for v in volumes[-self.lookback_periods:]]
        avg_volume = statistics.mean(recent_volumes) if recent_volumes else 0
        current_volume = recent_volumes[-1] if recent_volumes else 0
        volume_spike = current_volume > avg_volume * self.volume_multiplier if avg_volume > 0 else False

        # Calculate simple moving averages
        sma_short = statistics.mean(recent_prices[-3:]) if len(recent_prices) >= 3 else current_price
        sma_long = statistics.mean(recent_prices) if recent_prices else current_price

        return {
            'roc': roc,
            'roc_percent': roc * 100,
            'direction': direction,
            'trend_strength': trend_strength,
            'volume_spike': volume_spike,
            'current_price': current_price,
            'past_price': past_price,
            'avg_volume': avg_volume,
            'current_volume': current_volume,
            'sma_short': sma_short,
            'sma_long': sma_long,
            'sma_crossover': sma_short > sma_long,
        }

    def _generate_momentum_signal(self, market: Dict, momentum_data: Dict) -> Optional[Signal]:
        """Generate a signal based on momentum data"""
        roc = momentum_data['roc']
        roc_percent = momentum_data['roc_percent']
        direction = momentum_data['direction']
        trend_strength = momentum_data['trend_strength']
        volume_spike = momentum_data['volume_spike']

        # Check if momentum exceeds threshold
        if abs(roc) < self.momentum_threshold:
            return None

        # Check trend confirmation
        if trend_strength < self.trend_confirmation:
            return None

        # Check volume confirmation (if enabled)
        if self.use_volume_filter and not volume_spike:
            return None

        # Calculate edge based on momentum strength
        edge = abs(roc_percent)
        if edge < self.config.min_edge:
            return None

        # Calculate confidence
        confidence = min(
            (trend_strength / 10) * 0.4 +  # Trend factor
            (abs(roc) / 0.2) * 0.3 +  # ROC factor
            (0.3 if volume_spike else 0.1),  # Volume factor
            1.0
        )

        # Size recommendation
        size_rec = min(edge / 20, 1.0) * confidence

        current_price = momentum_data['current_price']

        return Signal(
            signal_type=SignalType.BUY,
            market_id=market.get('id'),
            platform=market.get('platform', 'kalshi'),
            confidence=confidence,
            price=current_price,
            side=PositionSide.LONG if direction == 'up' else PositionSide.SHORT,
            size_recommendation=size_rec,
            reason=f"Momentum {direction}: {roc_percent:+.1f}% over {self.lookback_periods} periods, "
                   f"trend strength {trend_strength}, volume {'confirmed' if volume_spike else 'normal'}",
            metadata={
                'momentum': roc_percent,
                'direction': direction,
                'trend_strength': trend_strength,
                'volume_spike': volume_spike,
                'sma_crossover': momentum_data['sma_crossover'],
                'edge': edge,
            }
        )

    def should_enter(self, signal: Signal, market_data: Dict[str, Any]) -> bool:
        """
        Determine if we should enter a momentum position.

        Checks:
        1. Momentum still present
        2. Haven't exceeded position limits
        3. Market conditions still favorable
        """
        # Check position limits
        if len(self.positions) >= 5:  # Max 5 momentum positions
            return False

        # Check we don't already have position in this market
        for pos in self.positions.values():
            if pos.market_id == signal.market_id:
                return False

        # Verify momentum still exists
        market_id = signal.market_id
        if market_id in self.price_history:
            momentum_data = self._calculate_momentum(market_id)
            if momentum_data:
                current_direction = momentum_data['direction']
                original_direction = signal.metadata.get('direction')

                # Don't enter if direction reversed
                if current_direction != original_direction:
                    logger.info(f"Momentum reversed for {market_id}")
                    return False

                # Don't enter if momentum weakened significantly
                if abs(momentum_data['roc']) < self.momentum_threshold * 0.5:
                    logger.info(f"Momentum weakened for {market_id}")
                    return False

        return True

    def should_exit(self, position: Position, market_data: Dict[str, Any]) -> tuple[bool, str]:
        """
        Determine if we should exit a momentum position.

        Momentum exits when:
        1. Momentum reverses
        2. Trend breaks
        3. Standard exits (stop loss, take profit, trailing)
        """
        # Check standard exit conditions first
        should_exit, reason = self.check_exit_conditions(position, market_data)
        if should_exit:
            return True, reason

        market_id = position.market_id

        # Check if momentum has reversed
        if market_id in self.price_history:
            momentum_data = self._calculate_momentum(market_id)

            if momentum_data:
                position_direction = 'up' if position.side == PositionSide.LONG else 'down'
                current_direction = momentum_data['direction']

                # Exit if direction reversed
                if current_direction != position_direction:
                    return True, f"Momentum reversed to {current_direction}"

                # Exit if trend strength dropped
                if momentum_data['trend_strength'] < 1:
                    return True, "Trend broken"

                # Exit if momentum collapsed
                if abs(momentum_data['roc']) < self.momentum_threshold * 0.3:
                    return True, "Momentum collapsed"

        return False, ""

    def get_momentum_status(self) -> Dict:
        """Get momentum-specific status"""
        status = self.get_status()

        # Add tracked markets info
        tracked_markets = []
        for market_id, prices in self.price_history.items():
            if len(prices) >= self.lookback_periods:
                momentum_data = self._calculate_momentum(market_id)
                if momentum_data:
                    tracked_markets.append({
                        'market_id': market_id,
                        'momentum': momentum_data['roc_percent'],
                        'direction': momentum_data['direction'],
                        'trend_strength': momentum_data['trend_strength'],
                    })

        status.update({
            'tracked_markets': len(self.price_history),
            'momentum_markets': tracked_markets[:10],  # Top 10
            'lookback_periods': self.lookback_periods,
            'momentum_threshold': self.momentum_threshold * 100,
        })

        return status

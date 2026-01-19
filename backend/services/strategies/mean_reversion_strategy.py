"""
Mean Reversion Strategy Implementation
Bets on prices returning to their historical average
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from collections import deque
import logging
import statistics
import math

from .base_strategy import (
    BaseStrategy,
    StrategyConfig,
    Signal,
    SignalType,
    PositionSide,
    Position,
)

logger = logging.getLogger(__name__)


class MeanReversionStrategy(BaseStrategy):
    """
    Mean reversion strategy that identifies overbought/oversold conditions.

    How it works:
    1. Calculates historical mean and standard deviation of prices
    2. Identifies when price deviates significantly (Z-score)
    3. Bets on price returning to mean when extreme deviation detected
    4. Uses Bollinger Band-style analysis for entry/exit

    Key concepts:
    - Z-score: How many standard deviations from mean
    - Bollinger Bands: Mean ± N standard deviations
    - Buy when oversold (price below lower band)
    - Sell when overbought (price above upper band)
    """

    @property
    def strategy_type(self) -> str:
        return "mean-reversion"

    def __init__(self, config: StrategyConfig):
        super().__init__(config)

        # Mean reversion specific settings
        self.lookback_period = config.custom_settings.get('lookback_period', 20)
        self.z_score_threshold = config.custom_settings.get('z_score_threshold', 2.0)
        self.bollinger_multiplier = config.custom_settings.get('bollinger_multiplier', 2.0)
        self.min_mean_distance = config.custom_settings.get('min_mean_distance', 0.10)  # 10% from mean
        self.use_volume_confirmation = config.custom_settings.get('use_volume_confirmation', True)

        # Price history for each market
        self.price_history: Dict[str, deque] = {}

        # Track statistics
        self.market_stats: Dict[str, Dict] = {}

        # Maximum history
        self.max_history = 200

    def analyze(self, market_data: Dict[str, Any]) -> List[Signal]:
        """
        Analyze markets for mean reversion opportunities.

        Args:
            market_data: Dict containing:
                - markets: List of market data
                - historical: Optional historical data

        Returns:
            List of mean reversion signals
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
            self._update_history(market_id, current_price)

            # Skip if not enough history
            if len(self.price_history.get(market_id, [])) < self.lookback_period:
                continue

            # Calculate mean reversion metrics
            stats = self._calculate_stats(market_id)

            if not stats:
                continue

            # Store stats
            self.market_stats[market_id] = stats

            # Generate signal if conditions met
            signal = self._generate_reversion_signal(market, stats)

            if signal:
                signals.append(signal)

        # Sort by absolute Z-score (most extreme first)
        signals.sort(key=lambda s: abs(s.metadata.get('z_score', 0)), reverse=True)

        self.signals = signals
        self.last_update = datetime.utcnow()

        return signals

    def _update_history(self, market_id: str, price: float):
        """Update price history for a market"""
        if market_id not in self.price_history:
            self.price_history[market_id] = deque(maxlen=self.max_history)

        self.price_history[market_id].append({
            'price': price,
            'timestamp': datetime.utcnow(),
        })

    def _calculate_stats(self, market_id: str) -> Optional[Dict]:
        """
        Calculate mean reversion statistics for a market.

        Returns dict with:
        - mean: Historical mean price
        - std: Standard deviation
        - z_score: Current Z-score
        - upper_band: Upper Bollinger band
        - lower_band: Lower Bollinger band
        - deviation: Percentage from mean
        """
        prices = list(self.price_history[market_id])

        if len(prices) < self.lookback_period:
            return None

        # Get lookback prices
        recent_prices = [p['price'] for p in prices[-self.lookback_period:]]
        current_price = recent_prices[-1]

        # Calculate statistics
        mean = statistics.mean(recent_prices)
        std = statistics.stdev(recent_prices) if len(recent_prices) > 1 else 0

        # Avoid division by zero
        if std == 0:
            std = 0.01

        # Z-score
        z_score = (current_price - mean) / std

        # Bollinger bands
        upper_band = mean + (self.bollinger_multiplier * std)
        lower_band = mean - (self.bollinger_multiplier * std)

        # Ensure bands are within valid range
        upper_band = min(upper_band, 0.99)
        lower_band = max(lower_band, 0.01)

        # Deviation from mean
        deviation = (current_price - mean) / mean if mean != 0 else 0

        # Position relative to bands
        if current_price > upper_band:
            band_position = 'above_upper'
        elif current_price < lower_band:
            band_position = 'below_lower'
        else:
            band_position = 'within'

        # Historical volatility
        returns = []
        for i in range(1, len(recent_prices)):
            if recent_prices[i-1] != 0:
                ret = (recent_prices[i] - recent_prices[i-1]) / recent_prices[i-1]
                returns.append(ret)

        volatility = statistics.stdev(returns) if len(returns) > 1 else 0

        return {
            'mean': mean,
            'std': std,
            'z_score': z_score,
            'upper_band': upper_band,
            'lower_band': lower_band,
            'current_price': current_price,
            'deviation': deviation,
            'deviation_percent': deviation * 100,
            'band_position': band_position,
            'volatility': volatility,
        }

    def _generate_reversion_signal(self, market: Dict, stats: Dict) -> Optional[Signal]:
        """Generate a signal based on mean reversion statistics"""
        z_score = stats['z_score']
        deviation_percent = abs(stats['deviation_percent'])
        band_position = stats['band_position']
        current_price = stats['current_price']
        mean = stats['mean']

        # Check if deviation is significant enough
        if deviation_percent < self.min_mean_distance * 100:
            return None

        # Check Z-score threshold
        if abs(z_score) < self.z_score_threshold:
            return None

        # Calculate expected return to mean
        expected_return = abs(mean - current_price) / current_price * 100

        # Check minimum edge
        if expected_return < self.config.min_edge:
            return None

        # Determine signal direction
        if z_score < -self.z_score_threshold:  # Oversold - buy
            side = PositionSide.LONG
            signal_type = SignalType.BUY
            reason = f"Oversold: price {current_price:.2%} is {deviation_percent:.1f}% below mean {mean:.2%} (Z={z_score:.2f})"
        elif z_score > self.z_score_threshold:  # Overbought - sell/short
            side = PositionSide.SHORT
            signal_type = SignalType.SELL
            reason = f"Overbought: price {current_price:.2%} is {deviation_percent:.1f}% above mean {mean:.2%} (Z={z_score:.2f})"
        else:
            return None

        # Calculate confidence based on Z-score and deviation
        confidence = min(
            (abs(z_score) / 4) * 0.5 +  # Z-score factor (0-0.5)
            (deviation_percent / 30) * 0.3 +  # Deviation factor (0-0.3)
            0.2,  # Base confidence
            1.0
        )

        # Size recommendation
        size_rec = min(expected_return / 30, 1.0) * confidence

        return Signal(
            signal_type=signal_type,
            market_id=market.get('id'),
            platform=market.get('platform', 'kalshi'),
            confidence=confidence,
            price=current_price,
            side=side,
            size_recommendation=size_rec,
            reason=reason,
            metadata={
                'z_score': z_score,
                'mean': mean,
                'std': stats['std'],
                'deviation_percent': deviation_percent,
                'expected_return': expected_return,
                'upper_band': stats['upper_band'],
                'lower_band': stats['lower_band'],
                'band_position': band_position,
                'volatility': stats['volatility'],
                'edge': expected_return,
            }
        )

    def should_enter(self, signal: Signal, market_data: Dict[str, Any]) -> bool:
        """
        Determine if we should enter a mean reversion position.

        Checks:
        1. Deviation still exists
        2. Z-score still extreme
        3. Position limits
        """
        # Check position limits
        if len(self.positions) >= 5:
            return False

        # Check we don't already have position in this market
        for pos in self.positions.values():
            if pos.market_id == signal.market_id:
                return False

        # Verify deviation still exists
        market_id = signal.market_id
        if market_id in self.market_stats:
            stats = self._calculate_stats(market_id)
            if stats:
                # Check Z-score hasn't normalized
                if abs(stats['z_score']) < self.z_score_threshold * 0.7:
                    logger.info(f"Z-score normalized for {market_id}")
                    return False

        return True

    def should_exit(self, position: Position, market_data: Dict[str, Any]) -> tuple[bool, str]:
        """
        Determine if we should exit a mean reversion position.

        Mean reversion exits when:
        1. Price returns to mean (target reached)
        2. Price crosses mean (overshoot)
        3. Z-score normalizes
        4. Standard exits
        """
        # Check standard exit conditions first
        should_exit, reason = self.check_exit_conditions(position, market_data)
        if should_exit:
            return True, reason

        market_id = position.market_id

        # Check mean reversion specific exits
        if market_id in self.price_history:
            stats = self._calculate_stats(market_id)

            if stats:
                z_score = stats['z_score']
                mean = stats['mean']
                current_price = stats['current_price']

                # Exit if price returned to mean
                if abs(z_score) < 0.5:
                    return True, f"Price returned to mean (Z={z_score:.2f})"

                # Exit if position was long and price now above mean
                if position.side == PositionSide.LONG and current_price > mean:
                    return True, f"Mean reversion complete: price {current_price:.2%} now above mean {mean:.2%}"

                # Exit if position was short and price now below mean
                if position.side == PositionSide.SHORT and current_price < mean:
                    return True, f"Mean reversion complete: price {current_price:.2%} now below mean {mean:.2%}"

                # Exit if Z-score went further extreme (mean shifted)
                if position.side == PositionSide.LONG and z_score < -4:
                    return True, "Mean may have shifted (extreme oversold persists)"
                if position.side == PositionSide.SHORT and z_score > 4:
                    return True, "Mean may have shifted (extreme overbought persists)"

        return False, ""

    def get_reversion_status(self) -> Dict:
        """Get mean reversion specific status"""
        status = self.get_status()

        # Add market stats
        extreme_markets = []
        for market_id, stats in self.market_stats.items():
            if abs(stats.get('z_score', 0)) > self.z_score_threshold * 0.8:
                extreme_markets.append({
                    'market_id': market_id,
                    'z_score': stats['z_score'],
                    'deviation_percent': stats['deviation_percent'],
                    'mean': stats['mean'],
                    'current_price': stats['current_price'],
                    'band_position': stats['band_position'],
                })

        status.update({
            'tracked_markets': len(self.price_history),
            'extreme_markets': sorted(extreme_markets, key=lambda x: abs(x['z_score']), reverse=True)[:10],
            'z_score_threshold': self.z_score_threshold,
            'lookback_period': self.lookback_period,
        })

        return status

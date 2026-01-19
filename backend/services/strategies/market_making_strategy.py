"""
Market Making Strategy Implementation
Provides liquidity and captures bid-ask spreads
"""

from typing import Dict, List, Any, Optional, Tuple
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


class OrderSide:
    BID = "bid"
    ASK = "ask"


class MarketMakingStrategy(BaseStrategy):
    """
    Market making strategy that provides liquidity and captures spreads.

    How it works:
    1. Places both buy (bid) and sell (ask) orders around fair value
    2. Earns the spread when both orders fill
    3. Manages inventory risk by adjusting quotes
    4. High frequency with many small profits

    Key concepts:
    - Fair value estimation
    - Bid-ask spread management
    - Inventory management (avoid getting too long/short)
    - Quote adjustment based on market conditions
    """

    @property
    def strategy_type(self) -> str:
        return "market-making"

    def __init__(self, config: StrategyConfig):
        super().__init__(config)

        # Market making specific settings
        self.target_spread = config.custom_settings.get('target_spread', 0.03)  # 3% spread
        self.min_spread = config.custom_settings.get('min_spread', 0.01)  # 1% minimum
        self.max_inventory = config.custom_settings.get('max_inventory', 500)  # Max position
        self.inventory_skew = config.custom_settings.get('inventory_skew', 0.02)  # Quote adjustment per $100 inventory
        self.quote_size = config.custom_settings.get('quote_size', 50)  # Default quote size
        self.refresh_interval = config.custom_settings.get('refresh_interval', 30)  # Seconds

        # Active quotes
        self.active_quotes: Dict[str, Dict] = {}  # market_id -> {bid, ask}

        # Inventory tracking
        self.inventory: Dict[str, float] = {}  # market_id -> net position

        # Price history for fair value estimation
        self.price_history: Dict[str, deque] = {}

        # Trade statistics
        self.spreads_captured = 0
        self.total_spread_pnl = 0.0

    def analyze(self, market_data: Dict[str, Any]) -> List[Signal]:
        """
        Analyze markets and generate market making quotes.

        Args:
            market_data: Dict containing:
                - markets: List of market data with order book info
                - order_books: Optional detailed order book data

        Returns:
            List of signals (bid and ask pairs)
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

            # Check liquidity - need enough activity
            volume = market.get('volume', 0)
            if volume < self.config.min_liquidity * 0.5:  # Lower threshold for MM
                continue

            # Get fair value
            fair_value = self._estimate_fair_value(market)

            if fair_value is None:
                continue

            # Update price history
            self._update_price_history(market_id, fair_value)

            # Calculate optimal quotes
            bid_price, ask_price = self._calculate_quotes(market_id, fair_value)

            # Check if spread is profitable
            spread = ask_price - bid_price
            if spread < self.min_spread:
                continue

            # Check edge (spread vs cost)
            edge = spread * 100
            if edge < self.config.min_edge:
                continue

            # Generate bid signal
            bid_signal = Signal(
                signal_type=SignalType.BUY,
                market_id=market_id,
                platform=market.get('platform', 'kalshi'),
                confidence=self._calculate_confidence(market, spread),
                price=bid_price,
                side=PositionSide.LONG,
                size_recommendation=self._get_quote_size(market_id),
                reason=f"Market making bid at {bid_price:.2%} (FV: {fair_value:.2%})",
                metadata={
                    'quote_type': 'bid',
                    'fair_value': fair_value,
                    'spread': spread,
                    'spread_percent': spread * 100,
                    'paired_quote': ask_price,
                    'edge': edge,
                }
            )

            # Generate ask signal
            ask_signal = Signal(
                signal_type=SignalType.SELL,
                market_id=market_id,
                platform=market.get('platform', 'kalshi'),
                confidence=self._calculate_confidence(market, spread),
                price=ask_price,
                side=PositionSide.SHORT,
                size_recommendation=self._get_quote_size(market_id),
                reason=f"Market making ask at {ask_price:.2%} (FV: {fair_value:.2%})",
                metadata={
                    'quote_type': 'ask',
                    'fair_value': fair_value,
                    'spread': spread,
                    'spread_percent': spread * 100,
                    'paired_quote': bid_price,
                    'edge': edge,
                }
            )

            signals.extend([bid_signal, ask_signal])

            # Store active quotes
            self.active_quotes[market_id] = {
                'bid': bid_price,
                'ask': ask_price,
                'fair_value': fair_value,
                'timestamp': datetime.utcnow(),
            }

        self.signals = signals
        self.last_update = datetime.utcnow()

        return signals

    def _estimate_fair_value(self, market: Dict) -> Optional[float]:
        """
        Estimate fair value for a market.

        Uses:
        - Current mid price
        - Historical average
        - Volume-weighted price
        """
        # Get current prices
        yes_price = market.get('yes_price')
        no_price = market.get('no_price')
        probability = market.get('probability')

        if probability:
            mid_price = probability
        elif yes_price and no_price:
            mid_price = (yes_price + (1 - no_price)) / 2
        elif yes_price:
            mid_price = yes_price
        else:
            return None

        # Adjust based on order book imbalance if available
        bid_depth = market.get('bid_depth', 0)
        ask_depth = market.get('ask_depth', 0)

        if bid_depth + ask_depth > 0:
            imbalance = (bid_depth - ask_depth) / (bid_depth + ask_depth)
            # Adjust fair value towards side with more depth
            mid_price += imbalance * 0.01

        # Ensure valid range
        return max(0.01, min(0.99, mid_price))

    def _update_price_history(self, market_id: str, price: float):
        """Update price history for fair value smoothing"""
        if market_id not in self.price_history:
            self.price_history[market_id] = deque(maxlen=50)

        self.price_history[market_id].append({
            'price': price,
            'timestamp': datetime.utcnow(),
        })

    def _calculate_quotes(self, market_id: str, fair_value: float) -> Tuple[float, float]:
        """
        Calculate optimal bid and ask prices.

        Adjusts spread based on:
        - Current inventory (skew quotes to reduce inventory)
        - Market volatility
        - Competition (if visible)
        """
        half_spread = self.target_spread / 2

        # Get current inventory
        inventory = self.inventory.get(market_id, 0)

        # Calculate inventory skew
        # If long, lower ask to sell; if short, raise bid to buy
        skew = (inventory / 100) * self.inventory_skew

        # Calculate raw quotes
        bid_price = fair_value - half_spread - skew
        ask_price = fair_value + half_spread - skew

        # Adjust for volatility if we have history
        if market_id in self.price_history and len(self.price_history[market_id]) > 5:
            prices = [p['price'] for p in self.price_history[market_id]]
            volatility = statistics.stdev(prices) if len(prices) > 1 else 0

            # Widen spread in volatile markets
            vol_adjustment = volatility * 2
            bid_price -= vol_adjustment
            ask_price += vol_adjustment

        # Ensure valid prices and minimum spread
        bid_price = max(0.01, bid_price)
        ask_price = min(0.99, ask_price)

        # Ensure minimum spread
        if ask_price - bid_price < self.min_spread:
            mid = (ask_price + bid_price) / 2
            bid_price = mid - self.min_spread / 2
            ask_price = mid + self.min_spread / 2

        return bid_price, ask_price

    def _calculate_confidence(self, market: Dict, spread: float) -> float:
        """Calculate confidence based on market conditions"""
        volume = market.get('volume', 0)
        liquidity = market.get('liquidity', volume)

        # More liquidity = more confidence
        liquidity_factor = min(liquidity / 100000, 1.0) * 0.3

        # Larger spread = more confidence in profit
        spread_factor = min(spread / 0.05, 1.0) * 0.4

        # Base confidence
        base = 0.3

        return min(base + liquidity_factor + spread_factor, 1.0)

    def _get_quote_size(self, market_id: str) -> float:
        """Get quote size, adjusted for inventory"""
        base_size = self.quote_size
        inventory = self.inventory.get(market_id, 0)

        # Reduce size if near max inventory
        if abs(inventory) > self.max_inventory * 0.8:
            base_size *= 0.5

        return base_size / self.config.max_position  # Return as fraction

    def should_enter(self, signal: Signal, market_data: Dict[str, Any]) -> bool:
        """
        Determine if we should place a quote.

        Market makers are always willing to quote if:
        1. Spread is profitable
        2. Inventory limits not exceeded
        """
        market_id = signal.market_id
        quote_type = signal.metadata.get('quote_type')

        # Check inventory limits
        inventory = self.inventory.get(market_id, 0)

        if quote_type == 'bid' and inventory > self.max_inventory:
            logger.info(f"Skip bid: inventory too long ({inventory})")
            return False

        if quote_type == 'ask' and inventory < -self.max_inventory:
            logger.info(f"Skip ask: inventory too short ({inventory})")
            return False

        # Check spread is still profitable
        spread = signal.metadata.get('spread', 0)
        if spread < self.min_spread:
            return False

        return True

    def should_exit(self, position: Position, market_data: Dict[str, Any]) -> tuple[bool, str]:
        """
        Determine if we should exit a market making position.

        MM positions are usually hedged, so exits are different:
        1. Exit if spread collapses
        2. Exit if inventory risk too high
        3. Standard stop loss for adverse moves
        """
        # Check standard exit conditions
        should_exit, reason = self.check_exit_conditions(position, market_data)
        if should_exit:
            return True, reason

        market_id = position.market_id

        # Check if we can flatten at profit
        if market_id in self.active_quotes:
            quotes = self.active_quotes[market_id]

            if position.side == PositionSide.LONG:
                # Can sell at ask
                ask = quotes.get('ask', 0)
                if ask > position.entry_price:
                    return True, f"Flatten long at profit: {ask:.2%}"

            else:  # SHORT
                # Can buy at bid
                bid = quotes.get('bid', 0)
                if bid < position.entry_price:
                    return True, f"Flatten short at profit: {bid:.2%}"

        # Check time - MM positions shouldn't be held too long
        hours_in_trade = (datetime.utcnow() - position.entry_time).total_seconds() / 3600
        if hours_in_trade > 1:  # More than 1 hour is too long for MM
            return True, "MM position aged out"

        return False, ""

    def on_fill(self, market_id: str, side: str, price: float, size: float):
        """
        Called when a quote is filled.

        Updates inventory and tracks spread captures.
        """
        # Update inventory
        if market_id not in self.inventory:
            self.inventory[market_id] = 0

        if side == OrderSide.BID:
            self.inventory[market_id] += size
        else:
            self.inventory[market_id] -= size

        # Check if we captured a spread
        # (simplified - in reality would track paired fills)
        logger.info(f"Fill: {side} {size}@{price:.2%} for {market_id}, inventory: {self.inventory[market_id]}")

    def get_mm_status(self) -> Dict:
        """Get market making specific status"""
        status = self.get_status()

        # Calculate inventory stats
        total_inventory = sum(abs(inv) for inv in self.inventory.values())
        max_single_inventory = max((abs(inv) for inv in self.inventory.values()), default=0)

        status.update({
            'active_quotes': len(self.active_quotes),
            'quoted_markets': list(self.active_quotes.keys()),
            'total_inventory': total_inventory,
            'max_single_inventory': max_single_inventory,
            'max_inventory_limit': self.max_inventory,
            'target_spread': self.target_spread * 100,
            'min_spread': self.min_spread * 100,
            'spreads_captured': self.spreads_captured,
            'total_spread_pnl': self.total_spread_pnl,
            'inventories': {k: v for k, v in self.inventory.items() if v != 0},
        })

        return status

    def get_quotes_for_market(self, market_id: str) -> Optional[Dict]:
        """Get current quotes for a specific market"""
        return self.active_quotes.get(market_id)

    def cancel_quotes(self, market_id: str):
        """Cancel all quotes for a market"""
        if market_id in self.active_quotes:
            del self.active_quotes[market_id]
            logger.info(f"Cancelled quotes for {market_id}")

    def flatten_inventory(self, market_id: str) -> Optional[Signal]:
        """
        Generate a signal to flatten inventory in a market.

        Used for risk management or end-of-day.
        """
        inventory = self.inventory.get(market_id, 0)

        if inventory == 0:
            return None

        if market_id not in self.active_quotes:
            return None

        quotes = self.active_quotes[market_id]
        fair_value = quotes.get('fair_value', 0.5)

        if inventory > 0:
            # Long inventory - need to sell
            return Signal(
                signal_type=SignalType.SELL,
                market_id=market_id,
                platform='kalshi',
                confidence=0.8,
                price=fair_value,
                side=PositionSide.SHORT,
                size_recommendation=1.0,
                reason=f"Flatten long inventory of {inventory}",
                metadata={
                    'quote_type': 'flatten',
                    'inventory': inventory,
                    'fair_value': fair_value,
                }
            )
        else:
            # Short inventory - need to buy
            return Signal(
                signal_type=SignalType.BUY,
                market_id=market_id,
                platform='kalshi',
                confidence=0.8,
                price=fair_value,
                side=PositionSide.LONG,
                size_recommendation=1.0,
                reason=f"Flatten short inventory of {inventory}",
                metadata={
                    'quote_type': 'flatten',
                    'inventory': inventory,
                    'fair_value': fair_value,
                }
            )

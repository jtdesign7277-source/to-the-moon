"""
Arbitrage Strategy Implementation
Finds price discrepancies between prediction market platforms
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

from .base_strategy import (
    BaseStrategy,
    StrategyConfig,
    Signal,
    SignalType,
    PositionSide,
    Position,
)

logger = logging.getLogger(__name__)


class ArbitrageStrategy(BaseStrategy):
    """
    Arbitrage strategy that identifies and exploits price differences
    between prediction market platforms (Kalshi, Manifold, etc.)

    How it works:
    1. Scans for similar markets across platforms
    2. Compares YES/NO prices between platforms
    3. When price difference exceeds min_edge, generates signal
    4. Executes offsetting trades on both platforms to lock in profit

    Example:
    - Kalshi: "Will Bitcoin hit $100k?" YES price = 0.45
    - Manifold: Same market YES price = 0.52
    - Edge = 7% -> Buy YES on Kalshi, Buy NO on Manifold
    - Profit = edge minus fees regardless of outcome
    """

    @property
    def strategy_type(self) -> str:
        return "arbitrage"

    def __init__(self, config: StrategyConfig):
        super().__init__(config)

        # Arbitrage-specific settings
        self.price_tolerance = config.custom_settings.get('price_tolerance', 0.02)
        self.min_liquidity_both = config.custom_settings.get('min_liquidity_both', True)
        self.max_open_arbs = config.custom_settings.get('max_open_arbs', 5)
        self.title_match_threshold = config.custom_settings.get('title_match_threshold', 0.6)

        # Track matched markets
        self.matched_markets: Dict[str, Dict] = {}

    def analyze(self, market_data: Dict[str, Any]) -> List[Signal]:
        """
        Analyze markets across platforms to find arbitrage opportunities.

        Args:
            market_data: Dict containing:
                - kalshi_markets: List of Kalshi market data
                - manifold_markets: List of Manifold market data

        Returns:
            List of arbitrage signals
        """
        signals = []

        kalshi_markets = market_data.get('kalshi_markets', [])
        manifold_markets = market_data.get('manifold_markets', [])

        if not kalshi_markets or not manifold_markets:
            logger.warning("Missing market data for arbitrage analysis")
            return signals

        # Find matching markets
        for k_market in kalshi_markets:
            # Skip if not in configured categories
            if self.config.categories:
                market_cat = k_market.get('category', '').lower()
                if not any(cat.lower() in market_cat for cat in self.config.categories):
                    continue

            # Check liquidity
            k_volume = k_market.get('volume', 0) or k_market.get('open_interest', 0)
            if k_volume < self.config.min_liquidity:
                continue

            # Find matching Manifold market
            best_match = self._find_matching_market(k_market, manifold_markets)

            if not best_match:
                continue

            m_market, match_score = best_match

            # Check Manifold liquidity
            m_liquidity = m_market.get('liquidity', 0) or m_market.get('volume', 0)
            if self.min_liquidity_both and m_liquidity < self.config.min_liquidity:
                continue

            # Calculate edge
            k_yes_price = k_market.get('yes_price', 0.5)
            m_yes_price = m_market.get('probability', 0.5)

            edge = abs(k_yes_price - m_yes_price) * 100  # Convert to percentage

            if edge >= self.config.min_edge:
                # Determine trade direction
                if k_yes_price < m_yes_price:
                    # Buy YES on Kalshi (cheaper), buy NO on Manifold
                    signal = Signal(
                        signal_type=SignalType.BUY,
                        market_id=k_market.get('id'),
                        platform='kalshi',
                        confidence=min(edge / 10, 1.0),  # Scale confidence by edge
                        price=k_yes_price,
                        side=PositionSide.LONG,
                        size_recommendation=self._calc_size_rec(edge, match_score),
                        reason=f"Arbitrage: Kalshi YES {k_yes_price:.2%} vs Manifold {m_yes_price:.2%} ({edge:.1f}% edge)",
                        metadata={
                            'arb_type': 'cross_platform',
                            'kalshi_market': k_market.get('id'),
                            'manifold_market': m_market.get('id'),
                            'kalshi_price': k_yes_price,
                            'manifold_price': m_yes_price,
                            'edge': edge,
                            'match_score': match_score,
                            'hedge_platform': 'manifold',
                            'hedge_side': 'no',
                            'hedge_price': 1 - m_yes_price,
                        }
                    )
                else:
                    # Buy YES on Manifold (cheaper), buy NO on Kalshi
                    signal = Signal(
                        signal_type=SignalType.BUY,
                        market_id=m_market.get('id'),
                        platform='manifold',
                        confidence=min(edge / 10, 1.0),
                        price=m_yes_price,
                        side=PositionSide.LONG,
                        size_recommendation=self._calc_size_rec(edge, match_score),
                        reason=f"Arbitrage: Manifold YES {m_yes_price:.2%} vs Kalshi {k_yes_price:.2%} ({edge:.1f}% edge)",
                        metadata={
                            'arb_type': 'cross_platform',
                            'kalshi_market': k_market.get('id'),
                            'manifold_market': m_market.get('id'),
                            'kalshi_price': k_yes_price,
                            'manifold_price': m_yes_price,
                            'edge': edge,
                            'match_score': match_score,
                            'hedge_platform': 'kalshi',
                            'hedge_side': 'no',
                            'hedge_price': 1 - k_yes_price,
                        }
                    )

                signals.append(signal)

                # Store matched markets
                self.matched_markets[k_market.get('id')] = {
                    'kalshi': k_market,
                    'manifold': m_market,
                    'edge': edge,
                    'last_seen': datetime.utcnow(),
                }

        # Sort by edge (highest first)
        signals.sort(key=lambda s: s.metadata.get('edge', 0), reverse=True)

        self.signals = signals
        self.last_update = datetime.utcnow()

        return signals[:self.max_open_arbs]  # Limit number of signals

    def _find_matching_market(
        self,
        kalshi_market: Dict,
        manifold_markets: List[Dict]
    ) -> Optional[tuple[Dict, float]]:
        """
        Find matching Manifold market for a Kalshi market.

        Uses title similarity matching.
        """
        k_title = kalshi_market.get('title', '').lower()
        k_words = set(k_title.split())

        best_match = None
        best_score = 0

        for m_market in manifold_markets:
            m_title = m_market.get('title', '').lower()
            m_words = set(m_title.split())

            # Calculate Jaccard similarity
            intersection = len(k_words & m_words)
            union = len(k_words | m_words)

            if union == 0:
                continue

            similarity = intersection / union

            if similarity > best_score and similarity >= self.title_match_threshold:
                best_score = similarity
                best_match = m_market

        if best_match:
            return (best_match, best_score)
        return None

    def _calc_size_rec(self, edge: float, match_score: float) -> float:
        """Calculate size recommendation based on edge and match quality"""
        # Higher edge = larger position
        edge_factor = min(edge / 10, 1.0)

        # Better match = more confident
        match_factor = match_score

        return edge_factor * match_factor

    def should_enter(self, signal: Signal, market_data: Dict[str, Any]) -> bool:
        """
        Determine if we should enter an arbitrage position.

        For arbitrage, we need to ensure:
        1. Edge still exists (hasn't closed)
        2. Both legs can be executed
        3. We haven't exceeded max positions
        """
        if len(self.positions) >= self.max_open_arbs:
            logger.info("Max arbitrage positions reached")
            return False

        # Re-verify edge exists
        current_edge = self._get_current_edge(signal.metadata)

        if current_edge < self.config.min_edge:
            logger.info(f"Edge collapsed: was {signal.metadata.get('edge'):.1f}%, now {current_edge:.1f}%")
            return False

        # Check we don't already have position in this market
        for pos in self.positions.values():
            if pos.market_id == signal.market_id:
                logger.info(f"Already have position in {signal.market_id}")
                return False

        return True

    def _get_current_edge(self, metadata: Dict) -> float:
        """Re-calculate current edge from latest prices"""
        # In real implementation, would fetch fresh prices
        # For now, return stored edge with some decay
        stored_edge = metadata.get('edge', 0)
        return stored_edge * 0.95  # Assume some edge decay

    def should_exit(self, position: Position, market_data: Dict[str, Any]) -> tuple[bool, str]:
        """
        Determine if we should exit an arbitrage position.

        Arbitrage exits when:
        1. Edge has collapsed (prices converged)
        2. Market is about to close
        3. One leg resolves
        4. Stop loss hit (rare for pure arb)
        """
        # First check standard exit conditions
        should_exit, reason = self.check_exit_conditions(position, market_data)
        if should_exit:
            return True, reason

        # Check if edge has collapsed
        market_id = position.market_id
        if market_id in self.matched_markets:
            match_data = self.matched_markets[market_id]
            current_edge = market_data.get('edge', match_data.get('edge', 0))

            # Exit if edge has collapsed significantly
            if current_edge < self.config.min_edge * 0.5:
                return True, f"Edge collapsed to {current_edge:.1f}%"

        # Check if market is about to close
        close_time = market_data.get('close_time')
        if close_time:
            try:
                if isinstance(close_time, str):
                    close_dt = datetime.fromisoformat(close_time.replace('Z', '+00:00'))
                else:
                    close_dt = datetime.fromtimestamp(close_time / 1000)

                hours_to_close = (close_dt - datetime.utcnow()).total_seconds() / 3600

                if hours_to_close < 1:  # Less than 1 hour to close
                    return True, "Market closing soon"
            except Exception as e:
                logger.warning(f"Error parsing close time: {e}")

        return False, ""

    def calculate_hedge_order(self, signal: Signal, primary_size: float) -> Dict:
        """
        Calculate the hedge order for the other leg of the arbitrage.

        For a proper arbitrage, we need equal exposure on both sides.
        """
        metadata = signal.metadata

        return {
            'platform': metadata.get('hedge_platform'),
            'market_id': metadata.get('manifold_market') if metadata.get('hedge_platform') == 'manifold' else metadata.get('kalshi_market'),
            'side': metadata.get('hedge_side'),
            'price': metadata.get('hedge_price'),
            'size': primary_size,  # Equal size for both legs
            'type': 'hedge',
        }

    def get_arb_status(self) -> Dict:
        """Get arbitrage-specific status"""
        status = self.get_status()
        status.update({
            'matched_markets': len(self.matched_markets),
            'max_open_arbs': self.max_open_arbs,
            'active_arbs': len(self.positions),
        })
        return status

"""
Strategy Executor
Orchestrates strategy execution, handles order flow, and manages positions
"""

from typing import Dict, List, Any, Optional, Type
from datetime import datetime, timedelta
from enum import Enum
import asyncio
import logging
import json
import uuid

from .base_strategy import (
    BaseStrategy,
    StrategyConfig,
    Signal,
    SignalType,
    Position,
    PositionSide,
)
from .arbitrage_strategy import ArbitrageStrategy
from .momentum_strategy import MomentumStrategy
from .mean_reversion_strategy import MeanReversionStrategy
from .news_strategy import NewsStrategy
from .market_making_strategy import MarketMakingStrategy

logger = logging.getLogger(__name__)


class ExecutorStatus(Enum):
    """Strategy executor status"""
    IDLE = "idle"
    RUNNING = "running"
    PAUSED = "paused"
    STOPPED = "stopped"
    ERROR = "error"


class StrategyExecutor:
    """
    Main executor that runs trading strategies.

    Responsibilities:
    1. Initialize and manage strategy instances
    2. Fetch market data at appropriate intervals
    3. Generate signals from strategies
    4. Execute trades via platform APIs
    5. Manage positions and risk
    6. Track performance and logging
    """

    # Strategy type mapping
    STRATEGY_CLASSES: Dict[str, Type[BaseStrategy]] = {
        'arbitrage': ArbitrageStrategy,
        'momentum': MomentumStrategy,
        'mean-reversion': MeanReversionStrategy,
        'news-based': NewsStrategy,
        'market-making': MarketMakingStrategy,
    }

    def __init__(
        self,
        config: StrategyConfig,
        paper_trading: bool = True,
        api_credentials: Optional[Dict[str, Dict]] = None
    ):
        """
        Initialize the strategy executor.

        Args:
            config: Strategy configuration
            paper_trading: If True, simulate trades without real execution
            api_credentials: Platform API credentials
        """
        self.config = config
        self.paper_trading = paper_trading
        self.api_credentials = api_credentials or {}

        # Initialize the strategy
        strategy_class = self.STRATEGY_CLASSES.get(config.strategy_type)
        if not strategy_class:
            raise ValueError(f"Unknown strategy type: {config.strategy_type}")

        self.strategy: BaseStrategy = strategy_class(config)

        # Executor state
        self.status = ExecutorStatus.IDLE
        self.started_at: Optional[datetime] = None
        self.stopped_at: Optional[datetime] = None

        # Performance tracking
        self.total_pnl = 0.0
        self.total_trades = 0
        self.winning_trades = 0
        self.losing_trades = 0

        # Order management
        self.pending_orders: Dict[str, Dict] = {}
        self.executed_orders: List[Dict] = []

        # Run loop control
        self._running = False
        self._task: Optional[asyncio.Task] = None

        # Callbacks
        self.on_signal_callback = None
        self.on_trade_callback = None
        self.on_error_callback = None

    @classmethod
    def from_user_config(cls, user_config: Dict, paper_trading: bool = True) -> 'StrategyExecutor':
        """
        Create executor from user's strategy builder config.

        Args:
            user_config: Config from the frontend strategy builder
            paper_trading: If True, simulate trades

        Returns:
            Configured StrategyExecutor instance
        """
        # Map frontend config to StrategyConfig
        strategy_type = user_config.get('strategyType', 'momentum')

        # Build custom settings based on strategy type
        custom_settings = {}

        if strategy_type == 'arbitrage':
            custom_settings = {
                'price_tolerance': user_config.get('settings', {}).get('priceTolerance', 0.02),
                'max_open_arbs': user_config.get('settings', {}).get('maxOpenArbs', 5),
            }
        elif strategy_type == 'momentum':
            custom_settings = {
                'lookback_periods': user_config.get('settings', {}).get('lookbackPeriods', 10),
                'momentum_threshold': user_config.get('settings', {}).get('momentumThreshold', 0.05),
                'use_volume_filter': user_config.get('settings', {}).get('useVolumeFilter', True),
            }
        elif strategy_type == 'mean-reversion':
            custom_settings = {
                'lookback_period': user_config.get('settings', {}).get('lookbackPeriod', 20),
                'z_score_threshold': user_config.get('settings', {}).get('zScoreThreshold', 2.0),
            }
        elif strategy_type == 'news-based':
            custom_settings = {
                'sentiment_threshold': user_config.get('settings', {}).get('sentimentThreshold', 0.6),
                'react_speed': user_config.get('settings', {}).get('reactSpeed', 'fast'),
            }
        elif strategy_type == 'market-making':
            custom_settings = {
                'target_spread': user_config.get('settings', {}).get('targetSpread', 0.03),
                'max_inventory': user_config.get('settings', {}).get('maxInventory', 500),
            }

        # Map advanced exit conditions
        advanced_exit = {}
        for exit_id, exit_config in user_config.get('advancedExitConditions', {}).items():
            if exit_config.get('enabled'):
                advanced_exit[exit_id] = {
                    'enabled': True,
                    'value': exit_config.get('value', 0),
                }

        # Map conditional rules
        conditional_rules = []
        for rule in user_config.get('conditionalRules', []):
            conditional_rules.append({
                'trigger': {
                    'type': rule.get('trigger', {}).get('type'),
                    'value': rule.get('trigger', {}).get('value', 0),
                },
                'action': {
                    'type': rule.get('action', {}).get('type'),
                    'value': rule.get('action', {}).get('value', 0),
                },
            })

        config = StrategyConfig(
            strategy_type=strategy_type,
            name=user_config.get('name', 'Custom Strategy'),
            markets=user_config.get('markets', ['kalshi']),
            categories=user_config.get('categories', []),
            min_edge=user_config.get('settings', {}).get('minEdge', 2.0),
            max_position=user_config.get('settings', {}).get('maxPosition', 100),
            kelly_fraction=user_config.get('settings', {}).get('kellyFraction', 0.25),
            min_liquidity=user_config.get('settings', {}).get('minLiquidity', 10000),
            stop_loss=user_config.get('settings', {}).get('stopLoss', 10),
            take_profit=user_config.get('settings', {}).get('takeProfit', 15),
            trailing_stop=user_config.get('advancedExitConditions', {}).get('trailing-stop', {}).get('value'),
            time_exit_hours=user_config.get('advancedExitConditions', {}).get('time-exit', {}).get('value'),
            advanced_exit_conditions=advanced_exit,
            conditional_rules=conditional_rules,
            custom_settings=custom_settings,
        )

        return cls(config, paper_trading=paper_trading)

    async def start(self):
        """Start the strategy executor"""
        if self.status == ExecutorStatus.RUNNING:
            logger.warning("Executor already running")
            return

        self.status = ExecutorStatus.RUNNING
        self.started_at = datetime.utcnow()
        self._running = True
        self.strategy.is_running = True

        logger.info(f"Starting executor for {self.config.name} ({self.config.strategy_type})")

        # Start the main loop
        self._task = asyncio.create_task(self._run_loop())

    async def stop(self):
        """Stop the strategy executor"""
        self._running = False
        self.status = ExecutorStatus.STOPPED
        self.stopped_at = datetime.utcnow()
        self.strategy.is_running = False

        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

        logger.info(f"Stopped executor for {self.config.name}")

    async def pause(self):
        """Pause the strategy (stop new trades, keep positions)"""
        self.status = ExecutorStatus.PAUSED
        self.strategy.is_running = False
        logger.info(f"Paused executor for {self.config.name}")

    async def resume(self):
        """Resume a paused strategy"""
        if self.status != ExecutorStatus.PAUSED:
            logger.warning("Cannot resume: executor not paused")
            return

        self.status = ExecutorStatus.RUNNING
        self.strategy.is_running = True
        logger.info(f"Resumed executor for {self.config.name}")

    async def _run_loop(self):
        """Main execution loop"""
        while self._running:
            try:
                if self.status == ExecutorStatus.PAUSED:
                    await asyncio.sleep(1)
                    continue

                # 1. Fetch market data
                market_data = await self._fetch_market_data()

                # 2. Update existing positions
                await self._update_positions(market_data)

                # 3. Check exit conditions for positions
                await self._check_exits(market_data)

                # 4. Generate new signals
                signals = self.strategy.analyze(market_data)

                # 5. Process signals
                for signal in signals:
                    await self._process_signal(signal, market_data)

                # 6. Sleep until next iteration
                await asyncio.sleep(self._get_loop_interval())

            except Exception as e:
                logger.error(f"Error in executor loop: {e}")
                self.status = ExecutorStatus.ERROR

                if self.on_error_callback:
                    self.on_error_callback(str(e))

                await asyncio.sleep(5)  # Wait before retry

    async def _fetch_market_data(self) -> Dict[str, Any]:
        """
        Fetch market data from configured platforms.

        Returns combined data from all platforms.
        """
        from ..market_data_service import (
            fetch_kalshi_markets,
            fetch_manifold_markets,
            find_arbitrage_opportunities,
        )

        market_data = {
            'markets': [],
            'kalshi_markets': [],
            'manifold_markets': [],
            'timestamp': datetime.utcnow().isoformat(),
        }

        # Fetch from configured markets
        for platform in self.config.markets:
            try:
                if platform.lower() == 'kalshi':
                    for category in self.config.categories or [None]:
                        markets = fetch_kalshi_markets(category=category)
                        for m in markets:
                            m['platform'] = 'kalshi'
                        market_data['kalshi_markets'].extend(markets)
                        market_data['markets'].extend(markets)

                elif platform.lower() == 'manifold':
                    for category in self.config.categories or [None]:
                        markets = fetch_manifold_markets(category=category)
                        for m in markets:
                            m['platform'] = 'manifold'
                        market_data['manifold_markets'].extend(markets)
                        market_data['markets'].extend(markets)

            except Exception as e:
                logger.error(f"Error fetching {platform} data: {e}")

        # Add arbitrage opportunities for arbitrage strategy
        if self.config.strategy_type == 'arbitrage':
            market_data['arb_opportunities'] = find_arbitrage_opportunities(
                min_edge=self.config.min_edge / 100
            )

        return market_data

    async def _update_positions(self, market_data: Dict[str, Any]):
        """Update prices for open positions"""
        markets_by_id = {m.get('id'): m for m in market_data.get('markets', [])}

        for position in self.strategy.positions.values():
            market = markets_by_id.get(position.market_id)
            if market:
                new_price = market.get('yes_price') or market.get('probability', position.current_price)
                position.update_price(new_price)

    async def _check_exits(self, market_data: Dict[str, Any]):
        """Check exit conditions for all positions"""
        positions_to_close = []

        for position_id, position in self.strategy.positions.items():
            # Get market-specific data
            position_market_data = {
                **market_data,
                'market_id': position.market_id,
            }

            should_exit, reason = self.strategy.should_exit(position, position_market_data)

            if should_exit:
                positions_to_close.append((position, reason))

        # Close positions
        for position, reason in positions_to_close:
            await self._close_position(position, reason)

    async def _process_signal(self, signal: Signal, market_data: Dict[str, Any]):
        """Process a trading signal"""
        # Notify callback
        if self.on_signal_callback:
            self.on_signal_callback(signal.to_dict())

        # Check if we should enter
        if not self.strategy.should_enter(signal, market_data):
            return

        # Calculate position size
        available_capital = self.config.max_position  # Simplified
        size = self.strategy.calculate_position_size(signal, available_capital)

        if size < 1:  # Minimum $1 position
            return

        # Execute trade
        await self._execute_entry(signal, size)

    async def _execute_entry(self, signal: Signal, size: float):
        """Execute an entry trade"""
        if self.paper_trading:
            # Paper trading - simulate fill
            await self._simulate_fill(signal, size)
        else:
            # Real trading - send to API
            await self._send_order(signal, size)

    async def _simulate_fill(self, signal: Signal, size: float):
        """Simulate a trade fill for paper trading"""
        # Open position in strategy
        position = self.strategy.open_position(signal, size)

        self.total_trades += 1

        # Notify callback
        if self.on_trade_callback:
            self.on_trade_callback({
                'type': 'entry',
                'position_id': position.id,
                'market_id': signal.market_id,
                'platform': signal.platform,
                'side': signal.side.value,
                'price': signal.price,
                'size': size,
                'reason': signal.reason,
                'paper_trade': True,
            })

        logger.info(f"Paper trade: {signal.side.value} {size}@{signal.price:.2%} on {signal.market_id}")

    async def _send_order(self, signal: Signal, size: float):
        """Send order to platform API"""
        # TODO: Implement real API integration
        # This would use the api_credentials to authenticate and send orders
        logger.warning("Real trading not implemented - falling back to paper trade")
        await self._simulate_fill(signal, size)

    async def _close_position(self, position: Position, reason: str):
        """Close a position"""
        # Record the trade
        trade_record = self.strategy.close_position(position, reason)

        # Update statistics
        if trade_record['pnl'] > 0:
            self.winning_trades += 1
        else:
            self.losing_trades += 1

        self.total_pnl += trade_record['pnl']

        # Notify callback
        if self.on_trade_callback:
            self.on_trade_callback({
                'type': 'exit',
                **trade_record,
                'paper_trade': self.paper_trading,
            })

        logger.info(f"Closed position: {reason}, PnL: ${trade_record['pnl']:.2f}")

    def _get_loop_interval(self) -> float:
        """Get sleep interval between iterations based on strategy type"""
        intervals = {
            'arbitrage': 5,  # Fast scanning for arb
            'momentum': 30,  # Medium frequency
            'mean-reversion': 60,  # Lower frequency
            'news-based': 10,  # Fast for news
            'market-making': 1,  # Very fast for MM
        }
        return intervals.get(self.config.strategy_type, 30)

    def get_status(self) -> Dict:
        """Get comprehensive executor status"""
        strategy_status = self.strategy.get_status()

        win_rate = 0
        if self.winning_trades + self.losing_trades > 0:
            win_rate = self.winning_trades / (self.winning_trades + self.losing_trades) * 100

        return {
            'executor_status': self.status.value,
            'paper_trading': self.paper_trading,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'stopped_at': self.stopped_at.isoformat() if self.stopped_at else None,
            'running_time': str(datetime.utcnow() - self.started_at) if self.started_at else None,
            'config': self.config.to_dict(),
            'total_pnl': self.total_pnl,
            'total_trades': self.total_trades,
            'winning_trades': self.winning_trades,
            'losing_trades': self.losing_trades,
            'win_rate': win_rate,
            'strategy': strategy_status,
        }

    def get_performance_summary(self) -> Dict:
        """Get performance summary"""
        trades = self.strategy.trade_history

        if not trades:
            return {
                'total_trades': 0,
                'total_pnl': 0,
                'avg_pnl': 0,
                'win_rate': 0,
                'best_trade': 0,
                'worst_trade': 0,
            }

        closed_trades = [t for t in trades if t['type'] == 'close']
        pnls = [t.get('pnl', 0) for t in closed_trades]

        return {
            'total_trades': len(closed_trades),
            'total_pnl': sum(pnls),
            'avg_pnl': sum(pnls) / len(pnls) if pnls else 0,
            'win_rate': len([p for p in pnls if p > 0]) / len(pnls) * 100 if pnls else 0,
            'best_trade': max(pnls) if pnls else 0,
            'worst_trade': min(pnls) if pnls else 0,
            'avg_winner': sum(p for p in pnls if p > 0) / len([p for p in pnls if p > 0]) if [p for p in pnls if p > 0] else 0,
            'avg_loser': sum(p for p in pnls if p < 0) / len([p for p in pnls if p < 0]) if [p for p in pnls if p < 0] else 0,
        }


# Factory function for easy creation
def create_executor(
    strategy_type: str,
    name: str,
    markets: List[str],
    categories: List[str],
    settings: Dict[str, Any],
    paper_trading: bool = True,
) -> StrategyExecutor:
    """
    Factory function to create a strategy executor.

    Args:
        strategy_type: One of arbitrage, momentum, mean-reversion, news-based, market-making
        name: Strategy name
        markets: List of platforms ['kalshi', 'manifold']
        categories: List of categories ['politics', 'crypto']
        settings: Strategy settings dict
        paper_trading: If True, simulate trades

    Returns:
        Configured StrategyExecutor
    """
    config = StrategyConfig(
        strategy_type=strategy_type,
        name=name,
        markets=markets,
        categories=categories,
        min_edge=settings.get('minEdge', 2.0),
        max_position=settings.get('maxPosition', 100),
        kelly_fraction=settings.get('kellyFraction', 0.25),
        min_liquidity=settings.get('minLiquidity', 10000),
        stop_loss=settings.get('stopLoss', 10),
        take_profit=settings.get('takeProfit', 15),
        trailing_stop=settings.get('trailingStop'),
        custom_settings=settings,
    )

    return StrategyExecutor(config, paper_trading=paper_trading)

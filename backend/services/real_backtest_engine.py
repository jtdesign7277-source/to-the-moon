"""
Real Backtest Engine for TO THE MOON
Runs backtests using REAL historical market data from Kalshi and Manifold.
Produces authentic statistics based on actual market resolutions.
"""
import math
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field

from .historical_data_collector import (
    HistoricalDataCollector,
    HistoricalMarket,
    collect_historical_data,
)


@dataclass
class RealTrade:
    """Represents a trade executed against real market data."""
    market_id: str
    market_title: str
    platform: str
    category: str
    entry_date: datetime
    exit_date: datetime
    entry_price: float
    exit_price: float
    position_size: float
    side: str  # 'YES' or 'NO'
    resolution: str  # Actual market resolution
    pnl: float = 0.0
    pnl_pct: float = 0.0
    is_win: bool = False

    def calculate_outcome(self):
        """Calculate trade outcome based on actual market resolution."""
        if self.side == 'YES':
            if self.resolution == 'YES':
                # Bought YES, resolved YES -> win (1.0 - entry_price)
                self.exit_price = 1.0
                self.pnl = (1.0 - self.entry_price) * self.position_size
            else:
                # Bought YES, resolved NO -> lose entry
                self.exit_price = 0.0
                self.pnl = -self.entry_price * self.position_size
        else:  # side == 'NO'
            if self.resolution == 'NO':
                # Bought NO, resolved NO -> win
                self.exit_price = 1.0
                self.pnl = (1.0 - (1 - self.entry_price)) * self.position_size
            else:
                # Bought NO, resolved YES -> lose
                self.exit_price = 0.0
                self.pnl = -(1 - self.entry_price) * self.position_size

        self.pnl_pct = self.pnl / self.position_size if self.position_size > 0 else 0
        self.is_win = self.pnl > 0
        return self


@dataclass
class RealBacktestResult:
    """Results from backtesting against real market data."""
    strategy_name: str
    markets_analyzed: int = 0
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    win_rate: float = 0.0
    profit_loss: float = 0.0
    avg_win: float = 0.0
    avg_loss: float = 0.0
    max_drawdown: float = 0.0
    sharpe_ratio: float = 0.0
    sortino_ratio: float = 0.0
    profit_factor: float = 0.0
    max_consecutive_wins: int = 0
    max_consecutive_losses: int = 0
    monthly_returns: List[Dict] = field(default_factory=list)
    equity_curve: List[Dict] = field(default_factory=list)
    trades: List[RealTrade] = field(default_factory=list)
    initial_capital: float = 10000.0
    final_capital: float = 10000.0
    markets_used: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict:
        return {
            'strategy_name': self.strategy_name,
            'markets_analyzed': self.markets_analyzed,
            'total_trades': self.total_trades,
            'winning_trades': self.winning_trades,
            'losing_trades': self.losing_trades,
            'win_rate': round(self.win_rate * 100, 1),
            'profit_loss': round(self.profit_loss, 2),
            'avg_win': round(self.avg_win, 2),
            'avg_loss': round(self.avg_loss, 2),
            'max_drawdown': round(self.max_drawdown * 100, 1),
            'sharpe_ratio': round(self.sharpe_ratio, 2),
            'sortino_ratio': round(self.sortino_ratio, 2),
            'profit_factor': round(self.profit_factor, 2),
            'max_consecutive_wins': self.max_consecutive_wins,
            'max_consecutive_losses': self.max_consecutive_losses,
            'monthly_returns': self.monthly_returns,
            'equity_curve': self.equity_curve[-100:],
            'initial_capital': self.initial_capital,
            'final_capital': round(self.final_capital, 2),
            'total_return_pct': round((self.final_capital - self.initial_capital) / self.initial_capital * 100, 2),
            'markets_used': self.markets_used[:20],  # First 20 market titles
        }

    def to_frontend_format(self) -> Dict:
        """Convert to format expected by prebuiltStrategies.js"""
        return {
            'totalTrades': self.total_trades,
            'winRate': round(self.win_rate * 100),
            'profitLoss': round(self.profit_loss),
            'avgWin': round(self.avg_win),
            'avgLoss': round(self.avg_loss),
            'maxDrawdown': round(-self.max_drawdown * 100),
            'sharpeRatio': round(self.sharpe_ratio, 1),
            'sortinoRatio': round(self.sortino_ratio, 1),
        }


# Strategy configurations defining how each strategy trades
STRATEGY_CONFIGS = {
    'Conservative Arb Bot': {
        'min_edge': 0.03,  # 3% minimum price discrepancy
        'position_pct': 0.05,  # 5% of capital per trade
        'categories': ['politics', 'economics'],
        'platforms': ['kalshi', 'manifold'],
        'entry_logic': 'arbitrage',  # Buy when price < fair value
        'max_trades_per_week': 6,
    },
    'Sports High Volume': {
        'min_edge': 0.02,
        'position_pct': 0.08,
        'categories': ['sports'],
        'platforms': ['kalshi'],
        'entry_logic': 'volume_momentum',
        'max_trades_per_week': 20,
    },
    'Crypto Volatility Play': {
        'min_edge': 0.015,
        'position_pct': 0.10,
        'categories': ['crypto'],
        'platforms': ['kalshi', 'manifold'],
        'entry_logic': 'momentum',
        'max_trades_per_week': 15,
    },
    'Political Momentum': {
        'min_edge': 0.015,
        'position_pct': 0.07,
        'categories': ['politics'],
        'platforms': ['kalshi', 'manifold'],
        'entry_logic': 'momentum',
        'max_trades_per_week': 10,
    },
    'Multi-Platform Arb Pro': {
        'min_edge': 0.008,
        'position_pct': 0.06,
        'categories': ['politics', 'economics', 'sports', 'crypto'],
        'platforms': ['kalshi', 'manifold'],
        'entry_logic': 'arbitrage',
        'max_trades_per_week': 30,
    },
    'Fed News Scalper': {
        'min_edge': 0.02,
        'position_pct': 0.06,
        'categories': ['economics'],
        'platforms': ['kalshi'],
        'entry_logic': 'news_reaction',
        'max_trades_per_week': 4,
    },
    'First Trade Simplified': {
        'min_edge': 0.05,  # Very conservative - 5% edge required
        'position_pct': 0.03,
        'categories': ['politics'],
        'platforms': ['kalshi', 'manifold'],
        'entry_logic': 'high_confidence',
        'max_trades_per_week': 2,
    },
    'Election Cycle Trader': {
        'min_edge': 0.025,
        'position_pct': 0.09,
        'categories': ['politics'],
        'platforms': ['kalshi', 'manifold'],
        'entry_logic': 'event_driven',
        'max_trades_per_week': 8,
    },
    'Market Maker Lite': {
        'min_edge': 0.005,
        'position_pct': 0.04,
        'categories': ['politics', 'economics'],
        'platforms': ['kalshi', 'manifold'],
        'entry_logic': 'spread_capture',
        'max_trades_per_week': 40,
    },
}


class RealBacktestEngine:
    """
    Backtests strategies against REAL historical market data.
    Uses actual market resolutions to determine trade outcomes.
    """

    def __init__(
        self,
        initial_capital: float = 10000.0,
        days: int = 180
    ):
        self.initial_capital = initial_capital
        self.days = days
        self.collector = HistoricalDataCollector()
        self._historical_data = None

    def _load_historical_data(self) -> Dict[str, List[HistoricalMarket]]:
        """Load or fetch historical market data."""
        if self._historical_data is None:
            print(f"Loading historical data for last {self.days} days...")
            self._historical_data = self.collector.fetch_all_historical_data(self.days)
            print(f"Loaded {len(self._historical_data['all'])} total markets")
        return self._historical_data

    def run_backtest(self, strategy_name: str) -> RealBacktestResult:
        """
        Run backtest for a specific strategy against real market data.

        The strategy is applied to historical markets and outcomes are
        determined by actual market resolutions.
        """
        config = STRATEGY_CONFIGS.get(strategy_name)
        if not config:
            print(f"Unknown strategy: {strategy_name}")
            return RealBacktestResult(strategy_name=strategy_name)

        data = self._load_historical_data()

        # Filter markets by strategy preferences
        eligible_markets = self._filter_markets(
            data['all'],
            config['categories'],
            config['platforms']
        )

        print(f"Running backtest for {strategy_name} on {len(eligible_markets)} markets...")

        result = RealBacktestResult(
            strategy_name=strategy_name,
            initial_capital=self.initial_capital,
            markets_analyzed=len(eligible_markets)
        )

        trades = self._execute_strategy(eligible_markets, config)
        result.trades = trades
        result.markets_used = [t.market_title for t in trades[:20]]

        # Calculate statistics
        self._calculate_statistics(result)

        return result

    def _filter_markets(
        self,
        markets: List[HistoricalMarket],
        categories: List[str],
        platforms: List[str]
    ) -> List[HistoricalMarket]:
        """Filter markets by strategy criteria."""
        filtered = []
        for market in markets:
            if market.category.lower() not in [c.lower() for c in categories]:
                continue
            if market.platform.lower() not in [p.lower() for p in platforms]:
                continue
            if market.resolution not in ['YES', 'NO']:
                continue
            if not market.price_history:
                continue
            filtered.append(market)

        # Sort by close date
        return sorted(filtered, key=lambda m: m.closed_at)

    def _execute_strategy(
        self,
        markets: List[HistoricalMarket],
        config: Dict
    ) -> List[RealTrade]:
        """
        Execute strategy logic against historical markets.

        Different entry logics:
        - arbitrage: Enter when price significantly deviates from implied fair value
        - momentum: Enter in direction of recent price movement
        - high_confidence: Only enter when probability is very high or very low
        - spread_capture: Enter both sides when spread is profitable
        """
        trades = []
        capital = self.initial_capital
        weekly_trade_count = {}

        entry_logic = config['entry_logic']
        min_edge = config['min_edge']
        position_pct = config['position_pct']
        max_weekly = config['max_trades_per_week']

        for market in markets:
            # Get week key to track trade limits
            week_key = market.closed_at.strftime('%Y-W%W')
            if weekly_trade_count.get(week_key, 0) >= max_weekly:
                continue

            # Determine entry using strategy logic
            should_trade, side, entry_price = self._evaluate_entry(
                market, entry_logic, min_edge
            )

            if not should_trade:
                continue

            # Calculate position size
            position_size = capital * position_pct

            # Create and execute trade
            trade = RealTrade(
                market_id=market.id,
                market_title=market.title,
                platform=market.platform,
                category=market.category,
                entry_date=market.created_at,
                exit_date=market.closed_at,
                entry_price=entry_price,
                exit_price=0.0,  # Set by calculate_outcome
                position_size=position_size,
                side=side,
                resolution=market.resolution,
            )

            trade.calculate_outcome()
            trades.append(trade)

            # Update capital
            capital += trade.pnl
            capital = max(capital, self.initial_capital * 0.1)  # Prevent total loss

            weekly_trade_count[week_key] = weekly_trade_count.get(week_key, 0) + 1

        return trades

    def _evaluate_entry(
        self,
        market: HistoricalMarket,
        entry_logic: str,
        min_edge: float
    ) -> Tuple[bool, str, float]:
        """
        Evaluate whether to enter a trade based on strategy logic.

        IMPORTANT: This simulates realistic trading WITHOUT hindsight.
        Decisions are made based on entry-time information only.

        Returns: (should_trade, side, entry_price)
        """
        import random

        if not market.price_history:
            return False, '', 0.0

        # Get entry point (early in market's life) - NO HINDSIGHT
        early_prices = market.price_history[:len(market.price_history)//3]
        if not early_prices:
            return False, '', 0.0

        entry_price = sum(p['price'] for p in early_prices) / len(early_prices)

        # Simulate real trading: we DON'T know the resolution at entry time
        # Instead, we make decisions based on price signals and market characteristics

        if entry_logic == 'arbitrage':
            # Look for mispriced markets based on entry price deviation from 0.5
            deviation = abs(entry_price - 0.5)
            if deviation < min_edge:
                return False, '', 0.0

            # Trade toward the direction the price suggests (without knowing outcome)
            if entry_price < 0.5 - min_edge:
                # Price suggests NO is likely, but sometimes we're wrong
                side = 'NO'
            elif entry_price > 0.5 + min_edge:
                side = 'YES'
            else:
                return False, '', 0.0

            return True, side, entry_price

        elif entry_logic == 'momentum':
            # Look at price trend in first third of market
            if len(early_prices) < 3:
                return False, '', 0.0

            first_price = early_prices[0]['price']
            last_early_price = early_prices[-1]['price']
            trend = last_early_price - first_price

            if abs(trend) < min_edge:
                return False, '', 0.0

            # Follow the momentum (without knowing if it continues)
            if trend > 0:
                return True, 'YES', entry_price
            else:
                return True, 'NO', entry_price

        elif entry_logic == 'high_confidence':
            # Only trade when price strongly favors one side
            if entry_price < 0.15:
                return True, 'NO', entry_price
            elif entry_price > 0.85:
                return True, 'YES', entry_price
            return False, '', 0.0

        elif entry_logic == 'volume_momentum':
            # High volume markets with directional price
            if market.volume < 50000:
                return False, '', 0.0

            if entry_price < 0.4:
                return True, 'NO', entry_price
            elif entry_price > 0.6:
                return True, 'YES', entry_price
            return False, '', 0.0

        elif entry_logic == 'news_reaction':
            # Trade economics markets with price signals
            if market.category.lower() != 'economics':
                return False, '', 0.0

            # Trade based on entry price deviation from 0.5
            if entry_price < 0.35:
                return True, 'NO', entry_price
            elif entry_price > 0.65:
                return True, 'YES', entry_price
            return False, '', 0.0

        elif entry_logic == 'event_driven':
            # Trade political/event markets based on price signal
            title_lower = market.title.lower()
            if not any(kw in title_lower for kw in ['election', 'win', 'president', 'vote']):
                return False, '', 0.0

            if entry_price < 0.4:
                return True, 'NO', entry_price
            elif entry_price > 0.6:
                return True, 'YES', entry_price
            return False, '', 0.0

        elif entry_logic == 'spread_capture':
            # Market making - trade both sides where there's edge
            if entry_price < 0.3 or entry_price > 0.7:
                return False, '', 0.0

            # Randomly pick a side (simulating bid/ask filling)
            side = random.choice(['YES', 'NO'])
            return True, side, entry_price

        return False, '', 0.0

    def _calculate_statistics(self, result: RealBacktestResult):
        """Calculate all backtest statistics from trades."""
        trades = result.trades
        if not trades:
            return

        result.total_trades = len(trades)
        result.winning_trades = sum(1 for t in trades if t.is_win)
        result.losing_trades = result.total_trades - result.winning_trades
        result.win_rate = result.winning_trades / result.total_trades if result.total_trades > 0 else 0

        # P&L calculations
        winning_pnls = [t.pnl for t in trades if t.is_win]
        losing_pnls = [t.pnl for t in trades if not t.is_win]

        total_pnl = sum(t.pnl for t in trades)
        result.profit_loss = total_pnl
        result.final_capital = result.initial_capital + total_pnl

        result.avg_win = sum(winning_pnls) / len(winning_pnls) if winning_pnls else 0
        result.avg_loss = sum(losing_pnls) / len(losing_pnls) if losing_pnls else 0

        # Profit factor
        gross_profit = sum(winning_pnls) if winning_pnls else 0
        gross_loss = abs(sum(losing_pnls)) if losing_pnls else 0
        result.profit_factor = gross_profit / gross_loss if gross_loss > 0 else float('inf')

        # Max drawdown
        peak = result.initial_capital
        max_dd = 0.0
        capital = result.initial_capital

        for trade in trades:
            capital += trade.pnl
            if capital > peak:
                peak = capital
            dd = (peak - capital) / peak if peak > 0 else 0
            max_dd = max(max_dd, dd)

        result.max_drawdown = max_dd

        # Consecutive wins/losses
        max_win_streak = 0
        max_loss_streak = 0
        current_streak = 0
        is_win_streak = True

        for trade in trades:
            if trade.is_win:
                if is_win_streak:
                    current_streak += 1
                else:
                    max_loss_streak = max(max_loss_streak, current_streak)
                    current_streak = 1
                    is_win_streak = True
                max_win_streak = max(max_win_streak, current_streak)
            else:
                if not is_win_streak:
                    current_streak += 1
                else:
                    max_win_streak = max(max_win_streak, current_streak)
                    current_streak = 1
                    is_win_streak = False
                max_loss_streak = max(max_loss_streak, current_streak)

        result.max_consecutive_wins = max_win_streak
        result.max_consecutive_losses = max_loss_streak

        # Calculate returns for Sharpe/Sortino
        if len(trades) > 1:
            returns = [t.pnl / result.initial_capital for t in trades]
            avg_return = sum(returns) / len(returns)
            variance = sum((r - avg_return) ** 2 for r in returns) / len(returns)
            std_return = math.sqrt(variance) if variance > 0 else 0

            # Annualized Sharpe (assuming ~250 trading days)
            trades_per_year = len(trades) * (365 / self.days)
            if std_return > 0:
                result.sharpe_ratio = (avg_return * trades_per_year) / (std_return * math.sqrt(trades_per_year))
            else:
                result.sharpe_ratio = 0

            # Sortino (downside deviation only)
            negative_returns = [r for r in returns if r < 0]
            if negative_returns:
                downside_var = sum(r ** 2 for r in negative_returns) / len(negative_returns)
                downside_std = math.sqrt(downside_var)
                if downside_std > 0:
                    result.sortino_ratio = (avg_return * trades_per_year) / (downside_std * math.sqrt(trades_per_year))
                else:
                    result.sortino_ratio = result.sharpe_ratio * 1.3
            else:
                result.sortino_ratio = result.sharpe_ratio * 1.3

        # Monthly returns
        monthly_pnl = {}
        for trade in trades:
            month = trade.exit_date.strftime('%b')
            monthly_pnl[month] = monthly_pnl.get(month, 0) + trade.pnl

        month_order = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan']
        result.monthly_returns = [
            {'month': m, 'pnl': round(monthly_pnl.get(m, 0))}
            for m in month_order if m in monthly_pnl
        ]

        # Equity curve
        equity = result.initial_capital
        result.equity_curve = [{'date': trades[0].entry_date.strftime('%Y-%m-%d'), 'equity': equity}]

        for i, trade in enumerate(trades):
            equity += trade.pnl
            if i % max(1, len(trades) // 50) == 0:  # Sample points
                result.equity_curve.append({
                    'date': trade.exit_date.strftime('%Y-%m-%d'),
                    'equity': round(equity, 2)
                })


def run_all_real_backtests(
    initial_capital: float = 10000.0,
    days: int = 180
) -> Dict[str, RealBacktestResult]:
    """Run backtests for all strategies against real data."""
    engine = RealBacktestEngine(initial_capital=initial_capital, days=days)
    results = {}

    for strategy_name in STRATEGY_CONFIGS.keys():
        result = engine.run_backtest(strategy_name)
        results[strategy_name] = result
        print(f"  {strategy_name}: {result.total_trades} trades, "
              f"{result.win_rate*100:.1f}% win rate, ${result.profit_loss:.0f} P&L")

    return results


def generate_frontend_stats() -> Dict[str, Dict]:
    """Generate stats in format for prebuiltStrategies.js"""
    results = run_all_real_backtests()

    frontend_stats = {}
    for name, result in results.items():
        frontend_stats[name] = result.to_frontend_format()

    return frontend_stats


def export_backtest_results(filepath: str = None):
    """Export all backtest results to JSON file."""
    if filepath is None:
        filepath = os.path.join(
            os.path.dirname(__file__), '..', 'data',
            'real_backtest_results.json'
        )

    results = run_all_real_backtests()

    export_data = {
        'generated_at': datetime.utcnow().isoformat(),
        'days_analyzed': 180,
        'results': {name: result.to_dict() for name, result in results.items()},
        'frontend_stats': {name: result.to_frontend_format() for name, result in results.items()},
    }

    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    with open(filepath, 'w') as f:
        json.dump(export_data, f, indent=2)

    print(f"\nExported results to {filepath}")
    return export_data


if __name__ == '__main__':
    print("=" * 60)
    print("Running REAL Backtests with Historical Market Data")
    print("=" * 60)

    results = export_backtest_results()

    print("\n" + "=" * 60)
    print("Frontend Stats for prebuiltStrategies.js:")
    print("=" * 60)

    for name, stats in results['frontend_stats'].items():
        print(f"\n'{name}': {{")
        for key, value in stats.items():
            print(f"  {key}: {value},")
        print("},")

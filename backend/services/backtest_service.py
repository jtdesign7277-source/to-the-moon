"""
Backtesting service for TO THE MOON.
Simulates strategy performance on historical data.
"""
import random
from datetime import datetime, timedelta
from typing import Optional


class BacktestService:
    """Service for running strategy backtests."""

    @staticmethod
    def run_backtest(
        strategy_config: dict,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        initial_capital: float = 10000.0,
    ) -> dict:
        """
        Run a backtest simulation for a strategy.

        In production, this would use real historical data.
        For now, we simulate results based on strategy parameters.
        """
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=180)
        if not end_date:
            end_date = datetime.utcnow()

        # Extract strategy parameters
        strategy_type = strategy_config.get('type', 'momentum')
        risk_level = strategy_config.get('risk_level', 'medium')  # low, medium, high
        category = strategy_config.get('category', 'crypto')

        # Base parameters based on risk level
        risk_params = {
            'low': {'win_rate': 0.72, 'avg_win': 0.015, 'avg_loss': 0.008, 'trade_freq': 3},
            'medium': {'win_rate': 0.65, 'avg_win': 0.035, 'avg_loss': 0.018, 'trade_freq': 5},
            'high': {'win_rate': 0.55, 'avg_win': 0.08, 'avg_loss': 0.04, 'trade_freq': 8},
        }

        params = risk_params.get(risk_level, risk_params['medium'])

        # Simulate trades
        days = (end_date - start_date).days
        total_trades = int(days / 7 * params['trade_freq'])  # trades per week

        trades = []
        capital = initial_capital
        winning_trades = 0

        for i in range(total_trades):
            trade_date = start_date + timedelta(days=random.randint(0, days))

            # Determine if trade wins
            is_win = random.random() < params['win_rate']

            if is_win:
                pnl_pct = random.uniform(params['avg_win'] * 0.5, params['avg_win'] * 1.5)
                winning_trades += 1
            else:
                pnl_pct = -random.uniform(params['avg_loss'] * 0.5, params['avg_loss'] * 1.5)

            pnl = capital * pnl_pct
            capital += pnl

            trades.append({
                'date': trade_date.isoformat(),
                'pnl': round(pnl, 2),
                'pnl_pct': round(pnl_pct * 100, 2),
                'capital_after': round(capital, 2),
                'is_win': is_win,
            })

        # Sort trades by date
        trades.sort(key=lambda x: x['date'])

        # Calculate metrics
        total_pnl = capital - initial_capital
        total_return_pct = (total_pnl / initial_capital) * 100
        win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0

        # Calculate max drawdown
        peak = initial_capital
        max_drawdown = 0
        for trade in trades:
            if trade['capital_after'] > peak:
                peak = trade['capital_after']
            drawdown = (peak - trade['capital_after']) / peak * 100
            max_drawdown = max(max_drawdown, drawdown)

        # Generate monthly returns
        monthly_returns = BacktestService._calculate_monthly_returns(
            trades, start_date, end_date, initial_capital
        )

        return {
            'success': True,
            'summary': {
                'initial_capital': initial_capital,
                'final_capital': round(capital, 2),
                'total_pnl': round(total_pnl, 2),
                'total_return_pct': round(total_return_pct, 2),
                'total_trades': total_trades,
                'winning_trades': winning_trades,
                'losing_trades': total_trades - winning_trades,
                'win_rate': round(win_rate, 2),
                'max_drawdown_pct': round(max_drawdown, 2),
                'avg_trade_pnl': round(total_pnl / total_trades, 2) if total_trades > 0 else 0,
            },
            'monthly_returns': monthly_returns,
            'trades': trades[-50:],  # Return last 50 trades
            'equity_curve': BacktestService._generate_equity_curve(trades, initial_capital),
        }

    @staticmethod
    def _calculate_monthly_returns(
        trades: list,
        start_date: datetime,
        end_date: datetime,
        initial_capital: float,
    ) -> list:
        """Calculate monthly return percentages."""
        monthly = {}
        capital = initial_capital

        for trade in trades:
            trade_date = datetime.fromisoformat(trade['date'])
            month_key = trade_date.strftime('%Y-%m')

            if month_key not in monthly:
                monthly[month_key] = {
                    'month': month_key,
                    'start_capital': capital,
                    'pnl': 0,
                    'trades': 0,
                }

            monthly[month_key]['pnl'] += trade['pnl']
            monthly[month_key]['trades'] += 1
            capital += trade['pnl']

        # Calculate return percentages
        result = []
        for month_key in sorted(monthly.keys()):
            m = monthly[month_key]
            return_pct = (m['pnl'] / m['start_capital']) * 100 if m['start_capital'] > 0 else 0
            result.append({
                'month': m['month'],
                'pnl': round(m['pnl'], 2),
                'return_pct': round(return_pct, 2),
                'trades': m['trades'],
            })

        return result

    @staticmethod
    def _generate_equity_curve(trades: list, initial_capital: float) -> list:
        """Generate equity curve data points."""
        curve = [{'date': trades[0]['date'] if trades else None, 'equity': initial_capital}]

        for trade in trades:
            curve.append({
                'date': trade['date'],
                'equity': trade['capital_after'],
            })

        # Sample every N points to reduce data size
        if len(curve) > 100:
            step = len(curve) // 100
            curve = curve[::step] + [curve[-1]]

        return curve

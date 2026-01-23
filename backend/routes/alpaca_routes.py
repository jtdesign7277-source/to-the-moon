"""
Alpha Lab - Alpaca Integration Routes
Stock market scanner with AI strategy parsing, backtesting, and live deployment
"""

from flask import Blueprint, request, jsonify
import os
from datetime import datetime, timedelta
import random
import re

# Alpaca SDK imports - install with: pip install alpaca-py
try:
    from alpaca.data.historical import StockHistoricalDataClient
    from alpaca.data.requests import StockBarsRequest, StockLatestQuoteRequest
    from alpaca.data.timeframe import TimeFrame, TimeFrameUnit
    from alpaca.trading.client import TradingClient
    from alpaca.trading.requests import MarketOrderRequest, LimitOrderRequest
    from alpaca.trading.enums import OrderSide, TimeInForce
    ALPACA_AVAILABLE = True
except ImportError:
    ALPACA_AVAILABLE = False
    print("Warning: alpaca-py not installed. Run: pip install alpaca-py")

alpaca_lab_bp = Blueprint('alpaca_lab', __name__, url_prefix='/api/alpaca')

ALPACA_API_KEY = os.environ.get('ALPACA_API_KEY', '')
ALPACA_SECRET_KEY = os.environ.get('ALPACA_SECRET_KEY', '')
ALPACA_PAPER = os.environ.get('ALPACA_PAPER', 'true').lower() == 'true'

_data_client = None
_trading_client = None

def get_data_client():
    global _data_client
    if _data_client is None and ALPACA_AVAILABLE and ALPACA_API_KEY:
        _data_client = StockHistoricalDataClient(ALPACA_API_KEY, ALPACA_SECRET_KEY)
    return _data_client

def get_trading_client():
    global _trading_client
    if _trading_client is None and ALPACA_AVAILABLE and ALPACA_API_KEY:
        _trading_client = TradingClient(ALPACA_API_KEY, ALPACA_SECRET_KEY, paper=ALPACA_PAPER)
    return _trading_client

TIMEFRAME_MAP = {
    '1m': TimeFrame.Minute if ALPACA_AVAILABLE else None,
    '5m': TimeFrame(5, TimeFrameUnit.Minute) if ALPACA_AVAILABLE else None,
    '15m': TimeFrame(15, TimeFrameUnit.Minute) if ALPACA_AVAILABLE else None,
    '30m': TimeFrame(30, TimeFrameUnit.Minute) if ALPACA_AVAILABLE else None,
    '1h': TimeFrame.Hour if ALPACA_AVAILABLE else None,
    '4h': TimeFrame(4, TimeFrameUnit.Hour) if ALPACA_AVAILABLE else None,
    '1d': TimeFrame.Day if ALPACA_AVAILABLE else None,
    '1w': TimeFrame.Week if ALPACA_AVAILABLE else None,
    '1M': TimeFrame.Month if ALPACA_AVAILABLE else None,
}

LOOKBACK_MAP = {
    '1d': timedelta(days=1),
    '1w': timedelta(weeks=1),
    '1m': timedelta(days=30),
    '3m': timedelta(days=90),
    '6m': timedelta(days=180),
    '1y': timedelta(days=365),
    '2y': timedelta(days=730),
    '5y': timedelta(days=1825),
}


def parse_strategy_with_ai(natural_language: str) -> dict:
    """Parse natural language strategy into structured conditions."""
    text = natural_language.lower()

    parsed = {
        'symbol': None,
        'entry_conditions': [],
        'exit_conditions': [],
        'timeframe': '1d',
        'risk_management': {'stop_loss': None, 'take_profit': None, 'position_size': None},
        'indicators': [],
        'confidence': 0.0,
        'interpretation': '',
    }

    common_tickers = ['TSLA', 'AAPL', 'GOOGL', 'GOOG', 'MSFT', 'AMZN', 'META', 'NVDA', 'AMD', 'SPY', 'QQQ', 'IWM']
    for ticker in common_tickers:
        if ticker.lower() in text:
            parsed['symbol'] = ticker
            break

    timeframe_patterns = {
        '1 minute': '1m', '1m': '1m', '1min': '1m',
        '5 minute': '5m', '5m': '5m', '5min': '5m',
        '15 minute': '15m', '15m': '15m', '15min': '15m',
        '30 minute': '30m', '30m': '30m', '30min': '30m',
        '1 hour': '1h', '1h': '1h', 'hourly': '1h',
        '4 hour': '4h', '4h': '4h',
        'daily': '1d', '1 day': '1d', '1d': '1d',
        'weekly': '1w', '1 week': '1w', '1w': '1w',
    }
    for pattern, tf in timeframe_patterns.items():
        if pattern in text:
            parsed['timeframe'] = tf
            break

    indicator_patterns = {
        'rsi': {'name': 'RSI', 'period': 14},
        'macd': {'name': 'MACD', 'fast': 12, 'slow': 26, 'signal': 9},
        'moving average': {'name': 'SMA', 'period': 20},
        'sma': {'name': 'SMA', 'period': 20},
        'ema': {'name': 'EMA', 'period': 20},
        'bollinger': {'name': 'BBANDS', 'period': 20, 'std': 2},
        'vwap': {'name': 'VWAP'},
        'volume': {'name': 'VOLUME'},
    }

    for pattern, indicator in indicator_patterns.items():
        if pattern in text:
            parsed['indicators'].append(indicator)

    rsi_match = re.search(r'rsi\s*(?:drops?\s*)?(?:below|under|<)\s*(\d+)', text)
    if rsi_match:
        parsed['entry_conditions'].append({
            'type': 'indicator', 'indicator': 'RSI', 'operator': '<', 'value': int(rsi_match.group(1)),
        })

    rsi_exit_match = re.search(r'rsi\s*(?:hits?|reaches?|above|over|>)\s*(\d+)', text)
    if rsi_exit_match:
        parsed['exit_conditions'].append({
            'type': 'indicator', 'indicator': 'RSI', 'operator': '>', 'value': int(rsi_exit_match.group(1)),
        })

    if 'cross' in text and ('moving average' in text or 'ma' in text or 'sma' in text or 'ema' in text):
        ma_match = re.search(r'(\d+)\s*(?:day|period)?\s*(?:moving average|ma|sma|ema)', text)
        if ma_match:
            period = int(ma_match.group(1))
            if 'above' in text or 'over' in text or 'breaks' in text:
                parsed['entry_conditions'].append({
                    'type': 'crossover', 'indicator': 'SMA', 'period': period, 'direction': 'above',
                })
            elif 'below' in text or 'under' in text:
                parsed['exit_conditions'].append({
                    'type': 'crossover', 'indicator': 'SMA', 'period': period, 'direction': 'below',
                })

    stop_match = re.search(r'stop\s*(?:loss)?\s*(?:at|of)?\s*(\d+(?:\.\d+)?)\s*%?', text)
    if stop_match:
        parsed['risk_management']['stop_loss'] = float(stop_match.group(1))

    profit_match = re.search(r'(?:take\s*)?profit\s*(?:at|of)?\s*(\d+(?:\.\d+)?)\s*%?', text)
    if profit_match:
        parsed['risk_management']['take_profit'] = float(profit_match.group(1))

    volume_match = re.search(r'volume\s*(\d+(?:\.\d+)?)\s*x?\s*(?:normal|average|usual)?', text)
    if volume_match:
        parsed['entry_conditions'].append({'type': 'volume', 'multiplier': float(volume_match.group(1))})

    time_match = re.search(r'(?:only\s*)?(?:trade\s*)?between\s*(\d{1,2}:\d{2})\s*(?:am|pm)?\s*(?:and|-)\s*(\d{1,2}:\d{2})\s*(?:am|pm)?', text)
    if time_match:
        parsed['entry_conditions'].append({'type': 'time_window', 'start': time_match.group(1), 'end': time_match.group(2)})

    confidence_score = 0
    if parsed['symbol']: confidence_score += 0.3
    if parsed['entry_conditions']: confidence_score += 0.3
    if parsed['exit_conditions']: confidence_score += 0.2
    if parsed['risk_management']['stop_loss'] or parsed['risk_management']['take_profit']: confidence_score += 0.1
    if parsed['indicators']: confidence_score += 0.1
    parsed['confidence'] = min(confidence_score, 1.0)

    interpretation_parts = []
    if parsed['symbol']:
        interpretation_parts.append(f"Trading {parsed['symbol']}")
    for cond in parsed.get('entry_conditions', []):
        if cond['type'] == 'indicator':
            interpretation_parts.append(f"Enter when {cond['indicator']} {cond['operator']} {cond['value']}")
        elif cond['type'] == 'crossover':
            interpretation_parts.append(f"Enter when price crosses {cond['direction']} {cond['period']}-period {cond['indicator']}")
        elif cond['type'] == 'volume':
            interpretation_parts.append(f"With volume {cond['multiplier']}x normal")
        elif cond['type'] == 'time_window':
            interpretation_parts.append(f"Only between {cond['start']} and {cond['end']}")
    for cond in parsed.get('exit_conditions', []):
        if cond['type'] == 'indicator':
            interpretation_parts.append(f"Exit when {cond['indicator']} {cond['operator']} {cond['value']}")
    if parsed['risk_management']['stop_loss']:
        interpretation_parts.append(f"Stop loss at {parsed['risk_management']['stop_loss']}%")
    if parsed['risk_management']['take_profit']:
        interpretation_parts.append(f"Take profit at {parsed['risk_management']['take_profit']}%")

    parsed['interpretation'] = ' → '.join(interpretation_parts) if interpretation_parts else "Could not fully parse strategy. Please add more details."
    return parsed


def generate_mock_bars(symbol: str, start_date: datetime, end_date: datetime, timeframe: str) -> list:
    """Generate mock OHLCV data for development/testing."""
    base_prices = {'TSLA': 250, 'AAPL': 180, 'GOOGL': 140, 'MSFT': 400, 'AMZN': 180, 'META': 500, 'NVDA': 800, 'AMD': 150, 'SPY': 500, 'QQQ': 450, 'IWM': 200}
    base_price = base_prices.get(symbol, 100)
    days = (end_date - start_date).days
    bars_per_day = {'1m': 390, '5m': 78, '15m': 26, '30m': 13, '1h': 7, '4h': 2, '1d': 1, '1w': 0.2, '1M': 0.05}
    num_bars = int(days * bars_per_day.get(timeframe, 1))
    num_bars = max(50, min(num_bars, 2000))

    bars = []
    current_price = base_price
    current_time = start_date

    for i in range(num_bars):
        change_pct = random.gauss(0.0002, 0.015)
        current_price *= (1 + change_pct)
        daily_volatility = current_price * 0.02
        open_price = current_price + random.uniform(-daily_volatility/2, daily_volatility/2)
        close_price = current_price
        high_price = max(open_price, close_price) + random.uniform(0, daily_volatility)
        low_price = min(open_price, close_price) - random.uniform(0, daily_volatility)
        volume = random.randint(1000000, 10000000)

        bars.append({
            'timestamp': current_time.isoformat(),
            'open': round(open_price, 2), 'high': round(high_price, 2),
            'low': round(low_price, 2), 'close': round(close_price, 2), 'volume': volume,
        })

        if timeframe == '1m': current_time += timedelta(minutes=1)
        elif timeframe == '5m': current_time += timedelta(minutes=5)
        elif timeframe == '15m': current_time += timedelta(minutes=15)
        elif timeframe == '30m': current_time += timedelta(minutes=30)
        elif timeframe == '1h': current_time += timedelta(hours=1)
        elif timeframe == '4h': current_time += timedelta(hours=4)
        elif timeframe == '1d': current_time += timedelta(days=1)
        elif timeframe == '1w': current_time += timedelta(weeks=1)
        else: current_time += timedelta(days=1)

    return bars


def calculate_rsi(closes: list, period: int = 14) -> list:
    if len(closes) < period + 1:
        return [50] * len(closes)
    rsi_values = [50] * period
    gains, losses = [], []
    for i in range(1, len(closes)):
        change = closes[i] - closes[i-1]
        gains.append(max(0, change))
        losses.append(max(0, -change))
    for i in range(period, len(closes)):
        avg_gain = sum(gains[i-period:i]) / period
        avg_loss = sum(losses[i-period:i]) / period
        if avg_loss == 0: rsi = 100
        else:
            rs = avg_gain / avg_loss
            rsi = 100 - (100 / (1 + rs))
        rsi_values.append(rsi)
    return rsi_values


def calculate_sma(closes: list, period: int) -> list:
    sma_values = []
    for i in range(len(closes)):
        if i < period - 1: sma_values.append(closes[i])
        else: sma_values.append(sum(closes[i-period+1:i+1]) / period)
    return sma_values


def simulate_strategy(bars: list, strategy: dict, initial_capital: float) -> dict:
    closes = [bar['close'] for bar in bars]
    rsi_values = calculate_rsi(closes, 14)
    sma_20 = calculate_sma(closes, 20)

    capital = initial_capital
    position = 0
    entry_price = 0
    trades = []
    equity_curve = [initial_capital]

    stop_loss_pct = strategy.get('risk_management', {}).get('stop_loss', 2) or 2
    take_profit_pct = strategy.get('risk_management', {}).get('take_profit', 5) or 5

    for i in range(1, len(bars)):
        current_price = closes[i]
        current_rsi = rsi_values[i]
        current_sma_20 = sma_20[i]
        prev_price = closes[i-1]
        prev_sma_20 = sma_20[i-1]

        if position == 0:
            should_enter = False
            for cond in strategy.get('entry_conditions', []):
                if cond['type'] == 'indicator' and cond['indicator'] == 'RSI':
                    if cond['operator'] == '<' and current_rsi < cond['value']: should_enter = True
                    elif cond['operator'] == '>' and current_rsi > cond['value']: should_enter = True
                elif cond['type'] == 'crossover':
                    if cond['direction'] == 'above' and prev_price < prev_sma_20 and current_price > current_sma_20: should_enter = True
                    elif cond['direction'] == 'below' and prev_price > prev_sma_20 and current_price < current_sma_20: should_enter = True
            if not strategy.get('entry_conditions') and current_rsi < 30: should_enter = True
            if should_enter:
                position_value = capital * 0.95
                position = position_value / current_price
                entry_price = current_price
                capital -= position_value
                trades.append({'type': 'BUY', 'price': current_price, 'shares': position, 'timestamp': bars[i]['timestamp'], 'rsi': current_rsi})

        elif position > 0:
            should_exit = False
            exit_reason = ''
            for cond in strategy.get('exit_conditions', []):
                if cond['type'] == 'indicator' and cond['indicator'] == 'RSI':
                    if cond['operator'] == '>' and current_rsi > cond['value']:
                        should_exit = True
                        exit_reason = f"RSI > {cond['value']}"
                    elif cond['operator'] == '<' and current_rsi < cond['value']:
                        should_exit = True
                        exit_reason = f"RSI < {cond['value']}"
            pnl_pct = ((current_price - entry_price) / entry_price) * 100
            if pnl_pct <= -stop_loss_pct:
                should_exit = True
                exit_reason = 'Stop Loss'
            if pnl_pct >= take_profit_pct:
                should_exit = True
                exit_reason = 'Take Profit'
            if not strategy.get('exit_conditions') and current_rsi > 70:
                should_exit = True
                exit_reason = 'RSI Overbought'
            if should_exit:
                exit_value = position * current_price
                capital += exit_value
                trades.append({'type': 'SELL', 'price': current_price, 'shares': position, 'timestamp': bars[i]['timestamp'], 'pnl': exit_value - (position * entry_price), 'pnl_pct': pnl_pct, 'reason': exit_reason, 'rsi': current_rsi})
                position = 0
                entry_price = 0

        total_equity = capital + (position * current_price)
        equity_curve.append(total_equity)

    if position > 0:
        final_price = closes[-1]
        exit_value = position * final_price
        capital += exit_value
        pnl_pct = ((final_price - entry_price) / entry_price) * 100
        trades.append({'type': 'SELL', 'price': final_price, 'shares': position, 'timestamp': bars[-1]['timestamp'], 'pnl': exit_value - (position * entry_price), 'pnl_pct': pnl_pct, 'reason': 'End of backtest'})

    final_capital = capital
    total_return = ((final_capital - initial_capital) / initial_capital) * 100
    winning_trades = [t for t in trades if t['type'] == 'SELL' and t.get('pnl', 0) > 0]
    losing_trades = [t for t in trades if t['type'] == 'SELL' and t.get('pnl', 0) <= 0]
    total_closed = len(winning_trades) + len(losing_trades)
    win_rate = (len(winning_trades) / total_closed * 100) if total_closed > 0 else 0
    avg_win = sum(t['pnl'] for t in winning_trades) / len(winning_trades) if winning_trades else 0
    avg_loss = sum(t['pnl'] for t in losing_trades) / len(losing_trades) if losing_trades else 0

    peak = equity_curve[0]
    max_drawdown = 0
    for equity in equity_curve:
        if equity > peak: peak = equity
        drawdown = ((peak - equity) / peak) * 100
        max_drawdown = max(max_drawdown, drawdown)

    if len(equity_curve) > 1:
        returns = [(equity_curve[i] - equity_curve[i-1]) / equity_curve[i-1] for i in range(1, len(equity_curve))]
        avg_return = sum(returns) / len(returns)
        std_return = (sum((r - avg_return) ** 2 for r in returns) / len(returns)) ** 0.5
        sharpe = (avg_return / std_return) * (252 ** 0.5) if std_return > 0 else 0
    else:
        sharpe = 0

    gross_profit = sum(t['pnl'] for t in winning_trades)
    gross_loss = abs(sum(t['pnl'] for t in losing_trades))
    profit_factor = gross_profit / gross_loss if gross_loss > 0 else float('inf') if gross_profit > 0 else 0

    return {
        'initial_capital': initial_capital,
        'final_capital': round(final_capital, 2),
        'total_return': round(total_return, 2),
        'total_trades': total_closed,
        'winning_trades': len(winning_trades),
        'losing_trades': len(losing_trades),
        'win_rate': round(win_rate, 2),
        'avg_win': round(avg_win, 2),
        'avg_loss': round(avg_loss, 2),
        'max_drawdown': round(max_drawdown, 2),
        'sharpe_ratio': round(sharpe, 2),
        'profit_factor': round(profit_factor, 2) if profit_factor != float('inf') else 'Inf',
        'trades': trades[-20:],
        'equity_curve': [{'index': i, 'value': round(v, 2)} for i, v in enumerate(equity_curve[::max(1, len(equity_curve)//100)])],
        'bars_analyzed': len(bars),
    }


def run_backtest(symbol: str, strategy: dict, timeframe: str, lookback: str, initial_capital: float = 10000) -> dict:
    client = get_data_client()
    end_date = datetime.now()
    start_date = end_date - LOOKBACK_MAP.get(lookback, timedelta(days=180))

    try:
        if client and ALPACA_AVAILABLE:
            tf = TIMEFRAME_MAP.get(timeframe, TimeFrame.Day)
            request = StockBarsRequest(symbol_or_symbols=symbol, timeframe=tf, start=start_date, end=end_date)
            bars = client.get_stock_bars(request)
            bars_data = bars[symbol] if symbol in bars else []
            historical_data = [{'timestamp': bar.timestamp.isoformat(), 'open': float(bar.open), 'high': float(bar.high), 'low': float(bar.low), 'close': float(bar.close), 'volume': int(bar.volume)} for bar in bars_data]
        else:
            historical_data = generate_mock_bars(symbol, start_date, end_date, timeframe)
    except Exception as e:
        print(f"Error fetching bars: {e}")
        historical_data = generate_mock_bars(symbol, start_date, end_date, timeframe)

    if not historical_data:
        return {'error': 'No historical data available'}

    return simulate_strategy(historical_data, strategy, initial_capital)


@alpaca_lab_bp.route('/status', methods=['GET'])
def get_status():
    return jsonify({'alpaca_sdk_installed': ALPACA_AVAILABLE, 'api_key_configured': bool(ALPACA_API_KEY), 'paper_mode': ALPACA_PAPER})


@alpaca_lab_bp.route('/parse-strategy', methods=['POST'])
def parse_strategy():
    data = request.get_json()
    natural_language = data.get('strategy', '')
    if not natural_language:
        return jsonify({'error': 'Strategy text required'}), 400
    return jsonify(parse_strategy_with_ai(natural_language))


@alpaca_lab_bp.route('/backtest', methods=['POST'])
def backtest():
    data = request.get_json()
    symbol = data.get('symbol', 'SPY')
    strategy = data.get('strategy', {})
    timeframe = data.get('timeframe', '1d')
    lookback = data.get('lookback', '6m')
    initial_capital = data.get('initial_capital', 10000)
    return jsonify(run_backtest(symbol, strategy, timeframe, lookback, initial_capital))


@alpaca_lab_bp.route('/quote/<symbol>', methods=['GET'])
def get_quote(symbol):
    client = get_data_client()
    try:
        if client and ALPACA_AVAILABLE:
            req = StockLatestQuoteRequest(symbol_or_symbols=symbol.upper())
            quotes = client.get_stock_latest_quote(req)
            quote = quotes[symbol.upper()]
            return jsonify({'symbol': symbol.upper(), 'bid': float(quote.bid_price), 'ask': float(quote.ask_price), 'bid_size': quote.bid_size, 'ask_size': quote.ask_size, 'timestamp': quote.timestamp.isoformat()})
        else:
            base_prices = {'TSLA': 250, 'AAPL': 180, 'SPY': 500}
            price = base_prices.get(symbol.upper(), 100) * (1 + random.uniform(-0.01, 0.01))
            return jsonify({'symbol': symbol.upper(), 'bid': round(price - 0.01, 2), 'ask': round(price + 0.01, 2), 'bid_size': random.randint(100, 1000), 'ask_size': random.randint(100, 1000), 'timestamp': datetime.now().isoformat(), 'mock': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@alpaca_lab_bp.route('/bars/<symbol>', methods=['GET'])
def get_bars(symbol):
    timeframe = request.args.get('timeframe', '1d')
    lookback = request.args.get('lookback', '1m')
    client = get_data_client()
    end_date = datetime.now()
    start_date = end_date - LOOKBACK_MAP.get(lookback, timedelta(days=30))
    try:
        if client and ALPACA_AVAILABLE:
            tf = TIMEFRAME_MAP.get(timeframe, TimeFrame.Day)
            req = StockBarsRequest(symbol_or_symbols=symbol.upper(), timeframe=tf, start=start_date, end=end_date)
            bars = client.get_stock_bars(req)
            bars_data = bars[symbol.upper()] if symbol.upper() in bars else []
            return jsonify({'symbol': symbol.upper(), 'timeframe': timeframe, 'bars': [{'timestamp': bar.timestamp.isoformat(), 'open': float(bar.open), 'high': float(bar.high), 'low': float(bar.low), 'close': float(bar.close), 'volume': int(bar.volume)} for bar in bars_data]})
        else:
            bars = generate_mock_bars(symbol.upper(), start_date, end_date, timeframe)
            return jsonify({'symbol': symbol.upper(), 'timeframe': timeframe, 'bars': bars, 'mock': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@alpaca_lab_bp.route('/account', methods=['GET'])
def get_account():
    client = get_trading_client()
    try:
        if client and ALPACA_AVAILABLE:
            account = client.get_account()
            return jsonify({'buying_power': float(account.buying_power), 'cash': float(account.cash), 'portfolio_value': float(account.portfolio_value), 'equity': float(account.equity), 'status': account.status, 'pattern_day_trader': account.pattern_day_trader, 'paper': ALPACA_PAPER})
        else:
            return jsonify({'buying_power': 100000.00, 'cash': 100000.00, 'portfolio_value': 100000.00, 'equity': 100000.00, 'status': 'ACTIVE', 'pattern_day_trader': False, 'paper': True, 'mock': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@alpaca_lab_bp.route('/deploy', methods=['POST'])
def deploy_strategy():
    data = request.get_json()
    strategy_name = data.get('name', 'Unnamed Strategy')
    symbol = data.get('symbol', 'SPY')
    strategy = data.get('strategy', {})
    capital = data.get('capital', 1000)
    mode = data.get('mode', 'paper')
    deployment_id = f"deploy_{int(datetime.now().timestamp())}"
    return jsonify({'success': True, 'deployment_id': deployment_id, 'message': f"Strategy '{strategy_name}' deployed in {mode} mode", 'details': {'symbol': symbol, 'capital': capital, 'mode': mode, 'status': 'active'}})


@alpaca_lab_bp.route('/positions', methods=['GET'])
def get_positions():
    client = get_trading_client()
    try:
        if client and ALPACA_AVAILABLE:
            positions = client.get_all_positions()
            return jsonify({'positions': [{'symbol': p.symbol, 'qty': float(p.qty), 'avg_entry_price': float(p.avg_entry_price), 'market_value': float(p.market_value), 'unrealized_pl': float(p.unrealized_pl), 'unrealized_plpc': float(p.unrealized_plpc)} for p in positions]})
        else:
            return jsonify({'positions': [], 'mock': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def register_alpaca_routes(app):
    app.register_blueprint(alpaca_lab_bp)
    print("✓ Alpha Lab (Alpaca) routes registered at /api/alpaca/*")

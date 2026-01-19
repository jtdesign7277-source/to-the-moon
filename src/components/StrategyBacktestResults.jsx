import { useState } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  DollarSign,
  Percent,
  AlertTriangle,
  Award,
  BarChart3,
  PieChart as PieIcon,
  Calendar,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

const StrategyBacktestResults = ({
  strategy,
  backtestStats,
  monthlyReturns = [],
  initialCapital = 10000,
}) => {
  const [showMetricsInfo, setShowMetricsInfo] = useState(null)

  if (!strategy || !backtestStats) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Select a strategy to view backtest results</p>
      </div>
    )
  }

  const {
    totalTrades = 0,
    winRate = 0,
    profitLoss = 0,
    avgWin = 0,
    avgLoss = 0,
    maxDrawdown = 0,
    sharpeRatio = 0,
    sortinoRatio = 0,
  } = backtestStats

  const winningTrades = Math.round(totalTrades * (winRate / 100))
  const losingTrades = totalTrades - winningTrades
  const profitFactor = avgLoss !== 0 ? Math.abs((avgWin * winningTrades) / (avgLoss * losingTrades)).toFixed(2) : 'N/A'
  const totalReturn = ((profitLoss / initialCapital) * 100).toFixed(1)

  // Generate cumulative P&L data from monthly returns
  const cumulativePnLData = (() => {
    let cumulative = 0
    const baseMonths = monthlyReturns.length > 0
      ? monthlyReturns
      : [
          { month: 'Jul', pnl: Math.round(profitLoss * 0.14) },
          { month: 'Aug', pnl: Math.round(profitLoss * 0.18) },
          { month: 'Sep', pnl: Math.round(profitLoss * 0.12) },
          { month: 'Oct', pnl: Math.round(profitLoss * 0.22) },
          { month: 'Nov', pnl: Math.round(profitLoss * 0.18) },
          { month: 'Dec', pnl: Math.round(profitLoss * 0.16) },
        ]

    return baseMonths.map(item => {
      cumulative += item.pnl
      return {
        month: item.month,
        pnl: item.pnl,
        cumulative,
        capital: initialCapital + cumulative,
      }
    })
  })()

  // Win/Loss distribution data
  const winLossData = [
    { name: 'Wins', value: winningTrades, color: '#10B981' },
    { name: 'Losses', value: losingTrades, color: '#EF4444' },
  ]

  // Monthly returns for bar chart
  const monthlyData = monthlyReturns.length > 0
    ? monthlyReturns.map(m => ({
        ...m,
        fill: m.pnl >= 0 ? '#10B981' : '#EF4444',
      }))
    : cumulativePnLData.map(m => ({
        month: m.month,
        pnl: m.pnl,
        fill: m.pnl >= 0 ? '#10B981' : '#EF4444',
      }))

  // Metric info tooltips
  const metricInfo = {
    sharpe: {
      title: 'Sharpe Ratio',
      description: 'Measures risk-adjusted return. Higher is better. Above 1.0 is good, above 2.0 is excellent.',
      interpretation: sharpeRatio >= 2 ? 'Excellent' : sharpeRatio >= 1 ? 'Good' : sharpeRatio >= 0.5 ? 'Acceptable' : 'Poor',
    },
    sortino: {
      title: 'Sortino Ratio',
      description: 'Like Sharpe but only penalizes downside volatility. Better for strategies with asymmetric returns.',
      interpretation: sortinoRatio >= 2 ? 'Excellent' : sortinoRatio >= 1 ? 'Good' : sortinoRatio >= 0.5 ? 'Acceptable' : 'Poor',
    },
    drawdown: {
      title: 'Max Drawdown',
      description: 'Largest peak-to-trough decline. Shows worst-case scenario during the backtest period.',
      interpretation: Math.abs(maxDrawdown) <= 5 ? 'Very Low Risk' : Math.abs(maxDrawdown) <= 10 ? 'Low Risk' : Math.abs(maxDrawdown) <= 20 ? 'Moderate Risk' : 'High Risk',
    },
    profitFactor: {
      title: 'Profit Factor',
      description: 'Gross profit divided by gross loss. Above 1.5 is good, above 2.0 is excellent.',
      interpretation: profitFactor >= 2 ? 'Excellent' : profitFactor >= 1.5 ? 'Good' : profitFactor >= 1 ? 'Break-even' : 'Losing',
    },
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('$') || entry.dataKey === 'pnl' || entry.dataKey === 'cumulative' || entry.dataKey === 'capital'
                ? `$${entry.value.toLocaleString()}`
                : entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header with Strategy Name */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{strategy.icon}</span>
              <h2 className="text-2xl font-bold">{strategy.name}</h2>
            </div>
            <p className="text-indigo-100 text-sm max-w-xl">{strategy.description}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-indigo-200">6-Month Return</div>
            <div className={`text-3xl font-bold ${profitLoss >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {profitLoss >= 0 ? '+' : ''}{totalReturn}%
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Win Rate */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Win Rate</span>
            <Target className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">{winRate}%</div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full transition-all duration-500"
              style={{
                width: `${winRate}%`,
                background: winRate >= 70 ? '#10B981' : winRate >= 50 ? '#F59E0B' : '#EF4444',
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Total P&L */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total P&L</span>
            <DollarSign className={`w-4 h-4 ${profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </div>
          <div className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {profitLoss >= 0 ? '+' : ''}${profitLoss.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 mt-2">
            {profitLoss >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitLoss >= 0 ? '+' : ''}{totalReturn}% return
            </span>
          </div>
        </div>

        {/* Sharpe Ratio */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Sharpe Ratio</span>
            <button
              onClick={() => setShowMetricsInfo(showMetricsInfo === 'sharpe' ? null : 'sharpe')}
              className="text-gray-400 hover:text-indigo-500 transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
          <div className="text-2xl font-bold text-gray-900">{sharpeRatio}</div>
          <div className={`text-sm mt-2 px-2 py-0.5 rounded-full inline-block ${
            sharpeRatio >= 2 ? 'bg-green-100 text-green-700' :
            sharpeRatio >= 1 ? 'bg-blue-100 text-blue-700' :
            sharpeRatio >= 0.5 ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {metricInfo.sharpe.interpretation}
          </div>
          {showMetricsInfo === 'sharpe' && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 text-white p-3 rounded-lg text-xs z-10 shadow-lg">
              <p className="font-medium mb-1">{metricInfo.sharpe.title}</p>
              <p className="text-gray-300">{metricInfo.sharpe.description}</p>
            </div>
          )}
        </div>

        {/* Max Drawdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Max Drawdown</span>
            <button
              onClick={() => setShowMetricsInfo(showMetricsInfo === 'drawdown' ? null : 'drawdown')}
              className="text-gray-400 hover:text-indigo-500 transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
          <div className="text-2xl font-bold text-red-600">{maxDrawdown}%</div>
          <div className={`text-sm mt-2 px-2 py-0.5 rounded-full inline-block ${
            Math.abs(maxDrawdown) <= 5 ? 'bg-green-100 text-green-700' :
            Math.abs(maxDrawdown) <= 10 ? 'bg-blue-100 text-blue-700' :
            Math.abs(maxDrawdown) <= 20 ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {metricInfo.drawdown.interpretation}
          </div>
          {showMetricsInfo === 'drawdown' && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 text-white p-3 rounded-lg text-xs z-10 shadow-lg">
              <p className="font-medium mb-1">{metricInfo.drawdown.title}</p>
              <p className="text-gray-300">{metricInfo.drawdown.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-sm text-gray-500 mb-1">Total Trades</div>
          <div className="text-xl font-bold text-gray-900">{totalTrades}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-sm text-gray-500 mb-1">Avg Win</div>
          <div className="text-xl font-bold text-green-600">+${avgWin}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-sm text-gray-500 mb-1">Avg Loss</div>
          <div className="text-xl font-bold text-red-600">${avgLoss}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center relative">
          <div className="flex items-center justify-center gap-1 text-sm text-gray-500 mb-1">
            Sortino
            <button
              onClick={() => setShowMetricsInfo(showMetricsInfo === 'sortino' ? null : 'sortino')}
              className="text-gray-400 hover:text-indigo-500"
            >
              <Info className="w-3 h-3" />
            </button>
          </div>
          <div className="text-xl font-bold text-indigo-600">{sortinoRatio}</div>
          {showMetricsInfo === 'sortino' && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 text-white p-3 rounded-lg text-xs z-10 shadow-lg">
              <p className="font-medium mb-1">{metricInfo.sortino.title}</p>
              <p className="text-gray-300">{metricInfo.sortino.description}</p>
            </div>
          )}
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center relative">
          <div className="flex items-center justify-center gap-1 text-sm text-gray-500 mb-1">
            Profit Factor
            <button
              onClick={() => setShowMetricsInfo(showMetricsInfo === 'profitFactor' ? null : 'profitFactor')}
              className="text-gray-400 hover:text-indigo-500"
            >
              <Info className="w-3 h-3" />
            </button>
          </div>
          <div className="text-xl font-bold text-gray-900">{profitFactor}</div>
          {showMetricsInfo === 'profitFactor' && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 text-white p-3 rounded-lg text-xs z-10 shadow-lg">
              <p className="font-medium mb-1">{metricInfo.profitFactor.title}</p>
              <p className="text-gray-300">{metricInfo.profitFactor.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cumulative P&L Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-gray-900">Cumulative P&L</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativePnLData}>
                <defs>
                  <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  name="Cumulative P&L"
                  stroke="#6366F1"
                  strokeWidth={2}
                  fill="url(#colorCumulative)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Win/Loss Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-gray-900">Win/Loss Distribution</h3>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={winLossData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {winLossData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} trades`, name]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-gray-700">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{winningTrades}</div>
              <div className="text-sm text-green-700">Winning Trades</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{losingTrades}</div>
              <div className="text-sm text-red-700">Losing Trades</div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Returns Table & Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-gray-900">Monthly Returns</h3>
        </div>

        {/* Monthly Bar Chart */}
        <div className="h-48 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pnl" name="P&L" radius={[4, 4, 0, 0]}>
                {monthlyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Returns Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Month</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">P&L</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Return %</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Cumulative</th>
              </tr>
            </thead>
            <tbody>
              {cumulativePnLData.map((month, index) => (
                <tr key={month.month} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{month.month} 2024</td>
                  <td className={`py-3 px-4 text-sm text-right font-medium ${month.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {month.pnl >= 0 ? '+' : ''}${month.pnl.toLocaleString()}
                  </td>
                  <td className={`py-3 px-4 text-sm text-right ${month.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {month.pnl >= 0 ? '+' : ''}{((month.pnl / initialCapital) * 100).toFixed(1)}%
                  </td>
                  <td className={`py-3 px-4 text-sm text-right font-medium ${month.cumulative >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {month.cumulative >= 0 ? '+' : ''}${month.cumulative.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td className="py-3 px-4 text-sm font-bold text-gray-900">Total</td>
                <td className={`py-3 px-4 text-sm text-right font-bold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profitLoss >= 0 ? '+' : ''}${profitLoss.toLocaleString()}
                </td>
                <td className={`py-3 px-4 text-sm text-right font-bold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profitLoss >= 0 ? '+' : ''}{totalReturn}%
                </td>
                <td className={`py-3 px-4 text-sm text-right font-bold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${(initialCapital + profitLoss).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-gray-900">Risk Assessment</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Risk Level</h4>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                strategy.riskLevel === 'very-low' ? 'bg-green-500' :
                strategy.riskLevel === 'low' ? 'bg-emerald-500' :
                strategy.riskLevel === 'low-medium' ? 'bg-teal-500' :
                strategy.riskLevel === 'medium' ? 'bg-yellow-500' :
                strategy.riskLevel === 'medium-high' ? 'bg-orange-500' :
                'bg-red-500'
              }`} />
              <span className="font-medium text-gray-900 capitalize">
                {strategy.riskLevel?.replace('-', ' ') || 'Medium'}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  strategy.riskLevel === 'very-low' ? 'bg-green-500 w-1/6' :
                  strategy.riskLevel === 'low' ? 'bg-emerald-500 w-2/6' :
                  strategy.riskLevel === 'low-medium' ? 'bg-teal-500 w-3/6' :
                  strategy.riskLevel === 'medium' ? 'bg-yellow-500 w-4/6' :
                  strategy.riskLevel === 'medium-high' ? 'bg-orange-500 w-5/6' :
                  'bg-red-500 w-full'
                }`}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Expected Monthly Return</h4>
            <div className="text-2xl font-bold text-indigo-600">
              +{strategy.expectedMonthlyReturn || ((profitLoss / initialCapital / 6) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500">Based on 6-month average</p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Risk/Reward</h4>
            <div className="text-2xl font-bold text-gray-900">
              1:{Math.abs(avgWin / avgLoss).toFixed(1)}
            </div>
            <p className="text-xs text-gray-500">Average win vs average loss</p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800 mb-1">Important Disclaimer</h4>
            <p className="text-sm text-amber-700">
              Based on historical data from July 2024 - January 2025 using resolved markets from Kalshi and Manifold Markets.
              <strong> Past performance does not guarantee future results.</strong> All trading involves risk, and you could lose
              some or all of your investment. These results are from backtesting and may not reflect actual trading performance
              due to factors like slippage, fees, and market conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StrategyBacktestResults

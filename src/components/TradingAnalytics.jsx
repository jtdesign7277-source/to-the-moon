import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Target, Clock, Calendar, BarChart3 } from 'lucide-react'

const TradingAnalytics = ({ trades = [] }) => {
  // Analytics calculations
  const analytics = useMemo(() => {
    if (trades.length === 0) {
      return {
        byDayOfWeek: [],
        byHour: [],
        byPlatform: [],
        byStrategy: [],
        avgWin: 0,
        avgLoss: 0,
        expectancy: 0,
        winRate: 0,
        profitFactor: 0,
        bestDay: null,
        worstDay: null,
        largestWin: 0,
        largestLoss: 0,
      }
    }

    // Day of week analysis
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayStats = dayNames.map(name => ({ name: name.slice(0, 3), fullName: name, pnl: 0, trades: 0, wins: 0 }))
    
    // Hour analysis (simplified to trading hours)
    const hourStats = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${i.toString().padStart(2, '0')}:00`,
      pnl: 0,
      trades: 0,
    }))

    // Platform analysis
    const platformStats = {}
    
    // Strategy analysis
    const strategyStats = {}

    // Overall stats
    let totalWins = 0
    let totalLosses = 0
    let winAmount = 0
    let lossAmount = 0
    let largestWin = 0
    let largestLoss = 0

    trades.forEach(trade => {
      const pnl = trade.pnl || trade.profit || 0
      const date = new Date(trade.settledAt || trade.placedAt || Date.now())
      const dayOfWeek = date.getDay()
      const hour = date.getHours()
      const platform = trade.platform || 'Unknown'
      const strategy = trade.strategy || 'Manual'

      // Day of week
      dayStats[dayOfWeek].pnl += pnl
      dayStats[dayOfWeek].trades++
      if (pnl > 0) dayStats[dayOfWeek].wins++

      // Hour
      hourStats[hour].pnl += pnl
      hourStats[hour].trades++

      // Platform
      if (!platformStats[platform]) {
        platformStats[platform] = { name: platform, pnl: 0, trades: 0, wins: 0 }
      }
      platformStats[platform].pnl += pnl
      platformStats[platform].trades++
      if (pnl > 0) platformStats[platform].wins++

      // Strategy
      if (!strategyStats[strategy]) {
        strategyStats[strategy] = { name: strategy, pnl: 0, trades: 0, wins: 0 }
      }
      strategyStats[strategy].pnl += pnl
      strategyStats[strategy].trades++
      if (pnl > 0) strategyStats[strategy].wins++

      // Win/Loss stats
      if (pnl > 0) {
        totalWins++
        winAmount += pnl
        if (pnl > largestWin) largestWin = pnl
      } else if (pnl < 0) {
        totalLosses++
        lossAmount += Math.abs(pnl)
        if (pnl < largestLoss) largestLoss = pnl
      }
    })

    const totalTrades = trades.length
    const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0
    const avgWin = totalWins > 0 ? winAmount / totalWins : 0
    const avgLoss = totalLosses > 0 ? lossAmount / totalLosses : 0
    const expectancy = totalTrades > 0 
      ? (winRate / 100 * avgWin) - ((100 - winRate) / 100 * avgLoss)
      : 0
    const profitFactor = lossAmount > 0 ? winAmount / lossAmount : winAmount > 0 ? Infinity : 0

    // Find best/worst days
    const sortedDays = [...dayStats].filter(d => d.trades > 0).sort((a, b) => b.pnl - a.pnl)
    const bestDay = sortedDays[0] || null
    const worstDay = sortedDays[sortedDays.length - 1] || null

    // Filter hours with trades
    const activeHours = hourStats.filter(h => h.trades > 0)

    return {
      byDayOfWeek: dayStats,
      byHour: activeHours,
      byPlatform: Object.values(platformStats),
      byStrategy: Object.values(strategyStats),
      avgWin,
      avgLoss,
      expectancy,
      winRate,
      profitFactor,
      bestDay,
      worstDay,
      largestWin,
      largestLoss,
      totalTrades,
      totalWins,
      totalLosses,
    }
  }, [trades])

  const StatCard = ({ title, value, subtitle, icon: Icon, color = 'indigo' }) => (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{title}</p>
          <p className={`text-xl font-bold text-${color}-600`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`p-2 bg-${color}-50 rounded-lg`}>
          <Icon className={`w-4 h-4 text-${color}-600`} />
        </div>
      </div>
    </div>
  )

  if (trades.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="font-medium text-gray-900">No Trade Data Yet</h3>
        <p className="text-sm text-gray-500 mt-1">Complete some trades to see your analytics</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Win Rate"
          value={`${analytics.winRate.toFixed(1)}%`}
          subtitle={`${analytics.totalWins}W / ${analytics.totalLosses}L`}
          icon={Target}
          color="indigo"
        />
        <StatCard
          title="Expectancy"
          value={`$${analytics.expectancy.toFixed(2)}`}
          subtitle="Per trade"
          icon={TrendingUp}
          color={analytics.expectancy >= 0 ? 'green' : 'red'}
        />
        <StatCard
          title="Avg Win"
          value={`$${analytics.avgWin.toFixed(2)}`}
          subtitle={`Best: $${analytics.largestWin.toFixed(2)}`}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Avg Loss"
          value={`-$${analytics.avgLoss.toFixed(2)}`}
          subtitle={`Worst: $${analytics.largestLoss.toFixed(2)}`}
          icon={TrendingDown}
          color="red"
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* P&L by Day of Week */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">P&L by Day of Week</h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.byDayOfWeek} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip 
                  formatter={(value) => [`$${value.toFixed(2)}`, 'P&L']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {analytics.byDayOfWeek.map((entry, index) => (
                    <Cell key={index} fill={entry.pnl >= 0 ? '#10B981' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {analytics.bestDay && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Best: <span className="font-medium text-green-600">{analytics.bestDay.fullName}</span>
              </span>
              <span className="text-gray-500">
                Worst: <span className="font-medium text-red-600">{analytics.worstDay?.fullName}</span>
              </span>
            </div>
          )}
        </div>

        {/* P&L by Hour */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">P&L by Time of Day</h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.byHour} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip 
                  formatter={(value, name, props) => [`$${value.toFixed(2)}`, 'P&L']}
                  labelFormatter={(label) => `Time: ${label}`}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {analytics.byHour.map((entry, index) => (
                    <Cell key={index} fill={entry.pnl >= 0 ? '#10B981' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Platform & Strategy Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* By Platform */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Performance by Platform</h3>
          <div className="space-y-3">
            {analytics.byPlatform.map((platform) => {
              const winRate = platform.trades > 0 ? (platform.wins / platform.trades) * 100 : 0
              return (
                <div key={platform.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {platform.name === 'Kalshi' ? '🎲' : platform.name === 'Polymarket' ? '🔮' : '📊'}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{platform.name}</p>
                      <p className="text-xs text-gray-500">{platform.trades} trades • {winRate.toFixed(0)}% win rate</p>
                    </div>
                  </div>
                  <p className={`font-semibold ${platform.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {platform.pnl >= 0 ? '+' : ''}${platform.pnl.toFixed(2)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* By Strategy */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Performance by Strategy</h3>
          <div className="space-y-3">
            {analytics.byStrategy.slice(0, 5).map((strategy) => {
              const winRate = strategy.trades > 0 ? (strategy.wins / strategy.trades) * 100 : 0
              return (
                <div key={strategy.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{strategy.name}</p>
                    <p className="text-xs text-gray-500">{strategy.trades} trades • {winRate.toFixed(0)}% win rate</p>
                  </div>
                  <p className={`font-semibold ${strategy.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {strategy.pnl >= 0 ? '+' : ''}${strategy.pnl.toFixed(2)}
                  </p>
                </div>
              )
            })}
            {analytics.byStrategy.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No strategy data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TradingAnalytics

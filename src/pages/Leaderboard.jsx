import { Users, GitFork } from 'lucide-react'

const traders = [
  { rank: 1, name: 'CryptoKing', returns: '+245.6%', winRate: '78%', trades: 432, badge: '🥇', followers: 1234 },
  { rank: 2, name: 'AlgoMaster', returns: '+198.3%', winRate: '72%', trades: 651, badge: '🥈', followers: 987 },
  { rank: 3, name: 'MoonShot', returns: '+156.7%', winRate: '69%', trades: 289, badge: '🥉', followers: 756 },
  { rank: 4, name: 'TradingBot99', returns: '+134.2%', winRate: '65%', trades: 1203, badge: '4', followers: 543 },
  { rank: 5, name: 'WhaleTrades', returns: '+128.9%', winRate: '71%', trades: 178, badge: '5', followers: 421 },
  { rank: 6, name: 'DiamondHands', returns: '+112.4%', winRate: '63%', trades: 567, badge: '6', followers: 387 },
  { rank: 7, name: 'BullRunner', returns: '+98.7%', winRate: '67%', trades: 345, badge: '7', followers: 298 },
  { rank: 8, name: 'SmartMoney', returns: '+87.3%', winRate: '70%', trades: 234, badge: '8', followers: 234 },
]

const getPodiumStyle = (rank) => {
  switch (rank) {
    case 1:
      return 'bg-linear-to-br from-yellow-400 to-amber-500'
    case 2:
      return 'bg-linear-to-br from-gray-300 to-gray-400'
    case 3:
      return 'bg-linear-to-br from-amber-600 to-amber-700'
    default:
      return 'bg-linear-to-br from-indigo-500 to-purple-600'
  }
}

const Leaderboard = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leaderboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Top performing traders this month.</p>
        </div>
        <select className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
          <option>This Month</option>
          <option>This Week</option>
          <option>All Time</option>
        </select>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {traders.slice(0, 3).map((trader) => (
          <div
            key={trader.rank}
            className={`rounded-xl p-6 text-center text-white relative overflow-hidden shadow-lg ${getPodiumStyle(trader.rank)}`}
          >
            <div className="absolute inset-0 bg-white/10" />
            <div className="relative">
              <div className="text-4xl mb-2">{trader.badge}</div>
              <h3 className="font-bold text-lg">{trader.name}</h3>
              <p className="text-3xl font-bold mt-2">{trader.returns}</p>
              <p className="text-sm opacity-90 mt-1">{trader.winRate} Win Rate</p>
              <div className="flex items-center justify-center gap-1 mt-2 opacity-80">
                <Users className="w-4 h-4" />
                <span className="text-sm">{trader.followers.toLocaleString()} followers</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Rankings Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trader</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Returns</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Win Rate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Trades</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Followers</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {traders.map((trader) => (
                <tr key={trader.rank} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-3 text-sm">
                    <span className="text-lg">{trader.badge}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{trader.name}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">{trader.returns}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hidden sm:table-cell">{trader.winRate}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell">{trader.trades}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {trader.followers}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button className="px-3 py-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-1">
                      <GitFork className="w-3 h-3" />
                      Copy
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Leaderboard

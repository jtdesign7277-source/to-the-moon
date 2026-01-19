import { Search, Activity, Star, Users, TrendingUp, Eye } from 'lucide-react'

const strategies = [
  { name: 'Momentum Pro', author: 'CryptoKing', price: '$49/mo', rating: 4.9, users: 1234, returns: '+145%', category: 'Crypto' },
  { name: 'DCA Bot', author: 'AlgoMaster', price: '$29/mo', rating: 4.7, users: 3456, returns: '+67%', category: 'All Markets' },
  { name: 'Grid Trader', author: 'TradingBot99', price: '$39/mo', rating: 4.8, users: 892, returns: '+89%', category: 'Crypto' },
  { name: 'Scalper Elite', author: 'MoonShot', price: '$79/mo', rating: 4.6, users: 567, returns: '+234%', category: 'Sports' },
  { name: 'Swing Master', author: 'WhaleTrades', price: '$59/mo', rating: 4.5, users: 234, returns: '+112%', category: 'Politics' },
  { name: 'Arbitrage Bot', author: 'SmartMoney', price: '$99/mo', rating: 4.9, users: 123, returns: '+56%', category: 'Multi-Platform' },
]

const Marketplace = () => {
  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
          <p className="text-gray-500 text-sm mt-1">Discover and subscribe to proven trading strategies.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search strategies..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
            <option>All Categories</option>
            <option>Crypto</option>
            <option>Sports</option>
            <option>Politics</option>
          </select>
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
            <option>Most Popular</option>
            <option>Highest Returns</option>
            <option>Lowest Price</option>
          </select>
        </div>
      </div>

      {/* Strategy Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {strategies.map((strategy, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all group"
          >
            {/* Card Header with Gradient */}
            <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJsLTItMmMwIDAtMiAyLTIgNHMyIDQgMiA0IDIgMiA0IDJsMiAyYzAgMCAyLTIgMi00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
              <Activity className="w-12 h-12 text-white/80 group-hover:scale-110 transition-transform" />
              <span className="absolute top-3 right-3 px-2 py-1 bg-white/20 backdrop-blur-sm rounded text-xs text-white font-medium">
                {strategy.category}
              </span>
            </div>

            {/* Card Content */}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{strategy.name}</h3>
                  <p className="text-sm text-gray-500">by {strategy.author}</p>
                </div>
                <span className="text-lg font-bold text-indigo-600">{strategy.price}</span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  {strategy.rating}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {strategy.users.toLocaleString()}
                </span>
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {strategy.returns}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <button className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25">
                  Subscribe
                </button>
                <button className="px-3 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Marketplace

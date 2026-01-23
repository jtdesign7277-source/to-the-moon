import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Activity, Star, Users, TrendingUp, Eye, ShoppingCart, BadgeCheck, X } from 'lucide-react'
import { trackStrategyView } from '../utils/analytics'
import { useMarketplace } from '../contexts/MarketplaceContext'

// Featured strategies (curated/verified)
const featuredStrategies = [
  { id: 'f1', name: 'Momentum Pro', author: 'CryptoKing', price: 149, rating: 4.9, users: 1234, returns: '+145%', category: 'Crypto', verified: true },
  { id: 'f2', name: 'DCA Bot', author: 'AlgoMaster', price: 89, rating: 4.7, users: 3456, returns: '+67%', category: 'All Markets', verified: true },
  { id: 'f3', name: 'Grid Trader', author: 'TradingBot99', price: 119, rating: 4.8, users: 892, returns: '+89%', category: 'Crypto', verified: true },
  { id: 'f4', name: 'Scalper Elite', author: 'MoonShot', price: 249, rating: 4.6, users: 567, returns: '+234%', category: 'Sports', verified: true },
  { id: 'f5', name: 'Swing Master', author: 'WhaleTrades', price: 179, rating: 4.5, users: 234, returns: '+112%', category: 'Politics', verified: true },
  { id: 'f6', name: 'Arbitrage Bot', author: 'SmartMoney', price: 299, rating: 4.9, users: 123, returns: '+56%', category: 'Multi-Platform', verified: true },
]

const Marketplace = () => {
  const { allListings, purchaseStrategy, recordView } = useMarketplace()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('popular')
  const [selectedListing, setSelectedListing] = useState(null)
  const [activeTab, setActiveTab] = useState('featured') // 'featured' | 'community'

  // Combine featured and user listings based on tab
  const displayStrategies = activeTab === 'featured'
    ? featuredStrategies
    : allListings.map(l => ({
        id: l.id,
        name: l.strategyName,
        author: l.sellerName,
        price: l.price,
        rating: l.rating || 0,
        users: l.purchases || 0,
        returns: l.backtestResults?.totalReturn ? `+${l.backtestResults.totalReturn.toFixed(1)}%` : 'N/A',
        category: 'User Strategy',
        verified: false,
        isUserListing: true,
        listing: l,
      }))

  // Filter strategies
  const filteredStrategies = displayStrategies.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.author.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Sort strategies
  const sortedStrategies = [...filteredStrategies].sort((a, b) => {
    if (sortBy === 'popular') return b.users - a.users
    if (sortBy === 'returns') {
      const aReturns = parseFloat(a.returns.replace(/[^0-9.-]/g, '')) || 0
      const bReturns = parseFloat(b.returns.replace(/[^0-9.-]/g, '')) || 0
      return bReturns - aReturns
    }
    if (sortBy === 'price-low') return a.price - b.price
    if (sortBy === 'price-high') return b.price - a.price
    return 0
  })

  const handleViewStrategy = (strategy) => {
    trackStrategyView(strategy.name)
    if (strategy.isUserListing) {
      recordView(strategy.id)
    }
    setSelectedListing(strategy)
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Marketplace</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Discover and purchase proven trading strategies</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('featured')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'featured'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Featured
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'community'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Community
            {allListings.length > 0 && (
              <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-full">
                {allListings.length}
              </span>
            )}
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search strategies..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="Crypto">Crypto</option>
            <option value="Sports">Sports</option>
            <option value="Politics">Politics</option>
            <option value="User Strategy">Community</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="popular">Most Popular</option>
            <option value="returns">Highest Returns</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Empty State for Community */}
      {activeTab === 'community' && allListings.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No community strategies yet</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Be the first to list your winning strategy!</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Go to Trade Station → Daily Challenges → List on Marketplace</p>
        </div>
      )}

      {/* Strategy Cards Grid */}
      {sortedStrategies.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedStrategies.map((strategy) => (
            <motion.div
              key={strategy.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-700 transition-all group"
            >
              {/* Card Header with Gradient */}
              <div className={`h-28 flex items-center justify-center relative overflow-hidden ${
                strategy.verified
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                  : 'bg-gradient-to-br from-emerald-500 to-teal-600'
              }`}>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJsLTItMmMwIDAtMiAyLTIgNHMyIDQgMiA0IDIgMiA0IDJsMiAyYzAgMCAyLTIgMi00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <Activity className="w-10 h-10 text-white/80 group-hover:scale-110 transition-transform" />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  {strategy.verified && (
                    <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-xs text-white font-medium flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>
                <span className="absolute top-3 right-3 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-xs text-white font-medium">
                  {strategy.category}
                </span>
              </div>

              {/* Card Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{strategy.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">by {strategy.author}</p>
                  </div>
                  <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{strategy.price} coins</span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {strategy.rating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      {strategy.rating.toFixed(1)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {strategy.users.toLocaleString()}
                  </span>
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {strategy.returns}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors active:scale-[0.98]">
                    Purchase
                  </button>
                  <button
                    onClick={() => handleViewStrategy(strategy)}
                    className="px-3 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Strategy Detail Sheet */}
      <AnimatePresence>
        {selectedListing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedListing(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full sm:w-[440px] bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              {/* Handle bar for mobile */}
              <div className="flex justify-center pt-3 pb-2 sm:hidden">
                <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
              </div>

              {/* Header */}
              <div className={`px-5 py-6 ${
                selectedListing.verified
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                  : 'bg-gradient-to-br from-emerald-500 to-teal-600'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{selectedListing.name}</h3>
                      <p className="text-white/70 text-sm">by {selectedListing.author}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedListing(null)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-4 mt-4 text-white/90 text-sm">
                  {selectedListing.rating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                      {selectedListing.rating.toFixed(1)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {selectedListing.users} users
                  </span>
                  <span className="font-semibold text-white">
                    {selectedListing.returns} returns
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Price */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <span className="text-gray-600 dark:text-gray-400">Price</span>
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{selectedListing.price} coins</span>
                </div>

                {/* Description */}
                {selectedListing.listing?.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{selectedListing.listing.description}</p>
                  </div>
                )}

                {/* Category */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Category</span>
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg">
                    {selectedListing.category}
                  </span>
                </div>

                {/* Verified Badge */}
                {selectedListing.verified && (
                  <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-xl">
                    <BadgeCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300">Verified Strategy</p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400">This strategy has been reviewed and verified by our team</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                <button className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors active:scale-[0.98] flex items-center justify-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Purchase for {selectedListing.price} Coins
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Marketplace

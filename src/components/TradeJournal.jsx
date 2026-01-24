import { useState } from 'react'
import { Star, Tag, MessageSquare, ChevronDown, ChevronUp, X, Edit2, Check, Filter, Search } from 'lucide-react'

const SETUP_TAGS = [
  { id: 'momentum', label: 'Momentum', color: 'text-blue-600 dark:text-blue-400' },
  { id: 'arbitrage', label: 'Arbitrage', color: 'text-purple-600 dark:text-purple-400' },
  { id: 'scalp', label: 'Scalp', color: 'text-orange-600 dark:text-orange-400' },
  { id: 'swing', label: 'Swing', color: 'text-teal-600 dark:text-teal-400' },
  { id: 'news', label: 'News', color: 'text-pink-600 dark:text-pink-400' },
  { id: 'reversal', label: 'Reversal', color: 'text-yellow-600 dark:text-yellow-400' },
  { id: 'breakout', label: 'Breakout', color: 'text-indigo-600 dark:text-indigo-400' },
  { id: 'value', label: 'Value', color: 'text-green-600 dark:text-green-400' },
]

const TradeJournal = ({ trades = [], onUpdateTrade }) => {
  const [expandedTrade, setExpandedTrade] = useState(null)
  const [editingNote, setEditingNote] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTag, setFilterTag] = useState(null)
  const [filterRating, setFilterRating] = useState(null)

  const handleRatingChange = (tradeId, rating) => {
    if (onUpdateTrade) {
      onUpdateTrade(tradeId, { rating })
    }
  }

  const handleTagToggle = (tradeId, tagId, currentTags = []) => {
    if (onUpdateTrade) {
      const newTags = currentTags.includes(tagId)
        ? currentTags.filter(t => t !== tagId)
        : [...currentTags, tagId]
      onUpdateTrade(tradeId, { tags: newTags })
    }
  }

  const handleNoteSave = (tradeId) => {
    if (onUpdateTrade) {
      onUpdateTrade(tradeId, { notes: noteText })
    }
    setEditingNote(null)
    setNoteText('')
  }

  const StarRating = ({ rating = 0, onChange, size = 'sm' }) => {
    const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange?.(star)}
            className={`${sizeClass} ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'
            } hover:text-yellow-400 transition-colors`}
          >
            <Star className={sizeClass} fill={star <= rating ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
    )
  }

  const TagBadge = ({ tag, selected, onClick }) => {
    const tagInfo = SETUP_TAGS.find(t => t.id === tag) || { label: tag, color: 'text-gray-600 dark:text-gray-400' }
    return (
      <button
        onClick={onClick}
        className={`text-xs font-bold transition-all ${tagInfo.color} ${
          selected ? 'underline underline-offset-2' : ''
        }`}
      >
        {tagInfo.label}
      </button>
    )
  }

  // Filter trades
  const filteredTrades = trades.filter(trade => {
    const matchesSearch = searchQuery === '' || 
      (trade.market || trade.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTag = !filterTag || (trade.tags || []).includes(filterTag)
    const matchesRating = !filterRating || trade.rating === filterRating
    return matchesSearch && matchesTag && matchesRating
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search trades..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
          </div>

          {/* Tag Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterTag || ''}
              onChange={(e) => setFilterTag(e.target.value || null)}
              className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Tags</option>
              {SETUP_TAGS.map(tag => (
                <option key={tag.id} value={tag.id}>{tag.label}</option>
              ))}
            </select>
          </div>

          {/* Rating Filter */}
          <select
            value={filterRating || ''}
            onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : null)}
            className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 dark:text-white"
          >
            <option value="">All Ratings</option>
            {[5, 4, 3, 2, 1].map(r => (
              <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>
            ))}
          </select>

          {/* Clear Filters */}
          {(filterTag || filterRating || searchQuery) && (
            <button
              onClick={() => {
                setFilterTag(null)
                setFilterRating(null)
                setSearchQuery('')
              }}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Trade List */}
      <div className="space-y-3">
        {filteredTrades.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center shadow-sm border border-gray-100 dark:border-gray-800">
            <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 dark:text-white">No Trades Found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {trades.length === 0 ? 'Complete some trades to start journaling' : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          filteredTrades.map((trade) => {
            const isExpanded = expandedTrade === trade.id
            const pnl = trade.pnl || trade.profit || 0
            const isProfit = pnl >= 0

            return (
              <div
                key={trade.id}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden"
              >
                {/* Trade Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => setExpandedTrade(isExpanded ? null : trade.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${isProfit ? 'bg-green-500' : 'bg-red-500'}`} />
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {trade.market || trade.title || 'Unknown Market'}
                        </h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>{trade.platform || 'Kalshi'}</span>
                        <span>•</span>
                        <span>{trade.position || 'YES'} @ {trade.price || 0}¢</span>
                        <span>•</span>
                        <span>{new Date(trade.settledAt || trade.placedAt).toLocaleDateString()}</span>
                      </div>
                      {/* Tags & Rating Preview */}
                      <div className="flex items-center gap-3 mt-2">
                        {trade.rating > 0 && (
                          <StarRating rating={trade.rating} size="sm" />
                        )}
                        {(trade.tags || []).slice(0, 3).map(tagId => (
                          <TagBadge key={tagId} tag={tagId} />
                        ))}
                        {(trade.tags || []).length > 3 && (
                          <span className="text-xs text-gray-400">+{trade.tags.length - 3} more</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`font-bold ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {isProfit ? '+' : ''}${pnl.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{trade.contracts || 1} contracts</p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/50 space-y-4">
                    {/* Rating Section */}
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
                        Execution Rating
                      </label>
                      <StarRating
                        rating={trade.rating || 0}
                        onChange={(rating) => handleRatingChange(trade.id, rating)}
                        size="md"
                      />
                    </div>

                    {/* Tags Section */}
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
                        Setup Tags
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {SETUP_TAGS.map(tag => (
                          <TagBadge
                            key={tag.id}
                            tag={tag.id}
                            selected={(trade.tags || []).includes(tag.id)}
                            onClick={() => handleTagToggle(trade.id, tag.id, trade.tags)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Notes Section */}
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
                        Notes
                      </label>
                      {editingNote === trade.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="What was your thesis? What went right/wrong? What would you do differently?"
                            className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-white dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
                            rows={4}
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingNote(null)}
                              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleNoteSave(trade.id)}
                              className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-1"
                            >
                              <Check className="w-4 h-4" />
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingNote(trade.id)
                            setNoteText(trade.notes || '')
                          }}
                          className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors min-h-[60px]"
                        >
                          {trade.notes ? (
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{trade.notes}</p>
                          ) : (
                            <p className="text-gray-400 dark:text-gray-500 flex items-center gap-2">
                              <Edit2 className="w-4 h-4" />
                              Click to add notes...
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Trade Details */}
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Entry</span>
                          <p className="font-medium dark:text-white">{trade.price || 0}¢</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Exit</span>
                          <p className="font-medium dark:text-white">{trade.settledPrice || (isProfit ? 100 : 0)}¢</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Position</span>
                          <p className="font-medium dark:text-white">{trade.position || 'YES'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Strategy</span>
                          <p className="font-medium dark:text-white">{trade.strategy || 'Manual'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default TradeJournal

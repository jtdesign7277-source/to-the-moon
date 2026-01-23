import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import {
  Rocket, Zap, Trophy, Target, TrendingUp,
  Flame, Star, Crown, Award, Clock,
  Play, ChevronRight, ChevronDown, ArrowUpRight,
  Copy, Check, X, Pause, Trash2,
  Sparkles, Send, Users, Timer, FolderOpen, Folder,
  AlertTriangle, Activity, DollarSign, TrendingDown,
  ShoppingCart, Tag, BadgeCheck
} from 'lucide-react'
import { useApp } from '../hooks/useApp'
import { useTrading } from '../contexts/TradingContext'
import { useMarketplace } from '../contexts/MarketplaceContext'
import { Button } from '../components/ui'

// Celebration animation for big wins
const CelebrationOverlay = ({ show, profit, onComplete }) => {
  useEffect(() => {
    if (show) {
      const duration = 2000
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#6366f1', '#8b5cf6', '#a855f7']
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#6366f1', '#8b5cf6', '#a855f7']
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }
      frame()
      setTimeout(onComplete, 3000)
    }
  }, [show, onComplete])

  if (!show) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onComplete}
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 mx-4 text-center shadow-2xl"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5, repeat: 3 }}
          className="text-6xl mb-4"
        >
          🚀
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Strategy Deployed!</h2>
        <p className="text-4xl font-bold text-emerald-500 mb-4">+{profit.toFixed(1)}%</p>
        <p className="text-gray-500">Your strategy is now live</p>
      </motion.div>
    </motion.div>
  )
}

// Clean stat pill
const StatPill = ({ icon: Icon, label, value, color = 'indigo' }) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${colors[color]}`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm font-semibold">{value}</span>
      {label && <span className="text-sm opacity-70">{label}</span>}
    </div>
  )
}

// Main Trade Station Component
const TradeStation = () => {
  const { tradingMode } = useApp()
  const {
    strategies: savedStrategies,
    deployedStrategies,
    positions,
    deleteStrategy,
    pauseStrategy,
    resumeStrategy,
    stopStrategy,
    deployStrategy,
    strategyTrades,
    getOpenTrades,
    getClosedTrades,
    getStrategyPnL,
    killStrategy,
    killAllStrategies,
  } = useTrading()
  const { listStrategy, myListings, isStrategyListed } = useMarketplace()

  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationProfit, setCelebrationProfit] = useState(0)
  const [showShareSheet, setShowShareSheet] = useState(false)
  const [copied, setCopied] = useState(false)

  // Marketplace listing sheet state
  const [showListingSheet, setShowListingSheet] = useState(false)
  const [selectedStrategyToList, setSelectedStrategyToList] = useState(null)
  const [listingPrice, setListingPrice] = useState('')
  const [listingDescription, setListingDescription] = useState('')
  const [listingSuccess, setListingSuccess] = useState(false)

  // Collapsible states
  const [isStrategiesFolderOpen, setIsStrategiesFolderOpen] = useState(true)
  const [isActiveFolderOpen, setIsActiveFolderOpen] = useState(true)
  const [isPositionsFolderOpen, setIsPositionsFolderOpen] = useState(true)
  const [positionsTab, setPositionsTab] = useState('open') // 'open' | 'closed'

  // User stats
  const stats = {
    coins: 1250,
  }

  // Get listable strategies (with positive backtest)
  const listableStrategies = savedStrategies.filter(s =>
    s.backtestResults?.totalReturn > 0 && !isStrategyListed(s.id)
  )

  // Challenges - dynamic progress based on actual data
  const challenges = [
    { id: 1, title: 'Build 3 strategies', progress: Math.min(savedStrategies.length, 3), target: 3, reward: 50, icon: Sparkles },
    { id: 2, title: 'Achieve 10% backtest profit', progress: Math.min(Math.max(...savedStrategies.map(s => s.backtestResults?.totalReturn || 0), 0), 10), target: 10, reward: 100, icon: Target },
    { id: 3, title: 'List on Marketplace', progress: myListings.length, target: 1, reward: 25, icon: ShoppingCart, action: () => setShowListingSheet(true) },
  ]

  // Handle listing submission
  const handleListStrategy = () => {
    if (!selectedStrategyToList || !listingPrice) return

    const price = parseInt(listingPrice, 10)
    if (isNaN(price) || price < 1) return

    listStrategy(selectedStrategyToList, {
      price,
      description: listingDescription,
      sellerName: 'You',
    })

    setListingSuccess(true)
    setTimeout(() => {
      setShowListingSheet(false)
      setSelectedStrategyToList(null)
      setListingPrice('')
      setListingDescription('')
      setListingSuccess(false)
    }, 2000)
  }

  // Tournaments
  const tournaments = [
    { id: 1, name: 'Weekly Challenge', prize: 5000, participants: 234, endsIn: '3d 12h', joined: false },
    { id: 2, name: 'Momentum Masters', prize: 10000, participants: 567, endsIn: '6d 8h', joined: true },
  ]

  const handleCopy = () => {
    navigator.clipboard.writeText('https://tothemoon.app/s/demo')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Calculate total P&L across all strategies
  const totalPnL = deployedStrategies.reduce((sum, dep) => {
    const pnl = getStrategyPnL(dep.id)
    return sum + pnl.totalPnL
  }, 0)

  // Get all open trades grouped by strategy
  const openTradesByStrategy = deployedStrategies.map(dep => ({
    deployment: dep,
    trades: getOpenTrades(dep.id),
    pnl: getStrategyPnL(dep.id)
  })).filter(g => g.trades.length > 0 || g.pnl.totalPnL !== 0)

  // Get all closed trades grouped by strategy
  const closedTradesByStrategy = deployedStrategies.map(dep => ({
    deployment: dep,
    trades: getClosedTrades(dep.id),
    pnl: getStrategyPnL(dep.id)
  })).filter(g => g.trades.length > 0)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Celebration */}
      <AnimatePresence>
        {showCelebration && (
          <CelebrationOverlay
            show={showCelebration}
            profit={celebrationProfit}
            onComplete={() => setShowCelebration(false)}
          />
        )}
      </AnimatePresence>

      {/* Share Sheet */}
      <AnimatePresence>
        {showShareSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
            onClick={() => setShowShareSheet(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={e => e.stopPropagation()}
              className="w-full sm:w-96 bg-white rounded-t-3xl sm:rounded-3xl p-6"
            >
              <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden" />
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Strategy</h3>

              <div className="flex gap-3 mb-4">
                <Button variant="primary" className="flex-1 bg-gray-900! hover:bg-gray-800!">
                  Twitter
                </Button>
                <Button variant="primary" className="flex-1">
                  Discord
                </Button>
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                <input
                  type="text"
                  value="https://tothemoon.app/s/demo"
                  readOnly
                  className="flex-1 bg-transparent text-gray-600 text-sm outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Marketplace Listing Sheet */}
      <AnimatePresence>
        {showListingSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowListingSheet(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full sm:w-[420px] bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              {/* Handle bar for mobile */}
              <div className="flex justify-center pt-3 pb-2 sm:hidden">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-5 pb-4 pt-2 sm:pt-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">List on Marketplace</h3>
                      <p className="text-xs text-gray-500">Sell your strategy to other traders</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowListingSheet(false)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {listingSuccess ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BadgeCheck className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">Listed Successfully!</h4>
                    <p className="text-sm text-gray-500">Your strategy is now live on the marketplace</p>
                  </motion.div>
                ) : (
                  <>
                    {/* Strategy Selection - Dropdown */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select from Your Strategies
                      </label>
                      {savedStrategies.length === 0 ? (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                          <FolderOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 font-medium">No strategies yet</p>
                          <p className="text-xs text-gray-400 mt-1">Create a strategy in Alpha Lab first</p>
                        </div>
                      ) : (
                        <>
                          <div className="relative">
                            <select
                              value={selectedStrategyToList?.id || ''}
                              onChange={(e) => {
                                const strategy = savedStrategies.find(s => s.id === e.target.value)
                                setSelectedStrategyToList(strategy || null)
                              }}
                              className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                            >
                              <option value="">Choose a strategy...</option>
                              {savedStrategies.map(strategy => {
                                const hasPositiveBacktest = strategy.backtestResults?.totalReturn > 0
                                const alreadyListed = isStrategyListed(strategy.id)
                                const isEligible = hasPositiveBacktest && !alreadyListed
                                const backtestReturn = strategy.backtestResults?.totalReturn

                                let statusText = ''
                                if (alreadyListed) statusText = ' (Already Listed)'
                                else if (!hasPositiveBacktest && backtestReturn !== undefined) statusText = ' (Negative backtest)'
                                else if (backtestReturn === undefined) statusText = ' (No backtest)'

                                return (
                                  <option
                                    key={strategy.id}
                                    value={strategy.id}
                                    disabled={!isEligible}
                                  >
                                    {strategy.name} - {strategy.symbol || 'SPY'}
                                    {backtestReturn !== undefined ? ` (${backtestReturn > 0 ? '+' : ''}${backtestReturn.toFixed(1)}%)` : ''}
                                    {statusText}
                                  </option>
                                )
                              })}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                          </div>

                          {/* Selected Strategy Display Card */}
                          {selectedStrategyToList && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-3 p-4 bg-indigo-50 border-2 border-indigo-200 rounded-xl"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <BadgeCheck className="w-4 h-4 text-indigo-600" />
                                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Selected Strategy</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-gray-900">{selectedStrategyToList.name}</p>
                                  <p className="text-sm text-gray-500">{selectedStrategyToList.symbol || 'SPY'}</p>
                                </div>
                                <div className="text-right">
                                  {selectedStrategyToList.backtestResults?.totalReturn !== undefined && (
                                    <>
                                      <p className={`text-lg font-bold ${
                                        selectedStrategyToList.backtestResults.totalReturn > 0
                                          ? 'text-emerald-600'
                                          : 'text-rose-500'
                                      }`}>
                                        {selectedStrategyToList.backtestResults.totalReturn > 0 ? '+' : ''}
                                        {selectedStrategyToList.backtestResults.totalReturn.toFixed(1)}%
                                      </p>
                                      <p className="text-xs text-gray-500">backtest return</p>
                                    </>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </>
                      )}
                      {savedStrategies.length > 0 && listableStrategies.length === 0 && (
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          Run a backtest with positive results to list a strategy
                        </p>
                      )}
                    </div>

                    {/* Price Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price (coins)
                      </label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          value={listingPrice}
                          onChange={(e) => setListingPrice(e.target.value)}
                          placeholder="100"
                          min="1"
                          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1.5">Recommended: 50-500 coins based on performance</p>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (optional)
                      </label>
                      <textarea
                        value={listingDescription}
                        onChange={(e) => setListingDescription(e.target.value)}
                        placeholder="Describe what makes your strategy unique..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                      />
                    </div>

                    {/* Preview */}
                    {selectedStrategyToList && listingPrice && (
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Preview</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{selectedStrategyToList.name}</p>
                            <p className="text-sm text-gray-500">by You</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-indigo-600">{listingPrice} coins</p>
                            <p className="text-xs text-emerald-600">+{selectedStrategyToList.backtestResults?.totalReturn?.toFixed(1)}% returns</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              {!listingSuccess && (
                <div className="p-5 border-t border-gray-100 bg-gray-50">
                  <button
                    onClick={handleListStrategy}
                    disabled={!selectedStrategyToList || !listingPrice || listableStrategies.length === 0}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors active:scale-[0.98]"
                  >
                    List for {listingPrice || '0'} Coins
                  </button>
                  <p className="text-xs text-center text-gray-500 mt-3">
                    You'll earn coins when other traders purchase your strategy
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trade Station</h1>
              <p className="text-gray-500 text-sm">Build, test, and deploy strategies</p>
            </div>
            <div className="flex items-center gap-3">
              <StatPill icon={Star} value={stats.coins} color="indigo" />
            </div>
          </div>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

          {/* Column 1: My Strategies */}
          <motion.div layout className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => setIsStrategiesFolderOpen(!isStrategiesFolderOpen)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isStrategiesFolderOpen ? (
                  <FolderOpen className="w-5 h-5 text-indigo-500" />
                ) : (
                  <Folder className="w-5 h-5 text-indigo-500" />
                )}
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">My Strategies</h3>
                  <p className="text-xs text-gray-500">{savedStrategies.length} saved</p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isStrategiesFolderOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isStrategiesFolderOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-3 max-h-96 overflow-y-auto">
                    {savedStrategies.length === 0 ? (
                      <div className="text-center py-6 text-gray-400 text-sm">
                        No strategies yet
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {savedStrategies.map(strategy => {
                          const isDeployed = deployedStrategies.some(d => d.strategyId === strategy.id)
                          return (
                            <div
                              key={strategy.id}
                              onClick={async () => {
                                if (!isDeployed) {
                                  const result = await deployStrategy(strategy, tradingMode)
                                  if (result && strategy.backtestResults?.totalReturn > 0) {
                                    setCelebrationProfit(strategy.backtestResults.totalReturn)
                                    setShowCelebration(true)
                                  }
                                }
                              }}
                              className={`flex items-center justify-between py-3 px-1 transition-colors ${
                                isDeployed
                                  ? 'opacity-50 cursor-default'
                                  : 'hover:bg-gray-50 cursor-pointer active:bg-gray-100'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="font-medium text-gray-900 text-sm truncate">{strategy.name}</span>
                                <span className="text-xs text-gray-400 font-medium">{strategy.symbol || 'SPY'}</span>
                              </div>
                              {!isDeployed && (
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Column 2: Active Strategies */}
          <motion.div layout className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => setIsActiveFolderOpen(!isActiveFolderOpen)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-emerald-500" />
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Active Strategies</h3>
                  <p className="text-xs text-gray-500">{deployedStrategies.length} running</p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isActiveFolderOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isActiveFolderOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-3 max-h-96 overflow-y-auto">
                    {deployedStrategies.length === 0 ? (
                      <div className="text-center py-6 text-gray-400 text-sm">
                        No active strategies
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {deployedStrategies.map(deployment => {
                          const pnl = getStrategyPnL(deployment.id)
                          return (
                            <div key={deployment.id} className="py-3 px-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${deployment.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-500'}`} />
                                  <span className="font-medium text-gray-900 text-sm truncate">{deployment.strategyName}</span>
                                  <span className="text-xs text-emerald-600">
                                    {deployment.status === 'active' ? 'Scanning' : 'Paused'}
                                  </span>
                                </div>
                                <span className={`text-sm font-semibold ${pnl.totalPnL >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                  {pnl.totalPnL >= 0 ? '+' : ''}${pnl.totalPnL.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {deployment.status === 'active' ? (
                                  <button
                                    onClick={() => pauseStrategy(deployment.id)}
                                    className="px-3 py-1 text-xs font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-md transition-colors"
                                  >
                                    Pause
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => resumeStrategy(deployment.id)}
                                    className="px-3 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                                  >
                                    Resume
                                  </button>
                                )}
                                <button
                                  onClick={() => killStrategy(deployment.id)}
                                  className="px-3 py-1 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors"
                                >
                                  Kill
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Column 3: Positions */}
          <motion.div layout className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => setIsPositionsFolderOpen(!isPositionsFolderOpen)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-amber-500" />
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Positions</h3>
                  <p className="text-xs text-gray-500">
                    {strategyTrades.filter(t => t.status === 'open').length} open, {strategyTrades.filter(t => t.status === 'closed').length} closed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${totalPnL >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isPositionsFolderOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            <AnimatePresence>
              {isPositionsFolderOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  {/* Open/Closed Tabs */}
                  <div className="px-4 pb-2">
                    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                      <button
                        onClick={() => setPositionsTab('open')}
                        className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all ${
                          positionsTab === 'open'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Open
                      </button>
                      <button
                        onClick={() => setPositionsTab('closed')}
                        className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all ${
                          positionsTab === 'closed'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Closed
                      </button>
                    </div>
                  </div>

                  <div className="px-4 pb-4 space-y-3 max-h-96 overflow-y-auto">
                    {positionsTab === 'open' ? (
                      // Open Positions
                      openTradesByStrategy.length === 0 ? (
                        <div className="text-center py-6">
                          <TrendingUp className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">No open positions</p>
                          <p className="text-gray-400 text-xs mt-1">Waiting for signals...</p>
                        </div>
                      ) : (
                        openTradesByStrategy.map(group => (
                          <div key={group.deployment.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-semibold text-gray-500 uppercase">{group.deployment.strategyName}</h4>
                              <span className={`text-xs font-bold ${group.pnl.openPnL >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {group.pnl.openPnL >= 0 ? '+' : ''}${group.pnl.openPnL.toFixed(2)}
                              </span>
                            </div>
                            {group.trades.map(trade => {
                              const position = positions.find(p => p.symbol === trade.symbol)
                              const currentPnL = position
                                ? (trade.side === 'buy'
                                    ? (position.currentPrice - trade.entryPrice) * trade.quantity
                                    : (trade.entryPrice - position.currentPrice) * trade.quantity)
                                : 0
                              return (
                                <div key={trade.id} className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${trade.side === 'buy' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                        {trade.side.toUpperCase()}
                                      </span>
                                      <span className="font-semibold text-sm">{trade.symbol}</span>
                                      <span className="text-xs text-gray-400">x{trade.quantity}</span>
                                    </div>
                                    <span className={`text-sm font-bold ${currentPnL >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                      {currentPnL >= 0 ? '+' : ''}${currentPnL.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                                    <span>Entry: ${trade.entryPrice.toFixed(2)}</span>
                                    <span>Current: ${position?.currentPrice?.toFixed(2) || '-'}</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ))
                      )
                    ) : (
                      // Closed Positions
                      closedTradesByStrategy.length === 0 ? (
                        <div className="text-center py-6">
                          <TrendingDown className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">No closed trades yet</p>
                        </div>
                      ) : (
                        closedTradesByStrategy.map(group => (
                          <div key={group.deployment.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-semibold text-gray-500 uppercase">{group.deployment.strategyName}</h4>
                              <span className={`text-xs font-bold ${group.pnl.closedPnL >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {group.pnl.closedPnL >= 0 ? '+' : ''}${group.pnl.closedPnL.toFixed(2)}
                              </span>
                            </div>
                            {group.trades.map(trade => (
                              <div key={trade.id} className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${trade.pnl >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                      {trade.pnl >= 0 ? 'WIN' : 'LOSS'}
                                    </span>
                                    <span className="font-semibold text-sm">{trade.symbol}</span>
                                  </div>
                                  <span className={`text-sm font-bold ${trade.pnl >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                    {trade.pnl >= 0 ? '+' : ''}${trade.pnl?.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                                  <span>Entry: ${trade.entryPrice.toFixed(2)}</span>
                                  <span>Exit: ${trade.exitPrice?.toFixed(2)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))
                      )
                    )}

                    {/* Total P&L Summary */}
                    {(openTradesByStrategy.length > 0 || closedTradesByStrategy.length > 0) && (
                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Total P&L</span>
                          <span className={`text-lg font-bold ${totalPnL >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Challenges & Tournaments Section */}
      <div className="p-4 space-y-6">
        {/* Challenges Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Daily Challenges
            </h3>
            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
              <Clock className="w-3.5 h-3.5" />
              Resets in 8h
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {challenges.map(challenge => {
              const isComplete = challenge.progress >= challenge.target
              const progress = Math.min((challenge.progress / challenge.target) * 100, 100)
              const hasAction = challenge.action && !isComplete

              return (
                <div
                  key={challenge.id}
                  onClick={hasAction ? challenge.action : undefined}
                  className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${
                    isComplete
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : hasAction
                        ? 'border-gray-100 hover:border-indigo-200 hover:shadow-md cursor-pointer active:scale-[0.98]'
                        : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <challenge.icon className={`w-5 h-5 shrink-0 mt-0.5 ${
                      isComplete ? 'text-emerald-500' : hasAction ? 'text-indigo-500' : 'text-gray-400'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900 text-sm">{challenge.title}</h4>
                        <span className="text-sm font-semibold text-amber-500">+{challenge.reward}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className={`h-full rounded-full ${
                              isComplete ? 'bg-emerald-500' : 'bg-indigo-500'
                            }`}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {challenge.progress}/{challenge.target}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isComplete ? (
                    <button className="w-full mt-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm rounded-xl transition-colors">
                      Claim Reward
                    </button>
                  ) : hasAction && (
                    <div className="mt-3 flex items-center justify-center gap-1.5 text-indigo-600 text-sm font-medium">
                      <span>Tap to start</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Tournaments Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-1">
            Active Tournaments
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tournaments.map(tournament => (
              <div
                key={tournament.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <h4 className="font-semibold text-gray-900">{tournament.name}</h4>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {tournament.participants}
                      </span>
                      <span className="flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5" />
                        {tournament.endsIn}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-500">
                      ${tournament.prize.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Prize Pool</p>
                  </div>
                </div>

                <button
                  className={`w-full py-2.5 font-medium text-sm rounded-xl transition-colors ${
                    tournament.joined
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-indigo-500 text-white hover:bg-indigo-600'
                  }`}
                >
                  {tournament.joined ? 'View Leaderboard' : 'Join Tournament'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TradeStation

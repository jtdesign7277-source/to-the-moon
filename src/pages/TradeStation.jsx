import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import {
  Rocket, Zap, Trophy, Target, TrendingUp,
  Flame, Star, Crown, Award, Clock,
  Play, ChevronRight, ChevronDown, ArrowUpRight,
  Share2, Copy, Check, X, Pause, Trash2,
  Sparkles, Send, Users, Timer, FolderOpen, Folder
} from 'lucide-react'
import { useApp } from '../hooks/useApp'
import { useTrading } from '../contexts/TradingContext'
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

// Progress ring component
const ProgressRing = ({ progress, size = 48, strokeWidth = 4, children }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-gray-100"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-indigo-500 transition-all duration-500"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}

// Main Trade Station Component
const TradeStation = () => {
  const { isPro, tradingMode } = useApp()
  const {
    strategies: savedStrategies,
    deployedStrategies,
    portfolio,
    positions,
    placeOrder,
    refreshData,
    deleteStrategy,
    pauseStrategy,
    resumeStrategy,
    stopStrategy,
    deployStrategy,
  } = useTrading()

  const [activeTab, setActiveTab] = useState('build')
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationProfit, setCelebrationProfit] = useState(0)
  const [showShareSheet, setShowShareSheet] = useState(false)
  const [copied, setCopied] = useState(false)

  // Collapsible folder states
  const [isStrategiesFolderOpen, setIsStrategiesFolderOpen] = useState(true)
  const [isDeployedFolderOpen, setIsDeployedFolderOpen] = useState(true)

  // User stats
  const stats = {
    coins: 1250,
  }

  // Challenges
  const challenges = [
    { id: 1, title: 'Build 3 strategies', progress: 2, target: 3, reward: 50, icon: Sparkles },
    { id: 2, title: 'Achieve 10% backtest profit', progress: 8, target: 10, reward: 100, icon: Target },
    { id: 3, title: 'Share a winning strategy', progress: 0, target: 1, reward: 25, icon: Share2 },
  ]

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

  const tabs = [
    { id: 'build', label: 'Build' },
    { id: 'challenges', label: 'Challenges' },
    { id: 'compete', label: 'Compete' },
  ]

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

      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trade Station</h1>
              <p className="text-gray-500 text-sm">Build, test, and deploy strategies</p>
            </div>
            <div className="mr-4">
              <StatPill icon={Star} value={stats.coins} color="indigo" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-3">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {/* Build Tab */}
          {activeTab === 'build' && (
            <motion.div
              key="build"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Deployed Strategies Folder */}
              {deployedStrategies.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setIsDeployedFolderOpen(!isDeployedFolderOpen)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        {isDeployedFolderOpen ? (
                          <FolderOpen className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Folder className="w-5 h-5 text-emerald-600" />
                        )}
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">Active Strategies</h3>
                        <p className="text-xs text-gray-500">{deployedStrategies.length} running</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isDeployedFolderOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isDeployedFolderOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3">
                          {deployedStrategies.map(deployment => (
                            <motion.div
                              key={deployment.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${deployment.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-500'}`} />
                                    <h4 className="font-semibold text-gray-900">{deployment.strategyName}</h4>
                                    {deployment.status === 'active' && (
                                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        Scanning
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {deployment.mode === 'paper' ? 'Paper Trading' : 'Live Trading'} • {deployment.trades || 0} trades
                                  </p>
                                  {deployment.strategy?.symbol && (
                                    <p className="text-xs text-indigo-600 mt-0.5">
                                      Watching: {deployment.strategy.symbol}
                                    </p>
                                  )}
                                </div>
                                <div className={`text-lg font-bold ${(deployment.pnl || 0) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                  {(deployment.pnl || 0) >= 0 ? '+' : ''}{(deployment.pnl || 0).toFixed(1)}%
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {deployment.status === 'active' ? (
                                  <button
                                    onClick={() => pauseStrategy(deployment.id)}
                                    className="flex-1 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-medium text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5"
                                  >
                                    <Pause className="w-4 h-4" />
                                    Pause
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => resumeStrategy(deployment.id)}
                                    className="flex-1 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-medium text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5"
                                  >
                                    <Play className="w-4 h-4" />
                                    Resume
                                  </button>
                                )}
                                <button
                                  onClick={() => stopStrategy(deployment.id)}
                                  className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Saved Strategies Folder */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setIsStrategiesFolderOpen(!isStrategiesFolderOpen)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                      {isStrategiesFolderOpen ? (
                        <FolderOpen className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <Folder className="w-5 h-5 text-indigo-600" />
                      )}
                    </div>
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
                      <div className="px-4 pb-4 space-y-3">
                        {savedStrategies.length === 0 ? (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                              <Sparkles className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 text-sm">No strategies yet</p>
                            <p className="text-gray-400 text-xs mt-1">Create one in Alpha Lab</p>
                          </div>
                        ) : (
                          savedStrategies.map(strategy => {
                            const isDeployed = deployedStrategies.some(d => d.strategyId === strategy.id)
                            return (
                              <motion.div
                                key={strategy.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-200 transition-colors"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-gray-900">{strategy.name}</h4>
                                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-xs font-medium rounded">
                                        {strategy.symbol || 'SPY'}
                                      </span>
                                      {isDeployed && (
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-xs font-medium rounded flex items-center gap-1">
                                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                          Live
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                      {strategy.interpretation || strategy.description || 'Custom strategy'}
                                    </p>
                                    {strategy.backtestResults && (
                                      <div className="flex items-center gap-3 mt-2 text-xs">
                                        <span className={`font-medium ${strategy.backtestResults.totalReturn >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                          {strategy.backtestResults.totalReturn >= 0 ? '+' : ''}{strategy.backtestResults.totalReturn?.toFixed(1)}% return
                                        </span>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-gray-500">{strategy.backtestResults.winRate?.toFixed(0)}% win rate</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  {!isDeployed ? (
                                    <button
                                      onClick={async () => {
                                        const result = await deployStrategy(strategy, tradingMode)
                                        if (result && strategy.backtestResults?.totalReturn > 0) {
                                          setCelebrationProfit(strategy.backtestResults.totalReturn)
                                          setShowCelebration(true)
                                        }
                                      }}
                                      className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5"
                                    >
                                      <Play className="w-4 h-4" />
                                      Deploy
                                    </button>
                                  ) : (
                                    <button
                                      disabled
                                      className="flex-1 py-2 bg-gray-100 text-gray-400 font-medium text-sm rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5"
                                    >
                                      <Check className="w-4 h-4" />
                                      Deployed
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setShowShareSheet(true)}
                                    className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors"
                                  >
                                    <Share2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteStrategy(strategy.id)}
                                    className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </motion.div>
                            )
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Challenges Tab */}
          {activeTab === 'challenges' && (
            <motion.div
              key="challenges"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Daily Challenges
                </h3>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  Resets in 8h
                </div>
              </div>

              <div className="space-y-3">
                {challenges.map(challenge => {
                  const isComplete = challenge.progress >= challenge.target
                  const progress = Math.min((challenge.progress / challenge.target) * 100, 100)

                  return (
                    <div
                      key={challenge.id}
                      className={`bg-white rounded-2xl p-4 shadow-sm border ${
                        isComplete ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isComplete
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          <challenge.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-gray-900">{challenge.title}</h4>
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
                      {isComplete && (
                        <button className="w-full mt-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm rounded-xl transition-colors">
                          Claim Reward
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Badges Preview */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Badges</h3>
                  <button className="text-sm text-indigo-600 font-medium flex items-center gap-1">
                    View all <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-3">
                  {[
                    { icon: Rocket, name: 'First Launch', earned: true },
                    { icon: Trophy, name: 'Winner', earned: true },
                    { icon: Flame, name: 'Hot Streak', earned: false },
                    { icon: Crown, name: 'Champion', earned: false },
                  ].map((badge, i) => (
                    <div
                      key={i}
                      className={`flex-1 p-3 rounded-xl text-center ${
                        badge.earned
                          ? 'bg-gradient-to-br from-indigo-50 to-purple-50'
                          : 'bg-gray-50 opacity-50'
                      }`}
                    >
                      <badge.icon className={`w-6 h-6 mx-auto mb-1 ${
                        badge.earned ? 'text-indigo-500' : 'text-gray-400'
                      }`} />
                      <p className="text-xs font-medium text-gray-600 truncate">{badge.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Compete Tab */}
          {activeTab === 'compete' && (
            <motion.div
              key="compete"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-1">
                Active Tournaments
              </h3>

              <div className="space-y-3">
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

              {/* Create Tournament CTA */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-center text-white">
                <Award className="w-10 h-10 mx-auto mb-3 opacity-90" />
                <h3 className="font-semibold text-lg mb-1">Host a Tournament</h3>
                <p className="text-sm text-white/70 mb-4">
                  Create private competitions with friends
                </p>
                <button className="px-6 py-2.5 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                  Create Tournament
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default TradeStation

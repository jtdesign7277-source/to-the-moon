import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import {
  Rocket, Zap, Trophy, Target, TrendingUp, TrendingDown,
  Flame, Star, Crown, Award, Gift, Calendar, Clock,
  Play, Pause, ChevronRight, ArrowUpRight, ArrowDownRight,
  Share2, Copy, Twitter, MessageCircle, Check, X,
  Sparkles, BarChart3, Activity, Lightbulb, Send,
  Lock, Users, Timer, Coins, Medal, Shield, Swords
} from 'lucide-react'
import { useApp } from '../hooks/useApp'

// Animated counter component
const AnimatedNumber = ({ value, prefix = '', suffix = '', decimals = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const duration = 1000
    const steps = 60
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(current)
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])

  return <span>{prefix}{displayValue.toFixed(decimals)}{suffix}</span>
}

// Jackpot explosion animation
const JackpotExplosion = ({ show, amount, onComplete }) => {
  useEffect(() => {
    if (show) {
      // Fire confetti
      const count = 200
      const defaults = { origin: { y: 0.7 }, zIndex: 9999 }

      function fire(particleRatio, opts) {
        confetti({
          ...defaults,
          particleCount: Math.floor(count * particleRatio),
          spread: 26,
          startVelocity: 55,
          ...opts
        })
      }

      fire(0.25, { spread: 26, startVelocity: 55 })
      fire(0.2, { spread: 60 })
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
      fire(0.1, { spread: 120, startVelocity: 45 })

      setTimeout(onComplete, 3000)
    }
  }, [show, onComplete])

  if (!show) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        className="text-center"
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="text-8xl mb-4"
        >
          🚀
        </motion.div>
        <motion.h1
          className="text-5xl font-black text-white mb-2"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.3, repeat: Infinity }}
        >
          JACKPOT!
        </motion.h1>
        <motion.p
          className="text-6xl font-black bg-gradient-to-r from-yellow-400 via-green-400 to-emerald-500 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          +${amount.toLocaleString()}
        </motion.p>
      </motion.div>
    </motion.div>
  )
}

// Badge component with glow effect
const Badge = ({ icon: Icon, name, earned, description, rarity = 'common' }) => {
  const rarityColors = {
    common: 'from-gray-400 to-gray-600',
    rare: 'from-blue-400 to-indigo-600',
    epic: 'from-purple-400 to-pink-600',
    legendary: 'from-yellow-400 to-orange-600',
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer ${
        earned
          ? `bg-gradient-to-br ${rarityColors[rarity]} border-transparent shadow-lg`
          : 'bg-gray-800/50 border-gray-700/50 opacity-50'
      }`}
    >
      {earned && rarity === 'legendary' && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/20 to-orange-400/20"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      <div className="relative flex flex-col items-center text-center">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${
          earned ? 'bg-white/20' : 'bg-gray-700/50'
        }`}>
          <Icon className={`w-6 h-6 ${earned ? 'text-white' : 'text-gray-500'}`} />
        </div>
        <p className={`text-sm font-bold ${earned ? 'text-white' : 'text-gray-500'}`}>{name}</p>
        <p className={`text-xs mt-1 ${earned ? 'text-white/70' : 'text-gray-600'}`}>{description}</p>
      </div>
      {!earned && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Lock className="w-8 h-8 text-gray-600" />
        </div>
      )}
    </motion.div>
  )
}

// Daily Challenge Card
const DailyChallenge = ({ challenge, progress, onClaim }) => {
  const isComplete = progress >= challenge.target

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`p-4 rounded-2xl border-2 transition-all ${
        isComplete
          ? 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-500/50'
          : 'bg-gray-800/30 border-gray-700/50'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isComplete ? 'bg-emerald-500' : 'bg-gray-700'
          }`}>
            {challenge.icon}
          </div>
          <div>
            <p className="font-bold text-white">{challenge.title}</p>
            <p className="text-sm text-gray-400">{challenge.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 rounded-full">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-bold text-yellow-400">+{challenge.reward}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((progress / challenge.target) * 100, 100)}%` }}
          className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-indigo-500'}`}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">
          {progress} / {challenge.target} {challenge.unit}
        </span>
        {isComplete && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClaim}
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-colors"
          >
            Claim Reward
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

// Tournament Card
const TournamentCard = ({ tournament, onJoin }) => {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const end = new Date(tournament.endDate)
      const diff = end - now

      if (diff <= 0) {
        setTimeLeft('Ended')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      setTimeLeft(`${hours}h ${minutes}m`)
    }

    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [tournament.endDate])

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 p-5"
    >
      {/* Animated background */}
      <div className="absolute inset-0 opacity-30">
        <motion.div
          className="absolute w-40 h-40 bg-indigo-500 rounded-full blur-3xl"
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
                {tournament.type}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white">{tournament.name}</h3>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              ${tournament.prizePool.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">Prize Pool</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1.5 text-gray-300">
            <Users className="w-4 h-4" />
            <span>{tournament.participants} joined</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-300">
            <Timer className="w-4 h-4" />
            <span>{timeLeft}</span>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onJoin}
          className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/30"
        >
          {tournament.joined ? 'View Leaderboard' : 'Join Tournament'}
        </motion.button>
      </div>
    </motion.div>
  )
}

// Natural Language Strategy Builder
const StrategyBuilder = ({ onBuild }) => {
  const [query, setQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const inputRef = useRef(null)

  const exampleQueries = [
    "Buy when RSI < 30 and sell when RSI > 70",
    "Alert me when AAPL drops 5% in a day",
    "Trade momentum breakouts on tech stocks",
    "Copy top performer from last week's tournament",
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsProcessing(true)
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    onBuild(query)
    setIsProcessing(false)
    setQuery('')
  }

  return (
    <div className="relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-30" />
      <div className="relative bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">AI Strategy Builder</h3>
            <p className="text-sm text-gray-400">Describe your strategy in plain English</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="relative mb-4">
            <textarea
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Example: Buy SPY when it drops 2% from daily high, sell at 1% profit..."
              className="w-full h-24 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <motion.button
              type="submit"
              disabled={!query.trim() || isProcessing}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="absolute bottom-3 right-3 p-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isProcessing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Activity className="w-5 h-5 text-white" />
                </motion.div>
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </motion.button>
          </div>
        </form>

        <div className="flex flex-wrap gap-2">
          {exampleQueries.map((example, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02 }}
              onClick={() => setQuery(example)}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xs rounded-lg transition-colors border border-gray-700"
            >
              {example}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Streak Display
const StreakDisplay = ({ currentStreak, bestStreak }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-6 p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl border border-orange-500/30"
    >
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center"
        >
          <Flame className="w-6 h-6 text-white" />
        </motion.div>
        <div>
          <p className="text-3xl font-black text-white">{currentStreak}</p>
          <p className="text-sm text-gray-400">Day Streak</p>
        </div>
      </div>
      <div className="h-12 w-px bg-gray-700" />
      <div>
        <p className="text-xl font-bold text-yellow-400">{bestStreak}</p>
        <p className="text-sm text-gray-400">Best Streak</p>
      </div>
    </motion.div>
  )
}

// Level Progress
const LevelProgress = ({ level, xp, xpToNext }) => {
  const progress = (xp / xpToNext) * 100

  return (
    <div className="p-4 bg-gray-800/30 rounded-2xl border border-gray-700/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-xl font-black text-white">{level}</span>
            </div>
            <motion.div
              className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
              style={{ zIndex: -1 }}
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.3, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div>
            <p className="font-bold text-white">Level {level}</p>
            <p className="text-sm text-gray-400">{xp.toLocaleString()} / {xpToNext.toLocaleString()} XP</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-indigo-400">Next reward:</p>
          <p className="text-sm font-bold text-white">Premium Badge</p>
        </div>
      </div>

      <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1 }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
        />
        <motion.div
          className="absolute inset-y-0 left-0 bg-white/20 rounded-full"
          style={{ width: `${progress}%` }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
    </div>
  )
}

// Backtest Result Card
const BacktestResult = ({ result, onDeploy, onShare }) => {
  const isProfitable = result.profit > 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-5 rounded-2xl border-2 ${
        isProfitable
          ? 'bg-gradient-to-br from-emerald-900/30 to-green-900/30 border-emerald-500/30'
          : 'bg-gradient-to-br from-red-900/30 to-orange-900/30 border-red-500/30'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-bold text-white mb-1">{result.name}</h4>
          <p className="text-sm text-gray-400">{result.description}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-bold ${
          isProfitable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {isProfitable ? '+' : ''}{result.profit.toFixed(2)}%
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-2 bg-gray-800/50 rounded-lg">
          <p className="text-lg font-bold text-white">{result.winRate}%</p>
          <p className="text-xs text-gray-400">Win Rate</p>
        </div>
        <div className="text-center p-2 bg-gray-800/50 rounded-lg">
          <p className="text-lg font-bold text-white">{result.trades}</p>
          <p className="text-xs text-gray-400">Trades</p>
        </div>
        <div className="text-center p-2 bg-gray-800/50 rounded-lg">
          <p className="text-lg font-bold text-white">{result.sharpe}</p>
          <p className="text-xs text-gray-400">Sharpe</p>
        </div>
      </div>

      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onDeploy}
          className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold rounded-xl transition-all"
        >
          <Rocket className="w-4 h-4 inline mr-2" />
          Deploy Strategy
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onShare}
          className="p-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors"
        >
          <Share2 className="w-5 h-5 text-white" />
        </motion.button>
      </div>
    </motion.div>
  )
}

// Share Modal
const ShareModal = ({ show, onClose, result }) => {
  const [copied, setCopied] = useState(false)

  const shareUrl = `https://to-the-moon.app/strategy/${result?.id || 'demo'}`

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!show) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Share Your Win</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-xl border border-emerald-500/30 mb-6">
          <p className="text-center text-sm text-gray-400 mb-1">Strategy Performance</p>
          <p className="text-center text-3xl font-black text-emerald-400">+{result?.profit || 24.5}%</p>
        </div>

        <div className="flex gap-3 mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 py-3 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white font-bold rounded-xl flex items-center justify-center gap-2"
          >
            <Twitter className="w-5 h-5" />
            Twitter
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 py-3 bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold rounded-xl flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            Discord
          </motion.button>
        </div>

        <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-xl">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-1 bg-transparent text-gray-400 text-sm outline-none"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            className="p-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Main Trade Station Component
const TradeStation = () => {
  const { user, isPro } = useApp()
  const [activeTab, setActiveTab] = useState('build')
  const [showJackpot, setShowJackpot] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [selectedResult, setSelectedResult] = useState(null)

  // Mock data
  const [userStats, setUserStats] = useState({
    level: 12,
    xp: 2450,
    xpToNext: 3000,
    currentStreak: 7,
    bestStreak: 15,
    totalWins: 47,
    coins: 1250,
  })

  const [badges, setBadges] = useState([
    { icon: Rocket, name: 'First Launch', description: 'Deploy your first strategy', earned: true, rarity: 'common' },
    { icon: Trophy, name: 'Winner', description: 'Win a tournament', earned: true, rarity: 'rare' },
    { icon: Flame, name: 'Hot Streak', description: '10 day login streak', earned: false, rarity: 'rare' },
    { icon: Crown, name: 'Champion', description: 'Reach #1 on leaderboard', earned: false, rarity: 'legendary' },
    { icon: Target, name: 'Sharpshooter', description: '80% win rate in 50 trades', earned: true, rarity: 'epic' },
    { icon: Star, name: 'Rising Star', description: 'Reach level 10', earned: true, rarity: 'common' },
    { icon: Shield, name: 'Risk Manager', description: 'Never lose more than 5%', earned: false, rarity: 'epic' },
    { icon: Swords, name: 'Battle Tested', description: 'Complete 100 backtests', earned: false, rarity: 'rare' },
  ])

  const [dailyChallenges, setDailyChallenges] = useState([
    { id: 1, title: 'Quick Builder', description: 'Create 3 strategies', target: 3, unit: 'strategies', reward: 50, icon: <Zap className="w-5 h-5 text-white" /> },
    { id: 2, title: 'Profit Hunter', description: 'Achieve 10% profit in backtest', target: 10, unit: '% profit', reward: 100, icon: <Target className="w-5 h-5 text-white" /> },
    { id: 3, title: 'Social Butterfly', description: 'Share a winning strategy', target: 1, unit: 'shares', reward: 25, icon: <Share2 className="w-5 h-5 text-white" /> },
  ])

  const [tournaments, setTournaments] = useState([
    { id: 1, name: 'Weekly Showdown', type: 'Weekly', prizePool: 5000, participants: 234, endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), joined: false },
    { id: 2, name: 'Momentum Masters', type: 'Special', prizePool: 10000, participants: 567, endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), joined: true },
  ])

  const [backtestResults, setBacktestResults] = useState([
    { id: 1, name: 'RSI Mean Reversion', description: 'Buy oversold, sell overbought', profit: 24.5, winRate: 68, trades: 127, sharpe: 1.8 },
    { id: 2, name: 'Momentum Breakout', description: 'Trade trend continuations', profit: -5.2, winRate: 45, trades: 89, sharpe: 0.4 },
  ])

  const [challengeProgress, setChallengeProgress] = useState({
    1: 2,
    2: 8,
    3: 0,
  })

  const handleBuild = (query) => {
    // Simulate building a strategy
    const newResult = {
      id: Date.now(),
      name: 'AI Generated Strategy',
      description: query.substring(0, 50) + '...',
      profit: Math.random() * 40 - 10,
      winRate: Math.floor(Math.random() * 30 + 50),
      trades: Math.floor(Math.random() * 100 + 50),
      sharpe: (Math.random() * 2).toFixed(1),
    }
    setBacktestResults([newResult, ...backtestResults])
  }

  const handleDeploy = (result) => {
    if (result.profit > 15) {
      setShowJackpot(true)
    }
  }

  const handleShare = (result) => {
    setSelectedResult(result)
    setShowShare(true)
  }

  const handleClaimChallenge = (challengeId) => {
    const challenge = dailyChallenges.find(c => c.id === challengeId)
    setUserStats(prev => ({
      ...prev,
      coins: prev.coins + challenge.reward,
      xp: prev.xp + challenge.reward * 2,
    }))
  }

  const tabs = [
    { id: 'build', label: 'Build', icon: Sparkles },
    { id: 'challenges', label: 'Challenges', icon: Target },
    { id: 'tournaments', label: 'Tournaments', icon: Trophy },
    { id: 'badges', label: 'Badges', icon: Award },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-20">
      {/* Jackpot Animation */}
      <AnimatePresence>
        {showJackpot && (
          <JackpotExplosion
            show={showJackpot}
            amount={Math.floor(Math.random() * 5000 + 1000)}
            onComplete={() => setShowJackpot(false)}
          />
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShare && (
          <ShareModal
            show={showShare}
            onClose={() => setShowShare(false)}
            result={selectedResult}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Trade Station
            </h1>
            <p className="text-gray-400">Build • Scan • Go</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-4 py-2 bg-yellow-500/20 rounded-full">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="font-bold text-yellow-400">{userStats.coins.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Level & Streak */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <LevelProgress level={userStats.level} xp={userStats.xp} xpToNext={userStats.xpToNext} />
          <StreakDisplay currentStreak={userStats.currentStreak} bestStreak={userStats.bestStreak} />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-gray-800/50 rounded-xl mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-indigo-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6">
        <AnimatePresence mode="wait">
          {activeTab === 'build' && (
            <motion.div
              key="build"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <StrategyBuilder onBuild={handleBuild} />

              <div>
                <h3 className="text-lg font-bold text-white mb-4">Recent Backtests</h3>
                <div className="grid gap-4">
                  {backtestResults.map(result => (
                    <BacktestResult
                      key={result.id}
                      result={result}
                      onDeploy={() => handleDeploy(result)}
                      onShare={() => handleShare(result)}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'challenges' && (
            <motion.div
              key="challenges"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white">Daily Challenges</h3>
                <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Resets in 8h 23m</span>
                </div>
              </div>

              {dailyChallenges.map(challenge => (
                <DailyChallenge
                  key={challenge.id}
                  challenge={challenge}
                  progress={challengeProgress[challenge.id]}
                  onClaim={() => handleClaimChallenge(challenge.id)}
                />
              ))}
            </motion.div>
          )}

          {activeTab === 'tournaments' && (
            <motion.div
              key="tournaments"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-bold text-white mb-4">Active Tournaments</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {tournaments.map(tournament => (
                  <TournamentCard
                    key={tournament.id}
                    tournament={tournament}
                    onJoin={() => {}}
                  />
                ))}
              </div>

              <div className="p-6 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-2xl border border-indigo-500/20 text-center">
                <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                <h4 className="text-xl font-bold text-white mb-2">Create Your Own Tournament</h4>
                <p className="text-gray-400 mb-4">Host a private tournament with friends and set custom rules</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors"
                >
                  Create Tournament
                </motion.button>
              </div>
            </motion.div>
          )}

          {activeTab === 'badges' && (
            <motion.div
              key="badges"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Your Badges</h3>
                <span className="text-sm text-gray-400">
                  {badges.filter(b => b.earned).length} / {badges.length} earned
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {badges.map((badge, i) => (
                  <Badge key={i} {...badge} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default TradeStation

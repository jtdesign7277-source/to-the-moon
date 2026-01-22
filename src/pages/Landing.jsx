import { useState, useEffect } from 'react'
import {
  Rocket,
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  Users,
  CheckCircle,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Calendar,
  Target,
  BookOpen,
  LineChart,
  Play,
  Settings,
  ChevronDown,
  Check,
  Star,
} from 'lucide-react'
import { trackWaitlistSignup } from '../utils/analytics'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Animated counter hook for stats
function useAnimatedCounter(target, duration = 2000) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    if (hasAnimated) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasAnimated(true)
          let start = 0
          const increment = target / (duration / 16)
          const timer = setInterval(() => {
            start += increment
            if (start >= target) {
              setCount(target)
              clearInterval(timer)
            } else {
              setCount(Math.floor(start))
            }
          }, 16)
        }
      },
      { threshold: 0.5 }
    )

    const element = document.getElementById('stats-section')
    if (element) observer.observe(element)

    return () => observer.disconnect()
  }, [target, duration, hasAnimated])

  return count
}

// FAQ Accordion Item
function FAQItem({ question, answer, isOpen, onClick }) {
  return (
    <div className="border-b border-gray-800">
      <button
        onClick={onClick}
        className="w-full py-5 flex items-center justify-between text-left hover:text-indigo-400 transition-colors"
      >
        <span className="text-lg font-medium text-white">{question}</span>
        <div className={`w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center transition-transform ${isOpen ? 'rotate-45' : ''}`}>
          <span className="text-white text-xl leading-none">+</span>
        </div>
      </button>
      {isOpen && (
        <div className="pb-5 text-gray-400 leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  )
}

export default function Landing({ onEnterApp, onLegal }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [realWaitlistCount, setRealWaitlistCount] = useState(500)
  const [openFAQ, setOpenFAQ] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/api/waitlist/count`)
      .then(res => res.json())
      .then(data => setRealWaitlistCount(data.count || 500))
      .catch(() => {})
  }, [])

  const waitlistCount = useAnimatedCounter(realWaitlistCount)
  const volumeCount = useAnimatedCounter(2)
  const strategiesCount = useAnimatedCounter(50)
  const winRateCount = useAnimatedCounter(67)

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address')
      setStatus('error')
      return
    }
    setStatus('loading')
    setErrorMessage('')

    try {
      const response = await fetch(`${API_URL}/api/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (response.ok) {
        trackWaitlistSignup(email)
        setStatus('success')
        setEmail('')
      } else {
        setErrorMessage(data.message || 'Something went wrong')
        setStatus('error')
      }
    } catch {
      setErrorMessage('Unable to connect. Please try again.')
      setStatus('error')
    }
  }

  const faqs = [
    {
      question: 'Does To The Moon trade for me?',
      answer: 'Yes! You can create automated trading strategies that execute trades on your behalf based on the rules you define. You maintain full control and can stop strategies at any time.',
    },
    {
      question: 'How will To The Moon help me as a trader?',
      answer: 'Our platform helps you discover your best trading setups through analytics, improve risk management with built-in tools, and automate your strategies to remove emotional trading decisions.',
    },
    {
      question: 'Is my trading data secure?',
      answer: 'Absolutely. We use bank-level encryption and never store your exchange API secret keys on our servers. All connections are secured with TLS 1.3.',
    },
    {
      question: 'What markets can I trade?',
      answer: 'We currently support Kalshi, Polymarket, and Manifold prediction markets. Stock and crypto integrations are on our roadmap.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#0a0b14] overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0b14]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">To The Moon</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm">Features</a>
              <a href="#how-it-helps" className="text-gray-400 hover:text-white transition-colors text-sm">Benefits</a>
              <a href="#integrations" className="text-gray-400 hover:text-white transition-colors text-sm">Integrations</a>
              <a href="#faq" className="text-gray-400 hover:text-white transition-colors text-sm">FAQ</a>
            </div>
            <button
              onClick={onEnterApp}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-2"
            >
              Get Started <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Animated Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-full px-5 py-2.5 mb-8">
              <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
              <span className="text-sm text-indigo-300 font-medium">Now in Early Beta • Limited Spots Available</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-[1.1]">
              Automate Your Trades.
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Maximize Your Edge.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              The all-in-one platform for prediction market trading. Build strategies, 
              track performance, and execute trades automatically across Kalshi, Polymarket, and more.
            </p>

            {/* Waitlist Form */}
            <div className="max-w-lg mx-auto">
              {status === 'success' ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-1">You're on the list!</h3>
                  <p className="text-gray-400 text-sm">We'll notify you when early access is available.</p>
                </div>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
                  >
                    {status === 'loading' ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Join Waitlist <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              )}
              {status === 'error' && <p className="mt-3 text-red-400 text-sm">{errorMessage}</p>}
              <p className="mt-4 text-gray-500 text-sm">
                ✨ Join {realWaitlistCount}+ traders already on the waitlist
              </p>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b14] via-transparent to-transparent z-10 pointer-events-none" />
            <div className="relative bg-gradient-to-br from-indigo-900/30 to-purple-900/20 rounded-2xl border border-white/10 p-2 shadow-2xl shadow-indigo-500/10">
              <div className="bg-[#0f1019] rounded-xl overflow-hidden">
                {/* Mock Dashboard Header */}
                <div className="bg-[#13141f] px-6 py-4 border-b border-white/5 flex items-center gap-4">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-white/5 rounded-lg px-4 py-1.5 text-sm text-gray-400">
                      app.tothemoon.trading
                    </div>
                  </div>
                </div>
                {/* Mock Dashboard Content */}
                <div className="p-6 grid grid-cols-3 gap-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Net P&L</p>
                    <p className="text-2xl font-bold text-green-400">+$5,284.32</p>
                    <div className="mt-2 flex items-center gap-1 text-xs text-green-400">
                      <TrendingUp className="w-3 h-3" /> +12.4% this month
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Win Rate</p>
                    <p className="text-2xl font-bold text-white">67.2%</p>
                    <div className="mt-2 flex items-center gap-1 text-xs text-indigo-400">
                      <Target className="w-3 h-3" /> Above average
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Active Strategies</p>
                    <p className="text-2xl font-bold text-white">4</p>
                    <div className="mt-2 flex items-center gap-1 text-xs text-purple-400">
                      <Zap className="w-3 h-3" /> Running 24/7
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Helps Section (TradeZella-style) */}
      <section id="how-it-helps" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0d0e18]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              How To The Moon Helps You
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Powerful tools designed to transform your prediction market trading
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BarChart3,
                title: 'Improve Your Risk Management',
                description: 'Use position sizing, stop-losses, and analytics to protect your capital and trade smarter.',
              },
              {
                icon: Target,
                title: 'Stop Trading With Hesitation',
                description: 'Automate your strategies and remove emotional decision-making from your trades.',
              },
              {
                icon: TrendingUp,
                title: 'Recover After a Trading Loss',
                description: 'Losses are normal. Use our journaling tools to learn from mistakes and come back stronger.',
              },
              {
                icon: Calendar,
                title: 'Discover Your Best Trading Days',
                description: 'Our calendar view shows your P&L patterns. Focus on what works, avoid what doesn\'t.',
              },
              {
                icon: LineChart,
                title: 'Understand Your Best Setups',
                description: 'Tag and rate your trades to identify which strategies consistently make you money.',
              },
              {
                icon: Settings,
                title: 'Scale Up Your Trading Fast',
                description: 'Clone winning strategies, increase position sizes, and grow your portfolio with confidence.',
              },
            ].map((item, index) => (
              <div key={index} className="bg-[#12131f] rounded-2xl p-8 border border-white/5 hover:border-indigo-500/30 transition-all group">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <item.icon className="w-7 h-7 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Everything In One Location Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div>
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-6">
                <BookOpen className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Focus on what matters through powerful journaling
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Stay on top of your trading performance with our comprehensive journal. 
                Store your data, track goals, monitor important KPIs, and more.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  'Analytics dashboard',
                  'Advanced filtering',
                  'Calendar view',
                  'Profitability charts',
                  'Notes & comments',
                  'Winning percentage',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={onEnterApp}
                className="mt-8 inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Learn More <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Right - Dashboard Preview */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-3xl blur-2xl" />
              <div className="relative bg-[#12131f] rounded-2xl border border-white/10 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-semibold">Dashboard</h3>
                  <span className="text-gray-500 text-sm">Good morning!</span>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Net P&L</p>
                    <p className="text-lg font-bold text-green-400">$5,185.41</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Profit Factor</p>
                    <p className="text-lg font-bold text-white">1.44</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Win Rate</p>
                    <p className="text-lg font-bold text-white">57.14%</p>
                  </div>
                </div>
                {/* Mini Calendar Preview */}
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="grid grid-cols-7 gap-2 text-center text-xs">
                    {['S','M','T','W','T','F','S'].map((d, i) => (
                      <div key={i} className="text-gray-500 py-1">{d}</div>
                    ))}
                    {[...Array(35)].map((_, i) => {
                      const colors = ['bg-green-500/30', 'bg-red-500/30', 'bg-transparent', 'bg-green-500/20']
                      return (
                        <div key={i} className={`py-2 rounded ${colors[i % 4]}`}>
                          <span className="text-gray-400 text-xs">{i + 1 <= 31 ? i + 1 : ''}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats-section" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0d0e18]">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                {waitlistCount}+
              </div>
              <div className="text-gray-400 font-medium">Beta Waitlist</div>
            </div>
            <div className="text-center">
              <div className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                ${volumeCount}M+
              </div>
              <div className="text-gray-400 font-medium">Paper Traded Volume</div>
            </div>
            <div className="text-center">
              <div className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                {strategiesCount}+
              </div>
              <div className="text-gray-400 font-medium">Strategy Templates</div>
            </div>
            <div className="text-center">
              <div className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent mb-2">
                {winRateCount}%
              </div>
              <div className="text-gray-400 font-medium">Avg. User Win Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Reporting Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Report Preview */}
            <div className="relative order-2 lg:order-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-3xl blur-2xl" />
              <div className="relative bg-[#12131f] rounded-2xl border border-white/10 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-semibold">Reports</h3>
                  <div className="flex gap-2">
                    {['Overview', 'Detailed', 'Calendar'].map((tab, i) => (
                      <button key={i} className={`px-3 py-1 rounded text-xs ${i === 0 ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}>
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Day of Week Chart */}
                <div className="space-y-3">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, i) => (
                    <div key={day} className="flex items-center gap-3">
                      <span className="text-gray-400 text-sm w-20">{day}</span>
                      <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${i === 1 ? 'bg-green-500' : i === 3 ? 'bg-red-500' : 'bg-indigo-500'}`}
                          style={{ width: `${[65, 85, 45, 30, 70][i]}%` }}
                        />
                      </div>
                      <span className={`text-sm w-16 text-right ${i === 3 ? 'text-red-400' : 'text-green-400'}`}>
                        {i === 3 ? '-$234' : `+$${[423, 891, 234, 0, 567][i]}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="order-1 lg:order-2">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mb-6">
                <LineChart className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Reporting for your trading style
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Your reports hold all the answers to help you discover your strengths 
                and weaknesses. Different reports for all kinds of traders.
              </p>
              
              <div className="space-y-3">
                {[
                  'Best or worst trading days',
                  'Discover your strengths and weaknesses',
                  'Identify top set-ups',
                  'Track your bad habits',
                  'View your trade expectancy',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={onEnterApp}
                className="mt-8 inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Learn More <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section id="integrations" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0d0e18]">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Markets & Integrations
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-16">
            Connect your favorite prediction markets and trade from one unified platform.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12">
            {[
              { name: 'Kalshi', emoji: '🎲', color: 'from-blue-500 to-indigo-500' },
              { name: 'Polymarket', emoji: '🔮', color: 'from-purple-500 to-pink-500' },
              { name: 'Manifold', emoji: '📊', color: 'from-orange-500 to-red-500' },
              { name: 'PredictIt', emoji: '🏛️', color: 'from-green-500 to-teal-500' },
            ].map((platform, i) => (
              <div key={i} className="group flex flex-col items-center">
                <div className={`w-20 h-20 bg-gradient-to-br ${platform.color} rounded-2xl flex items-center justify-center text-4xl shadow-lg group-hover:scale-110 transition-transform cursor-pointer`}>
                  {platform.emoji}
                </div>
                <span className="mt-3 text-gray-400 font-medium">{platform.name}</span>
              </div>
            ))}
          </div>

          <p className="mt-12 text-gray-500">
            More integrations coming soon including stocks, crypto, and forex
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-12 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-0">
            {faqs.map((faq, i) => (
              <FAQItem
                key={i}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQ === i}
                onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-pink-600/20 border border-indigo-500/30 rounded-3xl p-8 sm:p-12 lg:p-16">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl" />

            <div className="relative text-center">
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm text-gray-300">Rated 5/5 by early beta users</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
                Ready to trade smarter?
              </h2>
              <p className="text-gray-400 mb-8 max-w-xl mx-auto text-lg">
                Join thousands of traders using To The Moon to automate their prediction market strategies.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={onEnterApp}
                  className="group px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-all inline-flex items-center gap-2 shadow-lg shadow-white/10 hover:shadow-white/20 hover:scale-105"
                >
                  Explore the Platform
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <span className="text-gray-500 text-sm">No credit card required</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-semibold text-white">To The Moon</span>
                <p className="text-xs text-gray-500">Automated prediction market trading</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
              <button onClick={() => onLegal?.('terms')} className="hover:text-white transition-colors">Terms of Service</button>
              <button onClick={() => onLegal?.('privacy')} className="hover:text-white transition-colors">Privacy Policy</button>
              <button onClick={() => onLegal?.('risk')} className="hover:text-white transition-colors">Risk Disclaimer</button>
              <a href="mailto:support@tothemoon.trading" className="hover:text-white transition-colors">Contact</a>
            </div>

            <p className="text-sm text-gray-500">
              © 2026 To The Moon. All rights reserved.
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-xs text-gray-600 max-w-3xl mx-auto">
              Trading prediction markets involves substantial risk & is not appropriate for everyone. 
              Only risk capital should be used for trading. Past performance is not indicative of future results.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

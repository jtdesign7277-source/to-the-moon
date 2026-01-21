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
} from 'lucide-react'
import { trackWaitlistSignup } from '../utils/analytics'
import LunaChatWidget from '../components/LunaChatWidget'

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

export default function Landing({ onEnterApp, onLegal }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('')
  const [realWaitlistCount, setRealWaitlistCount] = useState(500)

  // Fetch real waitlist count on mount
  useEffect(() => {
    fetch(`${API_URL}/api/waitlist/count`)
      .then(res => res.json())
      .then(data => setRealWaitlistCount(data.count || 500))
      .catch(() => {}) // Fallback to default on error
  }, [])

  // Animated stats
  const waitlistCount = useAnimatedCounter(realWaitlistCount)
  const volumeCount = useAnimatedCounter(2)
  const templatesCount = useAnimatedCounter(50)

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
        // Track waitlist signup in Google Analytics
        trackWaitlistSignup(email)

        setStatus('success')
        setEmail('')
      } else {
        setErrorMessage(data.message || 'Something went wrong')
        setStatus('error')
      }
    } catch (err) {
      setErrorMessage('Unable to connect. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">ToTheMoon</span>
            </div>
            <button
              onClick={onEnterApp}
              className="text-sm text-gray-300 hover:text-white transition-all flex items-center gap-1 hover:gap-2"
            >
              Enter App <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          {/* Animated Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-2 mb-8 animate-bounce-slow relative group cursor-default">
            <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-md group-hover:bg-indigo-500/30 transition-colors" />
            <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse relative z-10" />
            <span className="text-sm text-indigo-300 font-medium relative z-10">Early Beta - Limited Spots</span>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-20 blur transition-opacity" />
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Automate Your Trading
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Go To The Moon
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Build, backtest, and deploy automated trading strategies across crypto,
            prediction markets, and more. No coding required.
          </p>

          {/* Waitlist Form */}
          <div className="max-w-md mx-auto">
            {status === 'success' ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-1">You're on the list!</h3>
                <p className="text-gray-400 text-sm">
                  We'll notify you when early access is available.
                </p>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {status === 'loading' ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Join Waitlist
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
            {status === 'error' && (
              <p className="mt-3 text-red-400 text-sm">{errorMessage}</p>
            )}
            <p className="mt-4 text-gray-500 text-sm">
              Join 500+ traders already on the waitlist
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-indigo-400 text-sm font-semibold tracking-wider uppercase mb-4">Features</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Everything You Need to Trade Smarter
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Powerful tools designed to help you build profitable strategies without writing a single line of code.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: Zap,
                title: 'Visual Strategy Builder',
                description: 'Drag-and-drop interface to create complex trading strategies with ease.',
                color: 'from-yellow-500 to-orange-500',
                shadowColor: 'shadow-yellow-500/20',
              },
              {
                icon: BarChart3,
                title: 'Advanced Backtesting',
                description: 'Test your strategies against years of historical data before risking real money.',
                color: 'from-blue-500 to-cyan-500',
                shadowColor: 'shadow-blue-500/20',
              },
              {
                icon: TrendingUp,
                title: 'Multi-Market Support',
                description: 'Trade crypto, prediction markets (Kalshi, Polymarket), and more from one platform.',
                color: 'from-green-500 to-emerald-500',
                shadowColor: 'shadow-green-500/20',
              },
              {
                icon: Shield,
                title: 'Risk Management',
                description: 'Built-in stop-loss, take-profit, and position sizing to protect your capital.',
                color: 'from-red-500 to-pink-500',
                shadowColor: 'shadow-red-500/20',
              },
              {
                icon: Users,
                title: 'Strategy Marketplace',
                description: 'Browse and copy strategies from top performers on our leaderboard.',
                color: 'from-purple-500 to-violet-500',
                shadowColor: 'shadow-purple-500/20',
              },
              {
                icon: Rocket,
                title: 'Paper Trading',
                description: 'Practice with virtual money before going live. Perfect for beginners.',
                color: 'from-indigo-500 to-blue-500',
                shadowColor: 'shadow-indigo-500/20',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:border-white/20"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Hover glow effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />

                <div className={`relative w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-lg ${feature.shadowColor} group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="relative text-lg font-semibold text-white mb-2 group-hover:text-white transition-colors">{feature.title}</h3>
                <p className="relative text-gray-400 text-sm leading-relaxed">{feature.description}</p>

                {/* Bottom accent line */}
                <div className={`absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-50 transition-opacity duration-300 rounded-full`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section id="stats-section" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 lg:gap-12">
            {/* Stat 1 - Waitlist */}
            <div className="relative group text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
              <div className="relative bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-colors">
                <div className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  {waitlistCount}+
                </div>
                <div className="text-gray-400 font-medium">Beta Waitlist</div>
                <div className="mt-3 flex items-center justify-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400">Growing daily</span>
                </div>
              </div>
            </div>

            {/* Stat 2 - Volume */}
            <div className="relative group text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
              <div className="relative bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-colors">
                <div className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                  ${volumeCount}M+
                </div>
                <div className="text-gray-400 font-medium">Paper Traded Volume</div>
                <div className="mt-3 flex items-center justify-center gap-1">
                  <TrendingUp className="w-3 h-3 text-cyan-400" />
                  <span className="text-xs text-cyan-400">All-time volume</span>
                </div>
              </div>
            </div>

            {/* Stat 3 - Templates */}
            <div className="relative group text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
              <div className="relative bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-colors">
                <div className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  {templatesCount}+
                </div>
                <div className="text-gray-400 font-medium">Strategy Templates</div>
                <div className="mt-3 flex items-center justify-center gap-1">
                  <Zap className="w-3 h-3 text-pink-400" />
                  <span className="text-xs text-pink-400">Ready to deploy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-pink-600/20 border border-indigo-500/30 rounded-3xl p-8 sm:p-12 lg:p-16">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
                <Rocket className="w-4 h-4 text-indigo-400" />
                <span className="text-sm text-indigo-300">Limited beta access</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
                Ready to automate your trading?
              </h2>
              <p className="text-gray-400 mb-8 max-w-xl mx-auto text-lg">
                Join our early beta and be the first to access powerful trading automation tools.
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
      <footer className="relative py-12 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-semibold text-white">ToTheMoon</span>
                <p className="text-xs text-gray-500">Automated trading for everyone</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-400">
              <button onClick={() => onLegal?.('terms')} className="hover:text-white transition-colors">Terms</button>
              <button onClick={() => onLegal?.('privacy')} className="hover:text-white transition-colors">Privacy</button>
              <button onClick={() => onLegal?.('risk')} className="hover:text-white transition-colors">Risk Disclaimer</button>
            </div>

            <p className="text-sm text-gray-500">
              &copy; 2026 ToTheMoon. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Luna AI Chat Widget */}
      <LunaChatWidget />
    </div>
  )
}

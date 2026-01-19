import { useState } from 'react'
import {
  Rocket,
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  Users,
  CheckCircle,
  ArrowRight,
  Star,
  ChevronRight,
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function Landing({ onEnterApp }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('')

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">ToTheMoon</span>
            </div>
            <button
              onClick={onEnterApp}
              className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1"
            >
              Enter App <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-2 mb-8">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-indigo-300">Early Beta - Limited Spots</span>
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything You Need to Trade Smarter
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Powerful tools designed to help you build profitable strategies without writing a single line of code.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: 'Visual Strategy Builder',
                description: 'Drag-and-drop interface to create complex trading strategies with ease.',
                color: 'from-yellow-500 to-orange-500',
              },
              {
                icon: BarChart3,
                title: 'Advanced Backtesting',
                description: 'Test your strategies against years of historical data before risking real money.',
                color: 'from-blue-500 to-cyan-500',
              },
              {
                icon: TrendingUp,
                title: 'Multi-Market Support',
                description: 'Trade crypto, prediction markets (Kalshi, Polymarket), and more from one platform.',
                color: 'from-green-500 to-emerald-500',
              },
              {
                icon: Shield,
                title: 'Risk Management',
                description: 'Built-in stop-loss, take-profit, and position sizing to protect your capital.',
                color: 'from-red-500 to-pink-500',
              },
              {
                icon: Users,
                title: 'Strategy Marketplace',
                description: 'Browse and copy strategies from top performers on our leaderboard.',
                color: 'from-purple-500 to-violet-500',
              },
              {
                icon: Rocket,
                title: 'Paper Trading',
                description: 'Practice with virtual money before going live. Perfect for beginners.',
                color: 'from-indigo-500 to-blue-500',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            {[
              { value: '500+', label: 'Beta Waitlist' },
              { value: '$2M+', label: 'Paper Traded Volume' },
              { value: '50+', label: 'Strategy Templates' },
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 rounded-3xl p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to automate your trading?
            </h2>
            <p className="text-gray-400 mb-8">
              Join our early beta and be the first to access powerful trading automation tools.
            </p>
            <button
              onClick={onEnterApp}
              className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
            >
              Explore the Platform
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-md flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-gray-400">ToTheMoon</span>
          </div>
          <p className="text-sm text-gray-500">
            &copy; 2026 ToTheMoon. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

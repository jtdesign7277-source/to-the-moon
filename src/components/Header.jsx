import { useState, useRef, useEffect } from 'react'
import { Menu, X, Rocket, Bell, Crown, Lock, LogOut, User, ChevronDown, Trophy, ShoppingCart, BookOpen, Compass, Mail, Calendar, Send, Lightbulb, MessageCircle, Bot, UserCircle, Activity, CheckCircle, XCircle, Banknote, Clock, History } from 'lucide-react'
import { useApp } from '../hooks/useApp'
import api from '../utils/api'

// Luna Avatar - Elegant constellation of stars with slow rotation
const LunaAvatar = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-7 h-7',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }
  
  return (
    <div className={`${sizes[size]} ${className} relative`}>
      {/* Slow rotating container */}
      <div className="w-full h-full animate-spin" style={{ animationDuration: '20s' }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            {/* Soft glow filter */}
            <filter id="starGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Larger glow for main star */}
            <filter id="mainStarGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Gradient for connection lines */}
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          
          {/* Constellation connection lines */}
          <line x1="50" y1="30" x2="28" y2="55" stroke="url(#lineGradient)" strokeWidth="1" />
          <line x1="50" y1="30" x2="72" y2="55" stroke="url(#lineGradient)" strokeWidth="1" />
          <line x1="28" y1="55" x2="50" y2="78" stroke="url(#lineGradient)" strokeWidth="1" />
          <line x1="72" y1="55" x2="50" y2="78" stroke="url(#lineGradient)" strokeWidth="1" />
          <line x1="28" y1="55" x2="72" y2="55" stroke="url(#lineGradient)" strokeWidth="1" />
          
          {/* Main star - top (brightest) */}
          <circle cx="50" cy="30" r="8" fill="#c4b5fd" filter="url(#mainStarGlow)" />
          <circle cx="50" cy="30" r="5" fill="#e9d5ff" />
          <circle cx="50" cy="30" r="2.5" fill="#ffffff" />
          
          {/* Star - left */}
          <circle cx="28" cy="55" r="6" fill="#a78bfa" filter="url(#starGlow)" />
          <circle cx="28" cy="55" r="3.5" fill="#ddd6fe" />
          <circle cx="28" cy="55" r="1.5" fill="#ffffff" />
          
          {/* Star - right */}
          <circle cx="72" cy="55" r="6" fill="#a78bfa" filter="url(#starGlow)" />
          <circle cx="72" cy="55" r="3.5" fill="#ddd6fe" />
          <circle cx="72" cy="55" r="1.5" fill="#ffffff" />
          
          {/* Star - bottom */}
          <circle cx="50" cy="78" r="5" fill="#8b5cf6" filter="url(#starGlow)" />
          <circle cx="50" cy="78" r="3" fill="#c4b5fd" />
          <circle cx="50" cy="78" r="1.5" fill="#ffffff" />
          
          {/* Tiny accent stars */}
          <circle cx="38" cy="42" r="1.5" fill="#e9d5ff" opacity="0.8" />
          <circle cx="62" cy="42" r="1.5" fill="#e9d5ff" opacity="0.8" />
          <circle cx="50" cy="55" r="2" fill="#ddd6fe" opacity="0.9" />
        </svg>
      </div>
      
      {/* Pulsing outer ring (doesn't rotate) */}
      <div className="absolute inset-0">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle 
            cx="50" cy="50" r="46" 
            fill="none" 
            stroke="#8b5cf6" 
            strokeWidth="1" 
            opacity="0.3"
            className="animate-pulse"
            style={{ animationDuration: '3s' }}
          />
        </svg>
      </div>
    </div>
  )
}

const Header = ({
  navItems,
  currentPage,
  onNavigate,
  mobileMenuOpen,
  setMobileMenuOpen,
  user,
  onLogout,
}) => {
  const {
    isPro,
    tradingMode,
    setTradingMode,
    openUpgradeModal,
    openLunaChat,
  } = useApp()

  const [exploreOpen, setExploreOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [supportMessage, setSupportMessage] = useState('')
  const [suggestionMessage, setSuggestionMessage] = useState('')
  const [suggestionSent, setSuggestionSent] = useState(false)
  const [activeTab, setActiveTab] = useState('profile') // 'profile', 'support', 'suggest'
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: "Hi! 👋 I'm Luna, your AI assistant. Ask me anything about To The Moon!" }
  ])
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [_talkToHuman, _setTalkToHuman] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const chatContainerRef = useRef(null)
  const exploreRef = useRef(null)
  const profileRef = useRef(null)
  const notificationsRef = useRef(null)

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages, isAiTyping])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exploreRef.current && !exploreRef.current.contains(event.target)) {
        setExploreOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const _handleSendAiMessage = async () => {
    if (!supportMessage.trim() || isAiTyping) return
    
    const userMessage = supportMessage.trim()
    setSupportMessage('')
    
    // Add user message to chat
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsAiTyping(true)
    
    try {
      const response = await api.post('/support/chat', {
        message: userMessage,
        history: chatMessages.slice(-10) // Send last 10 messages for context
      })
      
      if (response.data.success) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: response.data.message }])
      } else {
        // Fallback message
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response.data.message || "I'm having trouble right now. Please click 'Talk to Human' for help! 📧"
        }])
      }
    } catch (error) {
      console.error('AI chat error:', error)
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm temporarily unavailable. Please click 'Talk to Human' to email our support team! 📧"
      }])
    } finally {
      setIsAiTyping(false)
    }
  }

  const _handleSendHumanMessage = () => {
    if (!supportMessage.trim()) return
    const subject = encodeURIComponent('Support Request - To The Moon')
    const body = encodeURIComponent(`From: ${user?.email}\n\nMessage:\n${supportMessage}`)
    window.open(`mailto:support@tothemoon.app?subject=${subject}&body=${body}`)
    setSupportMessage('')
    setChatMessages(prev => [...prev, { 
      role: 'assistant', 
      content: "Opening your email client... Our team will get back to you within 24 hours! 📬"
    }])
  }

  const handleSendSuggestion = () => {
    if (!suggestionMessage.trim()) return
    // Send as email - opens mail client
    const subject = encodeURIComponent('Feature Suggestion - To The Moon')
    const body = encodeURIComponent(`From: ${user?.email}\n\nSuggestion:\n${suggestionMessage}`)
    window.open(`mailto:suggestions@tothemoon.app?subject=${subject}&body=${body}`)
    setSuggestionMessage('')
    setSuggestionSent(true)
    setTimeout(() => setSuggestionSent(false), 3000)
  }

  // Format member since date
  const getMemberSince = () => {
    if (user?.created_at) {
      return new Date(user.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
    return 'January 2026'
  }

  const handleNavigation = (pageId, requiresPro) => {
    if (requiresPro && !isPro) {
      openUpgradeModal()
      return
    }
    onNavigate(pageId)
    setMobileMenuOpen(false)
    setExploreOpen(false)
  }

  // Items to show in main nav (keep clean)
  const mainNavItems = navItems.filter(item => 
    ['dashboard', 'scanner', 'accounts', 'strategy'].includes(item.id)
  )

  // Items for the dropdown
  const exploreItems = [
    { id: 'marketplace', label: 'Marketplace', description: 'Browse trading strategies', icon: ShoppingCart },
    { id: 'leaderboard', label: 'Leaderboard', description: 'Top performing traders', icon: Trophy },
    { id: 'education', label: 'Education', description: 'Learn trading skills', icon: BookOpen },
    { id: 'discover', label: 'Discover', description: 'Explore opportunities', icon: Compass },
    { id: 'history', label: 'Trade History', description: 'View past trades', icon: History },
  ]

  // Check if any explore item is active
  const isExploreActive = exploreItems.some(item => currentPage === item.id)

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => handleNavigation('dashboard', false)}
            >
              <Rocket className="w-7 h-7 text-indigo-500 dark:text-indigo-400" />
              <span className="font-bold text-xl text-gray-900 dark:text-white hidden sm:block">
                TO THE MOON
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-1 flex-1 justify-center min-w-0">
            {/* Main Nav Items */}
            {mainNavItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPage === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id, item.requiresPro)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.shortLabel || item.label}
                  {item.requiresPro && !isPro && (
                    <Lock className="w-3 h-3 text-indigo-600" />
                  )}
                </button>
              )
            })}

            {/* Explore Dropdown */}
            <div className="relative" ref={exploreRef}>
              <button
                onClick={() => setExploreOpen(!exploreOpen)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isExploreActive
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Explore
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${exploreOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu with roll-down animation */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden z-50 transform origin-top transition-all duration-200 ease-out ${
                  exploreOpen 
                    ? 'opacity-100 scale-y-100 translate-y-0' 
                    : 'opacity-0 scale-y-0 -translate-y-2 pointer-events-none'
                }`}
              >
                <div className="py-2">
                  {exploreItems.map((item) => {
                    const Icon = item.icon
                    const isActive = currentPage === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavigation(item.id, false)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-start gap-3 ${
                          isActive ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${isActive ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'bg-gray-100 dark:bg-gray-800'}`}>
                          <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`} />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isActive ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                            {item.label}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </nav>

          {/* Right side controls */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Trading Mode Toggle */}
            <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setTradingMode('paper')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  tradingMode === 'paper'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Paper
              </button>
              <button
                onClick={() => setTradingMode('live')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  tradingMode === 'live'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Live
              </button>
            </div>

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-gray-500 hover:text-gray-400 relative transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              
              {/* Notifications Dropdown - Kalshi Style */}
              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden z-50">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <span className="font-semibold text-gray-900 dark:text-white">Notifications</span>
                    <button className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">
                      Mark all as read
                    </button>
                  </div>
                  
                  {/* Notifications List */}
                  <div className="max-h-96 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
                    {/* Market Settled */}
                    <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Market settled</span>
                            <span className="text-xs text-gray-400 shrink-0">Jan 18</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                            Fed cuts rates in January 2026?
                          </p>
                          <p className="text-xs text-gray-400 mt-1">Result is <span className="text-gray-600 dark:text-gray-300 font-medium">No</span></p>
                        </div>
                      </div>
                    </div>

                    {/* Trade Confirmed */}
                    <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full shrink-0">
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Trade confirmed</span>
                            <span className="text-xs text-gray-400 shrink-0">Jan 18</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                            Trump wins 2024 Presidential Election
                          </p>
                          <p className="text-xs text-gray-400 mt-1">1 Yes contract at 42 cents</p>
                        </div>
                      </div>
                    </div>

                    {/* Order Cancelled */}
                    <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full shrink-0">
                          <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Order cancelled</span>
                            <span className="text-xs text-gray-400 shrink-0">Jan 18</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                            S&P 500 above 6,000 by March?
                          </p>
                          <p className="text-xs text-gray-400 mt-1">Order for 10 No contracts cancelled</p>
                        </div>
                      </div>
                    </div>

                    {/* Deposit Completed */}
                    <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full shrink-0">
                          <Banknote className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Deposit completed</span>
                            <span className="text-xs text-gray-400 shrink-0">Jan 17</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Your deposit of $490.00 to your Kalshi account has been processed.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Position Update */}
                    <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Position expiring soon</span>
                            <span className="text-xs text-gray-400 shrink-0">Jan 17</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                            Bitcoin hits $100K in 2024
                          </p>
                          <p className="text-xs text-gray-400 mt-1">Expires in 7 days</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <button
                      onClick={() => {
                        setNotificationsOpen(false)
                        onNavigate?.('history')
                      }}
                      className="w-full text-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium py-1"
                    >
                      View all activity
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Subscription Status / Upgrade Button */}
            {isPro ? (
              <span className="px-3 py-1.5 bg-linear-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-lg flex items-center gap-1.5 shadow-lg shadow-indigo-500/25">
                <Crown className="w-4 h-4" />
                <span className="hidden sm:inline">PRO</span>
              </span>
            ) : (
              <button
                onClick={openUpgradeModal}
                className="px-3 sm:px-4 py-2 bg-linear-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30"
              >
                <Crown className="w-4 h-4" />
                <span className="hidden sm:inline">Upgrade</span>
              </button>
            )}

            {/* User Menu */}
            {user && (
              <div className="relative" ref={profileRef}>
                <button 
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="relative">
                    <div className="w-8 h-8 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shrink-0 text-white font-semibold text-sm">
                      {(user.username || user.email)?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown - Dark Theme */}
                <div
                  className={`dark absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 ${(activeTab === 'support' || activeTab === 'suggest') ? 'sm:w-96' : ''} max-w-88 bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden z-50 transform origin-top-right transition-all duration-200 ease-out ${
                    profileOpen
                      ? 'opacity-100 scale-100 translate-y-0'
                      : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                  }`}
                >
                  {/* Header with user info */}
                  <div className="bg-linear-to-r from-indigo-500 to-purple-600 p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {(user.username || user.email)?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold truncate">{user.username || user.email?.split('@')[0]}</p>
                        <p className="text-indigo-200 text-sm truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => setProfileOpen(false)}
                        className="p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Tab Navigation */}
                  <div className="flex border-b border-gray-800">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${
                        activeTab === 'profile'
                          ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-900/20'
                          : 'text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      <User className="w-3.5 h-3.5 mx-auto mb-1" />
                      Profile
                    </button>
                    <button
                      onClick={() => { setProfileOpen(false); openLunaChat(); }}
                      className="flex-1 px-4 py-2.5 text-xs font-medium transition-colors text-gray-400 hover:text-gray-300"
                    >
                      <MessageCircle className="w-3.5 h-3.5 mx-auto mb-1" />
                      Support
                    </button>
                    <button
                      onClick={() => setActiveTab('suggest')}
                      className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${
                        activeTab === 'suggest'
                          ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-900/20'
                          : 'text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      <Lightbulb className="w-3.5 h-3.5 mx-auto mb-1" />
                      Suggest
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="p-4">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div>
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Account Information</p>
                          <div className="space-y-3">
                            {/* First Name */}
                            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white dark:bg-gray-800">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/50">
                                <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">First Name</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {user.first_name || (user.username?.includes(' ') ? user.username.split(' ')[0] : user.username) || 'Not set'}
                                </p>
                              </div>
                            </div>
                            {/* Last Name */}
                            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white dark:bg-gray-800">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/50">
                                <UserCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Last Name</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {user.last_name || (user.username?.includes(' ') ? user.username.split(' ').slice(1).join(' ') : '—')}
                                </p>
                              </div>
                            </div>
                            {/* Email */}
                            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white dark:bg-gray-800">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-100 dark:bg-purple-900/50">
                                <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Email Address</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.email}</p>
                              </div>
                            </div>
                            {/* Member Since */}
                            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white dark:bg-gray-800">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-100 dark:bg-green-900/50">
                                <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Member Since</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{getMemberSince()}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Subscription Status */}
                        <div className={`p-3 rounded-lg border border-indigo-200 dark:border-indigo-800 ${isPro ? 'bg-linear-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30' : 'bg-gray-50 dark:bg-gray-800'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Crown className={`w-4 h-4 ${isPro ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                              <span className={`text-sm font-medium ${isPro ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                {isPro ? 'Pro Member' : 'Free Plan'}
                              </span>
                            </div>
                            {!isPro && (
                              <button
                                onClick={() => { setProfileOpen(false); openUpgradeModal(); }}
                                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                              >
                                Upgrade →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Suggest Tab */}
                    {activeTab === 'suggest' && (
                      <div className="space-y-3 animate-in fade-in duration-200">
                        {/* Suggest Header - matches Support header style */}
                        <div className="bg-linear-to-r from-amber-500 to-orange-500 rounded-xl p-3 -mt-1">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                              <Lightbulb className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-white font-bold text-base">Feature Suggestions</h3>
                              <p className="text-amber-100 text-xs">Help us build what you need!</p>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-gray-400 leading-relaxed">
                          Have an idea for a feature you'd like to see? We'd love to hear it! Your feedback helps shape the future of To The Moon.
                        </p>

                        {suggestionSent && (
                          <div className="bg-green-900/30 text-green-400 text-sm p-3 rounded-xl text-center font-medium">
                            ✓ Opening email client...
                          </div>
                        )}

                        <textarea
                          value={suggestionMessage}
                          onChange={(e) => setSuggestionMessage(e.target.value)}
                          placeholder="Describe your feature idea in detail..."
                          className="w-full h-64 px-4 py-3 text-sm border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none shadow-sm bg-gray-800 text-white placeholder-gray-500"
                        />

                        <button
                          onClick={handleSendSuggestion}
                          disabled={!suggestionMessage.trim()}
                          className="w-full py-3 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-600 text-white text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Submit Suggestion
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Support Button */}
                  <div className="px-3 pb-2">
                    <button
                      onClick={() => { setProfileOpen(false); openLunaChat(); }}
                      className="w-full py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Support
                    </button>
                  </div>

                  {/* Sign Out Button */}
                  <div className="border-t border-gray-800 p-3">
                    <button
                      onClick={() => { setProfileOpen(false); onLogout(); }}
                      className="w-full py-2.5 text-red-400 hover:bg-red-900/20 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sliding Drawer */}
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 xl:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />
      
      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-900 shadow-2xl z-50 xl:hidden transform transition-transform duration-300 ease-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Rocket className="w-7 h-7 text-indigo-500 dark:text-indigo-400" />
            <span className="font-bold text-lg text-gray-900 dark:text-white">TO THE MOON</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex flex-col h-[calc(100%-72px)] overflow-y-auto">
          {/* Trading Mode Toggle */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Trading Mode</p>
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setTradingMode('paper')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  tradingMode === 'paper'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Paper
              </button>
              <button
                onClick={() => setTradingMode('live')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  tradingMode === 'live'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Live
              </button>
            </div>
          </div>

          {/* Main Navigation */}
          <div className="p-4 space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Main</p>
            {mainNavItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPage === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id, item.requiresPro)}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                    isActive
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </span>
                  {item.requiresPro && !isPro && (
                    <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Explore Section */}
          <div className="p-4 pt-0 space-y-1 flex-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Explore</p>
            {exploreItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPage === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id, false)}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${
                    isActive
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              )
            })}
          </div>

          {/* User Section - Pinned to bottom */}
          {user && (
            <div className="mt-auto border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              {/* User Info Header */}
              <div className="p-4 bg-linear-to-r from-indigo-500 to-purple-600">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {(user.username || user.email)?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold truncate">{user.username || user.email?.split('@')[0]}</p>
                      {isPro && (
                        <span className="px-2 py-0.5 bg-white/20 backdrop-blur text-white text-xs font-bold rounded-full">
                          PRO
                        </span>
                      )}
                    </div>
                    <p className="text-indigo-200 text-sm truncate">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* User Details */}
              <div className="p-4 space-y-3">
                {/* Member Since */}
                <div className="flex items-center gap-3 p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Member Since</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{getMemberSince()}</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setMobileMenuOpen(false); openLunaChat(); }}
                    className="flex items-center justify-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl text-indigo-700 dark:text-indigo-400 text-sm font-medium transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Support
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); setProfileOpen(true); setActiveTab('suggest'); }}
                    className="flex items-center justify-center gap-2 p-3 text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 text-sm font-medium transition-colors"
                  >
                    <Lightbulb className="w-4 h-4" />
                    Suggest
                  </button>
                </div>

                {/* Subscription Status */}
                {!isPro && (
                  <button
                    onClick={() => { setMobileMenuOpen(false); openUpgradeModal(); }}
                    className="w-full p-3 bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-lg"
                  >
                    <Crown className="w-4 h-4" />
                    Upgrade to Pro
                  </button>
                )}

                {/* Sign Out */}
                <button
                  onClick={() => { setMobileMenuOpen(false); onLogout(); }}
                  className="w-full px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header

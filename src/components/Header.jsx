import { useState, useRef, useEffect } from 'react'
import { Menu, X, Rocket, Bell, Crown, Lock, LogOut, User, ChevronDown, Trophy, ShoppingCart, BookOpen, Compass, Mail, Calendar, Send, Lightbulb, MessageCircle, Bot, UserCircle } from 'lucide-react'
import { useApp } from '../hooks/useApp'
import { api } from '../utils/api'

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
  const [talkToHuman, setTalkToHuman] = useState(false)
  const chatContainerRef = useRef(null)
  const exploreRef = useRef(null)
  const profileRef = useRef(null)

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
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSendAiMessage = async () => {
    if (!supportMessage.trim() || isAiTyping) return
    
    const userMessage = supportMessage.trim()
    setSupportMessage('')
    
    // Add user message to chat
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsAiTyping(true)
    
    try {
      const response = await api.post('/api/support/chat', {
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

  const handleSendHumanMessage = () => {
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
    ['dashboard', 'history', 'accounts', 'strategy'].includes(item.id)
  )

  // Items for the dropdown
  const exploreItems = [
    { id: 'marketplace', label: 'Marketplace', description: 'Browse trading strategies', icon: ShoppingCart },
    { id: 'leaderboard', label: 'Leaderboard', description: 'Top performing traders', icon: Trophy },
    { id: 'education', label: 'Education', description: 'Learn trading skills', icon: BookOpen },
    { id: 'discover', label: 'Discover', description: 'Explore opportunities', icon: Compass },
  ]

  // Check if any explore item is active
  const isExploreActive = exploreItems.some(item => currentPage === item.id)

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => handleNavigation('dashboard', false)}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 hidden sm:block">
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
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Explore
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${exploreOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu with roll-down animation */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 transform origin-top transition-all duration-200 ease-out ${
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
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                          isActive ? 'bg-indigo-50' : ''
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${isActive ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                          <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-gray-600'}`} />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isActive ? 'text-indigo-700' : 'text-gray-900'}`}>
                            {item.label}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
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
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Trading Mode Toggle */}
            <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTradingMode('paper')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  tradingMode === 'paper'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Paper
              </button>
              <button
                onClick={() => setTradingMode('live')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  tradingMode === 'live'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Live
              </button>
            </div>

            {/* Notifications */}
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg relative transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Subscription Status / Upgrade Button */}
            {isPro ? (
              <span className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-lg flex items-center gap-1.5 shadow-lg shadow-indigo-500/25">
                <Crown className="w-4 h-4" />
                <span className="hidden sm:inline">PRO</span>
              </span>
            ) : (
              <button
                onClick={openUpgradeModal}
                className="px-3 sm:px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30"
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
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm">
                      {(user.username || user.email)?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Enhanced Profile Dropdown */}
                <div 
                  className={`absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 transform origin-top-right transition-all duration-200 ease-out ${
                    profileOpen 
                      ? 'opacity-100 scale-100 translate-y-0' 
                      : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                  }`}
                >
                  {/* Header with user info */}
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
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
                        className="p-1 text-white/60 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Tab Navigation */}
                  <div className="flex border-b border-gray-100">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${
                        activeTab === 'profile' 
                          ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <User className="w-3.5 h-3.5 mx-auto mb-1" />
                      Profile
                    </button>
                    <button
                      onClick={() => setActiveTab('support')}
                      className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${
                        activeTab === 'support' 
                          ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <MessageCircle className="w-3.5 h-3.5 mx-auto mb-1" />
                      Support
                    </button>
                    <button
                      onClick={() => setActiveTab('suggest')}
                      className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${
                        activeTab === 'suggest' 
                          ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' 
                          : 'text-gray-500 hover:text-gray-700'
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
                            <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <User className="w-4 h-4 text-indigo-600" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Full Name</p>
                                <p className="text-sm font-medium text-gray-900">{user.username || 'Not set'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Mail className="w-4 h-4 text-purple-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-500">Email Address</p>
                                <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-green-600" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Member Since</p>
                                <p className="text-sm font-medium text-gray-900">{getMemberSince()}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Subscription Status */}
                        <div className={`p-3 rounded-lg ${isPro ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100' : 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Crown className={`w-4 h-4 ${isPro ? 'text-indigo-600' : 'text-gray-400'}`} />
                              <span className={`text-sm font-medium ${isPro ? 'text-indigo-700' : 'text-gray-600'}`}>
                                {isPro ? 'Pro Member' : 'Free Plan'}
                              </span>
                            </div>
                            {!isPro && (
                              <button
                                onClick={() => { setProfileOpen(false); openUpgradeModal(); }}
                                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                              >
                                Upgrade →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Support Tab */}
                    {activeTab === 'support' && (
                      <div className="space-y-3 animate-in fade-in duration-200">
                        {/* Toggle between AI and Human */}
                        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                          <button
                            onClick={() => setTalkToHuman(false)}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                              !talkToHuman ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
                            }`}
                          >
                            <Bot className="w-3.5 h-3.5" />
                            AI Assistant
                          </button>
                          <button
                            onClick={() => setTalkToHuman(true)}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                              talkToHuman ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
                            }`}
                          >
                            <UserCircle className="w-3.5 h-3.5" />
                            Talk to Human
                          </button>
                        </div>

                        {!talkToHuman ? (
                          /* AI Chat Interface */
                          <>
                            {/* Chat Messages */}
                            <div 
                              ref={chatContainerRef}
                              className="h-48 overflow-y-auto space-y-2 p-2 bg-gray-50 rounded-lg"
                            >
                              {chatMessages.map((msg, idx) => (
                                <div
                                  key={idx}
                                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                                    msg.role === 'user'
                                      ? 'bg-indigo-600 text-white rounded-br-sm'
                                      : 'bg-white border border-gray-200 text-gray-700 rounded-bl-sm'
                                  }`}>
                                    {msg.role === 'assistant' && (
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <Bot className="w-3 h-3 text-indigo-500" />
                                        <span className="text-[10px] font-medium text-indigo-500">Luna</span>
                                      </div>
                                    )}
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                  </div>
                                </div>
                              ))}
                              {isAiTyping && (
                                <div className="flex justify-start">
                                  <div className="bg-white border border-gray-200 px-3 py-2 rounded-xl rounded-bl-sm">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <Bot className="w-3 h-3 text-indigo-500" />
                                      <span className="text-[10px] font-medium text-indigo-500">Luna</span>
                                    </div>
                                    <div className="flex gap-1">
                                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Input */}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={supportMessage}
                                onChange={(e) => setSupportMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendAiMessage()}
                                placeholder="Ask Luna anything..."
                                disabled={isAiTyping}
                                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
                              />
                              <button
                                onClick={handleSendAiMessage}
                                disabled={!supportMessage.trim() || isAiTyping}
                                className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-[10px] text-gray-400 text-center">
                              Luna is AI-powered. For complex issues, switch to "Talk to Human".
                            </p>
                          </>
                        ) : (
                          /* Human Support Interface */
                          <>
                            <div className="bg-indigo-50 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <Mail className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-indigo-900">Email Support</p>
                                  <p className="text-xs text-indigo-700 mt-0.5">We typically reply within 24 hours</p>
                                </div>
                              </div>
                            </div>
                            
                            <textarea
                              value={supportMessage}
                              onChange={(e) => setSupportMessage(e.target.value)}
                              placeholder="Describe your issue in detail..."
                              rows={4}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                            />

                            <button
                              onClick={handleSendHumanMessage}
                              disabled={!supportMessage.trim()}
                              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              <Mail className="w-4 h-4" />
                              Send Email to Support
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Suggest Tab */}
                    {activeTab === 'suggest' && (
                      <div className="space-y-3 animate-in fade-in duration-200">
                        <div className="bg-amber-50 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <Lightbulb className="w-4 h-4 text-amber-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-amber-900">Feature Suggestions</p>
                              <p className="text-xs text-amber-700 mt-0.5">Help us build what you need!</p>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-600">
                          Have an idea for a feature you'd like to see? We'd love to hear it! Your feedback helps shape the future of To The Moon.
                        </p>

                        {suggestionSent && (
                          <div className="bg-green-50 text-green-700 text-xs p-2 rounded-lg text-center">
                            ✓ Opening email client...
                          </div>
                        )}

                        <textarea
                          value={suggestionMessage}
                          onChange={(e) => setSuggestionMessage(e.target.value)}
                          placeholder="Describe your feature idea..."
                          rows={3}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                        />
                        
                        <button
                          onClick={handleSendSuggestion}
                          disabled={!suggestionMessage.trim()}
                          className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Submit Suggestion
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Sign Out Button */}
                  <div className="border-t border-gray-100 p-3">
                    <button
                      onClick={() => { setProfileOpen(false); onLogout(); }}
                      className="w-full py-2.5 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
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

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-gray-200 bg-white animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 space-y-1">
            {/* Mobile Trading Toggle */}
            <div className="flex items-center justify-between py-2 mb-2 border-b border-gray-100 pb-3">
              <span className="text-sm font-medium text-gray-700">Trading Mode</span>
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setTradingMode('paper')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    tradingMode === 'paper'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600'
                  }`}
                >
                  Paper
                </button>
                <button
                  onClick={() => setTradingMode('live')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    tradingMode === 'live'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600'
                  }`}
                >
                  Live
                </button>
              </div>
            </div>

            {/* Navigation Items */}
            {mainNavItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPage === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id, item.requiresPro)}
                  className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </span>
                  {item.requiresPro && !isPro && (
                    <Lock className="w-4 h-4 text-indigo-600" />
                  )}
                </button>
              )
            })}

            {/* Explore Section */}
            <div className="pt-2 mt-2 border-t border-gray-100">
              <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Explore
              </p>
              {exploreItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPage === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.id, false)}
                    className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-3 ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                )
              })}
            </div>

            {/* Mobile User Info & Logout */}
            {user && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="px-4 py-2 flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.username}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full mt-2 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-3"
                >
                  <LogOut className="w-5 h-5" />
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Header

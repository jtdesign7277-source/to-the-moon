import { useState, useRef, useEffect } from 'react'
import { Menu, X, Rocket, Bell, Crown, Lock, LogOut, User, ChevronDown, Trophy, ShoppingCart, BookOpen, Compass } from 'lucide-react'
import { useApp } from '../hooks/useApp'

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
  const exploreRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exploreRef.current && !exploreRef.current.contains(event.target)) {
        setExploreOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
              <div className="relative group">
                <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="hidden lg:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                    {user.username || user.email?.split('@')[0]}
                  </span>
                </button>
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.username}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={onLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
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

import { useState, useEffect, useRef } from 'react'
import {
  LayoutDashboard,
  Wallet,
  Wrench,
  Trophy,
  ShoppingCart,
  BookOpen,
  Compass,
  History,
  User,
  Mail,
  Calendar,
  Crown,
  LogOut,
  MessageCircle,
  Lightbulb,
  ChevronDown,
  X,
  Rocket,
  Brain,
} from 'lucide-react'

// Context
import { AppProvider } from './contexts/AppContext'
import { useApp } from './hooks/useApp'
import { AuthProvider } from './hooks/useAuth'

// Components
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import MobileNav from './components/MobileNav'
import UpgradeModal from './components/UpgradeModal'
import DevTools from './components/DevTools'
import LunaChatWidget from './components/LunaChatWidget'

// Pages
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import StrategyBuilder from './pages/StrategyBuilder'

import Leaderboard from './pages/Leaderboard'
import Marketplace from './pages/Marketplace'
import Admin from './pages/Admin'
import Education from './pages/Education'
import StrategyDiscovery from './pages/StrategyDiscovery'
import TradeHistory from './pages/TradeHistory'
import TradeStation from './pages/TradeStation'
import AlphaLab from './pages/AlphaLab'
import Legal from './pages/Legal'

// Navigation configuration - Main nav items
const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    shortLabel: 'Dashboard',
    icon: LayoutDashboard,
    requiresPro: false,
  },
  {
    id: 'accounts',
    label: 'Accounts',
    shortLabel: 'Accounts',
    icon: Wallet,
    requiresPro: false,
  },
  {
    id: 'strategy',
    label: 'Strategy Builder',
    shortLabel: 'Strategy',
    icon: Wrench,
    requiresPro: false,
  },
  {
    id: 'trade-station',
    label: 'Trade Station',
    shortLabel: 'Station',
    icon: Rocket,
    requiresPro: false,
  },
  {
    id: 'alpha-lab',
    label: 'Alpha Lab',
    shortLabel: 'Alpha',
    icon: Brain,
    requiresPro: true,
  },
]

// Explore section items
const EXPLORE_ITEMS = [
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    icon: Trophy,
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    icon: ShoppingCart,
  },
  {
    id: 'education',
    label: 'Education',
    icon: BookOpen,
  },
  {
    id: 'discover',
    label: 'Discover',
    icon: Compass,
  },
  {
    id: 'history',
    label: 'Trade History',
    icon: History,
  },
]

// Page renderer component
const PageRenderer = ({ currentPage, legalTab, onNavigate }) => {
  switch (currentPage) {
    case 'dashboard':
      return <Dashboard onNavigate={onNavigate} />
    case 'history':
      return <TradeHistory />
    case 'accounts':
      return <Accounts />
    case 'strategy':
      return <StrategyBuilder />
    case 'leaderboard':
      return <Leaderboard />
    case 'marketplace':
      return <Marketplace />
    case 'education':
      return <Education />
    case 'discover':
      return <StrategyDiscovery />
    case 'legal':
      return <Legal initialTab={legalTab} />
    case 'trade-station':
      return <TradeStation />
    case 'alpha-lab':
      return <AlphaLab />
    default:
      return <Dashboard onNavigate={onNavigate} />
  }
}

// Helper to determine initial view based on URL
const getInitialView = () => {
  if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
    return 'admin'
  }
  if (window.location.pathname === '/reset-password' || window.location.search.includes('token=')) {
    return 'auth'
  }
  return 'landing'
}

// Main app content (needs to be inside AppProvider)
const AppContent = () => {
  const [view, setView] = useState(getInitialView) // 'landing' | 'auth' | 'app' | 'admin' | 'legal'
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [legalTab, setLegalTab] = useState('terms')
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)
  const { isPro, openUpgradeModal, setIsPro, openLunaChat } = useApp()

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  // Check for existing auth on mount
  useEffect(() => {
    const token = localStorage.getItem('ttm_access_token')
    if (token) {
      // Verify token and get user info
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user) {
            setUser(data.user)
            if (data.user.tier === 'pro') {
              setIsPro(true)
            }
            setView('app')
          } else {
            // Token invalid, clear it
            localStorage.removeItem('ttm_access_token')
          }
        })
        .catch(() => {
          localStorage.removeItem('ttm_access_token')
        })
    }
  }, [setIsPro])

  // Handle successful auth
  const handleAuthSuccess = (userData) => {
    setUser(userData)
    if (userData.tier === 'pro') {
      setIsPro(true)
    }
    setView('app')
  }

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('ttm_access_token')
    setUser(null)
    setIsPro(false)
    setView('landing')
  }

  // Show admin page
  if (view === 'admin') {
    return (
      <Admin
        onBack={() => {
          window.location.hash = ''
          setView('landing')
        }}
      />
    )
  }

  // Show legal page (standalone, from landing)
  if (view === 'legal') {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <Legal
          initialTab={legalTab}
          onBack={() => setView('landing')}
        />
      </div>
    )
  }

  // Show landing page
  if (view === 'landing') {
    return (
      <Landing
        onEnterApp={() => setView('auth')}
        onLegal={(tab) => {
          setLegalTab(tab)
          setView('legal')
        }}
      />
    )
  }

  // Show auth page
  if (view === 'auth') {
    return (
      <Auth
        onSuccess={handleAuthSuccess}
        onBack={() => setView('landing')}
        onAdminAccess={() => setView('admin')}
      />
    )
  }

  // Handle navigation with paywall check
  const handleNavigation = (pageId) => {
    const navItem = [...NAV_ITEMS, ...EXPLORE_ITEMS].find(item => item.id === pageId)
    if (navItem?.requiresPro && !isPro) {
      openUpgradeModal()
      return
    }
    setCurrentPage(pageId)
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        navItems={NAV_ITEMS}
        exploreItems={EXPLORE_ITEMS}
        currentPage={currentPage}
        onNavigate={handleNavigation}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Area - No left margin on mobile (sidebar is hidden), margin on desktop */}
      <div className="flex-1 flex flex-col min-h-screen ml-0 lg:ml-14">
        {/* Top Right Header Bar */}
        <div className="fixed top-3 right-4 z-50 flex items-center gap-2">
          {/* Crown / PRO Badge */}
          {isPro ? (
            <span className="px-2.5 py-1 bg-linear-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
              PRO
            </span>
          ) : (
            <button
              onClick={openUpgradeModal}
              className="px-2.5 py-1 bg-linear-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
              Upgrade
            </button>
          )}
          {/* User Profile Dropdown */}
          {user && (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-1.5 p-1.5 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-colors"
              >
                <div className="w-6 h-6 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                  {(user.first_name?.[0] || user.username?.[0] || user.email?.[0] || 'U').toUpperCase()}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown */}
              <div
                className={`absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 transform origin-top-right transition-all duration-200 ease-out ${
                  profileOpen
                    ? 'opacity-100 scale-100 translate-y-0'
                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                }`}
              >
                {/* Header with user info */}
                <div className="bg-linear-to-r from-indigo-500 to-purple-600 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {(user.first_name?.[0] || user.username?.[0] || user.email?.[0] || 'U').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">
                        {user.first_name && user.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : user.username || user.email?.split('@')[0]}
                      </p>
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

                {/* Profile Details */}
                <div className="p-4 space-y-3">
                  {/* First Name */}
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide">First Name</p>
                      <p className="text-sm font-medium text-gray-900">
                        {user.first_name || (user.username?.includes(' ') ? user.username.split(' ')[0] : user.username) || 'Not set'}
                      </p>
                    </div>
                  </div>

                  {/* Last Name */}
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide">Last Name</p>
                      <p className="text-sm font-medium text-gray-900">
                        {user.last_name || (user.username?.includes(' ') ? user.username.split(' ').slice(1).join(' ') : '—')}
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide">Email</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide">Member Since</p>
                      <p className="text-sm font-medium text-gray-900">{getMemberSince()}</p>
                    </div>
                  </div>

                  {/* Subscription Status */}
                  <div className={`p-2.5 rounded-lg ${isPro ? 'bg-linear-to-r from-indigo-50 to-purple-50 border border-indigo-100' : 'bg-gray-50'}`}>
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

                  {/* Support Button */}
                  <button
                    onClick={() => { setProfileOpen(false); openLunaChat(); }}
                    className="w-full flex items-center justify-center gap-2 p-2.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-indigo-700 text-sm font-medium transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Support
                  </button>
                </div>

                {/* Sign Out */}
                <div className="border-t border-gray-100 p-3">
                  <button
                    onClick={() => { setProfileOpen(false); handleLogout(); }}
                    className="w-full py-2 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full pt-16 lg:pt-6">
          <PageRenderer currentPage={currentPage} legalTab={legalTab} onNavigate={handleNavigation} />
        </main>

        {/* Footer with Legal Links */}
        <footer className="hidden lg:block bg-white border-t border-gray-200 py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} ToTheMoon. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <button
                onClick={() => { setLegalTab('terms'); setCurrentPage('legal'); }}
                className="text-gray-500 hover:text-indigo-600 transition-colors"
              >
                Terms of Service
              </button>
              <button
                onClick={() => { setLegalTab('privacy'); setCurrentPage('legal'); }}
                className="text-gray-500 hover:text-indigo-600 transition-colors"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => { setLegalTab('risk'); setCurrentPage('legal'); }}
                className="text-gray-500 hover:text-indigo-600 transition-colors"
              >
                Risk Disclaimer
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal />

      {/* Luna AI Chat Widget */}
      <LunaChatWidget user={user} />

      {/* Development Tools */}
      <DevTools />
    </div>
  )
}

// Root App component with providers
function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  )
}

export default App

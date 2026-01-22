import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Wallet,
  Wrench,
  Trophy,
  ShoppingCart,
  BookOpen,
  Compass,
  History,
  Activity,
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

import ScannerDashboard from './components/Scanner/ScannerDashboard';
import Leaderboard from './pages/Leaderboard'
import Marketplace from './pages/Marketplace'
import Admin from './pages/Admin'
import Education from './pages/Education'
import StrategyDiscovery from './pages/StrategyDiscovery'
import TradeHistory from './pages/TradeHistory'
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
    id: 'scanner',
    label: 'Scanner',
    shortLabel: 'Scanner',
    icon: Activity,
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

      case 'scanner':
  return <ScannerDashboard />
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
  const { isPro, openUpgradeModal, setIsPro } = useApp()

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
            <span className="px-2.5 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
              PRO
            </span>
          ) : (
            <button
              onClick={openUpgradeModal}
              className="px-2.5 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
              Upgrade
            </button>
          )}
          {/* User Icon */}
          {user && (
            <button
              onClick={handleLogout}
              className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
              title={`${user.username} - Click to logout`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </button>
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

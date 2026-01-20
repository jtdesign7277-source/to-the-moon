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
} from 'lucide-react'

// Context
import { AppProvider } from './contexts/AppContext'
import { useApp } from './hooks/useApp'
import { AuthProvider } from './hooks/useAuth'

// Components
import Header from './components/Header'
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
import Legal from './pages/Legal'

// Navigation configuration
const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    shortLabel: 'Home',
    icon: LayoutDashboard,
    requiresPro: false,
  },
  {
    id: 'history',
    label: 'Trade History',
    shortLabel: 'History',
    icon: History,
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
    id: 'leaderboard',
    label: 'Leaderboard',
    shortLabel: 'Ranks',
    icon: Trophy,
    requiresPro: false,
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    shortLabel: 'Market',
    icon: ShoppingCart,
    requiresPro: false,
  },
  {
    id: 'education',
    label: 'Education',
    shortLabel: 'Learn',
    icon: BookOpen,
    requiresPro: false,
  },
  {
    id: 'discover',
    label: 'Discover',
    shortLabel: 'Discover',
    icon: Compass,
    requiresPro: false,
  },
]

// Page renderer component
const PageRenderer = ({ currentPage, legalTab }) => {
  switch (currentPage) {
    case 'dashboard':
      return <Dashboard />
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
    default:
      return <Dashboard />
  }
}

// Main app content (needs to be inside AppProvider)
const AppContent = () => {
  const [view, setView] = useState('landing') // 'landing' | 'auth' | 'app' | 'admin' | 'legal'
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [legalTab, setLegalTab] = useState('terms')
  const { isPro, openUpgradeModal, setIsPro } = useApp()

  // Check for admin route or reset-password route on mount
  useEffect(() => {
    if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
      setView('admin')
    }
    // Check for password reset token in URL
    if (window.location.pathname === '/reset-password' || window.location.search.includes('token=')) {
      setView('auth')
    }
  }, [])

  // Check for existing auth on mount
  useEffect(() => {
    const token = localStorage.getItem('ttm_access_token')
    if (token) {
      // Verify token and get user info
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'
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
    const navItem = NAV_ITEMS.find(item => item.id === pageId)
    if (navItem?.requiresPro && !isPro) {
      openUpgradeModal()
      return
    }
    setCurrentPage(pageId)
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-0 flex flex-col">
      {/* Header */}
      <Header
        navItems={NAV_ITEMS}
        currentPage={currentPage}
        onNavigate={handleNavigation}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1">
        <PageRenderer currentPage={currentPage} legalTab={legalTab} />
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

      {/* Mobile Bottom Navigation */}
      <MobileNav
        navItems={NAV_ITEMS}
        currentPage={currentPage}
        onNavigate={handleNavigation}
      />

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

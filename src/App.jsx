import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Wallet,
  Wrench,
  Trophy,
  ShoppingCart,
} from 'lucide-react'

// Context
import { AppProvider } from './contexts/AppContext'
import { useApp } from './hooks/useApp'

// Components
import Header from './components/Header'
import MobileNav from './components/MobileNav'
import UpgradeModal from './components/UpgradeModal'
import DevTools from './components/DevTools'

// Pages
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import StrategyBuilder from './pages/StrategyBuilder'
import Leaderboard from './pages/Leaderboard'
import Marketplace from './pages/Marketplace'
import Admin from './pages/Admin'

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
    requiresPro: true,
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
]

// Page renderer component
const PageRenderer = ({ currentPage }) => {
  switch (currentPage) {
    case 'dashboard':
      return <Dashboard />
    case 'accounts':
      return <Accounts />
    case 'strategy':
      return <StrategyBuilder />
    case 'leaderboard':
      return <Leaderboard />
    case 'marketplace':
      return <Marketplace />
    default:
      return <Dashboard />
  }
}

// Main app content (needs to be inside AppProvider)
const AppContent = () => {
  const [view, setView] = useState('landing') // 'landing' | 'auth' | 'app' | 'admin'
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isPro, openUpgradeModal, setIsPro } = useApp()

  // Check for admin route on mount
  useEffect(() => {
    if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
      setView('admin')
    }
  }, [])

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

  // Show landing page
  if (view === 'landing') {
    return (
      <Landing
        onEnterApp={() => setView('auth')}
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
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
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
      <main className="max-w-7xl mx-auto px-4 py-6">
        <PageRenderer currentPage={currentPage} />
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        navItems={NAV_ITEMS}
        currentPage={currentPage}
        onNavigate={handleNavigation}
      />

      {/* Upgrade Modal */}
      <UpgradeModal />

      {/* Development Tools */}
      <DevTools />
    </div>
  )
}

// Root App component with providers
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App

import { useState, useCallback } from 'react'
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
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import StrategyBuilder from './pages/StrategyBuilder'
import Leaderboard from './pages/Leaderboard'
import Marketplace from './pages/Marketplace'

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
  const [showLanding, setShowLanding] = useState(true)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isPro, openUpgradeModal } = useApp()

  // Show landing page by default
  if (showLanding) {
    return <Landing onEnterApp={() => setShowLanding(false)} />
  }

  // Handle navigation with paywall check
  const handleNavigation = useCallback((pageId) => {
    const navItem = NAV_ITEMS.find(item => item.id === pageId)
    if (navItem?.requiresPro && !isPro) {
      openUpgradeModal()
      return
    }
    setCurrentPage(pageId)
    setMobileMenuOpen(false)
  }, [isPro, openUpgradeModal])

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {/* Header */}
      <Header
        navItems={NAV_ITEMS}
        currentPage={currentPage}
        onNavigate={handleNavigation}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
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

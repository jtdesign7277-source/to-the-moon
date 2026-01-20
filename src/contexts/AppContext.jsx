import { createContext, useState, useCallback, useMemo } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  // Subscription state (will integrate with useSubscription hook when backend is ready)
  const [isPro, setIsPro] = useState(false)

  // Trading mode state
  const [tradingMode, setTradingMode] = useState('paper') // 'paper' | 'live'

  // UI state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showLunaChat, setShowLunaChat] = useState(false)

  // Toggle Pro status (for development)
  const togglePro = useCallback(() => {
    setIsPro(prev => !prev)
  }, [])

  // Open upgrade modal
  const openUpgradeModal = useCallback(() => {
    setShowUpgradeModal(true)
  }, [])

  // Close upgrade modal
  const closeUpgradeModal = useCallback(() => {
    setShowUpgradeModal(false)
  }, [])

  // Open Luna chat
  const openLunaChat = useCallback(() => {
    setShowLunaChat(true)
  }, [])

  // Close Luna chat
  const closeLunaChat = useCallback(() => {
    setShowLunaChat(false)
  }, [])

  // Handle successful upgrade
  const handleUpgradeSuccess = useCallback(() => {
    setIsPro(true)
    setShowUpgradeModal(false)
  }, [])

  // Check if a feature requires Pro
  const requiresProAccess = useCallback((featureId) => {
    const proFeatures = [
      'live-trading',
      'advanced-analytics',
      'custom-alerts',
      'api-access',
    ]
    return proFeatures.includes(featureId)
  }, [])

  // Check if user has access to a feature
  const hasFeatureAccess = useCallback((featureId) => {
    if (isPro) return true
    return !requiresProAccess(featureId)
  }, [isPro, requiresProAccess])

  const value = useMemo(() => ({
    // Subscription
    isPro,
    setIsPro,
    togglePro,

    // Trading mode
    tradingMode,
    setTradingMode,

    // Upgrade modal
    showUpgradeModal,
    openUpgradeModal,
    closeUpgradeModal,
    handleUpgradeSuccess,

    // Luna chat
    showLunaChat,
    openLunaChat,
    closeLunaChat,

    // Feature access
    requiresProAccess,
    hasFeatureAccess,
  }), [
    isPro,
    tradingMode,
    showUpgradeModal,
    togglePro,
    openUpgradeModal,
    closeUpgradeModal,
    handleUpgradeSuccess,
    showLunaChat,
    openLunaChat,
    closeLunaChat,
    requiresProAccess,
    hasFeatureAccess,
  ])

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export default AppContext

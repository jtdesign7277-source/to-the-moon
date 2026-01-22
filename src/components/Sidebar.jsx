import { useState } from 'react'
import { 
  Menu, 
  X, 
  Rocket, 
  Crown, 
  LogOut, 
  User,
  Lock
} from 'lucide-react'
import { useApp } from '../hooks/useApp'

const Sidebar = ({ 
  navItems, 
  currentPage, 
  onNavigate, 
  user, 
  onLogout,
  exploreItems = []
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const { isPro, tradingMode, setTradingMode, openUpgradeModal } = useApp()

  // All nav items combined
  const allItems = [...navItems, ...exploreItems]

  return (
    <>
      {/* Edge Tab - Always visible */}
      <div 
        className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-out ${
          isExpanded ? 'w-56' : 'w-12'
        }`}
      >
        {/* Sidebar Container */}
        <div className="h-full bg-white border-r border-gray-200 shadow-lg flex flex-col">
          
          {/* Logo & Toggle */}
          <div className="p-2 border-b border-gray-100 flex flex-col items-center gap-2">
            {/* Rocket Logo */}
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            
            {/* Hamburger Toggle Button - Below Rocket */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
              title={isExpanded ? 'Collapse menu' : 'Expand menu'}
            >
              {isExpanded ? (
                <X className="w-5 h-5 text-gray-500" />
              ) : (
                <Menu className="w-5 h-5 text-gray-500" />
              )}
            </button>
            
            {/* App Name - Only when expanded */}
            {isExpanded && (
              <span className="font-bold text-xs text-gray-900 whitespace-nowrap">TO THE MOON</span>
            )}
          </div>

          {/* Trading Mode Toggle */}
          {isExpanded && (
            <div className="p-2 border-b border-gray-100">
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setTradingMode('paper')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                    tradingMode === 'paper'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  Paper
                </button>
                <button
                  onClick={() => setTradingMode('live')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                    tradingMode === 'live'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  Live
                </button>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto py-2 px-1.5">
            {/* Main Nav */}
            <div className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPage === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.requiresPro && !isPro) {
                        openUpgradeModal()
                        return
                      }
                      onNavigate(item.id)
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    } ${!isExpanded && 'justify-center'}`}
                    title={!isExpanded ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {isExpanded && (
                      <span className="text-sm font-medium truncate">{item.shortLabel || item.label}</span>
                    )}
                    {isExpanded && item.requiresPro && !isPro && (
                      <Lock className="w-3 h-3 text-indigo-600 ml-auto" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Explore Section */}
            {exploreItems.length > 0 && (
              <>
                {isExpanded && (
                  <p className="px-2 py-2 mt-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Explore
                  </p>
                )}
                {!isExpanded && <div className="my-2 mx-2 border-t border-gray-200" />}
                <div className="space-y-0.5">
                  {exploreItems.map((item) => {
                    const Icon = item.icon
                    const isActive = currentPage === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-all ${
                          isActive
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        } ${!isExpanded && 'justify-center'}`}
                        title={!isExpanded ? item.label : undefined}
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        {isExpanded && (
                          <span className="text-sm font-medium truncate">{item.label}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </nav>

          {/* User Section */}
          {user && (
            <div className="border-t border-gray-200 p-2">
              {isExpanded ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{user.username}</p>
                      <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                    </div>
                    {isPro && (
                      <span className="px-1.5 py-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[9px] font-bold rounded">
                        PRO
                      </span>
                    )}
                  </div>
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <div 
                    className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mx-auto cursor-pointer hover:bg-indigo-200"
                    title={user.username}
                    onClick={() => setIsExpanded(true)}
                  >
                    <User className="w-4 h-4 text-indigo-600" />
                  </div>
                  {isPro && (
                    <div className="flex justify-center">
                      <Crown className="w-4 h-4 text-indigo-600" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Backdrop when expanded on mobile */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  )
}

export default Sidebar

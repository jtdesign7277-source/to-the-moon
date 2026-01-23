import {
  Rocket,
  Lock,
  ChevronRight
} from 'lucide-react'
import { useApp } from '../hooks/useApp'

const Sidebar = ({
  navItems,
  currentPage,
  onNavigate,
  user,
  onLogout,
  exploreItems = [],
  isExpanded,
  setIsExpanded
}) => {
  const { isPro, tradingMode, setTradingMode, openUpgradeModal } = useApp()

  // All nav items combined
  const allItems = [...navItems, ...exploreItems]

  return (
    <>
      {/* Mobile: Floating menu button when collapsed */}
      <button
        onClick={() => setIsExpanded(true)}
        className={`lg:hidden fixed left-2 top-2 z-50 w-10 h-10 bg-white border-2 border-indigo-500 rounded-xl shadow-lg flex items-center justify-center transition-all duration-300 ${
          isExpanded ? 'opacity-0 pointer-events-none scale-75' : 'opacity-100'
        }`}
      >
        <Rocket className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />
      </button>

      {/* Sidebar - Hidden on mobile when collapsed, always visible on desktop */}
      <div 
        className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-out ${
          isExpanded ? 'w-56 translate-x-0' : 'w-12 -translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Container */}
        <div className="h-full bg-white border-r border-gray-200 shadow-lg flex flex-col">
          
          {/* Logo & Toggle */}
          <div className="p-2 border-b border-gray-100">
            {isExpanded ? (
              /* Expanded: Logo + Name + Collapse Button */
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 border-2 border-indigo-500 rounded-lg flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />
                  </div>
                  <span className="font-bold text-sm text-gray-900 whitespace-nowrap">TO THE MOON</span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
                  title="Collapse menu"
                >
                  <ChevronRight className="w-4 h-4 text-gray-500 rotate-180" />
                </button>
              </div>
            ) : (
              /* Collapsed: Clickable Logo */
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setIsExpanded(true)}
                  className="w-8 h-8 border-2 border-indigo-500 rounded-lg flex items-center justify-center hover:bg-indigo-50 transition-colors"
                  title="Expand menu"
                >
                  <Rocket className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />
                </button>
              </div>
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
        </div>
      </div>

      {/* Backdrop - visible on mobile, invisible on desktop but still clickable */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 lg:bg-transparent z-40 cursor-pointer"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  )
}

export default Sidebar

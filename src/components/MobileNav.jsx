import { Lock } from 'lucide-react'
import { useApp } from '../hooks/useApp'

const MobileNav = ({ navItems, currentPage, onNavigate }) => {
  const { isPro, openUpgradeModal } = useApp()

  const handleNavigation = (pageId, requiresPro) => {
    if (requiresPro && !isPro) {
      openUpgradeModal()
      return
    }
    onNavigate(pageId)
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40 pb-safe transition-colors duration-200">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          const isLocked = item.requiresPro && !isPro

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id, item.requiresPro)}
              className={`flex flex-col items-center py-2 px-3 min-w-0 flex-1 transition-colors ${
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                {isLocked && (
                  <Lock className="w-2.5 h-2.5 absolute -top-1 -right-1 text-indigo-600" />
                )}
              </div>
              <span className={`text-xs mt-1 truncate ${isActive ? 'font-medium' : ''}`}>
                {item.shortLabel || item.label.split(' ')[0]}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default MobileNav

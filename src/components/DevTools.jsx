import { Settings } from 'lucide-react'
import { useApp } from '../hooks/useApp'

const DevTools = () => {
  const { isPro, togglePro } = useApp()

  // Only show in development
  if (import.meta.env.PROD) return null

  return (
    <div className="fixed bottom-24 lg:bottom-4 right-4 z-50">
      <button
        onClick={togglePro}
        className="px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg hover:bg-gray-700 flex items-center gap-2 transition-colors"
      >
        <Settings className="w-3 h-3" />
        Pro: {isPro ? 'ON' : 'OFF'}
      </button>
    </div>
  )
}

export default DevTools

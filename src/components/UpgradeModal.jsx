import { X, Crown, Check, Zap, Shield, BarChart3, Sparkles } from 'lucide-react'
import { useApp } from '../hooks/useApp'
import { trackProUpgrade } from '../utils/analytics'

const UpgradeModal = () => {
  const { showUpgradeModal, closeUpgradeModal, handleUpgradeSuccess } = useApp()

  if (!showUpgradeModal) return null

  const benefits = [
    {
      icon: Zap,
      title: 'Strategy Builder Pro',
      description: 'Create unlimited custom trading strategies',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Deep insights and performance metrics',
    },
    {
      icon: Shield,
      title: 'Live Trading',
      description: 'Deploy strategies with real capital',
    },
    {
      icon: Sparkles,
      title: 'Priority Support',
      description: '24/7 dedicated support team',
    },
  ]

  const handleUpgrade = () => {
    // In production, this would integrate with Stripe or another payment provider
    // For now, we simulate a successful upgrade

    // Track Pro upgrade conversion in Google Analytics
    trackProUpgrade(9.99, 'monthly')

    handleUpgradeSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeUpgradeModal}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={closeUpgradeModal}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with gradient */}
        <div className="relative pt-8 pb-6 px-6 text-center bg-linear-to-br from-indigo-500 to-purple-600">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJsLTItMmMwIDAtMiAyLTIgNHMyIDQgMiA0IDIgMiA0IDJsMiAyYzAgMCAyLTIgMi00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          <div className="relative">
            <div className="mx-auto w-16 h-16 mb-4 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Upgrade to Pro</h2>
            <p className="mt-2 text-indigo-100">Unlock your full trading potential</p>
          </div>
        </div>

        {/* Benefits */}
        <div className="px-6 py-6 space-y-4">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <div key={index} className="flex items-start gap-3">
                <div className="shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{benefit.title}</h3>
                  <p className="text-sm text-gray-500">{benefit.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Pricing & CTA */}
        <div className="px-6 pb-8 pt-2">
          <div className="text-center mb-4">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-gray-900">$9.99</span>
              <span className="text-gray-500">/month</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Billed monthly. Cancel anytime.</p>
          </div>

          <button
            onClick={handleUpgrade}
            className="w-full py-3.5 px-4 bg-linear-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Upgrade Now
          </button>

          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3" />
              7-day free trial
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3" />
              Cancel anytime
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UpgradeModal

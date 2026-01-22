import { motion } from 'framer-motion'
import React from 'react'

/**
 * SkeletonCard - Simulates a card loading state
 */
export const SkeletonCard = ({ animated = true }) => (
  <div className="bg-white rounded-xl p-5 border border-gray-100">
    <div className="space-y-4">
      <div className={`h-4 w-24 bg-gray-200 rounded ${animated ? 'animate-pulse' : ''}`} />
      <div className={`h-8 w-32 bg-gray-200 rounded ${animated ? 'animate-pulse' : ''}`} style={{ animationDelay: '0.1s' }} />
      <div className="space-y-2">
        <div className={`h-3 w-full bg-gray-200 rounded ${animated ? 'animate-pulse' : ''}`} style={{ animationDelay: '0.2s' }} />
        <div className={`h-3 w-3/4 bg-gray-200 rounded ${animated ? 'animate-pulse' : ''}`} style={{ animationDelay: '0.3s' }} />
      </div>
    </div>
  </div>
)

/**
 * SkeletonChart - Simulates a chart loading state
 */
export const SkeletonChart = ({ animated = true }) => (
  <div className="bg-white rounded-xl p-6 border border-gray-100">
    <div className="space-y-4">
      <div className={`h-4 w-32 bg-gray-200 rounded ${animated ? 'animate-pulse' : ''}`} />
      <div className="h-64 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg" style={{
        backgroundSize: '1000px 100%',
        animation: animated ? 'shimmer 2s infinite' : 'none',
      }} />
    </div>
  </div>
)

/**
 * SkeletonTable - Simulates a table loading state
 */
export const SkeletonTable = ({ rows = 3, animated = true }) => (
  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
    <div className="divide-y divide-gray-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg bg-gray-200 ${animated ? 'animate-pulse' : ''}`} />
          <div className="flex-1 space-y-2">
            <div className={`h-4 w-32 bg-gray-200 rounded ${animated ? 'animate-pulse' : ''}`} />
            <div className={`h-3 w-48 bg-gray-200 rounded ${animated ? 'animate-pulse' : ''}`} style={{ animationDelay: '0.1s' }} />
          </div>
          <div className={`w-20 h-6 bg-gray-200 rounded ${animated ? 'animate-pulse' : ''}`} style={{ animationDelay: '0.2s' }} />
        </div>
      ))}
    </div>
  </div>
)

/**
 * SkeletonText - Simulates text loading state
 */
export const SkeletonText = ({ lines = 3, animated = true }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={`h-4 bg-gray-200 rounded ${animated ? 'animate-pulse' : ''}`}
        style={{
          width: i === lines - 1 ? '75%' : '100%',
          animationDelay: `${i * 0.1}s`,
        }}
      />
    ))}
  </div>
)

/**
 * SkeletonGrid - Simulates a grid of cards loading state
 */
export const SkeletonGrid = ({ count = 4, animated = true }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} animated={animated} />
    ))}
  </div>
)

/**
 * SkeletonDashboard - Full dashboard loading skeleton
 */
export const SkeletonDashboard = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" style={{ animationDelay: '0.1s' }} />
    </div>

    <SkeletonGrid count={4} animated={true} />

    <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
          <div className="h-6 w-12 bg-gray-200 rounded animate-pulse mt-2" style={{ animationDelay: `${i * 0.1 + 0.1}s` }} />
        </div>
      ))}
    </div>

    <div className="grid lg:grid-cols-3 gap-6">
      <SkeletonChart />
      <SkeletonChart />
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="mt-6 h-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg" style={{
          backgroundSize: '1000px 100%',
          animation: 'shimmer 2s infinite',
        }} />
      </div>
    </div>

    <SkeletonTable rows={5} animated={true} />
  </div>
)

/**
 * Pulse - Simple animated pulse for live indicators
 */
export const Pulse = ({ className = 'w-2 h-2 bg-green-500' }) => (
  <motion.div
    className={className}
    animate={{ opacity: [1, 0.5, 1] }}
    transition={{ duration: 2, repeat: Infinity }}
  />
)

/**
 * Loading Spinner with modern design
 */
export const LoadingSpinner = ({ size = 'md', message = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClasses[size]} relative`}>
        <motion.div
          className="w-full h-full border-2 border-gray-200 rounded-full"
          style={{ borderTopColor: '#6366f1' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      {message && (
        <motion.p
          className="text-sm text-gray-500 font-medium"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {message}
        </motion.p>
      )}
    </div>
  )
}

export default {
  SkeletonCard,
  SkeletonChart,
  SkeletonTable,
  SkeletonText,
  SkeletonGrid,
  SkeletonDashboard,
  Pulse,
  LoadingSpinner,
}
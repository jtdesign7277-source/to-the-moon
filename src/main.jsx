import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'

// Initialize Sentry for error tracking (only in production)
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,

    // Performance monitoring
    tracesSampleRate: 0.1, // 10% of transactions

    // Session replay for debugging
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Filter out noisy errors
    ignoreErrors: [
      // Browser extensions
      /ResizeObserver loop/,
      /Non-Error promise rejection/,
      // Network errors (expected)
      /Failed to fetch/,
      /NetworkError/,
      /Load failed/,
    ],

    // Add context to errors
    beforeSend(event) {
      // Don't send errors in development
      if (import.meta.env.DEV) {
        console.log('[Sentry] Would send event:', event)
        return null
      }
      return event
    },
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">
              We've been notified and are working on it. Please try refreshing the page.
            </p>
            <div className="space-y-2">
              <button
                onClick={resetError}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Refresh Page
              </button>
            </div>
            {import.meta.env.DEV && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer">Error details</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {error?.message || 'Unknown error'}
                </pre>
              </details>
            )}
          </div>
        </div>
      )}
      onError={(error, componentStack) => {
        console.error('React Error Boundary caught:', error, componentStack)
      }}
    >
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)

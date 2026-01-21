import { useState, useEffect } from 'react'
import {
  Rocket,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Check,
} from 'lucide-react'
import { trackSignup } from '../utils/analytics'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Google OAuth Client ID - set this in your .env file
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

// Avatar options - Using DiceBear API for consistent, stylish avatars
const AVATAR_OPTIONS = [
  { id: 'trader-1', seed: 'felix', style: 'adventurer', bg: 'from-indigo-500 to-purple-600' },
  { id: 'trader-2', seed: 'aneka', style: 'adventurer', bg: 'from-pink-500 to-rose-600' },
  { id: 'trader-3', seed: 'shadow', style: 'adventurer-neutral', bg: 'from-slate-600 to-slate-800' },
  { id: 'trader-4', seed: 'zorro', style: 'avataaars', bg: 'from-amber-500 to-orange-600' },
  { id: 'trader-5', seed: 'luna', style: 'bottts', bg: 'from-cyan-500 to-blue-600' },
  { id: 'trader-6', seed: 'rocket', style: 'fun-emoji', bg: 'from-green-500 to-emerald-600' },
]

// Generate avatar URL from DiceBear
const getAvatarUrl = (style, seed) => {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=transparent`
}

export default function Auth({ onSuccess, onBack, onAdminAccess, initialMode }) {
  const [mode, setMode] = useState(initialMode || 'signup') // 'login' | 'signup' | 'forgot' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [resetToken, setResetToken] = useState('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0])

  // Check for reset token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      setResetToken(token)
      setMode('reset')
      verifyResetToken(token)
    }
  }, [])

  // Initialize Google Sign-In
  useEffect(() => {
    if (GOOGLE_CLIENT_ID && window.google) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
      })
    }
  }, [])

  const handleGoogleSignIn = () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Sign-In is not configured yet. Please use email signup.')
      return
    }
    
    if (window.google) {
      setIsGoogleLoading(true)
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setError('Google Sign-In popup was blocked. Please enable popups.')
        }
        setIsGoogleLoading(false)
      })
    } else {
      setError('Google Sign-In is loading. Please try again.')
    }
  }

  const handleGoogleCallback = async (response) => {
    setIsGoogleLoading(true)
    setError('')
    
    try {
      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        localStorage.setItem('ttm_access_token', data.access_token)
        if (data.isNewUser) {
          trackSignup(data.user.email)
        }
        onSuccess(data.user)
      } else {
        setError(data.message || 'Google authentication failed')
      }
    } catch (err) {
      setError('Unable to connect to server')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const verifyResetToken = async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-reset-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await response.json()
      if (!data.valid) {
        setError(data.error || 'Invalid or expired reset link')
      } else {
        setEmail(data.email)
      }
    } catch (err) {
      setError('Failed to verify reset link')
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email) {
      setError('Please enter your email address')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Check your email for a password reset link.')
      } else {
        setError(data.error || 'Failed to send reset email')
      }
    } catch (err) {
      setError('Unable to connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!password) {
      setError('Please enter a new password')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Password reset successfully! You can now log in.')
        window.history.replaceState({}, '', window.location.pathname)
        setTimeout(() => {
          setMode('login')
          setSuccess('')
          setPassword('')
          setConfirmPassword('')
        }, 2000)
      } else {
        setError(data.error || 'Failed to reset password')
      }
    } catch (err) {
      setError('Unable to connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Secret admin access
    if (email.toLowerCase() === 'admin' && mode === 'login') {
      if (password) {
        localStorage.setItem('ttm_admin_key', password)
        if (onAdminAccess) {
          onAdminAccess()
        }
      } else {
        setError('Enter admin key as password')
      }
      return
    }

    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    if (mode === 'signup' && password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup'
      const body = mode === 'login'
        ? { email, password }
        : { 
            email, 
            password, 
            username: username || email.split('@')[0],
            avatar: getAvatarUrl(selectedAvatar.style, selectedAvatar.seed),
            avatarStyle: selectedAvatar.id,
          }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        localStorage.setItem('ttm_access_token', data.access_token)
        if (mode === 'signup') {
          trackSignup(email)
        }
        onSuccess(data.user)
      } else {
        setError(data.message || 'Authentication failed')
      }
    } catch (err) {
      setError('Unable to connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  // Google icon SVG
  const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-indigo-50 to-purple-100 flex items-center justify-center px-4 py-8">
      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 flex items-center gap-2 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      <div className="w-full max-w-md">
        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/25">
              <Rocket className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === 'login' && 'Welcome back'}
              {mode === 'signup' && 'Welcome to ToTheMoon'}
              {mode === 'forgot' && 'Reset Password'}
              {mode === 'reset' && 'Set New Password'}
            </h1>
            <p className="text-gray-500 mt-2">
              {mode === 'login' && 'Sign in to continue trading'}
              {mode === 'signup' && 'We help traders become profitable!'}
              {mode === 'forgot' && 'Enter your email to receive a reset link'}
              {mode === 'reset' && 'Choose a secure password'}
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign In - Only for login/signup */}
          {(mode === 'login' || mode === 'signup') && (
            <>
              <button
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full py-3 px-4 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                  <>
                    <GoogleIcon />
                    Sign {mode === 'login' ? 'in' : 'up'} with Google
                  </>
                )}
              </button>
              <div id="google-signin-btn" className="hidden" />

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">or</span>
                </div>
              </div>
            </>
          )}

          {/* Forgot Password Form */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <p className="text-center text-sm text-gray-500">
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}

          {/* Reset Password Form */}
          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}

          {/* Login/Signup Form */}
          {(mode === 'login' || mode === 'signup') && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Create password' : 'Password'}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Forgot Password Link (login only) */}
              {mode === 'login' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); }}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : mode === 'login' ? (
                  'Sign in'
                ) : (
                  'Sign up'
                )}
              </button>

              {/* Terms (signup only) */}
              {mode === 'signup' && (
                <p className="text-center text-sm text-gray-500">
                  By creating an account you agree to our{' '}
                  <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">
                    Privacy Policy
                  </a>
                </p>
              )}

              {/* Toggle Login/Signup */}
              <p className="text-center text-sm text-gray-500 pt-2">
                {mode === 'login' ? (
                  <>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('signup'); setError(''); }}
                      className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setError(''); }}
                      className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

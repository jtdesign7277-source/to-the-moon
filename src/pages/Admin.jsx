import { useState, useEffect } from 'react'
import {
  Users,
  Mail,
  Calendar,
  RefreshCw,
  Download,
  Shield,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function Admin({ onBack }) {
  const [adminKey, setAdminKey] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [waitlist, setWaitlist] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Check for stored admin key on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('ttm_admin_key')
    if (storedKey) {
      setAdminKey(storedKey)
      // Auto-fetch with stored key
      fetchWaitlistWithKey(storedKey)
    }
  }, [])

  const fetchWaitlistWithKey = async (key) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/waitlist/admin`, {
        headers: {
          'X-Admin-Key': key,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setWaitlist(data.entries || [])
        setIsAuthenticated(true)
      } else {
        setError(data.message || 'Failed to fetch waitlist')
        setIsAuthenticated(false)
        localStorage.removeItem('ttm_admin_key')
      }
    } catch (err) {
      setError('Unable to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const fetchWaitlist = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/waitlist/admin`, {
        headers: {
          'X-Admin-Key': adminKey,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setWaitlist(data.entries || [])
        setIsAuthenticated(true)
      } else {
        setError(data.message || 'Failed to fetch waitlist')
        setIsAuthenticated(false)
      }
    } catch (err) {
      setError('Unable to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (e) => {
    e.preventDefault()
    fetchWaitlist()
  }

  const exportCSV = () => {
    const headers = ['Email', 'Joined At']
    const rows = waitlist.map((entry) => [
      entry.email,
      new Date(entry.joined_at).toLocaleString(),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `waitlist-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white text-center mb-2">
              Admin Access
            </h1>
            <p className="text-gray-400 text-center mb-6">
              Enter admin key to view waitlist
            </p>

            <form onSubmit={handleLogin}>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Admin Key"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              />

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm mb-4">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !adminKey}
                className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Access Dashboard
                  </>
                )}
              </button>
            </form>

            {onBack && (
              <button
                onClick={onBack}
                className="mt-4 w-full text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to App
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-indigo-400" />
              Waitlist Admin
            </h1>
            <p className="text-gray-400 mt-1">
              Manage your beta waitlist signups
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchWaitlist}
              disabled={loading}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={exportCSV}
              disabled={waitlist.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-white font-medium transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Signups</p>
                <p className="text-2xl font-bold text-white">{waitlist.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Display Count</p>
                <p className="text-2xl font-bold text-white">{waitlist.length + 500}+</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Latest Signup</p>
                <p className="text-lg font-bold text-white">
                  {waitlist.length > 0
                    ? formatDate(waitlist[0]?.joined_at)
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Waitlist Table */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-400" />
              Waitlist Entries
            </h2>
          </div>

          {waitlist.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No waitlist signups yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {waitlist.map((entry, index) => (
                    <tr
                      key={entry.email}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {entry.email.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white">{entry.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {formatDate(entry.joined_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="mt-8 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </button>
        )}
      </div>
    </div>
  )
}

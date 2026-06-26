'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      // Redirect based on role
      if (data.user.is_admin) {
        router.push('/admin/dashboard')
      } else {
        router.push('/guide/dashboard')
      }
      
      router.refresh()
    } catch (err) {
      setError('An error occurred during login')
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    setError('')
    setMessage('')

    if (!email) {
      setError('Enter your email address first, then request a password reset.')
      return
    }

    setResetLoading(true)

    const redirectTo = `${window.location.origin}/update-password`
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    setResetLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setMessage('Check your email for a link to set a new password.')
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="heading-font text-4xl font-light text-stone-800 mb-2">Staff Login</h1>
          <p className="text-stone-600 text-sm">Light & Truth</p>
        </div>

        {/* Login Form */}
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-600 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {message && (
              <div className="border-l-4 border-l-emerald-600 bg-emerald-50 p-4">
                <p className="text-sm text-emerald-800">{message}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-stone-300 focus:border-stone-800 focus:outline-none text-sm transition-all rounded"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-stone-300 focus:border-stone-800 focus:outline-none text-sm transition-all rounded"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-stone-800 text-white font-semibold py-4 px-6 hover:bg-stone-900 transition-all uppercase tracking-widest text-xs rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={resetLoading}
              className="w-full text-sm font-semibold text-stone-600 transition-colors hover:text-stone-900 disabled:opacity-50"
            >
              {resetLoading ? 'Sending reset link...' : 'Forgot or need to set your password?'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-stone-200 text-center">
            <a href="/" className="text-sm text-stone-600 hover:text-stone-800">
              ← Back to Home
            </a>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-stone-500">
            Having trouble logging in? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  )
}


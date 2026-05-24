'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    const establishSession = async () => {
      setError('')

      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      if (code) {
        const { error: codeError } = await supabase.auth.exchangeCodeForSession(code)
        if (codeError) {
          setError(codeError.message)
          setCheckingSession(false)
          return
        }

        window.history.replaceState({}, document.title, '/update-password')
      }

      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (sessionError) {
          setError(sessionError.message)
          setCheckingSession(false)
          return
        }

        window.history.replaceState({}, document.title, '/update-password')
      }

      const { data: { user } } = await supabase.auth.getUser()
      setHasSession(!!user)
      setCheckingSession(false)
    }

    void establishSession()
  }, [supabase])

  const redirectAfterUpdate = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.email) {
      router.push('/login')
      return
    }

    const { data: guide } = await supabase
      .from('guides')
      .select('is_admin')
      .eq('email', user.email)
      .eq('is_active', true)
      .single()

    router.push(guide?.is_admin ? '/admin/dashboard' : '/guide/dashboard')
    router.refresh()
  }

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setMessage('Password updated. Redirecting...')
    await redirectAfterUpdate()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="heading-font mb-2 text-4xl font-light text-stone-800">Set New Password</h1>
          <p className="text-sm text-stone-600">Shine Tours staff access</p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
          {checkingSession ? (
            <div className="text-center">
              <p className="text-sm text-stone-600">Checking your reset link...</p>
            </div>
          ) : !hasSession ? (
            <div className="space-y-5 text-center">
              <div className="border-l-4 border-l-red-600 bg-red-50 p-4 text-left">
                <p className="text-sm text-red-800">
                  {error || 'This password reset link is invalid or expired. Please request a new one.'}
                </p>
              </div>
              <a href="/login" className="inline-flex text-sm font-semibold text-stone-700 hover:text-stone-950">
                Back to login
              </a>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              {error && (
                <div className="border-l-4 border-l-red-600 bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {message && (
                <div className="border-l-4 border-l-emerald-600 bg-emerald-50 p-4">
                  <p className="text-sm text-emerald-800">{message}</p>
                </div>
              )}

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-stone-700">
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded border-2 border-stone-300 px-4 py-3 text-sm transition-all focus:border-stone-800 focus:outline-none"
                  placeholder="Enter a new password"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-stone-700">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded border-2 border-stone-300 px-4 py-3 text-sm transition-all focus:border-stone-800 focus:outline-none"
                  placeholder="Confirm your new password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded bg-stone-800 px-6 py-4 text-xs font-semibold uppercase tracking-widest text-white transition-all hover:bg-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

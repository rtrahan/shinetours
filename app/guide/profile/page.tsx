'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StaffFooter, StaffHeader } from '@/components/StaffChrome'

export default function GuideProfile() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    languages: [] as string[],
    password: ''
  })

  // Available languages
  const availableLanguages = ['English', 'Spanish', 'Italian']

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const { data: guide } = await supabase
      .from('guides')
      .select('*')
      .eq('email', user.email)
      .single()

    if (guide) {
      setFormData({
        first_name: guide.first_name,
        last_name: guide.last_name,
        email: guide.email,
        phone: guide.phone || '',
        languages: guide.languages || ['English'],
        password: ''
      })
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: guide } = await supabase
        .from('guides')
        .select('id')
        .eq('email', user.email)
        .single()

      if (!guide) {
        setError('Guide not found')
        setSaving(false)
        return
      }

      const response = await fetch(`/api/guides/${guide.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          languages: formData.languages,
          password: formData.password || undefined
        })
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to update profile')
        setSaving(false)
        return
      }

      setSuccess('Profile updated successfully!')
      setFormData({ ...formData, password: '' }) // Clear password field
      setSaving(false)
      
      // Refresh session if email changed
      if (formData.email !== user.email) {
        setTimeout(() => router.push('/login'), 2000)
      }
    } catch (err) {
      setError('An error occurred')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-5 text-center shadow-2xl shadow-black/30">
          <p className="heading-font text-2xl font-light text-white">Loading profile...</p>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-stone-500">Light & Truth</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#241d18_0,#11100e_34%,#050505_100%)] text-stone-100">
      {/* Header */}
      <StaffHeader role="guide" active="profile" />

      {/* Main Content */}
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-8">
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-100/60">Guide Account</p>
          <h2 className="heading-font text-4xl font-light tracking-[-0.04em] text-white">Update Your Information</h2>
          <p className="mt-2 text-sm text-stone-400">Keep your contact information and guide languages up to date.</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#11100e] p-5 shadow-2xl shadow-black/20 md:p-6">

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-red-100 border-l-4 border-l-red-600 bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-emerald-100 border-l-4 border-l-emerald-600 bg-emerald-50 p-4">
                <p className="text-sm text-emerald-800">{success}</p>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">Identity</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-stone-300">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white placeholder:text-stone-600 transition-all focus:border-amber-200/70 focus:outline-none focus:ring-2 focus:ring-amber-200/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-stone-300">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white placeholder:text-stone-600 transition-all focus:border-amber-200/70 focus:outline-none focus:ring-2 focus:ring-amber-200/10"
                />
              </div>
            </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">Contact</p>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-stone-300">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white placeholder:text-stone-600 transition-all focus:border-amber-200/70 focus:outline-none focus:ring-2 focus:ring-amber-200/10"
              />
              <p className="text-xs text-stone-500 mt-1">Changing email will require you to log in again</p>

              <label className="mb-1.5 mt-4 block text-[10px] font-bold uppercase tracking-[0.16em] text-stone-300">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white placeholder:text-stone-600 transition-all focus:border-amber-200/70 focus:outline-none focus:ring-2 focus:ring-amber-200/10"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-stone-300">
                Languages I Can Guide In
              </label>
              <div className="grid grid-cols-2 gap-3">
                {availableLanguages.map((lang) => (
                  <label key={lang} className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.languages.includes(lang)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, languages: [...formData.languages, lang]})
                        } else {
                          setFormData({...formData, languages: formData.languages.filter(l => l !== lang)})
                        }
                      }}
                      className="h-4 w-4 rounded border-stone-500 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-stone-200">{lang}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-stone-500 mt-2">Select all languages you can conduct tours in</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-stone-300">
                New Password (optional)
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white placeholder:text-stone-600 transition-all focus:border-amber-200/70 focus:outline-none focus:ring-2 focus:ring-amber-200/10"
                placeholder="Leave blank to keep current password"
                minLength={6}
              />
              <p className="text-xs text-stone-500 mt-1">Minimum 6 characters if changing</p>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 pt-5">
              <button
                type="button"
                onClick={() => router.push('/guide/dashboard')}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 font-semibold text-stone-300 transition-all hover:bg-white/[0.08] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-md transition-all hover:bg-blue-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <StaffFooter />
    </div>
  )
}


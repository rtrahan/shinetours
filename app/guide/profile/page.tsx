'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-stone-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 md:gap-3">
            <svg className="w-6 h-6 md:w-8 md:h-8 text-stone-700" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            <div>
              <h1 className="heading-font text-lg md:text-2xl font-light text-stone-800">My Profile</h1>
              <p className="text-[10px] md:text-xs text-stone-500 uppercase tracking-widest">Shine Tours</p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-6 text-xs md:text-sm">
            <a href="/guide/dashboard" className="text-stone-600 hover:text-stone-800 uppercase tracking-wide">← Dashboard</a>
            <button 
              onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
              className="text-stone-600 hover:text-stone-800 uppercase tracking-wide"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-6 md:p-8">
          <h2 className="text-2xl font-bold text-stone-900 mb-6">Update Your Information</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-600 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4">
                <p className="text-sm text-emerald-800">{success}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  required
                  className="w-full px-4 py-3 border-2 border-stone-300 focus:border-stone-800 focus:outline-none text-sm transition-all rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  required
                  className="w-full px-4 py-3 border-2 border-stone-300 focus:border-stone-800 focus:outline-none text-sm transition-all rounded"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                className="w-full px-4 py-3 border-2 border-stone-300 focus:border-stone-800 focus:outline-none text-sm transition-all rounded"
              />
              <p className="text-xs text-stone-500 mt-1">Changing email will require you to log in again</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-3 border-2 border-stone-300 focus:border-stone-800 focus:outline-none text-sm transition-all rounded"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                Languages I Can Guide In
              </label>
              <div className="grid grid-cols-2 gap-3">
                {availableLanguages.map((lang) => (
                  <label key={lang} className="flex items-center gap-2 cursor-pointer">
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
                      className="w-4 h-4 text-blue-600 border-stone-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-stone-700">{lang}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-stone-500 mt-2">Select all languages you can conduct tours in</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                New Password (optional)
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 border-2 border-stone-300 focus:border-stone-800 focus:outline-none text-sm transition-all rounded"
                placeholder="Leave blank to keep current password"
                minLength={6}
              />
              <p className="text-xs text-stone-500 mt-1">Minimum 6 characters if changing</p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push('/guide/dashboard')}
                className="px-6 py-3 border-2 border-stone-300 text-stone-700 font-semibold hover:bg-stone-50 transition-all rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all rounded shadow-md disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


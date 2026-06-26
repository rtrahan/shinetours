'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StaffFooter, StaffHeader } from '@/components/StaffChrome'

interface Guide {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
  languages: string[]
  is_admin: boolean
  is_active: boolean
  public_visible?: boolean
  created_at: string
}

export default function UsersPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [guides, setGuides] = useState<Guide[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    languages: ['English'] as string[],
    is_admin: false,
    public_visible: true
  })
  const [editFormData, setEditFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    languages: [] as string[],
    is_admin: false,
    public_visible: true,
    password: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Available languages
  const availableLanguages = ['English', 'Spanish', 'Italian']
  const adminCount = guides.filter(guide => guide.is_admin).length
  const activeCount = guides.filter(guide => guide.is_active).length
  const publicCount = guides.filter(guide => guide.public_visible !== false && guide.is_active).length
  const languageCount = new Set(guides.flatMap(guide => guide.languages || [])).size

  useEffect(() => {
    checkAuth()
    fetchGuides()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
    }
  }

  const fetchGuides = async () => {
    const response = await fetch('/api/guides?all=true')
    if (response.ok) {
      const data = await response.json()
      setGuides(data)
    }
    setLoading(false)
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create user')
        setSaving(false)
        return
      }

      // Reset form and close modal
      setFormData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        languages: ['English'],
        is_admin: false,
        public_visible: true
      })
      setShowAddModal(false)
      fetchGuides()
      setSaving(false)
    } catch (err) {
      setError('An error occurred')
      setSaving(false)
    }
  }

  const toggleActive = async (guideId: string, currentStatus: boolean) => {
    await fetch(`/api/guides/${guideId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !currentStatus })
    })
    fetchGuides()
  }

  const openEditModal = (guide: Guide) => {
    setEditingGuide(guide)
    setEditFormData({
      email: guide.email,
      first_name: guide.first_name,
      last_name: guide.last_name,
      phone: guide.phone || '',
      languages: guide.languages || ['English'],
      is_admin: guide.is_admin,
      public_visible: guide.public_visible !== false,
      password: ''
    })
    setShowEditModal(true)
    setError('')
  }

  const handleDeleteUser = async (guideId: string, guideName: string) => {
    if (!confirm(`Are you sure you want to permanently delete ${guideName}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/guides/${guideId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchGuides()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete user')
      }
    } catch (err) {
      alert('An error occurred while deleting user')
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGuide) return
    
    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/guides/${editingGuide.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update user')
        setSaving(false)
        return
      }

      setShowEditModal(false)
      setEditingGuide(null)
      fetchGuides()
      setSaving(false)
    } catch (err) {
      setError('An error occurred')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-5 text-center shadow-2xl shadow-black/30">
          <p className="heading-font text-2xl font-light text-white">Loading users...</p>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-stone-500">Light & Truth</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#241d18_0,#11100e_34%,#050505_100%)] text-stone-100">
      {/* Header */}
      <StaffHeader role="admin" active="users" />

      {/* Main Content */}
      <div className="mx-auto max-w-[1800px] px-4 py-4 md:px-8">
        <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <div className="rounded-xl border border-amber-200/20 bg-amber-300/10 px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber-100/70">All Users</p>
            <p className="heading-font mt-1 text-3xl font-light leading-none text-white">{guides.length}</p>
          </div>
          <div className="rounded-xl border border-emerald-200/20 bg-emerald-300/10 px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-100/70">Active</p>
            <p className="heading-font mt-1 text-3xl font-light leading-none text-white">{activeCount}</p>
          </div>
          <div className="rounded-xl border border-purple-200/20 bg-purple-300/10 px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-purple-100/70">Admins</p>
            <p className="heading-font mt-1 text-3xl font-light leading-none text-white">{adminCount}</p>
          </div>
          <div className="rounded-xl border border-blue-200/20 bg-blue-300/10 px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-100/70">Public</p>
            <p className="heading-font mt-1 text-3xl font-light leading-none text-white">{publicCount}</p>
            <p className="mt-1 text-[10px] text-stone-500">{languageCount} languages</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-100/60">Directory</p>
            <h2 className="heading-font text-3xl font-light tracking-[-0.04em] text-white md:text-4xl">All Users</h2>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-stone-950 shadow-xl shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-stone-100"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add User
          </button>
        </div>

        {/* Users Table */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#11100e] shadow-2xl shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
            <thead className="border-b border-white/10 bg-white/[0.045]">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">User</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">Contact</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">Languages</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">Role</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">Status</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">Public</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {guides.map(guide => (
                <tr key={guide.id} className="transition-colors hover:bg-white/[0.04]">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-white">{guide.first_name} {guide.last_name}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-stone-600">
                      Joined {new Date(guide.created_at).getFullYear()}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`mailto:${guide.email}`} className="block text-sm font-medium text-blue-100 hover:text-white hover:underline">{guide.email}</a>
                    <p className="mt-1 text-xs text-stone-500">{guide.phone || 'No phone'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {guide.languages && guide.languages.length > 0 ? (
                        guide.languages.map((lang) => (
                          <span key={lang} className="inline-flex items-center rounded-full border border-blue-200/15 bg-blue-300/10 px-2 py-0.5 text-[10px] font-semibold text-blue-100/85">
                            {lang}
                          </span>
                        ))
                      ) : (
                        <span className="text-stone-600 text-xs italic">None</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                      guide.is_admin 
                        ? 'bg-purple-300/10 text-purple-100 border-purple-200/20' 
                        : 'bg-blue-300/10 text-blue-100 border-blue-200/20'
                    }`}>
                      {guide.is_admin ? 'Admin' : 'Guide'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(guide.id, guide.is_active)}
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors ${
                      guide.is_active 
                        ? 'bg-emerald-300/10 text-emerald-100 border-emerald-200/20 hover:bg-emerald-300/15' 
                        : 'bg-stone-300/10 text-stone-300 border-stone-200/15 hover:bg-stone-300/15'
                    }`}>
                      {guide.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                      guide.public_visible !== false
                        ? 'bg-amber-300/10 text-amber-100 border-amber-200/20'
                        : 'bg-stone-300/10 text-stone-300 border-stone-200/15'
                    }`}>
                      {guide.public_visible !== false ? 'Shown' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(guide)}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white transition-all hover:bg-blue-500"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(guide.id, `${guide.first_name} ${guide.last_name}`)}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white transition-all hover:bg-red-500"
                        title="Delete user permanently"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[88vh] w-full max-w-lg overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl shadow-black/40">
            <div className="border-b border-stone-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-400">User Management</p>
                  <h3 className="heading-font text-3xl font-light tracking-[-0.04em] text-stone-900">Add New User</h3>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setError('')
                  }}
                  className="rounded-full border border-stone-200 p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleAddUser} className="max-h-[calc(88vh-92px)] overflow-y-auto p-5">
              <div className="space-y-3">
                {error && (
                  <div className="rounded-xl border border-red-100 border-l-4 border-l-red-600 bg-red-50 p-4">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-stone-600">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      required
                      className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-950 placeholder:text-stone-400 transition-all focus:border-stone-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-stone-200"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-stone-600">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      required
                      className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-950 placeholder:text-stone-400 transition-all focus:border-stone-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-stone-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-stone-600">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-950 placeholder:text-stone-400 transition-all focus:border-stone-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-stone-200"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-stone-600">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-950 placeholder:text-stone-400 transition-all focus:border-stone-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-stone-200"
                  />
                  <p className="text-xs text-stone-500 mt-1">Minimum 6 characters</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-stone-600">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-950 placeholder:text-stone-400 transition-all focus:border-stone-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-stone-200"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-stone-600">
                    Languages
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableLanguages.map((lang) => (
                      <label key={lang} className="flex cursor-pointer items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
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
                        <span className="text-xs font-medium text-stone-700">{lang}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-stone-500 mt-2">Select all languages this guide can conduct tours in</p>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
                  <input
                    type="checkbox"
                    id="is_admin"
                    checked={formData.is_admin}
                    onChange={(e) => setFormData({...formData, is_admin: e.target.checked})}
                    className="w-5 h-5 text-purple-600 border-stone-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="is_admin" className="text-sm font-semibold text-stone-800">
                    Make this user an Admin
                  </label>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
                  <input
                    type="checkbox"
                    id="public_visible"
                    checked={formData.public_visible}
                    onChange={(e) => setFormData({...formData, public_visible: e.target.checked})}
                    className="mt-0.5 h-5 w-5 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="public_visible" className="text-sm font-semibold text-stone-800">
                    <span className="block">Show in public booking dropdown</span>
                    <span className="mt-1 block text-xs font-normal text-stone-500">
                      Turn this off for internal-only accounts that should not be selectable by visitors.
                    </span>
                  </label>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-3 border-t border-stone-200 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setError('')
                  }}
                  className="rounded-xl border border-stone-300 px-5 py-2.5 font-semibold text-stone-700 transition-all hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-stone-950 px-5 py-2.5 font-semibold text-white shadow-md transition-all hover:bg-stone-800 disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[88vh] w-full max-w-lg overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl shadow-black/40">
            <div className="border-b border-stone-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-400">User Management</p>
                  <h3 className="heading-font text-3xl font-light tracking-[-0.04em] text-stone-900">Edit User</h3>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingGuide(null)
                    setError('')
                  }}
                  className="rounded-full border border-stone-200 p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateUser} className="max-h-[calc(88vh-92px)] overflow-y-auto p-5">
              <div className="space-y-3">
                {error && (
                  <div className="rounded-xl border border-red-100 border-l-4 border-l-red-600 bg-red-50 p-4">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-stone-600">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    required
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-950 placeholder:text-stone-400 transition-all focus:border-stone-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-stone-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-stone-600">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editFormData.first_name}
                      onChange={(e) => setEditFormData({...editFormData, first_name: e.target.value})}
                      required
                      className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-950 placeholder:text-stone-400 transition-all focus:border-stone-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-stone-200"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-stone-600">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editFormData.last_name}
                      onChange={(e) => setEditFormData({...editFormData, last_name: e.target.value})}
                      required
                      className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-950 placeholder:text-stone-400 transition-all focus:border-stone-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-stone-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-stone-600">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-950 placeholder:text-stone-400 transition-all focus:border-stone-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-stone-200"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-stone-600">
                    Languages
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableLanguages.map((lang) => (
                      <label key={lang} className="flex cursor-pointer items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={editFormData.languages.includes(lang)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditFormData({...editFormData, languages: [...editFormData.languages, lang]})
                            } else {
                              setEditFormData({...editFormData, languages: editFormData.languages.filter(l => l !== lang)})
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-stone-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-xs font-medium text-stone-700">{lang}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-stone-500 mt-2">Select all languages this guide can conduct tours in</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-stone-600">
                    New Password (optional)
                  </label>
                  <input
                    type="password"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                    minLength={6}
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-950 placeholder:text-stone-400 transition-all focus:border-stone-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-stone-200"
                    placeholder="Leave blank to keep current password"
                  />
                  <p className="text-xs text-stone-500 mt-1">Only fill this in if you want to change the user's password (minimum 6 characters)</p>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
                  <input
                    type="checkbox"
                    id="edit_is_admin"
                    checked={editFormData.is_admin}
                    onChange={(e) => setEditFormData({...editFormData, is_admin: e.target.checked})}
                    className="w-5 h-5 text-purple-600 border-stone-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="edit_is_admin" className="text-sm font-semibold text-stone-800">
                    Admin privileges
                  </label>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
                  <input
                    type="checkbox"
                    id="edit_public_visible"
                    checked={editFormData.public_visible}
                    onChange={(e) => setEditFormData({...editFormData, public_visible: e.target.checked})}
                    className="mt-0.5 h-5 w-5 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="edit_public_visible" className="text-sm font-semibold text-stone-800">
                    <span className="block">Show in public booking dropdown</span>
                    <span className="mt-1 block text-xs font-normal text-stone-500">
                      Hidden users remain available internally but are not offered to public visitors.
                    </span>
                  </label>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-3 border-t border-stone-200 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingGuide(null)
                    setError('')
                  }}
                  className="rounded-xl border border-stone-300 px-5 py-2.5 font-semibold text-stone-700 transition-all hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-md transition-all hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <StaffFooter />
    </div>
  )
}


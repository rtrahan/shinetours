'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Guide {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
  languages: string[]
  is_admin: boolean
  is_active: boolean
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
    is_admin: false
  })
  const [editFormData, setEditFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    languages: [] as string[],
    is_admin: false,
    password: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Available languages
  const availableLanguages = ['English', 'Spanish', 'Italian']

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
        is_admin: false
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
            <div>
              <h1 className="heading-font text-lg md:text-2xl font-light text-stone-800">User Management</h1>
              <p className="text-[10px] md:text-xs text-stone-500 uppercase tracking-widest">Guides & Admins</p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-6 text-xs md:text-sm">
            <a href="/admin/dashboard" className="text-sm text-stone-600 hover:text-stone-800 uppercase tracking-wide">← Dashboard</a>
            <button 
              onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
              className="text-sm text-stone-600 hover:text-stone-800 uppercase tracking-wide"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 md:py-6">
        <div className="flex justify-between items-center mb-4 md:mb-6 flex-wrap gap-3">
          <h2 className="text-xl md:text-2xl font-bold text-stone-900">All Users ({guides.length})</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 md:px-6 py-2 md:py-3 bg-stone-900 text-white font-semibold rounded-lg hover:bg-stone-800 transition-colors shadow-md flex items-center gap-2 text-sm md:text-base"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add User
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
            <thead className="bg-stone-50 border-b-2 border-stone-200">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-bold uppercase tracking-wider text-stone-600">Name</th>
                <th className="text-left py-4 px-6 text-xs font-bold uppercase tracking-wider text-stone-600">Email</th>
                <th className="text-left py-4 px-6 text-xs font-bold uppercase tracking-wider text-stone-600">Phone</th>
                <th className="text-left py-4 px-6 text-xs font-bold uppercase tracking-wider text-stone-600">Languages</th>
                <th className="text-center py-4 px-6 text-xs font-bold uppercase tracking-wider text-stone-600">Role</th>
                <th className="text-center py-4 px-6 text-xs font-bold uppercase tracking-wider text-stone-600">Status</th>
                <th className="text-center py-4 px-6 text-xs font-bold uppercase tracking-wider text-stone-600 bg-stone-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {guides.map(guide => (
                <tr key={guide.id} className="hover:bg-stone-50 transition-colors">
                  <td className="py-4 px-6">
                    <p className="font-semibold text-stone-900">{guide.first_name} {guide.last_name}</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-stone-700 text-sm">{guide.email}</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-stone-700 text-sm">{guide.phone || '—'}</p>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-1">
                      {guide.languages && guide.languages.length > 0 ? (
                        guide.languages.map((lang) => (
                          <span key={lang} className="inline-flex items-center px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 font-medium">
                            {lang}
                          </span>
                        ))
                      ) : (
                        <span className="text-stone-400 text-sm italic">None</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      guide.is_admin 
                        ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {guide.is_admin ? 'Admin' : 'Guide'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      guide.is_active 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : 'bg-stone-100 text-stone-600 border border-stone-200'
                    }`}>
                      {guide.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <button
                        onClick={() => openEditModal(guide)}
                        className="px-4 py-2 text-xs font-bold rounded transition-all bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(guide.id, `${guide.first_name} ${guide.last_name}`)}
                        className="px-4 py-2 text-xs font-bold rounded transition-all bg-red-600 hover:bg-red-700 text-white"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-stone-200">
              <div className="flex items-center justify-between">
                <h3 className="heading-font text-2xl font-light text-stone-800">Add New User</h3>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setError('')
                  }}
                  className="text-stone-400 hover:text-stone-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleAddUser} className="p-6">
              <div className="space-y-4">
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-600 p-4">
                    <p className="text-sm text-red-800">{error}</p>
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
                      className="w-full px-3 py-2 border-2 border-stone-300 focus:border-stone-800 focus:outline-none text-sm transition-all rounded"
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
                      className="w-full px-3 py-2 border-2 border-stone-300 focus:border-stone-800 focus:outline-none text-sm transition-all rounded"
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
                    className="w-full px-3 py-2 border-2 border-stone-300 focus:border-stone-800 focus:outline-none text-sm transition-all rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    minLength={6}
                    className="w-full px-3 py-2 border-2 border-stone-300 focus:border-stone-800 focus:outline-none text-sm transition-all rounded"
                  />
                  <p className="text-xs text-stone-500 mt-1">Minimum 6 characters</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border-2 border-stone-300 focus:border-stone-800 focus:outline-none text-sm transition-all rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                    Languages
                  </label>
                  <div className="grid grid-cols-2 gap-2">
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
                        <span className="text-xs text-stone-700">{lang}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-stone-500 mt-2">Select all languages this guide can conduct tours in</p>
                </div>

                <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-lg">
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
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setError('')
                  }}
                  className="px-6 py-3 border-2 border-stone-300 text-stone-700 font-semibold hover:bg-stone-50 transition-all rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-stone-900 text-white font-semibold hover:bg-stone-800 transition-all rounded shadow-md disabled:opacity-50"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-stone-200">
              <div className="flex items-center justify-between">
                <h3 className="heading-font text-2xl font-light text-stone-800">Edit User</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingGuide(null)
                    setError('')
                  }}
                  className="text-stone-400 hover:text-stone-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6">
              <div className="space-y-4">
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-600 p-4">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    required
                    className="w-full px-3 py-2 border-2 border-stone-300 focus:border-stone-800 focus:outline-none text-sm transition-all rounded"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editFormData.first_name}
                      onChange={(e) => setEditFormData({...editFormData, first_name: e.target.value})}
                      required
                      className="w-full px-3 py-2 border-2 border-stone-300 focus:border-stone-800 focus:outline-none text-sm transition-all rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editFormData.last_name}
                      onChange={(e) => setEditFormData({...editFormData, last_name: e.target.value})}
                      required
                      className="w-full px-3 py-2 border-2 border-stone-300 focus:border-stone-800 focus:outline-none text-sm transition-all rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                    className="w-full px-3 py-2 border-2 border-stone-300 focus:border-stone-800 focus:outline-none text-sm transition-all rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                    Languages
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableLanguages.map((lang) => (
                      <label key={lang} className="flex items-center gap-2 cursor-pointer">
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
                        <span className="text-xs text-stone-700">{lang}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-stone-500 mt-2">Select all languages this guide can conduct tours in</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                    New Password (optional)
                  </label>
                  <input
                    type="password"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                    minLength={6}
                    className="w-full px-3 py-2 border-2 border-stone-300 focus:border-stone-800 focus:outline-none text-sm transition-all rounded"
                    placeholder="Leave blank to keep current password"
                  />
                  <p className="text-xs text-stone-500 mt-1">Only fill this in if you want to change the user's password (minimum 6 characters)</p>
                </div>

                <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-lg">
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
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingGuide(null)
                    setError('')
                  }}
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
      )}
    </div>
  )
}


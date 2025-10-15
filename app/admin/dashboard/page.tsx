'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import TourTable from '@/components/TourTable'
import FilterPills from '@/components/FilterPills'
import DetailsModal from '@/components/DetailsModal'
import YaleSubmissionModal from '@/components/YaleSubmissionModal'
import ConfirmationModal from '@/components/ConfirmationModal'
import { TourGroup } from '@/lib/types'

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = createClient()
  
  const [tours, setTours] = useState<TourGroup[]>([])
  const [ungroupedRequests, setUngroupedRequests] = useState<any[]>([])
  const [guides, setGuides] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedTour, setSelectedTour] = useState<TourGroup | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showYaleModal, setShowYaleModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    fetchTours()
    fetchUngrouped()
    fetchGuides()
    checkAuth()

    // Auto-refresh tours every 10 seconds
    const interval = setInterval(() => {
      fetchTours()
      fetchUngrouped()
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
    }
  }

  const fetchTours = async () => {
    const response = await fetch('/api/tours')
    const data = await response.json()
    // Filter out tour groups with 0 booking requests
    const toursWithBookings = data.filter((tour: TourGroup) => 
      tour.booking_requests && tour.booking_requests.length > 0
    )
    setTours(toursWithBookings)
    setLoading(false)
  }

  const fetchUngrouped = async () => {
    const response = await fetch('/api/bookings/ungrouped')
    if (response.ok) {
      const data = await response.json()
      setUngroupedRequests(data)
    }
  }

  const fetchGuides = async () => {
    const response = await fetch('/api/guides')
    if (response.ok) {
      const data = await response.json()
      setGuides(data)
    }
  }

  const handleAutoGroup = async (date: string) => {
    const response = await fetch('/api/tours/auto-group', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date })
    })

    if (response.ok) {
      fetchTours()
      fetchUngrouped()
    }
  }

  const handleAssignGuide = async (tourId: string, guideId: string) => {
    await fetch(`/api/tours/${tourId}/assign-guide`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guide_id: guideId })
    })
    fetchTours()
  }

  const handleAction = async (tourId: string, action: string) => {
    const tour = tours.find(t => t.id === tourId)
    if (!tour) return

    if (action === 'submit-yale') {
      setSelectedTour(tour)
      setShowYaleModal(true)
    } else if (action === 'confirm') {
      setSelectedTour(tour)
      setShowConfirmModal(true)
    } else if (action === 'complete') {
      await fetch(`/api/tours/${tourId}/complete`, { method: 'PATCH' })
      fetchTours()
    }
  }

  const handleSubmitYale = async () => {
    if (!selectedTour) return
    await fetch(`/api/tours/${selectedTour.id}/submit-yale`, { method: 'PATCH' })
    setShowYaleModal(false)
    fetchTours()
  }

  const handleConfirm = async (datetime: string) => {
    if (!selectedTour) return
    await fetch(`/api/tours/${selectedTour.id}/confirm`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmed_datetime: datetime })
    })
    setShowConfirmModal(false)
    fetchTours()
  }

  // Combine tours and ungrouped requests for filtering
  // Each ungrouped date shows as ONE row with all requests for that date
  const allItems: any[] = [
    ...tours,
    ...ungroupedRequests.map(ug => ({
      id: `ungrouped-${ug.requested_date}`,
      requested_date: ug.requested_date,
      status: 'Ungrouped',
      booking_requests: ug.booking_requests,
      guide: null,
      guide_id: null,
      confirmed_datetime: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _isUngrouped: true,
      _totalPeople: ug.totalPeople,
      _requestCount: ug.requestCount
    }))
  ]

  const filteredTours = allItems.filter(item => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'ungrouped') return item.status === 'Ungrouped'
    if (activeFilter === 'needs-guide') return !item.guide_id && item.status !== 'Ungrouped'
    if (activeFilter === 'ready') return item.status === 'Ready'
    if (activeFilter === 'pending-yale') return item.status === 'PendingYale'
    if (activeFilter === 'confirmed') return item.status === 'Confirmed'
    if (activeFilter === 'completed') return item.status === 'Completed'
    return true
  })

  const filterPills = [
    { id: 'all', label: 'All', count: allItems.length, color: 'none' },
    { id: 'ungrouped', label: 'Ungrouped Requests', count: ungroupedRequests.length, color: 'amber' },
    { id: 'needs-guide', label: 'Needs Tour Guide', count: tours.filter(t => !t.guide_id).length, color: 'orange' },
    { id: 'ready', label: 'Need Yale Request', count: tours.filter(t => t.status === 'Ready').length, color: 'red' },
    { id: 'pending-yale', label: 'Waiting for Yale', count: tours.filter(t => t.status === 'PendingYale').length, color: 'blue' },
    { id: 'confirmed', label: 'Confirmed', count: tours.filter(t => t.status === 'Confirmed').length, color: 'emerald' },
    { id: 'completed', label: 'Completed', count: tours.filter(t => t.status === 'Completed').length, color: 'stone' },
  ]

  if (loading) {
    return <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <p className="text-stone-600">Loading...</p>
    </div>
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 md:gap-3">
            <svg className="w-6 h-6 md:w-8 md:h-8 text-stone-700" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <div>
              <h1 className="heading-font text-lg md:text-2xl font-light text-stone-800">Admin Dashboard</h1>
              <p className="text-[10px] md:text-xs text-stone-500 uppercase tracking-widest">Shine Tours</p>
            </div>
          </div>
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="/admin/users" className="text-stone-600 hover:text-stone-800 uppercase tracking-wide flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
              Users
            </a>
            <a href="/" className="text-stone-600 hover:text-stone-800 uppercase tracking-wide">← Home</a>
            <button 
              onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
              className="text-stone-600 hover:text-stone-800 uppercase tracking-wide"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 hover:bg-stone-100 rounded transition-colors"
          >
            <svg className="w-6 h-6 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-stone-200 bg-white">
            <div className="px-4 py-3 space-y-3">
              <a href="/admin/users" className="flex items-center gap-2 text-stone-700 hover:text-stone-900 font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
                Users
              </a>
              <a href="/" className="flex items-center gap-2 text-stone-700 hover:text-stone-900 font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                Home
              </a>
              <button 
                onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
                className="flex items-center gap-2 text-stone-700 hover:text-stone-900 font-medium w-full text-left"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-4 md:py-6">
        <FilterPills 
          pills={filterPills}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        <TourTable
          tours={filteredTours}
          guides={guides}
          isAdmin={true}
          onViewDetails={(id) => {
            const tour = allItems.find(t => t.id === id)
            setSelectedTour(tour || null)
            setShowDetailsModal(true)
          }}
          onAssignGuide={handleAssignGuide}
          onAction={handleAction}
          onAutoGroup={handleAutoGroup}
        />
      </div>

      {/* Modals */}
      {selectedTour && (
        <>
          <DetailsModal
            isOpen={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
            tourDate={selectedTour.requested_date}
            participants={selectedTour.booking_requests || []}
            status={selectedTour.status}
            totalPeople={selectedTour.booking_requests?.reduce((sum, b) => sum + b.group_size, 0) || 0}
            guideName={selectedTour.guide ? `${selectedTour.guide.first_name} ${selectedTour.guide.last_name}` : undefined}
            confirmedTime={selectedTour.confirmed_datetime || undefined}
            tourGroupId={selectedTour.id}
            isAdmin={true}
            onRefresh={fetchTours}
          />

          <YaleSubmissionModal
            isOpen={showYaleModal}
            onClose={() => setShowYaleModal(false)}
            onSubmit={handleSubmitYale}
            tourDate={selectedTour.requested_date}
            totalPeople={selectedTour.booking_requests?.reduce((sum, b) => sum + b.group_size, 0) || 0}
            participants={selectedTour.booking_requests || []}
            guideName={selectedTour.guide ? `${selectedTour.guide.first_name} ${selectedTour.guide.last_name}` : ''}
            guideEmail={selectedTour.guide?.email || ''}
            guidePhone={selectedTour.guide?.phone || ''}
          />

          <ConfirmationModal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            onConfirm={handleConfirm}
            tourDate={selectedTour.requested_date}
          />
        </>
      )}
    </div>
  )
}


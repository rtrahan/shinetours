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

export default function GuideDashboard() {
  const router = useRouter()
  const supabase = createClient()
  
  const [tours, setTours] = useState<TourGroup[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedTour, setSelectedTour] = useState<TourGroup | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showYaleModal, setShowYaleModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  useEffect(() => {
    checkAuthAndFetch()
  }, [])

  const checkAuthAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    
    // Get guide record to use their guide ID (not auth ID)
    const { data: guide } = await supabase
      .from('guides')
      .select('id')
      .eq('email', user.email)
      .single()
    
    if (guide) {
      setCurrentUserId(guide.id)
    }
    fetchTours()
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

  const handleAction = async (tourId: string, action: string) => {
    const tour = tours.find(t => t.id === tourId)
    if (!tour) return

    if (action === 'claim') {
      await fetch(`/api/tours/${tourId}/claim`, { method: 'POST' })
      fetchTours()
    } else if (action === 'unclaim') {
      if (confirm('Are you sure you want to unclaim this tour?')) {
        await fetch(`/api/tours/${tourId}/unclaim`, { method: 'POST' })
        fetchTours()
      }
    } else if (action === 'submit-yale') {
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

  const myTours = tours.filter(t => t.guide_id === currentUserId)
  const availableTours = tours.filter(t => !t.guide_id)
  const otherTours = tours.filter(t => t.guide_id && t.guide_id !== currentUserId)

  const filteredTours = tours.filter(tour => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'mine') return tour.guide_id === currentUserId
    if (activeFilter === 'available') return !tour.guide_id
    if (activeFilter === 'others') return tour.guide_id && tour.guide_id !== currentUserId
    return true
  })

  const filterPills = [
    { id: 'all', label: 'All', count: tours.length, color: 'none' },
    { id: 'mine', label: 'My Tours', count: myTours.length, color: 'purple' },
    { id: 'available', label: 'Available to Claim', count: availableTours.length, color: 'emerald' },
    { id: 'others', label: "Other Guides' Tours", count: otherTours.length, color: 'stone' },
  ].filter(p => p.count > 0 || p.id === 'all')

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
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            <div>
              <h1 className="heading-font text-lg md:text-2xl font-light text-stone-800">Guide Dashboard</h1>
              <p className="text-[10px] md:text-xs text-stone-500 uppercase tracking-widest">Shine Tours</p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-6 text-xs md:text-sm">
            <a href="/" className="text-sm text-stone-600 hover:text-stone-800 uppercase tracking-wide">← Home</a>
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
      <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-4 md:py-6">
        <FilterPills 
          pills={filterPills}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        <TourTable
          tours={filteredTours}
          currentUserId={currentUserId}
          isAdmin={false}
          onViewDetails={(id) => {
            setSelectedTour(tours.find(t => t.id === id) || null)
            setShowDetailsModal(true)
          }}
          onAction={handleAction}
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


'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import TourBoard from '@/components/TourBoard'
import DetailsModal from '@/components/DetailsModal'
import YaleSubmissionModal from '@/components/YaleSubmissionModal'
import ConfirmationModal from '@/components/ConfirmationModal'
import { StaffFooter, StaffHeader } from '@/components/StaffChrome'
import { TourGroup } from '@/lib/types'

export default function GuideDashboard() {
  const router = useRouter()
  const supabase = createClient()
  
  const [tours, setTours] = useState<TourGroup[]>([])
  const [ungroupedRequests, setUngroupedRequests] = useState<any[]>([])
  const [guides, setGuides] = useState<any[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)
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
    fetchUngrouped()
    fetchGuides()
  }

  const fetchGuides = async () => {
    const response = await fetch('/api/guides')
    if (response.ok) {
      const data = await response.json()
      setGuides(data)
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

  const handleAssignGuide = async (tourId: string, guideId: string) => {
    await fetch(`/api/tours/${tourId}/assign-guide`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guide_id: guideId })
    })
    fetchTours()
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

  // Combine tours and ungrouped
  const allItems: any[] = [
    ...tours,
    ...ungroupedRequests.map(ug => {
      const latestCreated = ug.booking_requests?.length
        ? ug.booking_requests.reduce((latest: string | null, b: any) =>
            !latest || (b.created_at && new Date(b.created_at) > new Date(latest)) ? b.created_at ?? latest : latest,
            null as string | null
          )
        : null
      return {
        id: `ungrouped-${ug.requested_date}`,
        requested_date: ug.requested_date,
        status: 'Ungrouped',
        booking_requests: ug.booking_requests,
        guide: null,
        guide_id: null,
        confirmed_datetime: null,
        created_at: latestCreated ?? new Date(0).toISOString(),
        updated_at: latestCreated ?? new Date(0).toISOString(),
        _isUngrouped: true,
        _totalPeople: ug.totalPeople,
        _requestCount: ug.requestCount
      }
    })
  ]

  const statCards = [
    {
      label: 'My Tours',
      value: allItems.filter(item => item.guide_id === currentUserId).length,
      detail: 'assigned to you',
      accent: 'from-purple-300/20 to-purple-500/5 border-purple-200/20 text-purple-100'
    },
    {
      label: 'Needs Guide',
      value: allItems.filter(item => item.status !== 'Ungrouped' && !item.guide_id).length,
      detail: 'available to claim',
      accent: 'from-orange-300/20 to-orange-500/5 border-orange-200/20 text-orange-100'
    },
    {
      label: 'Ungrouped',
      value: ungroupedRequests.reduce((sum, item) => sum + (item.requestCount || 0), 0),
      detail: `${ungroupedRequests.length} date${ungroupedRequests.length === 1 ? '' : 's'}`,
      accent: 'from-amber-300/20 to-amber-500/5 border-amber-200/20 text-amber-100'
    },
    {
      label: 'Confirmed',
      value: allItems.filter(item => item.status === 'Confirmed').length,
      detail: `${allItems.filter(item => item.status === 'PendingYale').length} pending Yale`,
      accent: 'from-emerald-300/20 to-emerald-500/5 border-emerald-200/20 text-emerald-100'
    }
  ]

  if (loading) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-5 text-center shadow-2xl shadow-black/30">
        <p className="heading-font text-2xl font-light text-white">Loading guide board...</p>
        <p className="mt-1 text-xs uppercase tracking-[0.22em] text-stone-500">Shine Tours</p>
      </div>
    </div>
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#241d18_0,#11100e_34%,#050505_100%)] text-stone-100">
      {/* Header */}
      <StaffHeader role="guide" active="dashboard" />

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-3 md:py-4">
        <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {statCards.map(card => (
            <div key={card.label} className={`rounded-xl border bg-gradient-to-br ${card.accent} px-3 py-2.5 shadow-xl shadow-black/10`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] opacity-70">{card.label}</p>
                  <p className="mt-1 text-[11px] text-stone-400">{card.detail}</p>
                </div>
                <p className="heading-font text-3xl font-light leading-none text-white">{card.value}</p>
              </div>
            </div>
          ))}
        </div>
        <TourBoard
          tours={allItems}
          currentUserId={currentUserId}
          isAdmin={false}
          isGuide={true}
          guides={guides}
          onViewDetails={(id: string) => {
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
            isGuide={true}
            onRefresh={() => { fetchTours(); fetchUngrouped(); }}
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
      <StaffFooter />
    </div>
  )
}


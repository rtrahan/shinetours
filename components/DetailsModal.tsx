'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import Modal from './Modal'

interface Participant {
  id?: string
  contact_name: string
  contact_email: string
  contact_phone: string
  group_size: number
  preferred_guide?: { first_name: string; last_name: string } | null
}

interface DetailsModalProps {
  isOpen: boolean
  onClose: () => void
  tourDate: string
  participants: Participant[]
  status?: string
  totalPeople: number
  guideName?: string
  confirmedTime?: string
  tourGroupId?: string
  isAdmin?: boolean
  isGuide?: boolean
  onRefresh?: () => void
}

export default function DetailsModal({ 
  isOpen, 
  onClose, 
  tourDate, 
  participants,
  status,
  totalPeople,
  guideName,
  confirmedTime,
  tourGroupId,
  isAdmin,
  isGuide,
  onRefresh
}: DetailsModalProps) {
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)

  const toggleParticipant = (id: string) => {
    const newSelected = new Set(selectedParticipants)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedParticipants(newSelected)
  }

  const createNewGroup = async () => {
    if (selectedParticipants.size === 0) return
    
    setCreating(true)
    try {
      const response = await fetch('/api/tours/create-from-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalTourGroupId: tourGroupId,
          selectedBookingIds: Array.from(selectedParticipants),
          tourDate,
          isUngrouped: status === 'Ungrouped'
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`Created new group with ${data.movedCount} requests`)
        setSelectedParticipants(new Set())
        if (onRefresh) onRefresh()
        onClose()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to create group')
      }
    } catch (error) {
      console.error('Error creating new group:', error)
      alert('An error occurred while creating the group')
    }
    setCreating(false)
  }

  const selectedCount = selectedParticipants.size
  const selectedPeople = participants
    .filter(p => p.id && selectedParticipants.has(p.id))
    .reduce((sum, p) => sum + p.group_size, 0)

  let formattedTourDate = tourDate
  try {
    formattedTourDate = format(new Date(tourDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy')
  } catch { /* keep original date if parsing fails */ }

  const summaryItems = [
    status ? { label: 'Status', value: status } : null,
    { label: 'Total', value: `${totalPeople} ${totalPeople === 1 ? 'person' : 'people'}` },
    guideName ? { label: 'Guide', value: guideName } : null,
    confirmedTime ? { label: 'Time', value: confirmedTime, highlight: true } : null
  ].filter(Boolean) as Array<{ label: string; value: string; highlight?: boolean }>

  const handleCancelRequest = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking request?')) return
    
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        if (onRefresh) onRefresh()
        onClose()
      }
    } catch (error) {
      console.error('Error canceling booking:', error)
    }
  }

  const handleRemoveFromGroup = async (bookingId: string) => {
    if (!confirm('Are you sure you want to remove this request from the group? It will go back to the Ungrouped list.')) return
    
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tour_group_id: null })
      })

      if (response.ok) {
        if (onRefresh) onRefresh()
        onClose()
      }
    } catch (error) {
      console.error('Error removing from group:', error)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tour Participants" maxWidth="max-w-4xl">
      <div className="mb-5 overflow-hidden rounded-3xl border border-stone-200 bg-stone-50 shadow-sm">
        <div className="border-b border-stone-200 bg-white px-5 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">Group Summary</p>
          <h4 className="heading-font mt-1 text-3xl font-light tracking-[-0.04em] text-stone-950">{formattedTourDate}</h4>
        </div>
        <div className="grid gap-3 bg-stone-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryItems.map(item => (
            <div key={item.label} className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">{item.label}</p>
              <p className={`mt-1 text-sm font-semibold ${item.highlight ? 'text-emerald-700' : 'text-stone-950'}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {isAdmin && status === 'Ungrouped' && (
        <div className="mb-5 rounded-2xl border border-blue-100 border-l-4 border-l-blue-500 bg-blue-50 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-blue-900 font-semibold mb-2">
                Ungrouped Requests
              </p>
              <p className="text-sm text-blue-800">
                Select participants below and click "Create New Group" to manually form a tour group, or use the "Auto-Group" button to let the system create optimal groups automatically.
              </p>
            </div>
            {/* If we have an onAutoGroup prop we'd render it here, but since DetailsModal doesn't have it we rely on the parent */}
          </div>
        </div>
      )}
      
      {(isAdmin || isGuide) && totalPeople > 15 && status !== 'Ungrouped' && (
        <div className="mb-4 rounded-xl border border-amber-100 border-l-4 border-l-amber-500 bg-amber-50 p-4">
          <p className="text-sm text-amber-900 font-semibold">
            This group has {totalPeople} people (max 15). Select participants below to split into a new group.
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-stone-200">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead className="bg-stone-100/80">
            <tr>
              {(isAdmin || isGuide) && (
                <th className="w-12 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-stone-600">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedParticipants(new Set(participants.filter(p => p.id).map(p => p.id!)))
                      } else {
                        setSelectedParticipants(new Set())
                      }
                    }}
                    className="w-4 h-4"
                  />
                </th>
              )}
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-stone-600">Name</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-stone-600">Email</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-stone-600">Phone</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-stone-600">Prefers</th>
              <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-stone-600">Party</th>
              {(isAdmin || isGuide) && (
                <th className="w-20 px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-stone-600">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {participants.map((p, idx) => (
              <tr key={p.id || idx} className="border-t border-stone-100 bg-white hover:bg-stone-50">
                {(isAdmin || isGuide) && p.id && (
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedParticipants.has(p.id)}
                      onChange={() => toggleParticipant(p.id!)}
                      className="w-4 h-4"
                    />
                  </td>
                )}
                <td className="py-3 px-4 font-semibold text-stone-950">{p.contact_name}</td>
                <td className="py-3 px-4">
                  <a href={`mailto:${p.contact_email}`} className="text-sm font-medium text-blue-700 hover:underline">
                    {p.contact_email}
                  </a>
                </td>
                <td className="py-3 px-4 text-sm">
                  {p.contact_phone ? (
                    <a href={`tel:${p.contact_phone}`} className="font-medium text-blue-700 hover:underline">
                      {p.contact_phone}
                    </a>
                  ) : '—'}
                </td>
                <td className={`py-3 px-4 text-xs ${p.preferred_guide ? 'text-purple-700 font-medium' : 'text-stone-400 italic'}`}>
                  {p.preferred_guide 
                    ? `${p.preferred_guide.first_name} ${p.preferred_guide.last_name}`
                    : 'None'}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-stone-900 px-2 text-sm font-bold text-white">
                    {p.group_size}
                  </span>
                </td>
                {(isAdmin || isGuide) && p.id && (
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1">
                      {status !== 'Ungrouped' && (
                        <button
                          onClick={() => handleRemoveFromGroup(p.id!)}
                          className="flex items-center justify-center rounded-lg p-2 text-orange-600 transition-colors hover:bg-orange-50"
                          title="Remove from group (send back to Ungrouped)"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                          </svg>
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleCancelRequest(p.id!)}
                          className="flex items-center justify-center rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                          title="Cancel this booking request"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {(isAdmin || isGuide) && selectedCount > 0 && (
        <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-stone-900">
                {selectedCount} {selectedCount === 1 ? 'request' : 'requests'} selected ({selectedPeople} people)
              </p>
              <p className="text-sm text-stone-600 mt-1">
                This will create a new tour group with the selected participants
              </p>
            </div>
            <button
              onClick={createNewGroup}
              disabled={creating}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3 font-bold text-white shadow-md transition-colors hover:bg-orange-700 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              {creating ? 'Creating...' : 'Create New Group'}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={onClose}
          className="rounded-xl bg-stone-900 px-6 py-3 font-semibold text-white transition-colors hover:bg-stone-800"
        >
          Close
        </button>
      </div>
    </Modal>
  )
}


'use client'

import { useState } from 'react'
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
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tour Participants" maxWidth="max-w-4xl">
      <div className="mb-4">
        <h4 className="text-lg font-bold text-stone-800">{tourDate}</h4>
        <div className="flex items-center gap-4 mt-2">
          {status && <span className="text-sm text-stone-600">Status: <strong>{status}</strong></span>}
          <span className="text-sm text-stone-600">Total: <strong>{totalPeople} people</strong></span>
          {guideName && <span className="text-sm text-stone-600">Guide: <strong>{guideName}</strong></span>}
          {confirmedTime && <span className="text-sm text-emerald-700">Time: <strong>{confirmedTime}</strong></span>}
        </div>
      </div>

      {isAdmin && status === 'Ungrouped' && (
        <div className="mb-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
          <p className="text-sm text-blue-900 font-semibold mb-2">
            📋 Ungrouped Requests - These need to be formed into tour groups
          </p>
          <p className="text-sm text-blue-800">
            Select participants below and click "Create New Group" to manually form a tour group, or use the "Auto-Group" button to let the system create optimal groups automatically.
          </p>
        </div>
      )}
      
      {isAdmin && totalPeople > 15 && status !== 'Ungrouped' && (
        <div className="mb-4 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r">
          <p className="text-sm text-amber-900 font-semibold">
            ⚠️ This group has {totalPeople} people (max 15). Select participants below to split into a new group.
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-stone-100">
            <tr>
              {isAdmin && (
                <th className="text-left py-3 px-4 text-xs font-bold text-stone-700 uppercase w-12">
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
              <th className="text-left py-3 px-4 text-xs font-bold text-stone-700 uppercase">Name</th>
              <th className="text-left py-3 px-4 text-xs font-bold text-stone-700 uppercase">Email</th>
              <th className="text-left py-3 px-4 text-xs font-bold text-stone-700 uppercase">Phone</th>
              <th className="text-left py-3 px-4 text-xs font-bold text-stone-700 uppercase">Prefers</th>
              <th className="text-center py-3 px-4 text-xs font-bold text-stone-700 uppercase">Party Size</th>
              {isAdmin && (
                <th className="text-center py-3 px-4 text-xs font-bold text-stone-700 uppercase w-16"></th>
              )}
            </tr>
          </thead>
          <tbody>
            {participants.map((p, idx) => (
              <tr key={p.id || idx} className="border-b border-stone-100 hover:bg-stone-50">
                {isAdmin && p.id && (
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedParticipants.has(p.id)}
                      onChange={() => toggleParticipant(p.id!)}
                      className="w-4 h-4"
                    />
                  </td>
                )}
                <td className="py-3 px-4 font-semibold text-stone-900">{p.contact_name}</td>
                <td className="py-3 px-4">
                  <a href={`mailto:${p.contact_email}`} className="text-blue-600 hover:underline text-sm">
                    {p.contact_email}
                  </a>
                </td>
                <td className="py-3 px-4 text-sm">
                  {p.contact_phone ? (
                    <a href={`tel:${p.contact_phone}`} className="text-blue-600 hover:underline">
                      {p.contact_phone}
                    </a>
                  ) : '—'}
                </td>
                <td className={`py-3 px-4 text-xs ${p.preferred_guide ? 'text-purple-700 font-medium' : 'text-stone-400 italic'}`}>
                  {p.preferred_guide 
                    ? `${p.preferred_guide.first_name} ${p.preferred_guide.last_name}`
                    : 'None'}
                </td>
                <td className="py-3 px-4 text-center font-bold">{p.group_size}</td>
                {isAdmin && p.id && (
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleCancelRequest(p.id!)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Cancel this booking request"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAdmin && selectedCount > 0 && (
        <div className="mt-6 pt-4 border-t border-stone-200 bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
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
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
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
          className="px-6 py-3 bg-stone-800 text-white font-semibold rounded-lg hover:bg-stone-900 transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  )
}


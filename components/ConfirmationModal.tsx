'use client'

import { useState, useEffect } from 'react'
import Modal from './Modal'
import { format } from 'date-fns'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (datetime: string) => void
  tourDate: string
}

export default function ConfirmationModal({ isOpen, onClose, onConfirm, tourDate }: ConfirmationModalProps) {
  const [confirmedDateTime, setConfirmedDateTime] = useState('')

  // Set default datetime when modal opens - tour date at 12:30 PM
  useEffect(() => {
    if (isOpen && tourDate) {
      // Ensure we have YYYY-MM-DD format
      let dateString = tourDate
      
      // If tourDate is "2025-10-17", use it directly
      // If it's already "2025-10-17T12:30", extract just the date part
      if (tourDate.includes('T')) {
        dateString = tourDate.split('T')[0]
      }
      
      // Set to 12:30 PM on the tour date
      const defaultTime = `${dateString}T12:30`
      setConfirmedDateTime(defaultTime)
    }
  }, [isOpen, tourDate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // The confirmedDateTime is already in the format: "2025-10-17T12:30"
    // Convert to ISO string for database storage
    const dateObj = new Date(confirmedDateTime)
    const isoString = dateObj.toISOString()
    
    onConfirm(isoString)
    setConfirmedDateTime('')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Tour with Yale" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div className="rounded-2xl border border-blue-100 border-l-4 border-l-blue-600 bg-blue-50 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-700">Next Step</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-blue-950">
              Yale has responded with a confirmed time. Enter it below to notify all participants.
            </p>
          </div>

          <div>
            <label className="mb-3 block text-xs font-bold uppercase tracking-[0.18em] text-stone-600">
              Confirmed Date & Time
            </label>
            <input
              type="datetime-local"
              value={confirmedDateTime}
              onChange={(e) => setConfirmedDateTime(e.target.value)}
              required
              className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-4 text-lg text-stone-950 transition-all focus:border-stone-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-stone-200"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-between gap-3 border-t border-stone-200 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-300 px-6 py-3 text-sm font-bold uppercase tracking-wide text-stone-700 transition-all hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-stone-950 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-md transition-all hover:bg-stone-800"
          >
            Confirm Tour
          </button>
        </div>
      </form>
    </Modal>
  )
}


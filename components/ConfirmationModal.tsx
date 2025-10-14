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
          <div className="bg-blue-50 border-l-4 border-blue-600 p-5 rounded-r">
            <p className="text-sm text-blue-900 font-semibold">
              Step 2: Yale has responded with a confirmed time. Enter it below to notify all participants.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-700 uppercase tracking-wider mb-3">
              Confirmed Date & Time
            </label>
            <input
              type="datetime-local"
              value={confirmedDateTime}
              onChange={(e) => setConfirmedDateTime(e.target.value)}
              required
              className="w-full px-4 py-4 border-2 border-stone-300 focus:border-stone-800 focus:outline-none text-lg transition-all rounded"
            />
          </div>
        </div>

        <div className="flex justify-between gap-3 mt-8 pt-6 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3 border-2 border-stone-300 text-stone-700 font-bold hover:bg-stone-50 transition-all uppercase tracking-wide text-sm rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-3 bg-stone-900 text-white font-bold hover:bg-stone-800 transition-all uppercase tracking-wide text-sm rounded shadow-md"
          >
            Confirm Tour
          </button>
        </div>
      </form>
    </Modal>
  )
}


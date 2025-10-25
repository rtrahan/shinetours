'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'

interface BookingFormProps {
  selectedDate: Date
  availableGuides: any[]
  onSuccess: () => void
}

interface DateDetails {
  totalPeople: number
  currentGroupPeople: number
  spotsLeft: number
  requestCount: number
  groupsCount: number
  currentFormingGroup: {
    participants: Array<{ name: string; groupSize: number }>
    totalPeople: number
  } | null
  confirmedGroups: Array<{
    id: string
    status: string
    guideName: string | null
    participants: Array<{ name: string; groupSize: number }>
    totalPeople: number
  }>
}

export default function BookingForm({ selectedDate, availableGuides, onSuccess }: BookingFormProps) {
  const [groupSize, setGroupSize] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [preferredLanguage, setPreferredLanguage] = useState('English')
  const [preferredGuideId, setPreferredGuideId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dateDetails, setDateDetails] = useState<DateDetails | null>(null)
  const [showParticipants, setShowParticipants] = useState(false)

  // Available languages
  const availableLanguages = ['English', 'Spanish', 'Italian']
  
  // Filter guides by selected language
  const filteredGuides = availableGuides.filter(guide => 
    guide.languages && guide.languages.includes(preferredLanguage)
  )

  // Fetch date details when date changes
  useEffect(() => {
    const fetchDateDetails = async () => {
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd')
        const response = await fetch(`/api/bookings/date?date=${dateStr}`)
        if (response.ok) {
          const data = await response.json()
          setDateDetails(data)
        }
      } catch (err) {
        console.error('Error fetching date details:', err)
      }
    }

    fetchDateDetails()
  }, [selectedDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requested_date: format(selectedDate, 'yyyy-MM-dd'),
          group_size: groupSize,
          contact_name: name,
          contact_email: email,
          contact_phone: phone,
          preferred_language: preferredLanguage,
          preferred_guide_id: preferredGuideId || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to submit booking')
        setLoading(false)
        return
      }

      // Reset form
      setGroupSize(1)
      setName('')
      setEmail('')
      setPhone('')
      setPreferredLanguage('English')
      setPreferredGuideId('')
      
      // Refresh date details to show updated count
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const detailsResponse = await fetch(`/api/bookings/date?date=${dateStr}`)
      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json()
        setDateDetails(detailsData)
      }
      
      onSuccess()

    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const maxGroupSize = 15 // Allow up to 15 people per request

  return (
    <div className="bg-white border border-stone-200 shadow-sm rounded-lg p-8">
      <div className="mb-6">
        <h2 className="heading-font text-2xl font-light text-stone-800 mb-2">
          Request a Tour
        </h2>
      </div>

      {/* Date Details Info Box */}
      {dateDetails && (
        <div className="mb-6 bg-stone-50 border-l-4 border-stone-800 p-5 rounded">
          <h3 className="heading-font text-xl font-light text-stone-800 mb-3">
            {format(selectedDate, 'EEEE, MMMM d')}
          </h3>
          <div className="text-sm text-stone-600 space-y-1">
            <p>
              <span className="font-semibold">{dateDetails.requestCount} {dateDetails.requestCount === 1 ? 'request' : 'requests'} for {dateDetails.totalPeople} {dateDetails.totalPeople === 1 ? 'guest' : 'guests'}</span> {dateDetails.requestCount === 1 ? 'has' : 'have'} been requested for this day
              {dateDetails.groupsCount > 0 && (
                <>
                  {' • '}
                  <span className="font-semibold">{dateDetails.groupsCount} tour group{dateDetails.groupsCount !== 1 ? 's' : ''}</span> already formed
                </>
              )}
            </p>
            {dateDetails.requestCount > 0 && (
              <button
                type="button"
                onClick={() => setShowParticipants(true)}
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium mt-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                See who else requested this date
              </button>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
            Party Size
          </label>
          <input
            type="number"
            min="1"
            max={maxGroupSize}
            value={groupSize}
            onChange={(e) => setGroupSize(parseInt(e.target.value))}
            required
            className="w-full px-4 py-3 border-2 border-stone-300 focus:border-stone-800 focus:outline-none text-sm transition-all rounded"
            placeholder={`1-${maxGroupSize}`}
          />
          <p className="mt-1 text-[10px] text-stone-500">
            Max 15 guests per request
          </p>
        </div>

      <div>
        <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-3 border-2 border-stone-300 focus:border-stone-800 focus:outline-none text-sm transition-all rounded"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 border-2 border-stone-300 focus:border-stone-800 focus:outline-none text-sm transition-all rounded"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
          Phone
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="w-full px-4 py-3 border-2 border-stone-300 focus:border-stone-800 focus:outline-none text-sm transition-all rounded"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
          Preferred Language
        </label>
        <select
          value={preferredLanguage}
          onChange={(e) => {
            setPreferredLanguage(e.target.value)
            setPreferredGuideId('') // Reset guide selection when language changes
          }}
          required
          className="w-full px-4 py-3 border-2 border-stone-300 focus:border-stone-800 focus:outline-none text-sm transition-all rounded"
        >
          {availableLanguages.map(lang => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[10px] text-stone-500">Select your preferred tour language</p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
          Preferred Tour Guide <span className="text-stone-400 font-normal text-[10px]">(Optional)</span>
        </label>
        <select
          value={preferredGuideId}
          onChange={(e) => setPreferredGuideId(e.target.value)}
          className="w-full px-4 py-3 border-2 border-stone-300 focus:border-stone-800 focus:outline-none text-sm transition-all rounded"
        >
          <option value="">No Preference</option>
          {filteredGuides.map(guide => (
            <option key={guide.id} value={guide.id}>
              {guide.first_name} {guide.last_name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[10px] text-stone-500">
          {filteredGuides.length === 0 
            ? `No guides available for ${preferredLanguage} tours` 
            : `Showing guides who speak ${preferredLanguage}`}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-stone-800 text-white font-semibold py-4 px-6 hover:bg-stone-900 transition-all uppercase tracking-widest text-xs rounded disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
          {loading ? 'Submitting...' : 'Request Tour'}
        </button>
      </form>

      {/* Participants Modal */}
      {showParticipants && dateDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden">
            <div className="p-6 border-b border-stone-200">
              <div className="flex items-center justify-between">
                <h3 className="heading-font text-2xl font-light text-stone-800">
                  Others Joining This Date
                </h3>
                <button
                  onClick={() => setShowParticipants(false)}
                  className="text-stone-400 hover:text-stone-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
              {/* Current Forming Group or Ungrouped Requests */}
              {dateDetails.currentFormingGroup && dateDetails.currentFormingGroup.participants.length > 0 && (
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-5">
                  <h4 className="font-bold text-stone-900 mb-3">
                    {dateDetails.groupsCount === 0 ? 'Ungrouped Requests' : 'Current Group (Not Yet Confirmed)'}
                  </h4>
                  <p className="text-xs text-stone-600 mb-3">
                    {dateDetails.currentFormingGroup.totalPeople} {dateDetails.currentFormingGroup.totalPeople === 1 ? 'person' : 'people'} total
                  </p>
                  <div className="space-y-2">
                    {dateDetails.currentFormingGroup.participants.map((participant: any, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border border-stone-200">
                        <div className="flex items-center justify-between">
                          <span className="text-stone-900 font-semibold">{participant.name}</span>
                          <span className="text-sm text-stone-600 font-medium bg-stone-100 px-2 py-1 rounded">
                            {participant.groupSize} {participant.groupSize === 1 ? 'person' : 'people'}
                          </span>
                        </div>
                        {participant.preferredGuide && (
                          <div className="mt-1 text-xs text-purple-700">
                            Prefers: {participant.preferredGuide}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Confirmed Tour Groups */}
              {dateDetails.confirmedGroups.map((group, groupIdx) => {
                const statusConfig: Record<string, { label: string; color: string }> = {
                  'Pending': { label: 'PENDING', color: 'bg-stone-500' },
                  'Ready': { label: 'READY', color: 'bg-blue-600' },
                  'PendingYale': { label: 'PENDINGYALE', color: 'bg-blue-600' },
                  'Confirmed': { label: 'CONFIRMED', color: 'bg-emerald-600' },
                  'Completed': { label: 'COMPLETED', color: 'bg-stone-600' }
                }
                const statusInfo = statusConfig[group.status] || { label: group.status.toUpperCase(), color: 'bg-stone-500' }

                return (
                  <div key={group.id} className="bg-white border border-stone-300 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-stone-900">
                        Tour Group {groupIdx + 1}
                      </h4>
                      <span className={`px-3 py-1 text-xs font-bold text-white rounded ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    
                    {group.guideName && (
                      <div className="mb-3">
                        <span className="text-sm text-stone-600">Tour Guide: </span>
                        <span className="text-purple-700 font-semibold">{group.guideName}</span>
                      </div>
                    )}

                    <div className="space-y-2 mb-3">
                      {group.participants.map((participant, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-stone-800">{participant.name}</span>
                          <span className="text-sm text-stone-600 font-medium">
                            {participant.groupSize} {participant.groupSize === 1 ? 'person' : 'people'}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-stone-200">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-stone-700">Total:</span>
                        <span className="font-bold text-stone-900">{group.totalPeople} people</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="p-6 border-t border-stone-200 bg-stone-50">
              <button
                onClick={() => setShowParticipants(false)}
                className="w-full py-3 px-6 bg-stone-800 text-white font-semibold rounded-lg hover:bg-stone-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


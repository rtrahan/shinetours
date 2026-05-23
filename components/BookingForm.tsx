'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'

interface BookingFormProps {
  selectedDate: Date
  availableGuides: any[]
  defaultPreferredGuideId?: string
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

export default function BookingForm({ selectedDate, availableGuides, defaultPreferredGuideId, onSuccess }: BookingFormProps) {
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
    guide.languages && guide.languages.includes(preferredLanguage) && guide.public_visible !== false
  )

  useEffect(() => {
    if (!defaultPreferredGuideId) return
    const defaultGuide = availableGuides.find(guide => guide.id === defaultPreferredGuideId)
    if (!defaultGuide) return

    setPreferredGuideId(defaultPreferredGuideId)
    if (defaultGuide.languages?.length && !defaultGuide.languages.includes(preferredLanguage)) {
      setPreferredLanguage(defaultGuide.languages[0])
    }
  }, [defaultPreferredGuideId, availableGuides])

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
    <div className="h-full rounded-3xl border border-white/10 bg-[#11100e] p-5 shadow-2xl shadow-black/30 md:p-6 lg:p-7">
      <div className="mb-6">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-amber-100/65">
          Step 2
        </p>
        <h2 className="heading-font mb-2 text-3xl font-light tracking-[-0.04em] text-white md:text-4xl">
          Request a Tour
        </h2>
        <p className="text-sm leading-6 text-stone-400">
          We will use these details to coordinate your group and submit the request to Yale.
        </p>
      </div>

      {/* Date Details Info Box */}
      {dateDetails && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-amber-100/15 bg-amber-100/[0.07] shadow-inner shadow-amber-950/20">
          <div className="border-b border-amber-100/10 px-4 py-4 md:px-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-100/55">Selected Date</p>
            <h3 className="heading-font mt-1 text-2xl font-light tracking-[-0.03em] text-white">
              {format(selectedDate, 'EEEE, MMMM d')}
            </h3>
          </div>
          <div className="space-y-3 px-4 py-4 text-sm text-stone-300 md:px-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">Requests</p>
                <p className="mt-1 text-lg font-semibold text-white">{dateDetails.requestCount}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">Guests</p>
                <p className="mt-1 text-lg font-semibold text-white">{dateDetails.totalPeople}</p>
              </div>
            </div>
            {dateDetails.groupsCount > 0 && (
              <p className="text-xs leading-5 text-stone-400">
                <span className="font-semibold text-stone-200">{dateDetails.groupsCount} tour group{dateDetails.groupsCount !== 1 ? 's' : ''}</span> already formed for this date.
              </p>
            )}
            {dateDetails.requestCount > 0 && (
              <button
                type="button"
                onClick={() => setShowParticipants(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-100/15 bg-amber-100/10 px-3 py-2 text-xs font-semibold text-amber-50 transition-colors hover:bg-amber-100/15 hover:text-white"
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

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">Party</p>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-stone-300">
            Party Size
          </label>
          <input
            type="number"
            min="1"
            max={maxGroupSize}
            value={groupSize}
            onChange={(e) => setGroupSize(parseInt(e.target.value))}
            required
            className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white transition-all placeholder:text-stone-600 focus:border-amber-200/70 focus:outline-none focus:ring-2 focus:ring-amber-200/10"
            placeholder={`1-${maxGroupSize}`}
          />
          <p className="mt-2 text-[10px] text-stone-500">
            Max 15 guests per request
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">Contact</p>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-stone-300">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your full name"
                className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white transition-all placeholder:text-stone-600 focus:border-amber-200/70 focus:outline-none focus:ring-2 focus:ring-amber-200/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-stone-300">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white transition-all placeholder:text-stone-600 focus:border-amber-200/70 focus:outline-none focus:ring-2 focus:ring-amber-200/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-stone-300">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="Best phone number"
                className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white transition-all placeholder:text-stone-600 focus:border-amber-200/70 focus:outline-none focus:ring-2 focus:ring-amber-200/10"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">Preferences</p>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-stone-300">
                Preferred Language
              </label>
              <select
                value={preferredLanguage}
                onChange={(e) => {
                  setPreferredLanguage(e.target.value)
                  setPreferredGuideId('') // Reset guide selection when language changes
                }}
                required
                className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white transition-all focus:border-amber-200/70 focus:outline-none focus:ring-2 focus:ring-amber-200/10 [&>option]:bg-stone-950"
              >
                {availableLanguages.map(lang => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-[10px] text-stone-500">Select your preferred tour language</p>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-stone-300">
                Preferred Tour Guide <span className="text-[10px] font-normal text-stone-500">(Optional)</span>
              </label>
              <select
                value={preferredGuideId}
                onChange={(e) => setPreferredGuideId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white transition-all focus:border-amber-200/70 focus:outline-none focus:ring-2 focus:ring-amber-200/10 [&>option]:bg-stone-950"
              >
                <option value="">No Preference</option>
                {filteredGuides.map(guide => (
                  <option key={guide.id} value={guide.id}>
                    {guide.first_name} {guide.last_name}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-[10px] text-stone-500">
                {filteredGuides.length === 0 
                  ? `No guides available for ${preferredLanguage} tours` 
                  : `Showing guides who speak ${preferredLanguage}`}
              </p>
            </div>
          </div>
        </div>

      {error && (
        <div className="bg-red-50 border border-red-100 border-l-4 border-l-red-600 p-4 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-white px-6 py-4 text-xs font-bold uppercase tracking-[0.22em] text-stone-950 shadow-xl shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-stone-100 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50"
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


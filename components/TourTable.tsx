'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { TourGroup } from '@/lib/types'

interface TourTableProps {
  tours: TourGroup[]
  currentUserId?: string
  isAdmin?: boolean
  guides?: any[]
  onViewDetails: (tourId: string) => void
  onAssignGuide?: (tourId: string, guideId: string) => void
  onAction: (tourId: string, action: string) => void
  onAutoGroup?: (date: string) => void
}

export default function TourTable({ tours, currentUserId, isAdmin, guides = [], onViewDetails, onAssignGuide, onAction, onAutoGroup }: TourTableProps) {
  const [sortColumn, setSortColumn] = useState<string>('requested_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (tourId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(tourId)) {
      newExpanded.delete(tourId)
    } else {
      newExpanded.add(tourId)
    }
    setExpandedRows(newExpanded)
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const sortedTours = [...tours].sort((a, b) => {
    let aVal: any = a[sortColumn as keyof TourGroup]
    let bVal: any = b[sortColumn as keyof TourGroup]
    
    if (sortColumn === 'requested_date') {
      aVal = new Date(aVal).getTime()
      bVal = new Date(bVal).getTime()
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Ungrouped': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'Ready': return 'bg-red-100 text-red-800 border-red-200'
      case 'PendingYale': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Confirmed': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'Pending': return 'bg-stone-100 text-stone-700 border-stone-200'
      default: return 'bg-stone-100 text-stone-600 border-stone-200'
    }
  }

  const totalPeople = (tour: TourGroup) => {
    return tour.booking_requests?.reduce((sum, b) => sum + b.group_size, 0) || 0
  }

  // Empty state when no tours
  if (tours.length === 0) {
    return (
      <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
        <div className="py-20 px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-stone-100 mb-6">
            <svg className="w-10 h-10 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <h3 className="heading-font text-2xl font-light text-stone-800 mb-3">
            No Tours Yet
          </h3>
          <p className="text-stone-600 text-sm max-w-md mx-auto mb-6">
            Tour bookings will appear here once visitors submit tour requests through the booking calendar.
          </p>
          <a 
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-stone-800 text-white text-sm font-semibold rounded-lg hover:bg-stone-900 transition-colors shadow-md hover:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            View Booking Calendar
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-stone-50 border-b-2 border-stone-200">
            <tr>
              <th 
                onClick={() => handleSort('requested_date')}
                className="text-left py-4 px-6 text-xs font-bold uppercase tracking-wider text-stone-600 cursor-pointer hover:bg-stone-100">
                Date
              </th>
              <th className="text-left py-4 px-6 text-xs font-bold uppercase tracking-wider text-stone-600">
                Status
              </th>
              <th className="text-center py-4 px-6 text-xs font-bold uppercase tracking-wider text-stone-600">
                Total People
              </th>
              <th className="text-center py-4 px-6 text-xs font-bold uppercase tracking-wider text-stone-600">
                Requests
              </th>
              <th className="text-left py-4 px-6 text-xs font-bold uppercase tracking-wider text-stone-600">
                Assigned Guide
              </th>
              <th className="text-left py-4 px-6 text-xs font-bold uppercase tracking-wider text-stone-600">
                Confirmed Time
              </th>
              <th className="text-center py-4 px-6 text-xs font-bold uppercase tracking-wider text-stone-600 bg-stone-100">
                View Details
              </th>
              <th className="text-center py-4 px-6 text-xs font-bold uppercase tracking-wider text-stone-600 bg-stone-100">
                Next Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {sortedTours.map(tour => {
              const isMine = tour.guide_id === currentUserId
              const isUngrouped = (tour as any)._isUngrouped
              const people = isUngrouped ? (tour as any)._totalPeople : totalPeople(tour)
              const requestCount = isUngrouped ? (tour as any)._requestCount : (tour.booking_requests?.length || 0)
              const isExpanded = expandedRows.has(tour.id)

              return (
                <>
                <tr key={tour.id} className="hover:bg-stone-50 transition-colors cursor-pointer" onClick={() => toggleRow(tour.id)}>
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-2">
                      <svg 
                        className={`w-4 h-4 text-stone-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                      </svg>
                      <div>
                        <div className="font-semibold text-stone-900 text-sm">
                          {format(new Date(tour.requested_date + 'T00:00:00'), 'MMM d, yyyy')}
                        </div>
                        <div className="text-xs text-stone-500 mt-0.5">
                          {format(new Date(tour.requested_date + 'T00:00:00'), 'EEEE')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusClass(tour.status)}`}>
                      {tour.status}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="text-lg font-bold text-stone-900">{people}</span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="text-sm font-medium text-stone-700">
                      {requestCount}
                    </span>
                  </td>
                  <td className="py-5 px-6">
                    {isAdmin && onAssignGuide && !isUngrouped ? (
                      <select
                        value={tour.guide_id || ''}
                        onChange={(e) => onAssignGuide(tour.id, e.target.value)}
                        className="w-full px-3 py-2 border-2 border-stone-300 focus:border-stone-800 focus:outline-none text-sm rounded transition-all"
                      >
                        <option value="">Unassigned</option>
                        {guides.map(guide => (
                          <option key={guide.id} value={guide.id}>
                            {guide.first_name} {guide.last_name}
                          </option>
                        ))}
                      </select>
                    ) : isUngrouped ? (
                      <span className="text-stone-400 italic text-sm">Not grouped yet</span>
                    ) : tour.guide ? (
                      <span className={isMine ? 'text-purple-700 font-medium' : 'text-stone-700'}>
                        {tour.guide.first_name} {tour.guide.last_name}
                        {isMine && ' (You)'}
                      </span>
                    ) : (
                      <span className="text-stone-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="py-5 px-6">
                    {tour.confirmed_datetime ? (
                      <div className="font-semibold text-emerald-700 text-sm">
                        {format(new Date(tour.confirmed_datetime), 'h:mm a')}
                      </div>
                    ) : (
                      <span className="text-stone-300">—</span>
                    )}
                  </td>
                  <td className="py-5 px-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onViewDetails(tour.id)
                      }}
                      className="px-4 py-2 bg-stone-600 hover:bg-stone-700 text-white text-xs font-bold rounded transition-all inline-flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                      Manage
                    </button>
                  </td>
                  <td className="py-5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    {/* Admin Workflow Actions */}
                    {isAdmin && (
                      <>
                        {/* Ungrouped requests - show Auto-Group button */}
                        {tour.status === 'Ungrouped' && onAutoGroup && (
                          <button
                            onClick={() => onAutoGroup(tour.requested_date)}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded transition-all"
                          >
                            Auto-Group
                          </button>
                        )}

                        {/* Step 1: Assign Guide (if not assigned yet) */}
                        {tour.status !== 'Ungrouped' && !tour.guide_id && (
                          <span className="text-xs text-stone-500 italic">
                            ← Assign Guide
                          </span>
                        )}

                        {/* Step 2: Submit to Yale (once guide is assigned) */}
                        {tour.guide_id && tour.status === 'Ready' && (
                          <button
                            onClick={() => onAction(tour.id, 'submit-yale')}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded transition-all"
                          >
                            Submit to Yale
                          </button>
                        )}
                        {tour.guide_id && tour.status === 'Pending' && (
                          <button
                            onClick={() => onAction(tour.id, 'submit-yale')}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded transition-all"
                          >
                            Submit to Yale
                          </button>
                        )}

                        {/* Step 3: Confirm from Yale (after submitting) */}
                        {tour.status === 'PendingYale' && (
                          <button
                            onClick={() => onAction(tour.id, 'confirm')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition-all"
                          >
                            Confirm from Yale
                          </button>
                        )}

                        {/* Step 4: Mark Complete (after confirmed) */}
                        {tour.status === 'Confirmed' && (
                          <button
                            onClick={() => onAction(tour.id, 'complete')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded transition-all"
                          >
                            Complete
                          </button>
                        )}

                        {/* Done */}
                        {tour.status === 'Completed' && (
                          <span className="text-xs text-emerald-700 font-semibold">
                            ✓ Done
                          </span>
                        )}
                      </>
                    )}
                    
                    {/* Guide Workflow Actions */}
                    {!isAdmin && (
                      <>
                        {/* Claim if unassigned */}
                        {!tour.guide_id && (
                          <button
                            onClick={() => onAction(tour.id, 'claim')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded transition-all"
                          >
                            Claim Tour
                          </button>
                        )}

                        {/* Unclaim if it's yours and not yet submitted to Yale */}
                        {isMine && tour.status === 'Ready' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => onAction(tour.id, 'unclaim')}
                              className="px-4 py-2 bg-stone-300 hover:bg-stone-400 text-stone-700 text-xs font-bold rounded transition-all"
                            >
                              Unclaim
                            </button>
                            <button
                              onClick={() => onAction(tour.id, 'submit-yale')}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded transition-all"
                            >
                              Submit to Yale
                            </button>
                          </div>
                        )}

                        {/* Show other actions */}
                        {isMine && tour.status === 'Pending' && (
                          <button
                            onClick={() => onAction(tour.id, 'unclaim')}
                            className="px-4 py-2 bg-stone-300 hover:bg-stone-400 text-stone-700 text-xs font-bold rounded transition-all"
                          >
                            Unclaim
                          </button>
                        )}
                        {isMine && tour.status === 'PendingYale' && (
                          <button
                            onClick={() => onAction(tour.id, 'confirm')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition-all"
                          >
                            Confirm from Yale
                          </button>
                        )}
                        {isMine && tour.status === 'Confirmed' && (
                          <button
                            onClick={() => onAction(tour.id, 'complete')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded transition-all"
                          >
                            Complete
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>

                {/* Expanded Details Row */}
                {isExpanded && (
                  <tr key={`${tour.id}-details`} className="bg-stone-50">
                    <td colSpan={7} className="p-0">
                      <div className="p-6 space-y-4">
                        {/* Participants List */}
                        <div>
                          <h4 className="font-bold text-stone-900 mb-3 text-sm uppercase tracking-wide">
                            Participants ({tour.booking_requests?.length || 0})
                          </h4>
                          <div className="grid gap-3">
                            {tour.booking_requests?.map((participant, idx) => (
                              <div key={idx} className="bg-white p-4 rounded-lg border border-stone-200 flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-stone-900">{participant.contact_name}</p>
                                  <div className="flex gap-4 mt-1 text-xs text-stone-600">
                                    <a href={`mailto:${participant.contact_email}`} className="hover:text-blue-600">
                                      📧 {participant.contact_email}
                                    </a>
                                    {participant.contact_phone && (
                                      <a href={`tel:${participant.contact_phone}`} className="hover:text-blue-600">
                                        📱 {participant.contact_phone}
                                      </a>
                                    )}
                                  </div>
                                  {participant.preferred_guide && (
                                    <p className="text-xs text-purple-700 mt-1">
                                      Prefers: {participant.preferred_guide.first_name} {participant.preferred_guide.last_name}
                                    </p>
                                  )}
                                </div>
                                <div className="bg-stone-800 text-white px-4 py-2 rounded text-sm font-bold">
                                  {participant.group_size} {participant.group_size === 1 ? 'person' : 'people'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tour Info */}
                        {tour.confirmed_datetime && (
                          <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-r">
                            <p className="text-sm font-semibold text-emerald-900">
                              ✓ Confirmed Time: {format(new Date(tour.confirmed_datetime), 'h:mm a')}
                            </p>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}


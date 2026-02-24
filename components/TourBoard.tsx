'use client'

import { format } from 'date-fns'
import { TourGroup } from '@/lib/types'

interface TourBoardProps {
  tours: TourGroup[]
  currentUserId?: string
  isAdmin?: boolean
  isGuide?: boolean
  guides?: any[]
  onViewDetails: (tourId: string) => void
  onAssignGuide?: (tourId: string, guideId: string) => void
  onAction: (tourId: string, action: string) => void
  onAutoGroup?: (date: string) => void
}

export default function TourBoard({ 
  tours, 
  currentUserId, 
  isAdmin, 
  isGuide, 
  guides = [], 
  onViewDetails, 
  onAssignGuide, 
  onAction, 
  onAutoGroup 
}: TourBoardProps) {

  const columns = [
    { id: 'ungrouped', title: 'Ungrouped', headerColor: 'bg-amber-100 text-amber-800 border-amber-200', borderColor: 'border-amber-200' },
    { id: 'needs-guide', title: 'Needs Guide', headerColor: 'bg-orange-100 text-orange-800 border-orange-200', borderColor: 'border-orange-200' },
    { id: 'ready', title: 'Ready for Yale', headerColor: 'bg-red-100 text-red-800 border-red-200', borderColor: 'border-red-200' },
    { id: 'pending-yale', title: 'Pending Yale', headerColor: 'bg-blue-100 text-blue-800 border-blue-200', borderColor: 'border-blue-200' },
    { id: 'confirmed', title: 'Confirmed', headerColor: 'bg-emerald-100 text-emerald-800 border-emerald-200', borderColor: 'border-emerald-200' },
    { id: 'completed', title: 'Completed', headerColor: 'bg-stone-100 text-stone-800 border-stone-200', borderColor: 'border-stone-200' }
  ]

  const getColumnTours = (colId: string) => {
    return tours.filter(tour => {
      const isUngrouped = tour.status === 'Ungrouped'
      if (colId === 'ungrouped') return isUngrouped
      if (colId === 'needs-guide') return !tour.guide_id && !isUngrouped
      if (colId === 'ready') return tour.guide_id && (tour.status === 'Ready' || tour.status === 'Pending')
      if (colId === 'pending-yale') return tour.status === 'PendingYale'
      if (colId === 'confirmed') return tour.status === 'Confirmed'
      if (colId === 'completed') return tour.status === 'Completed'
      return false
    })
  }

  const totalPeople = (tour: TourGroup) => {
    const isUngrouped = (tour as any)._isUngrouped
    if (isUngrouped) return (tour as any)._totalPeople
    return tour.booking_requests?.reduce((sum, b) => sum + b.group_size, 0) || 0
  }

  const requestCount = (tour: TourGroup) => {
    const isUngrouped = (tour as any)._isUngrouped
    if (isUngrouped) return (tour as any)._requestCount
    return tour.booking_requests?.length || 0
  }

  const getLanguages = (tour: TourGroup) => {
    const languages = tour.booking_requests?.map(b => b.preferred_language).filter(Boolean) || []
    return [...new Set(languages)]
  }

  // Empty state when no tours at all
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
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 h-[calc(100vh-120px)]">
      <div className="flex gap-3 h-full min-h-0">
        {columns.map(col => {
          const colTours = getColumnTours(col.id)
          
          return (
            <div key={col.id} className="flex-1 min-w-[200px] flex flex-col bg-stone-50/50 rounded-xl border border-stone-200/50 min-h-0">
              {/* Column Header */}
              <div className={`px-3 py-2 border-b-2 rounded-t-xl ${col.headerColor} ${col.borderColor}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider">{col.title}</h3>
                  <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs font-bold">
                    {colTours.length}
                  </span>
                </div>
              </div>

              {/* Column Body / Cards */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {colTours.map(tour => {
                  const isMine = tour.guide_id === currentUserId
                  const isUngrouped = (tour as any)._isUngrouped
                  const peopleCount = totalPeople(tour)
                  const reqCount = requestCount(tour)
                  const languages = getLanguages(tour)
                  const dateObj = new Date(tour.requested_date + 'T00:00:00')

                  return (
                    <div 
                      key={tour.id} 
                      className="bg-white border border-stone-200 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden group"
                    >
                      {/* Card Header (Date) */}
                      <div 
                        className="px-3 py-2 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between cursor-pointer"
                        onClick={() => onViewDetails(tour.id)}
                      >
                        <div>
                          <div className="font-bold text-stone-900 text-sm">
                            {format(dateObj, 'MMM d, yyyy')}
                          </div>
                          <div className="text-[10px] text-stone-500 font-medium">
                            {format(dateObj, 'EEEE')}
                          </div>
                        </div>
                        {tour.confirmed_datetime && (
                          <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                            {format(new Date(tour.confirmed_datetime), 'h:mm a')}
                          </div>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="p-3 flex-1 cursor-pointer" onClick={() => onViewDetails(tour.id)}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-center">
                            <div className="text-xl font-black text-stone-800 leading-none">{peopleCount}</div>
                            <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider mt-1">People</div>
                          </div>
                          <div className="w-px h-8 bg-stone-200"></div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-stone-700 leading-none">{reqCount}</div>
                            <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider mt-1">Requests</div>
                          </div>
                        </div>

                        {/* Languages */}
                        {languages.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {languages.map(lang => (
                              <span key={lang} className="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded text-[11px] text-blue-700 font-medium">
                                {lang}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Guide Assignment */}
                        <div className="mt-2 pt-3 border-t border-stone-100" onClick={(e) => e.stopPropagation()}>
                          <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider mb-1.5">
                            Guide
                          </div>
                          {(isAdmin || isGuide) && onAssignGuide && !isUngrouped ? (
                            <select
                              value={tour.guide_id || ''}
                              onChange={(e) => onAssignGuide(tour.id, e.target.value)}
                              className="w-full px-2 py-1.5 border border-stone-200 focus:border-stone-400 focus:outline-none text-sm rounded bg-stone-50"
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
                            <span className={`text-sm ${isMine ? 'text-purple-700 font-bold' : 'text-stone-700 font-medium'}`}>
                              {tour.guide.first_name} {tour.guide.last_name}
                              {isMine && ' (You)'}
                            </span>
                          ) : (
                            <span className="text-stone-400 italic text-sm">Unassigned</span>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="px-3 py-2 bg-stone-50 border-t border-stone-100 flex flex-col gap-1.5">
                        {/* Ungrouped auto-group - available to both admins and guides */}
                        {(isAdmin || isGuide) && tour.status === 'Ungrouped' && onAutoGroup && (
                          <button
                            onClick={() => onAutoGroup(tour.requested_date)}
                            className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded transition-colors"
                          >
                            Auto-Group All
                          </button>
                        )}

                        {/* Admin Workflow Actions */}
                        {isAdmin && (
                          <>
                            {tour.guide_id && (tour.status === 'Ready' || tour.status === 'Pending') && (
                              <button
                                onClick={() => onAction(tour.id, 'submit-yale')}
                                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded transition-colors"
                              >
                                Submit to Yale
                              </button>
                            )}

                            {tour.status === 'PendingYale' && (
                              <button
                                onClick={() => onAction(tour.id, 'confirm')}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition-colors"
                              >
                                Confirm from Yale
                              </button>
                            )}

                            {tour.status === 'Confirmed' && (
                              <button
                                onClick={() => onAction(tour.id, 'complete')}
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded transition-colors"
                              >
                                Mark Complete
                              </button>
                            )}
                          </>
                        )}

                        {/* Guide Workflow Actions */}
                        {!isAdmin && (
                          <>
                            {!tour.guide_id && !isUngrouped && (
                              <button
                                onClick={() => onAction(tour.id, 'claim')}
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded transition-colors"
                              >
                                Claim Tour
                              </button>
                            )}

                            {isMine && (tour.status === 'Ready' || tour.status === 'Pending') && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => onAction(tour.id, 'unclaim')}
                                  className="flex-1 py-2 bg-stone-300 hover:bg-stone-400 text-stone-700 text-xs font-bold rounded transition-colors"
                                >
                                  Unclaim
                                </button>
                                <button
                                  onClick={() => onAction(tour.id, 'submit-yale')}
                                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded transition-colors"
                                >
                                  Submit
                                </button>
                              </div>
                            )}

                            {isMine && tour.status === 'PendingYale' && (
                              <button
                                onClick={() => onAction(tour.id, 'confirm')}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition-colors"
                              >
                                Confirm Time
                              </button>
                            )}

                            {isMine && tour.status === 'Confirmed' && (
                              <button
                                onClick={() => onAction(tour.id, 'complete')}
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded transition-colors"
                              >
                                Complete
                              </button>
                            )}

                            {!isMine && tour.status === 'Confirmed' && (
                              <button
                                onClick={() => onAction(tour.id, 'complete')}
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded transition-colors"
                              >
                                Mark Complete
                              </button>
                            )}
                          </>
                        )}

                        <button 
                          onClick={() => onViewDetails(tour.id)}
                          className="w-full py-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold rounded transition-colors"
                        >
                          Manage Group
                        </button>
                      </div>
                    </div>
                  )
                })}
                {colTours.length === 0 && (
                  <div className="p-4 text-center border-2 border-dashed border-stone-200 rounded-lg">
                    <span className="text-sm font-medium text-stone-400">No tours</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

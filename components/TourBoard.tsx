'use client'

import { useState } from 'react'
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
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  const columns = [
    {
      id: 'ungrouped',
      title: 'Ungrouped',
      accent: 'amber',
      headerClass: 'border-amber-200/20 bg-amber-300/10 text-amber-100',
      dotClass: 'bg-amber-300',
      emptyText: 'New date requests land here before grouping.'
    },
    {
      id: 'needs-guide',
      title: 'Needs Guide',
      accent: 'orange',
      headerClass: 'border-orange-200/20 bg-orange-300/10 text-orange-100',
      dotClass: 'bg-orange-300',
      emptyText: 'Grouped tours without an assigned guide.'
    },
    {
      id: 'ready',
      title: 'Ready for Yale',
      accent: 'red',
      headerClass: 'border-red-200/20 bg-red-300/10 text-red-100',
      dotClass: 'bg-red-300',
      emptyText: 'Assigned tours ready to submit to Yale.'
    },
    {
      id: 'pending-yale',
      title: 'Pending Yale',
      accent: 'blue',
      headerClass: 'border-blue-200/20 bg-blue-300/10 text-blue-100',
      dotClass: 'bg-blue-300',
      emptyText: 'Tours submitted and waiting for Yale.'
    },
    {
      id: 'confirmed',
      title: 'Confirmed',
      accent: 'emerald',
      headerClass: 'border-emerald-200/20 bg-emerald-300/10 text-emerald-100',
      dotClass: 'bg-emerald-300',
      emptyText: 'Confirmed tours ready to complete.'
    },
    {
      id: 'completed',
      title: 'Completed',
      accent: 'stone',
      headerClass: 'border-stone-200/15 bg-white/[0.06] text-stone-200',
      dotClass: 'bg-stone-300',
      emptyText: 'Completed tours will archive here.'
    }
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

  const accentBorder = (accent: string) => {
    const classes: Record<string, string> = {
      amber: 'border-l-amber-300/80',
      orange: 'border-l-orange-300/80',
      red: 'border-l-red-300/80',
      blue: 'border-l-blue-300/80',
      emerald: 'border-l-emerald-300/80',
      stone: 'border-l-stone-300/60'
    }
    return classes[accent] || classes.stone
  }

  const primaryActionClass = 'w-full rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-70'
  const secondaryActionClass = 'w-full rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-stone-300 transition-colors hover:bg-white/[0.08] hover:text-white'

  const runAction = async (tourId: string, action: string) => {
    const key = `${tourId}:${action}`
    setPendingAction(key)
    try {
      await Promise.resolve(onAction(tourId, action))
    } finally {
      setPendingAction(null)
    }
  }

  const runAutoGroup = async (date: string) => {
    if (!onAutoGroup) return
    const key = `auto:${date}`
    setPendingAction(key)
    try {
      await Promise.resolve(onAutoGroup(date))
    } finally {
      setPendingAction(null)
    }
  }

  const actionText = (key: string, label: string) => pendingAction === key ? 'Working...' : label

  // Empty state when no tours at all
  if (tours.length === 0) {
    return (
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] shadow-2xl shadow-black/20">
        <div className="py-20 px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 mb-6">
            <svg className="w-10 h-10 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <h3 className="heading-font text-3xl font-light text-white mb-3">
            No Tours Yet
          </h3>
          <p className="text-stone-400 text-sm max-w-md mx-auto mb-6">
            Tour bookings will appear here once visitors submit tour requests through the booking calendar.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto pb-3 -mx-4 px-4 md:mx-0 md:px-0 h-[calc(100vh-140px)] min-h-[540px]">
      <div className="flex gap-2 h-full min-h-0">
        {columns.map(col => {
          const colTours = getColumnTours(col.id)
          
          return (
            <div key={col.id} className="flex-1 min-w-[202px] flex flex-col rounded-2xl border border-white/10 bg-[#11100e] shadow-xl shadow-black/15 min-h-0 overflow-hidden">
              {/* Column Header */}
              <div className={`sticky top-0 z-10 border-b px-3 py-2.5 ${col.headerClass}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${col.dotClass}`} />
                    <h3 className="font-bold text-[11px] uppercase tracking-[0.14em]">{col.title}</h3>
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[11px] font-bold">
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
                  const participantPreview = tour.booking_requests?.slice(0, 4) || []
                  const hiddenParticipantCount = Math.max(0, (tour.booking_requests?.length || 0) - participantPreview.length)

                  return (
                    <div 
                      key={tour.id} 
                      className={`flex flex-col overflow-hidden rounded-xl border border-white/10 border-l-[3px] ${accentBorder(col.accent)} bg-white/[0.055] shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.075] group`}
                    >
                      {/* Card Header */}
                      <div 
                        className="cursor-pointer border-b border-white/10 bg-black/10 px-2.5 py-2"
                        onClick={() => onViewDetails(tour.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="heading-font truncate text-xl font-light leading-none tracking-[-0.04em] text-white">
                              {format(dateObj, 'MMM d')}
                            </div>
                            <div className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-[0.14em] text-stone-500">
                              {format(dateObj, 'EEE yyyy')}
                            </div>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <span className="rounded-full border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-bold text-white">
                              {peopleCount}p
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-bold text-white">
                              {reqCount}r
                            </span>
                          </div>
                        </div>
                        {tour.confirmed_datetime && (
                          <div className="mt-1 inline-flex rounded-full border border-emerald-200/20 bg-emerald-300/10 px-2 py-0.5 text-[10px] font-bold text-emerald-100">
                            {format(new Date(tour.confirmed_datetime), 'h:mm a')}
                          </div>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="p-2.5 flex-1 cursor-pointer" onClick={() => onViewDetails(tour.id)}>
                        {participantPreview.length > 0 && (
                          <div className="mb-2 border-b border-white/10 pb-2">
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <span className="text-[9px] uppercase font-bold text-stone-500 tracking-[0.15em]">Requests</span>
                              {hiddenParticipantCount > 0 && (
                                <span className="text-[9px] font-semibold text-stone-500">+{hiddenParticipantCount} more</span>
                              )}
                            </div>
                            <div className="space-y-1">
                              {participantPreview.map(request => (
                                <div key={request.id} className="flex items-center justify-between gap-2 text-[11px]">
                                  <span className="min-w-0 truncate font-semibold text-stone-200">
                                    {request.contact_name}
                                  </span>
                                  <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-bold text-white">
                                    {request.group_size}p
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Guide Assignment */}
                        <div onClick={(e) => e.stopPropagation()}>
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="text-[9px] uppercase font-bold text-stone-500 tracking-[0.15em]">Guide</span>
                            {languages.length > 0 && (
                              <span className="truncate text-[10px] font-semibold text-blue-100/80">
                                {languages.join(', ')}
                              </span>
                            )}
                          </div>
                          {(isAdmin || isGuide) && onAssignGuide && !isUngrouped ? (
                            <select
                              value={tour.guide_id || ''}
                              onChange={(e) => onAssignGuide(tour.id, e.target.value)}
                              className="w-full rounded-lg border border-white/10 bg-black/25 px-2.5 py-1.5 text-xs text-white focus:border-white/30 focus:outline-none [&>option]:bg-stone-950"
                            >
                              <option value="">Unassigned</option>
                              {guides.map(guide => (
                                <option key={guide.id} value={guide.id}>
                                  {guide.first_name} {guide.last_name}
                                </option>
                              ))}
                            </select>
                          ) : isUngrouped ? (
                            <span className="text-stone-500 italic text-xs">Not grouped yet</span>
                          ) : tour.guide ? (
                            <span className={`text-xs ${isMine ? 'text-purple-200 font-bold' : 'text-stone-200 font-medium'}`}>
                              {tour.guide.first_name} {tour.guide.last_name}
                              {isMine && ' (You)'}
                            </span>
                          ) : (
                            <span className="text-stone-500 italic text-xs">Unassigned</span>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="flex flex-col gap-1 border-t border-white/10 bg-black/15 px-2.5 py-2">
                        {/* Ungrouped auto-group - available to both admins and guides */}
                        {(isAdmin || isGuide) && tour.status === 'Ungrouped' && onAutoGroup && (
                          <button
                            onClick={() => runAutoGroup(tour.requested_date)}
                            disabled={pendingAction === `auto:${tour.requested_date}`}
                            className={`${primaryActionClass} bg-amber-600 hover:bg-amber-500`}
                          >
                            {actionText(`auto:${tour.requested_date}`, 'Auto-Group All')}
                          </button>
                        )}

                        {/* Admin Workflow Actions */}
                        {isAdmin && (
                          <>
                            {tour.guide_id && (tour.status === 'Ready' || tour.status === 'Pending') && (
                              <button
                                onClick={() => runAction(tour.id, 'submit-yale')}
                                disabled={pendingAction === `${tour.id}:submit-yale`}
                                className={`${primaryActionClass} bg-red-600 hover:bg-red-500`}
                              >
                                {actionText(`${tour.id}:submit-yale`, 'Submit to Yale')}
                              </button>
                            )}

                            {tour.status === 'PendingYale' && (
                              <button
                                onClick={() => runAction(tour.id, 'confirm')}
                                disabled={pendingAction === `${tour.id}:confirm`}
                                className={`${primaryActionClass} bg-blue-600 hover:bg-blue-500`}
                              >
                                {actionText(`${tour.id}:confirm`, 'Confirm from Yale')}
                              </button>
                            )}

                            {tour.status === 'Confirmed' && (
                              <button
                                onClick={() => runAction(tour.id, 'complete')}
                                disabled={pendingAction === `${tour.id}:complete`}
                                className={`${primaryActionClass} bg-emerald-600 hover:bg-emerald-500`}
                              >
                                {actionText(`${tour.id}:complete`, 'Mark Complete')}
                              </button>
                            )}
                          </>
                        )}

                        {/* Guide Workflow Actions */}
                        {!isAdmin && (
                          <>
                            {!tour.guide_id && !isUngrouped && (
                              <button
                                onClick={() => runAction(tour.id, 'claim')}
                                disabled={pendingAction === `${tour.id}:claim`}
                                className={`${primaryActionClass} bg-emerald-600 hover:bg-emerald-500`}
                              >
                                {actionText(`${tour.id}:claim`, 'Claim Tour')}
                              </button>
                            )}

                            {isMine && (tour.status === 'Ready' || tour.status === 'Pending') && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => runAction(tour.id, 'unclaim')}
                                  disabled={pendingAction === `${tour.id}:unclaim`}
                                  className="flex-1 rounded-lg border border-white/10 bg-white/[0.06] py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-stone-300 transition-colors hover:bg-white/[0.1] hover:text-white"
                                >
                                  {actionText(`${tour.id}:unclaim`, 'Unclaim')}
                                </button>
                                <button
                                  onClick={() => runAction(tour.id, 'submit-yale')}
                                  disabled={pendingAction === `${tour.id}:submit-yale`}
                                  className="flex-1 rounded-lg bg-red-600 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-red-500"
                                >
                                  {actionText(`${tour.id}:submit-yale`, 'Submit')}
                                </button>
                              </div>
                            )}

                            {isMine && tour.status === 'PendingYale' && (
                              <button
                                onClick={() => runAction(tour.id, 'confirm')}
                                disabled={pendingAction === `${tour.id}:confirm`}
                                className={`${primaryActionClass} bg-blue-600 hover:bg-blue-500`}
                              >
                                {actionText(`${tour.id}:confirm`, 'Confirm Time')}
                              </button>
                            )}

                            {isMine && tour.status === 'Confirmed' && (
                              <button
                                onClick={() => runAction(tour.id, 'complete')}
                                disabled={pendingAction === `${tour.id}:complete`}
                                className={`${primaryActionClass} bg-emerald-600 hover:bg-emerald-500`}
                              >
                                {actionText(`${tour.id}:complete`, 'Complete')}
                              </button>
                            )}

                            {!isMine && tour.status === 'Confirmed' && (
                              <button
                                onClick={() => runAction(tour.id, 'complete')}
                                disabled={pendingAction === `${tour.id}:complete`}
                                className={`${primaryActionClass} bg-emerald-600 hover:bg-emerald-500`}
                              >
                                {actionText(`${tour.id}:complete`, 'Mark Complete')}
                              </button>
                            )}
                          </>
                        )}

                        <button 
                          onClick={() => onViewDetails(tour.id)}
                          className={secondaryActionClass}
                        >
                          Manage Group
                        </button>
                      </div>
                    </div>
                  )
                })}
                {colTours.length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/10 p-3 text-center">
                    <span className="text-xs font-medium text-stone-500">No tours</span>
                    <p className="mt-1 text-[11px] leading-4 text-stone-600">{col.emptyText}</p>
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

'use client'

import { useRef, useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isBefore, startOfDay } from 'date-fns'

interface CalendarProps {
  onDateSelect: (date: Date) => void
  selectedDate: Date | null
  bookingsData: any[]
  theme?: 'light' | 'dark'
  selectedGuideIds?: string[]
  selectedGuides?: Array<{ id: string; first_name: string; last_name: string }>
  availableGuides?: Array<{ id: string; first_name: string; last_name: string }>
  isLoadingGuides?: boolean
  onGuideSelectionChange?: (guideIds: string[]) => void
  showGuideAvailability?: boolean
}

interface GuideAvailabilityDay {
  date: string
  guides: Array<{ id: string; first_name: string; last_name: string }>
}

export default function Calendar({
  onDateSelect,
  selectedDate,
  bookingsData,
  theme = 'dark',
  selectedGuideIds = [],
  selectedGuides = [],
  availableGuides = [],
  isLoadingGuides = false,
  onGuideSelectionChange,
  showGuideAvailability = false
}: CalendarProps) {
  const isLightTheme = theme === 'light'
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [bookingsByDate, setBookingsByDate] = useState<Record<string, any>>({})
  const [monthBookings, setMonthBookings] = useState<any[]>([])
  const [availabilityByDate, setAvailabilityByDate] = useState<Record<string, GuideAvailabilityDay>>({})
  const [guideMenuAtEnd, setGuideMenuAtEnd] = useState(false)
  const [guideMenuOpen, setGuideMenuOpen] = useState(false)
  const guideMenuRef = useRef<HTMLDivElement>(null)
  const selectedGuideKey = selectedGuideIds.join(',')

  // Fetch bookings when month changes
  useEffect(() => {
    const fetchMonthBookings = async () => {
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth() + 1
      
      try {
        const response = await fetch(`/api/bookings/calendar?year=${year}&month=${month}`)
        if (response.ok) {
          const data = await response.json()
          setMonthBookings(data)
        }
      } catch (error) {
        console.error('Error fetching calendar data:', error)
      }
    }

    fetchMonthBookings()
  }, [currentMonth])

  // Also update when bookingsData prop changes (from parent)
  useEffect(() => {
    if (bookingsData && bookingsData.length > 0) {
      setMonthBookings(bookingsData)
    }
  }, [bookingsData])

  useEffect(() => {
    // Convert bookings array to date-keyed object
    const dataMap: Record<string, any> = {}
    monthBookings.forEach(b => {
      // Use YYYY-MM-DD format to match API response
      dataMap[b.date] = b
    })
    setBookingsByDate(dataMap)
  }, [monthBookings])

  useEffect(() => {
    const fetchGuideAvailability = async () => {
      if (!showGuideAvailability || selectedGuideIds.length === 0) {
        setAvailabilityByDate({})
        return
      }

      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth() + 1

      try {
        const response = await fetch(`/api/guides/availability?year=${year}&month=${month}&guideIds=${selectedGuideIds.join(',')}`)
        if (response.ok) {
          const data: GuideAvailabilityDay[] = await response.json()
          const dataMap: Record<string, GuideAvailabilityDay> = {}
          data.forEach(day => {
            dataMap[day.date] = day
          })
          setAvailabilityByDate(dataMap)
        }
      } catch (error) {
        console.error('Error fetching guide availability:', error)
      }
    }

    fetchGuideAvailability()
  }, [currentMonth, selectedGuideKey, showGuideAvailability, selectedGuideIds])

  useEffect(() => {
    setGuideMenuAtEnd(false)
  }, [availableGuides.length, selectedGuideKey])

  useEffect(() => {
    if (!guideMenuOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!guideMenuRef.current?.contains(event.target as Node)) {
        setGuideMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [guideMenuOpen])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startDay = getDay(monthStart)
  const today = startOfDay(new Date())

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(newDate.getMonth() + delta)
    setCurrentMonth(newDate)
  }

  const guideInitials = (guide: { first_name: string; last_name: string }) =>
    `${guide.first_name?.[0] || ''}${guide.last_name?.[0] || ''}`.toUpperCase()

  const guideColorClass = (guideId: string) => {
    const colors = isLightTheme
      ? [
          'bg-amber-100 text-amber-900 border-amber-300/70',
          'bg-blue-100 text-blue-900 border-blue-300/70',
          'bg-emerald-100 text-emerald-900 border-emerald-300/70',
          'bg-purple-100 text-purple-900 border-purple-300/70',
          'bg-rose-100 text-rose-900 border-rose-300/70'
        ]
      : [
          'bg-amber-300/20 text-amber-50 border-amber-200/30',
          'bg-blue-300/20 text-blue-50 border-blue-200/30',
          'bg-emerald-300/20 text-emerald-50 border-emerald-200/30',
          'bg-purple-300/20 text-purple-50 border-purple-200/30',
          'bg-rose-300/20 text-rose-50 border-rose-200/30'
        ]
    const index = Math.max(0, selectedGuides.findIndex(guide => guide.id === guideId))
    return colors[index % colors.length]
  }

  const toggleGuide = (guideId: string) => {
    if (!onGuideSelectionChange) return
    onGuideSelectionChange(
      selectedGuideIds.includes(guideId)
        ? selectedGuideIds.filter(id => id !== guideId)
        : [...selectedGuideIds, guideId]
    )
  }

  const handleGuideMenuScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget
    const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight
    setGuideMenuAtEnd(distanceFromBottom < 8)
  }

  const getDayClasses = (date: Date) => {
    const dayOfWeek = getDay(date)
    const isPast = isBefore(date, today)
    const isMuseumOpen = dayOfWeek !== 1 // Museum closed Mondays only (day 1)
    const isToday = isSameDay(date, today)
    const isSelected = selectedDate && isSameDay(date, selectedDate)
    const dateKey = format(date, 'yyyy-MM-dd')
    const hasBookings = bookingsByDate[dateKey]
    const hasGuideAvailability = !!availabilityByDate[dateKey]?.guides?.length
    const requiresGuideAvailability = showGuideAvailability && selectedGuideIds.length > 0
    const isAvailable = !isPast && isMuseumOpen && (!requiresGuideAvailability || hasGuideAvailability)

    // iOS-style for both mobile and desktop - date at top, plus at bottom
    let classes = 'relative h-28 md:h-24 lg:h-28 flex flex-col transition-all duration-200 rounded-2xl '
    classes += `items-start justify-start p-1.5 md:p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70 focus-visible:ring-offset-2 ${isLightTheme ? 'focus-visible:ring-offset-stone-100 ' : 'focus-visible:ring-offset-stone-950 '}`
    
    if (!isAvailable) {
      classes += isLightTheme
        ? 'bg-stone-100/80 text-stone-400 cursor-not-allowed border border-stone-200/80'
        : 'bg-white/[0.025] text-stone-700 cursor-not-allowed border border-white/[0.04]'
    } else if (isSelected) {
      classes += isLightTheme
        ? 'bg-amber-200 text-stone-950 shadow-xl shadow-amber-900/10 ring-2 ring-amber-300 ring-offset-2 ring-offset-[#faf7f0] cursor-pointer'
        : 'bg-amber-100 text-stone-950 shadow-2xl shadow-amber-950/30 ring-2 ring-amber-200 ring-offset-2 ring-offset-[#050505] cursor-pointer'
    } else if (hasBookings) {
      classes += isLightTheme
        ? 'bg-emerald-100/90 border border-emerald-300/70 text-emerald-950 shadow-sm hover:bg-emerald-100 hover:-translate-y-0.5 hover:shadow-md cursor-pointer'
        : 'bg-emerald-300/14 border border-emerald-200/65 text-emerald-50 shadow-inner shadow-emerald-950/30 hover:bg-emerald-300/20 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer'
    } else if (isToday) {
      classes += isLightTheme
        ? 'bg-amber-100/90 border border-amber-300/80 text-amber-950 shadow-sm hover:bg-amber-100 hover:-translate-y-0.5 hover:shadow-md cursor-pointer'
        : 'bg-amber-300/14 border border-amber-200/70 text-amber-50 hover:bg-amber-300/20 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer'
    } else {
      classes += isLightTheme
        ? 'bg-white/80 border border-stone-200/90 text-stone-700 shadow-sm hover:border-stone-300 hover:bg-white hover:-translate-y-0.5 hover:shadow-md cursor-pointer'
        : 'bg-white/[0.075] border border-white/[0.13] text-stone-100 hover:border-white/25 hover:bg-white/[0.11] hover:-translate-y-0.5 hover:shadow-md cursor-pointer'
    }

    return classes
  }

  return (
    <div
      className={`overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-300 ${
        isLightTheme
          ? 'border-stone-200/80 bg-white/[0.82] shadow-stone-300/30'
          : 'border-white/10 bg-[#11100e] shadow-black/30'
      }`}
    >
      {/* Month Header */}
      <div
        className={`flex h-[64px] items-center justify-between border-b px-4 md:h-[76px] md:px-8 ${
          isLightTheme ? 'border-stone-200/80 bg-stone-50/80' : 'border-white/10 bg-white/[0.045]'
        }`}
      >
        <button 
          onClick={() => changeMonth(-1)}
          aria-label="Previous month"
          className={`rounded-full border p-2 transition-colors ${
            isLightTheme ? 'border-stone-200 bg-white text-stone-600 hover:bg-stone-100' : 'border-white/10 bg-white/[0.04] text-stone-300 hover:bg-white/10'
          }`}>
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <h2 className={`heading-font text-2xl font-light tracking-[-0.03em] md:text-4xl ${isLightTheme ? 'text-stone-900' : 'text-white'}`}>
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button 
          onClick={() => changeMonth(1)}
          aria-label="Next month"
          className={`rounded-full border p-2 transition-colors ${
            isLightTheme ? 'border-stone-200 bg-white text-stone-600 hover:bg-stone-100' : 'border-white/10 bg-white/[0.04] text-stone-300 hover:bg-white/10'
          }`}>
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

      {showGuideAvailability && (
        <div className={`border-b px-4 py-3 md:px-8 ${isLightTheme ? 'border-stone-200/80 bg-white/[0.65]' : 'border-white/10 bg-black/10'}`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${isLightTheme ? 'text-stone-500' : 'text-stone-500'}`}>Guide Preference</p>
              <p className={`mt-1 text-sm ${isLightTheme ? 'text-stone-600' : 'text-stone-400'}`}>
                {selectedGuideIds.length === 0
                  ? 'Not specified. Showing all museum-open dates.'
                  : `Only showing dates available for ${selectedGuideIds.length} selected guide${selectedGuideIds.length === 1 ? '' : 's'}.`}
              </p>
            </div>
            <div ref={guideMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setGuideMenuOpen(open => !open)}
                className={`flex w-full cursor-pointer list-none items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors md:min-w-[280px] ${
                  isLightTheme
                    ? 'border-stone-200 bg-white text-stone-900 hover:bg-stone-50'
                    : 'border-white/10 bg-black/25 text-white hover:bg-white/[0.06]'
                }`}
              >
                <span className="truncate">
                  {selectedGuideIds.length === 0
                    ? 'Guide not specified'
                    : selectedGuides.map(guide => guide.first_name).join(', ')}
                </span>
                <svg className={`h-4 w-4 shrink-0 transition-transform ${guideMenuOpen ? 'rotate-180' : ''} ${isLightTheme ? 'text-stone-500' : 'text-stone-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              {guideMenuOpen && (
              <div
                className={`absolute right-0 z-30 mt-2 w-full min-w-[280px] overflow-hidden rounded-2xl border p-2 shadow-2xl ${
                  isLightTheme ? 'border-stone-200 bg-white shadow-stone-300/40' : 'border-white/10 bg-[#11100e] shadow-black/40'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onGuideSelectionChange?.([])
                    setGuideMenuOpen(false)
                  }}
                  className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    selectedGuideIds.length === 0
                      ? isLightTheme ? 'bg-amber-100 text-amber-950' : 'bg-amber-200/15 text-amber-50'
                      : isLightTheme ? 'text-stone-700 hover:bg-stone-100 hover:text-stone-950' : 'text-stone-300 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <span>Not specified</span>
                  <span className={`text-xs ${isLightTheme ? 'text-stone-500' : 'text-stone-500'}`}>All dates</span>
                </button>
                <div className="relative">
                <div
                  onScroll={handleGuideMenuScroll}
                  className={`max-h-56 overflow-y-auto pr-1 [scrollbar-width:thin] ${
                    isLightTheme ? '[scrollbar-color:rgba(120,113,108,0.35)_transparent]' : '[scrollbar-color:rgba(245,245,244,0.28)_transparent]'
                  }`}
                >
                  {isLoadingGuides ? (
                    <div className={`px-3 py-2 text-sm ${isLightTheme ? 'text-stone-500' : 'text-stone-500'}`}>Loading guides...</div>
                  ) : availableGuides.length === 0 ? (
                    <div className={`px-3 py-2 text-sm ${isLightTheme ? 'text-stone-500' : 'text-stone-500'}`}>No public guides available yet.</div>
                  ) : (
                    availableGuides.map(guide => {
                      const selected = selectedGuideIds.includes(guide.id)
                      return (
                        <button
                          key={guide.id}
                          type="button"
                          onClick={() => toggleGuide(guide.id)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                            selected
                              ? isLightTheme ? 'bg-amber-100 text-amber-950' : 'bg-amber-200/15 text-amber-50'
                              : isLightTheme ? 'text-stone-700 hover:bg-stone-100 hover:text-stone-950' : 'text-stone-300 hover:bg-white/[0.06] hover:text-white'
                          }`}
                        >
                          <span>{guide.first_name} {guide.last_name}</span>
                          <span className={`h-4 w-4 rounded border ${selected ? 'border-amber-400 bg-amber-400' : isLightTheme ? 'border-stone-300' : 'border-white/20'}`} />
                        </button>
                      )
                    })
                  )}
                </div>
                {availableGuides.length > 5 && !guideMenuAtEnd && (
                  <div
                    className={`pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t pb-1 pt-8 ${
                      isLightTheme ? 'from-white via-white/85 to-transparent' : 'from-[#11100e] via-[#11100e]/85 to-transparent'
                    }`}
                  >
                    <svg className={`h-4 w-4 animate-bounce ${isLightTheme ? 'text-stone-500' : 'text-stone-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                )}
                </div>
              </div>
              )}
            </div>
          </div>
          {selectedGuideIds.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedGuides.map(guide => (
                <span
                  key={guide.id}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    isLightTheme ? 'border-amber-300/70 bg-amber-100 text-amber-950' : 'border-amber-200/25 bg-amber-200/10 text-amber-50'
                  }`}
                >
                  {guide.first_name} {guide.last_name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Calendar Grid */}
      <div className="p-3 md:p-6 lg:p-8">
        {/* Day Names */}
        <div className="grid grid-cols-7 gap-1 md:gap-4 mb-2 md:mb-4">
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
            <div key={day} className={`py-1 text-center text-[9px] font-bold uppercase tracking-[0.14em] sm:tracking-[0.18em] md:py-2 md:text-xs ${isLightTheme ? 'text-stone-500' : 'text-stone-500'}`}>
              <span className="hidden xl:inline">{day}</span>
              <span className="hidden sm:inline xl:hidden">{day.substring(0, 3)}</span>
              <span className="sm:hidden">{day.substring(0, 1)}</span>
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 md:gap-4">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-28 md:h-24 lg:h-28"></div>
          ))}

          {/* Days of month */}
          {daysInMonth.map(date => {
            const dayOfWeek = getDay(date)
            const isPast = isBefore(date, today)
            const isMuseumOpen = dayOfWeek !== 1 // Museum closed Mondays only
            const isAvailable = !isPast && isMuseumOpen
            const dateKey = format(date, 'yyyy-MM-dd')
            const hasBookings = bookingsByDate[dateKey]
            const guideAvailability = availabilityByDate[dateKey]
            const isToday = isSameDay(date, today)
            const isSelected = selectedDate && isSameDay(date, selectedDate)
            const hasGuideAvailability = !!guideAvailability?.guides?.length
            const showNamedGuides = selectedGuideIds.length > 1
            const requiresGuideAvailability = showGuideAvailability && selectedGuideIds.length > 0
            const canSelectDate = !isPast && isMuseumOpen && (!requiresGuideAvailability || hasGuideAvailability)

            return (
              <button
                key={date.toISOString()}
                onClick={() => canSelectDate ? onDateSelect(date) : null}
                disabled={!canSelectDate}
                className={getDayClasses(date)}
              >
                {/* Day Number - always at top */}
                <div className="w-full mb-auto">
                  <span className="heading-font text-lg md:text-xl lg:text-2xl font-light">
                    {format(date, 'd')}
                  </span>
                </div>

                {/* Today Badge */}
                {isToday && (
                  <span className="absolute top-1 right-1 text-[7px] md:text-[9px] font-bold px-1.5 md:px-2 py-0.5 bg-amber-500 text-[#fffaf0] rounded-full uppercase tracking-wider shadow-sm">
                    Today
                  </span>
                )}

                {/* Booking Indicators - same on mobile and desktop */}
                {canSelectDate ? (
                  <div className="w-full mt-auto flex flex-col items-center">
                    {showGuideAvailability && hasGuideAvailability && (
                      <div className="mb-1 flex max-w-full flex-wrap justify-center gap-1">
                        {showNamedGuides ? (
                          guideAvailability.guides.slice(0, 4).map(guide => (
                            <span
                              key={guide.id}
                              title={`${guide.first_name} ${guide.last_name}`}
                              className={`inline-flex min-w-6 items-center justify-center rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase ${guideColorClass(guide.id)}`}
                            >
                              {guideInitials(guide)}
                            </span>
                          ))
                        ) : (
                          <span className={`rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide ${
                            isSelected
                              ? 'border-stone-950/20 bg-stone-950/10 text-stone-900'
                              : isLightTheme
                                ? 'border-emerald-300/70 bg-emerald-100 text-emerald-900'
                                : 'border-emerald-200/25 bg-emerald-300/15 text-emerald-100'
                          }`}>
                            Guide available
                          </span>
                        )}
                        {showNamedGuides && guideAvailability.guides.length > 4 && (
                          <span
                            className={`inline-flex min-w-6 items-center justify-center rounded-full border px-1.5 py-0.5 text-[8px] font-bold ${
                              isLightTheme ? 'border-stone-300 bg-white text-stone-600' : 'border-white/15 bg-white/10 text-stone-200'
                            }`}
                          >
                            +{guideAvailability.guides.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full border shadow-sm md:h-8 md:w-8 ${
                        isSelected
                          ? 'bg-stone-950/10 border-stone-950/20'
                          : isLightTheme
                            ? 'bg-white border-stone-300'
                            : 'bg-white/10 border-white/15'
                      }`}
                    >
                      <svg className={`h-3.5 w-3.5 md:h-4 md:w-4 ${isSelected ? 'text-stone-950' : isLightTheme ? 'text-stone-500' : 'text-stone-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/>
                      </svg>
                    </div>
                    {hasBookings && (
                      <div className={`text-center text-[9px] md:text-[10px] font-semibold mt-1 ${isSelected ? 'text-stone-900' : isLightTheme ? 'text-emerald-800' : 'text-emerald-200'}`}>
                        {hasBookings.requestCount} {hasBookings.requestCount === 1 ? 'req' : 'reqs'}
                      </div>
                    )}
                    {!hasBookings && (
                      <div className={`mt-1 hidden text-center text-[10px] font-medium md:block ${isSelected ? 'text-stone-800' : isLightTheme ? 'text-stone-500' : 'text-stone-500'}`}>
                        Available
                      </div>
                    )}
                  </div>
                ) : requiresGuideAvailability && !isPast && isMuseumOpen ? (
                  <div className={`mt-auto w-full text-center text-[9px] font-semibold uppercase tracking-wide ${isLightTheme ? 'text-stone-400' : 'text-stone-600'}`}>
                    No guide
                  </div>
                ) : null}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className={`mt-4 border-t pt-4 md:mt-8 md:pt-5 ${isLightTheme ? 'border-stone-200/80' : 'border-white/10'}`}>
          <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${
                  isLightTheme ? 'border-emerald-300/70 bg-emerald-100/80' : 'border-emerald-200/20 bg-emerald-300/10'
                }`}
              >
                <div className={`h-2.5 w-2.5 rounded-full border ${isLightTheme ? 'border-emerald-500 bg-emerald-400' : 'border-emerald-200/80 bg-emerald-300/30'}`}></div>
                <span className={`text-[10px] uppercase tracking-wide md:text-xs ${isLightTheme ? 'text-emerald-800' : 'text-emerald-100/85'}`}>Has Requests</span>
              </div>
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${
                  isLightTheme ? 'border-amber-300/70 bg-amber-100/80' : 'border-amber-200/20 bg-amber-300/10'
                }`}
              >
                <div className={`h-2.5 w-2.5 rounded-full ${isLightTheme ? 'bg-amber-400' : 'bg-amber-100'}`}></div>
                <span className={`text-[10px] uppercase tracking-wide md:text-xs ${isLightTheme ? 'text-amber-800' : 'text-amber-100/85'}`}>Selected</span>
              </div>
            </div>
            <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] md:text-xs ${isLightTheme ? 'text-stone-500' : 'text-stone-500'}`}>Museum Open: Tue-Sun</p>
          </div>
        </div>
      </div>
    </div>
  )
}


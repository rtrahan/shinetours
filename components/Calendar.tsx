'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isBefore, startOfDay } from 'date-fns'

interface CalendarProps {
  onDateSelect: (date: Date) => void
  selectedDate: Date | null
  bookingsData: any[]
}

export default function Calendar({ onDateSelect, selectedDate, bookingsData }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [bookingsByDate, setBookingsByDate] = useState<Record<string, any>>({})
  const [monthBookings, setMonthBookings] = useState<any[]>([])

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

  const getDayClasses = (date: Date) => {
    const dayOfWeek = getDay(date)
    const isPast = isBefore(date, today)
    const isMuseumOpen = dayOfWeek !== 1 // Museum closed Mondays only (day 1)
    const isToday = isSameDay(date, today)
    const isSelected = selectedDate && isSameDay(date, selectedDate)
    const dateKey = format(date, 'yyyy-MM-dd')
    const hasBookings = bookingsByDate[dateKey]
    const isAvailable = !isPast && isMuseumOpen

    // iOS-style for both mobile and desktop - date at top, plus at bottom
    let classes = 'relative h-28 md:h-24 lg:h-28 flex flex-col transition-all duration-200 rounded '
    classes += 'items-start justify-start p-1.5 md:p-2 '
    
    if (!isAvailable) {
      classes += 'bg-stone-100 text-stone-300 cursor-not-allowed opacity-40'
    } else if (isSelected) {
      classes += 'bg-stone-800 text-white shadow-xl scale-105 cursor-pointer'
    } else if (hasBookings) {
      classes += 'bg-white border-2 border-emerald-700 text-stone-800 hover:bg-emerald-50 hover:scale-105 hover:shadow-lg cursor-pointer'
    } else if (isToday) {
      classes += 'bg-white border-2 border-amber-600 text-stone-800 hover:bg-amber-50 hover:scale-105 cursor-pointer'
    } else {
      classes += 'bg-white border border-stone-200 text-stone-700 hover:border-stone-800 hover:scale-105 hover:shadow-md cursor-pointer'
    }

    return classes
  }

  return (
    <div className="bg-white border border-stone-200 shadow-sm rounded-lg">
      {/* Month Header */}
      <div className="border-b border-stone-200 bg-stone-50 px-4 md:px-8 h-[60px] md:h-[72px] flex items-center justify-between">
        <button 
          onClick={() => changeMonth(-1)}
          className="p-2 hover:bg-stone-100 rounded transition-colors">
          <svg className="w-4 h-4 md:w-5 md:h-5 text-stone-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <h2 className="heading-font text-xl md:text-3xl font-light text-stone-800">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button 
          onClick={() => changeMonth(1)}
          className="p-2 hover:bg-stone-100 rounded transition-colors">
          <svg className="w-4 h-4 md:w-5 md:h-5 text-stone-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-3 md:p-8">
        {/* Day Names */}
        <div className="grid grid-cols-7 gap-1 md:gap-4 mb-2 md:mb-4">
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
            <div key={day} className="text-center text-[9px] md:text-xs font-semibold text-stone-500 uppercase tracking-wider py-1 md:py-2">
              <span className="hidden md:inline">{day}</span>
              <span className="md:hidden">{day.substring(0, 3)}</span>
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 md:gap-4">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-16 md:h-20 lg:h-24"></div>
          ))}

          {/* Days of month */}
          {daysInMonth.map(date => {
            const dayOfWeek = getDay(date)
            const isPast = isBefore(date, today)
            const isMuseumOpen = dayOfWeek !== 1 // Museum closed Mondays only
            const isAvailable = !isPast && isMuseumOpen
            const dateKey = format(date, 'yyyy-MM-dd')
            const hasBookings = bookingsByDate[dateKey]
            const isToday = isSameDay(date, today)

            return (
              <button
                key={date.toISOString()}
                onClick={() => isAvailable ? onDateSelect(date) : null}
                disabled={!isAvailable}
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
                  <span className="absolute top-1 right-1 text-[7px] md:text-[9px] font-bold px-1.5 md:px-2 py-0.5 bg-amber-500 text-white rounded-full uppercase tracking-wider shadow-sm">
                    Today
                  </span>
                )}

                {/* Booking Indicators - same on mobile and desktop */}
                {isAvailable && (
                  <div className="w-full mt-auto flex flex-col items-center">
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-stone-200 border-2 border-stone-300 rounded-full flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/>
                      </svg>
                    </div>
                    {hasBookings && (
                      <div className="text-center text-[9px] md:text-[10px] text-emerald-700 font-semibold mt-1">
                        {hasBookings.requestCount} already
                      </div>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 md:mt-8 pt-4 md:pt-6 border-t border-stone-200">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-4 md:gap-8 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-emerald-700"></div>
                <span className="text-[10px] md:text-xs text-stone-600 uppercase tracking-wide">Has Requests</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 md:w-4 md:h-4 bg-stone-800"></div>
                <span className="text-[10px] md:text-xs text-stone-600 uppercase tracking-wide">Selected</span>
              </div>
            </div>
            <p className="text-[10px] md:text-xs text-amber-700 font-medium">Museum Open: Tue-Sun</p>
          </div>
        </div>
      </div>
    </div>
  )
}


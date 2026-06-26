'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StaffFooter, StaffHeader } from '@/components/StaffChrome'
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, isBefore, isSameDay, startOfDay, startOfMonth } from 'date-fns'

interface AvailabilityDay {
  date: string
  guides: Array<{ id: string; first_name: string; last_name: string }>
}

export default function GuideAvailabilityPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set())
  const [savingDate, setSavingDate] = useState<string | null>(null)
  const visibleMonths = [currentMonth, addMonths(currentMonth, 1)]

  useEffect(() => {
    checkAuthAndFetch()
  }, [])

  useEffect(() => {
    if (!loading) fetchAvailability()
  }, [currentMonth])

  const checkAuthAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    await fetchAvailability()
    setLoading(false)
  }

  const fetchAvailability = async () => {
    const responses = await Promise.all(
      visibleMonths.map(month => (
        fetch(`/api/guides/availability?mine=true&year=${month.getFullYear()}&month=${month.getMonth() + 1}`)
      ))
    )

    if (responses.some(response => !response.ok)) return

    const data = await Promise.all(responses.map(response => response.json() as Promise<AvailabilityDay[]>))
    setAvailableDates(new Set(data.flat().map(day => day.date)))
  }

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(newDate.getMonth() + delta)
    setCurrentMonth(newDate)
  }

  const toggleDate = async (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    const dayOfWeek = getDay(date)
    const isPast = isBefore(date, startOfDay(new Date()))

    if (dayOfWeek === 1 || isPast) return

    const nextAvailable = !availableDates.has(dateKey)
    setSavingDate(dateKey)

    const nextDates = new Set(availableDates)
    if (nextAvailable) {
      nextDates.add(dateKey)
    } else {
      nextDates.delete(dateKey)
    }
    setAvailableDates(nextDates)

    const response = await fetch('/api/guides/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: dateKey, available: nextAvailable })
    })

    if (!response.ok) {
      await fetchAvailability()
    }

    setSavingDate(null)
  }

  const today = startOfDay(new Date())
  const visibleAvailableCount = Array.from(availableDates).filter(dateKey => {
    const monthKey = dateKey.slice(0, 7)
    return visibleMonths.some(month => format(month, 'yyyy-MM') === monthKey)
  }).length

  const renderMonth = (monthDate: Date, isSecondary = false) => {
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const startDay = getDay(monthStart)

    return (
      <section className={isSecondary ? 'hidden xl:block xl:border-l xl:border-white/10' : ''} aria-label={format(monthDate, 'MMMM yyyy')}>
        <div className="flex h-14 items-center justify-center border-b border-white/10 bg-white/[0.045] px-12">
          <h3 className="heading-font text-2xl font-light tracking-[-0.03em] text-white">
            {format(monthDate, 'MMMM yyyy')}
          </h3>
        </div>

        <div className="p-3 lg:p-4">
          <div className="mb-2 grid grid-cols-7 gap-1.5">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
              <div key={day} className="py-1 text-center text-[9px] font-bold uppercase tracking-[0.18em] text-stone-500 lg:text-[10px]">
                <span className="hidden 2xl:inline">{day}</span>
                <span className="2xl:hidden">{day.substring(0, 3)}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-[4.6rem] 2xl:h-20"></div>
            ))}

            {daysInMonth.map(date => {
              const dateKey = format(date, 'yyyy-MM-dd')
              const isPast = isBefore(date, today)
              const isClosed = getDay(date) === 1
              const isAvailable = availableDates.has(dateKey)
              const disabled = isPast || isClosed
              const isToday = isSameDay(date, today)

              return (
                <button
                  key={dateKey}
                  onClick={() => toggleDate(date)}
                  disabled={disabled || savingDate === dateKey}
                  className={`relative flex h-[4.6rem] flex-col items-start rounded-xl border p-1.5 text-left transition-all 2xl:h-20 ${
                    disabled
                      ? 'cursor-not-allowed border-white/[0.04] bg-white/[0.025] text-stone-700'
                      : isAvailable
                        ? 'border-emerald-200/70 bg-emerald-300/15 text-emerald-50 shadow-inner shadow-emerald-950/30 hover:bg-emerald-300/20'
                        : 'border-white/[0.13] bg-white/[0.075] text-stone-100 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.11]'
                  }`}
                >
                  <span className="heading-font text-lg font-light leading-none">{format(date, 'd')}</span>
                  {isToday && (
                    <span className="absolute right-1 top-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-white">Today</span>
                  )}
                  <div className="mt-auto w-full">
                    {isClosed ? (
                      <span className="text-[8px] font-semibold uppercase tracking-wide text-stone-600">Closed</span>
                    ) : isPast ? (
                      <span className="text-[8px] font-semibold uppercase tracking-wide text-stone-700">Past</span>
                    ) : isAvailable ? (
                      <span className="inline-flex rounded-full bg-emerald-300/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-emerald-100">Available</span>
                    ) : (
                      <span className="text-[8px] font-semibold uppercase tracking-wide text-stone-500">Mark</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-5 text-center shadow-2xl shadow-black/30">
          <p className="heading-font text-2xl font-light text-white">Loading availability...</p>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-stone-500">Light & Truth</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#241d18_0,#11100e_34%,#050505_100%)] text-stone-100">
      <StaffHeader role="guide" active="availability" />

      <main className="mx-auto max-w-[1600px] px-4 py-4 md:px-8 md:py-6">
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-100/60">Date-only availability</p>
            <h2 className="heading-font text-4xl font-light tracking-[-0.04em] text-white md:text-[2.75rem]">Mark Your Available Tour Dates</h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-5 text-stone-400">
              Select future museum-open dates when you are willing to give a tour. These dates appear as guidance on the public booking calendar.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Visible Range</p>
            <p className="mt-1 text-sm font-semibold text-white">{visibleAvailableCount} available date{visibleAvailableCount === 1 ? '' : 's'}</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#11100e] shadow-2xl shadow-black/30">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-14 items-center justify-between px-4 md:px-5">
            <button
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
              className="pointer-events-auto rounded-full border border-white/10 bg-black/20 p-1.5 backdrop-blur-sm transition-colors hover:bg-white/10"
            >
              <svg className="h-4 w-4 text-stone-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <button
              onClick={() => changeMonth(1)}
              aria-label="Next month"
              className="pointer-events-auto rounded-full border border-white/10 bg-black/20 p-1.5 backdrop-blur-sm transition-colors hover:bg-white/10"
            >
              <svg className="h-4 w-4 text-stone-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          <div className="xl:grid xl:grid-cols-2">
            {visibleMonths.map((month, index) => (
              <div key={format(month, 'yyyy-MM')}>
                {renderMonth(month, index === 1)}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-white/10 px-3 py-3 md:px-4">
              <span className="rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1.5 text-[10px] uppercase tracking-wide text-emerald-100/85">Available</span>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] uppercase tracking-wide text-stone-300">Unavailable</span>
              <span className="rounded-full border border-white/[0.04] bg-white/[0.025] px-3 py-1.5 text-[10px] uppercase tracking-wide text-stone-600">Past / Closed</span>
          </div>
        </div>
      </main>
      <StaffFooter />
    </div>
  )
}

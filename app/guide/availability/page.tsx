'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StaffFooter, StaffHeader } from '@/components/StaffChrome'
import { eachDayOfInterval, endOfMonth, format, getDay, isBefore, isSameDay, startOfDay, startOfMonth } from 'date-fns'

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
    const response = await fetch(`/api/guides/availability?mine=true&year=${currentMonth.getFullYear()}&month=${currentMonth.getMonth() + 1}`)
    if (!response.ok) return

    const data: AvailabilityDay[] = await response.json()
    setAvailableDates(new Set(data.map(day => day.date)))
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

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startDay = getDay(monthStart)
  const today = startOfDay(new Date())

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-5 text-center shadow-2xl shadow-black/30">
          <p className="heading-font text-2xl font-light text-white">Loading availability...</p>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-stone-500">Shine Tours</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#241d18_0,#11100e_34%,#050505_100%)] text-stone-100">
      <StaffHeader role="guide" active="availability" />

      <main className="mx-auto max-w-[1300px] px-4 py-5 md:px-8 md:py-7">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-100/60">Date-only availability</p>
            <h2 className="heading-font text-4xl font-light tracking-[-0.04em] text-white md:text-5xl">Mark Your Available Tour Dates</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-400">
              Select future museum-open dates when you are willing to give a tour. These dates appear as guidance on the public booking calendar.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">This Month</p>
            <p className="mt-1 text-sm font-semibold text-white">{availableDates.size} available date{availableDates.size === 1 ? '' : 's'}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#11100e] shadow-2xl shadow-black/30">
          <div className="flex h-[72px] items-center justify-between border-b border-white/10 bg-white/[0.045] px-4 md:px-8">
            <button
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
              className="rounded-full border border-white/10 bg-white/[0.04] p-2 transition-colors hover:bg-white/10"
            >
              <svg className="h-5 w-5 text-stone-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <h3 className="heading-font text-3xl font-light tracking-[-0.03em] text-white md:text-4xl">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <button
              onClick={() => changeMonth(1)}
              aria-label="Next month"
              className="rounded-full border border-white/10 bg-white/[0.04] p-2 transition-colors hover:bg-white/10"
            >
              <svg className="h-5 w-5 text-stone-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          <div className="p-3 md:p-6 lg:p-8">
            <div className="mb-2 grid grid-cols-7 gap-1 md:mb-4 md:gap-4">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                <div key={day} className="py-1 text-center text-[9px] font-bold uppercase tracking-[0.18em] text-stone-500 md:py-2 md:text-xs">
                  <span className="hidden md:inline">{day}</span>
                  <span className="md:hidden">{day.substring(0, 3)}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 md:gap-4">
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24 md:h-28"></div>
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
                    className={`relative flex h-24 flex-col items-start rounded-2xl border p-2 text-left transition-all md:h-28 ${
                      disabled
                        ? 'cursor-not-allowed border-white/[0.04] bg-white/[0.025] text-stone-700'
                        : isAvailable
                          ? 'border-emerald-200/70 bg-emerald-300/15 text-emerald-50 shadow-inner shadow-emerald-950/30 hover:bg-emerald-300/20'
                          : 'border-white/[0.13] bg-white/[0.075] text-stone-100 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.11]'
                    }`}
                  >
                    <span className="heading-font text-xl font-light leading-none md:text-2xl">{format(date, 'd')}</span>
                    {isToday && (
                      <span className="absolute right-1 top-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-white md:text-[9px]">Today</span>
                    )}
                    <div className="mt-auto w-full">
                      {isClosed ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-600">Closed</span>
                      ) : isPast ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-700">Past</span>
                      ) : isAvailable ? (
                        <span className="inline-flex rounded-full bg-emerald-300/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-100">Available</span>
                      ) : (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Tap to mark</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
              <span className="rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1.5 text-[10px] uppercase tracking-wide text-emerald-100/85">Available</span>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] uppercase tracking-wide text-stone-300">Unavailable</span>
              <span className="rounded-full border border-white/[0.04] bg-white/[0.025] px-3 py-1.5 text-[10px] uppercase tracking-wide text-stone-600">Past / Closed</span>
            </div>
          </div>
        </div>
      </main>
      <StaffFooter />
    </div>
  )
}

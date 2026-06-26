'use client'

import { useState, useEffect, useCallback, type CSSProperties } from 'react'
import dynamic from 'next/dynamic'
import Calendar from '@/components/Calendar'
import BookingForm from '@/components/BookingForm'
import { createClient } from '@/lib/supabase/client'

const GallerySplatViewer = dynamic(() => import('@/components/GallerySplatViewer'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-stone-200 animate-pulse" />
  ),
})

type ThemePreference = 'system' | 'light' | 'dark'
type ResolvedTheme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'light-truth-theme-preference'
const THEME_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

export default function Home() {
  const supabase = createClient()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [availableGuides, setAvailableGuides] = useState<any[]>([])
  const [selectedGuideIds, setSelectedGuideIds] = useState<string[]>([])
  const [bookingsData, setBookingsData] = useState<any[]>([])
  const [isLoadingGuides, setIsLoadingGuides] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const [staffUser, setStaffUser] = useState<{ is_admin: boolean } | null>(null)
  const [themePreference, setThemePreference] = useState<ThemePreference>('system')
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('dark')
  const [heroVisualReady, setHeroVisualReady] = useState(false)
  const [heroCopyReady, setHeroCopyReady] = useState(false)
  const [heroMenuReady, setHeroMenuReady] = useState(false)

  const resolvedTheme = themePreference === 'system' ? systemTheme : themePreference
  const isLightTheme = resolvedTheme === 'light'

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
    const syncSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? 'light' : 'dark')
    }

    syncSystemTheme()

    try {
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
      if (savedTheme === 'system' || savedTheme === 'light' || savedTheme === 'dark') {
        setThemePreference(savedTheme)
      }
    } catch {
      // Ignore storage failures and keep the system preference.
    }

    mediaQuery.addEventListener('change', syncSystemTheme)

    return () => {
      mediaQuery.removeEventListener('change', syncSystemTheme)
    }
  }, [])

  useEffect(() => {
    document.documentElement.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  const handleThemePreferenceChange = (nextTheme: ThemePreference) => {
    setThemePreference(nextTheme)

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    } catch {
      // The visible state should still update if storage is unavailable.
    }
  }

  const handleHeroVisualReady = useCallback(() => {
    setHeroVisualReady(true)
  }, [])

  useEffect(() => {
    if (!heroVisualReady) return

    const copyDelay = window.setTimeout(() => {
      setHeroCopyReady(true)
    }, 450)

    return () => {
      window.clearTimeout(copyDelay)
    }
  }, [heroVisualReady])

  useEffect(() => {
    if (!heroCopyReady) return

    const menuDelay = window.setTimeout(() => {
      setHeroMenuReady(true)
    }, 1400)

    return () => {
      window.clearTimeout(menuDelay)
    }
  }, [heroCopyReady])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    
    // On mobile, scroll to the booking form after selecting a date
    setTimeout(() => {
      const bookingForm = document.getElementById('booking-form')
      if (bookingForm && window.innerWidth < 768) { // 768px is the md breakpoint
        bookingForm.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  // Fetch available guides
  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const response = await fetch('/api/guides?public=true')
        if (response.ok) {
          const data = await response.json()
          setAvailableGuides(data)
        }
      } catch (error) {
        console.error('Error fetching guides:', error)
      } finally {
        setIsLoadingGuides(false)
      }
    }

    fetchGuides()
  }, [])

  useEffect(() => {
    const fetchStaffUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
          const { data: guide } = await supabase
            .from('guides')
            .select('is_admin')
            .eq('email', user.email)
            .eq('is_active', true)
            .single()

          if (guide) {
            setStaffUser({ is_admin: guide.is_admin })
            return
          }
        }

        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setStaffUser({ is_admin: !!data.user?.is_admin })
        }
      } catch (error) {
        console.error('Error checking staff user:', error)
      }
    }

    fetchStaffUser()
  }, [])

  // Fetch booking calendar data for the current month
  useEffect(() => {
    const fetchBookingsCalendar = async () => {
      try {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth() + 1
        
        const response = await fetch(`/api/bookings/calendar?year=${year}&month=${month}`)
        if (response.ok) {
          const data = await response.json()
          setBookingsData(data)
        }
      } catch (error) {
        console.error('Error fetching bookings calendar:', error)
      }
    }

    fetchBookingsCalendar()
  }, [])

  const handleBookingSuccess = () => {
    setShowSuccess(true)
    // Don't clear selectedDate yet - keep it selected so user can see updated count
    
    // Refresh bookings data immediately
    refreshBookingsData()
  }

  const refreshBookingsData = () => {
    const now = new Date()
    fetch(`/api/bookings/calendar?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
      .then(res => res.json())
      .then(data => setBookingsData(data))
      .catch(err => console.error('Error refreshing bookings:', err))
  }

  const handleCloseSuccessModal = () => {
    setShowSuccess(false)
    setSelectedDate(null) // Clear selection when closing modal
    refreshBookingsData() // Refresh one more time to be sure
  }

  const handleStaffLogin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        const { data: guide } = await supabase
          .from('guides')
          .select('is_admin')
          .eq('email', user.email)
          .eq('is_active', true)
          .single()

        if (guide) {
          window.location.href = guide.is_admin ? '/admin/dashboard' : '/guide/dashboard'
          return
        }
      }

      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        window.location.href = data.user?.is_admin ? '/admin/dashboard' : '/guide/dashboard'
        return
      }
    } catch (error) {
      console.error('Error checking staff session:', error)
    }

    window.location.href = '/login'
  }

  const handleGuideSelectionChange = (guideIds: string[]) => {
    setSelectedDate(null)
    setSelectedGuideIds(guideIds)
  }

  const selectedGuides = availableGuides.filter(guide => selectedGuideIds.includes(guide.id))
  const bookingFormGuides = selectedGuideIds.length > 0 ? selectedGuides : availableGuides
  const staffDashboardHref = staffUser?.is_admin ? '/admin/dashboard' : '/guide/dashboard'

  return (
    <div
      data-theme={resolvedTheme}
      className={`public-home min-h-screen transition-colors duration-300 ${
        isLightTheme
          ? 'bg-[radial-gradient(circle_at_top_left,#fff8ed_0,#efe4d5_38%,#faf7f0_100%)] text-stone-950'
          : 'bg-[radial-gradient(circle_at_top_left,#29211b_0,#15110d_38%,#0b0a09_100%)] text-stone-100'
      }`}
    >
      {/* Header + Hero */}
      <section className={`relative overflow-hidden ${isLightTheme ? 'min-h-[92vh] bg-[#faf7f0] md:min-h-[96vh]' : 'min-h-[98vh] bg-[#050505] md:min-h-[104vh]'}`}>
        <div className={`absolute inset-0 ${isLightTheme ? 'bg-[#faf7f0]' : 'bg-[#050505]'}`}>
          <GallerySplatViewer
            className={`${isLightTheme ? 'hero-viewer-fade-light' : 'hero-viewer-fade'} h-full w-full`}
            theme={resolvedTheme}
            onReady={handleHeroVisualReady}
          />
        </div>
        <div
          className={`pointer-events-none absolute inset-0 z-10 ${
            isLightTheme
              ? 'bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.32)_0%,rgba(255,255,255,0.13)_40%,rgba(250,247,240,0.08)_62%,rgba(250,247,240,0.26)_100%)]'
              : 'bg-[radial-gradient(circle_at_center,rgba(12,10,9,0.08)_0%,rgba(12,10,9,0.22)_54%,rgba(5,5,5,0.48)_100%)]'
          }`}
        />
        <div
          role="status"
          aria-live="polite"
          className={`pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-4 pt-24 transition-opacity duration-500 ${
            heroVisualReady ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="flex items-center justify-center rounded-full border border-white/20 bg-black/20 p-4 text-[#fffaf0] shadow-2xl shadow-black/20 backdrop-blur-md">
            <svg className="hero-loading-ring h-10 w-10" viewBox="0 0 36 36" aria-hidden="true">
              <circle className="text-white/20" cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle className="hero-loading-ring__stroke text-[#fffaf0]" cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
            </svg>
            <span className="sr-only">Loading gallery scene</span>
          </div>
        </div>

        <header className={`hero-menu absolute inset-x-0 top-4 z-40 px-4 md:top-6 md:px-8 ${heroMenuReady ? 'hero-menu-ready' : ''}`}>
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 rounded-full border border-white/15 bg-stone-950/25 px-4 py-3 shadow-2xl shadow-black/20 backdrop-blur-2xl md:px-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10">
                <svg className="w-5 h-5 text-white/90 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
              </div>
              <div className="min-w-0">
                <p className="heading-font text-xl md:text-[1.6rem] font-medium text-white leading-none tracking-[-0.03em]">Light & Truth</p>
                <p className="text-[9px] md:text-[10px] text-white/55 uppercase tracking-[0.24em] truncate">Yale Art Gallery</p>
              </div>
            </div>
            {staffUser ? (
              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/20 p-1 text-[10px] font-bold uppercase tracking-[0.12em] md:text-xs">
                <a href="/" className="rounded-full bg-white px-3 py-1.5 text-stone-950">Home</a>
                <a href={staffDashboardHref} className="rounded-full px-3 py-1.5 text-stone-300 transition-colors hover:bg-white/[0.08] hover:text-white">
                  Dashboard
                </a>
                <a href="/guide/availability" className="hidden rounded-full px-3 py-1.5 text-stone-300 transition-colors hover:bg-white/[0.08] hover:text-white sm:inline-flex">
                  Availability
                </a>
                {staffUser.is_admin && (
                  <a href="/admin/users" className="hidden rounded-full px-3 py-1.5 text-stone-300 transition-colors hover:bg-white/[0.08] hover:text-white md:inline-flex">
                    Users
                  </a>
                )}
                {!staffUser.is_admin && (
                  <a href="/guide/profile" className="hidden rounded-full px-3 py-1.5 text-stone-300 transition-colors hover:bg-white/[0.08] hover:text-white md:inline-flex">
                    Profile
                  </a>
                )}
              </div>
            ) : (
              <a href="https://www.paypal.com/paypalme/sethmcneely" target="_blank"
                className="px-3 md:px-4 py-2 text-white/90 hover:text-white bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/40 font-semibold text-xs md:text-sm rounded-full transition-all flex items-center gap-2 backdrop-blur-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
                Donate
              </a>
            )}
          </div>
        </header>

        <div
          className={`relative z-30 flex w-full items-center px-4 pb-28 pt-28 md:px-8 md:pb-32 md:pt-32 ${
            isLightTheme ? 'min-h-[92vh] md:min-h-[96vh]' : 'min-h-[98vh] md:min-h-[104vh]'
          }`}
        >
          
          {/* Success Modal */}
          {showSuccess && (
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
              <div className="my-8 w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#11100e] shadow-2xl shadow-black/50 animate-in">
                <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top,#1f2c22_0,#11100e_64%)] p-6 text-center md:p-8">
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200/25 bg-emerald-300/10 shadow-lg md:h-20 md:w-20">
                    <svg className="h-10 w-10 text-emerald-100 md:h-12 md:w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-100/60">Tour Request</p>
                  <h2 className="heading-font text-4xl font-light tracking-[-0.04em] text-white md:text-5xl">
                    Request Received!
                  </h2>
                  <p className="mt-2 text-sm text-stone-400">
                    Thank you for your tour request
                  </p>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-6 md:max-h-none md:p-8">
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-300/15 text-xs font-bold text-blue-100">
                          1
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white md:text-base">Email Confirmation</h3>
                          <p className="mt-1 text-xs leading-relaxed text-stone-400 md:text-sm">
                            You'll receive an email confirmation shortly with your tour request details.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-300/15 text-xs font-bold text-amber-100">
                          2
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white md:text-base">Yale Review Process</h3>
                          <p className="mt-1 text-xs leading-relaxed text-stone-400 md:text-sm">
                            We will submit your group's tour request to Yale University Art Gallery for approval.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-300/15 text-xs font-bold text-emerald-100">
                          3
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white md:text-base">Time Confirmation</h3>
                          <p className="mt-1 text-xs leading-relaxed text-stone-400 md:text-sm">
                            Once Yale agrees to a time slot (between 11am-3pm), we'll send you a confirmation email with the exact time and meeting details.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-amber-200/15 border-l-4 border-l-amber-300/80 bg-amber-300/10 p-4">
                    <div className="flex items-start gap-3">
                      <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                      <div>
                        <p className="mb-1 text-sm font-bold text-amber-50">Important</p>
                        <p className="text-xs leading-relaxed text-amber-50/80 md:text-sm">
                          Your tour is <strong className="text-amber-50">not confirmed</strong> until you receive our confirmation email with the approved time from Yale.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCloseSuccessModal}
                    className="mt-5 w-full rounded-2xl bg-white px-6 py-4 text-sm font-bold text-stone-950 shadow-xl transition-all hover:-translate-y-0.5 hover:bg-stone-100 md:text-base"
                  >
                    Got it, thanks!
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Hero overlay content */}
          <div className="relative w-full max-w-[1400px] mx-auto text-center">
            <div
              className={`pointer-events-none absolute left-1/2 top-1/2 h-[32rem] w-[58rem] max-w-[95vw] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl ${
                isLightTheme
                  ? 'bg-[radial-gradient(circle,rgba(0,0,0,0.42)_0%,rgba(31,24,17,0.24)_46%,rgba(0,0,0,0)_76%)]'
                  : 'bg-[radial-gradient(circle,rgba(0,0,0,0.66)_0%,rgba(31,24,17,0.38)_42%,rgba(0,0,0,0)_72%)]'
              }`}
            />
            <div
              className={`hero-copy relative mx-auto max-w-5xl rounded-[2rem] px-4 py-6 md:px-10 md:py-8 ${heroCopyReady ? 'hero-copy-ready' : ''} ${
                isLightTheme ? 'text-[#fffaf0]' : ''
              }`}
            >
              <p
                className={`hero-reveal mb-5 text-[10px] font-bold uppercase tracking-[0.36em] md:text-xs ${isLightTheme ? 'text-[#fffaf0]/70' : 'text-white/55'}`}
                style={{ '--hero-delay': '120ms' } as CSSProperties}
              >
                Yale University Art Gallery Tours
              </p>

              <h1
                className={`hero-reveal heading-font mx-auto max-w-5xl text-5xl font-medium drop-shadow-sm sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[0.92] tracking-[-0.035em] ${isLightTheme ? 'text-[#fffaf0]' : 'text-white'}`}
                style={{ '--hero-delay': '240ms' } as CSSProperties}
              >
                Art, History, and<br className="hidden sm:block" /> the World of the Bible
              </h1>

              <div className="mx-auto mt-8 flex max-w-3xl items-center gap-4 md:mt-10">
                <div className="hero-rule h-px flex-1 bg-white/25" style={{ '--hero-delay': '520ms' } as CSSProperties} />
                <p
                  className={`hero-reveal heading-font max-w-2xl text-2xl font-normal italic leading-snug sm:text-3xl md:text-4xl tracking-[-0.01em] ${isLightTheme ? 'text-[#fffaf0]/95' : 'text-white/95'}`}
                  style={{ '--hero-delay': '420ms' } as CSSProperties}
                >
                  “And those having insight will shine”
                </p>
                <div className="hero-rule h-px flex-1 bg-white/25" style={{ '--hero-delay': '520ms' } as CSSProperties} />
              </div>
              <p
                className={`hero-reveal mt-3 text-xs font-semibold uppercase tracking-[0.24em] md:text-sm ${isLightTheme ? 'text-[#fffaf0]/60' : 'text-white/45'}`}
                style={{ '--hero-delay': '560ms' } as CSSProperties}
              >
                Daniel 12:3
              </p>

              <div
                className={`hero-reveal mx-auto mt-7 max-w-2xl text-sm leading-7 md:mt-8 md:text-base ${isLightTheme ? 'text-[#fffaf0]/80' : 'text-white/65'}`}
                style={{ '--hero-delay': '700ms' } as CSSProperties}
              >
                A guided look at how art, archaeology, and the ancient world illuminate the Scriptures.
              </div>

              <button
                onClick={() => {
                  document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="hero-reveal group mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-stone-950 shadow-xl transition-all hover:-translate-y-0.5 hover:bg-stone-100 hover:shadow-2xl md:mt-10 md:px-9 md:py-4 md:text-base"
                style={{ '--hero-delay': '840ms' } as CSSProperties}
              >
                Book a Tour
                <svg className="w-4 h-4 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div
          className={`pointer-events-none absolute inset-x-0 z-20 ${
            isLightTheme
              ? 'bottom-0 h-[30vh] bg-[linear-gradient(to_bottom,rgba(250,247,240,0)_0%,rgba(250,247,240,0.12)_34%,rgba(250,247,240,0.56)_76%,#faf7f0_100%)]'
              : '-bottom-[6vh] h-[15vh] bg-[linear-gradient(to_bottom,rgba(5,5,5,0)_0%,rgba(5,5,5,0.2)_32%,rgba(5,5,5,0.62)_70%,#050505_100%)]'
          }`}
        />
      </section>

      <div
        className={`relative overflow-hidden px-4 transition-colors duration-300 md:px-8 ${
          isLightTheme ? 'mt-0 bg-[#faf7f0] pt-16 pb-12 md:pt-24 md:pb-20' : 'mt-0 bg-[#050505] pt-16 pb-12 md:pt-24 md:pb-20'
        }`}
      >
        <div className="pointer-events-none absolute left-[-12%] top-48 h-80 w-80 rounded-full bg-amber-200/5 blur-3xl" />
        <div className="pointer-events-none absolute right-[-10%] top-[34rem] h-96 w-96 rounded-full bg-emerald-300/5 blur-3xl" />
        <div className="relative mx-auto w-full max-w-[1400px]">
          {/* Booking Section */}
          <div className="mx-auto mb-4 max-w-[1400px] md:mb-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className={`mb-1.5 inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] ${
                  isLightTheme
                    ? 'border-amber-300/40 bg-amber-100/50 text-amber-800'
                    : 'border-amber-200/15 bg-amber-200/5 text-amber-100/70'
                }`}>
                  Step 1
                </p>
                <h2 className={`heading-font text-4xl font-light leading-none tracking-[-0.04em] md:text-[2.5rem] ${
                  isLightTheme ? 'text-stone-900' : 'text-white'
                }`}>
                  Choose a Date
                </h2>
                <p className={`mt-1.5 max-w-2xl text-sm leading-5 ${
                  isLightTheme ? 'text-stone-600' : 'text-stone-400'
                }`}>
                  Select an available museum day, then share your party details so we can submit the request to Yale.
                </p>
              </div>
              <div className={`hidden rounded-2xl border px-4 py-2.5 text-right md:block ${
                isLightTheme
                  ? 'border-stone-200 bg-white/[0.5]'
                  : 'border-white/10 bg-white/[0.04]'
              }`}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">Museum Days</p>
                <p className={`mt-1 text-sm font-medium ${
                  isLightTheme ? 'text-stone-800' : 'text-stone-200'
                }`}>Tuesday through Sunday</p>
              </div>
            </div>
          </div>
          <div id="booking-section" className="mx-auto grid max-w-[1400px] scroll-mt-20 grid-cols-1 gap-5 md:grid-cols-5 md:items-start md:gap-5">
            {/* Calendar - Takes 3 columns on desktop, full width on mobile */}
            <div className="md:col-span-3">
              <Calendar 
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                bookingsData={bookingsData}
                theme={resolvedTheme}
                selectedGuideIds={selectedGuideIds}
                selectedGuides={selectedGuides}
                availableGuides={availableGuides}
                isLoadingGuides={isLoadingGuides}
                onGuideSelectionChange={handleGuideSelectionChange}
                showGuideAvailability
              />
            </div>

            {/* Booking Form - Takes 2 columns on desktop, full width on mobile */}
            <div id="booking-form" className="md:sticky md:top-8 md:col-span-2">
              {selectedDate ? (
                <BookingForm 
                  selectedDate={selectedDate}
                  availableGuides={bookingFormGuides}
                  theme={resolvedTheme}
                  defaultPreferredGuideId={selectedGuideIds.length === 1 ? selectedGuideIds[0] : undefined}
                  onSuccess={handleBookingSuccess}
                />
              ) : (
                <div className={`flex h-full min-h-[220px] items-center justify-center rounded-3xl border p-6 shadow-2xl backdrop-blur-sm md:min-h-[240px] md:p-7 ${
                  isLightTheme
                    ? 'border-stone-200/80 bg-white/[0.82] shadow-stone-300/30'
                    : 'border-white/10 bg-white/[0.055] shadow-black/20'
                }`}>
                  <div className="text-center max-w-sm">
                    <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full border ${
                      isLightTheme
                        ? 'border-stone-200 bg-stone-100 text-stone-600'
                        : 'border-white/10 bg-white/10 text-stone-300'
                    }`}>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                    </div>
                    <h3 className={`heading-font mb-1.5 text-2xl font-light tracking-[-0.03em] md:text-3xl ${
                      isLightTheme ? 'text-stone-900' : 'text-white'
                    }`}>Select a Date</h3>
                    <p className={`text-sm leading-5 ${
                      isLightTheme ? 'text-stone-600' : 'text-stone-400'
                    }`}>
                      Pick an available day from the calendar to open the tour request form.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Visitor Information Section */}
          <div id="visitor-info" className="mt-14 md:mt-20 max-w-[1400px] mx-auto scroll-mt-24">
            <div className={`border rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm ${
              isLightTheme
                ? 'bg-white/[0.72] border-stone-200/80 shadow-stone-300/20'
                : 'bg-white/[0.06] border-white/10 shadow-black/20'
            }`}>
              {/* Header */}
              <div className={`p-6 md:p-8 border-b ${
                isLightTheme
                  ? 'border-stone-200/80 bg-stone-50/50'
                  : 'border-white/10 bg-white/[0.04]'
              }`}>
                <p className={`text-[10px] font-bold uppercase tracking-[0.24em] mb-1.5 ${
                  isLightTheme ? 'text-amber-800' : 'text-amber-100/60'
                }`}>
                  Plan Your Visit
                </p>
                <h2 className={`heading-font text-3xl md:text-4xl font-light mb-1 ${
                  isLightTheme ? 'text-stone-900' : 'text-white'
                }`}>
                  Visitor Information
                </h2>
                <p className={`text-sm md:text-base ${
                  isLightTheme ? 'text-stone-500' : 'text-stone-400'
                }`}>Everything you need to know for your tour</p>
              </div>

              <div className="p-6 md:p-8">
                {/* How Tour Requests Work */}
                <div className={`mb-6 md:mb-8 border p-5 rounded-xl shadow-sm ${
                  isLightTheme
                    ? 'bg-sky-50/80 border-sky-100/90'
                    : 'bg-[#0f1b2d]/45 border-sky-500/10'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isLightTheme ? 'bg-sky-100/90 text-sky-800' : 'bg-sky-400/10 text-sky-300'
                    }`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className={`heading-font text-lg font-medium mb-1.5 ${isLightTheme ? 'text-sky-950' : 'text-sky-100'}`}>How Tour Requests Work</h3>
                      <p className={`text-sm leading-relaxed ${isLightTheme ? 'text-sky-900/90' : 'text-sky-100/75'}`}>
                        When you submit a tour request, you'll be grouped with other visitors requesting the same date (groups of 10-15 people). 
                        We then submit your tour request to Yale University Art Gallery for approval. Once Yale assigns a time slot, 
                        you'll receive a confirmation email with all the details.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Location & Parking */}
                  <div className={`border rounded-xl p-6 md:p-7 shadow-sm transition-colors duration-200 ${
                    isLightTheme
                      ? 'bg-white/[0.6] border-stone-200/60 hover:bg-white/[0.85] hover:border-stone-300/80 hover:shadow-md'
                      : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/15 hover:shadow-md'
                  }`}>
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        isLightTheme ? 'bg-stone-100 text-stone-600' : 'bg-white/10 text-stone-200'
                      }`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                      </div>
                      <h3 className={`heading-font text-xl font-light ${
                        isLightTheme ? 'text-stone-900' : 'text-stone-100'
                      }`}>Location & Parking</h3>
                    </div>
                    <div className="space-y-4 text-sm">
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">Museum Address</h4>
                        <p className={`font-semibold ${isLightTheme ? 'text-stone-900' : 'text-white'}`}>Yale University Art Gallery</p>
                        <p className={isLightTheme ? 'text-stone-600' : 'text-stone-400'}>1111 Chapel St, New Haven, CT</p>
                      </div>
                      <div className="pt-3 border-t border-stone-100 dark:border-white/[0.06]">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">Recommended Parking</h4>
                        <p className={`font-semibold ${isLightTheme ? 'text-stone-900' : 'text-white'}`}>Chapel-York Garage</p>
                        <p className={isLightTheme ? 'text-stone-600' : 'text-stone-400'}>150 York St, New Haven, CT</p>
                      </div>
                    </div>
                  </div>

                  {/* Museum & Attractions */}
                  <div className={`border rounded-xl p-6 md:p-7 shadow-sm transition-colors duration-200 ${
                    isLightTheme
                      ? 'bg-amber-50/40 border-amber-200/60 hover:bg-amber-50/70 hover:border-amber-300 hover:shadow-md'
                      : 'bg-amber-950/[0.12] border-amber-500/[0.12] hover:bg-amber-950/[0.18] hover:border-amber-500/25 hover:shadow-md'
                  }`}>
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        isLightTheme ? 'bg-amber-100 text-amber-800' : 'bg-amber-200/15 text-amber-100'
                      }`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                        </svg>
                      </div>
                      <h3 className={`heading-font text-xl font-light ${
                        isLightTheme ? 'text-amber-900' : 'text-amber-100'
                      }`}>Museum & Attractions</h3>
                    </div>
                    <div className="space-y-4">
                      <p className={`text-sm leading-relaxed ${
                        isLightTheme ? 'text-stone-700' : 'text-amber-50/70'
                      }`}>
                        Explore world-class collections spanning centuries of artistic achievement. New Haven offers 
                        excellent dining and cultural attractions within walking distance.
                      </p>
                      <div className="pt-2">
                        <a 
                          href="https://artgallery.yale.edu" 
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-2 text-sm font-semibold group transition-all ${
                            isLightTheme ? 'text-amber-800 hover:text-amber-950' : 'text-amber-100 hover:text-white'
                          }`}
                        >
                          <span>Visit Gallery Website</span>
                          <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Tour Details */}
                  <div className={`border rounded-xl p-6 md:p-7 shadow-sm transition-colors duration-200 ${
                    isLightTheme
                      ? 'bg-white/[0.6] border-stone-200/60 hover:bg-white/[0.85] hover:border-stone-300/80 hover:shadow-md'
                      : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/15 hover:shadow-md'
                  }`}>
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        isLightTheme ? 'bg-stone-100 text-stone-600' : 'bg-white/10 text-stone-200'
                      }`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <h3 className={`heading-font text-xl font-light ${
                        isLightTheme ? 'text-stone-900' : 'text-stone-100'
                      }`}>Tour Details</h3>
                    </div>
                    <div className="space-y-3.5 text-sm">
                      <div className={`flex justify-between gap-4 border-b pb-2.5 ${
                        isLightTheme ? 'border-stone-100' : 'border-white/[0.06]'
                      }`}>
                        <span className="font-semibold uppercase tracking-wider text-[10px] text-stone-400 dark:text-stone-500">Duration</span>
                        <span className={`font-semibold ${isLightTheme ? 'text-stone-900' : 'text-white'}`}>1.5 hours</span>
                      </div>
                      <div className={`flex justify-between gap-4 border-b pb-2.5 ${
                        isLightTheme ? 'border-stone-100' : 'border-white/[0.06]'
                      }`}>
                        <span className="font-semibold uppercase tracking-wider text-[10px] text-stone-400 dark:text-stone-500">Group Size</span>
                        <span className={`font-semibold ${isLightTheme ? 'text-stone-900' : 'text-white'}`}>Maximum 15 people</span>
                      </div>
                      <div className={`flex justify-between gap-4 border-b pb-2.5 ${
                        isLightTheme ? 'border-stone-100' : 'border-white/[0.06]'
                      }`}>
                        <span className="font-semibold uppercase tracking-wider text-[10px] text-stone-400 dark:text-stone-500">Availability</span>
                        <span className={`font-semibold ${isLightTheme ? 'text-stone-900' : 'text-white'}`}>Museum open Tue-Sun</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="font-semibold uppercase tracking-wider text-[10px] text-stone-400 dark:text-stone-500">Approval</span>
                        <span className={`font-semibold ${isLightTheme ? 'text-stone-900' : 'text-white'}`}>By Yale University</span>
                      </div>
                    </div>
                  </div>

                  {/* Visitor Guidelines */}
                  <div className={`border rounded-xl p-6 md:p-7 shadow-sm transition-colors duration-200 ${
                    isLightTheme
                      ? 'bg-white/[0.6] border-stone-200/60 hover:bg-white/[0.85] hover:border-stone-300/80 hover:shadow-md'
                      : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/15 hover:shadow-md'
                  }`}>
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        isLightTheme ? 'bg-stone-100 text-stone-600' : 'bg-white/10 text-stone-200'
                      }`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <h3 className={`heading-font text-xl font-light ${
                        isLightTheme ? 'text-stone-800' : 'text-stone-100'
                      }`}>Visitor Guidelines</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mt-0.5">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className={`font-semibold leading-tight ${isLightTheme ? 'text-stone-800' : 'text-stone-200'}`}>FREE admission</p>
                          <p className={`text-[11px] mt-0.5 leading-tight ${isLightTheme ? 'text-stone-500' : 'text-stone-400'}`}>No tickets or reservations required</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mt-0.5">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className={`font-semibold leading-tight ${isLightTheme ? 'text-stone-800' : 'text-stone-200'}`}>Wheelchair accessible</p>
                          <p className={`text-[11px] mt-0.5 leading-tight ${isLightTheme ? 'text-stone-500' : 'text-stone-400'}`}>Full access via Chapel St elevator</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mt-0.5">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className={`font-semibold leading-tight ${isLightTheme ? 'text-stone-800' : 'text-stone-200'}`}>Casual dress</p>
                          <p className={`text-[11px] mt-0.5 leading-tight ${isLightTheme ? 'text-stone-500' : 'text-stone-400'}`}>Comfortable walking shoes recommended</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 mt-0.5">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <div>
                          <p className={`font-semibold leading-tight ${isLightTheme ? 'text-stone-800' : 'text-stone-200'}`}>No large bags</p>
                          <p className={`text-[11px] mt-0.5 leading-tight ${isLightTheme ? 'text-stone-500' : 'text-stone-400'}`}>Backpacks & bags &gt; 11" x 15" must be checked</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 mt-0.5">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <div>
                          <p className={`font-semibold leading-tight ${isLightTheme ? 'text-stone-800' : 'text-stone-200'}`}>No food/drink</p>
                          <p className={`text-[11px] mt-0.5 leading-tight ${isLightTheme ? 'text-stone-500' : 'text-stone-400'}`}>Not permitted in gallery spaces</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 mt-0.5">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <div>
                          <p className={`font-semibold leading-tight ${isLightTheme ? 'text-stone-800' : 'text-stone-200'}`}>Don't touch art</p>
                          <p className={`text-[11px] mt-0.5 leading-tight ${isLightTheme ? 'text-stone-500' : 'text-stone-400'}`}>Please maintain a safe 3-foot distance</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links for Staff */}
          <div className="mt-12 md:mt-16 text-center">
            <p className="text-xs text-stone-500 mb-4">Staff Access:</p>
            <button
              type="button"
              onClick={handleStaffLogin}
              className={`inline-block px-8 py-3 text-sm font-semibold rounded-full border transition-all shadow-md hover:shadow-lg ${
                isLightTheme
                  ? 'bg-stone-900 text-[#faf7f0] border-stone-900 hover:bg-stone-800'
                  : 'bg-white/10 text-white border-white/10 hover:bg-white/15'
              }`}
            >
              Staff Login →
            </button>
            <p className={`text-xs mt-3 ${
              isLightTheme ? 'text-stone-500' : 'text-stone-400'
            }`}>Admins and guides login here</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={`mt-10 border-t transition-colors duration-300 md:mt-12 ${isLightTheme ? 'border-stone-900/10 bg-white/65' : 'border-white/10 bg-black/20'}`}>
        <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-8">
          <div className="flex flex-col items-center justify-between gap-5 text-center md:flex-row md:text-left">
            <p className={`text-sm ${isLightTheme ? 'text-stone-600' : 'text-stone-500'}`}>© 2025 Light & Truth. All rights reserved.</p>
            <div className="flex flex-col items-center gap-2 md:items-end">
              <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${isLightTheme ? 'text-stone-500' : 'text-stone-500'}`}>
                Theme
              </p>
              <div
                role="group"
                aria-label="Theme preference"
                className={`flex rounded-full border p-1 text-[11px] font-bold uppercase tracking-[0.12em] shadow-sm backdrop-blur-sm ${
                  isLightTheme ? 'border-stone-900/10 bg-white/75 text-stone-600' : 'border-white/10 bg-black/20 text-stone-300'
                }`}
              >
                {THEME_OPTIONS.map((option) => {
                  const isActive = themePreference === option.value

                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => handleThemePreferenceChange(option.value)}
                      className={`rounded-full px-3 py-1.5 transition-colors ${
                        isActive
                          ? isLightTheme
                            ? 'bg-stone-950 text-[#faf7f0] shadow-sm'
                            : 'bg-white text-stone-950 shadow-sm'
                          : isLightTheme
                            ? 'hover:bg-stone-950/[0.06] hover:text-stone-950'
                            : 'hover:bg-white/[0.08] hover:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
              <p className={`text-xs ${isLightTheme ? 'text-stone-500' : 'text-stone-500'}`}>
                {themePreference === 'system' ? `Following system: ${resolvedTheme}` : `Using ${resolvedTheme} mode`}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

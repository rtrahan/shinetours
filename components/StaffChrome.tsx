'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type StaffRole = 'admin' | 'guide'
type StaffNavItem = 'home' | 'dashboard' | 'availability' | 'users' | 'profile'

interface StaffHeaderProps {
  role: StaffRole
  active: StaffNavItem
}

const navClass = (isActive: boolean) =>
  isActive
    ? 'rounded-full bg-white px-3 py-1.5 text-stone-950'
    : 'rounded-full px-3 py-1.5 text-stone-300 transition-colors hover:bg-white/[0.08] hover:text-white'

export function StaffHeader({ role, active }: StaffHeaderProps) {
  const dashboardHref = role === 'admin' ? '/admin/dashboard' : '/guide/dashboard'

  return (
    <div className="sticky top-0 z-40 px-4 py-4 md:px-8">
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3 rounded-full border border-white/15 bg-stone-950/35 px-4 py-3 shadow-2xl shadow-black/25 backdrop-blur-2xl md:px-5">
        <a href={dashboardHref} className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10">
            <svg className="h-5 w-5 text-white/90" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="heading-font text-xl font-medium leading-none tracking-[-0.03em] text-white md:text-[1.6rem]">
              Light & Truth
            </p>
            <p className="truncate text-[9px] uppercase tracking-[0.24em] text-white/55 md:text-[10px]">
              Yale Art Gallery
            </p>
          </div>
        </a>

        <nav className="flex items-center gap-1 rounded-full border border-white/10 bg-black/20 p-1 text-[10px] font-bold uppercase tracking-[0.12em] md:text-xs md:tracking-[0.14em]">
          <a href="/" className={navClass(active === 'home')}>Home</a>
          <a href={dashboardHref} className={navClass(active === 'dashboard')}>Dashboard</a>
          <a href="/guide/availability" className={navClass(active === 'availability')}>Availability</a>
          {role === 'admin' ? (
            <a href="/admin/users" className={navClass(active === 'users')}>Users</a>
          ) : (
            <a href="/guide/profile" className={navClass(active === 'profile')}>Profile</a>
          )}
        </nav>
      </div>
    </div>
  )
}

export function StaffFooter() {
  const router = useRouter()
  const supabase = createClient()

  return (
    <footer className="border-t border-white/10 bg-black/20">
      <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-3 px-4 py-5 text-xs text-stone-500 md:px-8">
        <span>Light & Truth staff area</span>
        <button
          onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-stone-300 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          Logout
        </button>
      </div>
    </footer>
  )
}

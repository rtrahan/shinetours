import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface AvailabilityRow {
  available_date: string
  guide: {
    id: string
    first_name: string
    last_name: string
    is_active?: boolean
    public_visible?: boolean
  } | null
}

const getMonthRange = (year: string | null, month: string | null) => {
  if (!year || !month) return null

  const monthNumber = Number(month)
  const yearNumber = Number(year)

  if (!Number.isInteger(monthNumber) || !Number.isInteger(yearNumber) || monthNumber < 1 || monthNumber > 12) {
    return null
  }

  const startDate = `${yearNumber}-${String(monthNumber).padStart(2, '0')}-01`
  const lastDay = new Date(yearNumber, monthNumber, 0).getDate()
  const endDate = `${yearNumber}-${String(monthNumber).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  return { startDate, endDate }
}

const getGuideForUser = async (supabase: Awaited<ReturnType<typeof createClient>>) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null

  const { data: guide } = await supabase
    .from('guides')
    .select('id, first_name, last_name, email')
    .eq('email', user.email)
    .single()

  return guide
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const range = getMonthRange(searchParams.get('year'), searchParams.get('month'))
    const mine = searchParams.get('mine') === 'true'
    const guideIds = searchParams.get('guideIds')?.split(',').filter(Boolean) || []

    if (!range) {
      return NextResponse.json({ error: 'Valid year and month required' }, { status: 400 })
    }

    let guideIdFilter = guideIds

    if (mine) {
      const guide = await getGuideForUser(supabase)
      if (!guide) {
        return NextResponse.json({ error: 'Guide not found' }, { status: 404 })
      }
      guideIdFilter = [guide.id]
    }

    let query = supabase
      .from('guide_availability')
      .select(`
        available_date,
        guide:guides!inner (
          id,
          first_name,
          last_name,
          is_active,
          public_visible
        )
      `)
      .gte('available_date', range.startDate)
      .lte('available_date', range.endDate)

    if (guideIdFilter.length > 0) {
      query = query.in('guide_id', guideIdFilter)
    }

    const { data, error } = await query.order('available_date')

    if (error) {
      if (error.code === '42P01' || error.message?.includes('guide_availability')) {
        return NextResponse.json([])
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const dateMap = new Map<string, { date: string; guides: Array<{ id: string; first_name: string; last_name: string }> }>()

    ;((data || []) as unknown as AvailabilityRow[]).forEach(row => {
      if (!row.guide) return
      if (!mine && (!row.guide.is_active || row.guide.public_visible === false)) return

      if (!dateMap.has(row.available_date)) {
        dateMap.set(row.available_date, { date: row.available_date, guides: [] })
      }

      dateMap.get(row.available_date)?.guides.push({
        id: row.guide.id,
        first_name: row.guide.first_name,
        last_name: row.guide.last_name
      })
    })

    return NextResponse.json(Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date)))
  } catch (error) {
    console.error('Error fetching guide availability:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const guide = await getGuideForUser(supabase)

    if (!guide) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 })
    }

    const body = await request.json()
    const { date, available } = body

    if (!date || typeof available !== 'boolean') {
      return NextResponse.json({ error: 'date and available are required' }, { status: 400 })
    }

    if (available) {
      const { error } = await supabase
        .from('guide_availability')
        .upsert(
          { guide_id: guide.id, available_date: date },
          { onConflict: 'guide_id,available_date' }
        )

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      const { error } = await supabase
        .from('guide_availability')
        .delete()
        .eq('guide_id', guide.id)
        .eq('available_date', date)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating guide availability:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    if (!year || !month) {
      return NextResponse.json({ error: 'Year and month required' }, { status: 400 })
    }

    // Get all booking requests for the month (including ungrouped)
    const startDate = `${year}-${month.padStart(2, '0')}-01`
    
    // Calculate the last day of the month (handles 28, 29, 30, or 31 days)
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
    const endDate = `${year}-${month.padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const { data: bookings, error } = await supabase
      .from('booking_requests')
      .select('id, requested_date, group_size')
      .gte('requested_date', startDate)
      .lte('requested_date', endDate)

    if (error) {
      console.error('Calendar API error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by date and count requests
    const dateMap: Record<string, any> = {}
    
    bookings?.forEach((booking: any) => {
      const date = booking.requested_date
      
      if (!dateMap[date]) {
        dateMap[date] = {
          date,
          totalPeople: 0,
          requestCount: 0
        }
      }
      
      dateMap[date].totalPeople += booking.group_size
      dateMap[date].requestCount += 1
    })

    const result = Object.values(dateMap).map((d: any) => ({
      date: d.date,
      totalPeople: d.totalPeople,
      requestCount: d.requestCount
    }))

    return NextResponse.json(result.sort((a, b) => a.date.localeCompare(b.date)))

  } catch (error) {
    console.error('Error fetching calendar bookings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


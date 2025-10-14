import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get all ungrouped booking requests, grouped by date
    const { data: ungrouped, error } = await supabase
      .from('booking_requests')
      .select(`
        id,
        requested_date,
        group_size,
        contact_name,
        contact_email,
        contact_phone,
        preferred_guide:guides(id, first_name, last_name),
        created_at
      `)
      .is('tour_group_id', null)
      .gte('requested_date', new Date().toISOString().split('T')[0]) // Future dates only
      .order('requested_date')
      .order('created_at')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by date
    const byDate: Record<string, any> = {}
    ungrouped?.forEach((req: any) => {
      const date = req.requested_date
      if (!byDate[date]) {
        byDate[date] = {
          requested_date: date,
          booking_requests: [],
          totalPeople: 0,
          requestCount: 0
        }
      }
      byDate[date].booking_requests.push(req)
      byDate[date].totalPeople += req.group_size
      byDate[date].requestCount += 1
    })

    const result = Object.values(byDate)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error fetching ungrouped requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


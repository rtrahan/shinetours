import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'Date required' }, { status: 400 })
    }

    // Get all tour groups for this date with their bookings and guides
    const { data: tourGroups } = await supabase
      .from('tour_groups')
      .select(`
        id,
        status,
        guide:guides (
          id,
          first_name,
          last_name
        ),
        booking_requests (
          id,
          group_size,
          contact_name
        )
      `)
      .eq('requested_date', date)
      .order('created_at')

    // Build the response with groups
    const groups = []
    let currentFormingGroup = null
    let totalPeople = 0
    let currentGroupPeople = 0

    if (tourGroups) {
      for (const group of tourGroups) {
        const groupTotal = group.booking_requests?.reduce((sum, b) => sum + b.group_size, 0) || 0
        totalPeople += groupTotal

        // Show first group with < 15 people as "Current Group (Not Yet Confirmed)"
        if (groupTotal < 15 && !currentFormingGroup && group.status !== 'Confirmed' && group.status !== 'Completed') {
          currentFormingGroup = {
            participants: group.booking_requests?.map(b => ({
              name: b.contact_name,
              groupSize: b.group_size
            })) || [],
            totalPeople: groupTotal
          }
          currentGroupPeople = groupTotal
        } else if (groupTotal > 0) {
          // Show ALL other groups (whether 15, 11, or any size)
          groups.push({
            id: group.id,
            status: group.status,
            guideName: group.guide ? `${group.guide.first_name} ${group.guide.last_name}` : null,
            participants: group.booking_requests?.map(b => ({
              name: b.contact_name,
              groupSize: b.group_size
            })) || [],
            totalPeople: groupTotal
          })
        }
      }
    }

    const spotsLeft = 15 - currentGroupPeople

    // Count total requests (including ungrouped)
    const { data: allRequests } = await supabase
      .from('booking_requests')
      .select('id')
      .eq('requested_date', date)
    
    const requestCount = allRequests?.length || 0

    return NextResponse.json({
      date,
      totalPeople,
      currentGroupPeople,
      spotsLeft: Math.max(0, spotsLeft),
      requestCount,
      currentFormingGroup,
      confirmedGroups: groups,
      groupsCount: groups.length
    })

  } catch (error) {
    console.error('Error fetching date details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

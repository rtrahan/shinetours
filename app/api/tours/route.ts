import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get all tour groups with related data
    const { data: tourGroups, error } = await supabase
      .from('tour_groups')
      .select(`
        *,
        guide:guides(id, first_name, last_name, email, phone),
        booking_requests(
          id,
          contact_name,
          contact_email,
          contact_phone,
          group_size,
          preferred_guide:guides(id, first_name, last_name)
        )
      `)
      .order('requested_date')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(tourGroups)

  } catch (error) {
    console.error('Error fetching tours:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { requested_date, guide_id } = body

    if (!requested_date) {
      return NextResponse.json({ error: 'Date required' }, { status: 400 })
    }

    // Create tour group
    const { data: tourGroup, error: tourError } = await supabase
      .from('tour_groups')
      .insert({
        requested_date,
        status: 'Ready',
        guide_id: guide_id || null
      })
      .select()
      .single()

    if (tourError) {
      return NextResponse.json({ error: tourError.message }, { status: 500 })
    }

    // Assign ungrouped bookings to this tour
    const { error: updateError } = await supabase
      .from('booking_requests')
      .update({ tour_group_id: tourGroup.id })
      .eq('requested_date', requested_date)
      .is('tour_group_id', null)

    if (updateError) {
      console.error('Error assigning bookings:', updateError)
    }

    return NextResponse.json({ 
      success: true,
      tourGroup 
    })

  } catch (error) {
    console.error('Error creating tour:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


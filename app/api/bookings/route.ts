import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { requested_date, group_size, contact_name, contact_email, contact_phone, preferred_guide_id } = body

    // Validate input
    if (!requested_date || !group_size || !contact_name || !contact_email || !contact_phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (group_size < 1 || group_size > 15) {
      return NextResponse.json({ error: 'Group size must be between 1 and 15' }, { status: 400 })
    }

    // No more group size validation - allow any request
    // Requests will be grouped intelligently later by admins or auto-grouping

    // Create the booking request WITHOUT a tour_group_id (ungrouped)
    // Admins will group these later, or they'll be auto-grouped
    const { data: newBooking, error: insertError } = await supabase
      .from('booking_requests')
      .insert({
        requested_date,
        group_size,
        contact_name,
        contact_email,
        contact_phone,
        preferred_guide_id: preferred_guide_id || null,
        tour_group_id: null  // Leave ungrouped initially
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Send confirmation email (don't wait for it - fire and forget)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/emails/booking-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: contact_email,
        name: contact_name,
        tourDate: requested_date,
        groupSize: group_size
      })
    }).catch(err => console.error('Failed to send confirmation email:', err))

    return NextResponse.json({ 
      success: true, 
      message: 'Tour request submitted!',
      booking: newBooking 
    })

  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



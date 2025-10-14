import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { selectedBookingIds, tourDate } = body

    if (!selectedBookingIds || selectedBookingIds.length === 0 || !tourDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Create a new tour group for the same date
    const { data: newTourGroup, error: groupError } = await supabase
      .from('tour_groups')
      .insert({
        requested_date: tourDate,
        status: 'Pending'
      })
      .select()
      .single()

    if (groupError) {
      return NextResponse.json({ error: groupError.message }, { status: 500 })
    }

    // 2. Move selected booking requests to the new tour group
    const { error: updateError } = await supabase
      .from('booking_requests')
      .update({ tour_group_id: newTourGroup.id })
      .in('id', selectedBookingIds)

    if (updateError) {
      // Rollback - delete the tour group we just created
      await supabase.from('tour_groups').delete().eq('id', newTourGroup.id)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      newTourGroupId: newTourGroup.id,
      movedCount: selectedBookingIds.length
    })

  } catch (error) {
    console.error('Error creating group from selection:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


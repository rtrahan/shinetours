import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await context.params
    const body = await request.json()
    const { confirmed_datetime } = body

    if (!confirmed_datetime) {
      return NextResponse.json({ error: 'Confirmed datetime required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('tour_groups')
      .update({ 
        status: 'Confirmed',
        confirmed_datetime 
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Send confirmation emails to all participants
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/emails/tour-confirmed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tourGroupId: id })
      })
    } catch (emailError) {
      console.error('Failed to send confirmation emails:', emailError)
      // Don't fail the request if emails fail - tour is still confirmed
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Error confirming tour:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


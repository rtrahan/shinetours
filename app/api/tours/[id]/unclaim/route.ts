import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await context.params
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get guide record for this user
    const { data: guide } = await supabase
      .from('guides')
      .select('id')
      .eq('email', user.email)
      .single()

    if (!guide) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 })
    }

    // Remove guide assignment and set status back to Pending
    const { data, error } = await supabase
      .from('tour_groups')
      .update({ 
        guide_id: null,
        status: 'Pending'
      })
      .eq('id', id)
      .eq('guide_id', guide.id) // Only unclaim if it's yours
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Tour not found or not assigned to you' }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Error unclaiming tour:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


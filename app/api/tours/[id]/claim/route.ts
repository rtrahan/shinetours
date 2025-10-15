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

    const { data, error } = await supabase
      .from('tour_groups')
      .update({ 
        guide_id: guide.id,
        status: 'Ready' // Set to Ready when guide claims it
      })
      .eq('id', id)
      .is('guide_id', null) // Only claim if not already claimed
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Tour already claimed' }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Error claiming tour:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


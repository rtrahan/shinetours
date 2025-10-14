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

    const { data, error } = await supabase
      .from('tour_groups')
      .update({ guide_id: user.id })
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


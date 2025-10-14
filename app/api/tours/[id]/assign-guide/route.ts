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
    const { guide_id } = body

    // If assigning a guide, set status to Ready
    // If unassigning (null), set back to Pending
    const updateData: any = { guide_id: guide_id || null }
    
    if (guide_id) {
      updateData.status = 'Ready'
    } else {
      updateData.status = 'Pending'
    }

    const { data, error } = await supabase
      .from('tour_groups')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Error assigning guide:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


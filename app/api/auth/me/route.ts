import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_id')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Get user info from guides table
    const { data: guide, error } = await supabase
      .from('guides')
      .select('id, email, first_name, last_name, is_admin, is_active')
      .eq('id', userId)
      .eq('is_active', true)
      .single()

    if (error || !guide) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        id: guide.id,
        email: guide.email,
        first_name: guide.first_name,
        last_name: guide.last_name,
        is_admin: guide.is_admin,
      },
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}


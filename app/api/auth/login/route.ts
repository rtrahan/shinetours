import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Get guide info from guides table
    const { data: guide, error: guideError } = await supabase
      .from('guides')
      .select('id, email, first_name, last_name, is_admin, is_active')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (guideError || !guide) {
      return NextResponse.json(
        { error: 'User not found in guides table' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: guide.id,
        email: guide.email,
        first_name: guide.first_name,
        last_name: guide.last_name,
        is_admin: guide.is_admin,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}


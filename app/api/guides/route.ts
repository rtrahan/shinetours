import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const showAll = searchParams.get('all') === 'true'

    const query = supabase
      .from('guides')
      .select('*')
      .order('first_name')

    // Only filter by active if not showing all
    if (!showAll) {
      query.eq('is_active', true)
    }

    const { data: guides, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(guides)

  } catch (error) {
    console.error('Error fetching guides:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { email, password, first_name, last_name, phone, is_admin } = body

    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create admin client with service role key for auth operations
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Create Supabase Auth user
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name,
        last_name
      }
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // 2. Create guide record
    const { data: guide, error: guideError } = await supabase
      .from('guides')
      .insert({
        email,
        first_name,
        last_name,
        phone: phone || null,
        is_admin: is_admin || false,
        is_active: true,
        password_hash: '' // Using Supabase Auth, not custom passwords
      })
      .select()
      .single()

    if (guideError) {
      // Rollback - delete the auth user we just created
      await adminClient.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json({ error: guideError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, guide })

  } catch (error) {
    console.error('Error creating guide:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await context.params
    const body = await request.json()

    // Allow updating: is_active, email, first_name, last_name, phone, is_admin, password
    const updateData: any = {}
    
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.email) updateData.email = body.email
    if (body.first_name) updateData.first_name = body.first_name
    if (body.last_name) updateData.last_name = body.last_name
    if (body.phone !== undefined) updateData.phone = body.phone || null
    if (body.is_admin !== undefined) updateData.is_admin = body.is_admin

    if (Object.keys(updateData).length === 0 && !body.password) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Update guide record in database
    const { data, error } = await supabase
      .from('guides')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update password in Supabase Auth if provided
    if (body.password && body.password.trim() !== '' && data) {
      // Validate password length
      if (body.password.length < 6) {
        return NextResponse.json({ 
          error: 'Password must be at least 6 characters long' 
        }, { status: 400 })
      }

      try {
        const adminClient = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Find auth user by email
        const { data: authUsers, error: listError } = await adminClient.auth.admin.listUsers()
        
        if (listError) {
          console.error('Error listing users:', listError)
          return NextResponse.json({ 
            error: 'Failed to update password: Could not list users' 
          }, { status: 500 })
        }

        const authUser = authUsers.users.find(u => u.email === data.email)
        
        if (!authUser) {
          return NextResponse.json({ 
            error: 'Failed to update password: Auth user not found' 
          }, { status: 404 })
        }

        const { error: updateError } = await adminClient.auth.admin.updateUserById(authUser.id, {
          password: body.password
        })

        if (updateError) {
          console.error('Error updating password:', updateError)
          return NextResponse.json({ 
            error: `Failed to update password: ${updateError.message}` 
          }, { status: 500 })
        }

        return NextResponse.json({ 
          success: true, 
          data, 
          passwordUpdated: true 
        })

      } catch (authError: any) {
        console.error('Error updating password:', authError)
        return NextResponse.json({ 
          error: `Failed to update password: ${authError.message || 'Unknown error'}` 
        }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Error updating guide:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await context.params

    // Get guide email first (to delete from Auth)
    const { data: guide } = await supabase
      .from('guides')
      .select('email')
      .eq('id', id)
      .single()

    // Delete from guides table
    const { error: deleteError } = await supabase
      .from('guides')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Try to delete from Supabase Auth (if email exists)
    if (guide?.email) {
      try {
        // Create admin client for auth operations
        const adminClient = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Get auth user by email
        const { data: authUsers } = await adminClient.auth.admin.listUsers()
        const authUser = authUsers.users.find(u => u.email === guide.email)
        
        if (authUser) {
          await adminClient.auth.admin.deleteUser(authUser.id)
        }
      } catch (authError) {
        console.error('Error deleting auth user:', authError)
        // Don't fail the request if auth deletion fails
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting guide:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


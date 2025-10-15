import { createClient } from '@supabase/supabase-js'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addAlanaAdmin() {
  console.log('Adding Alana Smith as admin...\n')

  const email = 'alana@mgelc.com'
  const password = 'AdminAlana2025!' // Temporary password
  
  try {
    // 1. Create Supabase Auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: 'Alana',
        last_name: 'Smith'
      }
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️ Auth user already exists, checking guide record...')
      } else {
        console.error('Error creating auth user:', authError.message)
        return
      }
    } else {
      console.log('✓ Created Supabase Auth user')
    }

    // 2. Check if guide record exists
    const { data: existingGuide } = await supabase
      .from('guides')
      .select('*')
      .eq('email', email)
      .single()

    if (existingGuide) {
      // Update to admin
      const { error: updateError } = await supabase
        .from('guides')
        .update({ 
          is_admin: true,
          is_active: true,
          phone: '203-410-1032'
        })
        .eq('email', email)

      if (updateError) {
        console.error('Error updating guide:', updateError.message)
      } else {
        console.log('✓ Updated existing guide record to admin')
      }
    } else {
      // Create new guide record
      const { error: guideError } = await supabase
        .from('guides')
        .insert({
          email,
          first_name: 'Alana',
          last_name: 'Smith',
          phone: '203-410-1032',
          is_admin: true,
          is_active: true,
          password_hash: ''
        })

      if (guideError) {
        console.error('Error creating guide record:', guideError.message)
      } else {
        console.log('✓ Created guide record')
      }
    }

    console.log('\n✅ Alana Smith is now an admin!')
    console.log(`   Email: ${email}`)
    console.log(`   Phone: 203-410-1032`)
    console.log(`   Temporary Password: ${password}`)
    console.log('\n   ⚠️ Alana should change this password after first login')

  } catch (error) {
    console.error('Error:', error)
  }
}

addAlanaAdmin().catch(console.error)


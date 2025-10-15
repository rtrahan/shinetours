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

async function addRobGuide() {
  console.log('Adding Rob Trahan as tour guide...\n')

  const email = 'rob.trahan@shinetours.com'
  const password = 'Guide2025Rob!' // Temporary password
  
  try {
    // 1. Create Supabase Auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: 'Rob',
        last_name: 'Trahan'
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError.message)
      return
    }

    console.log('✓ Created Supabase Auth user')

    // 2. Create guide record (NOT admin, just a guide)
    const { data: guide, error: guideError } = await supabase
      .from('guides')
      .insert({
        email,
        first_name: 'Rob',
        last_name: 'Trahan',
        phone: null,
        is_admin: false,  // Tour guide, not admin
        is_active: true,
        password_hash: ''
      })
      .select()
      .single()

    if (guideError) {
      console.error('Error creating guide record:', guideError.message)
      return
    }

    console.log('✓ Created guide record')
    console.log('\n✅ Rob Trahan is now a tour guide!')
    console.log(`   Email: ${email}`)
    console.log(`   Temporary Password: ${password}`)
    console.log('\n   Rob can now:')
    console.log('   • Claim available tours')
    console.log('   • Submit tours to Yale')
    console.log('   • View his assigned tours')
    console.log('\n   ⚠️ Rob should change this password after first login')

  } catch (error) {
    console.error('Error:', error)
  }
}

addRobGuide().catch(console.error)


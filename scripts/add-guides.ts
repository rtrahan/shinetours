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

async function addGuides() {
  console.log('=== Fixing Tour Guides ===\n')

  const guidesToAdd = [
    { firstName: 'Heather', lastName: 'Trahan', email: 'heather.trahan@shinetours.com' },
    { firstName: 'Alfredo', lastName: 'Perez', email: 'alfredo.perez@shinetours.com' },
    { firstName: 'Seth', lastName: 'McNeely', email: 'seth.mcneely@shinetours.com' }
  ]

  for (const guide of guidesToAdd) {
    console.log(`Processing ${guide.firstName} ${guide.lastName}...`)
    
    // Check if guide already exists
    const { data: existing } = await supabase
      .from('guides')
      .select('id, first_name, last_name, email')
      .eq('email', guide.email)
      .single()

    if (existing) {
      console.log(`  ✓ ${guide.firstName} ${guide.lastName} already exists`)
      continue
    }

    try {
      // Create Supabase Auth user
      const password = `Guide${Math.random().toString(36).slice(2, 10)}!`
      
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: guide.email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: guide.firstName,
          last_name: guide.lastName
        }
      })

      if (authError && !authError.message.includes('already registered')) {
        console.log(`  ⚠️ Auth error for ${guide.firstName}:`, authError.message)
        continue
      }

      // Create guide record
      const { data: newGuide, error: guideError } = await supabase
        .from('guides')
        .insert({
          email: guide.email,
          first_name: guide.firstName,
          last_name: guide.lastName,
          is_admin: false,
          is_active: true,
          password_hash: ''
        })
        .select()
        .single()

      if (guideError) {
        console.log(`  ⚠️ Error creating guide record:`, guideError.message)
      } else {
        console.log(`  ✓ Created ${guide.firstName} ${guide.lastName}`)
        console.log(`     Email: ${guide.email}`)
        console.log(`     Password: ${password}`)
      }
    } catch (e) {
      console.log(`  ⚠️ Error:`, e)
    }
  }

  // Deactivate "Cancel Request"
  console.log('\n=== Cleaning Up ===')
  const { error: deactivateError } = await supabase
    .from('guides')
    .update({ is_active: false })
    .eq('first_name', 'Cancel')
    .eq('last_name', 'Request')

  if (!deactivateError) {
    console.log('✓ Deactivated "Cancel Request" guide')
  }

  // List all active guides
  console.log('\n=== Active Guides ===')
  const { data: allGuides } = await supabase
    .from('guides')
    .select('first_name, last_name, email, is_admin')
    .eq('is_active', true)
    .order('first_name')

  allGuides?.forEach(g => {
    console.log(`  • ${g.first_name} ${g.last_name} (${g.email}) ${g.is_admin ? '- ADMIN' : ''}`)
  })

  console.log('\n✅ Done!')
}

addGuides().catch(console.error)


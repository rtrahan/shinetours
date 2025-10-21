import { createClient } from '@supabase/supabase-js'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function syncAuthUsers() {
  console.log('=== Creating Missing Auth Accounts ===\n')

  // Get all active guides
  const { data: guides } = await supabase
    .from('guides')
    .select('email, first_name, last_name, is_admin')
    .eq('is_active', true)

  // Get all auth users
  const { data: authData } = await supabase.auth.admin.listUsers()
  const authEmails = new Set(authData.users.map(u => u.email))

  const guidesWithoutAuth = guides?.filter(g => !authEmails.has(g.email)) || []

  if (guidesWithoutAuth.length === 0) {
    console.log('✅ All guides already have Auth accounts!')
    return
  }

  console.log(`Found ${guidesWithoutAuth.length} guides without Auth accounts\n`)

  for (const guide of guidesWithoutAuth) {
    const password = `Shine${Math.random().toString(36).slice(2, 10)}!`
    
    try {
      const { error } = await supabase.auth.admin.createUser({
        email: guide.email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: guide.first_name,
          last_name: guide.last_name
        }
      })

      if (error) {
        console.log(`✗ ${guide.first_name} ${guide.last_name}:`, error.message)
      } else {
        console.log(`✓ ${guide.first_name} ${guide.last_name} (${guide.email})`)
        console.log(`   Password: ${password}`)
      }
    } catch (error) {
      console.error(`Error creating auth for ${guide.email}:`, error)
    }
  }

  console.log('\n✅ Auth sync complete!')
  console.log('\n⚠️  Save these passwords and share them with the users securely!')
}

syncAuthUsers().catch(console.error)


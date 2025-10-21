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

async function checkAuthUsers() {
  console.log('=== Checking Auth Users vs Guide Records ===\n')

  // Get all active guides
  const { data: guides } = await supabase
    .from('guides')
    .select('email, first_name, last_name, is_admin, is_active')
    .eq('is_active', true)
    .order('email')

  // Get all auth users
  const { data: authData } = await supabase.auth.admin.listUsers()
  const authEmails = new Set(authData.users.map(u => u.email))

  console.log('GUIDE RECORDS vs AUTH ACCOUNTS:\n')

  guides?.forEach(guide => {
    const hasAuth = authEmails.has(guide.email)
    const status = hasAuth ? '✓' : '✗'
    const role = guide.is_admin ? 'ADMIN' : 'Guide'
    
    console.log(`${status} ${guide.first_name} ${guide.last_name} (${guide.email}) - ${role}`)
    if (!hasAuth) {
      console.log(`   ⚠️  NO AUTH ACCOUNT - cannot login!`)
    }
  })

  const guidesWithoutAuth = guides?.filter(g => !authEmails.has(g.email)) || []
  
  if (guidesWithoutAuth.length > 0) {
    console.log(`\n⚠️  ${guidesWithoutAuth.length} guide(s) need Auth accounts created`)
    console.log('\nRun this to fix them:')
    console.log('npx tsx scripts/sync-auth-users.ts')
  } else {
    console.log('\n✅ All guides have Auth accounts!')
  }
}

checkAuthUsers().catch(console.error)


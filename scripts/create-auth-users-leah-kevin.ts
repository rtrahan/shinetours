// Script to create/reset auth users for Leah and Kevin
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

async function createAuthUsers() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables!')
    console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
    return
  }
  
  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  
  const tempPassword = 'ShineTours2024!'
  
  const users = [
    {
      email: 'leahsappo@yahoo.com',
      name: 'Leah Sappo',
      first_name: 'Leah',
      last_name: 'Sappo'
    },
    {
      email: 'kcwallkill1@gmail.com',
      name: 'Kevin Clanton',
      first_name: 'Kevin',
      last_name: 'Clanton'
    }
  ]
  
  console.log('🔍 Checking existing auth users...\n')
  
  // Get all auth users
  const { data: authData, error: listError } = await adminClient.auth.admin.listUsers()
  
  if (listError) {
    console.error('❌ Error listing users:', listError)
    return
  }
  
  console.log(`Found ${authData.users.length} total auth users\n`)
  
  for (const user of users) {
    const existingUser = authData.users.find(u => u.email === user.email)
    
    if (existingUser) {
      console.log(`📝 Updating password for ${user.name}...`)
      
      const { error: updateError } = await adminClient.auth.admin.updateUserById(
        existingUser.id,
        { password: tempPassword }
      )
      
      if (updateError) {
        console.error(`❌ Error updating ${user.name}:`, updateError.message)
      } else {
        console.log(`✅ Password reset for ${user.name}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Password: ${tempPassword}`)
      }
    } else {
      console.log(`🆕 Creating auth user for ${user.name}...`)
      
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: user.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          first_name: user.first_name,
          last_name: user.last_name
        }
      })
      
      if (createError) {
        console.error(`❌ Error creating ${user.name}:`, createError.message)
      } else {
        console.log(`✅ Created auth user for ${user.name}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Password: ${tempPassword}`)
      }
    }
    console.log('')
  }
  
  console.log('━'.repeat(60))
  console.log('\n📋 FINAL LOGIN CREDENTIALS\n')
  console.log('Login URL: http://localhost:3001/login')
  console.log('Or: https://shinetours-next.vercel.app/login\n')
  console.log('━'.repeat(60))
  console.log('\n👤 LEAH SAPPO')
  console.log(`   Email: leahsappo@yahoo.com`)
  console.log(`   Password: ${tempPassword}`)
  console.log('\n👤 KEVIN CLANTON')
  console.log(`   Email: kcwallkill1@gmail.com`)
  console.log(`   Password: ${tempPassword}`)
  console.log('\n━'.repeat(60))
  console.log('\n⚠️  IMPORTANT: Tell them to change their password after')
  console.log('   logging in: Profile → New Password (optional field)')
  console.log('\n✨ Done!')
}

createAuthUsers()


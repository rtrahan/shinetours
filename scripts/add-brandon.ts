// Script to add Brandon Blatchley as a guide
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

async function addBrandon() {
  const baseUrl = 'http://localhost:3001'
  const tempPassword = 'ShineTours2024!'
  
  console.log('🚀 Creating guide account for Brandon Blatchley...\n')
  
  // Create the guide in the database
  const guideData = {
    email: 'blatchley@gmail.com',
    password: tempPassword,
    first_name: 'Brandon',
    last_name: 'Blatchley',
    phone: '203-232-4699',
    languages: ['English', 'Spanish'],
    is_admin: false
  }
  
  try {
    const response = await fetch(`${baseUrl}/api/guides`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guideData)
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Successfully created Brandon Blatchley!')
      console.log(`   Email: ${guideData.email}`)
      console.log(`   Phone: ${guideData.phone}`)
      console.log(`   Password: ${tempPassword}`)
      console.log(`   Languages: English, Spanish`)
      console.log('')
      console.log('━'.repeat(60))
      console.log('\n📋 LOGIN CREDENTIALS\n')
      console.log('Login URL: http://localhost:3001/login')
      console.log('Or: https://shinetours-next.vercel.app/login\n')
      console.log('━'.repeat(60))
      console.log('\n👤 BRANDON BLATCHLEY')
      console.log(`   Email: blatchley@gmail.com`)
      console.log(`   Password: ${tempPassword}`)
      console.log('\n━'.repeat(60))
      console.log('\n⚠️  IMPORTANT: Tell Brandon to change his password after')
      console.log('   logging in: Profile → New Password (optional field)')
      console.log('\n✨ Done!')
    } else {
      console.error('❌ Failed to create Brandon:', data.error)
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

addBrandon()




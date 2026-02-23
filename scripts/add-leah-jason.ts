// Script to add/update Leah (with new email) and Jason Sweatman

async function addGuides() {
  const baseUrl = 'http://localhost:3001'
  const tempPassword = 'ShineTours2024!'
  
  const guides = [
    {
      email: 'billsappojr@yahoo.com',
      password: tempPassword,
      first_name: 'Leah',
      last_name: 'Sappo',
      phone: '631-202-8909',
      languages: ['English', 'Spanish', 'Italian'],
      is_admin: false
    },
    {
      email: 'sweatman.jason@gmail.com',
      password: tempPassword,
      first_name: 'Jason',
      last_name: 'Sweatman',
      phone: '203-556-8068',
      languages: ['English', 'Spanish', 'Italian'],
      is_admin: false
    }
  ]

  console.log('🚀 Adding guide accounts...\n')

  for (const guide of guides) {
    try {
      const response = await fetch(`${baseUrl}/api/guides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guide)
      })

      const data = await response.json()

      if (response.ok) {
        console.log(`✅ Successfully added: ${guide.first_name} ${guide.last_name}`)
        console.log(`   Email: ${guide.email}`)
        console.log(`   Phone: ${guide.phone}`)
        console.log(`   Password: ${tempPassword}`)
        console.log(`   Languages: ${guide.languages.join(', ')}`)
        console.log('')
      } else {
        console.error(`❌ Failed to add ${guide.first_name} ${guide.last_name}:`, data.error)
        console.log('')
      }
    } catch (error) {
      console.error(`❌ Error adding ${guide.first_name} ${guide.last_name}:`, error)
      console.log('')
    }
  }

  console.log('━'.repeat(60))
  console.log('\n📋 LOGIN CREDENTIALS\n')
  console.log('Login URL: http://localhost:3001/login')
  console.log('Or: https://shinetours-next.vercel.app/login\n')
  console.log('━'.repeat(60))
  console.log('\n👤 LEAH SAPPO (New Email)')
  console.log(`   Email: billsappojr@yahoo.com`)
  console.log(`   Password: ${tempPassword}`)
  console.log('\n👤 JASON SWEATMAN')
  console.log(`   Email: sweatman.jason@gmail.com`)
  console.log(`   Password: ${tempPassword}`)
  console.log('\n━'.repeat(60))
  console.log('\n⚠️  IMPORTANT: Tell them to change their password after')
  console.log('   logging in: Profile → New Password (optional field)')
  console.log('\n✨ Done!')
}

addGuides()




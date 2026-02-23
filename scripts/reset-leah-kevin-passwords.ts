// Script to reset Leah and Kevin's passwords

async function resetPasswords() {
  const baseUrl = 'http://localhost:3001'
  const tempPassword = 'ShineTours2024!'
  
  console.log('🔍 Finding Leah and Kevin accounts...\n')
  
  const guidesResponse = await fetch(`${baseUrl}/api/guides?all=true`)
  const guides = await guidesResponse.json()
  
  const leah = guides.find((g: any) => g.email === 'leahsappo@yahoo.com')
  const kevin = guides.find((g: any) => g.email === 'kcwallkill1@gmail.com')
  
  const accounts = [
    { guide: leah, name: 'Leah Sappo', email: 'leahsappo@yahoo.com' },
    { guide: kevin, name: 'Kevin Clanton', email: 'kcwallkill1@gmail.com' }
  ]
  
  console.log('🔑 Resetting passwords...\n')
  
  for (const account of accounts) {
    if (!account.guide) {
      console.log(`❌ Could not find ${account.name}`)
      continue
    }
    
    const updateResponse = await fetch(`${baseUrl}/api/guides/${account.guide.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: tempPassword
      })
    })
    
    const result = await updateResponse.json()
    
    if (updateResponse.ok) {
      console.log(`✅ ${account.name}`)
      console.log(`   Email: ${account.email}`)
      console.log(`   Password: ${tempPassword}`)
      console.log('')
    } else {
      console.error(`❌ Failed to reset password for ${account.name}:`, result.error)
      console.log('')
    }
  }
  
  console.log('━'.repeat(50))
  console.log('\n📋 LOGIN INFORMATION\n')
  console.log('Both can log in at: http://localhost:3001/login')
  console.log('Or live site: https://shinetours-next.vercel.app/login\n')
  console.log('━'.repeat(50))
  console.log('\n👤 LEAH SAPPO')
  console.log(`   Email: leahsappo@yahoo.com`)
  console.log(`   Password: ${tempPassword}`)
  console.log('\n👤 KEVIN CLANTON')
  console.log(`   Email: kcwallkill1@gmail.com`)
  console.log(`   Password: ${tempPassword}`)
  console.log('\n━'.repeat(50))
  console.log('\n⚠️  IMPORTANT: Ask them to change their password')
  console.log('   after logging in via Profile → New Password')
  console.log('\n✨ Done!')
}

resetPasswords()




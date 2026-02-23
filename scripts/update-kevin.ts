// Script to update Kevin's account information

async function updateKevin() {
  const baseUrl = 'http://localhost:3001'
  
  // First, get Kevin's ID by fetching all guides
  console.log('🔍 Finding Kevin\'s account...\n')
  
  const guidesResponse = await fetch(`${baseUrl}/api/guides?all=true`)
  const guides = await guidesResponse.json()
  
  const kevin = guides.find((g: any) => g.email === 'kcwallkill1@gmail.com')
  
  if (!kevin) {
    console.log('❌ Could not find Kevin\'s account')
    return
  }
  
  console.log(`✓ Found Kevin's account (ID: ${kevin.id})`)
  console.log(`  Current info:`)
  console.log(`  - Name: ${kevin.first_name} ${kevin.last_name}`)
  console.log(`  - Phone: ${kevin.phone || 'Not set'}`)
  console.log(`  - Languages: ${kevin.languages?.join(', ') || 'None'}`)
  console.log('')
  
  // Update Kevin's information
  console.log('📝 Updating Kevin\'s information...\n')
  
  const updateData = {
    first_name: 'Kevin',
    last_name: 'Clanton',
    phone: '757-685-1440',
    languages: ['English', 'Spanish']
  }
  
  const updateResponse = await fetch(`${baseUrl}/api/guides/${kevin.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  })
  
  const result = await updateResponse.json()
  
  if (updateResponse.ok) {
    console.log('✅ Successfully updated Kevin Clanton!')
    console.log(`   Email: kcwallkill1@gmail.com`)
    console.log(`   Phone: 757-685-1440`)
    console.log(`   Languages: English, Spanish`)
    console.log('')
  } else {
    console.error('❌ Failed to update Kevin:', result.error)
  }
  
  console.log('✨ Done!')
}

updateKevin()



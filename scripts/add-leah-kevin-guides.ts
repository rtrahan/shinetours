// Script to add Leah and Kevin as tour guides

async function addGuides() {
  const baseUrl = 'http://localhost:3001'
  
  const guides = [
    {
      email: 'leahsappo@yahoo.com',
      password: 'ShineTours2024!', // They should change this on first login
      first_name: 'Leah',
      last_name: 'Sappo',
      phone: '631-202-8909',
      languages: ['English', 'Spanish'],
      is_admin: false
    },
    {
      email: 'kcwallkill1@gmail.com',
      password: 'ShineTours2024!', // They should change this on first login
      first_name: 'Kevin',
      last_name: 'Clanton',
      phone: '757-685-1440',
      languages: ['English', 'Spanish'],
      is_admin: false
    }
  ]

  console.log('🚀 Adding guide accounts...\n')

  for (const guide of guides) {
    try {
      const response = await fetch(`${baseUrl}/api/guides`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(guide)
      })

      const data = await response.json()

      if (response.ok) {
        console.log(`✅ Successfully added: ${guide.first_name} ${guide.last_name}`)
        console.log(`   Email: ${guide.email}`)
        console.log(`   Phone: ${guide.phone}`)
        console.log(`   Password: ${guide.password}`)
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

  console.log('✨ Done!')
}

addGuides()



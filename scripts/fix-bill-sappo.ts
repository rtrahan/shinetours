// Script to fix Bill Sappo's account (delete wrong Leah account and create Bill)

async function fixBillSappo() {
  const baseUrl = 'http://localhost:3001'
  const tempPassword = 'ShineTours2024!'
  
  console.log('🔧 Fixing accounts...\n')
  
  // First, find and delete the billsappojr account we wrongly created for Leah
  console.log('1️⃣ Finding billsappojr@yahoo.com account to delete...\n')
  
  try {
    const guidesResponse = await fetch(`${baseUrl}/api/guides?all=true`)
    const guides = await guidesResponse.json()
    
    const wrongLeahAccount = guides.find((g: any) => g.email === 'billsappojr@yahoo.com')
    
    if (wrongLeahAccount) {
      console.log(`Found wrong account: ${wrongLeahAccount.first_name} ${wrongLeahAccount.last_name} (${wrongLeahAccount.email})`)
      console.log(`Deleting...`)
      
      const deleteResponse = await fetch(`${baseUrl}/api/guides/${wrongLeahAccount.id}`, {
        method: 'DELETE'
      })
      
      if (deleteResponse.ok) {
        console.log(`✅ Deleted wrong account\n`)
      } else {
        console.error(`❌ Failed to delete account\n`)
      }
    } else {
      console.log(`Account not found, skipping...\n`)
    }
    
    // Now create Bill Sappo's account
    console.log('2️⃣ Creating Bill Sappo account...\n')
    
    const billData = {
      email: 'billsappojr@yahoo.com',
      password: tempPassword,
      first_name: 'Bill',
      last_name: 'Sappo',
      phone: '631-202-8909',
      languages: ['English', 'Spanish', 'Italian'],
      is_admin: false
    }
    
    const createResponse = await fetch(`${baseUrl}/api/guides`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(billData)
    })
    
    const createData = await createResponse.json()
    
    if (createResponse.ok) {
      console.log(`✅ Successfully created: Bill Sappo`)
      console.log(`   Email: billsappojr@yahoo.com`)
      console.log(`   Phone: 631-202-8909`)
      console.log(`   Password: ${tempPassword}`)
      console.log(`   Languages: English, Spanish, Italian`)
      console.log('')
    } else {
      console.error(`❌ Failed to create Bill Sappo:`, createData.error)
    }
    
    console.log('━'.repeat(60))
    console.log('\n📋 UPDATED GUIDE ACCOUNTS\n')
    console.log('━'.repeat(60))
    console.log('\n👤 LEAH SAPPO (Original Email - Unchanged)')
    console.log(`   Email: leahsappo@yahoo.com`)
    console.log(`   Phone: 631-202-8909`)
    console.log('\n👤 BILL SAPPO (New Account)')
    console.log(`   Email: billsappojr@yahoo.com`)
    console.log(`   Password: ${tempPassword}`)
    console.log(`   Phone: 631-202-8909`)
    console.log('\n👤 JASON SWEATMAN (Already Created)')
    console.log(`   Email: sweatman.jason@gmail.com`)
    console.log(`   Password: ${tempPassword}`)
    console.log(`   Phone: 203-556-8068`)
    console.log('\n━'.repeat(60))
    console.log('\n✨ Done!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixBillSappo()




import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import Papa from 'papaparse'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface CSVRow {
  'Email Address': string
  'First and Last Name': string
  'How Many Are In Your Party? ': string
  'Select Your Tour Date & Time': string
  'Request A Specific Date (Optional) \n3 weeks minimum notice is preferred in order to register with Yale. \nClosed Mondays. \nPlease note that requests are not confirmed until an available guide contacts you. ': string
  'Contact telephone (optional)': string
}

function extractGuideName(dateTimeField: string): string | null {
  // Pattern: "04/06/2024 at 3:30pm with Kevin Clanton"
  // Pattern: "11/16/2024 at 12:30pm with Kevin Clanton (15 spots)"
  // Pattern: "With Seth" or "Kevin" or "Alfredo"
  
  const withMatch = dateTimeField.match(/with\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i)
  if (withMatch) {
    const name = withMatch[1].trim()
    // Skip "Cancel Request" - not a real guide
    if (name.toLowerCase().includes('cancel')) return null
    return name
  }
  
  // Check if it's just a name like "Kevin" or "Seth McKneely"
  const nameOnly = dateTimeField.match(/^([A-Za-z]+(?:\s+[A-Za-z]+)?)$/i)
  if (nameOnly) {
    const name = nameOnly[1].trim()
    if (name.toLowerCase().includes('cancel')) return null
    return name
  }
  
  return null
}

async function importCSV() {
  const csvPath = path.join(process.cwd(), 'previous tours', 'Book A Tour! (Responses) - Form Responses 1.csv')
  const csvContent = fs.readFileSync(csvPath, 'utf-8')

  const { data } = Papa.parse<CSVRow>(csvContent, {
    header: true,
    skipEmptyLines: true
  })

  console.log(`Found ${data.length} rows in CSV`)

  const today = new Date('2025-10-15')
  const futureBookings: any[] = []
  const guideNamesSet = new Set<string>()

  // Parse and filter for future dates
  data.forEach((row, index) => {
    const email = row['Email Address']?.trim()
    const name = row['First and Last Name']?.trim()
    const partySize = parseInt(row['How Many Are In Your Party? ']?.trim() || '0')
    const dateTimeField = row['Select Your Tour Date & Time']?.trim() || ''
    const dateField = row['Request A Specific Date (Optional) \n3 weeks minimum notice is preferred in order to register with Yale. \nClosed Mondays. \nPlease note that requests are not confirmed until an available guide contacts you. ']?.trim()
    const phone = row['Contact telephone (optional)']?.trim() || ''

    if (!email || !name || !partySize || !dateField) {
      if (dateField) {
        console.log(`Row ${index + 1}: Skipping - missing data (email:${!!email}, name:${!!name}, party:${!!partySize})`)
      }
      return // Skip invalid rows
    }

    // Extract guide name from the "Select Your Tour Date & Time" column
    const guideName = extractGuideName(dateTimeField)
    if (guideName) {
      guideNamesSet.add(guideName)
    }

    // Parse date from various formats
    let tourDate: Date | null = null

    try {
      // Try parsing as MM/DD/YYYY HH:MM:SS
      if (dateField.match(/^\d{1,2}\/\d{1,2}\/\d{4}/)) {
        const parts = dateField.split(' ')
        const datePart = parts[0]
        const [month, day, year] = datePart.split('/').map(Number)
        tourDate = new Date(year, month - 1, day)
      }
    } catch (e) {
      console.log(`Row ${index + 1}: Could not parse date "${dateField}"`)
    }

    if (tourDate && tourDate > today) {
      const dateStr = `${tourDate.getFullYear()}-${String(tourDate.getMonth() + 1).padStart(2, '0')}-${String(tourDate.getDate()).padStart(2, '0')}`
      
      futureBookings.push({
        email,
        name,
        partySize,
        date: dateStr,
        phone,
        preferredGuideName: guideName,
        originalDateField: dateField
      })
    }
  })

  console.log(`Found ${futureBookings.length} future bookings (after Oct 14, 2025)`)
  console.log(`Found ${guideNamesSet.size} unique guide names:`, Array.from(guideNamesSet).join(', '))

  // Group by date
  const bookingsByDate: Record<string, any[]> = {}
  futureBookings.forEach(b => {
    if (!bookingsByDate[b.date]) {
      bookingsByDate[b.date] = []
    }
    bookingsByDate[b.date].push(b)
  })

  console.log(`\nBookings across ${Object.keys(bookingsByDate).length} dates:`)
  Object.keys(bookingsByDate).sort().forEach(date => {
    const count = bookingsByDate[date].length
    const totalPeople = bookingsByDate[date].reduce((sum, b) => sum + b.partySize, 0)
    console.log(`  ${date}: ${count} bookings, ${totalPeople} people`)
  })

  // STEP 1: Create guides
  console.log('\n=== Creating Tour Guides ===')
  const guideMap: Record<string, string> = {} // name -> id
  
  const guideNames = Array.from(guideNamesSet)
  for (const fullName of guideNames) {
    const nameParts = fullName.split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ') || firstName
    
    // Create a default email and password for each guide
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '')}@shinetours.com`
    const password = `Guide${Math.random().toString(36).slice(2, 10)}!`
    
    try {
      // Create Supabase Auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name: firstName, last_name: lastName }
      })

      if (authError && !authError.message.includes('already exists')) {
        console.log(`  ⚠️ Could not create auth for ${fullName}:`, authError.message)
        continue
      }

      // Create guide record
      const { data: guide, error: guideError } = await supabase
        .from('guides')
        .insert({
          email,
          first_name: firstName,
          last_name: lastName,
          is_admin: false,
          is_active: true,
          password_hash: ''
        })
        .select()
        .single()

      if (guideError) {
        if (guideError.message.includes('duplicate')) {
          // Guide already exists, fetch it
          const { data: existing } = await supabase
            .from('guides')
            .select('id')
            .eq('first_name', firstName)
            .eq('last_name', lastName)
            .single()
          
          if (existing) {
            guideMap[fullName] = existing.id
            console.log(`  ✓ ${fullName} (already exists)`)
          }
        } else {
          console.log(`  ⚠️ Error creating ${fullName}:`, guideError.message)
        }
      } else {
        guideMap[fullName] = guide.id
        console.log(`  ✓ Created ${fullName}`)
      }
    } catch (e) {
      console.log(`  ⚠️ Error with ${fullName}:`, e)
    }
  }

  console.log(`\n✓ Created/found ${Object.keys(guideMap).length} guides`)

  // STEP 2: Import tour groups and bookings
  console.log('\n=== Creating Tour Groups & Bookings ===')
  
  for (const date of Object.keys(bookingsByDate).sort()) {
    const dateBookings = bookingsByDate[date]
    
    // Create tour group for this date
    const { data: tourGroup, error: groupError } = await supabase
      .from('tour_groups')
      .insert({
        requested_date: date,
        status: 'Pending'
      })
      .select()
      .single()

    if (groupError) {
      console.error(`Error creating tour group for ${date}:`, groupError.message)
      continue
    }

    console.log(`✓ Created tour group for ${date}`)

    // Create booking requests
    for (const booking of dateBookings) {
      const preferredGuideId = booking.preferredGuideName && guideMap[booking.preferredGuideName] 
        ? guideMap[booking.preferredGuideName] 
        : null

      const { error: bookingError } = await supabase
        .from('booking_requests')
        .insert({
          requested_date: date,
          group_size: booking.partySize,
          contact_name: booking.name,
          contact_email: booking.email,
          contact_phone: booking.phone,
          tour_group_id: tourGroup.id,
          preferred_guide_id: preferredGuideId
        })

      if (bookingError) {
        console.error(`  Error creating booking for ${booking.name}:`, bookingError.message)
      } else {
        const preferredText = booking.preferredGuideName ? ` (prefers ${booking.preferredGuideName})` : ''
        console.log(`  ✓ ${booking.name} (${booking.partySize} people)${preferredText}`)
      }
    }
  }

  console.log('\n✅ Import complete!')
}

importCSV().catch(console.error)


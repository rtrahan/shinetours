import { createClient } from '@supabase/supabase-js'
import * as path from 'path'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import Papa from 'papaparse'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
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
  'How did you hear about us? ': string
  'Alternate Preferred Date (Optional) \nClosed Mondays. \nPlease note that requests are not confirmed until an available guide contacts you. ': string
}

function extractGuideName(dateTimeField: string): string | null {
  const withMatch = dateTimeField.match(/with\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i)
  if (withMatch) {
    const name = withMatch[1].trim()
    if (name.toLowerCase().includes('cancel')) return null
    return name
  }
  
  const nameOnly = dateTimeField.match(/^([A-Za-z]+(?:\s+[A-Za-z]+)?)$/i)
  if (nameOnly) {
    const name = nameOnly[1].trim()
    if (name.toLowerCase().includes('cancel')) return null
    return name
  }
  
  return null
}

async function cleanAndReimport() {
  console.log('=== CLEANING DATABASE ===\n')

  // Delete all booking requests
  const { error: deleteBookingsError } = await supabase
    .from('booking_requests')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

  if (deleteBookingsError) {
    console.error('Error deleting booking requests:', deleteBookingsError.message)
  } else {
    console.log('✓ Deleted all booking requests')
  }

  // Delete all tour groups
  const { error: deleteGroupsError } = await supabase
    .from('tour_groups')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

  if (deleteGroupsError) {
    console.error('Error deleting tour groups:', deleteGroupsError.message)
  } else {
    console.log('✓ Deleted all tour groups')
  }

  console.log('\n=== IMPORTING FROM CSV ===\n')

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

  data.forEach((row, index) => {
    const email = row['Email Address']?.trim()
    const name = row['First and Last Name']?.trim()
    const partySize = parseInt(row['How Many Are In Your Party? ']?.trim() || '0')
    const dateTimeField = row['Select Your Tour Date & Time']?.trim() || ''
    const dateField = row['Request A Specific Date (Optional) \n3 weeks minimum notice is preferred in order to register with Yale. \nClosed Mondays. \nPlease note that requests are not confirmed until an available guide contacts you. ']?.trim()
    const alternateDateField = row['Alternate Preferred Date (Optional) \nClosed Mondays. \nPlease note that requests are not confirmed until an available guide contacts you. ']?.trim()
    const phone = row['Contact telephone (optional)']?.trim() || ''

    const dateToUse = dateField || alternateDateField

    if (!email || !name || !partySize || !dateToUse) {
      return
    }

    const guideName = extractGuideName(dateTimeField)
    if (guideName) {
      guideNamesSet.add(guideName)
    }

    let tourDate: Date | null = null

    try {
      if (dateToUse.match(/^\d{1,2}\/\d{1,2}\/\d{4}/)) {
        const parts = dateToUse.split(' ')
        const datePart = parts[0]
        const [month, day, year] = datePart.split('/').map(Number)
        tourDate = new Date(year, month - 1, day)
      }
    } catch (e) {
      // Skip silently
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

  console.log(`Found ${futureBookings.length} future bookings`)

  // Get guide map
  const { data: existingGuides } = await supabase
    .from('guides')
    .select('id, first_name, last_name')

  const guideMap: Record<string, string> = {}
  existingGuides?.forEach((g: any) => {
    const fullName = `${g.first_name} ${g.last_name}`
    guideMap[fullName] = g.id
    // Also map just first name for partial matches
    guideMap[g.first_name] = g.id
  })

  // Import bookings (ungrouped - let admins manage grouping)
  console.log('\n=== Creating Booking Requests ===\n')

  for (const booking of futureBookings) {
    const preferredGuideId = booking.preferredGuideName && guideMap[booking.preferredGuideName]
      ? guideMap[booking.preferredGuideName]
      : null

    const { error } = await supabase
      .from('booking_requests')
      .insert({
        requested_date: booking.date,
        group_size: booking.partySize,
        contact_name: booking.name,
        contact_email: booking.email,
        contact_phone: booking.phone,
        tour_group_id: null, // Leave ungrouped
        preferred_guide_id: preferredGuideId
      })

    if (error) {
      console.error(`  ✗ ${booking.name}:`, error.message)
    } else {
      const preferredText = booking.preferredGuideName ? ` (prefers ${booking.preferredGuideName})` : ''
      console.log(`  ✓ ${booking.date}: ${booking.name} (${booking.partySize} people)${preferredText}`)
    }
  }

  console.log('\n✅ Import complete!')
  console.log(`   ${futureBookings.length} booking requests imported`)
  console.log('   All requests are ungrouped - ready for admin to manage')
}

cleanAndReimport().catch(console.error)


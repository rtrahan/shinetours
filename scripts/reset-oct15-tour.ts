import { createClient } from '@supabase/supabase-js'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function resetTour() {
  console.log('Resetting Oct 15 tour...\n')

  const { data: tours, error: findError } = await supabase
    .from('tour_groups')
    .select('id, requested_date, status, guide:guides(first_name, last_name)')
    .eq('requested_date', '2025-10-15')

  if (findError || !tours || tours.length === 0) {
    console.log('No tour found for Oct 15, 2025')
    return
  }

  console.log(`Found ${tours.length} tour group(s) for Oct 15:`)
  tours.forEach((t: any, i) => {
    const guideName = t.guide ? `${t.guide.first_name} ${t.guide.last_name}` : 'Unassigned'
    console.log(`  ${i + 1}. Status: ${t.status}, Guide: ${guideName}`)
  })

  // Reset all Oct 15 tours
  const { error: updateError } = await supabase
    .from('tour_groups')
    .update({
      status: 'Pending',
      guide_id: null,
      confirmed_datetime: null
    })
    .eq('requested_date', '2025-10-15')

  if (updateError) {
    console.error('Error resetting tour:', updateError.message)
  } else {
    console.log('\n✅ Reset complete! Oct 15 tour is now:')
    console.log('   - Status: Pending')
    console.log('   - Guide: Unassigned')
    console.log('   - Confirmed Time: None')
  }
}

resetTour().catch(console.error)



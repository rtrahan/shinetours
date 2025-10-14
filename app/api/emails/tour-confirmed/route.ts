import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, tourConfirmedEmail } from '@/lib/email'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tourGroupId } = body

    if (!tourGroupId) {
      return NextResponse.json({ error: 'Tour group ID required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get tour group with all participants and guide
    const { data: tourGroup, error } = await supabase
      .from('tour_groups')
      .select(`
        *,
        guide:guides(first_name, last_name),
        booking_requests(contact_name, contact_email, group_size)
      `)
      .eq('id', tourGroupId)
      .single()

    if (error || !tourGroup) {
      return NextResponse.json({ error: 'Tour group not found' }, { status: 404 })
    }

    if (!tourGroup.confirmed_datetime) {
      return NextResponse.json({ error: 'Tour not confirmed yet' }, { status: 400 })
    }

    // Format the confirmed datetime without timezone shift
    const confirmedTime = format(new Date(tourGroup.confirmed_datetime), 'EEEE, MMMM d, yyyy \'at\' h:mm a')
    const guideName = tourGroup.guide 
      ? `${tourGroup.guide.first_name} ${tourGroup.guide.last_name}`
      : 'TBD'
    const totalPeople = tourGroup.booking_requests?.reduce((sum: number, b: any) => sum + b.group_size, 0) || 0
    
    // Format the requested date properly
    const [year, month, day] = tourGroup.requested_date.split('-').map(Number)
    const requestDateObj = new Date(year, month - 1, day)

    // Send email to all participants
    const emailPromises = tourGroup.booking_requests?.map((booking: any) => {
      return sendEmail({
        to: booking.contact_email,
        subject: '✓ Your Yale Art Gallery Tour is Confirmed!',
        html: tourConfirmedEmail({
          contactName: booking.contact_name,
          tourDate: tourGroup.requested_date,
          confirmedTime,
          guideName,
          totalPeople
        })
      })
    }) || []

    const results = await Promise.all(emailPromises)
    const allSuccessful = results.every(r => r.success)

    if (!allSuccessful) {
      return NextResponse.json({ 
        success: false, 
        message: 'Some emails failed to send' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      emailsSent: results.length 
    })

  } catch (error) {
    console.error('Error sending tour confirmation emails:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


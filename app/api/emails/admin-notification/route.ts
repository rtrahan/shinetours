import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, adminNewRequestEmail } from '@/lib/email'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contactName, contactEmail, contactPhone, tourDate, groupSize, preferredGuideId } = body

    if (!contactName || !tourDate || !groupSize) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get all admins
    const { data: admins } = await supabase
      .from('guides')
      .select('email, first_name, last_name')
      .eq('is_admin', true)
      .eq('is_active', true)

    if (!admins || admins.length === 0) {
      console.log('No admins to notify')
      return NextResponse.json({ success: true, message: 'No admins found' })
    }

    // Get preferred guide name if specified
    let preferredGuideName = undefined
    if (preferredGuideId) {
      const { data: guide } = await supabase
        .from('guides')
        .select('first_name, last_name')
        .eq('id', preferredGuideId)
        .single()
      
      if (guide) {
        preferredGuideName = `${guide.first_name} ${guide.last_name}`
      }
    }

    // Get total requests for this date
    const { data: dateRequests } = await supabase
      .from('booking_requests')
      .select('group_size')
      .eq('requested_date', tourDate)

    const totalRequestsForDate = (dateRequests?.length || 0) + 1 // +1 for this new one
    const totalPeopleForDate = (dateRequests?.reduce((sum, r) => sum + r.group_size, 0) || 0) + groupSize

    // Format date
    const [year, month, day] = tourDate.split('-').map(Number)
    const dateObj = new Date(year, month - 1, day)
    const formattedDate = format(dateObj, 'EEEE, MMMM d, yyyy')

    // Send email to all admins
    const emailPromises = admins.map(admin => {
      return sendEmail({
        to: admin.email,
        subject: `🔔 New Tour Request - ${formattedDate}`,
        html: adminNewRequestEmail({
          contactName,
          contactEmail,
          contactPhone: contactPhone || '',
          tourDate: formattedDate,
          groupSize,
          preferredGuide: preferredGuideName,
          totalRequestsForDate,
          totalPeopleForDate
        })
      })
    })

    await Promise.all(emailPromises)

    return NextResponse.json({ success: true, adminNotified: admins.length })

  } catch (error) {
    console.error('Error sending admin notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


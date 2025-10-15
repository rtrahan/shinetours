import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, guidePreferredRequestEmail } from '@/lib/email'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { guideId, contactName, contactEmail, contactPhone, tourDate, groupSize } = body

    if (!guideId || !contactName || !tourDate || !groupSize) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get guide details
    const { data: guide } = await supabase
      .from('guides')
      .select('email, first_name, last_name')
      .eq('id', guideId)
      .eq('is_active', true)
      .single()

    if (!guide) {
      console.log('Guide not found or inactive')
      return NextResponse.json({ success: false, message: 'Guide not found' }, { status: 404 })
    }

    // Format date
    const [year, month, day] = tourDate.split('-').map(Number)
    const dateObj = new Date(year, month - 1, day)
    const formattedDate = format(dateObj, 'EEEE, MMMM d, yyyy')

    const result = await sendEmail({
      to: guide.email,
      subject: `👋 You've been requested! Tour request for ${formattedDate}`,
      html: guidePreferredRequestEmail({
        guideName: `${guide.first_name} ${guide.last_name}`,
        contactName,
        tourDate: formattedDate,
        groupSize,
        contactEmail,
        contactPhone: contactPhone || ''
      })
    })

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error sending guide notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


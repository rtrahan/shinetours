import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, bookingConfirmationEmail } from '@/lib/email'
import { format, parse } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, tourDate, groupSize } = body

    if (!email || !name || !tourDate || !groupSize) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Parse date string (YYYY-MM-DD) and format without timezone shift
    // tourDate comes as "2025-10-17" from database
    const [year, month, day] = tourDate.split('-').map(Number)
    const dateObj = new Date(year, month - 1, day) // month is 0-indexed
    const formattedDate = format(dateObj, 'EEEE, MMMM d, yyyy')

    const result = await sendEmail({
      to: email,
      subject: 'Tour Request Received - ShineTours',
      html: bookingConfirmationEmail({
        contactName: name,
        tourDate: formattedDate,
        groupSize
      })
    })

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error sending booking confirmation email:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


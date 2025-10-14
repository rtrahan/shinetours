import Mailjet from 'node-mailjet'

interface EmailParams {
  to: string
  subject: string
  html: string
  from?: string
  fromName?: string
}

export async function sendEmail({ to, subject, html, from, fromName }: EmailParams) {
  try {
    // Initialize Mailjet client inside the function to ensure env vars are loaded
    const apiKey = process.env.MAILJET_API_KEY
    const secretKey = process.env.MAILJET_SECRET_KEY
    
    if (!apiKey || !secretKey) {
      console.error('Mailjet credentials not found. Email not sent.')
      console.log('MAILJET_API_KEY exists:', !!apiKey)
      console.log('MAILJET_SECRET_KEY exists:', !!secretKey)
      return { success: false, error: 'Mailjet not configured' }
    }

    const mailjet = Mailjet.apiConnect(apiKey, secretKey)
    
    const request = await mailjet
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: from || process.env.FROM_EMAIL || 'noreply@shinetours.com',
              Name: fromName || 'ShineTours - Yale Art Gallery'
            },
            To: [
              {
                Email: to
              }
            ],
            Subject: subject,
            HTMLPart: html
          }
        ]
      })

    return { success: true, data: request.body }
  } catch (error) {
    console.error('Email error:', error)
    return { success: false, error }
  }
}

// Email Templates

export function bookingConfirmationEmail(params: {
  contactName: string
  tourDate: string
  groupSize: number
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Georgia', serif; color: #292524; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1c1917 0%, #44403c 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fafaf9; padding: 30px; border-radius: 0 0 8px 8px; }
    .highlight { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0; }
    .button { display: inline-block; padding: 12px 30px; background: #1c1917; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #78716c; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-weight: 300; font-size: 32px;">Tour Request Received</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">ShineTours - Yale Art Gallery</p>
    </div>
    <div class="content">
      <p>Dear ${params.contactName},</p>
      
      <p>Thank you for requesting an art gallery tour! We've received your request for:</p>
      
      <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Date:</strong> ${params.tourDate}</p>
        <p style="margin: 5px 0;"><strong>Party Size:</strong> ${params.groupSize} ${params.groupSize === 1 ? 'person' : 'people'}</p>
      </div>

      <div class="highlight">
        <p style="margin: 0; font-weight: 600;">⚠️ Important: Your tour is NOT YET CONFIRMED</p>
      </div>

      <h3 style="color: #1c1917;">What Happens Next:</h3>
      
      <ol style="padding-left: 20px;">
        <li style="margin: 10px 0;"><strong>Grouping:</strong> You'll be grouped with other visitors requesting the same date (groups of 10-15 people).</li>
        <li style="margin: 10px 0;"><strong>Yale Submission:</strong> We'll submit your group's tour request to Yale University Art Gallery for approval.</li>
        <li style="margin: 10px 0;"><strong>Confirmation:</strong> Once Yale assigns a time slot (between 11am-3pm), we'll send you a confirmation email with the exact time and meeting details.</li>
      </ol>

      <p style="margin-top: 30px;">Please wait for our confirmation email before making any travel arrangements.</p>

      <p style="margin-top: 20px;">
        <em>"And those having insight will shine"</em><br>
        <small>— Daniel 12:3</small>
      </p>
    </div>
    <div class="footer">
      <p>ShineTours - Yale University Art Gallery Tours</p>
      <p>New Haven, Connecticut</p>
    </div>
  </div>
</body>
</html>
  `
}

export function tourConfirmedEmail(params: {
  contactName: string
  tourDate: string
  confirmedTime: string
  guideName: string
  guideEmail: string
  guidePhone: string
  totalPeople: number
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Georgia', serif; color: #292524; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fafaf9; padding: 30px; border-radius: 0 0 8px 8px; }
    .success-box { background: #d1fae5; border: 2px solid #10b981; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .info-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #d6d3d1; }
    .footer { text-align: center; padding: 20px; color: #78716c; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-weight: 300; font-size: 32px;">✓ Tour Confirmed!</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Your Yale Art Gallery tour is confirmed</p>
    </div>
    <div class="content">
      <p>Dear ${params.contactName},</p>
      
      <div class="success-box">
        <p style="margin: 0; font-weight: 600; font-size: 18px;">🎉 Great news! Yale has confirmed your tour.</p>
      </div>

      <div class="info-box">
        <h3 style="margin-top: 0; color: #1c1917;">Tour Details:</h3>
        <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${params.confirmedTime}</p>
        <p style="margin: 5px 0;"><strong>Group Size:</strong> ${params.totalPeople} people</p>
        <p style="margin: 5px 0;"><strong>Location:</strong> Yale University Art Gallery<br>1111 Chapel St, New Haven, CT</p>
      </div>

      <div class="info-box">
        <h3 style="margin-top: 0; color: #1c1917;">Your Tour Guide:</h3>
        <p style="margin: 5px 0; font-size: 18px; color: #7c3aed;"><strong>${params.guideName}</strong></p>
        <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${params.guideEmail}" style="color: #2563eb;">${params.guideEmail}</a></p>
        <p style="margin: 5px 0;"><strong>Phone:</strong> ${params.guidePhone}</p>
        <p style="margin: 15px 0 0 0; font-size: 14px; color: #78716c;">
          Feel free to contact your guide if you have any questions before the tour.
        </p>
      </div>

      <h3 style="color: #1c1917;">Before Your Visit:</h3>
      
      <ul style="padding-left: 20px;">
        <li style="margin: 10px 0;">Arrive 10 minutes early</li>
        <li style="margin: 10px 0;">Parking available at 150 York St, New Haven, CT</li>
        <li style="margin: 10px 0;">No large bags allowed</li>
        <li style="margin: 10px 0;">No food or drink in the gallery</li>
        <li style="margin: 10px 0;">Photography without flash is permitted</li>
      </ul>

      <p style="margin-top: 30px;">We look forward to seeing you!</p>

      <p style="margin-top: 20px;">
        <em>"And those having insight will shine"</em><br>
        <small>— Daniel 12:3</small>
      </p>
    </div>
    <div class="footer">
      <p>ShineTours - Yale University Art Gallery Tours</p>
      <p>New Haven, Connecticut</p>
    </div>
  </div>
</body>
</html>
  `
}


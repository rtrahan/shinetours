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
              Name: fromName || 'Light & Truth - Yale Art Gallery'
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

// Email templates

const BRAND_NAME = 'Light & Truth'
const BRAND_SUBTITLE = 'Yale University Art Gallery Tours'
const LOCATION = 'New Haven, Connecticut'
const DEFAULT_CONTACT_EMAIL = 'tours@shinetours.com'

type EmailShellParams = {
  preheader: string
  label: string
  title: string
  subtitle: string
  body: string
  footerNote?: string
}

type Detail = {
  label: string
  value: string
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttribute(value: unknown) {
  return escapeHtml(value).replace(/`/g, '&#96;')
}

function peopleLabel(count: number) {
  return `${count} ${count === 1 ? 'person' : 'people'}`
}

function paragraph(content: string, options: { muted?: boolean } = {}) {
  const color = options.muted ? '#7c756c' : '#3b332c'

  return `<p style="margin:0 0 18px;color:${color};font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;">${content}</p>`
}

function sectionTitle(title: string) {
  return `<h2 style="margin:0 0 14px;color:#211a14;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:-0.02em;line-height:1.2;">${escapeHtml(title)}</h2>`
}

function detailRows(details: Detail[]) {
  return details
    .map(
      detail => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #ede7dd;color:#8a7d6b;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;vertical-align:top;width:145px;">${escapeHtml(detail.label)}</td>
          <td style="padding:12px 0;border-bottom:1px solid #ede7dd;color:#2b241e;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;vertical-align:top;">${detail.value}</td>
        </tr>
      `
    )
    .join('')
}

function card(title: string, content: string) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;border-collapse:separate;border-spacing:0;background:#fffdfa;border:1px solid #e8decd;border-radius:18px;box-shadow:0 18px 45px rgba(41,37,36,0.08);">
      <tr>
        <td style="padding:24px;">
          ${sectionTitle(title)}
          ${content}
        </td>
      </tr>
    </table>
  `
}

function detailCard(title: string, details: Detail[]) {
  return card(
    title,
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">${detailRows(details)}</table>`
  )
}

function notice(title: string, content: string, tone: 'gold' | 'green' = 'gold') {
  const palette = {
    gold: {
      background: '#fff8e8',
      border: '#d7b56d',
      title: '#6f4f16',
      text: '#5d4b2f',
    },
    green: {
      background: '#edf8f1',
      border: '#4f9a6d',
      title: '#175233',
      text: '#315741',
    },
  }[tone]

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;background:${palette.background};border-left:4px solid ${palette.border};border-radius:14px;">
      <tr>
        <td style="padding:18px 20px;">
          <p style="margin:0 0 6px;color:${palette.title};font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">${escapeHtml(title)}</p>
          <p style="margin:0;color:${palette.text};font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;">${content}</p>
        </td>
      </tr>
    </table>
  `
}

function orderedSteps(steps: Array<{ title: string; body: string }>) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      ${steps
        .map(
          (step, index) => `
            <tr>
              <td style="padding:${index === 0 ? '2px' : '18px'} 0 0;vertical-align:top;width:42px;">
                <div style="height:28px;width:28px;border-radius:999px;background:#211a14;color:#d7b56d;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:28px;text-align:center;">${index + 1}</div>
              </td>
              <td style="padding:${index === 0 ? '0' : '16px'} 0 0;color:#3b332c;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;">
                <strong style="color:#211a14;">${escapeHtml(step.title)}</strong><br>
                ${step.body}
              </td>
            </tr>
          `
        )
        .join('')}
    </table>
  `
}

function bulletList(items: string[]) {
  return `
    <ul style="margin:0;padding:0 0 0 20px;color:#3b332c;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.75;">
      ${items.map(item => `<li style="margin:8px 0;">${item}</li>`).join('')}
    </ul>
  `
}

function scripture() {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:26px;border-top:1px solid #eadfce;">
      <tr>
        <td style="padding-top:22px;text-align:center;">
          <p style="margin:0;color:#7a5d2f;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-style:italic;line-height:1.45;">"And those having insight will shine"</p>
          <p style="margin:8px 0 0;color:#9a8f80;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">Daniel 12:3</p>
        </td>
      </tr>
    </table>
  `
}

function emailShell({ preheader, label, title, subtitle, body, footerNote }: EmailShellParams) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#050505;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:32px 14px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;border-collapse:separate;border-spacing:0;background:#f7f1e8;border-radius:26px;overflow:hidden;">
          <tr>
            <td style="padding:34px 28px 38px;background:#15110d;background-image:radial-gradient(circle at top,#443627 0%,#15110d 50%,#080706 100%);text-align:center;">
              <p style="margin:0 0 16px;color:#d7b56d;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;">${escapeHtml(label)}</p>
              <h1 style="margin:0;color:#fffaf0;font-family:Georgia,'Times New Roman',serif;font-size:36px;font-weight:400;letter-spacing:-0.035em;line-height:1.08;">${escapeHtml(title)}</h1>
              <p style="margin:14px 0 0;color:#d8cbbb;font-family:Arial,Helvetica,sans-serif;font-size:14px;letter-spacing:0.02em;line-height:1.6;">${escapeHtml(subtitle)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px 30px;background:#f7f1e8;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 30px;background:#11100e;text-align:center;">
              <p style="margin:0;color:#fffaf0;font-family:Georgia,'Times New Roman',serif;font-size:21px;font-weight:400;letter-spacing:-0.02em;">${BRAND_NAME}</p>
              <p style="margin:7px 0 0;color:#a99d8c;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">${BRAND_SUBTITLE}</p>
              <p style="margin:14px 0 0;color:#766f66;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;">${footerNote ? escapeHtml(footerNote) : LOCATION}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

export function bookingConfirmationEmail(params: {
  contactName: string
  tourDate: string
  groupSize: number
}) {
  const contactName = escapeHtml(params.contactName)
  const tourDate = escapeHtml(params.tourDate)

  return emailShell({
    preheader: `We received your Yale Art Gallery tour request for ${params.tourDate}.`,
    label: 'Request Received',
    title: 'Your Tour Request Is In',
    subtitle: 'We will review the date, group the request if needed, and submit it to Yale for approval.',
    body: `
      ${paragraph(`Dear ${contactName},`)}
      ${paragraph(`Thank you for requesting a guided visit with ${BRAND_NAME}. We have received your request and will handle the next steps with care.`)}
      ${detailCard('Request Details', [
        { label: 'Date', value: tourDate },
        { label: 'Party Size', value: escapeHtml(peopleLabel(params.groupSize)) },
      ])}
      ${notice(
        'Not Yet Confirmed',
        'Your tour is not confirmed until Yale University Art Gallery approves a time slot and we send a final confirmation email.'
      )}
      ${card(
        'What Happens Next',
        orderedSteps([
          {
            title: 'Grouping',
            body: 'We may group visitors requesting the same date, usually into groups of 10 to 15 people.',
          },
          {
            title: 'Yale Submission',
            body: 'We submit the tour request to Yale University Art Gallery for approval.',
          },
          {
            title: 'Confirmation',
            body: 'Once Yale agrees to a time between 11am and 3pm, we will send the exact time and meeting details.',
          },
        ])
      )}
      ${paragraph('Please wait for the final confirmation before making travel arrangements.', { muted: true })}
      ${scripture()}
    `,
  })
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
  const contactName = escapeHtml(params.contactName)
  const guideEmail = escapeHtml(params.guideEmail || DEFAULT_CONTACT_EMAIL)
  const guideEmailHref = escapeAttribute(params.guideEmail || DEFAULT_CONTACT_EMAIL)

  return emailShell({
    preheader: `Your Yale Art Gallery tour is confirmed for ${params.confirmedTime}.`,
    label: 'Tour Confirmed',
    title: 'Your Visit Is Confirmed',
    subtitle: 'Yale has approved your tour time. We look forward to welcoming you.',
    body: `
      ${paragraph(`Dear ${contactName},`)}
      ${notice('Confirmed By Yale', 'Your tour has been approved. Please save the details below and plan to arrive a few minutes early.', 'green')}
      ${detailCard('Tour Details', [
        { label: 'Date and Time', value: escapeHtml(params.confirmedTime) },
        { label: 'Group Size', value: escapeHtml(peopleLabel(params.totalPeople)) },
        { label: 'Location', value: 'Yale University Art Gallery<br>1111 Chapel St, New Haven, CT' },
      ])}
      ${detailCard('Your Guide', [
        { label: 'Guide', value: escapeHtml(params.guideName) },
        { label: 'Email', value: `<a href="mailto:${guideEmailHref}" style="color:#7a5d2f;text-decoration:underline;">${guideEmail}</a>` },
        { label: 'Phone', value: escapeHtml(params.guidePhone || 'Not provided') },
      ])}
      ${card(
        'Before Your Visit',
        bulletList([
          'Arrive 10 minutes early so the group can begin on time.',
          'Parking is available at 150 York St, New Haven, CT.',
          'Large bags, food, and drink are not permitted in the gallery.',
          'Photography without flash is permitted unless otherwise noted in the gallery.',
        ])
      )}
      ${paragraph('If anything changes before the visit, please contact your guide or reply to the confirmation email.', { muted: true })}
      ${scripture()}
    `,
  })
}

export function adminNewRequestEmail(params: {
  contactName: string
  contactEmail: string
  contactPhone: string
  tourDate: string
  groupSize: number
  preferredGuide?: string
  totalRequestsForDate: number
  totalPeopleForDate: number
}) {
  const contactEmail = escapeHtml(params.contactEmail)
  const contactEmailHref = escapeAttribute(params.contactEmail)
  const details: Detail[] = [
    { label: 'Date', value: escapeHtml(params.tourDate) },
    { label: 'Party Size', value: escapeHtml(peopleLabel(params.groupSize)) },
    { label: 'Contact', value: escapeHtml(params.contactName) },
    { label: 'Email', value: `<a href="mailto:${contactEmailHref}" style="color:#7a5d2f;text-decoration:underline;">${contactEmail}</a>` },
    { label: 'Phone', value: escapeHtml(params.contactPhone || 'Not provided') },
  ]

  if (params.preferredGuide) {
    details.push({ label: 'Preferred Guide', value: escapeHtml(params.preferredGuide) })
  }

  return emailShell({
    preheader: `New tour request for ${params.tourDate}: ${params.contactName}, ${peopleLabel(params.groupSize)}.`,
    label: 'Admin Notification',
    title: 'New Tour Request',
    subtitle: 'A visitor has submitted a new request that may need grouping or guide assignment.',
    body: `
      ${paragraph(`A new tour request has been submitted through the ${BRAND_NAME} booking form.`)}
      ${detailCard('Request Details', details)}
      ${notice(
        'Date Summary',
        `${escapeHtml(`${params.totalRequestsForDate} total ${params.totalRequestsForDate === 1 ? 'request' : 'requests'}`)} for ${escapeHtml(peopleLabel(params.totalPeopleForDate))} on ${escapeHtml(params.tourDate)}.`
      )}
      ${paragraph('Use the admin dashboard to group requests, assign guides, and manage Yale submission.', { muted: true })}
    `,
    footerNote: 'Admin notification',
  })
}

export function guidePreferredRequestEmail(params: {
  guideName: string
  contactName: string
  tourDate: string
  groupSize: number
  contactEmail: string
  contactPhone: string
}) {
  const guideName = escapeHtml(params.guideName)
  const contactName = escapeHtml(params.contactName)
  const contactEmail = escapeHtml(params.contactEmail)
  const contactEmailHref = escapeAttribute(params.contactEmail)

  return emailShell({
    preheader: `${params.contactName} requested you for a Yale Art Gallery tour on ${params.tourDate}.`,
    label: 'Guide Notification',
    title: 'You Were Requested',
    subtitle: 'A visitor asked for you as their preferred guide.',
    body: `
      ${paragraph(`Dear ${guideName},`)}
      ${notice('Preferred Guide Request', `${contactName} submitted a tour request and specifically asked for you.`)}
      ${detailCard('Tour Request Details', [
        { label: 'Requested Date', value: escapeHtml(params.tourDate) },
        { label: 'Party Size', value: escapeHtml(peopleLabel(params.groupSize)) },
        { label: 'Contact', value: contactName },
        { label: 'Email', value: `<a href="mailto:${contactEmailHref}" style="color:#7a5d2f;text-decoration:underline;">${contactEmail}</a>` },
        { label: 'Phone', value: escapeHtml(params.contactPhone || 'Not provided') },
      ])}
      ${paragraph('This request is currently ungrouped. Once an admin creates a tour group for this date and assigns you, you will be able to manage the tour and submit it to Yale.')}
      ${scripture()}
    `,
    footerNote: 'Guide notification',
  })
}

# Mailjet Email Setup

## Step 1: Create Mailjet Account

1. Go to https://www.mailjet.com
2. Sign up for a free account (6,000 emails/month free)
3. Verify your email address

## Step 2: Get API Credentials

1. Log in to Mailjet dashboard
2. Go to **Account Settings** → **API Key Management**
3. Copy your:
   - **API Key** 
   - **Secret Key**

## Step 3: Add to Environment Variables

Add these to your `.env.local` file:

```env
# Mailjet Configuration
MAILJET_API_KEY=your_api_key_here
MAILJET_SECRET_KEY=your_secret_key_here
FROM_EMAIL=tours@yourdomain.com
```

**Note:** Replace `tours@yourdomain.com` with the email you want to send from.

## Step 4: Verify Sender Email (Important!)

For the free tier, you need to verify your sender email:

1. In Mailjet dashboard, go to **Account Settings** → **Sender Addresses**
2. Click **Add a Sender Address**
3. Enter your FROM_EMAIL (e.g., tours@yourdomain.com)
4. Check your inbox and click the verification link
5. Once verified, you can send emails!

## Emails That Will Be Sent

### 1. Booking Confirmation (Immediate)
- **Trigger:** When visitor submits a tour request
- **Recipient:** The person who made the booking
- **Content:** 
  - Confirmation of request received
  - Tour date and party size
  - Warning that tour is not yet confirmed
  - 3-step process explanation

### 2. Tour Confirmed (After Yale Approval)
- **Trigger:** When admin enters confirmed time from Yale
- **Recipients:** ALL participants in that tour group
- **Content:**
  - ✓ Tour is confirmed!
  - Confirmed date & time
  - Tour guide name
  - Location and parking info
  - What to bring / what not to bring

## Testing Emails

You can test by:

1. Making a test booking on your site
2. Check if confirmation email arrives
3. Then confirm a tour in admin and check if all participants get emails

## Troubleshooting

**Emails not sending?**
- Check that your Mailjet API keys are correct
- Verify your sender email address in Mailjet
- Check server logs for errors
- Make sure `NEXT_PUBLIC_APP_URL` is set correctly

**Want to use your own domain email?**
- Upgrade to paid Mailjet plan ($15/month for 30k emails)
- Or verify your domain in Mailjet (free, but requires DNS setup)


# ShineTours - Next.js + Supabase Setup

## Prerequisites
- Node.js 18+ installed
- Supabase account (https://supabase.com)
- Vercel account (for deployment)

## Step 1: Set Up Supabase

1. Go to https://supabase.com and create a new project
2. Name it "shinetours"
3. Choose a database password
4. Wait for the project to be created (~2 minutes)

## Step 2: Create Database Schema

1. In your Supabase project, go to SQL Editor
2. Copy and paste the contents of `supabase-schema.sql`
3. Run the SQL to create all tables and policies

## Step 3: Environment Variables

Create a `.env.local` file in the root directory with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Get these values from: Supabase Project Settings → API

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Step 6: Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo to Vercel dashboard for auto-deploys.

## Features

- ✅ Public booking page with calendar
- ✅ Admin dashboard for managing tours
- ✅ Guide dashboard for claiming tours
- ✅ Yale submission workflow
- ✅ Email notifications (configure in Supabase Edge Functions)
- ✅ Preferred guide selection
- ✅ Privacy-protected participant views

## Technology Stack

- **Frontend:** Next.js 15 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Styling:** Tailwind CSS
- **Hosting:** Vercel
- **Email:** Supabase Edge Functions + Resend


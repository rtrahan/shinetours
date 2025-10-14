# ShineTours - Next.js + Supabase + Vercel

**Status:** 🚧 In Progress - Converting from ASP.NET Core to Next.js

## What's Been Done

✅ **Project Setup**
- Next.js 15 with App Router
- TypeScript configured
- Tailwind CSS installed  
- Supabase client libraries installed
- Database schema created (`supabase-schema.sql`)
- Middleware for auth protection
- Type definitions for all models

## What Needs to Be Done

This is a comprehensive rewrite that will take significant time. Here's what remains:

### Core Functionality (20-30 hours of work)

1. **Home Page** (`app/page.tsx`)
   - Interactive calendar component
   - Booking form with validation
   - "Others joining" modal
   - API route for creating bookings

2. **Admin Dashboard** (`app/admin/page.tsx`)
   - Unified table with all tours
   - Filter pills
   - Sortable columns
   - Details modal
   - Yale submission modal
   - Confirmation modal
   - All CRUD operations via API routes

3. **Guide Dashboard** (`app/guide/page.tsx`)
   - Same table structure as admin
   - Claim/release tour functionality
   - View all tours
   - Submit to Yale workflow

4. **Authentication** (`app/login/page.tsx`)
   - Login page for admin/guides
   - Supabase Auth integration
   - Role-based access control
   - Session management

5. **API Routes** (`app/api/...`)
   - `/api/bookings` - Create/read bookings
   - `/api/tours` - Manage tour groups
   - `/api/tours/[id]/assign-guide` - Assign guides
   - `/api/tours/[id]/submit-yale` - Mark as submitted
   - `/api/tours/[id]/confirm` - Confirm with Yale time
   - `/api/tours/[id]/complete` - Mark complete
   - `/api/guides` - Manage guides
   - `/api/bookings/month` - Get bookings for calendar

6. **Shared Components** (`components/...`)
   - Calendar component
   - Table component with sorting
   - Filter pills component
   - Modal components
   - Button components

## Quick Start (After Setup)

### 1. Set Up Supabase

```bash
# 1. Create project at supabase.com
# 2. Run the SQL in supabase-schema.sql in SQL Editor
# 3. Get your API keys from Project Settings
```

### 2. Configure Environment

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Run Development Server

```bash
npm install
npm run dev
```

## Original .NET App

The fully functional .NET version is in `/Users/roberttrahan/Developer/ShineTours`

**Consider:** The .NET app is production-ready NOW. You could deploy it to:
- Railway ($5/month) - 5 minute deploy
- Fly.io (free tier) - 10 minute deploy  
- Azure ($13/month) - native .NET support

This Next.js rewrite will take 20-30 hours to match the current functionality.

## Decision Point

You have two paths:

**Path A: Deploy .NET Now**
- Time: 30 minutes
- Cost: $0-13/month
- App is ready to use today

**Path B: Complete Next.js Rewrite**
- Time: 20-30 hours of development
- Cost: $0 (Vercel + Supabase free tiers)
- Matches current functionality after completion

Both are valid! The Next.js foundation is laid if you want to continue building it out.

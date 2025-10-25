# Language Support Feature

## Overview
The tour booking system now includes comprehensive language support, allowing:
- **Tour guides** to specify which languages they can conduct tours in
- **Visitors** to select their preferred tour language when booking
- **Admins** to manage guide language capabilities
- **Automatic filtering** of tour guides based on the selected language

## What Was Changed

### 1. Database Schema Changes
A migration file `add-language-support.sql` has been created with the following changes:

```sql
-- Add languages column to guides table (array of text)
ALTER TABLE guides 
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY['English'];

-- Add preferred_language column to booking_requests table
ALTER TABLE booking_requests 
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'English';
```

**To apply this migration:**
1. Open your Supabase SQL Editor
2. Copy and paste the contents of `add-language-support.sql`
3. Execute the SQL

### 2. Available Languages
The system currently supports the following languages:
- English (default)
- Spanish
- French
- German
- Italian
- Chinese
- Japanese

### 3. Updated Components

#### For Tour Booking (Public-Facing)
**BookingForm Component** (`/components/BookingForm.tsx`)
- Added language selector dropdown (defaults to "English")
- Automatically filters available tour guides based on selected language
- Shows helpful message when no guides are available for a selected language
- Language selection appears before the tour guide selector

#### For Tour Guides
**Guide Profile Page** (`/app/guide/profile/page.tsx`)
- Added "Languages I Can Guide In" section with checkboxes
- Guides can select multiple languages they're comfortable conducting tours in
- Updates are saved to their profile

#### For Administrators
**Admin User Management** (`/app/admin/users/page.tsx`)
- Displays language capabilities in the user list table
- Add User modal includes language selection
- Edit User modal allows updating a guide's languages
- Languages are shown as blue badge tags

**Tour Table Component** (`/components/TourTable.tsx`)
- Displays each booking's preferred language as a blue badge
- Shows language alongside contact information in expanded row view

### 4. API Route Updates

#### `/api/bookings/route.ts` (POST)
- Now accepts `preferred_language` field (defaults to "English")
- Stores language preference with each booking request

#### `/api/guides/[id]/route.ts` (PATCH)
- Now accepts `languages` array field
- Allows updating a guide's language capabilities

#### `/api/guides/route.ts` (POST)
- Now accepts `languages` array field when creating new guides
- Defaults to `['English']` if not provided

### 5. TypeScript Type Updates
**Guide Interface** (`/lib/types.ts`)
```typescript
export interface Guide {
  // ... existing fields
  languages: string[]
}
```

**BookingRequest Interface** (`/lib/types.ts`)
```typescript
export interface BookingRequest {
  // ... existing fields
  preferred_language: string
}
```

## How to Use

### For Visitors (Public Booking Form)
1. Navigate to the booking calendar
2. Select a date
3. Fill out the booking form
4. **Select your preferred tour language** from the dropdown
5. The "Preferred Tour Guide" dropdown will automatically show only guides who speak that language
6. Complete the booking

### For Tour Guides
1. Log in to the guide dashboard
2. Click on "Profile" in the header
3. Scroll to "Languages I Can Guide In"
4. Check all languages you can conduct tours in
5. Click "Save Changes"

### For Administrators
1. Log in to the admin dashboard
2. Click on "Users" in the header
3. View language capabilities in the "Languages" column

**To add a new guide:**
1. Click "Add User"
2. Fill out the form
3. Select all languages the guide can conduct tours in
4. Click "Create User"

**To edit an existing guide:**
1. Click "Edit" next to the guide
2. Update their language selections
3. Click "Save Changes"

### Viewing Tour Languages
- **Admin/Guide Dashboards**: Expand any tour row to see booking details
- Each booking shows its preferred language as a blue badge
- This helps with tour planning and guide assignment

## Technical Details

### Language Filtering Logic
When a visitor selects a language in the booking form:
```typescript
const filteredGuides = availableGuides.filter(guide => 
  guide.languages && guide.languages.includes(preferredLanguage)
)
```

### Default Values
- New guides default to `['English']` if no languages are specified
- New bookings default to `'English'` if no language is selected
- Existing records are updated to English when the migration runs

### Database Performance
- GIN index on `guides.languages` for efficient array queries
- Standard index on `booking_requests.preferred_language` for filtering

## Migration Notes

### For Existing Data
When you run the migration:
1. All existing guides will be set to speak English by default
2. All existing bookings will be marked as English by default
3. Guides should update their profiles to reflect their actual language capabilities

### Post-Migration Tasks
1. ✅ Run the SQL migration
2. ✅ Have all tour guides update their language preferences in their profiles
3. ✅ Test the booking form with different language selections
4. ✅ Verify that guide filtering works correctly

## Future Enhancements

Potential improvements for this feature:
- Add more languages as needed
- Add translation support for the entire interface
- Send confirmation emails in the customer's preferred language
- Add language statistics in the admin dashboard
- Filter tours by language in the admin dashboard

## Support

If you encounter any issues with the language support feature:
1. Check that the database migration was applied successfully
2. Verify that guides have set their language preferences
3. Check browser console for any JavaScript errors
4. Review the API responses in the Network tab

---

**Last Updated:** October 25, 2025
**Feature Version:** 1.0.0


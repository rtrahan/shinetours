-- Create Supabase Auth User and Guide Record
-- Run this entire script in Supabase SQL Editor

-- 1. First, check if user already exists
SELECT id, email, created_at, email_confirmed_at 
FROM auth.users 
WHERE email = 'roberttrahan@me.com';

-- 2. If user doesn't exist, create auth user
-- Note: Replace 'your-raw-user-meta-data' with actual password hash
-- For now, you MUST use the Supabase Dashboard to create the user properly

-- 3. Create or update the guide record
INSERT INTO guides (
  email,
  first_name,
  last_name,
  phone,
  is_admin,
  is_active,
  password_hash
) VALUES (
  'roberttrahan@me.com',
  'Robert',
  'Trahan',
  '3377390588',
  true,  -- Admin
  true,  -- Active
  ''     -- Empty - using Supabase Auth
) ON CONFLICT (email) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  phone = EXCLUDED.phone,
  is_admin = EXCLUDED.is_admin,
  is_active = EXCLUDED.is_active;

-- 4. Verify both records exist
SELECT 'Auth User:' as type, id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'roberttrahan@me.com'
UNION ALL
SELECT 'Guide Record:' as type, id::text, email, created_at::timestamptz 
FROM guides 
WHERE email = 'roberttrahan@me.com';


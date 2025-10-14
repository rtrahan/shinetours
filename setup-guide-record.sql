-- Setup Guide Record for Supabase Auth User
-- 
-- STEP 1: Create auth user via Supabase Dashboard first
-- Go to: Authentication → Users → "Add user" → "Create new user"
-- Email: roberttrahan@me.com
-- Password: Bd1192002!
-- Auto Confirm User: YES (check this box)
-- Click "Create user"
--
-- STEP 2: Then run this SQL to create the guide record

-- Insert guide record (without password_hash since we're using Supabase Auth)
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
  ''     -- Empty since we use Supabase Auth
) ON CONFLICT (email) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  phone = EXCLUDED.phone,
  is_admin = EXCLUDED.is_admin,
  is_active = EXCLUDED.is_active;

-- Verify the guide was created
SELECT id, email, first_name, last_name, is_admin, is_active, created_at
FROM guides
WHERE email = 'roberttrahan@me.com';


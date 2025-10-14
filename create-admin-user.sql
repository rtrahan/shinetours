-- Create first admin user for ShineTours
-- Run this in Supabase SQL Editor after running supabase-schema.sql

INSERT INTO guides (
  email,
  password_hash,
  first_name,
  last_name,
  phone,
  is_admin,
  is_active
) VALUES (
  'roberttrahan@me.com',           -- Change this to your email
  'Bd1192002!',                     -- Change this to your password (in production, this should be hashed!)
  'Admin',                           -- Change to your first name
  'User',                            -- Change to your last name
  '3377390588',                        -- Change to your phone
  true,                              -- This makes them an admin
  true                               -- This makes them active
);

-- Verify the user was created
SELECT id, email, first_name, last_name, is_admin, is_active, created_at
FROM guides
WHERE email = 'roberttrahan@me.com';


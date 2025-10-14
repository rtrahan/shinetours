-- Clean up and fix tour guides

-- 1. Deactivate "Cancel Request" (not a real person)
UPDATE guides 
SET is_active = false 
WHERE first_name = 'Cancel' AND last_name = 'Request';

-- 2. Delete "Kevin Kevin" duplicate (if exists)
DELETE FROM guides 
WHERE first_name = 'Kevin' AND last_name = 'Kevin';

-- 3. Update "Seth Seth" to "Seth McNeely"
UPDATE guides 
SET last_name = 'McNeely'
WHERE first_name = 'Seth' AND last_name = 'Seth';

-- Or if Seth exists as just "Seth", update it:
UPDATE guides 
SET last_name = 'McNeely',
    email = 'seth.mcneely@shinetours.com'
WHERE first_name = 'Seth' AND (last_name = 'Seth' OR last_name = '');

-- 4. Add Heather Trahan (if not exists)
INSERT INTO guides (email, first_name, last_name, is_admin, is_active, password_hash)
VALUES ('heather.trahan@shinetours.com', 'Heather', 'Trahan', false, true, '')
ON CONFLICT (email) DO NOTHING;

-- 5. Add Alfredo Perez (if not exists)
INSERT INTO guides (email, first_name, last_name, is_admin, is_active, password_hash)
VALUES ('alfredo.perez@shinetours.com', 'Alfredo', 'Perez', false, true, '')
ON CONFLICT (email) DO NOTHING;

-- 6. Add Bill Sappo (if not exists)
INSERT INTO guides (email, first_name, last_name, is_admin, is_active, password_hash)
VALUES ('bill.sappo@shinetours.com', 'Bill', 'Sappo', false, true, '')
ON CONFLICT (email) DO NOTHING;

-- Verify the final list of active guides
SELECT id, first_name, last_name, email, is_admin, is_active 
FROM guides 
WHERE is_active = true
ORDER BY first_name, last_name;


-- Deactivate the "Cancel Request" guide (not a real person)
UPDATE guides 
SET is_active = false 
WHERE first_name = 'Cancel' AND last_name = 'Request';

-- Verify
SELECT id, first_name, last_name, email, is_active 
FROM guides 
WHERE first_name = 'Cancel' OR last_name = 'Request';


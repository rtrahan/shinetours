-- Remove the duplicate Seth with wrong email
UPDATE guides 
SET is_active = false 
WHERE email = 'seth.seth@shinetours.com';

-- Verify - should only see one active Seth McNeely
SELECT first_name, last_name, email, is_active 
FROM guides 
WHERE first_name = 'Seth'
ORDER BY is_active DESC, email;


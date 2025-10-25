-- Add language support to guides and booking_requests tables

-- Add languages column to guides table (array of text)
ALTER TABLE guides 
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY['English'];

-- Add preferred_language column to booking_requests table
ALTER TABLE booking_requests 
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'English';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_guides_languages ON guides USING GIN (languages);
CREATE INDEX IF NOT EXISTS idx_booking_requests_preferred_language ON booking_requests(preferred_language);

-- Update existing guides to have English as default language
UPDATE guides 
SET languages = ARRAY['English'] 
WHERE languages IS NULL OR languages = '{}';

-- Update existing booking requests to have English as default language
UPDATE booking_requests 
SET preferred_language = 'English' 
WHERE preferred_language IS NULL;


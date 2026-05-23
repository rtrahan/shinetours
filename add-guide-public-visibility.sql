-- Add separate public visibility for guide selection.
-- Active users can still sign in and be assigned internally when hidden.

ALTER TABLE guides
ADD COLUMN IF NOT EXISTS public_visible BOOLEAN DEFAULT TRUE;

UPDATE guides
SET public_visible = TRUE
WHERE public_visible IS NULL;

CREATE INDEX IF NOT EXISTS idx_guides_public_visible
ON guides(public_visible);

-- Add date-only guide availability.
-- Availability is informational for public booking and does not block requests.

CREATE TABLE IF NOT EXISTS guide_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guide_id UUID NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
  available_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (guide_id, available_date)
);

CREATE INDEX IF NOT EXISTS idx_guide_availability_guide_id
ON guide_availability(guide_id);

CREATE INDEX IF NOT EXISTS idx_guide_availability_available_date
ON guide_availability(available_date);

ALTER TABLE guide_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view guide availability" ON guide_availability;
CREATE POLICY "Anyone can view guide availability"
ON guide_availability FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Enable guide availability management" ON guide_availability;
CREATE POLICY "Enable guide availability management"
ON guide_availability FOR ALL
USING (true)
WITH CHECK (true);

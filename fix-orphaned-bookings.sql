-- Fix orphaned bookings (bookings not assigned to any tour group)
-- Run this in Supabase SQL Editor

-- For each date, assign orphaned bookings to the first available tour group
UPDATE booking_requests br
SET tour_group_id = (
  SELECT tg.id
  FROM tour_groups tg
  WHERE tg.requested_date = br.requested_date
  ORDER BY tg.created_at
  LIMIT 1
)
WHERE tour_group_id IS NULL
  AND EXISTS (
    SELECT 1 FROM tour_groups tg 
    WHERE tg.requested_date = br.requested_date
  );

-- Verify the fix
SELECT 
  br.requested_date,
  br.contact_name,
  br.group_size,
  br.tour_group_id,
  tg.status
FROM booking_requests br
LEFT JOIN tour_groups tg ON br.tour_group_id = tg.id
WHERE br.requested_date >= CURRENT_DATE
ORDER BY br.requested_date, br.created_at;


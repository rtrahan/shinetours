-- Supabase Database Schema for ShineTours

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Guides table (tour guides and admins)
CREATE TABLE guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tour groups table
CREATE TABLE tour_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requested_date DATE NOT NULL,
  confirmed_datetime TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Ready', 'PendingYale', 'Confirmed', 'Completed')),
  guide_id UUID REFERENCES guides(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Booking requests table
CREATE TABLE booking_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requested_date DATE NOT NULL,
  group_size INTEGER NOT NULL CHECK (group_size >= 1 AND group_size <= 15),
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  preferred_guide_id UUID REFERENCES guides(id) ON DELETE SET NULL,
  tour_group_id UUID REFERENCES tour_groups(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tour settings table
CREATE TABLE tour_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  available_days_of_week TEXT,
  updated_by_user_id UUID REFERENCES guides(id),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tour_groups_requested_date ON tour_groups(requested_date);
CREATE INDEX idx_tour_groups_status ON tour_groups(status);
CREATE INDEX idx_tour_groups_guide_id ON tour_groups(guide_id);
CREATE INDEX idx_booking_requests_requested_date ON booking_requests(requested_date);
CREATE INDEX idx_booking_requests_tour_group_id ON booking_requests(tour_group_id);
CREATE INDEX idx_booking_requests_preferred_guide_id ON booking_requests(preferred_guide_id);

-- Enable Row Level Security
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for guides
CREATE POLICY "Guides can view all guides" ON guides FOR SELECT USING (true);
CREATE POLICY "Admins can manage guides" ON guides FOR ALL USING (
  EXISTS (
    SELECT 1 FROM guides WHERE id = auth.uid() AND is_admin = true
  )
);

-- RLS Policies for tour_groups
CREATE POLICY "Anyone can view tour groups" ON tour_groups FOR SELECT USING (true);
CREATE POLICY "Staff can manage tour groups" ON tour_groups FOR ALL USING (
  EXISTS (
    SELECT 1 FROM guides WHERE id = auth.uid() AND is_active = true
  )
);

-- RLS Policies for booking_requests
CREATE POLICY "Anyone can create booking requests" ON booking_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view booking requests" ON booking_requests FOR SELECT USING (true);
CREATE POLICY "Staff can manage booking requests" ON booking_requests FOR ALL USING (
  EXISTS (
    SELECT 1 FROM guides WHERE id = auth.uid() AND is_active = true
  )
);

-- RLS Policies for tour_settings
CREATE POLICY "Anyone can view tour settings" ON tour_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage tour settings" ON tour_settings FOR ALL USING (
  EXISTS (
    SELECT 1 FROM guides WHERE id = auth.uid() AND is_admin = true
  )
);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_guides_updated_at BEFORE UPDATE ON guides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_tour_groups_updated_at BEFORE UPDATE ON tour_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_booking_requests_updated_at BEFORE UPDATE ON booking_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


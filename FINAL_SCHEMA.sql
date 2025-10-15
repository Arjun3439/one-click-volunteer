-- Do Good Dash - Final Supabase Schema
-- This is a single, consolidated script to set up your entire database.
-- Recommended: Run this in a new, clean Supabase project.

-- 1. Enable pgcrypto for UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Volunteers Table
-- Note: The old 'skills' array column has been removed.
CREATE TABLE IF NOT EXISTS volunteers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  bio TEXT,
  hourly_rate INTEGER DEFAULT 500,
  availability TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  profile_photo_url TEXT,
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_bookings INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Skills Table
CREATE TABLE IF NOT EXISTS skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- 4. Volunteer-Skill Mapping Table (Join Table)
CREATE TABLE IF NOT EXISTS volunteer_skills (
  volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  CONSTRAINT volunteer_skills_pkey PRIMARY KEY (volunteer_id, skill_id)
);

-- 5. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  volunteer_id UUID REFERENCES volunteers(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration INTEGER NOT NULL, -- in hours
  status TEXT CHECK (status IN ('confirmed', 'pending', 'completed', 'cancelled')) DEFAULT 'pending',
  total_amount INTEGER NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  user_role TEXT NOT NULL,
  feedback_text TEXT NOT NULL,
  rating INTEGER,
  user_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Storage bucket for volunteer photos
INSERT INTO storage.buckets (id, name, public)
SELECT 'volunteer-photos', 'volunteer-photos', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'volunteer-photos'
);

-- 8. Enable Row Level Security (RLS) on all tables
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- 9. Policies for Volunteers
DROP POLICY IF EXISTS "Users can view all volunteers" ON volunteers;
DROP POLICY IF EXISTS "Volunteers can insert their own profile" ON volunteers;
DROP POLICY IF EXISTS "Volunteers can update their own profile" ON volunteers;
DROP POLICY IF EXISTS "Volunteers can delete their own profile" ON volunteers;

CREATE POLICY "Users can view all volunteers"
  ON volunteers FOR SELECT USING (true);

CREATE POLICY "Volunteers can insert their own profile"
  ON volunteers FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Volunteers can update their own profile"
  ON volunteers FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Volunteers can delete their own profile"
  ON volunteers FOR DELETE USING (auth.uid() = user_id);

-- 10. Policies for Skills
DROP POLICY IF EXISTS "Users can view all skills" ON skills;
CREATE POLICY "Users can view all skills" ON skills FOR SELECT USING (true);

-- 11. Policies for Volunteer Skills
DROP POLICY IF EXISTS "Users can view volunteer skills" ON volunteer_skills;
DROP POLICY IF EXISTS "Volunteers can manage their own skills" ON volunteer_skills;

CREATE POLICY "Users can view volunteer skills"
  ON volunteer_skills FOR SELECT USING (true);

CREATE POLICY "Volunteers can manage their own skills"
  ON volunteer_skills FOR ALL USING (auth.uid() = (SELECT user_id FROM volunteers WHERE id = volunteer_id));

-- 12. Policies for Bookings (Corrected for security)
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Clients can insert bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON bookings;

CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT USING (auth.uid() = client_id OR auth.uid() = (SELECT user_id FROM volunteers WHERE id = volunteer_id));

CREATE POLICY "Clients can insert bookings"
  ON bookings FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = (SELECT user_id FROM volunteers WHERE id = volunteer_id));

CREATE POLICY "Users can delete their own bookings"
  ON bookings FOR DELETE USING (auth.uid() = client_id OR auth.uid() = (SELECT user_id FROM volunteers WHERE id = volunteer_id));

-- 13. Policies for Feedback
DROP POLICY IF EXISTS "Users can manage their own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can view all feedback" ON feedback;

CREATE POLICY "Users can manage their own feedback"
  ON feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all feedback"
  ON feedback FOR SELECT USING (true);

-- 14. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_volunteers_user_id ON volunteers(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_volunteer_id ON bookings(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_skills_skill_id ON volunteer_skills(skill_id);

-- 15. Function + Trigger for updated_at auto-update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_volunteers_updated_at ON volunteers;
CREATE TRIGGER update_volunteers_updated_at
BEFORE UPDATE ON volunteers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 16. RPC function for updating skills
CREATE OR REPLACE FUNCTION update_volunteer_skills(p_volunteer_id UUID, p_skill_names TEXT[])
RETURNS void AS $$
DECLARE
  skill_name TEXT;
  v_skill_id UUID;
BEGIN
  DELETE FROM volunteer_skills WHERE volunteer_id = p_volunteer_id;

  IF p_skill_names IS NOT NULL THEN
    FOREACH skill_name IN ARRAY p_skill_names
    LOOP
      INSERT INTO skills (name)
      VALUES (skill_name)
      ON CONFLICT (name) DO NOTHING;

      SELECT id INTO v_skill_id FROM skills WHERE name = skill_name;

      INSERT INTO volunteer_skills (volunteer_id, skill_id)
      VALUES (p_volunteer_id, v_skill_id)
      ON CONFLICT (volunteer_id, skill_id) DO NOTHING;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql;

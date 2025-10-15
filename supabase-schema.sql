-- Supabase Database Schema for One-Click-Volunteer
-- Run this in your Supabase SQL Editor

-- Create volunteers table
CREATE TABLE volunteers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  bio TEXT,
  hourly_rate INTEGER DEFAULT 500,
  availability TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  skills TEXT[] DEFAULT '{}',
  image_url TEXT,
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_bookings INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE bookings (
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

-- Create storage bucket for volunteer photos
INSERT INTO storage.buckets (id, name, public) VALUES ('volunteer-photos', 'volunteer-photos', true);

-- Set up Row Level Security (RLS)
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for volunteers table
CREATE POLICY "Users can view all volunteers" ON volunteers FOR SELECT USING (true);
CREATE POLICY "Volunteers can insert their own profile" ON volunteers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Volunteers can update their own profile" ON volunteers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Volunteers can delete their own profile" ON volunteers FOR DELETE USING (auth.uid() = user_id);

-- Create policies for bookings table
CREATE POLICY "Users can view their own bookings" ON bookings FOR SELECT USING (auth.uid() = client_id OR auth.uid() IN (SELECT user_id FROM volunteers WHERE id = volunteer_id));
CREATE POLICY "Clients can insert bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Users can update their own bookings" ON bookings FOR UPDATE USING (auth.uid() = client_id OR auth.uid() IN (SELECT user_id FROM volunteers WHERE id = volunteer_id));
CREATE POLICY "Users can delete their own bookings" ON bookings FOR DELETE USING (auth.uid() = client_id OR auth.uid() IN (SELECT user_id FROM volunteers WHERE id = volunteer_id));


-- Create indexes for better performance
CREATE INDEX idx_volunteers_user_id ON volunteers(user_id);
CREATE INDEX idx_volunteers_skills ON volunteers USING GIN(skills);
CREATE INDEX idx_bookings_volunteer_id ON bookings(volunteer_id);
CREATE INDEX idx_bookings_client_id ON bookings(client_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_volunteers_updated_at BEFORE UPDATE ON volunteers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
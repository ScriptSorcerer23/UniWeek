// SUPABASE CONFIGURATION
// Copy this file to 'supabase-config.ts' and fill in your actual values

export const SUPABASE_URL = 'https://your-project.supabase.co';
export const SUPABASE_ANON_KEY = 'your-anon-key-here';

/*
SETUP INSTRUCTIONS:

1. Go to https://supabase.com and create a new project
2. Once created, go to Settings > API
3. Copy the "Project URL" and paste it above as SUPABASE_URL
4. Copy the "anon/public" key and paste it above as SUPABASE_ANON_KEY
5. Rename this file to 'supabase-config.ts' (remove .example)

DATABASE SETUP:

Run the following SQL in Supabase SQL Editor to create your tables:

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'society')),
  society_type TEXT CHECK (society_type IN ('ACM', 'CLS', 'CSS')),
  registered_events TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  time TEXT NOT NULL,
  venue TEXT NOT NULL,
  society TEXT NOT NULL CHECK (society IN ('ACM', 'CLS', 'CSS')),
  category TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  registered_students TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registrations table
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  attended BOOLEAN DEFAULT FALSE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  UNIQUE(user_id, event_id)
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  sent_by UUID REFERENCES users(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Events policies
CREATE POLICY "Anyone can view events" ON events FOR SELECT USING (true);
CREATE POLICY "Society can create events" ON events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'society')
);
CREATE POLICY "Society can update own events" ON events FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Society can delete own events" ON events FOR DELETE USING (created_by = auth.uid());

-- Registrations policies
CREATE POLICY "Users can view own registrations" ON registrations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Students can create registrations" ON registrations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Students can update own registrations" ON registrations FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Students can delete own registrations" ON registrations FOR DELETE USING (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Anyone can view notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Society can send notifications" ON notifications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'society')
);
*/

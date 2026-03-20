CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'runner',
  strava_connected BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT users_role_check CHECK (role IN ('runner', 'organizer'))
);

CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS run_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  club_name VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  start_lat DECIMAL(10,8) NOT NULL,
  start_lng DECIMAL(11,8) NOT NULL,
  end_lat DECIMAL(10,8) NOT NULL,
  end_lng DECIMAL(11,8) NOT NULL,
  start_address TEXT NOT NULL,
  end_address TEXT NOT NULL,
  event_date TIMESTAMP NOT NULL,
  distance_km DECIMAL(6,2) NOT NULL,
  estimated_minutes INTEGER NOT NULL,
  max_attendees INTEGER,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS run_attendees (
  run_id UUID REFERENCES run_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (run_id, user_id)
);
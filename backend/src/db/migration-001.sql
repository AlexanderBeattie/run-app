-- KLUB Migration: Club membership, run tags, geocoding support
-- Run this against your database after the initial schema.sql

-- Club members junction table
CREATE TABLE IF NOT EXISTS club_members (
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (club_id, user_id)
);

-- Club extras
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS pace VARCHAR(20);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Run extras
ALTER TABLE run_events ADD COLUMN IF NOT EXISTS pace VARCHAR(20);
ALTER TABLE run_events ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
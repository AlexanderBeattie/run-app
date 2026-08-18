-- Migration 005: Add Strava OAuth and activity fields
-- Run with: psql $DATABASE_URL -f backend/src/db/migration-005.sql

-- Strava OAuth fields on users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS strava_athlete_id      BIGINT UNIQUE,
  ADD COLUMN IF NOT EXISTS strava_access_token     TEXT,
  ADD COLUMN IF NOT EXISTS strava_refresh_token    TEXT,
  ADD COLUMN IF NOT EXISTS strava_token_expires_at BIGINT;

-- strava_athlete_id: Strava's numeric athlete ID (unique per user)
-- strava_access_token: OAuth access token (short-lived; refresh before use)
-- strava_refresh_token: OAuth refresh token (long-lived)
-- strava_token_expires_at: Unix timestamp (seconds) when access token expires

-- Strava activity fields on run_attendees
ALTER TABLE run_attendees
  ADD COLUMN IF NOT EXISTS strava_activity_id   BIGINT,
  ADD COLUMN IF NOT EXISTS strava_distance      FLOAT,
  ADD COLUMN IF NOT EXISTS strava_moving_time   INTEGER,
  ADD COLUMN IF NOT EXISTS strava_average_speed FLOAT,
  ADD COLUMN IF NOT EXISTS strava_polyline      TEXT;

-- strava_activity_id: Strava activity ID linked to this run attendance
-- strava_distance: distance in meters as reported by Strava
-- strava_moving_time: moving time in seconds
-- strava_average_speed: average speed in m/s
-- strava_polyline: Google-encoded polyline for route visualization

-- Strava Webhooks table for automated activity syncing
CREATE TABLE IF NOT EXISTS strava_webhooks (
  id              BIGSERIAL    PRIMARY KEY,
  user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_type     VARCHAR(20)  NOT NULL,  -- 'activity' | 'athlete'
  object_id       BIGINT       NOT NULL,  -- Strava activity or athlete ID
  aspect_type     VARCHAR(20)  NOT NULL,  -- 'create' | 'update' | 'delete'
  event_time      BIGINT       NOT NULL,  -- Unix timestamp from Strava
  subscription_id BIGINT,                 -- Strava webhook subscription ID
  updates         JSONB,                  -- key/value pairs from update events
  processed       BOOLEAN      NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Indexes for Strava lookups
CREATE INDEX IF NOT EXISTS idx_users_strava_athlete_id             ON users(strava_athlete_id);
CREATE INDEX IF NOT EXISTS idx_run_attendees_strava_activity_id    ON run_attendees(strava_activity_id);
CREATE INDEX IF NOT EXISTS idx_strava_webhooks_user_id             ON strava_webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_strava_webhooks_object_id           ON strava_webhooks(object_id);
CREATE INDEX IF NOT EXISTS idx_strava_webhooks_processed           ON strava_webhooks(processed) WHERE processed = false;

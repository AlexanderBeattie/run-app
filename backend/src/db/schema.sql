-- KLUB — Canonical Database Schema
-- Includes all migrations (001–004). Use this for fresh installs.
-- Run: psql $DATABASE_URL -f backend/src/db/schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_name  VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'runner',
  strava_connected BOOLEAN   DEFAULT false,
  created_at    TIMESTAMP    DEFAULT NOW(),
  CONSTRAINT users_role_check CHECK (role IN ('runner', 'organizer'))
);

-- ─── Clubs ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clubs (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(100) NOT NULL,
  description  TEXT,
  owner_id     UUID         REFERENCES users(id) ON DELETE CASCADE,
  member_count INTEGER      DEFAULT 0,
  logo_url     TEXT,
  city         VARCHAR(100),
  pace         VARCHAR(20),
  tags         TEXT[]       DEFAULT '{}',
  created_at   TIMESTAMP    DEFAULT NOW()
);

-- ─── Club Members ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS club_members (
  club_id   UUID        REFERENCES clubs(id) ON DELETE CASCADE,
  user_id   UUID        REFERENCES users(id) ON DELETE CASCADE,
  role      VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP   DEFAULT NOW(),
  PRIMARY KEY (club_id, user_id),
  CONSTRAINT club_members_role_check CHECK (role IN ('member', 'organizer', 'owner'))
);

-- ─── Run Events ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS run_events (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id           UUID          REFERENCES clubs(id) ON DELETE SET NULL,
  club_name         VARCHAR(100)  NOT NULL,
  title             VARCHAR(200)  NOT NULL,
  start_lat         DECIMAL(10,8) NOT NULL,
  start_lng         DECIMAL(11,8) NOT NULL,
  end_lat           DECIMAL(10,8) NOT NULL,
  end_lng           DECIMAL(11,8) NOT NULL,
  start_address     TEXT          NOT NULL,
  end_address       TEXT          NOT NULL,
  event_date        TIMESTAMP     NOT NULL,
  distance_km       DECIMAL(6,2)  NOT NULL,
  estimated_minutes INTEGER       NOT NULL,
  max_attendees     INTEGER,
  notes             TEXT,
  status            VARCHAR(20)   DEFAULT 'active',
  pace              VARCHAR(20),
  tags              TEXT[]        DEFAULT '{}',
  run_type          VARCHAR(30)   DEFAULT NULL,
  created_by        UUID          REFERENCES users(id),
  created_at        TIMESTAMP     DEFAULT NOW(),
  CONSTRAINT run_events_status_check   CHECK (status   IN ('active', 'cancelled', 'completed')),
  CONSTRAINT run_events_run_type_check CHECK (run_type IN ('club_run', 'parkrun_style', 'one_off_race', 'training_group', 'trail_run') OR run_type IS NULL)
);

-- ─── Run Attendees ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS run_attendees (
  run_id    UUID      REFERENCES run_events(id) ON DELETE CASCADE,
  user_id   UUID      REFERENCES users(id)      ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (run_id, user_id)
);

-- ─── Refresh Tokens ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT        NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Password Reset Tokens ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          SERIAL      PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT        NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_clubs_owner_id                    ON clubs(owner_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user_id              ON club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_run_events_club_id                ON run_events(club_id);
CREATE INDEX IF NOT EXISTS idx_run_events_created_by             ON run_events(created_by);
CREATE INDEX IF NOT EXISTS idx_run_events_event_date             ON run_events(event_date);
CREATE INDEX IF NOT EXISTS idx_run_events_status                 ON run_events(status);
CREATE INDEX IF NOT EXISTS idx_run_attendees_user_id             ON run_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id            ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash         ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash  ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id     ON password_reset_tokens(user_id);

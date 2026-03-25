-- Migration 004: Add run_type to run_events
-- Run with: psql $DATABASE_URL -f backend/src/db/migration-004.sql

ALTER TABLE run_events
  ADD COLUMN IF NOT EXISTS run_type VARCHAR(30) DEFAULT NULL;

-- Valid values: 'club_run' | 'parkrun_style' | 'one_off_race' | 'training_group' | 'trail_run'

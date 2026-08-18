-- Migration 007: Standardise pace data to PaceCategory values
-- Valid values: 'easy' | 'social' | 'moderate' | 'tempo' | 'fast'
-- clubs.pace already has a CHECK constraint (added in schema.sql).
-- run_events.pace has no constraint yet — adding it here.

BEGIN;

-- ── clubs ──────────────────────────────────────────────────────────────────
UPDATE clubs SET pace = 'fast'     WHERE pace = '5:00';
UPDATE clubs SET pace = 'tempo'    WHERE pace = '5:30';
UPDATE clubs SET pace = 'moderate' WHERE pace = '6:00';
UPDATE clubs SET pace = 'social'   WHERE pace = '7:00';
UPDATE clubs SET pace = 'easy'     WHERE pace = '8:00';
-- Catch any remaining non-conforming values (default to 'social')
UPDATE clubs
   SET pace = 'social'
 WHERE pace IS NOT NULL
   AND pace NOT IN ('easy', 'social', 'moderate', 'tempo', 'fast');

-- ── run_events ─────────────────────────────────────────────────────────────
UPDATE run_events SET pace = 'fast'     WHERE pace = '5:00';
UPDATE run_events SET pace = 'tempo'    WHERE pace = '5:30';
UPDATE run_events SET pace = 'moderate' WHERE pace = '6:00';
UPDATE run_events SET pace = 'social'   WHERE pace = '7:00';
UPDATE run_events SET pace = 'easy'     WHERE pace = '8:00';
-- Catch any remaining non-conforming values
UPDATE run_events
   SET pace = 'social'
 WHERE pace IS NOT NULL
   AND pace NOT IN ('easy', 'social', 'moderate', 'tempo', 'fast');

-- Add CHECK constraint to run_events.pace (mirrors the one on clubs)
ALTER TABLE run_events
  ADD CONSTRAINT run_events_pace_check
  CHECK (pace IN ('easy', 'social', 'moderate', 'tempo', 'fast') OR pace IS NULL);

COMMIT;

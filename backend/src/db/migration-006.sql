-- Migration 006: Add color column to clubs
-- Run with: psql $DATABASE_URL -f backend/src/db/migration-006.sql

ALTER TABLE clubs ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#1D9E75';

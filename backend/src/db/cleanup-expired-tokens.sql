-- Cleanup: remove expired refresh tokens
-- Run periodically (e.g. daily via cron or Render cron job):
--   psql $DATABASE_URL -f backend/src/db/cleanup-expired-tokens.sql
--
-- Cron example (daily at 3am):
--   0 3 * * * psql $DATABASE_URL -f /app/backend/src/db/cleanup-expired-tokens.sql

DELETE FROM refresh_tokens WHERE expires_at < NOW();

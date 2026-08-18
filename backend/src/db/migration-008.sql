-- Migration 008: Add run_comments table for run chat feature

CREATE TABLE IF NOT EXISTS run_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES run_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_run_comments_run_id ON run_comments(run_id);
CREATE INDEX IF NOT EXISTS idx_run_comments_user_id ON run_comments(user_id);

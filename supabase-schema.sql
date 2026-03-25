-- ============================================================
-- CE Credit Tracker — Supabase Schema
-- Run this in the Supabase SQL Editor for project:
--   https://tnlxzzjxqourhjvunuxi.supabase.co
-- ============================================================

-- 1. Extend existing app_users table with profile fields
ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS name       TEXT,
  ADD COLUMN IF NOT EXISTS job_title  TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS tags       TEXT[] DEFAULT '{}';

-- 2. Credit Types — custom credit categories per org
CREATE TABLE IF NOT EXISTS credit_types (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User Goals — annual credit targets per learner per credit type
CREATE TABLE IF NOT EXISTS user_goals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        TEXT NOT NULL REFERENCES app_users(user_id) ON DELETE CASCADE,
  credit_type_id UUID NOT NULL REFERENCES credit_types(id) ON DELETE CASCADE,
  target_amount  NUMERIC(10, 2) NOT NULL CHECK (target_amount > 0),
  year           INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, credit_type_id, year)
);

-- 4. Goal Rules — rule-based auto-assignment
CREATE TABLE IF NOT EXISTS goal_rules (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_field     TEXT NOT NULL CHECK (user_field IN ('job_title','department','role','tag')),
  field_value    TEXT NOT NULL,
  credit_type_id UUID NOT NULL REFERENCES credit_types(id) ON DELETE CASCADE,
  target_amount  NUMERIC(10, 2) NOT NULL CHECK (target_amount > 0),
  year           INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Credit Entries — actual credits earned by learners
CREATE TABLE IF NOT EXISTS credit_entries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        TEXT NOT NULL REFERENCES app_users(user_id) ON DELETE CASCADE,
  credit_type_id UUID NOT NULL REFERENCES credit_types(id) ON DELETE CASCADE,
  amount         NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  course_name    TEXT NOT NULL,
  earned_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  source         TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','course','external')),
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_goals_user_year    ON user_goals (user_id, year);
CREATE INDEX IF NOT EXISTS idx_credit_entries_user_year ON credit_entries (user_id, earned_date);
CREATE INDEX IF NOT EXISTS idx_goal_rules_year          ON goal_rules (year);

-- ── Row Level Security ─────────────────────────────────────────────────────
-- Enable RLS on all new tables
ALTER TABLE credit_types   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals     ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_rules     ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_entries ENABLE ROW LEVEL SECURITY;

-- Allow full access via service role (used by the app's anon key with server-side logic)
-- For this app pattern (SHA-256 auth, not Supabase Auth), use permissive policies
-- scoped to the anon role so the Angular app can read/write.
-- IMPORTANT: Replace with tighter policies once Supabase Auth is integrated.

CREATE POLICY "allow_all_credit_types"   ON credit_types   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_user_goals"     ON user_goals     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_goal_rules"     ON goal_rules     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_credit_entries" ON credit_entries FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── Seed: sample credit types ──────────────────────────────────────────────
INSERT INTO credit_types (name, description) VALUES
  ('CEUs',             'Continuing Education Units — general'),
  ('Safety Credits',   'OSHA and workplace safety training'),
  ('Ethics Hours',     'Professional ethics and compliance'),
  ('Clinical Hours',   'Clinical practice and patient care'),
  ('External Credits', 'Credits earned outside the LMS')
ON CONFLICT DO NOTHING;

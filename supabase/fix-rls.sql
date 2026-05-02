-- =============================================================================
-- fix-rls.sql — Run this in Supabase Dashboard → SQL Editor
--
-- Fixes:
--   1. Adds get_own_profile() SECURITY DEFINER — used as a fallback in
--      ensureProfile() when the direct SELECT is blocked by RLS
--   2. Drops and recreates ALL profiles RLS policies (clean slate)
-- =============================================================================

-- ── get_own_profile ───────────────────────────────────────────────────────────
-- SECURITY DEFINER runs as the DB owner, so it bypasses RLS entirely.
-- auth.uid() still reads from the calling user's JWT, so it correctly
-- returns only the authenticated user's own profile.
-- Used by ensureProfile() as a diagnostic: if this returns a row but the
-- direct SELECT returns nothing, it means the SELECT RLS policy is missing.
CREATE OR REPLACE FUNCTION get_own_profile()
RETURNS SETOF profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM profiles WHERE id = auth.uid();
$$;


-- ── RLS policies for profiles ─────────────────────────────────────────────────

-- Enable RLS (idempotent)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on profiles so there are no conflicts
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname
    FROM   pg_policies
    WHERE  schemaname = 'public' AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', r.policyname);
  END LOOP;
END $$;

-- SELECT own profile
CREATE POLICY "profiles_own_read" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- SELECT profiles of people in the same group (member list display)
CREATE POLICY "profiles_group_member_read" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT gm.user_id FROM group_members gm
      WHERE gm.group_id IN (
        SELECT gm2.group_id FROM group_members gm2 WHERE gm2.user_id = auth.uid()
      )
    )
  );

-- INSERT own profile only
CREATE POLICY "profiles_own_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- UPDATE own profile only
CREATE POLICY "profiles_own_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);


-- ── Verification query ────────────────────────────────────────────────────────
-- Run this after the above to confirm the policies were created:
--
-- SELECT policyname, cmd, qual
-- FROM   pg_policies
-- WHERE  schemaname = 'public' AND tablename = 'profiles'
-- ORDER  BY policyname;
--
-- Expected rows:
--   profiles_group_member_read | SELECT | ...
--   profiles_own_insert        | INSERT | (auth.uid() = id)
--   profiles_own_read          | SELECT | (auth.uid() = id)
--   profiles_own_update        | UPDATE | (auth.uid() = id)

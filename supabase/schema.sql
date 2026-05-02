-- ================================================================
-- CarShare Family — Supabase Schema
-- Run this entire file in the Supabase SQL Editor (Dashboard → SQL)
-- ================================================================

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- TABLES
-- ================================================================

-- User profiles (one per auth.users row)
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT         NOT NULL,
  profile_image TEXT                    DEFAULT '😀',
  color         TEXT         NOT NULL   DEFAULT '#22C55E',
  created_at    TIMESTAMPTZ  NOT NULL   DEFAULT NOW()
);

-- Car groups (one group = one shared car)
CREATE TABLE IF NOT EXISTS car_groups (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  join_code   TEXT         UNIQUE NOT NULL,
  car_name    TEXT         NOT NULL,
  created_by  UUID         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Group membership (many users per group, up to 9)
CREATE TABLE IF NOT EXISTS group_members (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID         NOT NULL REFERENCES car_groups(id)  ON DELETE CASCADE,
  user_id     UUID         NOT NULL REFERENCES profiles(id)    ON DELETE CASCADE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Bookings (denormalized user display fields for realtime simplicity)
CREATE TABLE IF NOT EXISTS bookings (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID         NOT NULL REFERENCES car_groups(id)  ON DELETE CASCADE,
  user_id     UUID         NOT NULL REFERENCES profiles(id)    ON DELETE CASCADE,
  user_name   TEXT         NOT NULL,
  user_color  TEXT         NOT NULL,
  user_emoji  TEXT         NOT NULL DEFAULT '😀',
  date        DATE         NOT NULL,
  start_time  TIME         NOT NULL,
  end_time    TIME         NOT NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ================================================================
-- TRIGGERS
-- ================================================================

-- Auto-update updated_at on bookings
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bookings_updated_at ON bookings;
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile row when a new auth user signs up.
-- SECURITY DEFINER: runs as DB owner → bypasses RLS even when email
-- confirmation is enabled and there is no active session yet.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, profile_image, color)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''), split_part(NEW.email, '@', 1), 'משתמש'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'profileEmoji', ''), '😀'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'color', ''), '#22C55E')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RPC: create_profile — called from client when trigger hasn't fired yet.
-- SECURITY DEFINER bypasses RLS so it works even before session is active.
DROP FUNCTION IF EXISTS create_profile(uuid, text, text, text);
CREATE OR REPLACE FUNCTION create_profile(
  p_user_id     UUID,
  p_name        TEXT,
  p_emoji       TEXT DEFAULT '😀',
  p_color       TEXT DEFAULT '#22C55E'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, name, profile_image, color)
  VALUES (p_user_id, p_name, p_emoji, p_color)
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Read own profile row, bypassing RLS (SECURITY DEFINER).
-- Used by ensureProfile() as a fallback when the direct SELECT is blocked.
CREATE OR REPLACE FUNCTION get_own_profile()
RETURNS SETOF profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM profiles WHERE id = auth.uid();
$$;

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_groups   ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings     ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating (safe re-run)
DROP POLICY IF EXISTS "profiles_own_read"           ON profiles;
DROP POLICY IF EXISTS "profiles_group_member_read"  ON profiles;
DROP POLICY IF EXISTS "profiles_own_insert"         ON profiles;
DROP POLICY IF EXISTS "profiles_own_update"         ON profiles;
DROP POLICY IF EXISTS "groups_member_read"          ON car_groups;
DROP POLICY IF EXISTS "groups_authenticated_insert" ON car_groups;
DROP POLICY IF EXISTS "members_own_group_read"      ON group_members;
DROP POLICY IF EXISTS "members_self_insert"         ON group_members;
DROP POLICY IF EXISTS "members_self_delete"         ON group_members;
DROP POLICY IF EXISTS "bookings_group_read"         ON bookings;
DROP POLICY IF EXISTS "bookings_group_insert"       ON bookings;
DROP POLICY IF EXISTS "bookings_own_update"         ON bookings;
DROP POLICY IF EXISTS "bookings_own_delete"         ON bookings;

-- PROFILES -------------------------------------------------------
CREATE POLICY "profiles_own_read" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Read profiles of people in the same group (for member list display)
CREATE POLICY "profiles_group_member_read" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT gm.user_id FROM group_members gm
      WHERE gm.group_id IN (
        SELECT gm2.group_id FROM group_members gm2 WHERE gm2.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "profiles_own_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_own_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- CAR GROUPS -----------------------------------------------------
CREATE POLICY "groups_member_read" ON car_groups
  FOR SELECT USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "groups_authenticated_insert" ON car_groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- GROUP MEMBERS --------------------------------------------------
CREATE POLICY "members_own_group_read" ON group_members
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "members_self_insert" ON group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "members_self_delete" ON group_members
  FOR DELETE USING (auth.uid() = user_id);

-- BOOKINGS -------------------------------------------------------
CREATE POLICY "bookings_group_read" ON bookings
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "bookings_group_insert" ON bookings
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "bookings_own_update" ON bookings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "bookings_own_delete" ON bookings
  FOR DELETE USING (auth.uid() = user_id);

-- ================================================================
-- RPC FUNCTIONS (SECURITY DEFINER — bypass RLS for join-by-code)
-- ================================================================

-- Create a new group and add the creator as first member (atomic)
CREATE OR REPLACE FUNCTION create_car_group(
  p_car_name TEXT,
  p_join_code TEXT,
  p_user_id  UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group car_groups;
BEGIN
  INSERT INTO car_groups (join_code, car_name, created_by)
  VALUES (p_join_code, p_car_name, p_user_id)
  RETURNING * INTO v_group;

  INSERT INTO group_members (group_id, user_id)
  VALUES (v_group.id, p_user_id);

  RETURN jsonb_build_object(
    'id',         v_group.id,
    'join_code',  v_group.join_code,
    'car_name',   v_group.car_name,
    'created_by', v_group.created_by,
    'created_at', v_group.created_at
  );
END;
$$;

-- Join an existing group using a 6-char code
CREATE OR REPLACE FUNCTION join_group_by_code(
  p_join_code TEXT,
  p_user_id   UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group        car_groups;
  v_member_count INT;
BEGIN
  SELECT * INTO v_group
  FROM car_groups
  WHERE join_code = UPPER(TRIM(p_join_code));

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'קוד הצטרפות שגוי — בדוק שהקוד נכתב בצורה נכונה');
  END IF;

  SELECT COUNT(*) INTO v_member_count
  FROM group_members WHERE group_id = v_group.id;

  IF v_member_count >= 9 THEN
    RETURN jsonb_build_object('error', 'הקבוצה מלאה — ניתן להוסיף עד 9 משתמשים');
  END IF;

  -- Add member; ignore if already a member
  INSERT INTO group_members (group_id, user_id)
  VALUES (v_group.id, p_user_id)
  ON CONFLICT (group_id, user_id) DO NOTHING;

  RETURN jsonb_build_object(
    'id',         v_group.id,
    'join_code',  v_group.join_code,
    'car_name',   v_group.car_name,
    'created_by', v_group.created_by,
    'created_at', v_group.created_at
  );
END;
$$;

-- ================================================================
-- REALTIME PUBLICATION
-- Enable realtime for the tables that need live sync
-- ================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE group_members;

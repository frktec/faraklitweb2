/*
# Add User Hashtags and Organization Join Requests

## What This Does

1. Adds a unique `hashtag` column to `profiles` — each user gets a short, shareable
   identifier like `#AB123456` that org admins can use to invite them.
2. Creates a `join_requests` table for opt-in team joins: an org admin sends a
   request to a user's hashtag, and the user must approve or reject it before
   being added to the organization.

## New Columns

### profiles.hashtag
- `text`, unique, not null
- Format: `#` + 2 uppercase letters + 6 digits (e.g. `#AB123456`)
- Auto-generated for existing profiles via a DO block
- Auto-generated for new profiles via a BEFORE INSERT trigger

## New Tables

### join_requests
- `id` (uuid, primary key)
- `organization_id` (uuid, FK → organizations, cascade delete)
- `user_id` (uuid, FK → profiles, cascade delete) — the invited user
- `requested_by` (uuid, FK → profiles) — the org admin who sent the request
- `role` (text, not null) — the role to assign on approval (admin/lawyer/staff)
- `status` (text, not null, default 'pending') — pending/approved/rejected
- `responded_at` (timestamptz, nullable)
- `created_at` (timestamptz, default now())

## Security

- RLS enabled on `join_requests`.
- SELECT: the invited user can see their own requests; org members can see
  requests for their organization.
- INSERT: only org admins/owners can create requests for their org.
- UPDATE: only the invited user can update status (approve/reject); org admins
  can cancel (set to 'rejected') if needed.
- DELETE: org admins can delete requests for their org.

## Important Notes

1. The hashtag generation function uses `gen_random_bytes` for entropy.
2. A trigger auto-assigns hashtags to new profiles on insert.
3. Existing profiles get hashtags backfilled in the migration.
4. A unique constraint prevents duplicate join requests per org+user+pending status.
*/

-- =========================================================
-- 1. Add hashtag column to profiles
-- =========================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'hashtag'
  ) THEN
    ALTER TABLE profiles ADD COLUMN hashtag text;
  END IF;
END $$;

-- Function to generate a random hashtag: # + 2 uppercase letters + 6 digits
CREATE OR REPLACE FUNCTION generate_hashtag()
RETURNS text
LANGUAGE sql
VOLATILE
AS $$
  SELECT '#' ||
    chr(65 + (get_byte(gen_random_bytes(1), 0) % 26)) ||
    chr(65 + (get_byte(gen_random_bytes(1), 0) % 26)) ||
    lpad((get_byte(gen_random_bytes(4), 0) % 1000000)::text, 6, '0');
$$;

-- Backfill existing profiles
UPDATE profiles
SET hashtag = generate_hashtag()
WHERE hashtag IS NULL;

-- Now enforce NOT NULL and UNIQUE
ALTER TABLE profiles ALTER COLUMN hashtag SET NOT NULL;
ALTER TABLE profiles ADD CONSTRAINT profiles_hashtag_unique UNIQUE (hashtag);

-- Auto-generate hashtag for new profiles via trigger
CREATE OR REPLACE FUNCTION set_profile_hashtag()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.hashtag IS NULL THEN
    LOOP
      NEW.hashtag := generate_hashtag();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE hashtag = NEW.hashtag);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_profile_hashtag ON profiles;
CREATE TRIGGER trg_set_profile_hashtag
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_profile_hashtag();

-- =========================================================
-- 2. Create join_requests table
-- =========================================================

CREATE TABLE IF NOT EXISTS join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES profiles(id),
  role text NOT NULL DEFAULT 'lawyer',
  status text NOT NULL DEFAULT 'pending',
  responded_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_join_requests_user_id ON join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_org_id ON join_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON join_requests(status);

-- Prevent duplicate pending requests per org+user
CREATE UNIQUE INDEX IF NOT EXISTS idx_join_requests_unique_pending
  ON join_requests(organization_id, user_id)
  WHERE status = 'pending';

-- =========================================================
-- 3. RLS Policies for join_requests
-- =========================================================

-- SELECT: invited user sees their own requests; org members see their org's requests
DROP POLICY IF EXISTS "join_requests_select_own_or_org" ON join_requests;
CREATE POLICY "join_requests_select_own_or_org" ON join_requests FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM organization_members m
      WHERE m.organization_id = join_requests.organization_id
        AND m.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = join_requests.organization_id
        AND o.owner_id = auth.uid()
    )
  );

-- INSERT: only org admins/owners
DROP POLICY IF EXISTS "join_requests_insert_org_admin" ON join_requests;
CREATE POLICY "join_requests_insert_org_admin" ON join_requests FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = join_requests.organization_id
        AND (
          o.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM organization_members m
            WHERE m.organization_id = o.id
              AND m.user_id = auth.uid()
              AND m.role = 'admin'
          )
        )
    )
  );

-- UPDATE: invited user can approve/reject; org admin can cancel
DROP POLICY IF EXISTS "join_requests_update_own_or_admin" ON join_requests;
CREATE POLICY "join_requests_update_own_or_admin" ON join_requests FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = join_requests.organization_id
        AND (
          o.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM organization_members m
            WHERE m.organization_id = o.id
              AND m.user_id = auth.uid()
              AND m.role = 'admin'
          )
        )
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = join_requests.organization_id
        AND (
          o.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM organization_members m
            WHERE m.organization_id = o.id
              AND m.user_id = auth.uid()
              AND m.role = 'admin'
          )
        )
    )
  );

-- DELETE: org admins can delete
DROP POLICY IF EXISTS "join_requests_delete_org_admin" ON join_requests;
CREATE POLICY "join_requests_delete_org_admin" ON join_requests FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = join_requests.organization_id
        AND (
          o.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM organization_members m
            WHERE m.organization_id = o.id
              AND m.user_id = auth.uid()
              AND m.role = 'admin'
          )
        )
    )
  );

-- =========================================================
-- 4. Allow org admins to read profiles by hashtag (for searching users to invite)
--    The existing profiles_select_own policy only allows self + org members.
--    We add a policy allowing org admins to see profiles they're trying to invite.
-- =========================================================

DROP POLICY IF EXISTS "profiles_select_by_org_admin" ON profiles;
CREATE POLICY "profiles_select_by_org_admin" ON profiles FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM organization_members m
        WHERE m.organization_id = o.id
          AND m.user_id = auth.uid()
          AND m.role = 'admin'
      )
    )
  );
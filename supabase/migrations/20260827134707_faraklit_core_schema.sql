/*
# Faraklit Core Schema — Profiles, Organizations, Plans

1. Purpose
   - Establish the foundational schema for the Faraklit legal-tech SaaS platform.
   - Supports: user profiles, law-firm organizations, team membership, and admin-managed subscription plans.

2. New Tables
   - `profiles` — extends auth.users with Faraklit-specific account data (full name, phone, bar association, bar registry number, account type, role).
   - `organizations` — represents a law firm / team workspace (name, tax info, address).
   - `organization_members` — join table linking users to organizations with a role (admin/lawyer/staff).
   - `plans` — admin-managed subscription plans (name, price, user limit, device limit, storage, feature access, active flag). Prices are managed here so the admin panel can change them without code changes.

3. Security
   - RLS enabled on all tables.
   - `profiles`: each authenticated user can read/update only their own profile. Admins can read all profiles.
   - `organizations`: members can read their own org; only org admins can insert/update/delete.
   - `organization_members`: members can read their own org's members; only org admins can insert/update/delete.
   - `plans`: publicly readable (anon + authenticated) so the pricing page works without login; only admins can modify.
   - Admin role is determined by `raw_app_meta_data->>role = 'admin'` (user-immutable), NOT user_metadata.

4. Notes
   - `profiles.id` references `auth.users(id)` with CASCADE delete so profile is removed when auth user is deleted.
   - `profiles.role` defaults to 'user'. Only the admin SQL or a SECURITY DEFINER function should escalate this.
   - `plans.price_cents` stores price in kuruş (integer) to avoid floating-point issues. Display as TL.
   - `plans.features` is a JSONB array of feature keys controlling module access.
*/

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  bar_association text DEFAULT '',
  bar_registry_number text DEFAULT '',
  account_type text NOT NULL DEFAULT 'individual' CHECK (account_type IN ('individual', 'organization')),
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ORGANIZATIONS
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  tax_id text DEFAULT '',
  tax_office text DEFAULT '',
  address text DEFAULT '',
  city text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ORGANIZATION MEMBERS
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'lawyer' CHECK (role IN ('admin', 'lawyer', 'staff')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

-- PLANS
CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'TRY',
  billing_period text NOT NULL DEFAULT 'year' CHECK (billing_period IN ('year', 'month')),
  user_limit integer NOT NULL DEFAULT 1,
  device_limit integer NOT NULL DEFAULT 1,
  storage_gb integer NOT NULL DEFAULT 5,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ENABLE RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON profiles;
CREATE POLICY "profiles_select_own_or_admin" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ORGANIZATIONS POLICIES
DROP POLICY IF EXISTS "orgs_select_member" ON organizations;
CREATE POLICY "orgs_select_member" ON organizations FOR SELECT
  TO authenticated USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM organization_members m
      WHERE m.organization_id = organizations.id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "orgs_insert_owner" ON organizations;
CREATE POLICY "orgs_insert_owner" ON organizations FOR INSERT
  TO authenticated WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "orgs_update_owner_or_admin_member" ON organizations;
CREATE POLICY "orgs_update_owner_or_admin_member" ON organizations FOR UPDATE
  TO authenticated USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM organization_members m
      WHERE m.organization_id = organizations.id
        AND m.user_id = auth.uid()
        AND m.role = 'admin'
    )
  ) WITH CHECK (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM organization_members m
      WHERE m.organization_id = organizations.id
        AND m.user_id = auth.uid()
        AND m.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "orgs_delete_owner" ON organizations;
CREATE POLICY "orgs_delete_owner" ON organizations FOR DELETE
  TO authenticated USING (owner_id = auth.uid());

-- ORGANIZATION MEMBERS POLICIES
DROP POLICY IF EXISTS "org_members_select_member" ON organization_members;
CREATE POLICY "org_members_select_member" ON organization_members FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_members.organization_id
        AND (o.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM organization_members m2
            WHERE m2.organization_id = o.id AND m2.user_id = auth.uid()
          ))
    )
  );

DROP POLICY IF EXISTS "org_members_insert_org_admin" ON organization_members;
CREATE POLICY "org_members_insert_org_admin" ON organization_members FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_members.organization_id
        AND (o.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM organization_members m2
            WHERE m2.organization_id = o.id AND m2.user_id = auth.uid() AND m2.role = 'admin'
          ))
    )
  );

DROP POLICY IF EXISTS "org_members_update_org_admin" ON organization_members;
CREATE POLICY "org_members_update_org_admin" ON organization_members FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_members.organization_id
        AND (o.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM organization_members m2
            WHERE m2.organization_id = o.id AND m2.user_id = auth.uid() AND m2.role = 'admin'
          ))
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_members.organization_id
        AND (o.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM organization_members m2
            WHERE m2.organization_id = o.id AND m2.user_id = auth.uid() AND m2.role = 'admin'
          ))
    )
  );

DROP POLICY IF EXISTS "org_members_delete_org_admin" ON organization_members;
CREATE POLICY "org_members_delete_org_admin" ON organization_members FOR DELETE
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_members.organization_id
        AND (o.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM organization_members m2
            WHERE m2.organization_id = o.id AND m2.user_id = auth.uid() AND m2.role = 'admin'
          ))
    )
  );

-- PLANS POLICIES
DROP POLICY IF EXISTS "plans_select_public" ON plans;
CREATE POLICY "plans_select_public" ON plans FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "plans_admin_write" ON plans;
CREATE POLICY "plans_admin_write" ON plans FOR INSERT
  TO authenticated WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "plans_admin_update" ON plans;
CREATE POLICY "plans_admin_update" ON plans FOR UPDATE
  TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "plans_admin_delete" ON plans;
CREATE POLICY "plans_admin_delete" ON plans FOR DELETE
  TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Seed default plans
INSERT INTO plans (slug, name, price_cents, billing_period, user_limit, device_limit, storage_gb, features, sort_order)
VALUES
  ('individual', 'Bireysel', 3900000, 'year', 1, 3, 10, '["precedent_search","petition","document_analysis","official_gazette","files"]'::jsonb, 1),
  ('organization', 'Kurumsal', 4900000, 'year', 10, 15, 50, '["precedent_search","petition","document_analysis","official_gazette","files","uets","uyap","calendar","team_management"]'::jsonb, 2),
  ('organization_pro', 'Kurumsal Pro', 6900000, 'year', 50, 50, 200, '["precedent_search","petition","document_analysis","official_gazette","files","uets","uyap","calendar","team_management","audit_log","advanced_analytics","priority_support"]'::jsonb, 3)
ON CONFLICT (slug) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

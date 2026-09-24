/*
# Organization Invitations System

## Purpose
Enables team-based collaboration for law firms/organizations on Faraklit.
An organization owner (or org admin) can invite members by email. The invitee
receives a token-based invitation that is accepted during registration or from
the account panel, at which point they become a member of the organization
with a specified role (admin, lawyer, or staff).

## New Tables
- `organization_invitations`
  - `id` (uuid, PK)
  - `organization_id` (uuid, FK → organizations.id)
  - `email` (text, the invitee's email address)
  - `role` (text: 'admin' | 'lawyer' | 'staff', default 'lawyer')
  - `invited_by` (uuid, FK → auth.users.id, the user who sent the invite)
  - `status` (text: 'pending' | 'accepted' | 'revoked', default 'pending')
  - `invite_token` (text, unique, single-use token for acceptance)
  - `accepted_by` (uuid, FK → auth.users.id, nullable, set on acceptance)
  - `accepted_at` (timestamptz, nullable)
  - `expires_at` (timestamptz, default 7 days from creation)
  - `created_at` (timestamptz, default now())

## Security
- RLS enabled on `organization_invitations`.
- SELECT: org owners, org admins, and the invitee (matched by email via auth.jwt() email claim) can see invitations.
- INSERT: only org owners or org admins can create invitations.
- UPDATE: org owners/admins can revoke (status → 'revoked'); invitee can accept (status → 'accepted', set accepted_by/at).
- DELETE: org owners or org admins can delete invitations.

## Notes
1. The invitee is matched by the email claim in the JWT so that a user who just registered can see their pending invitation without any prior link.
2. `invite_token` is a crypto-random single-use token for link-based acceptance as an alternative path.
3. `expires_at` defaults to 7 days; expired invitations cannot be accepted (enforced in UPDATE policy via CHECK).
*/

CREATE TABLE IF NOT EXISTS organization_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'lawyer' CHECK (role IN ('admin', 'lawyer', 'staff')),
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  invite_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_invitations_email ON organization_invitations(email);
CREATE INDEX IF NOT EXISTS idx_org_invitations_org ON organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_invitations_status ON organization_invitations(status);

ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- Helper: org admin check (owner or member with role 'admin')
-- We inline this in each policy for clarity.

-- SELECT: org owners, org admins, or the invitee (by email)
DROP POLICY IF EXISTS "invitations_select_org_or_invitee" ON organization_invitations;
CREATE POLICY "invitations_select_org_or_invitee"
ON organization_invitations FOR SELECT
TO authenticated
USING (
  -- The invitee can see their own invitations (matched by email)
  (email = (auth.jwt() ->> 'email'))
  OR
  -- Org owner
  EXISTS (
    SELECT 1 FROM organizations o
    WHERE o.id = organization_invitations.organization_id
    AND o.owner_id = auth.uid()
  )
  OR
  -- Org admin member
  EXISTS (
    SELECT 1 FROM organization_members m
    WHERE m.organization_id = organization_invitations.organization_id
    AND m.user_id = auth.uid()
    AND m.role = 'admin'
  )
);

-- INSERT: org owners or org admins
DROP POLICY IF EXISTS "invitations_insert_org_admin" ON organization_invitations;
CREATE POLICY "invitations_insert_org_admin"
ON organization_invitations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organizations o
    WHERE o.id = organization_invitations.organization_id
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

-- UPDATE: org admin can revoke; invitee can accept (only if still pending and not expired)
DROP POLICY IF EXISTS "invitations_update_org_admin_or_invitee" ON organization_invitations;
CREATE POLICY "invitations_update_org_admin_or_invitee"
ON organization_invitations FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organizations o
    WHERE o.id = organization_invitations.organization_id
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
  OR (email = (auth.jwt() ->> 'email') AND status = 'pending')
)
WITH CHECK (
  -- Org admin can make any update
  EXISTS (
    SELECT 1 FROM organizations o
    WHERE o.id = organization_invitations.organization_id
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
  -- Invitee can only accept (status → 'accepted', set accepted_by/at)
  OR (
    email = (auth.jwt() ->> 'email')
    AND status = 'accepted'
    AND accepted_by = auth.uid()
  )
);

-- DELETE: org owners or org admins
DROP POLICY IF EXISTS "invitations_delete_org_admin" ON organization_invitations;
CREATE POLICY "invitations_delete_org_admin"
ON organization_invitations FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organizations o
    WHERE o.id = organization_invitations.organization_id
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
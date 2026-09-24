/*
# Allow org members to view each other's profiles

## Purpose
Currently profiles SELECT policy only allows users to see their own profile.
This breaks the team page — when an org admin views the member list, other
members' names and emails come back as null because RLS blocks the join.

## Change
Adds an additional SELECT policy on `profiles` that allows reading any profile
that belongs to the same organization as the requesting user (via organization_members).
This is additive — the existing "own profile" and "admin" policies remain.

## Security
- A user can only read profiles of users in organizations they themselves belong to.
- This does not expose profiles of individual (non-org) users.
- The policy checks EXISTS on organization_members for both the requesting user and the target user.
*/

DROP POLICY IF EXISTS "profiles_select_org_members" ON profiles;
CREATE POLICY "profiles_select_org_members"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members m1
    JOIN organization_members m2 ON m1.organization_id = m2.organization_id
    WHERE m1.user_id = auth.uid()
    AND m2.user_id = profiles.id
  )
);
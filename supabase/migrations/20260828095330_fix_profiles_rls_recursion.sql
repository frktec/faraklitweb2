/*
# Fix RLS recursion on profiles

## Problem
The `profiles_select_org_members` policy (added in a previous migration) causes
infinite RLS recursion: profiles → organization_members → organizations →
organization_members → ... This makes the profile query hang, which blocks
all account pages from loading.

## Fix
1. Drop the recursive `profiles_select_org_members` policy.
2. Create a SECURITY DEFINER function `is_org_member_of()` that checks if two
   users belong to the same organization. SECURITY DEFINER functions bypass RLS,
   breaking the recursion.
3. Recreate the policy using the function instead of a direct subquery.

## Security
- The function only returns a boolean (whether two users share an org).
- It runs as SECURITY DEFINER but only reads data — no mutations.
- The policy remains scoped to authenticated users.
*/

DROP POLICY IF EXISTS "profiles_select_org_members" ON profiles;

CREATE OR REPLACE FUNCTION is_org_member_of(member_uid uuid, target_uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members m1
    JOIN organization_members m2 ON m1.organization_id = m2.organization_id
    WHERE m1.user_id = member_uid
    AND m2.user_id = target_uid
  );
$$;

CREATE POLICY "profiles_select_org_members"
ON profiles FOR SELECT
TO authenticated
USING (is_org_member_of(auth.uid(), profiles.id));
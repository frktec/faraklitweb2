/*
# Allow Invited Users to Join Organizations

## Purpose
Adds an INSERT policy to `organization_members` so that a user who has accepted
an invitation can insert their own membership row. Without this, only org owners/admins
can add members, which blocks the self-service invite-acceptance flow.

## Changes
1. New INSERT policy on `organization_members`: allows a user to insert themselves
   as a member if they have an accepted invitation for that organization.
2. A trigger function + trigger that automatically inserts the organization_members
   row when an invitation is accepted (status → 'accepted'). This ensures atomicity:
   the membership is created in the same transaction as the acceptance.

## Security
- The trigger runs as SECURITY DEFINER to bypass RLS for the membership insert,
  but only fires when a user updates their own invitation to 'accepted' status.
- The INSERT policy is additive (OR) — existing org-admin INSERT policy remains.
*/

-- Policy: invited user can insert their own membership after accepting
DROP POLICY IF EXISTS "org_members_insert_invited" ON organization_members;
CREATE POLICY "org_members_insert_invited"
ON organization_members FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM organization_invitations inv
    WHERE inv.organization_id = organization_members.organization_id
    AND inv.email = (auth.jwt() ->> 'email')
    AND inv.status = 'accepted'
    AND inv.accepted_by = auth.uid()
  )
);

-- Trigger function: auto-create membership on invitation acceptance
CREATE OR REPLACE FUNCTION handle_invitation_acceptance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act when status transitions to 'accepted'
  IF NEW.status = 'accepted' AND OLD.status = 'pending' AND NEW.accepted_by IS NOT NULL THEN
    -- Insert the membership row if it doesn't already exist
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (NEW.organization_id, NEW.accepted_by, NEW.role)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS on_invitation_accepted ON organization_invitations;
CREATE TRIGGER on_invitation_accepted
AFTER UPDATE ON organization_invitations
FOR EACH ROW
EXECUTE FUNCTION handle_invitation_acceptance();
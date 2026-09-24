/*
# Add unique constraint on organization_members

## Purpose
Ensures a user can only be a member of an organization once. Required for
ON CONFLICT DO NOTHING in the invitation-acceptance trigger.

## Changes
1. Add unique constraint on (organization_id, user_id) if not exists.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'org_members_org_user_unique'
  ) THEN
    ALTER TABLE organization_members
    ADD CONSTRAINT org_members_org_user_unique UNIQUE (organization_id, user_id);
  END IF;
END $$;
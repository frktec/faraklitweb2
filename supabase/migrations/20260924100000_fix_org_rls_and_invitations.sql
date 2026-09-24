/*
# Organization RLS repair and invitation hardening

1. RLS recursion
   - `organization_members` policies referenced `organization_members` itself, so every
     authenticated read of organizations / organization_members / organization_invitations
     failed with "infinite recursion detected in policy". All org-related policies now use
     SECURITY DEFINER helpers (`is_org_member`, `is_org_admin`) that bypass RLS.

2. Invitation tampering (privilege escalation)
   - The invitee branch of the invitation UPDATE policy did not pin `organization_id` or `role`,
     so any invited user could rewrite their invitation to join *another* organization as admin.
     A trigger now makes the identity fields immutable, allows only pending -> accepted/revoked,
     requires the acceptor to be the invitee (confirmed e-mail) and rejects expired invitations.

3. Organization ownership
   - Org admin members could change `organizations.owner_id`. Only the current owner
     (or a platform admin) may transfer ownership now.

4. Direct membership inserts
   - Org admins could insert arbitrary users into their organization without consent.
     Direct inserts are now limited to the owner adding themself; everyone else joins through
     an accepted invitation or join request (handled by SECURITY DEFINER triggers).
*/

-- =========================================================
-- Helpers
-- =========================================================
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

CREATE OR REPLACE FUNCTION is_org_member(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organizations o WHERE o.id = p_org_id AND o.owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM organization_members m WHERE m.organization_id = p_org_id AND m.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_org_admin(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organizations o WHERE o.id = p_org_id AND o.owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM organization_members m
    WHERE m.organization_id = p_org_id AND m.user_id = auth.uid() AND m.role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION is_org_member(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION is_org_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION is_org_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_org_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_platform_admin() TO anon, authenticated;

-- =========================================================
-- organizations
-- =========================================================
DROP POLICY IF EXISTS "orgs_select_member" ON organizations;
CREATE POLICY "orgs_select_member" ON organizations FOR SELECT
  TO authenticated USING (owner_id = auth.uid() OR is_org_member(id) OR is_platform_admin());

DROP POLICY IF EXISTS "orgs_update_owner_or_admin_member" ON organizations;
CREATE POLICY "orgs_update_owner_or_admin_member" ON organizations FOR UPDATE
  TO authenticated USING (is_org_admin(id)) WITH CHECK (is_org_admin(id) OR owner_id = auth.uid());

CREATE OR REPLACE FUNCTION guard_organization_owner_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id
     AND auth.uid() IS NOT NULL
     AND auth.uid() <> OLD.owner_id
     AND NOT is_platform_admin() THEN
    RAISE EXCEPTION 'only the organization owner can transfer ownership';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_organization_owner ON organizations;
CREATE TRIGGER trg_guard_organization_owner
BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION guard_organization_owner_change();

-- =========================================================
-- organization_members
-- =========================================================
DROP POLICY IF EXISTS "org_members_select_member" ON organization_members;
CREATE POLICY "org_members_select_member" ON organization_members FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR is_org_member(organization_id) OR is_platform_admin());

-- Only the owner may add *themself* directly (used right after creating an organization).
-- Everyone else joins through an accepted invitation / join request (SECURITY DEFINER triggers).
DROP POLICY IF EXISTS "org_members_insert_org_admin" ON organization_members;
CREATE POLICY "org_members_insert_org_admin" ON organization_members FOR INSERT
  TO authenticated WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM organizations o WHERE o.id = organization_id AND o.owner_id = auth.uid())
  );

-- Accepting an invitation already inserts the membership via trigger; the direct-insert path
-- is kept for older clients but now also requires the invitation role to match.
DROP POLICY IF EXISTS "org_members_insert_invited" ON organization_members;
CREATE POLICY "org_members_insert_invited" ON organization_members FOR INSERT
  TO authenticated WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM organization_invitations inv
      WHERE inv.organization_id = organization_members.organization_id
        AND lower(inv.email) = lower(auth.jwt() ->> 'email')
        AND inv.status = 'accepted'
        AND inv.accepted_by = auth.uid()
        AND inv.role = organization_members.role
    )
  );

DROP POLICY IF EXISTS "org_members_update_org_admin" ON organization_members;
CREATE POLICY "org_members_update_org_admin" ON organization_members FOR UPDATE
  TO authenticated USING (is_org_admin(organization_id)) WITH CHECK (is_org_admin(organization_id));

DROP POLICY IF EXISTS "org_members_delete_org_admin" ON organization_members;
CREATE POLICY "org_members_delete_org_admin" ON organization_members FOR DELETE
  TO authenticated USING (user_id = auth.uid() OR is_org_admin(organization_id));

CREATE OR REPLACE FUNCTION guard_org_member_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'membership organization and user are immutable';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_org_member_update ON organization_members;
CREATE TRIGGER trg_guard_org_member_update
BEFORE UPDATE ON organization_members
FOR EACH ROW EXECUTE FUNCTION guard_org_member_update();

-- =========================================================
-- organization_invitations
-- =========================================================
DROP POLICY IF EXISTS "invitations_select_org_or_invitee" ON organization_invitations;
CREATE POLICY "invitations_select_org_or_invitee" ON organization_invitations FOR SELECT
  TO authenticated USING (
    lower(email) = lower(auth.jwt() ->> 'email')
    OR is_org_admin(organization_id)
    OR is_platform_admin()
  );

DROP POLICY IF EXISTS "invitations_insert_org_admin" ON organization_invitations;
CREATE POLICY "invitations_insert_org_admin" ON organization_invitations FOR INSERT
  TO authenticated WITH CHECK (is_org_admin(organization_id) AND status = 'pending');

DROP POLICY IF EXISTS "invitations_update_org_admin_or_invitee" ON organization_invitations;
CREATE POLICY "invitations_update_org_admin_or_invitee" ON organization_invitations FOR UPDATE
  TO authenticated
  USING (is_org_admin(organization_id) OR (lower(email) = lower(auth.jwt() ->> 'email') AND status = 'pending'))
  WITH CHECK (is_org_admin(organization_id) OR (lower(email) = lower(auth.jwt() ->> 'email') AND accepted_by = auth.uid()));

DROP POLICY IF EXISTS "invitations_delete_org_admin" ON organization_invitations;
CREATE POLICY "invitations_delete_org_admin" ON organization_invitations FOR DELETE
  TO authenticated USING (is_org_admin(organization_id));

CREATE OR REPLACE FUNCTION guard_invitation_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id
     OR lower(NEW.email) IS DISTINCT FROM lower(OLD.email)
     OR NEW.role IS DISTINCT FROM OLD.role
     OR NEW.invite_token IS DISTINCT FROM OLD.invite_token
     OR NEW.invited_by IS DISTINCT FROM OLD.invited_by
     OR NEW.expires_at IS DISTINCT FROM OLD.expires_at THEN
    RAISE EXCEPTION 'invitation organization, e-mail, role, token and expiry are immutable';
  END IF;

  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    IF NEW.accepted_by IS DISTINCT FROM OLD.accepted_by OR NEW.accepted_at IS DISTINCT FROM OLD.accepted_at THEN
      RAISE EXCEPTION 'acceptance fields can only change together with the status';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.status <> 'pending' THEN
    RAISE EXCEPTION 'resolved invitations cannot change status';
  END IF;

  IF NEW.status = 'accepted' THEN
    IF OLD.expires_at <= now() THEN
      RAISE EXCEPTION 'invitation has expired';
    END IF;

    -- auth.uid() is NULL only for server-side paths (signup trigger / service role).
    IF auth.uid() IS NOT NULL THEN
      IF NEW.accepted_by IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'only the invited user can accept an invitation';
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM auth.users u
        WHERE u.id = auth.uid()
          AND lower(u.email) = lower(OLD.email)
          AND u.email_confirmed_at IS NOT NULL
      ) THEN
        RAISE EXCEPTION 'invitation e-mail does not match a confirmed account';
      END IF;
    END IF;

    NEW.accepted_at := COALESCE(NEW.accepted_at, now());
  ELSIF NEW.status = 'revoked' THEN
    NEW.accepted_by := NULL;
    NEW.accepted_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_invitation_update ON organization_invitations;
CREATE TRIGGER trg_guard_invitation_update
BEFORE UPDATE ON organization_invitations
FOR EACH ROW EXECUTE FUNCTION guard_invitation_update();

-- =========================================================
-- join_requests (same recursion issue through organization_members)
-- =========================================================
DROP POLICY IF EXISTS "join_requests_select_own_or_org" ON join_requests;
CREATE POLICY "join_requests_select_own_or_org" ON join_requests FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR is_org_member(organization_id) OR is_platform_admin());

DROP POLICY IF EXISTS "join_requests_insert_org_admin" ON join_requests;
CREATE POLICY "join_requests_insert_org_admin" ON join_requests FOR INSERT
  TO authenticated WITH CHECK (is_org_admin(organization_id) AND requested_by = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "join_requests_update_own_or_admin" ON join_requests;
CREATE POLICY "join_requests_update_own_or_admin" ON join_requests FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_org_admin(organization_id))
  WITH CHECK (user_id = auth.uid() OR is_org_admin(organization_id));

DROP POLICY IF EXISTS "join_requests_delete_org_admin" ON join_requests;
CREATE POLICY "join_requests_delete_org_admin" ON join_requests FOR DELETE
  TO authenticated USING (is_org_admin(organization_id));

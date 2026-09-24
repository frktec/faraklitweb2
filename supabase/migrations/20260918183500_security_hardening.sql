/*
# Faraklit security hardening

- Admin authorization uses immutable auth.app_metadata on the client and RLS.
- Prevents users from escalating profiles.role.
- Replaces broad hashtag profile visibility with an exact-search RPC.
- Prevents client-side creation/activation of subscriptions, licenses, payments and invoices.
- Adds a safe pending-order RPC and a server/admin-only completion function.
- Restricts device creation to licenses owned by the current user.
- Makes team join approval atomic and prevents org admins from approving on behalf of users.
- Creates profiles (and organization/invite membership where applicable) from auth signup metadata,
  so signup also works when e-mail confirmation is enabled.
*/

-- =========================================================
-- 1. Profiles: protect privileged fields
-- =========================================================
-- Preserve existing admins before the app switches entirely to immutable app_metadata.
-- A fresh access token/sign-in is required after applying the migration.
UPDATE auth.users AS u
SET raw_app_meta_data = COALESCE(u.raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
FROM profiles AS p
WHERE p.id = u.id
  AND p.role = 'admin'
  AND COALESCE(u.raw_app_meta_data ->> 'role', '') <> 'admin';

CREATE OR REPLACE FUNCTION protect_profile_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.role := 'user';
    ELSE
      NEW.role := OLD.role;
      NEW.hashtag := OLD.hashtag;
      NEW.id := OLD.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileged_fields ON profiles;
CREATE TRIGGER trg_protect_profile_privileged_fields
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION protect_profile_privileged_fields();

-- Remove the policy that made every profile visible to every org admin.
DROP POLICY IF EXISTS "profiles_select_by_org_admin" ON profiles;

CREATE OR REPLACE FUNCTION find_profile_by_hashtag(search_tag text)
RETURNS TABLE (
  id uuid,
  full_name text,
  hashtag text,
  account_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM organizations o
    WHERE o.owner_id = auth.uid()
       OR EXISTS (
         SELECT 1
         FROM organization_members m
         WHERE m.organization_id = o.id
           AND m.user_id = auth.uid()
           AND m.role = 'admin'
       )
  ) THEN
    RAISE EXCEPTION 'organization admin required';
  END IF;

  RETURN QUERY
  SELECT p.id, p.full_name, p.hashtag, p.account_type
  FROM profiles p
  WHERE p.hashtag = upper(trim(search_tag))
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION find_profile_by_hashtag(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION find_profile_by_hashtag(text) TO authenticated;

-- =========================================================
-- 2. Signup: create profile safely even with email confirmation
-- =========================================================
CREATE OR REPLACE FUNCTION handle_new_faraklit_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_type text;
  v_org_id uuid;
  v_invite_token text;
BEGIN
  v_account_type := CASE
    WHEN NEW.raw_user_meta_data ->> 'account_type' = 'organization' THEN 'organization'
    ELSE 'individual'
  END;

  INSERT INTO profiles (
    id, email, full_name, phone, bar_association, bar_registry_number, account_type, role
  ) VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'bar_association', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'bar_registry_number', ''),
    v_account_type,
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    bar_association = EXCLUDED.bar_association,
    bar_registry_number = EXCLUDED.bar_registry_number,
    account_type = EXCLUDED.account_type;

  v_invite_token := NULLIF(NEW.raw_user_meta_data ->> 'invite_token', '');

  IF v_invite_token IS NOT NULL THEN
    UPDATE organization_invitations
    SET status = 'accepted', accepted_by = NEW.id, accepted_at = now()
    WHERE invite_token = v_invite_token
      AND lower(email) = lower(COALESCE(NEW.email, ''))
      AND status = 'pending'
      AND expires_at > now()
    RETURNING organization_id INTO v_org_id;

    IF v_org_id IS NULL THEN
      RAISE EXCEPTION 'invalid, expired or mismatched invitation';
    END IF;
  ELSIF v_account_type = 'organization' AND NULLIF(trim(NEW.raw_user_meta_data ->> 'org_name'), '') IS NOT NULL THEN
    INSERT INTO organizations (
      name, tax_id, tax_office, address, city, phone, email, owner_id
    ) VALUES (
      trim(NEW.raw_user_meta_data ->> 'org_name'),
      COALESCE(NEW.raw_user_meta_data ->> 'org_tax_id', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'org_tax_office', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'org_address', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'org_city', ''),
      COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'org_phone', ''), NEW.raw_user_meta_data ->> 'phone', ''),
      COALESCE(NEW.email, ''),
      NEW.id
    )
    RETURNING id INTO v_org_id;

    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (v_org_id, NEW.id, 'admin')
    ON CONFLICT (organization_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_faraklit ON auth.users;
CREATE TRIGGER on_auth_user_created_faraklit
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_faraklit_user();

-- =========================================================
-- 3. Subscription/payment/license writes: server-side only
-- =========================================================
DROP POLICY IF EXISTS "subs_insert_own" ON subscriptions;
DROP POLICY IF EXISTS "subs_update_own_or_admin" ON subscriptions;
CREATE POLICY "subs_admin_insert" ON subscriptions FOR INSERT
  TO authenticated WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "subs_admin_update" ON subscriptions FOR UPDATE
  TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "licenses_insert_own" ON licenses;
DROP POLICY IF EXISTS "licenses_update_own_or_admin" ON licenses;
CREATE POLICY "licenses_admin_insert" ON licenses FOR INSERT
  TO authenticated WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "licenses_admin_update" ON licenses FOR UPDATE
  TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "payments_insert_own" ON payments;
DROP POLICY IF EXISTS "payments_update_own_or_admin" ON payments;
CREATE POLICY "payments_admin_insert" ON payments FOR INSERT
  TO authenticated WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "payments_admin_update" ON payments FOR UPDATE
  TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "invoices_insert_own" ON invoices;
CREATE POLICY "invoices_admin_insert" ON invoices FOR INSERT
  TO authenticated WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Exact, narrow RPC for the one subscription field a user is allowed to control.
CREATE OR REPLACE FUNCTION set_subscription_auto_renew(p_subscription_id uuid, p_auto_renew boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  UPDATE subscriptions
  SET auto_renew = p_auto_renew,
      cancelled_at = CASE WHEN p_auto_renew THEN NULL ELSE now() END,
      updated_at = now()
  WHERE id = p_subscription_id
    AND user_id = auth.uid();

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated = 1;
END;
$$;

REVOKE ALL ON FUNCTION set_subscription_auto_renew(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION set_subscription_auto_renew(uuid, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION create_pending_order(p_plan_id uuid, p_billing jsonb)
RETURNS TABLE (
  payment_id uuid,
  order_number text,
  amount_cents integer,
  currency text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_plan plans%ROWTYPE;
  v_payment payments%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  SELECT * INTO v_plan
  FROM plans
  WHERE id = p_plan_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'plan not found or inactive';
  END IF;

  INSERT INTO payments (user_id, plan_id, amount_cents, currency, status, provider)
  VALUES (v_user, v_plan.id, v_plan.price_cents, v_plan.currency, 'pending', 'pending-provider')
  RETURNING * INTO v_payment;

  INSERT INTO invoices (
    payment_id, user_id, amount_cents, currency,
    billing_name, billing_tax_id, billing_tax_office,
    billing_address, billing_city, billing_phone, billing_email,
    status
  ) VALUES (
    v_payment.id,
    v_user,
    v_plan.price_cents,
    v_plan.currency,
    COALESCE(p_billing ->> 'name', ''),
    COALESCE(p_billing ->> 'tax_id', ''),
    COALESCE(p_billing ->> 'tax_office', ''),
    COALESCE(p_billing ->> 'address', ''),
    COALESCE(p_billing ->> 'city', ''),
    COALESCE(p_billing ->> 'phone', ''),
    COALESCE(p_billing ->> 'email', ''),
    'issued'
  );

  RETURN QUERY SELECT v_payment.id, v_payment.order_number, v_payment.amount_cents, v_payment.currency;
END;
$$;

REVOKE ALL ON FUNCTION create_pending_order(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_pending_order(uuid, jsonb) TO authenticated;

-- Called by a verified payment webhook (service role) or an authenticated Faraklit admin.
-- It is idempotent: repeated verified callbacks return the existing license instead of creating duplicates.
CREATE OR REPLACE FUNCTION complete_order_after_payment(
  p_payment_id uuid,
  p_provider text,
  p_provider_payment_id text
)
RETURNS TABLE (subscription_id uuid, license_id uuid, license_key text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment payments%ROWTYPE;
  v_subscription_id uuid;
  v_license licenses%ROWTYPE;
  v_ends_at timestamptz := now() + interval '1 year';
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role'
     AND COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT * INTO v_payment FROM payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'payment not found';
  END IF;

  IF v_payment.subscription_id IS NOT NULL THEN
    SELECT * INTO v_license
    FROM licenses
    WHERE subscription_id = v_payment.subscription_id
    ORDER BY created_at ASC
    LIMIT 1;

    RETURN QUERY SELECT v_payment.subscription_id, v_license.id, v_license.license_key;
    RETURN;
  END IF;

  INSERT INTO subscriptions (user_id, plan_id, status, started_at, ends_at)
  VALUES (v_payment.user_id, v_payment.plan_id, 'active', now(), v_ends_at)
  RETURNING id INTO v_subscription_id;

  INSERT INTO licenses (subscription_id, user_id, plan_id, status, started_at, ends_at)
  VALUES (v_subscription_id, v_payment.user_id, v_payment.plan_id, 'active', now(), v_ends_at)
  RETURNING * INTO v_license;

  UPDATE payments
  SET status = 'completed',
      subscription_id = v_subscription_id,
      provider = COALESCE(NULLIF(p_provider, ''), provider),
      provider_payment_id = COALESCE(NULLIF(p_provider_payment_id, ''), provider_payment_id)
  WHERE id = p_payment_id;

  UPDATE invoices SET status = 'paid' WHERE payment_id = p_payment_id;

  RETURN QUERY SELECT v_subscription_id, v_license.id, v_license.license_key;
END;
$$;

REVOKE ALL ON FUNCTION complete_order_after_payment(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION complete_order_after_payment(uuid, text, text) TO authenticated, service_role;

-- =========================================================
-- 4. Devices: device must belong to a license owned by the user
-- =========================================================
DROP POLICY IF EXISTS "devices_insert_own" ON devices;
CREATE POLICY "devices_insert_owned_license" ON devices FOR INSERT
  TO authenticated WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM licenses l
      WHERE l.id = devices.license_id
        AND l.user_id = auth.uid()
        AND l.status = 'active'
    )
  );

DROP POLICY IF EXISTS "devices_update_own_or_admin" ON devices;
CREATE POLICY "devices_update_owned_license_or_admin" ON devices FOR UPDATE
  TO authenticated USING (
    user_id = auth.uid()
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  ) WITH CHECK (
    (user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM licenses l
      WHERE l.id = devices.license_id
        AND l.user_id = auth.uid()
        AND l.status = 'active'
    ))
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- =========================================================
-- 5. Join requests: user approval is atomic and cannot be impersonated by org admins
-- =========================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'join_requests_role_check') THEN
    ALTER TABLE join_requests ADD CONSTRAINT join_requests_role_check CHECK (role IN ('admin', 'lawyer', 'staff'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'join_requests_status_check') THEN
    ALTER TABLE join_requests ADD CONSTRAINT join_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION guard_join_request_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id <> OLD.organization_id
     OR NEW.user_id <> OLD.user_id
     OR NEW.requested_by <> OLD.requested_by
     OR NEW.role <> OLD.role THEN
    RAISE EXCEPTION 'join request identity and role are immutable';
  END IF;

  IF OLD.status = 'pending' AND NEW.status = 'approved' AND auth.uid() <> OLD.user_id THEN
    RAISE EXCEPTION 'only the invited user can approve a join request';
  END IF;

  IF OLD.status <> 'pending' AND NEW.status <> OLD.status THEN
    RAISE EXCEPTION 'resolved join requests cannot change status';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_join_request_status ON join_requests;
CREATE TRIGGER trg_guard_join_request_status
BEFORE UPDATE ON join_requests
FOR EACH ROW EXECUTE FUNCTION guard_join_request_status_change();

CREATE OR REPLACE FUNCTION handle_join_request_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (NEW.organization_id, NEW.user_id, NEW.role)
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    UPDATE profiles SET account_type = 'organization' WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_join_request_approval ON join_requests;
CREATE TRIGGER trg_handle_join_request_approval
AFTER UPDATE ON join_requests
FOR EACH ROW EXECUTE FUNCTION handle_join_request_approval();

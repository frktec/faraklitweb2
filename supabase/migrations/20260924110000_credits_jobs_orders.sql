/*
# Credits, job production, order types and admin operations

1. Credits
   - `credit_packages`   admin-managed credit bundles users can buy.
   - `credit_wallets`    one balance row per user (never written by clients).
   - `credit_transactions` append-only ledger of every balance change.
   - `plans.included_credits` credits granted with every paid plan period.

2. Job production ("iş üretimi")
   - `job_types` admin-managed catalogue with the credit cost of each job type.
   - `jobs` one row per job produced by the desktop app. Only metadata is stored,
     never document content, client names or search queries.
   - `record_job(...)` is the only write path: it checks the license, charges the
     server-side cost atomically and returns the new balance.

3. Orders
   - `payments.order_type`: new | renewal | plan_change | credits, plus `periods`,
     `credit_package_id`, `target_subscription_id`, `billing` and `paid_at`.
   - `create_order(...)` replaces the plan-only `create_pending_order` (kept as a wrapper).
   - Invoices are created when the payment is completed, not while it is pending.
   - `complete_order_after_payment` now requires a pending payment and handles every order type.

4. Admin
   - Admin-only RPCs for dashboard stats, user overview, credit adjustments, license
     extension/status, manual license grant, device revocation and payment status changes.
     Every admin write is recorded in `admin_audit_logs` server-side.
*/

-- =========================================================
-- 1. Plans: credits included with each paid period
-- =========================================================
ALTER TABLE plans ADD COLUMN IF NOT EXISTS included_credits integer NOT NULL DEFAULT 0;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plans_included_credits_check') THEN
    ALTER TABLE plans ADD CONSTRAINT plans_included_credits_check CHECK (included_credits >= 0);
  END IF;
END $$;

-- Admins must also see inactive plans in the admin panel.
DROP POLICY IF EXISTS "plans_select_admin" ON plans;
CREATE POLICY "plans_select_admin" ON plans FOR SELECT TO authenticated USING (is_platform_admin());

-- Server-side contexts (SQL editor, service role: auth.uid() IS NULL) may set profiles.role,
-- e.g. grant_platform_admin() below. Client sessions still cannot.
CREATE OR REPLACE FUNCTION protect_profile_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT is_platform_admin() THEN
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

-- =========================================================
-- 2. Credit packages
-- =========================================================
CREATE TABLE IF NOT EXISTS credit_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  credits integer NOT NULL CHECK (credits > 0),
  price_cents integer NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  currency text NOT NULL DEFAULT 'TRY',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "credit_packages_select" ON credit_packages;
CREATE POLICY "credit_packages_select" ON credit_packages FOR SELECT
  TO anon, authenticated USING (is_active = true OR is_platform_admin());

DROP POLICY IF EXISTS "credit_packages_admin_insert" ON credit_packages;
CREATE POLICY "credit_packages_admin_insert" ON credit_packages FOR INSERT
  TO authenticated WITH CHECK (is_platform_admin());

DROP POLICY IF EXISTS "credit_packages_admin_update" ON credit_packages;
CREATE POLICY "credit_packages_admin_update" ON credit_packages FOR UPDATE
  TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());

DROP POLICY IF EXISTS "credit_packages_admin_delete" ON credit_packages;
CREATE POLICY "credit_packages_admin_delete" ON credit_packages FOR DELETE
  TO authenticated USING (is_platform_admin());

-- Example bundles, inactive until an admin sets real prices in the admin panel.
INSERT INTO credit_packages (slug, name, credits, price_cents, is_active, sort_order) VALUES
  ('kredi-500', '500 Kredi', 500, 50000, false, 1),
  ('kredi-2000', '2.000 Kredi', 2000, 180000, false, 2),
  ('kredi-5000', '5.000 Kredi', 5000, 400000, false, 3)
ON CONFLICT (slug) DO NOTHING;

-- =========================================================
-- 3. Wallets and ledger
-- =========================================================
CREATE TABLE IF NOT EXISTS credit_wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned integer NOT NULL DEFAULT 0,
  lifetime_spent integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE credit_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "credit_wallets_select_own_or_admin" ON credit_wallets;
CREATE POLICY "credit_wallets_select_own_or_admin" ON credit_wallets FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR is_platform_admin());

CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL CHECK (amount <> 0),
  balance_after integer NOT NULL,
  kind text NOT NULL CHECK (kind IN ('purchase', 'plan_grant', 'usage', 'admin_grant', 'admin_deduct', 'refund')),
  description text NOT NULL DEFAULT '',
  job_id uuid,
  payment_id uuid REFERENCES payments(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "credit_tx_select_own_or_admin" ON credit_transactions;
CREATE POLICY "credit_tx_select_own_or_admin" ON credit_transactions FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR is_platform_admin());

CREATE INDEX IF NOT EXISTS idx_credit_tx_user_created ON credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_tx_created ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_tx_kind ON credit_transactions(kind);

-- Internal: the only place balances change. Not callable by clients.
CREATE OR REPLACE FUNCTION apply_credit_change(
  p_user_id uuid,
  p_amount integer,
  p_kind text,
  p_description text,
  p_job_id uuid DEFAULT NULL,
  p_payment_id uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
BEGIN
  IF p_amount = 0 THEN
    SELECT balance INTO v_balance FROM credit_wallets WHERE user_id = p_user_id;
    RETURN COALESCE(v_balance, 0);
  END IF;

  INSERT INTO credit_wallets (user_id) VALUES (p_user_id) ON CONFLICT (user_id) DO NOTHING;

  SELECT balance INTO v_balance FROM credit_wallets WHERE user_id = p_user_id FOR UPDATE;

  IF v_balance + p_amount < 0 THEN
    RAISE EXCEPTION 'insufficient credits' USING ERRCODE = 'P0001', HINT = 'insufficient_credits';
  END IF;

  UPDATE credit_wallets
  SET balance = balance + p_amount,
      lifetime_earned = lifetime_earned + GREATEST(p_amount, 0),
      lifetime_spent = lifetime_spent + GREATEST(-p_amount, 0),
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_balance;

  INSERT INTO credit_transactions (user_id, amount, balance_after, kind, description, job_id, payment_id, created_by)
  VALUES (p_user_id, p_amount, v_balance, p_kind, COALESCE(p_description, ''), p_job_id, p_payment_id, auth.uid());

  RETURN v_balance;
END;
$$;

-- Supabase grants EXECUTE on new functions to anon/authenticated by default; revoke explicitly.
REVOKE ALL ON FUNCTION apply_credit_change(uuid, integer, text, text, uuid, uuid) FROM PUBLIC, anon, authenticated;

-- =========================================================
-- 4. Job types and jobs
-- =========================================================
CREATE TABLE IF NOT EXISTS job_types (
  key text PRIMARY KEY,
  label text NOT NULL,
  credit_cost integer NOT NULL DEFAULT 0 CHECK (credit_cost >= 0),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE job_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "job_types_select" ON job_types;
CREATE POLICY "job_types_select" ON job_types FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "job_types_admin_update" ON job_types;
CREATE POLICY "job_types_admin_update" ON job_types FOR UPDATE
  TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());

DROP POLICY IF EXISTS "job_types_admin_insert" ON job_types;
CREATE POLICY "job_types_admin_insert" ON job_types FOR INSERT
  TO authenticated WITH CHECK (is_platform_admin());

INSERT INTO job_types (key, label, credit_cost, sort_order) VALUES
  ('dilekce', 'Dilekçe üretimi', 10, 1),
  ('ictihat_arama', 'İçtihat araması', 2, 2),
  ('ai_arastirma', 'Yapay zekâ araştırması', 5, 3),
  ('belge_analizi', 'Belge analizi', 5, 4),
  ('sesli_asistan', 'Sesli asistan komutu', 1, 5),
  ('uets_tebligat', 'UETS tebligat işlemi', 1, 6),
  ('resmi_gazete', 'Resmî Gazete taraması', 1, 7),
  ('evrak_imza', 'Evrak imzalama', 2, 8),
  ('diger', 'Diğer', 1, 99)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  license_id uuid REFERENCES licenses(id) ON DELETE SET NULL,
  job_type text NOT NULL REFERENCES job_types(key),
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed')),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 1000),
  credits_used integer NOT NULL DEFAULT 0 CHECK (credits_used >= 0),
  duration_ms integer,
  app_version text NOT NULL DEFAULT '',
  platform text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jobs_select_own_or_admin" ON jobs;
CREATE POLICY "jobs_select_own_or_admin" ON jobs FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR is_platform_admin());

CREATE INDEX IF NOT EXISTS idx_jobs_user_created ON jobs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_created ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(job_type);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'credit_transactions_job_id_fkey') THEN
    ALTER TABLE credit_transactions
      ADD CONSTRAINT credit_transactions_job_id_fkey FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Called by the desktop app with the user's session. Cost is decided server-side.
CREATE OR REPLACE FUNCTION record_job(
  p_job_type text,
  p_status text DEFAULT 'completed',
  p_quantity integer DEFAULT 1,
  p_duration_ms integer DEFAULT NULL,
  p_app_version text DEFAULT '',
  p_platform text DEFAULT ''
)
RETURNS TABLE (job_id uuid, credits_used integer, balance integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_type job_types%ROWTYPE;
  v_license_id uuid;
  v_org_id uuid;
  v_cost integer := 0;
  v_job_id uuid;
  v_balance integer;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  IF p_status NOT IN ('completed', 'failed') THEN
    RAISE EXCEPTION 'invalid job status';
  END IF;

  IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 1000 THEN
    RAISE EXCEPTION 'invalid quantity';
  END IF;

  SELECT * INTO v_type FROM job_types WHERE key = p_job_type AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'unknown job type';
  END IF;

  -- Own active license, or an active license of the owner of an organization the user belongs to.
  SELECT l.id INTO v_license_id
  FROM licenses l
  WHERE l.status = 'active' AND l.ends_at > now()
    AND (
      l.user_id = v_user
      OR l.user_id IN (
        SELECT o.owner_id FROM organizations o
        JOIN organization_members m ON m.organization_id = o.id
        WHERE m.user_id = v_user
      )
    )
  ORDER BY (l.user_id = v_user) DESC, l.ends_at DESC
  LIMIT 1;

  IF v_license_id IS NULL THEN
    RAISE EXCEPTION 'no active license' USING HINT = 'no_active_license';
  END IF;

  SELECT m.organization_id INTO v_org_id
  FROM organization_members m WHERE m.user_id = v_user
  ORDER BY m.created_at LIMIT 1;

  IF p_status = 'completed' THEN
    v_cost := v_type.credit_cost * p_quantity;
  END IF;

  INSERT INTO jobs (user_id, organization_id, license_id, job_type, status, quantity, credits_used, duration_ms, app_version, platform)
  VALUES (v_user, v_org_id, v_license_id, v_type.key, p_status, p_quantity, v_cost, p_duration_ms,
          left(COALESCE(p_app_version, ''), 32), left(COALESCE(p_platform, ''), 16))
  RETURNING id INTO v_job_id;

  IF v_cost > 0 THEN
    v_balance := apply_credit_change(v_user, -v_cost, 'usage', v_type.label, v_job_id, NULL);
  ELSE
    SELECT w.balance INTO v_balance FROM credit_wallets w WHERE w.user_id = v_user;
  END IF;

  RETURN QUERY SELECT v_job_id, v_cost, COALESCE(v_balance, 0);
END;
$$;

REVOKE ALL ON FUNCTION record_job(text, text, integer, integer, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION record_job(text, text, integer, integer, text, text) TO authenticated;

-- =========================================================
-- 5. Orders
-- =========================================================
ALTER TABLE payments ALTER COLUMN plan_id DROP NOT NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS order_type text NOT NULL DEFAULT 'new';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS periods integer NOT NULL DEFAULT 1;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS credits integer NOT NULL DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS credit_package_id uuid REFERENCES credit_packages(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS target_subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS billing jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS admin_note text NOT NULL DEFAULT '';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_order_type_check') THEN
    ALTER TABLE payments ADD CONSTRAINT payments_order_type_check
      CHECK (order_type IN ('new', 'renewal', 'plan_change', 'credits'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_periods_check') THEN
    ALTER TABLE payments ADD CONSTRAINT payments_periods_check CHECK (periods BETWEEN 1 AND 5);
  END IF;
  ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
  ALTER TABLE payments ADD CONSTRAINT payments_status_check
    CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled'));
END $$;

CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_payment_unique ON invoices(payment_id);

CREATE OR REPLACE FUNCTION create_order(
  p_order_type text,
  p_plan_id uuid DEFAULT NULL,
  p_credit_package_id uuid DEFAULT NULL,
  p_periods integer DEFAULT 1,
  p_billing jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (payment_id uuid, order_number text, amount_cents integer, currency text, order_type text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_plan plans%ROWTYPE;
  v_package credit_packages%ROWTYPE;
  v_sub subscriptions%ROWTYPE;
  v_payment payments%ROWTYPE;
  v_billing jsonb;
  v_pending integer;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  IF p_order_type NOT IN ('new', 'renewal', 'plan_change', 'credits') THEN
    RAISE EXCEPTION 'invalid order type';
  END IF;

  IF p_periods IS NULL OR p_periods < 1 OR p_periods > 3 THEN
    RAISE EXCEPTION 'periods must be between 1 and 3';
  END IF;

  SELECT count(*) INTO v_pending FROM payments p
  WHERE p.user_id = v_user AND p.status = 'pending' AND p.created_at > now() - interval '1 day';
  IF v_pending >= 5 THEN
    RAISE EXCEPTION 'too many pending orders' USING HINT = 'too_many_pending';
  END IF;

  -- Keep only known billing keys, trimmed.
  v_billing := jsonb_build_object(
    'name', left(COALESCE(p_billing ->> 'name', ''), 200),
    'tax_id', left(COALESCE(p_billing ->> 'tax_id', ''), 20),
    'tax_office', left(COALESCE(p_billing ->> 'tax_office', ''), 100),
    'address', left(COALESCE(p_billing ->> 'address', ''), 400),
    'city', left(COALESCE(p_billing ->> 'city', ''), 100),
    'phone', left(COALESCE(p_billing ->> 'phone', ''), 40),
    'email', left(COALESCE(p_billing ->> 'email', ''), 200)
  );

  SELECT * INTO v_sub FROM subscriptions s
  WHERE s.user_id = v_user
  ORDER BY s.ends_at DESC
  LIMIT 1;

  IF p_order_type = 'credits' THEN
    SELECT * INTO v_package FROM credit_packages cp WHERE cp.id = p_credit_package_id AND cp.is_active = true;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'credit package not found or inactive';
    END IF;

    INSERT INTO payments (user_id, plan_id, order_type, periods, credits, credit_package_id,
                          amount_cents, currency, status, provider, billing)
    VALUES (v_user, NULL, 'credits', 1, v_package.credits, v_package.id,
            v_package.price_cents, v_package.currency, 'pending', 'pending-provider', v_billing)
    RETURNING * INTO v_payment;

  ELSE
    IF p_order_type = 'renewal' THEN
      IF v_sub.id IS NULL THEN
        RAISE EXCEPTION 'no subscription to renew';
      END IF;
      SELECT * INTO v_plan FROM plans pl WHERE pl.id = v_sub.plan_id;
    ELSE
      SELECT * INTO v_plan FROM plans pl WHERE pl.id = p_plan_id AND pl.is_active = true;
    END IF;

    IF v_plan.id IS NULL THEN
      RAISE EXCEPTION 'plan not found or inactive';
    END IF;

    IF p_order_type = 'new' AND v_sub.id IS NOT NULL AND v_sub.ends_at > now() AND v_sub.status = 'active' THEN
      RAISE EXCEPTION 'active subscription exists' USING HINT = 'use_renewal_or_plan_change';
    END IF;

    IF p_order_type = 'plan_change' THEN
      IF v_sub.id IS NULL THEN
        RAISE EXCEPTION 'no subscription to change';
      END IF;
      IF v_sub.plan_id = v_plan.id THEN
        RAISE EXCEPTION 'already on this plan' USING HINT = 'use_renewal';
      END IF;
    END IF;

    INSERT INTO payments (user_id, plan_id, order_type, periods, credits, target_subscription_id,
                          amount_cents, currency, status, provider, billing)
    VALUES (v_user, v_plan.id, p_order_type, p_periods, v_plan.included_credits * p_periods,
            CASE WHEN p_order_type = 'new' THEN NULL ELSE v_sub.id END,
            v_plan.price_cents * p_periods, v_plan.currency, 'pending', 'pending-provider', v_billing)
    RETURNING * INTO v_payment;
  END IF;

  RETURN QUERY SELECT v_payment.id, v_payment.order_number, v_payment.amount_cents, v_payment.currency, v_payment.order_type;
END;
$$;

REVOKE ALL ON FUNCTION create_order(text, uuid, uuid, integer, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION create_order(text, uuid, uuid, integer, jsonb) TO authenticated;

-- Backwards compatible wrapper for older clients.
CREATE OR REPLACE FUNCTION create_pending_order(p_plan_id uuid, p_billing jsonb)
RETURNS TABLE (payment_id uuid, order_number text, amount_cents integer, currency text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.payment_id, o.order_number, o.amount_cents, o.currency
  FROM create_order('new', p_plan_id, NULL, 1, p_billing) o;
$$;

REVOKE ALL ON FUNCTION create_pending_order(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION create_pending_order(uuid, jsonb) TO authenticated;

-- The user may cancel their own pending order.
CREATE OR REPLACE FUNCTION cancel_my_order(p_payment_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer;
BEGIN
  UPDATE payments SET status = 'cancelled'
  WHERE id = p_payment_id AND user_id = auth.uid() AND status = 'pending';
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated = 1;
END;
$$;

REVOKE ALL ON FUNCTION cancel_my_order(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION cancel_my_order(uuid) TO authenticated;

-- Internal audit helper.
CREATE OR REPLACE FUNCTION write_admin_audit(p_action text, p_target uuid, p_details text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO admin_audit_logs (admin_id, action, target_user_id, details)
    VALUES (auth.uid(), p_action, p_target, COALESCE(p_details, ''));
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION write_admin_audit(text, uuid, text) FROM PUBLIC, anon, authenticated;

-- Called by a verified payment webhook (service role) or a platform admin (manual payment / bank transfer).
-- Idempotent for completed payments; refuses anything that is not pending.
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
  v_plan plans%ROWTYPE;
  v_sub subscriptions%ROWTYPE;
  v_subscription_id uuid;
  v_license licenses%ROWTYPE;
  v_period interval;
  v_base timestamptz;
  v_new_end timestamptz;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND NOT is_platform_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT * INTO v_payment FROM payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'payment not found';
  END IF;

  IF v_payment.status = 'completed' THEN
    SELECT * INTO v_license FROM licenses l
    WHERE l.subscription_id = v_payment.subscription_id
    ORDER BY l.created_at ASC LIMIT 1;
    RETURN QUERY SELECT v_payment.subscription_id, v_license.id, v_license.license_key;
    RETURN;
  END IF;

  IF v_payment.status <> 'pending' THEN
    RAISE EXCEPTION 'payment is not pending (status: %)', v_payment.status;
  END IF;

  IF v_payment.order_type = 'credits' THEN
    IF v_payment.credits > 0 THEN
      PERFORM apply_credit_change(v_payment.user_id, v_payment.credits, 'purchase',
        'Kredi paketi · ' || v_payment.order_number, NULL, v_payment.id);
    END IF;
  ELSE
    SELECT * INTO v_plan FROM plans WHERE id = v_payment.plan_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'plan not found';
    END IF;

    v_period := CASE WHEN v_plan.billing_period = 'month' THEN interval '1 month' ELSE interval '1 year' END
                * v_payment.periods;

    IF v_payment.order_type = 'new' OR v_payment.target_subscription_id IS NULL THEN
      v_new_end := now() + v_period;

      INSERT INTO subscriptions (user_id, plan_id, status, started_at, ends_at)
      VALUES (v_payment.user_id, v_plan.id, 'active', now(), v_new_end)
      RETURNING id INTO v_subscription_id;

      INSERT INTO licenses (subscription_id, user_id, plan_id, status, started_at, ends_at)
      VALUES (v_subscription_id, v_payment.user_id, v_plan.id, 'active', now(), v_new_end)
      RETURNING * INTO v_license;
    ELSE
      SELECT * INTO v_sub FROM subscriptions WHERE id = v_payment.target_subscription_id FOR UPDATE;
      IF NOT FOUND OR v_sub.user_id <> v_payment.user_id THEN
        RAISE EXCEPTION 'target subscription not found';
      END IF;

      v_subscription_id := v_sub.id;
      v_base := GREATEST(now(), v_sub.ends_at);
      v_new_end := v_base + v_period;

      UPDATE subscriptions
      SET plan_id = v_plan.id,
          ends_at = v_new_end,
          status = 'active',
          cancelled_at = NULL,
          updated_at = now()
      WHERE id = v_sub.id;

      -- Suspended licenses stay suspended: that is an explicit admin decision.
      UPDATE licenses
      SET plan_id = v_plan.id,
          ends_at = v_new_end,
          status = CASE WHEN status = 'suspended' THEN status ELSE 'active' END
      WHERE licenses.subscription_id = v_sub.id;

      SELECT * INTO v_license FROM licenses l
      WHERE l.subscription_id = v_sub.id ORDER BY l.created_at ASC LIMIT 1;
    END IF;

    IF v_payment.credits > 0 THEN
      PERFORM apply_credit_change(v_payment.user_id, v_payment.credits, 'plan_grant',
        v_plan.name || ' paket kredisi · ' || v_payment.order_number, NULL, v_payment.id);
    END IF;
  END IF;

  UPDATE payments
  SET status = 'completed',
      paid_at = now(),
      subscription_id = COALESCE(v_subscription_id, payments.subscription_id),
      provider = COALESCE(NULLIF(p_provider, ''), provider),
      provider_payment_id = COALESCE(NULLIF(p_provider_payment_id, ''), provider_payment_id)
  WHERE id = p_payment_id;

  INSERT INTO invoices (
    payment_id, user_id, amount_cents, currency,
    billing_name, billing_tax_id, billing_tax_office,
    billing_address, billing_city, billing_phone, billing_email, status
  ) VALUES (
    v_payment.id, v_payment.user_id, v_payment.amount_cents, v_payment.currency,
    COALESCE(v_payment.billing ->> 'name', ''), COALESCE(v_payment.billing ->> 'tax_id', ''),
    COALESCE(v_payment.billing ->> 'tax_office', ''), COALESCE(v_payment.billing ->> 'address', ''),
    COALESCE(v_payment.billing ->> 'city', ''), COALESCE(v_payment.billing ->> 'phone', ''),
    COALESCE(v_payment.billing ->> 'email', ''), 'paid'
  )
  ON CONFLICT (payment_id) DO UPDATE SET status = 'paid';

  PERFORM write_admin_audit('payment.completed', v_payment.user_id,
    v_payment.order_number || ' ödemesi onaylandı (' || COALESCE(NULLIF(p_provider, ''), 'manuel') || ')');

  RETURN QUERY SELECT v_subscription_id, v_license.id, v_license.license_key;
END;
$$;

REVOKE ALL ON FUNCTION complete_order_after_payment(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION complete_order_after_payment(uuid, text, text) TO authenticated, service_role;

-- =========================================================
-- 6. Admin write RPCs
-- =========================================================
CREATE OR REPLACE FUNCTION admin_set_payment_status(p_payment_id uuid, p_status text, p_note text DEFAULT '')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment payments%ROWTYPE;
BEGIN
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT * INTO v_payment FROM payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'payment not found';
  END IF;

  IF p_status IN ('failed', 'cancelled') THEN
    IF v_payment.status <> 'pending' THEN
      RAISE EXCEPTION 'only pending payments can be marked failed or cancelled';
    END IF;
  ELSIF p_status = 'refunded' THEN
    IF v_payment.status <> 'completed' THEN
      RAISE EXCEPTION 'only completed payments can be refunded';
    END IF;
    -- Take back purchased credits (fails if already spent; adjust manually first in that case).
    IF v_payment.order_type = 'credits' AND v_payment.credits > 0 THEN
      PERFORM apply_credit_change(v_payment.user_id, -v_payment.credits, 'refund',
        'İade · ' || v_payment.order_number, NULL, v_payment.id);
    END IF;
    UPDATE invoices SET status = 'void' WHERE payment_id = v_payment.id;
  ELSE
    RAISE EXCEPTION 'invalid status';
  END IF;

  UPDATE payments
  SET status = p_status,
      admin_note = COALESCE(NULLIF(p_note, ''), admin_note)
  WHERE id = v_payment.id;

  PERFORM write_admin_audit('payment.' || p_status, v_payment.user_id,
    v_payment.order_number || COALESCE(' · ' || NULLIF(p_note, ''), ''));
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION admin_adjust_credits(p_user_id uuid, p_amount integer, p_reason text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
BEGIN
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF p_amount IS NULL OR p_amount = 0 THEN
    RAISE EXCEPTION 'amount must be non-zero';
  END IF;
  IF COALESCE(trim(p_reason), '') = '' THEN
    RAISE EXCEPTION 'reason is required';
  END IF;

  v_balance := apply_credit_change(p_user_id, p_amount,
    CASE WHEN p_amount > 0 THEN 'admin_grant' ELSE 'admin_deduct' END, trim(p_reason), NULL, NULL);

  PERFORM write_admin_audit('credits.adjusted', p_user_id,
    (CASE WHEN p_amount > 0 THEN '+' ELSE '' END) || p_amount || ' kredi · ' || trim(p_reason));
  RETURN v_balance;
END;
$$;

CREATE OR REPLACE FUNCTION admin_extend_license(p_license_id uuid, p_days integer)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_license licenses%ROWTYPE;
  v_new_end timestamptz;
BEGIN
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF p_days IS NULL OR p_days < 1 OR p_days > 3650 THEN
    RAISE EXCEPTION 'days must be between 1 and 3650';
  END IF;

  SELECT * INTO v_license FROM licenses WHERE id = p_license_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'license not found';
  END IF;

  v_new_end := GREATEST(now(), v_license.ends_at) + make_interval(days => p_days);

  UPDATE licenses
  SET ends_at = v_new_end,
      status = CASE WHEN status = 'expired' THEN 'active' ELSE status END
  WHERE id = v_license.id;

  UPDATE subscriptions
  SET ends_at = GREATEST(ends_at, v_new_end),
      status = CASE WHEN status = 'expired' THEN 'active' ELSE status END,
      updated_at = now()
  WHERE id = v_license.subscription_id;

  PERFORM write_admin_audit('license.extended', v_license.user_id, p_days || ' gün uzatıldı');
  RETURN v_new_end;
END;
$$;

CREATE OR REPLACE FUNCTION admin_set_license_status(p_license_id uuid, p_status text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_license licenses%ROWTYPE;
BEGIN
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF p_status NOT IN ('active', 'suspended', 'cancelled') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;

  UPDATE licenses SET status = p_status WHERE id = p_license_id RETURNING * INTO v_license;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'license not found';
  END IF;

  IF p_status <> 'active' THEN
    UPDATE devices SET is_active = false WHERE license_id = p_license_id;
  END IF;

  PERFORM write_admin_audit('license.' || p_status, v_license.user_id, 'Lisans durumu: ' || p_status);
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION admin_grant_license(p_user_id uuid, p_plan_id uuid, p_days integer, p_reason text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan plans%ROWTYPE;
  v_sub subscriptions%ROWTYPE;
  v_sub_id uuid;
  v_license_id uuid;
  v_new_end timestamptz;
BEGIN
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF p_days IS NULL OR p_days < 1 OR p_days > 3650 THEN
    RAISE EXCEPTION 'days must be between 1 and 3650';
  END IF;
  IF COALESCE(trim(p_reason), '') = '' THEN
    RAISE EXCEPTION 'reason is required';
  END IF;

  SELECT * INTO v_plan FROM plans WHERE id = p_plan_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'plan not found';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'user not found';
  END IF;

  SELECT * INTO v_sub FROM subscriptions WHERE user_id = p_user_id ORDER BY ends_at DESC LIMIT 1 FOR UPDATE;

  IF v_sub.id IS NOT NULL THEN
    -- Extend / switch the existing subscription instead of creating a second one.
    v_new_end := GREATEST(now(), v_sub.ends_at) + make_interval(days => p_days);
    UPDATE subscriptions SET plan_id = v_plan.id, ends_at = v_new_end, status = 'active', updated_at = now()
    WHERE id = v_sub.id;
    UPDATE licenses SET plan_id = v_plan.id, ends_at = v_new_end, status = 'active'
    WHERE subscription_id = v_sub.id;
    SELECT id INTO v_license_id FROM licenses WHERE subscription_id = v_sub.id ORDER BY created_at LIMIT 1;
    v_sub_id := v_sub.id;
  END IF;

  IF v_license_id IS NULL THEN
    v_new_end := now() + make_interval(days => p_days);
    IF v_sub_id IS NULL THEN
      INSERT INTO subscriptions (user_id, plan_id, status, started_at, ends_at)
      VALUES (p_user_id, v_plan.id, 'active', now(), v_new_end)
      RETURNING id INTO v_sub_id;
    END IF;
    INSERT INTO licenses (subscription_id, user_id, plan_id, status, started_at, ends_at)
    VALUES (v_sub_id, p_user_id, v_plan.id, 'active', now(), v_new_end)
    RETURNING id INTO v_license_id;
  END IF;

  PERFORM write_admin_audit('license.granted', p_user_id,
    v_plan.name || ' · ' || p_days || ' gün · ' || trim(p_reason));
  RETURN v_license_id;
END;
$$;

CREATE OR REPLACE FUNCTION admin_deactivate_devices(p_user_id uuid, p_device_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE devices SET is_active = false
  WHERE user_id = p_user_id AND is_active = true AND (p_device_id IS NULL OR id = p_device_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;

  PERFORM write_admin_audit('devices.revoked', p_user_id, v_count || ' cihazın yetkisi kaldırıldı');
  RETURN v_count;
END;
$$;

-- =========================================================
-- 7. Admin read RPCs
-- =========================================================
CREATE OR REPLACE FUNCTION admin_user_overview()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  phone text,
  account_type text,
  bar_association text,
  created_at timestamptz,
  organization_name text,
  plan_name text,
  license_id uuid,
  license_status text,
  license_ends_at timestamptz,
  active_devices integer,
  last_activity timestamptz,
  credit_balance integer,
  credits_spent integer,
  jobs_total integer,
  jobs_30d integer,
  total_paid_cents bigint,
  pending_orders integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  SELECT
    p.id, p.email, p.full_name, p.phone, p.account_type, p.bar_association, p.created_at,
    org.name,
    lic.plan_name, lic.id, lic.status, lic.ends_at,
    COALESCE(dev.cnt, 0)::integer,
    GREATEST(act.last_at, jb.last_at),
    COALESCE(w.balance, 0),
    COALESCE(w.lifetime_spent, 0),
    COALESCE(jb.total, 0)::integer,
    COALESCE(jb.last30, 0)::integer,
    COALESCE(pay.paid, 0)::bigint,
    COALESCE(pay.pending, 0)::integer
  FROM profiles p
  LEFT JOIN LATERAL (
    SELECT o.name FROM organization_members m JOIN organizations o ON o.id = m.organization_id
    WHERE m.user_id = p.id ORDER BY m.created_at LIMIT 1
  ) org ON true
  LEFT JOIN LATERAL (
    SELECT l.id, l.status, l.ends_at, pl.name AS plan_name
    FROM licenses l JOIN plans pl ON pl.id = l.plan_id
    WHERE l.user_id = p.id ORDER BY l.ends_at DESC LIMIT 1
  ) lic ON true
  LEFT JOIN LATERAL (
    SELECT count(*) AS cnt FROM devices d WHERE d.user_id = p.id AND d.is_active
  ) dev ON true
  LEFT JOIN LATERAL (
    SELECT max(a.created_at) AS last_at FROM activity_events a WHERE a.user_id = p.id
  ) act ON true
  LEFT JOIN LATERAL (
    SELECT count(*) AS total,
           count(*) FILTER (WHERE j.created_at > now() - interval '30 days') AS last30,
           max(j.created_at) AS last_at
    FROM jobs j WHERE j.user_id = p.id
  ) jb ON true
  LEFT JOIN LATERAL (
    SELECT sum(pm.amount_cents) FILTER (WHERE pm.status = 'completed') AS paid,
           count(*) FILTER (WHERE pm.status = 'pending') AS pending
    FROM payments pm WHERE pm.user_id = p.id
  ) pay ON true
  LEFT JOIN credit_wallets w ON w.user_id = p.id
  ORDER BY p.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month_start timestamptz := date_trunc('month', now());
  v_result jsonb;
BEGIN
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT jsonb_build_object(
    'total_users', (SELECT count(*) FROM profiles),
    'new_users_month', (SELECT count(*) FROM profiles WHERE created_at >= v_month_start),
    'active_licenses', (SELECT count(*) FROM licenses WHERE status = 'active' AND ends_at > now()),
    'expiring_licenses', (SELECT count(*) FROM licenses WHERE status = 'active' AND ends_at > now() AND ends_at < now() + interval '30 days'),
    'revenue_total', (SELECT COALESCE(sum(amount_cents), 0) FROM payments WHERE status = 'completed'),
    'revenue_month', (SELECT COALESCE(sum(amount_cents), 0) FROM payments WHERE status = 'completed' AND COALESCE(paid_at, created_at) >= v_month_start),
    'pending_orders', (SELECT count(*) FROM payments WHERE status = 'pending'),
    'pending_amount', (SELECT COALESCE(sum(amount_cents), 0) FROM payments WHERE status = 'pending'),
    'credits_outstanding', (SELECT COALESCE(sum(balance), 0) FROM credit_wallets),
    'credits_used_month', (SELECT COALESCE(-sum(amount), 0) FROM credit_transactions WHERE kind = 'usage' AND created_at >= v_month_start),
    'jobs_month', (SELECT count(*) FROM jobs WHERE created_at >= v_month_start),
    'jobs_total', (SELECT count(*) FROM jobs),
    'revenue_by_month', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('month', to_char(m, 'YYYY-MM'), 'amount', COALESCE(r.amount, 0)) ORDER BY m), '[]'::jsonb)
      FROM generate_series(date_trunc('month', now()) - interval '11 months', date_trunc('month', now()), interval '1 month') m
      LEFT JOIN (
        SELECT date_trunc('month', COALESCE(paid_at, created_at)) AS mo, sum(amount_cents) AS amount
        FROM payments WHERE status = 'completed' GROUP BY 1
      ) r ON r.mo = m
    ),
    'jobs_by_day', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('day', to_char(d, 'YYYY-MM-DD'), 'count', COALESCE(j.cnt, 0), 'credits', COALESCE(j.credits, 0)) ORDER BY d), '[]'::jsonb)
      FROM generate_series(date_trunc('day', now()) - interval '29 days', date_trunc('day', now()), interval '1 day') d
      LEFT JOIN (
        SELECT date_trunc('day', created_at) AS dy, count(*) AS cnt, sum(credits_used) AS credits
        FROM jobs WHERE created_at >= date_trunc('day', now()) - interval '29 days' GROUP BY 1
      ) j ON j.dy = d
    ),
    'jobs_by_type', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('key', t.key, 'label', t.label, 'count', COALESCE(j.cnt, 0), 'credits', COALESCE(j.credits, 0)) ORDER BY COALESCE(j.cnt, 0) DESC, t.sort_order), '[]'::jsonb)
      FROM job_types t
      LEFT JOIN (
        SELECT job_type, count(*) AS cnt, sum(credits_used) AS credits
        FROM jobs WHERE created_at >= now() - interval '30 days' GROUP BY 1
      ) j ON j.job_type = t.key
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

DO $$
DECLARE
  f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'admin_set_payment_status(uuid, text, text)',
    'admin_adjust_credits(uuid, integer, text)',
    'admin_extend_license(uuid, integer)',
    'admin_set_license_status(uuid, text)',
    'admin_grant_license(uuid, uuid, integer, text)',
    'admin_deactivate_devices(uuid, uuid)',
    'admin_user_overview()',
    'admin_dashboard_stats()'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f);
  END LOOP;
END $$;

-- =========================================================
-- 8. Granting platform admin (run from the Supabase SQL editor only)
-- =========================================================
-- SELECT grant_platform_admin('ornek@faraklit.com');
CREATE OR REPLACE FUNCTION grant_platform_admin(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer;
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
  WHERE lower(email) = lower(trim(p_email));
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  UPDATE profiles SET role = 'admin' WHERE lower(email) = lower(trim(p_email));
  RETURN v_updated = 1;
END;
$$;

REVOKE ALL ON FUNCTION grant_platform_admin(text) FROM PUBLIC, anon, authenticated;

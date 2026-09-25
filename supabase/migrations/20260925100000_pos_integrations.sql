/*
  # POS integrations (admin)

  Lets platform admins manage virtual POS providers (iyzico, PayTR, Param, Sipay, Garanti BBVA) from the admin panel.

  1. Tables
    - `pos_integrations`: one row per provider with its public settings (enabled, test/live mode, merchant number,
      commission, installments, default provider). Readable by platform admins only; changed through RPCs.
    - `pos_integration_secrets`: API keys per provider and mode. Write-only from the browser: RLS is enabled with no
      policies and table privileges are revoked, so only SECURITY DEFINER functions and the service role can read
      them. Admins see whether a key is saved and its last 4 characters, never the value.

  2. Functions
    - `admin_pos_overview()`: settings, key status and the last 30 days of completed payments per provider.
    - `admin_update_pos_integration(...)`, `admin_set_pos_default(provider)`, `admin_set_pos_secret(...)`.
    - `get_pos_credentials(provider)`: service role only, for the payment edge function / webhook.

  3. Every change is written to `admin_audit_logs` (secret values are never logged).
*/

CREATE TABLE IF NOT EXISTS pos_integrations (
  provider text PRIMARY KEY CHECK (provider ~ '^[a-z0-9-]{2,32}$'),
  display_name text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT false,
  is_default boolean NOT NULL DEFAULT false,
  mode text NOT NULL DEFAULT 'test' CHECK (mode IN ('test', 'live')),
  merchant_id text NOT NULL DEFAULT '' CHECK (char_length(merchant_id) <= 100),
  commission_rate numeric(5,2) NOT NULL DEFAULT 0 CHECK (commission_rate BETWEEN 0 AND 100),
  max_installments integer NOT NULL DEFAULT 1 CHECK (max_installments BETWEEN 1 AND 12),
  require_3ds boolean NOT NULL DEFAULT true,
  notes text NOT NULL DEFAULT '' CHECK (char_length(notes) <= 1000),
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Only one default provider, and it must be enabled.
CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_integrations_single_default ON pos_integrations ((true)) WHERE is_default;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pos_integrations_default_enabled_check') THEN
    ALTER TABLE pos_integrations ADD CONSTRAINT pos_integrations_default_enabled_check CHECK (NOT is_default OR is_enabled);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS pos_integration_secrets (
  provider text NOT NULL REFERENCES pos_integrations(provider) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('test', 'live')),
  name text NOT NULL CHECK (name ~ '^[a-z0-9_]{2,40}$'),
  value text NOT NULL CHECK (char_length(value) BETWEEN 1 AND 4000),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  PRIMARY KEY (provider, mode, name)
);

ALTER TABLE pos_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_integration_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pos_integrations_select_admin" ON pos_integrations;
CREATE POLICY "pos_integrations_select_admin" ON pos_integrations FOR SELECT
  TO authenticated USING (is_platform_admin());

-- Writes go through the RPCs below; secrets are never readable from the browser.
REVOKE ALL ON pos_integrations FROM anon, authenticated;
GRANT SELECT ON pos_integrations TO authenticated;
REVOKE ALL ON pos_integration_secrets FROM anon, authenticated;

INSERT INTO pos_integrations (provider, display_name, sort_order) VALUES
  ('iyzico', 'iyzico', 1),
  ('paytr', 'PayTR', 2),
  ('param', 'Param', 3),
  ('sipay', 'Sipay', 4),
  ('garanti', 'Garanti BBVA Sanal POS', 5)
ON CONFLICT (provider) DO NOTHING;

-- ---------------------------------------------------------
-- Overview for the admin page
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_pos_overview()
RETURNS TABLE (
  provider text,
  display_name text,
  is_enabled boolean,
  is_default boolean,
  mode text,
  merchant_id text,
  commission_rate numeric,
  max_installments integer,
  require_3ds boolean,
  notes text,
  updated_at timestamptz,
  secrets jsonb,
  payments_30d integer,
  volume_30d_cents bigint,
  last_paid_at timestamptz
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
    i.provider, i.display_name, i.is_enabled, i.is_default, i.mode, i.merchant_id,
    i.commission_rate, i.max_installments, i.require_3ds, i.notes, i.updated_at,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'mode', s.mode,
        'name', s.name,
        'last4', CASE WHEN char_length(s.value) >= 8 THEN right(s.value, 4) ELSE '' END,
        'updated_at', s.updated_at))
      FROM pos_integration_secrets s WHERE s.provider = i.provider
    ), '[]'::jsonb),
    COALESCE(p.cnt, 0)::integer,
    COALESCE(p.total, 0)::bigint,
    p.last_paid
  FROM pos_integrations i
  LEFT JOIN LATERAL (
    SELECT count(*) FILTER (WHERE pay.paid_at >= now() - interval '30 days') AS cnt,
           sum(pay.amount_cents) FILTER (WHERE pay.paid_at >= now() - interval '30 days') AS total,
           max(pay.paid_at) AS last_paid
    FROM payments pay
    WHERE pay.provider = i.provider AND pay.status = 'completed'
  ) p ON true
  ORDER BY i.sort_order, i.display_name;
END;
$$;

-- ---------------------------------------------------------
-- Settings
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_update_pos_integration(
  p_provider text,
  p_is_enabled boolean,
  p_mode text,
  p_merchant_id text,
  p_commission_rate numeric,
  p_max_installments integer,
  p_require_3ds boolean,
  p_notes text DEFAULT ''
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row pos_integrations%ROWTYPE;
BEGIN
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF p_mode NOT IN ('test', 'live') THEN
    RAISE EXCEPTION 'invalid pos mode';
  END IF;

  SELECT * INTO v_row FROM pos_integrations WHERE provider = p_provider FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'pos provider not found';
  END IF;

  IF p_is_enabled AND NOT EXISTS (
    SELECT 1 FROM pos_integration_secrets s WHERE s.provider = p_provider AND s.mode = p_mode
  ) THEN
    RAISE EXCEPTION 'pos keys missing' USING HINT = 'pos_keys_missing';
  END IF;

  UPDATE pos_integrations SET
    is_enabled = p_is_enabled,
    -- A disabled provider cannot stay the default.
    is_default = is_default AND p_is_enabled,
    mode = p_mode,
    merchant_id = trim(COALESCE(p_merchant_id, '')),
    commission_rate = COALESCE(p_commission_rate, 0),
    max_installments = COALESCE(p_max_installments, 1),
    require_3ds = COALESCE(p_require_3ds, true),
    notes = trim(COALESCE(p_notes, '')),
    updated_at = now(),
    updated_by = auth.uid()
  WHERE provider = p_provider;

  PERFORM write_admin_audit('pos.updated', NULL,
    v_row.display_name || ': ' || CASE WHEN p_is_enabled THEN 'aktif' ELSE 'kapalı' END
    || ', ' || CASE WHEN p_mode = 'live' THEN 'canlı' ELSE 'test' END || ' mod');
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION admin_set_pos_default(p_provider text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row pos_integrations%ROWTYPE;
BEGIN
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT * INTO v_row FROM pos_integrations WHERE provider = p_provider FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'pos provider not found';
  END IF;
  IF NOT v_row.is_enabled THEN
    RAISE EXCEPTION 'pos provider disabled' USING HINT = 'pos_disabled';
  END IF;

  UPDATE pos_integrations SET is_default = false WHERE is_default AND provider <> p_provider;
  UPDATE pos_integrations SET is_default = true, updated_at = now(), updated_by = auth.uid() WHERE provider = p_provider;

  PERFORM write_admin_audit('pos.default', NULL, v_row.display_name || ' varsayılan POS yapıldı');
  RETURN true;
END;
$$;

-- An empty value deletes the key. The value itself is never logged or returned.
CREATE OR REPLACE FUNCTION admin_set_pos_secret(p_provider text, p_mode text, p_name text, p_value text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row pos_integrations%ROWTYPE;
  v_value text := trim(COALESCE(p_value, ''));
BEGIN
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF p_mode NOT IN ('test', 'live') THEN
    RAISE EXCEPTION 'invalid pos mode';
  END IF;

  SELECT * INTO v_row FROM pos_integrations WHERE provider = p_provider;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'pos provider not found';
  END IF;

  IF v_value = '' THEN
    DELETE FROM pos_integration_secrets WHERE provider = p_provider AND mode = p_mode AND name = p_name;
    -- Without any key for its active mode an enabled provider would fail at checkout; switch it off.
    IF v_row.is_enabled AND v_row.mode = p_mode AND NOT EXISTS (
      SELECT 1 FROM pos_integration_secrets s WHERE s.provider = p_provider AND s.mode = p_mode
    ) THEN
      UPDATE pos_integrations SET is_enabled = false, is_default = false, updated_at = now(), updated_by = auth.uid()
      WHERE provider = p_provider;
    END IF;
  ELSE
    INSERT INTO pos_integration_secrets (provider, mode, name, value, updated_at, updated_by)
    VALUES (p_provider, p_mode, p_name, v_value, now(), auth.uid())
    ON CONFLICT (provider, mode, name) DO UPDATE
      SET value = EXCLUDED.value, updated_at = now(), updated_by = auth.uid();
  END IF;

  PERFORM write_admin_audit(CASE WHEN v_value = '' THEN 'pos.key_removed' ELSE 'pos.key_saved' END, NULL,
    v_row.display_name || ' · ' || CASE WHEN p_mode = 'live' THEN 'canlı' ELSE 'test' END || ' · ' || p_name);
  RETURN true;
END;
$$;

-- For the payment edge function / webhook (service role key only).
CREATE OR REPLACE FUNCTION get_pos_credentials(p_provider text)
RETURNS TABLE (provider text, mode text, merchant_id text, credentials jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.provider, i.mode, i.merchant_id,
         COALESCE((SELECT jsonb_object_agg(s.name, s.value) FROM pos_integration_secrets s
                   WHERE s.provider = i.provider AND s.mode = i.mode), '{}'::jsonb)
  FROM pos_integrations i
  WHERE i.provider = p_provider AND i.is_enabled;
$$;

REVOKE ALL ON FUNCTION get_pos_credentials(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION get_pos_credentials(text) TO service_role;

DO $$
DECLARE
  f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'admin_pos_overview()',
    'admin_update_pos_integration(text, boolean, text, text, numeric, integer, boolean, text)',
    'admin_set_pos_default(text)',
    'admin_set_pos_secret(text, text, text, text)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f);
  END LOOP;
END $$;

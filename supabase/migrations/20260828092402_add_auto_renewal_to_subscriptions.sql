/*
# Add auto-renewal to subscriptions

1. Modified Tables
- `subscriptions` — add `auto_renew` boolean (default true) and `cancelled_at` timestamptz (nullable).
2. Security
- No policy changes. Existing UPDATE policies already cover the new columns.
3. Notes
- `auto_renew` lets users toggle automatic renewal of their yearly plan.
- `cancelled_at` records when a user cancels auto-renewal (not the subscription itself).
*/

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS auto_renew boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

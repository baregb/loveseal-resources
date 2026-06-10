-- Newsletter subscribers
-- Run in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text        NOT NULL,
  locale        text        NOT NULL DEFAULT 'en',
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  active        boolean     NOT NULL DEFAULT true,
  CONSTRAINT newsletter_subscribers_email_key UNIQUE (email)
);

-- Only the service-role key (used server-side) can read or write.
-- Direct browser access is blocked entirely.
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only"
  ON newsletter_subscribers
  USING (false);

-- Index for admin subscriber lookups
CREATE INDEX IF NOT EXISTS newsletter_subscribers_subscribed_at_idx
  ON newsletter_subscribers (subscribed_at DESC);

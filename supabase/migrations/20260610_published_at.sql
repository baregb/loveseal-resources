-- Add published_at to content table for editorial backdating.
-- Existing rows get their created_at value so nothing breaks.
ALTER TABLE content ADD COLUMN IF NOT EXISTS published_at timestamptz;
UPDATE content SET published_at = created_at WHERE published_at IS NULL;
ALTER TABLE content ALTER COLUMN published_at SET DEFAULT now();
ALTER TABLE content ALTER COLUMN published_at SET NOT NULL;
CREATE INDEX IF NOT EXISTS content_published_at_status_idx ON content (published_at DESC, status);

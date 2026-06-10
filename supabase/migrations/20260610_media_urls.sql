-- Audio and video URL fields for content items.
-- Both are optional — most posts will leave them null.
ALTER TABLE content ADD COLUMN IF NOT EXISTS audio_url text;
ALTER TABLE content ADD COLUMN IF NOT EXISTS video_url text;

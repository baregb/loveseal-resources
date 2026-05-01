-- ─────────────────────────────────────────────────────────────────────────────
-- LOVE SEAL CHURCH — SUPABASE DATABASE SCHEMA
-- Run this entire file once in: Supabase Dashboard → SQL Editor → New query
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Extensions ──────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";
create extension if not exists "unaccent";
create extension if not exists "pg_trgm";

-- ── Enums ───────────────────────────────────────────────────────────────────

create type content_type as enum ('manual', 'prophecy', 'article', 'blog');
create type content_status as enum ('draft', 'published');
create type supported_locale as enum ('en', 'es', 'fr', 'pt', 'ar');

-- ── Categories table ─────────────────────────────────────────────────────────

create table if not exists categories (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  slug         text not null unique,
  content_type content_type,
  created_at   timestamptz not null default now()
);

comment on table categories is 'Admin-defined categories for organising content.';

-- ── Content table ────────────────────────────────────────────────────────────

create table if not exists content (
  id                uuid primary key default uuid_generate_v4(),
  title             text not null,
  content_type      content_type not null,
  category          text not null default '',
  tags              text[] not null default '{}',
  extracted_text    text,
  summary_points    text[],
  pdf_url           text not null,
  cover_image_url   text,
  status            content_status not null default 'draft',
  language          supported_locale not null default 'en',
  search_vector     tsvector,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table content is 'All published and draft content items uploaded by the admin.';
comment on column content.pdf_url is 'Supabase Storage path — not the full URL. Generate signed URL on the fly.';
comment on column content.search_vector is 'Trigger-maintained tsvector. Weighted: title (A) > text (B) > tags (C).';

-- ── Indexes ──────────────────────────────────────────────────────────────────

create index idx_content_status     on content (status);
create index idx_content_type       on content (content_type);
create index idx_content_category   on content (category);
create index idx_content_language   on content (language);
create index idx_content_created_at on content (created_at desc);

create index idx_content_published  on content (status, content_type, created_at desc)
  where status = 'published';

create index idx_content_search     on content using gin (search_vector);
create index idx_content_tags       on content using gin (tags);

-- ── Triggers ─────────────────────────────────────────────────────────────────

-- 1. Keep updated_at current
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger content_updated_at
  before update on content
  for each row execute function set_updated_at();

-- 2. Rebuild search_vector on insert or update of searchable columns
--    (uses a trigger instead of a generated column because to_tsvector
--     is STABLE not IMMUTABLE — Postgres rejects it in generated columns)
create or replace function update_search_vector()
returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.extracted_text, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(new.tags, ' '), '')), 'C');
  return new;
end;
$$ language plpgsql;

create trigger content_search_vector
  before insert or update of title, extracted_text, tags
  on content
  for each row execute function update_search_vector();

-- ── Row Level Security ───────────────────────────────────────────────────────

alter table content    enable row level security;
alter table categories enable row level security;

create policy "Public can read published content"
  on content for select
  using (status = 'published');

create policy "Public can read categories"
  on categories for select
  using (true);

create policy "Admin full access to content"
  on content for all
  using (auth.jwt() ->> 'email' = current_setting('app.admin_email', true))
  with check (auth.jwt() ->> 'email' = current_setting('app.admin_email', true));

create policy "Admin full access to categories"
  on categories for all
  using (auth.jwt() ->> 'email' = current_setting('app.admin_email', true))
  with check (auth.jwt() ->> 'email' = current_setting('app.admin_email', true));

-- ── Storage buckets ──────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'content-pdfs', 'content-pdfs', false, 52428800, array['application/pdf']
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cover-images', 'cover-images', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "Admin can upload PDFs"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'content-pdfs');

create policy "Admin can upload cover images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'cover-images');

create policy "Admin can delete PDFs"
  on storage.objects for delete to authenticated
  using (bucket_id = 'content-pdfs');

create policy "Admin can delete cover images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'cover-images');

create policy "Public can read cover images"
  on storage.objects for select
  using (bucket_id = 'cover-images');

-- ── Seed: default categories ─────────────────────────────────────────────────

insert into categories (name, slug, content_type) values
  ('Faith & Doctrine', 'faith-doctrine', null),
  ('Prayer',           'prayer',         null),
  ('Prophecy',         'prophecy',       'prophecy'),
  ('Teaching',         'teaching',       'manual'),
  ('Devotional',       'devotional',     'article'),
  ('Announcements',    'announcements',  'blog'),
  ('Youth',            'youth',          null),
  ('Family',           'family',         null)
on conflict (slug) do nothing;

-- ── Verify ───────────────────────────────────────────────────────────────────

select 'content'    as table_name, count(*) as rows from content    union all
select 'categories' as table_name, count(*) as rows from categories;

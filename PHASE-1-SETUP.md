# Love Seal Church — Phase 1 Setup Guide

Complete these steps in order. Each step ends with a verification checkpoint.

---

## Step 1 — Prerequisites

Make sure you have these installed:

```bash
node --version    # must be v20 or higher
npm --version     # must be v10 or higher
git --version     # any recent version
```

If Node is below v20, install it from https://nodejs.org (choose LTS).

---

## Step 2 — Clone and install

```bash
# 1. Put the project folder wherever you keep your projects
cd ~/Projects   # or wherever you prefer

# 2. Copy the project folder in (or init a git repo and push)
cd loveseal-church

# 3. Install dependencies
npm install

# 4. Verify — you should see no errors
npm run typecheck
```

---

## Step 3 — Supabase project setup

1. Go to https://supabase.com and sign in (or create a free account)
2. Click **New project**
3. Fill in:
   - **Name:** `loveseal-church`
   - **Database password:** generate a strong one and save it somewhere safe
   - **Region:** choose the closest to Nigeria — `West EU (Ireland)` or `US East` are fine
4. Wait ~2 minutes for the project to provision

### 3a — Run the database schema

1. In your Supabase project, go to **SQL Editor** → **New query**
2. Open `supabase-schema.sql` from the project root
3. Paste the entire contents into the SQL Editor
4. Click **Run**
5. You should see a result table showing `content: 0 rows` and `categories: 8 rows`

### 3b — Get your API keys

Go to **Settings → API** in your Supabase project:

- Copy **Project URL** → this is `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon public** key → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy **service_role** key → this is `SUPABASE_SERVICE_ROLE_KEY` (keep this secret)

---

## Step 4 — Environment variables

```bash
# In the project root, copy the example file
cp .env.local.example .env.local
```

Open `.env.local` and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Love Seal Church

ADMIN_EMAIL=your-admin-email@example.com
```

> ⚠️ Never commit `.env.local` to git. It is already in `.gitignore`.

---

## Step 5 — Create the admin user in Supabase

1. Go to **Authentication → Users** in your Supabase dashboard
2. Click **Add user → Create new user**
3. Enter the same email you put in `ADMIN_EMAIL`
4. Set a strong password
5. Click **Create user**

This is the only account that can access `/admin`.

---

## Step 6 — Run the development server

```bash
npm run dev
```

Open http://localhost:3000

You should see the Love Seal Church placeholder page with the gold heading on dark background.

**Checkpoint:** If you see the page → Phase 1 is working. ✓

---

## Step 7 — Connect to Vercel

```bash
# Install Vercel CLI globally if you don't have it
npm install -g vercel

# Link the project
vercel

# Follow the prompts:
# - Link to existing project? No → create new
# - Project name: loveseal-church
# - Framework: Next.js (auto-detected)
```

### 7a — Add environment variables to Vercel

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_APP_URL          # use your actual domain here
vercel env add NEXT_PUBLIC_APP_NAME
vercel env add ADMIN_EMAIL
```

Each command will prompt you to paste the value and choose environments (select all three: development, preview, production).

### 7b — Deploy

```bash
vercel --prod
```

You'll get a `.vercel.app` URL. Open it — same page as localhost. ✓

---

## Step 8 — Connect your domain

1. Go to your Vercel project dashboard → **Settings → Domains**
2. Click **Add domain**
3. Enter your church domain (e.g. `lovesealchurch.org`)
4. Vercel will show you DNS records to add
5. Log into your domain registrar and add the records
6. DNS propagates in 5–60 minutes

Update `NEXT_PUBLIC_APP_URL` in Vercel to your real domain once it's live:
```bash
vercel env rm NEXT_PUBLIC_APP_URL production
vercel env add NEXT_PUBLIC_APP_URL   # paste https://yourdomain.com
vercel --prod
```

Also update `public/robots.txt` — replace `yourchurchdomain.com` with your real domain.

---

## Step 9 — Verify the full setup

Run through this checklist:

```
[ ] npm run dev shows the placeholder page at localhost:3000
[ ] npm run typecheck exits with no errors
[ ] npm run build completes successfully
[ ] Supabase SQL Editor shows 8 categories seeded
[ ] Supabase Storage shows two buckets: content-pdfs and cover-images
[ ] Vercel deployment is live at your .vercel.app URL
[ ] Environment variables are set on Vercel (Settings → Environment Variables)
[ ] .env.local is NOT committed to git (check: git status)
```

If all boxes are ticked — Phase 1 is complete. Ready for Phase 2 (Admin Dashboard).

---

## Folder structure reference

```
loveseal-church/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout — fonts configured HERE
│   │   └── page.tsx            # Homepage placeholder (replaced in Phase 5)
│   ├── components/             # Shared React components (built in Phases 2–5)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Browser Supabase client
│   │   │   ├── server.ts       # Server Supabase client
│   │   │   └── admin.ts        # Admin Supabase client (service role)
│   │   └── utils.ts            # Helper functions
│   ├── types/
│   │   └── index.ts            # All TypeScript types
│   ├── styles/
│   │   └── globals.css         # Design tokens — ALL visual values live here
│   ├── hooks/                  # Custom React hooks (built in later phases)
│   ├── i18n/
│   │   ├── request.ts          # next-intl locale config
│   │   └── messages/           # Translation JSON files (en, es, fr, pt, ar)
│   └── middleware.ts           # Auth protection for /admin routes
├── public/
│   └── robots.txt
├── supabase-schema.sql         # Run once in Supabase SQL Editor
├── .env.local.example          # Copy to .env.local and fill in values
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
└── vercel.json
```

---

## Changing fonts (single location)

Open `src/app/layout.tsx`. The font declarations are at the top:

```typescript
const barlowCondensed = Barlow_Condensed({ ... variable: '--font-barlow' })
const dmSans = DM_Sans({ ... variable: '--font-dm-sans' })
```

Replace either import with any Google Font and update the variable name.
Everything in `globals.css` uses `var(--font-display)` and `var(--font-body)` —
the whole site updates instantly.

---

*Phase 1 complete. Next: Phase 2 — Admin Dashboard.*

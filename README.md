# 36and8

A simple, unbloated photo sharing site for analog photography.  
Built with SvelteKit + Supabase. DIY aesthetic — text-first, photos-second.

## Setup

### 1. Supabase

Create a [Supabase](https://supabase.com) project, then run the contents of `supabase/schema.sql` in the SQL Editor. This creates all tables, row-level security policies, storage buckets (photos, avatars), and the auth trigger.

### 2. Environment

Copy the example env file and fill in your Supabase credentials:

```sh
cp .env.example .env
```

Edit `.env`:

```
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install & Run

```sh
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Features

- **Upload** analog photos with metadata (camera, film stock, lens, format)
- **Tag** photos (comma-separated, e.g. `street, 35mm, portra`)
- **Favorite** and **critique** photos
- **User profiles** with tabs: Submissions, Favorites, Shoutbox (guestbook)
- **Profile settings** — bio, avatar, social links (YouTube, Instagram, TikTok)
- **Browse by tag** or filter feed by format (35mm / 120)
- **OG metadata** for sharing
- Email/password auth via Supabase

## Deployment (Vercel)

Deploy to production:

```sh
npm run deploy
```

Or, if npm has issues:

```sh
./node_modules/.bin/vercel --prod
```

Set `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` in your Vercel project environment variables.

## Stack

- [SvelteKit](https://kit.svelte.dev) (Svelte 5)
- [Supabase](https://supabase.com) (Auth, Postgres, Storage)
- Plain CSS — no UI framework

## Project Structure

```
src/
  routes/
    +page.svelte          # feed (home)
    login/                # sign in
    signup/               # create account
    upload/               # upload a photo
    settings/             # profile, avatar, social links
    photo/[id]/           # photo detail, critiques, favorites
    user/[username]/      # user profile (submissions, favorites, shoutbox)
    tag/[name]/           # photos by tag
    tags/                 # all tags
    api/photos/           # infinite scroll endpoint
    auth/callback/        # OAuth callback
  hooks.server.ts         # Supabase session management
  app.css                 # global styles
supabase/
  schema.sql              # full database schema + RLS
```

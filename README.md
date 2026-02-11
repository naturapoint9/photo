# grain

A simple, unbloated photo sharing site for analog photography.  
Built with SvelteKit + Supabase. DIY aesthetic — text-first, photos-second.

## Setup

### 1. Supabase

Create a [Supabase](https://supabase.com) project, then run the contents of `supabase/schema.sql` in the SQL Editor. This creates all tables, row-level security policies, the storage bucket, and the auth trigger.

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

- **Upload** analog photos with metadata (camera, film stock, lens)
- **Tag** photos (comma-separated, e.g. `street, 35mm, portra`)
- **Like** and **comment** on photos
- **User profiles** with photo grids
- **Browse by tag**
- Email/password auth via Supabase

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
    photo/[id]/           # photo detail, comments, likes
    user/[username]/      # user profile + grid
    tag/[name]/           # photos by tag
    auth/callback/        # OAuth callback
  lib/
    supabase.ts           # env re-exports
  hooks.server.ts         # Supabase session management
  app.css                 # global styles
supabase/
  schema.sql              # full database schema + RLS
```

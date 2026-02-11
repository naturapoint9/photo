-- ============================================================
-- 36AND8 -- analog photo sharing
-- Run this in the Supabase SQL Editor (or via psql)
-- ============================================================

-- ---------- profiles ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  username   text unique not null,
  bio        text default '',
  avatar_url text default '',
  link_youtube  text default '',
  link_instagram text default '',
  link_tiktok   text default '',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Anyone can view profiles"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data ->> 'username');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- photos ----------
create table if not exists public.photos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  image_url  text not null,
  caption    text default '',
  camera     text default '',
  film_stock text default '',
  lens       text default '',
  format     text default '',
  created_at timestamptz default now()
);

alter table public.photos enable row level security;

create policy "Anyone can view photos"
  on public.photos for select using (true);

create policy "Authenticated users can upload photos"
  on public.photos for insert with check (auth.uid() = user_id);

create policy "Users can update own photos"
  on public.photos for update using (auth.uid() = user_id);

create policy "Users can delete own photos"
  on public.photos for delete using (auth.uid() = user_id);

-- ---------- tags ----------
create table if not exists public.tags (
  id   serial primary key,
  name text unique not null
);

alter table public.tags enable row level security;

create policy "Anyone can view tags"
  on public.tags for select using (true);

create policy "Authenticated users can create tags"
  on public.tags for insert with check (auth.role() = 'authenticated');

-- ---------- photo_tags ----------
create table if not exists public.photo_tags (
  photo_id uuid not null references public.photos(id) on delete cascade,
  tag_id   int  not null references public.tags(id) on delete cascade,
  primary key (photo_id, tag_id)
);

alter table public.photo_tags enable row level security;

create policy "Anyone can view photo_tags"
  on public.photo_tags for select using (true);

create policy "Photo owner can tag"
  on public.photo_tags for insert with check (
    auth.uid() = (select user_id from public.photos where id = photo_id)
  );

create policy "Photo owner can untag"
  on public.photo_tags for delete using (
    auth.uid() = (select user_id from public.photos where id = photo_id)
  );

-- ---------- likes ----------
create table if not exists public.likes (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  photo_id   uuid not null references public.photos(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, photo_id)
);

alter table public.likes enable row level security;

create policy "Anyone can view likes"
  on public.likes for select using (true);

create policy "Authenticated users can like"
  on public.likes for insert with check (auth.uid() = user_id);

create policy "Users can unlike"
  on public.likes for delete using (auth.uid() = user_id);

-- ---------- comments ----------
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  photo_id   uuid not null references public.photos(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  body       text not null,
  created_at timestamptz default now()
);

alter table public.comments enable row level security;

create policy "Anyone can view comments"
  on public.comments for select using (true);

create policy "Authenticated users can comment"
  on public.comments for insert with check (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.comments for delete using (auth.uid() = user_id);

-- ---------- storage ----------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "Anyone can view photos in bucket"
  on storage.objects for select using (bucket_id = 'photos');

create policy "Authenticated users can upload photos"
  on storage.objects for insert with check (
    bucket_id = 'photos' and auth.role() = 'authenticated'
  );

create policy "Users can delete own photos from bucket"
  on storage.objects for delete using (
    bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---------- avatars storage ----------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Anyone can view avatars"
  on storage.objects for select using (bucket_id = 'avatars');

create policy "Authenticated users can upload avatars"
  on storage.objects for insert with check (
    bucket_id = 'avatars' and auth.role() = 'authenticated'
  );

create policy "Users can update own avatar"
  on storage.objects for update using (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own avatar"
  on storage.objects for delete using (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---------- indexes ----------
create index if not exists idx_photos_user_id on public.photos(user_id);
create index if not exists idx_photos_created_at on public.photos(created_at desc);
create index if not exists idx_comments_photo_id on public.comments(photo_id);
create index if not exists idx_likes_photo_id on public.likes(photo_id);
create index if not exists idx_photo_tags_tag_id on public.photo_tags(tag_id);

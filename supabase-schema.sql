-- 1. 在 Supabase Authentication 中创建唯一的站长用户，并复制该用户 UUID。
-- 2. 确认下方 UUID 与站长用户一致，然后在 SQL Editor 中执行完整脚本。

create extension if not exists pgcrypto;

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  excerpt text not null check (char_length(excerpt) between 1 and 300),
  content text not null,
  attachments jsonb not null default '[]'::jsonb,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists articles_set_updated_at on public.articles;
create trigger articles_set_updated_at
before update on public.articles
for each row execute function public.set_updated_at();

alter table public.articles enable row level security;

drop policy if exists "Public can read published articles" on public.articles;
create policy "Public can read published articles"
on public.articles for select
using (published = true);

drop policy if exists "Owner can read all articles" on public.articles;
create policy "Owner can read all articles"
on public.articles for select
to authenticated
using (auth.uid() = '35bd70b7-54c4-4238-b583-e4fbcd2fea52'::uuid);

drop policy if exists "Owner can insert articles" on public.articles;
create policy "Owner can insert articles"
on public.articles for insert
to authenticated
with check (
  auth.uid() = '35bd70b7-54c4-4238-b583-e4fbcd2fea52'::uuid
  and author_id = auth.uid()
);

drop policy if exists "Owner can update articles" on public.articles;
create policy "Owner can update articles"
on public.articles for update
to authenticated
using (auth.uid() = '35bd70b7-54c4-4238-b583-e4fbcd2fea52'::uuid)
with check (
  auth.uid() = '35bd70b7-54c4-4238-b583-e4fbcd2fea52'::uuid
  and author_id = auth.uid()
);

drop policy if exists "Owner can delete articles" on public.articles;
create policy "Owner can delete articles"
on public.articles for delete
to authenticated
using (auth.uid() = '35bd70b7-54c4-4238-b583-e4fbcd2fea52'::uuid);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  visitor_name text not null check (char_length(visitor_name) between 1 and 40),
  body text not null check (char_length(body) between 1 and 2000),
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  check (jsonb_typeof(attachments) = 'array' and jsonb_array_length(attachments) <= 3)
);

create index if not exists comments_article_created_idx
on public.comments (article_id, created_at);

alter table public.comments enable row level security;

drop policy if exists "Public can read comments" on public.comments;
create policy "Public can read comments"
on public.comments for select
using (true);

drop policy if exists "Public can create comments" on public.comments;
create policy "Public can create comments"
on public.comments for insert
to anon, authenticated
with check (
  exists (
    select 1 from public.articles
    where articles.id = article_id and articles.published = true
  )
);

drop policy if exists "Owner can delete comments" on public.comments;
create policy "Owner can delete comments"
on public.comments for delete
to authenticated
using (auth.uid() = '35bd70b7-54c4-4238-b583-e4fbcd2fea52'::uuid);

create table if not exists public.guestbook_messages (
  id uuid primary key default gen_random_uuid(),
  visitor_name text not null check (char_length(visitor_name) between 1 and 40),
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.guestbook_messages enable row level security;

drop policy if exists "Public can read guestbook messages" on public.guestbook_messages;
create policy "Public can read guestbook messages"
on public.guestbook_messages for select
using (true);

drop policy if exists "Public can create guestbook messages" on public.guestbook_messages;
create policy "Public can create guestbook messages"
on public.guestbook_messages for insert
to anon, authenticated
with check (true);

drop policy if exists "Owner can delete guestbook messages" on public.guestbook_messages;
create policy "Owner can delete guestbook messages"
on public.guestbook_messages for delete
to authenticated
using (auth.uid() = '35bd70b7-54c4-4238-b583-e4fbcd2fea52'::uuid);

insert into storage.buckets (id, name, public, file_size_limit)
values ('article-attachments', 'article-attachments', true, 10485760)
on conflict (id) do update
set public = excluded.public, file_size_limit = excluded.file_size_limit;

drop policy if exists "Public can read article attachments" on storage.objects;
create policy "Public can read article attachments"
on storage.objects for select
using (bucket_id = 'article-attachments');

drop policy if exists "Owner can upload article attachments" on storage.objects;
create policy "Owner can upload article attachments"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'article-attachments'
  and auth.uid() = '35bd70b7-54c4-4238-b583-e4fbcd2fea52'::uuid
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Owner can delete article attachments" on storage.objects;
create policy "Owner can delete article attachments"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'article-attachments'
  and auth.uid() = '35bd70b7-54c4-4238-b583-e4fbcd2fea52'::uuid
);

insert into storage.buckets (id, name, public, file_size_limit)
values ('comment-attachments', 'comment-attachments', true, 10485760)
on conflict (id) do update
set public = excluded.public, file_size_limit = excluded.file_size_limit;

drop policy if exists "Public can read comment attachments" on storage.objects;
create policy "Public can read comment attachments"
on storage.objects for select
using (bucket_id = 'comment-attachments');

drop policy if exists "Public can upload comment attachments" on storage.objects;
create policy "Public can upload comment attachments"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'comment-attachments');

drop policy if exists "Owner can delete comment attachments" on storage.objects;
create policy "Owner can delete comment attachments"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'comment-attachments'
  and auth.uid() = '35bd70b7-54c4-4238-b583-e4fbcd2fea52'::uuid
);

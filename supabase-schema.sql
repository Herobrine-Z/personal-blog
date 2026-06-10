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

alter table public.articles add column if not exists category text not null default '随笔';
alter table public.articles add column if not exists tags text[] not null default '{}';
alter table public.articles add column if not exists scheduled_at timestamptz;
alter table public.articles add column if not exists view_count bigint not null default 0;
alter table public.articles add column if not exists like_count bigint not null default 0;
alter table public.articles add column if not exists favorite_count bigint not null default 0;

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

alter table public.comments add column if not exists parent_id uuid references public.comments(id) on delete cascade;
alter table public.comments add column if not exists approved boolean not null default true;
alter table public.comments add column if not exists visitor_token text;

create index if not exists comments_article_created_idx
on public.comments (article_id, created_at);

create index if not exists comments_parent_idx on public.comments (parent_id);

alter table public.comments enable row level security;

drop policy if exists "Public can read comments" on public.comments;
create policy "Public can read comments"
on public.comments for select
using (approved = true);

drop policy if exists "Owner can read all comments" on public.comments;
create policy "Owner can read all comments"
on public.comments for select
to authenticated
using (auth.uid() = '35bd70b7-54c4-4238-b583-e4fbcd2fea52'::uuid);

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

drop policy if exists "Owner can update comments" on public.comments;
create policy "Owner can update comments"
on public.comments for update
to authenticated
using (auth.uid() = '35bd70b7-54c4-4238-b583-e4fbcd2fea52'::uuid)
with check (auth.uid() = '35bd70b7-54c4-4238-b583-e4fbcd2fea52'::uuid);

create table if not exists public.guestbook_messages (
  id uuid primary key default gen_random_uuid(),
  visitor_name text not null check (char_length(visitor_name) between 1 and 40),
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.guestbook_messages add column if not exists visitor_token text;

create or replace function public.guard_public_content()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.visitor_token is null or char_length(new.visitor_token) < 16 then
    raise exception 'Invalid visitor token';
  end if;

  if tg_table_name = 'comments' then
    if (
      select count(*) from public.comments
      where visitor_token = new.visitor_token
        and created_at > now() - interval '10 minutes'
    ) >= 3 then
      raise exception '评论过于频繁，请稍后再试';
    end if;
    if new.parent_id is not null and not exists (
      select 1 from public.comments
      where id = new.parent_id and article_id = new.article_id and parent_id is null
    ) then
      raise exception 'Invalid reply target';
    end if;
  else
    if (
      select count(*) from public.guestbook_messages
      where visitor_token = new.visitor_token
        and created_at > now() - interval '10 minutes'
    ) >= 3 then
      raise exception '留言过于频繁，请稍后再试';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists comments_guard_public_content on public.comments;
create trigger comments_guard_public_content
before insert on public.comments
for each row execute function public.guard_public_content();

drop trigger if exists guestbook_guard_public_content on public.guestbook_messages;
create trigger guestbook_guard_public_content
before insert on public.guestbook_messages
for each row execute function public.guard_public_content();

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

create table if not exists public.article_reactions (
  article_id uuid not null references public.articles(id) on delete cascade,
  visitor_token text not null check (char_length(visitor_token) between 16 and 100),
  reaction_type text not null check (reaction_type in ('like', 'favorite')),
  created_at timestamptz not null default now(),
  primary key (article_id, visitor_token, reaction_type)
);

alter table public.article_reactions enable row level security;

drop policy if exists "Public can read article reactions" on public.article_reactions;
create policy "Public can read article reactions"
on public.article_reactions for select
using (true);

create or replace function public.record_article_view(target_article uuid)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare updated_count bigint;
begin
  update public.articles
  set view_count = view_count + 1
  where id = target_article and published = true
  returning view_count into updated_count;
  return coalesce(updated_count, 0);
end;
$$;

create or replace function public.toggle_article_reaction(
  target_article uuid,
  target_token text,
  target_type text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare is_active boolean;
declare total bigint;
begin
  if char_length(target_token) < 16 or target_type not in ('like', 'favorite') then
    raise exception 'Invalid reaction';
  end if;

  if exists (
    select 1 from public.article_reactions
    where article_id = target_article
      and visitor_token = target_token
      and reaction_type = target_type
  ) then
    delete from public.article_reactions
    where article_id = target_article
      and visitor_token = target_token
      and reaction_type = target_type;
    is_active := false;
  else
    insert into public.article_reactions(article_id, visitor_token, reaction_type)
    values (target_article, target_token, target_type);
    is_active := true;
  end if;

  select count(*) into total
  from public.article_reactions
  where article_id = target_article and reaction_type = target_type;

  if target_type = 'like' then
    update public.articles set like_count = total where id = target_article;
  else
    update public.articles set favorite_count = total where id = target_article;
  end if;

  return jsonb_build_object('active', is_active, 'count', total);
end;
$$;

grant execute on function public.record_article_view(uuid) to anon, authenticated;
grant execute on function public.toggle_article_reaction(uuid, text, text) to anon, authenticated;

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
values ('comment-attachments', 'comment-attachments', true, 5242880)
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
with check (
  bucket_id = 'comment-attachments'
  and coalesce((metadata ->> 'mimetype'), '') in (
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'text/plain',
    'application/pdf'
  )
);

drop policy if exists "Owner can delete comment attachments" on storage.objects;
create policy "Owner can delete comment attachments"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'comment-attachments'
  and auth.uid() = '35bd70b7-54c4-4238-b583-e4fbcd2fea52'::uuid
);

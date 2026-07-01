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
alter table public.articles add column if not exists content_type text not null default 'article';
alter table public.articles add column if not exists video_url text;
alter table public.articles add column if not exists video_poster text;
alter table public.articles add column if not exists video_path text;
alter table public.articles add column if not exists video_name text;
alter table public.articles add column if not exists series_name text;
alter table public.articles add column if not exists episode_number integer;
alter table public.articles add column if not exists duration_seconds integer;
alter table public.articles add column if not exists deleted_at timestamptz;

alter table public.articles drop constraint if exists articles_content_type_check;
alter table public.articles
add constraint articles_content_type_check check (content_type in ('article', 'video'));

create table if not exists public.site_stats (
  id boolean primary key default true check (id),
  total_visits bigint not null default 0
);

insert into public.site_stats (id, total_visits)
values (true, 0)
on conflict (id) do nothing;

alter table public.site_stats enable row level security;

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
using (published = true and deleted_at is null);

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
alter table public.comments add column if not exists like_count bigint not null default 0;
alter table public.comments add column if not exists pinned boolean not null default false;
alter table public.comments add column if not exists is_owner boolean not null default false;

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
  and (
    is_owner = false
    or auth.uid() = '35bd70b7-54c4-4238-b583-e4fbcd2fea52'::uuid
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
    if not (
      new.is_owner = true
      and auth.uid() = '35bd70b7-54c4-4238-b583-e4fbcd2fea52'::uuid
    ) and (
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

create table if not exists public.comment_reactions (
  comment_id uuid not null references public.comments(id) on delete cascade,
  visitor_token text not null check (char_length(visitor_token) between 16 and 100),
  created_at timestamptz not null default now(),
  primary key (comment_id, visitor_token)
);

alter table public.comment_reactions enable row level security;

drop policy if exists "Public can read comment reactions" on public.comment_reactions;
drop policy if exists "Owner can read comment reactions" on public.comment_reactions;
create policy "Owner can read comment reactions"
on public.comment_reactions for select
to authenticated
using (auth.uid() = '35bd70b7-54c4-4238-b583-e4fbcd2fea52'::uuid);

create table if not exists public.content_events (
  id bigint generated always as identity primary key,
  article_id uuid references public.articles(id) on delete cascade,
  event_type text not null check (event_type in ('view', 'video_complete')),
  visitor_token text,
  created_at timestamptz not null default now()
);

create index if not exists content_events_created_idx on public.content_events(created_at);
create index if not exists content_events_article_idx on public.content_events(article_id);
alter table public.content_events enable row level security;

drop policy if exists "Owner can read content events" on public.content_events;
create policy "Owner can read content events"
on public.content_events for select
to authenticated
using (auth.uid() = '35bd70b7-54c4-4238-b583-e4fbcd2fea52'::uuid);

create table if not exists public.visitor_checkins (
  visitor_token text not null check (char_length(visitor_token) between 16 and 100),
  checkin_date date not null default current_date,
  created_at timestamptz not null default now(),
  primary key (visitor_token, checkin_date)
);

alter table public.visitor_checkins enable row level security;

alter table public.article_reactions enable row level security;

drop policy if exists "Public can read article reactions" on public.article_reactions;
drop policy if exists "Owner can read article reactions" on public.article_reactions;
create policy "Owner can read article reactions"
on public.article_reactions for select
to authenticated
using (auth.uid() = '35bd70b7-54c4-4238-b583-e4fbcd2fea52'::uuid);

drop function if exists public.record_article_view(uuid);

create or replace function public.record_article_view(
  target_article uuid,
  target_token text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare updated_count bigint;
begin
  update public.articles
  set view_count = view_count + 1
  where id = target_article and published = true and deleted_at is null
  returning view_count into updated_count;
  if updated_count is not null then
    insert into public.content_events(article_id, event_type, visitor_token)
    values (target_article, 'view', target_token);
  end if;
  return coalesce(updated_count, 0);
end;
$$;

create or replace function public.record_video_complete(
  target_article uuid,
  target_token text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if char_length(target_token) < 16 then
    raise exception 'Invalid visitor token';
  end if;
  if exists (
    select 1 from public.articles
    where id = target_article and published = true and deleted_at is null and content_type = 'video'
  ) then
    insert into public.content_events(article_id, event_type, visitor_token)
    values (target_article, 'video_complete', target_token);
  end if;
end;
$$;

create or replace function public.toggle_comment_reaction(
  target_comment uuid,
  target_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare is_active boolean;
declare total bigint;
begin
  if char_length(target_token) < 16 then raise exception 'Invalid visitor token'; end if;
  if exists (
    select 1 from public.comment_reactions
    where comment_id = target_comment and visitor_token = target_token
  ) then
    delete from public.comment_reactions
    where comment_id = target_comment and visitor_token = target_token;
    is_active := false;
  else
    insert into public.comment_reactions(comment_id, visitor_token)
    values (target_comment, target_token);
    is_active := true;
  end if;
  select count(*) into total from public.comment_reactions where comment_id = target_comment;
  update public.comments set like_count = total where id = target_comment;
  return jsonb_build_object('active', is_active, 'count', total);
end;
$$;

create or replace function public.visitor_check_in(target_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare total_days integer;
declare current_streak integer := 0;
declare cursor_date date := current_date;
begin
  if char_length(target_token) < 16 then raise exception 'Invalid visitor token'; end if;
  insert into public.visitor_checkins(visitor_token, checkin_date)
  values (target_token, current_date)
  on conflict do nothing;
  select count(*) into total_days from public.visitor_checkins where visitor_token = target_token;
  while exists (
    select 1 from public.visitor_checkins
    where visitor_token = target_token and checkin_date = cursor_date
  ) loop
    current_streak := current_streak + 1;
    cursor_date := cursor_date - 1;
  end loop;
  return jsonb_build_object('total_days', total_days, 'streak', current_streak);
end;
$$;

create or replace function public.get_owner_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() <> '35bd70b7-54c4-4238-b583-e4fbcd2fea52'::uuid then
    raise exception 'Not authorized';
  end if;
  return jsonb_build_object(
    'daily', (
      select coalesce(jsonb_agg(row_to_json(day_rows) order by day_rows.day), '[]'::jsonb)
      from (
        select date(created_at) as day, count(*) filter (where event_type = 'view') as views,
          count(*) filter (where event_type = 'video_complete') as completions
        from public.content_events
        where created_at >= current_date - interval '13 days'
        group by date(created_at)
      ) day_rows
    ),
    'top_works', (
      select coalesce(jsonb_agg(row_to_json(top_rows)), '[]'::jsonb)
      from (
        select title, content_type, view_count, like_count
        from public.articles
        where deleted_at is null
        order by view_count desc, like_count desc
        limit 5
      ) top_rows
    ),
    'comment_count', (select count(*) from public.comments),
    'checkin_count', (select count(*) from public.visitor_checkins)
  );
end;
$$;

create or replace function public.record_site_visit(should_increment boolean default true)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare updated_count bigint;
begin
  if should_increment then
    update public.site_stats
    set total_visits = total_visits + 1
    where id = true
    returning total_visits into updated_count;
  else
    select total_visits into updated_count
    from public.site_stats
    where id = true;
  end if;
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

grant execute on function public.record_article_view(uuid, text) to anon, authenticated;
grant execute on function public.record_video_complete(uuid, text) to anon, authenticated;
grant execute on function public.toggle_comment_reaction(uuid, text) to anon, authenticated;
grant execute on function public.visitor_check_in(text) to anon, authenticated;
grant execute on function public.get_owner_dashboard() to authenticated;
grant execute on function public.record_site_visit(boolean) to anon, authenticated;
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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'video-assets',
  'video-assets',
  true,
  52428800,
  array['video/mp4', 'video/webm', 'video/ogg']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read video assets" on storage.objects;
create policy "Public can read video assets"
on storage.objects for select
using (bucket_id = 'video-assets');

drop policy if exists "Owner can upload video assets" on storage.objects;
create policy "Owner can upload video assets"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'video-assets'
  and auth.uid() = '35bd70b7-54c4-4238-b583-e4fbcd2fea52'::uuid
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Owner can delete video assets" on storage.objects;
create policy "Owner can delete video assets"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'video-assets'
  and auth.uid() = '35bd70b7-54c4-4238-b583-e4fbcd2fea52'::uuid
);

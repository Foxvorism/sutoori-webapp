-- Run once with the Supabase SQL editor or `supabase db push`.
create table public.admin_members (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.admin_members enable row level security;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admin_members where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;
create policy "Members read own membership" on public.admin_members for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.admin_members from anon, authenticated;
grant select on public.admin_members to authenticated;
create table public.categories (
  id uuid primary key default gen_random_uuid(), name text not null check (length(name) between 1 and 160),
  slug text unique not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), sort_order integer not null default 0, active boolean not null default true
);
create table public.media_items (
  id uuid primary key default gen_random_uuid(), title text not null default '', caption text not null default '', alt_text text not null default '',
  category_id uuid references public.categories on delete set null, media_type text not null check (media_type in ('image','video')),
  public_path text, thumbnail_path text, width integer not null default 1, height integer not null default 1,
  focal_x real not null default 50 check (focal_x between 0 and 100), focal_y real not null default 50 check (focal_y between 0 and 100),
  featured boolean not null default false, sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft','published','deleting')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (status <> 'published' or (length(trim(title)) > 0 and category_id is not null and public_path is not null and thumbnail_path is not null and (media_type = 'video' or length(trim(alt_text)) > 0)))
);
-- Private object paths never live in a publicly readable row.
create table public.media_sources (
  media_id uuid primary key references public.media_items on delete cascade,
  original_path text not null, display_path text not null, thumbnail_path text not null, mime text not null,
  ready boolean not null default false, operation_id uuid, locked_at timestamptz
);
create table public.services (
  id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null, description text not null,
  cover_media_id uuid references public.media_items on delete set null, sort_order integer not null default 0, visible boolean not null default true
);
create table public.packages (
  id uuid primary key default gen_random_uuid(), service_id uuid references public.services on delete set null,
  title text not null, inclusions jsonb not null default '[]' check (jsonb_typeof(inclusions) = 'array'), amount numeric check (amount >= 0),
  currency text not null default 'IDR' check (currency in ('IDR','USD')), price_qualifier text not null default '', sort_order integer not null default 0, visible boolean not null default false
);
create table public.site_settings (
  id integer primary key default 1 check (id = 1), headline text not null, supporting_copy text not null, about text not null, process jsonb not null,
  whatsapp text not null default '', message_template text not null, email text not null default '', instagram text not null,
  contacts_verified boolean not null default false,
  hero_media_id uuid references public.media_items on delete set null, showreel_media_id uuid references public.media_items on delete set null
);
alter table public.categories enable row level security;
alter table public.media_items enable row level security;
alter table public.media_sources enable row level security;
alter table public.services enable row level security;
alter table public.packages enable row level security;
alter table public.site_settings enable row level security;
create policy "Read active categories" on public.categories for select to anon, authenticated using (active or public.is_admin());
create policy "Read published media" on public.media_items for select to anon, authenticated using (status = 'published' or public.is_admin());
create policy "Read private sources as admin" on public.media_sources for select to authenticated using (public.is_admin());
create policy "Read visible services" on public.services for select to anon, authenticated using (visible or public.is_admin());
create policy "Read visible packages" on public.packages for select to anon, authenticated using (visible or public.is_admin());
create policy "Read approved settings" on public.site_settings for select to anon, authenticated using (contacts_verified or public.is_admin());
-- Validated server endpoints perform all writes, including admin writes.
revoke all on public.categories, public.media_items, public.media_sources, public.services, public.packages, public.site_settings from anon, authenticated;
grant select on public.categories, public.media_items, public.services, public.packages, public.site_settings to anon, authenticated;
grant select on public.media_sources to authenticated;
grant all on public.admin_members, public.categories, public.media_items, public.media_sources, public.services, public.packages, public.site_settings to service_role;
create index media_public_order on public.media_items (status, sort_order, id);
create index media_category_order on public.media_items (category_id, status, sort_order, id);
create function public.touch_media() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end $$;
create trigger media_updated before update on public.media_items for each row execute function public.touch_media();
-- Cross-process lease prevents overlapping edits and publication operations.
create function public.lock_media(item_id uuid, operation uuid) returns boolean language plpgsql security definer set search_path = '' as $$
declare changed integer;
begin
  update public.media_sources set operation_id = operation, locked_at = now()
    where media_id = item_id and (operation_id is null or locked_at < now() - interval '10 minutes');
  get diagnostics changed = row_count;
  return changed = 1;
end $$;
revoke all on function public.lock_media(uuid, uuid) from public, anon, authenticated;
grant execute on function public.lock_media(uuid, uuid) to service_role;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values
 ('originals','originals',false,52428800,array['image/jpeg','image/png','image/webp','video/mp4','video/webm']),
 ('portfolio','portfolio',true,52428800,array['image/webp','video/mp4','video/webm'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
-- No client write policies: only the validated server pipeline writes these buckets.
create policy "Admins read originals" on storage.objects for select to authenticated using (bucket_id = 'originals' and public.is_admin());

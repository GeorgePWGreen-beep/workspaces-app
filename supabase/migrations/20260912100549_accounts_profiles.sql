begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- Dedicated, non-API schema for narrowly scoped privileged functions.
create schema hot_seats_private;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,20}$'),
  constraint profiles_display_name_length check (char_length(display_name) between 1 and 80),
  constraint profiles_avatar_url_format check (char_length(avatar_url) <= 2048 and avatar_url ~ '^https://[^[:space:]]+$')
);

comment on table public.profiles is 'Account profile. No email, auth metadata, or authorization roles. Full rows are owner-only; safe username lookup is separately projected.';

alter table public.profiles enable row level security;
create policy profiles_read_own on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Explicitly remove any platform default grants before granting the minimum.
revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant update (username, display_name, avatar_url) on public.profiles to authenticated;
grant select, insert, update, delete on public.profiles to service_role;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

-- SECURITY DEFINER is required to insert the profile during auth user creation,
-- before the new user has a session. Only these explicit presentation fields
-- are copied from editable metadata; metadata never supplies authorization.
create function hot_seats_private.create_user_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, username, display_name)
  values (new.id, lower(btrim(new.raw_user_meta_data ->> 'username')),
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''));
  return new;
end;
$$;
revoke all on function hot_seats_private.create_user_profile() from public, anon, authenticated, service_role;

create trigger hot_seats_auth_user_created after insert on auth.users
for each row execute function hot_seats_private.create_user_profile();

-- Existing accounts must have reviewed usernames too. Invalid/missing/duplicate
-- metadata aborts this whole migration for administrative review. Never derive
-- usernames from email or silently omit an existing account.
insert into public.profiles (id, username, display_name)
select id, lower(btrim(raw_user_meta_data ->> 'username')),
  nullif(btrim(raw_user_meta_data ->> 'display_name'), '')
from auth.users;

-- Availability exposes one boolean only, for helpful signup validation. The
-- unique constraint remains authoritative when signups race.
create function hot_seats_private.username_available(candidate text)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(lower(btrim(candidate)) ~ '^[a-z0-9_]{3,20}$', false)
    and not exists (select 1 from public.profiles where username = lower(btrim(candidate)));
$$;
revoke all on function hot_seats_private.username_available(text) from public, anon, authenticated;
grant usage on schema hot_seats_private to anon, authenticated;
grant execute on function hot_seats_private.username_available(text) to anon, authenticated;

create function public.is_username_available(candidate text)
returns boolean language sql stable security invoker set search_path = '' as $$
  select hot_seats_private.username_available(candidate);
$$;
revoke all on function public.is_username_available(text) from public, anon, authenticated;
grant execute on function public.is_username_available(text) to anon, authenticated;

-- Deliberate fixed projection across owner-only RLS. The privileged function
-- is not in an exposed schema, requires a signed-in identity, accepts only an
-- exact username and can return no timestamps, email or future private fields.
create function hot_seats_private.public_profile(requested_username text)
returns table (id uuid, username text, display_name text, avatar_url text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.username, p.display_name, p.avatar_url
  from public.profiles p
  where (select auth.uid()) is not null
    and p.username = lower(btrim(requested_username));
$$;
revoke all on function hot_seats_private.public_profile(text) from public, anon, authenticated;
grant execute on function hot_seats_private.public_profile(text) to authenticated;

create function public.get_public_profile(requested_username text)
returns table (id uuid, username text, display_name text, avatar_url text)
language sql stable security invoker set search_path = '' as $$
  select id, username, display_name, avatar_url
  from hot_seats_private.public_profile(requested_username);
$$;
revoke all on function public.get_public_profile(text) from public, anon, authenticated;
grant execute on function public.get_public_profile(text) to authenticated;

-- No cafe changes, auth settings changes, resets, seeds or authorization flags.
commit;

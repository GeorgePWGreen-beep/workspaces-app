begin;

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accepted_at timestamptz,
  constraint friendships_no_self check (requester_id <> addressee_id),
  constraint friendships_acceptance_time check (
    (status = 'pending' and accepted_at is null) or
    (status = 'accepted' and accepted_at is not null)
  )
);

-- The unordered pair is unique even for simultaneous, opposite-direction requests.
create unique index friendships_unique_pair on public.friendships
  (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index friendships_requester on public.friendships (requester_id);
create index friendships_addressee on public.friendships (addressee_id);

alter table public.friendships enable row level security;
create policy friendships_read_participant on public.friendships for select to authenticated
  using ((select auth.uid()) = requester_id or (select auth.uid()) = addressee_id);
create policy friendships_request_own on public.friendships for insert to authenticated
  with check ((select auth.uid()) = requester_id and status = 'pending' and accepted_at is null);
create policy friendships_accept_incoming on public.friendships for update to authenticated
  using ((select auth.uid()) = addressee_id and status = 'pending')
  with check ((select auth.uid()) = addressee_id and status = 'accepted');
-- A participant deleting pending means declining (recipient) or cancelling (sender).
-- Either participant can remove an accepted friendship.
create policy friendships_delete_participant on public.friendships for delete to authenticated
  using ((select auth.uid()) = requester_id or (select auth.uid()) = addressee_id);

revoke all on public.friendships from public, anon, authenticated;
grant select, delete on public.friendships to authenticated;
grant insert (requester_id, addressee_id) on public.friendships to authenticated;
grant update (status) on public.friendships to authenticated;
grant select, insert, update, delete on public.friendships to service_role;

create function hot_seats_private.accept_friendship()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if old.status <> 'pending' or new.status <> 'accepted' or
    new.id is distinct from old.id or
    new.requester_id is distinct from old.requester_id or
    new.addressee_id is distinct from old.addressee_id or
    new.created_at is distinct from old.created_at then
    raise exception 'Only pending friendships may be accepted' using errcode = '23514';
  end if;
  new.updated_at := now();
  new.accepted_at := now();
  return new;
end;
$$;
revoke all on function hot_seats_private.accept_friendship() from public, anon, authenticated;
create trigger friendships_accept before update on public.friendships
  for each row execute function hot_seats_private.accept_friendship();

-- Cross-profile access is narrowly projected here; owner-only profiles RLS stays intact.
-- No caller-supplied user ID, dynamic SQL, private fields or activity data.
create function hot_seats_private.friendships_for_user()
returns table (
  id uuid, requester_id uuid, addressee_id uuid, status text,
  created_at timestamptz, updated_at timestamptz, accepted_at timestamptz,
  profile_id uuid, username text, display_name text, avatar_url text
)
language sql stable security definer set search_path = '' as $$
  select f.id, f.requester_id, f.addressee_id, f.status,
    f.created_at, f.updated_at, f.accepted_at,
    p.id, p.username, p.display_name, p.avatar_url
  from public.friendships f
  join public.profiles p on p.id = case
    when f.requester_id = (select auth.uid()) then f.addressee_id else f.requester_id end
  where (select auth.uid()) is not null and
    (f.requester_id = (select auth.uid()) or f.addressee_id = (select auth.uid()));
$$;
revoke all on function hot_seats_private.friendships_for_user() from public, anon, authenticated;
grant execute on function hot_seats_private.friendships_for_user() to authenticated;

create function public.get_friendships()
returns table (
  id uuid, requester_id uuid, addressee_id uuid, status text,
  created_at timestamptz, updated_at timestamptz, accepted_at timestamptz,
  profile_id uuid, username text, display_name text, avatar_url text
)
language sql stable security invoker set search_path = '' as $$
  select id, requester_id, addressee_id, status, created_at, updated_at, accepted_at,
    profile_id, username, display_name, avatar_url
  from hot_seats_private.friendships_for_user();
$$;
revoke all on function public.get_friendships() from public, anon, authenticated;
grant execute on function public.get_friendships() to authenticated;

comment on table public.friendships is 'Private participant-only friend network. Activity, location, preferences and invitations are not stored here.';
commit;

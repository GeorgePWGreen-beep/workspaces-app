-- Saved cafes only reference existing accounts and cafe records.
create table public.saved_cafes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cafe_id uuid not null references public.cafes(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint saved_cafes_user_cafe_unique unique (user_id, cafe_id)
);

-- The unique index covers owner lookups; this index supports cafe FK cascades.
create index saved_cafes_cafe_id_idx on public.saved_cafes(cafe_id);
alter table public.saved_cafes enable row level security;

revoke all on public.saved_cafes from public, anon, authenticated;
grant select, delete on public.saved_cafes to authenticated;
grant insert (user_id, cafe_id) on public.saved_cafes to authenticated;
grant all on public.saved_cafes to service_role;

create policy saved_cafes_select_own on public.saved_cafes
  for select to authenticated using (user_id = (select auth.uid()));
create policy saved_cafes_insert_own on public.saved_cafes
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy saved_cafes_delete_own on public.saved_cafes
  for delete to authenticated using (user_id = (select auth.uid()));

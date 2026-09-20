begin;
create table public.user_study_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  atmosphere_preference text not null check (atmosphere_preference in ('quiet', 'balanced', 'lively')),
  session_length text not null check (session_length in ('short', 'medium', 'long')),
  priorities text[] not null check (
    cardinality(priorities) <= 3
    and priorities <@ array['wifi','sockets','seating','coffee','space']::text[]
    and array_position(priorities, null) is null
    and cardinality(priorities) =
      (case when 'wifi' = any(priorities) then 1 else 0 end +
       case when 'sockets' = any(priorities) then 1 else 0 end +
       case when 'seating' = any(priorities) then 1 else 0 end +
       case when 'coffee' = any(priorities) then 1 else 0 end +
       case when 'space' = any(priorities) then 1 else 0 end)
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.user_study_preferences enable row level security;
revoke all on public.user_study_preferences from public, anon, authenticated;
grant select, delete on public.user_study_preferences to authenticated;
grant insert (user_id, atmosphere_preference, session_length, priorities) on public.user_study_preferences to authenticated;
grant update (atmosphere_preference, session_length, priorities) on public.user_study_preferences to authenticated;
create policy preferences_select_own on public.user_study_preferences for select to authenticated using ((select auth.uid()) = user_id);
create policy preferences_insert_own on public.user_study_preferences for insert to authenticated with check ((select auth.uid()) = user_id);
create policy preferences_update_own on public.user_study_preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy preferences_delete_own on public.user_study_preferences for delete to authenticated using ((select auth.uid()) = user_id);
create trigger preferences_set_updated_at before update on public.user_study_preferences for each row execute function public.set_updated_at();
commit;

begin;

alter table public.cafes
  add column city text,
  add column seat_count integer,
  add column last_verified_at timestamptz,
  add column weekly_opening_hours jsonb;

-- Public records inspected on 2026-09-10. Use both verified slugs and
-- coordinates; never classify an unknown record as Cambridge by default.
update public.cafes set city = 'Cambridge'
where slug in ('aromi', 'bould-brothers-coffee', 'espresso-library',
               'fitzbillies', 'hot-numbers', 'urban-larder')
  and latitude between 52.18 and 52.24 and longitude between 0.08 and 0.17;

update public.cafes set city = 'Exeter'
where slug = 'arrietty'
  and latitude between 50.69 and 50.76 and longitude between -3.57 and -3.48;

do $$
declare unknown_slugs text;
begin
  select string_agg(slug, ', ' order by slug) into unknown_slugs
  from public.cafes where city is null;
  if unknown_slugs is not null then
    raise exception 'City review required for: %. Add verified assignments to this migration before retrying.', unknown_slugs;
  end if;
end;
$$;

alter table public.cafes
  alter column city set not null,
  add constraint cafes_city_values check (city in ('Cambridge', 'Exeter')),
  add constraint cafes_seat_count_non_negative check (seat_count >= 0),
  alter column walk_time drop not null,
  alter column opening_hours drop not null;

comment on column public.cafes.walk_time is
  'Deprecated: retained for compatibility only. UI calculates estimates from user location.';
comment on column public.cafes.seat_count is
  'Approximate customer seating capacity, not live occupancy.';
comment on column public.cafes.last_verified_at is
  'When cafe information was last checked online or in person; not an automatic update timestamp.';
comment on column public.cafes.opening_hours is
  'Legacy text retained without changes. Do not infer a weekly schedule from an undated time range.';
comment on column public.cafes.weekly_opening_hours is
  'Seven lowercase weekday keys; null day = closed. Local HH:MM open/close; close may be 24:00. Earlier close = next day. SQL NULL = unknown schedule.';

-- Null weekly schedules remain unknown; legacy ranges have no weekday
-- information and cannot safely be copied to all seven days.
create function public.valid_weekly_opening_hours(value jsonb)
returns boolean
language plpgsql immutable security invoker
set search_path = ''
as $$
declare
  day_name text;
  hours jsonb;
begin
  if value is null then return true; end if;
  if jsonb_typeof(value) <> 'object' then return false; end if;
  if (select count(*) from jsonb_object_keys(value)) <> 7 then return false; end if;
  foreach day_name in array array['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] loop
    if not (value ? day_name) then return false; end if;
    hours := value -> day_name;
    if hours = 'null'::jsonb then continue; end if;
    if jsonb_typeof(hours) <> 'object' then return false; end if;
    if (select count(*) from jsonb_object_keys(hours)) <> 2 then return false; end if;
    if not (hours ? 'open' and hours ? 'close') then return false; end if;
    if jsonb_typeof(hours -> 'open') <> 'string' or jsonb_typeof(hours -> 'close') <> 'string' then return false; end if;
    if (hours ->> 'open') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
       or (hours ->> 'close') !~ '^(([01][0-9]|2[0-3]):[0-5][0-9]|24:00)$'
       or hours ->> 'open' = hours ->> 'close' then return false; end if;
  end loop;
  return true;
end;
$$;

alter table public.cafes add constraint cafes_weekly_opening_hours_valid
  check (public.valid_weekly_opening_hours(weekly_opening_hours));

create index cafes_active_city_study_score_idx
  on public.cafes (city, study_score desc, name) where is_active = true;

-- No changes to grants, RLS, IDs, slugs, or existing opening_hours values.
commit;

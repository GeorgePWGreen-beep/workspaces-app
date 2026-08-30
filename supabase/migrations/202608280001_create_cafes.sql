create extension if not exists pgcrypto;

create table public.cafes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  latitude double precision not null,
  longitude double precision not null,
  study_score integer not null,
  wifi text not null,
  noise text not null,
  sockets text not null,
  busyness text not null,
  rating numeric(2, 1) not null,
  price text not null,
  walk_time integer not null,
  image_url text not null,
  coffee text not null,
  seating text not null,
  opening_hours text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint cafes_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint cafes_latitude_range check (latitude between -90 and 90),
  constraint cafes_longitude_range check (longitude between -180 and 180),
  constraint cafes_study_score_range check (study_score between 0 and 100),
  constraint cafes_wifi_values check (wifi in ('Great WiFi', 'Good WiFi', 'Okay WiFi')),
  constraint cafes_noise_values check (noise in ('Quiet', 'Moderate', 'Loud')),
  constraint cafes_sockets_values check (sockets in ('Plenty', 'Some', 'Few')),
  constraint cafes_busyness_values check (busyness in ('Quiet', 'Moderate', 'Busy')),
  constraint cafes_rating_range check (rating between 0 and 5),
  constraint cafes_price_values check (price in ('£', '££', '£££')),
  constraint cafes_walk_time_non_negative check (walk_time >= 0),
  constraint cafes_coffee_values check (coffee in ('Excellent', 'Good', 'Basic')),
  constraint cafes_seating_values check (seating in ('Comfortable', 'Average', 'Basic'))
);

create index cafes_active_study_score_idx
  on public.cafes (study_score desc, name)
  where is_active = true;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger cafes_set_updated_at
before update on public.cafes
for each row
execute function public.set_updated_at();

alter table public.cafes enable row level security;

create policy "Public can read active cafes"
on public.cafes
for select
to anon, authenticated
using (is_active = true);

grant select on table public.cafes to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.cafes from anon, authenticated;

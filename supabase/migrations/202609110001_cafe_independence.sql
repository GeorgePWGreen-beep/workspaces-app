begin;

-- No default: unreviewed cafes must remain unknown, not silently become chains
-- or independents. Existing rows, policies, grants, and legacy columns remain.
alter table public.cafes add column is_independent boolean;

comment on column public.cafes.is_independent is
  'Reviewed cafe classification: true = independent, false = chain/non-independent, NULL = not yet verified. Never infer from the cafe name in the UI.';

-- Exact public records inspected 2026-09-11. Exeter classifications were
-- explicitly supplied by the project owner. Cambridge source notes and
-- unresolved records are recorded in docs/independent-classification.md.
update public.cafes
set is_independent = true
where is_independent is null
  and (
    (city = 'Exeter' and slug in (
      'arrietty',
      'the-sunset-society',
      'suki-cafe',
      'sundays',
      'boatyard-bakery',
      'the-ridge-coffee-shop',
      'between-bread',
      'the-common-beaver',
      '18g-coffee-roasters'
    ))
    or (city = 'Cambridge' and slug in (
      'aromi',
      'bould-brothers-coffee',
      'fitzbillies',
      'hot-numbers'
    ))
  );

update public.cafes
set is_independent = false
where is_independent is null
  and city = 'Exeter'
  and slug = 'knoops-exeter';

-- Espresso Library and Urban Larder await current ownership verification.
-- Any other record, including later additions, also keeps SQL NULL.
-- The existing updated_at trigger runs for the explicitly classified rows.
-- No insert/delete, reset, reseed, RLS, grant, ID, slug, or other content changes.
commit;

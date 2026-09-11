begin;

set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- Study Score v1 is an intrinsic, universal score. This function deliberately
-- accepts no availability, location, price, rating, independence or city input.
-- Numeric arithmetic preserves half points; round only the final sum.
create function public.calculate_study_score_v1(
  wifi text, noise text, seating text, sockets text,
  coffee text, busyness text, seat_count integer
)
returns integer
language sql immutable strict parallel safe security invoker
set search_path = ''
as $$
  select round(
    (case wifi when 'Great WiFi' then 18 when 'Good WiFi' then 13.5 when 'Okay WiFi' then 8 end)
    + (case noise when 'Quiet' then 15 when 'Moderate' then 10 when 'Loud' then 3 end)
    + (case seating when 'Comfortable' then 15 when 'Average' then 10 when 'Basic' then 4 end)
    + (case sockets when 'Plenty' then 15 when 'Some' then 10 when 'Few' then 4 end)
    + (case coffee when 'Excellent' then 13 when 'Good' then 9 when 'Basic' then 4 end)
    + (case busyness when 'Quiet' then 12 when 'Moderate' then 10 when 'Busy' then 5 end)
    + (case
        when seat_count >= 50 then 12
        when seat_count >= 35 then 10
        when seat_count >= 25 then 8
        when seat_count >= 15 then 6
        when seat_count >= 8 then 4
        when seat_count >= 0 then 2
       end)
  )::integer;
$$;

comment on function public.calculate_study_score_v1(text, text, text, text, text, text, integer) is
  'Hot Seats Study Score v1: Wi-Fi 18, noise 15, seating 15, sockets 15, coffee 13, busyness 12, capacity 12. Final sum rounded once. NULL for missing/invalid inputs. Mirrored and parity-tested in utils/studyScoreV1.ts.';

create function public.set_cafe_study_score_v1()
returns trigger
language plpgsql security invoker
set search_path = ''
as $$
declare
  calculated_score integer;
begin
  calculated_score := public.calculate_study_score_v1(
    new.wifi, new.noise, new.seating, new.sockets,
    new.coffee, new.busyness, new.seat_count
  );

  if calculated_score is not null then
    new.study_score := calculated_score;
  elsif tg_op = 'UPDATE' then
    -- Incomplete inputs (including a capacity changed back to NULL) retain the
    -- previous stored value, even if an update also supplied a manual score.
    new.study_score := old.study_score;
  end if;

  -- Incomplete INSERTs need an explicitly supplied legacy score. With neither
  -- complete inputs nor that value, the existing NOT NULL constraint rejects
  -- the insert. There is intentionally no invented default score or capacity.
  return new;
end;
$$;

create trigger cafes_calculate_study_score_v1
before insert or update of wifi, noise, seating, sockets, coffee, busyness, seat_count, study_score
on public.cafes
for each row execute function public.set_cafe_study_score_v1();

-- Including study_score prevents a direct manual override of a complete score.
-- Updates of unrelated columns do not fire this trigger. Existing timestamp
-- behavior, indexes, table constraints, grants, and RLS remain unchanged.
revoke all on function public.calculate_study_score_v1(text, text, text, text, text, text, integer)
  from public, anon, authenticated;
revoke all on function public.set_cafe_study_score_v1() from public, anon, authenticated;
grant execute on function public.calculate_study_score_v1(text, text, text, text, text, text, integer)
  to service_role;
grant execute on function public.set_cafe_study_score_v1() to service_role;

-- Derive every backfill value from current inputs, including inactive records.
-- Skip incomplete rows and unchanged scores to avoid needless timestamp edits.
with calculated as (
  select id, public.calculate_study_score_v1(
    wifi, noise, seating, sockets, coffee, busyness, seat_count
  ) as score
  from public.cafes
)
update public.cafes as cafe
set study_score = calculated.score
from calculated
where cafe.id = calculated.id
  and calculated.score is not null
  and cafe.study_score is distinct from calculated.score;

comment on column public.cafes.study_score is
  'Universal Study Score v1, automatically derived from the seven quality inputs when complete. Incomplete legacy records retain their previous score pending verification; never treat missing capacity as zero.';

commit;

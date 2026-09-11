# Independent cafe classification

The filter reads `public.cafes.is_independent` (`boolean`, nullable, no default), mapped to `Cafe.isIndependent: boolean | null`. Only `true` matches Independent; only `false` matches Chain / non-independent. All includes unknown records. Frontend code does not classify cafes by their names.

## Live inspection and deployment

A read-only public API inspection on 2026-09-11 returned HTTP 200 and 16 active cafe records from Supabase project `npsnnumnlderkkywwehj` (`public.cafes`): 10 Exeter and 6 Cambridge. The response already contained `city`, `weekly_opening_hours`, `seat_count`, and `last_verified_at`, but **did not contain `is_independent`**. Nine Exeter cafes have structured schedules/seats/verification dates; Arrietty and the six Cambridge cafes retain unknown values for those fields. The previous task's report about an unapplied city migration is no longer a description of the current public schema.

Only public read access was available; hidden rows, SQL types/constraints, migration history, and live RLS configuration could not be inspected administratively. No production changes were made. The Supabase CLI was not installed/on PATH and this checkout has no linked-project configuration.

Apply **only** `supabase/migrations/202609110001_cafe_independence.sql` to this project's `public.cafes` after an administrator confirms the existing schema and migration history. It expects the `city` and `slug` columns and an absent `is_independent` column. Do not blindly run all pending migrations: the older city migration adds columns that already exist in the current live API and is not rerunnable. Reconcile any SQL-editor-applied migration history with the actual schema before using CLI deployment. No replacement of the existing city migration is needed for this filter work.

The new migration is transactional. It adds one nullable boolean and assigns only the reviewed city/slug pairs below. It preserves IDs, slugs, existing rows, opening hours, seat counts, verification dates, legacy columns, RLS, policies, and grants. The existing `updated_at` trigger will update timestamps on the 14 classified records. Unrecognised records remain null. After applying, verify row counts, the classification counts below, public SELECT access, and the app's active-cafe read.

Before deployment the repository continues to load cafes with `select('*')`; a missing field maps to null. Therefore enabling Independent against the unmigrated live database correctly yields no confirmed independents until the migration is applied.

## Exact existing records and prepared classifications

These are **prepared values**, not values written to production in this task.

| City | Exact slug | Prepared value | Basis |
| --- | --- | --- | --- |
| Exeter | `arrietty` | `true` | Explicit classification supplied in this task |
| Exeter | `the-sunset-society` | `true` | Explicit classification supplied in this task |
| Exeter | `suki-cafe` | `true` | Explicit classification supplied in this task |
| Exeter | `sundays` | `true` | Explicit classification supplied in this task |
| Exeter | `boatyard-bakery` | `true` | Explicit classification supplied in this task |
| Exeter | `the-ridge-coffee-shop` | `true` | Explicit classification supplied in this task |
| Exeter | `between-bread` | `true` | Explicit classification supplied in this task |
| Exeter | `the-common-beaver` | `true` | Explicit classification supplied in this task |
| Exeter | `18g-coffee-roasters` | `true` | Explicit classification supplied in this task |
| Exeter | `knoops-exeter` | `false` | Knoops explicitly identified as a chain in this task; exact live slug verified |
| Cambridge | `aromi` | `true` | Official FAQ explicitly describes independent ownership |
| Cambridge | `bould-brothers-coffee` | `true` | Inference from the current official site describing the brothers' own business and distinguishing it from chains |
| Cambridge | `fitzbillies` | `true` | Inference from the current official story identifying Alison Wright and Tim Hayward as owners |
| Cambridge | `hot-numbers` | `true` | Inference from the current official founder's account of his locally run Cambridge business |
| Cambridge | `espresso-library` | `null` | Current ownership could not be confidently verified |
| Cambridge | `urban-larder` | `null` | Current ownership could not be confidently verified |

For the 16 public records inspected, the migration prepares **13 independent, 1 chain, and 2 unknown**. No Caffe Nero, Pret A Manger, or Boston Tea Party records appeared in the public response; guessed slugs for those brands are not included. Any hidden or subsequently added records require their own review.

## Sources reviewed on 2026-09-11

- [Aromi FAQ](https://www.aromi.co.uk/faqs): explicitly describes an independently owned family business rather than a national/international chain.
- [Bould Brothers official site](https://bouldbrotherscoffee.co.uk/): describes Max and Alex Bould's business and its Cambridge cafes.
- [Fitzbillies' story](https://www.fitzbillies.com/pages/our-story): identifies its current owners and local expansion.
- [Hot Numbers' story](https://hotnumberscoffee.co.uk/about-us-cafe): founder Simon describes his continuing involvement and local operations.
- [Urban Larder's official site](https://www.urbanlarder.coffee/): currently announces forthcoming changes without explaining ownership. Historic independent descriptions were insufficient to classify its current status confidently.
- [Espresso Library founder interview](https://acaia.co/blogs/news/customer-feature-espresso-library): primary interview evidence establishes historical ownership but is from 2015. Its former official site could not be read, so current ownership remains unverified.

The local development fixture and local seed use the same five confirmed independent and two unknown classifications for their seven existing cafes. The production dataset is not copied into or replaced by these fixtures. The seed file was updated for local compatibility only and was not executed against production.

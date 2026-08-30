# Supabase backend setup

Hot Seats loads active café records from Supabase on the server and passes mapped
`Cafe` domain objects to the existing interactive home client. Static data is a
development-only fallback when Supabase variables are absent; production never
silently falls back.

## Configure a project

1. Create a Supabase project.
2. In the project Connect dialog, copy the Project URL and Publishable key.
3. Copy `.env.example` to `.env.local` and set:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

   Do not use or expose a secret/service-role key for the application.

4. Link the repository with the Supabase CLI and apply the migration:

   ```powershell
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```

5. Seed the six existing Cambridge cafés. For a local Supabase stack,
   `npx supabase db reset` applies migrations and `supabase/seed.sql`. For a
   hosted project, run `supabase/seed.sql` once in the SQL editor.
6. Regenerate database types after schema changes:

   ```powershell
   npx supabase gen types typescript --project-id YOUR_PROJECT_REF --schema public | Set-Content -Encoding utf8 types/database.ts
   ```

   Review the generated `types/database.ts` before committing it.
7. Run `npm run dev` and verify that six active cafés load.

## Security model

Row Level Security is enabled on `public.cafes`. Anonymous and authenticated
clients can select active rows only. They receive no insert, update, delete,
truncate, reference, or trigger privileges. Normal application clients use only
the public project URL and publishable key.

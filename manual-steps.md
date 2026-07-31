# Manual Steps — Run Outside the Codebase

> These steps must be performed manually in external services (Supabase, etc.).
> They cannot be executed from the codebase. Refer back here when implementing.

| # | Step | Where | When | Status |
|---|------|-------|------|--------|
| 1 | Run `apps/api/migrations/2026-07-31-formats.sql` (create `formats` table + RLS policy) | Supabase SQL Editor | Before using formats feature | Pending |
| 2 | (Optional, for testing) Run `apps/api/migrations/2026-07-31-seed-users.sql` — creates test user `test@flashmail.ai` / `test123456` | Supabase SQL Editor | After step 1 | Pending |
| 3 | (Optional, for testing) Run `apps/api/migrations/2026-07-31-seed-formats.sql` — creates 5 dummy formats for the test user | Supabase SQL Editor | After step 2 | Pending |

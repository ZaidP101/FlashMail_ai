# FlashMail.ai — Agent Instructions

## Project Overview

FlashMail.ai is an AI-powered email reply assistant. It consists of:

- **`apps/api/`** — Express 5 backend (supersedes old Spring Boot `src/`)
- **`apps/admin/`** — Next.js admin frontend (supersedes old Vite `Client/`)
- **`apps/extension/`** — Chrome MV3 extension (moved from `Smart_Email_Assistant/`)

### Architecture

- **Monorepo**: Bun + Turborepo
- **Backend**: Express 5, Zod validation, Supabase Admin SDK
- **Frontend**: Next.js App Router, shadcn/ui, lucide-react, sonner
- **Auth/DB**: Supabase (PostgreSQL + Auth)
- **AI**: Hugging Face Inference API (`Qwen/Qwen3-0.6B`)

### Workspace Packages

| Package | Purpose |
|---------|---------|
| `@flashmail/configs` | Env loading, Supabase client factory |
| `@flashmail/schemas` | Zod schemas (shared frontend/backend) |
| `@flashmail/models` | Supabase DB query helpers |
| `@flashmail/utils` | Prompt templates, shared utilities |

### Migration Status

The project is being migrated from a flat structure (Spring Boot + Vite + Chrome extension) into this monorepo. Phases:

1. ✅ **Phase 1**: Monorepo foundation — packages + app scaffolds + agent configs
2. ⬜ **Phase 2**: Backend API — full Express 5 implementation
3. ⬜ **Phase 3**: Frontend — Next.js pages with auth + email generation
4. ⬜ **Phase 4**: Extension updates + cleanup of old files

### Coding Conventions

- **File naming**: kebab-case
- **Module system**: ESM (`"type": "module"`)
- **Validation**: Zod schemas in validators/
- **API design**: RESTful, Express routers
- **UI**: shadcn/ui primitives, lucide-react icons, sonner toasts
- **Auth**: Supabase Auth SDK (server: Admin client, browser: SSR client)

### Key Commands

```bash
bun install              # Install all workspace deps
turbo dev                # Run all apps in dev mode
turbo dev --filter=api   # Run only API
turbo dev --filter=admin # Run only admin app
```

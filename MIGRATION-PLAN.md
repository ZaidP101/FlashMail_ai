# FlashMail.ai — Full Migration Plan

## Goal

Migrate the **entire** FlashMail.ai project into a FLOBRIDGE-2.0-style monorepo with:

| Area | Current | Target |
|------|---------|--------|
| **Backend** | Java 17 / Spring Boot 3.5.6 / Maven | Express 5 + Bun (ESM) |
| **Frontend** | React 19 / Vite 7 / MUI 7 (`.jsx`) | Next.js App Router + shadcn/ui + TypeScript (`.tsx`) |
| **Extension** | Chrome MV3 (`Smart_Email_Assistant/`) | Chrome MV3 (`apps/extension/`) |
| **Database** | Supabase PostgreSQL (via JPA/Hibernate) | Supabase PostgreSQL (via Supabase SDK) |
| **Auth** | Supabase Auth REST API (server-only) | Supabase Auth SDK (client + server) |
| **Monorepo** | None — 3 independent directories | Bun + Turborepo, `apps/*` + `packages/*` |
| **Icons** | None | `lucide-react` |
| **Toasts** | None | `sonner` |
| **Components** | MUI 7 | shadcn/ui |

---

## 1. Current Project Inventory

```
FlashMail.ai/
├── .gitignore
├── .mvn/wrapper/maven-wrapper.properties
├── README.md
├── mvnw / mvnw.cmd
├── pom.xml                              # Spring Boot 3.5.6
├── todo.md                              # Phase 1/2 notes
│
├── src/                                 # Spring Boot backend
│   └── main/java/com/zaid/patel/AI_Email_Assistant/
│       ├── AiEmailAssistantApplication.java
│       ├── Config/AppConfig.java
│       ├── Controller/
│       │   ├── AuthController.java          # POST /api/auth/signup|login, GET /api/auth/profile
│       │   └── EmailGenController.java      # POST /api/email/generate
│       ├── DTo/
│       │   ├── AuthResponse.java
│       │   ├── EmailReqDto.java
│       │   ├── LoginRequest.java
│       │   └── SignUpRequest.java
│       ├── Entity/
│       │   ├── Formats.java                 # JPA → Supabase PostgreSQL
│       │   └── Users.java                   # JPA → Supabase PostgreSQL
│       ├── Repository/
│       │   ├── FormatsRepository.java
│       │   └── UsersRepository.java
│       └── Service/
│           ├── EmailService.java
│           ├── impl/EmailServiceImp.java     # WebClient → HF Inference API
│           └── SupabaseAuthService.java      # WebClient → Supabase Auth REST API
│
├── Client/                              # React frontend
│   ├── index.html
│   ├── package.json                     # React 19, MUI 7, Axios, Vite 7
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx                     # Dark MUI theme entry
│       └── App.jsx                      # Single page: email form + tone select + reply
│
└── Smart_Email_Assistant/               # Chrome Extension
    ├── manifest.json                    # MV3
    ├── content.js                       # Gmail compose injection
    └── content.css
```

---

## 2. Target Monorepo Structure

```
FlashMail.ai/
├── package.json                     # Root: Bun workspaces + Turborepo
├── turbo.json                       # Pipeline config
├── bun.lock
├── .env.example
├── .gitignore
├── README.md
├── MIGRATION-PLAN.md
├── AGENTS.md                        # Agent instructions for future work
│
├── .opencode/
│   └── agents/
│       ├── architect.md              # Architecture decisions agent
│       ├── sentinel.md               # Code review/quality agent
│       ├── frontier.md               # Implementation agent
│       └── warden.md                 # Planning agent
│
├── apps/
│   ├── admin/                        # Next.js frontend + API routes
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── login/page.tsx
│   │   │   │   │   └── signup/page.tsx
│   │   │   │   ├── (app)/
│   │   │   │   │   ├── generate/page.tsx
│   │   │   │   │   ├── profile/page.tsx
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── api/
│   │   │   │   │   ├── email/generate/route.ts
│   │   │   │   │   └── auth/[...supabase]/route.ts
│   │   │   │   ├── globals.css
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── components/
│   │   │   │   ├── ui/              # shadcn/ui primitives
│   │   │   │   │   ├── button.tsx
│   │   │   │   │   ├── card.tsx
│   │   │   │   │   ├── dialog.tsx
│   │   │   │   │   ├── input.tsx
│   │   │   │   │   ├── select.tsx
│   │   │   │   │   ├── textarea.tsx
│   │   │   │   │   ├── toast.tsx (sonner wrapper)
│   │   │   │   │   └── ...
│   │   │   │   ├── email-form.tsx
│   │   │   │   ├── tone-selector.tsx
│   │   │   │   ├── login-form.tsx
│   │   │   │   └── signup-form.tsx
│   │   │   ├── contexts/
│   │   │   │   └── auth-context.tsx
│   │   │   └── lib/
│   │   │       ├── supabase-client.ts
│   │   │       └── api.ts
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   ├── tsconfig.json
│   │   ├── tailwind.config.ts
│   │   ├── postcss.config.mjs
│   │   └── components.json          # shadcn/ui config
│   │
│   ├── api/                         # Express 5 backend
│   │   ├── src/
│   │   │   ├── server.js
│   │   │   ├── config/
│   │   │   │   └── env.js
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.js
│   │   │   │   ├── error.middleware.js
│   │   │   │   └── validation.middleware.js
│   │   │   ├── routes/
│   │   │   │   ├── email.routes.js
│   │   │   │   └── auth.routes.js
│   │   │   ├── controllers/
│   │   │   │   ├── email.controller.js
│   │   │   │   └── auth.controller.js
│   │   │   ├── services/
│   │   │   │   ├── huggingface.service.js
│   │   │   │   └── supabase-auth.service.js
│   │   │   └── validators/
│   │   │       ├── email.validators.js
│   │   │       └── auth.validators.js
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   └── extension/                   # Chrome Extension
│       ├── manifest.json
│       ├── content.js
│       └── content.css
│
└── packages/
    ├── configs/                     # Shared configuration
    │   ├── src/
    │   │   ├── env.js
    │   │   ├── supabase.js          # Supabase client factory
    │   │   └── index.js
    │   └── package.json
    │
    ├── schemas/                     # Zod schemas + TS types
    │   ├── src/
    │   │   ├── index.ts
    │   │   ├── email.ts             # EmailReq, EmailRes
    │   │   ├── auth.ts              # LoginReq, SignUpReq, AuthRes
    │   │   └── user.ts              # User, Profile
    │   ├── package.json
    │   └── tsconfig.json
    │
    ├── models/                      # Supabase DB interaction
    │   ├── src/
    │   │   ├── index.js
    │   │   ├── users.js
    │   │   └── formats.js
    │   └── package.json
    │
    └── utils/                       # Shared utilities
        ├── src/
        │   ├── index.js
        │   └── prompts.js           # HF prompt template builder
        └── package.json
```

---

## 3. Key Architecture Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| **Monorepo** | Bun + Turborepo | Same as FLOBRIDGE; fast, built-in TS |
| **Backend** | Express 5 (ESM) | Follows `apps/crm` pattern; decoupled from frontend |
| **Frontend** | Next.js App Router + TypeScript | Follows `apps/admin`; .tsx/.ts required |
| **UI library** | shadcn/ui (not MUI) | Lightweight, customizable, composable |
| **Icons** | lucide-react | Industry standard, tree-shakeable |
| **Toasts** | sonner | Lightweight, React-first toast library |
| **Validation** | Zod 4 | Shared via `packages/schemas` (frontend + backend) |
| **DB access** | Supabase JS SDK (server-side) | Replaces JPA/Hibernate |
| **Auth** | Supabase Auth SDK | Handles sessions, refresh, OAuth; replaces custom JWT |
| **File naming** | kebab-case | FLOBRIDGE convention |
| **Workspace refs** | `@flashmail/*` | Follows `@flobridge/*` pattern |

---

## 4. Supabase Integration Details

### Current (Java/JPA)
| Java File | Purpose |
|-----------|---------|
| `Users.java` | JPA entity → `users` table |
| `Formats.java` | JPA entity → `formats` table (JSONB tone presets) |
| `UsersRepository.java` | Spring Data JPA queries |
| `FormatsRepository.java` | Spring Data JPA queries |
| `SupabaseAuthService.java` | REST calls to Supabase Auth API |

### Target (Express + Next.js)
| File | Purpose |
|------|---------|
| `packages/configs/src/supabase.js` | Creates Supabase client (anon + service role) |
| `packages/models/src/users.js` | User queries via Supabase SDK |
| `packages/models/src/formats.js` | Format queries via Supabase SDK |
| `apps/api/src/services/supabase-auth.service.js` | Server-side auth logic using service role |
| `apps/admin/src/lib/supabase-client.ts` | Client-side Supabase instance (anon key) |
| `apps/admin/src/contexts/auth-context.tsx` | Session management, protected routes |

### Env Variables
```bash
# Hugging Face
HF_TOKEN=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
```

---

## 5. Frontend: .jsx → .tsx Migration

### Component Map
| Current (.jsx) | Target (.tsx) | Status |
|----------------|---------------|--------|
| `main.jsx` (MUI theme) | `app/layout.tsx` (shadcn/ui + sonner) | New |
| `App.jsx` (email form) | `app/(app)/generate/page.tsx` | Migrate |
| — | `components/email-form.tsx` | Extract |
| — | `components/tone-selector.tsx` | Extract |
| — | `app/(auth)/login/page.tsx` | New |
| — | `app/(auth)/signup/page.tsx` | New |
| — | `app/(app)/profile/page.tsx` | New |
| — | `components/ui/*.tsx` (shadcn primitives) | Generate |
| — | `contexts/auth-context.tsx` | New |
| — | `lib/supabase-client.ts` | New |
| — | `lib/api.ts` | New |

### Icon Usage Pattern (lucide-react)
```tsx
import {
  CalendarCheck2,
  CalendarPlus2,
  Edit,
  Eye,
  FileText,
  Option,
  Tag,
  User,
  UserPlus,
} from 'lucide-react'
```

### Toast Pattern (sonner)
```tsx
import { toast } from 'sonner'
toast.success('Reply generated')
toast.error('Failed to generate reply')
```

---

## 6. API Endpoint Mapping

| Spring Boot | Express 5 | Request | Response |
|-------------|-----------|---------|----------|
| `POST /api/email/generate` | `POST /api/email/generate` | `{ emailContent, tone, rawReply }` | `{ reply: string }` |
| `POST /api/auth/signup` | `POST /api/auth/signup` | `{ email, password, name }` | `{ user, session }` |
| `POST /api/auth/login` | `POST /api/auth/login` | `{ email, password }` | `{ user, session }` |
| `GET /api/auth/profile` | `GET /api/auth/profile` | — (Bearer token) | `{ user }` |

---

## 7. Data Flow

```
── Auth Flow ──────────────────────────────────────
[Login Page] → supabase.auth.signInWithPassword()
  → Supabase Auth API → returns session
  → AuthContext stores session → protects routes

── Email Generation Flow ──────────────────────────
[Generate Page]
  → POST /api/email/generate + Bearer token
  → auth.middleware.js (verify via Supabase Admin SDK)
  → email.controller.js → huggingface.service.js → HF Inference API
  ← AI-generated reply text
  → toast.success() on success / toast.error() on failure

── Chrome Extension Flow ──────────────────────────
[Gmail Compose]
  → "AI-Reply" button → POST /api/email/generate + stored token
  → Same backend flow
  ← Reply inserted into compose box
```

---

## 8. Phase Plan

Each phase is self-contained and builds on the previous one. We implement sequentially.

---

### Phase 1 — Monorepo Foundation

**Goal**: Initialize Bun + Turborepo workspace with all empty apps and packages wired together.

**Files to create:**
- `package.json` — root workspace
- `turbo.json` — pipeline config
- `.gitignore` — updated for Bun/Turbo
- `.env.example` — all env vars
- `packages/configs/` — env + supabase factories
- `packages/schemas/` — Zod schemas (email, auth, user)
- `packages/models/` — Supabase DB helpers (users, formats)
- `packages/utils/` — prompt templates
- `apps/api/` — Express 5 scaffold (server.js, package.json)
- `apps/admin/` — Next.js scaffold (empty pages, shadcn init)
- `apps/extension/` — Chrome MV3 moved + reorganized
- `AGENTS.md` — agent instructions
- `.opencode/agents/*.md` — architect, sentinel, frontier, warden

**Verification:**
- `bun install` succeeds
- `turbo dev` starts all apps without errors
- Express server responds to health check
- Next.js dev server renders home page

---

### Phase 2 — Backend API (Express 5)

**Goal**: Fully working Express 5 backend with all 4 endpoints, matched to current Java behavior.

**Files to create/modify:**
- `apps/api/src/config/env.js` — env loading
- `apps/api/src/middleware/*` — auth, error, validation
- `apps/api/src/routes/*` — email, auth
- `apps/api/src/controllers/*` — email, auth
- `apps/api/src/services/*` — huggingface, supabase-auth
- `apps/api/src/validators/*` — email, auth (Zod)

**Key migrations:**
- `EmailServiceImp.java` → `huggingface.service.js` (WebClient → fetch)
- `SupabaseAuthService.java` → `supabase-auth.service.js` (REST → Supabase Admin SDK)
- `EmailReqDto.java` → Zod schema in validators
- `application.properties` → env.js

**Verification:**
- `POST /api/email/generate` returns same AI reply as Java
- `POST /api/auth/signup` creates user in Supabase
- `POST /api/auth/login` returns session
- `GET /api/auth/profile` returns user data

---

### Phase 3 — Frontend (Next.js + shadcn/ui)

**Goal**: Fully working Next.js admin with auth, email generation, tone selector.

**Files to create:**
- `apps/admin/src/app/layout.tsx` — root layout + providers
- `apps/admin/src/app/(auth)/login/page.tsx` — login form
- `apps/admin/src/app/(auth)/signup/page.tsx` — signup form
- `apps/admin/src/app/(app)/generate/page.tsx` — email generator (migrated from App.jsx)
- `apps/admin/src/app/(app)/profile/page.tsx` — user profile
- `apps/admin/src/components/ui/*.tsx` — shadcn primitives (button, card, input, select, textarea, etc.)
- `apps/admin/src/components/email-form.tsx` — extracted email form
- `apps/admin/src/components/tone-selector.tsx` — extracted tone dropdown
- `apps/admin/src/components/login-form.tsx` — login form component
- `apps/admin/src/components/signup-form.tsx` — signup form component
- `apps/admin/src/contexts/auth-context.tsx` — supabase auth session
- `apps/admin/src/lib/supabase-client.ts` — supabase browser client
- `apps/admin/src/lib/api.ts` — typed API helpers

**Verification:**
- Login/signup flow works end-to-end via Supabase Auth
- Email generation shows reply with toast
- Profile page shows user info
- Tone selector has all 14 tones
- Copy button works

---

### Phase 4 — Extension + Cleanup

**Goal**: Extension points to new backend. Old files removed.

**Files to create/modify:**
- `apps/extension/manifest.json` — update host_permissions to new API URL
- `apps/extension/content.js` — update API endpoint + add token handling

**Files to remove (after all phases verified):**
- `src/` — entire Spring Boot backend
- `Client/` — entire old React/Vite frontend
- `Smart_Email_Assistant/` — moved to apps/extension/
- `Hello-Extention/` — sandbox, not needed
- `pom.xml`, `mvnw`, `mvnw.cmd` — Maven artifacts
- `todo.md` — obsolete

**Verification:**
- Extension injects AI-Reply button in Gmail compose
- Extension calls Express backend and inserts reply
- Old Spring Boot can be safely deleted

---

## 9. Packages Dependency Graph

```
apps/admin (Next.js)
  ├── @flashmail/schemas
  ├── @flashmail/utils
  ├── next, react, react-dom
  ├── @supabase/supabase-js (browser)
  ├── lucide-react
  ├── sonner
  └── shadcn/ui primitives

apps/api (Express)
  ├── @flashmail/configs
  ├── @flashmail/schemas
  ├── @flashmail/models
  ├── @flashmail/utils
  ├── express, cors, helmet
  ├── zod
  └── @supabase/supabase-js (server)

apps/extension
  └── (vanilla JS, no deps)

packages/configs
  ├── zod
  └── @supabase/supabase-js

packages/schemas
  ├── zod
  └── typescript

packages/models
  ├── @flashmail/configs
  └── @supabase/supabase-js

packages/utils
  └── (zero deps)
```

---

## 10. .opencode/agents Setup

### agent: architect.md
Handles architecture decisions, design reviews, and structural planning.

### agent: sentinel.md
Code review, quality checks, linting, and type checking. Verifies implementation matches plan.

### agent: frontier.md
Primary implementation agent. Builds features, writes code, executes migration phases.

### agent: warden.md
Tracks phase progress, ensures sequential execution, prevents skipping steps.

---

## 11. Verification Checklist

- [ ] **Phase 1**: monorepo boots, all apps start, packages resolve
- [ ] **Phase 2**: all 4 API endpoints match Java behavior
- [ ] **Phase 3**: login → generate → profile flow works
- [ ] **Phase 3**: toast on success/error, lucide icons render
- [ ] **Phase 4**: extension injects + calls API successfully
- [ ] **Cleanup**: old Java/Vite code removed

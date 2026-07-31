# FlashMail.ai — Implementation Plan

## Format-Based Email Generation + Toolbar Popup

> Reference spec: [`feature.md`](./feature.md) · Tracked in [`todo.md`](./todo.md)
> Branch: `migrate` · Commits grouped per milestone.

---

## Milestones

| # | Milestone | Scope | Depends on |
|---|-----------|-------|-----------|
| M1 | Backend: formats API | Schema, model, validator, routes, service, email integration | — |
| M2 | Web dashboard: formats UI | List/create/edit/delete + bonus F8/F9/F10 | M1 |
| M3 | Web dashboard: generate with format | Format picker + custom inputs on `/generate` | M1 |
| M4 | Extension: auth + background worker | Token storage, refresh, API proxy, message routing | M1 |
| M5 | Extension: toolbar popup | popup.html/js/css, format list, compose flow, insert | M4 |
| M6 | Extension: reply mode + polish integration | get-email-content message, insert-reply, existing polish | M4, M5 |
| M7 | Verification + cleanup | Build, tests, manual flow check, docs | All |

Later (admin/user dashboard): F11 placeholders, F12 analytics — **separate plan**, not in this one.

---

## M1 — Backend: formats API (apps/api)

### M1.1 Database
- [ ] Add `formats` table SQL to a migration/seed file (`packages/models` or `apps/api` migrations dir)
- [ ] Table: `id, user_id, name, mode ('email'|'reply'), tone (default 'Formal'), content, created_at, updated_at`
- [ ] Index on `user_id`; RLS policy `auth.uid() = user_id`

### M1.2 Package: models
- [ ] `packages/models/src/formats.ts` — `listFormatsByUser(supabase, userId)`, `getFormat(id, userId)`, `createFormat(...)`, `updateFormat(...)`, `deleteFormat(id, userId)`

### M1.3 Validators (Zod)
- [ ] `apps/api/src/validators/format.validators.js` — `createFormatSchema`, `updateFormatSchema`
- [ ] Enforce: name required ≤120 chars; mode in ['email','reply']; tone string; **content ≤ 500 words** (custom `z` refinement)

### M1.4 Service
- [ ] `apps/api/src/services/format.service.js` — CRUD + ownership check (404 if not owner)

### M1.5 Controller + routes
- [ ] `apps/api/src/controllers/format.controller.js`
- [ ] `apps/api/src/routes/format.routes.js` — all wrapped with `requireAuth`
- [ ] Mount at `/api/formats` in `server.js`

### M1.6 Email integration
- [ ] Extend `generateEmailSchema` with optional `formatId`, `customInputs`
- [ ] Extend email service: if `formatId`, load format (ownership check), build prompt from static text + `format.content` + `customInputs` + tone + mode (+ `emailContent` for reply)
- [ ] Keep plain tone-based path backwards-compatible
- [ ] Extend `packages/utils/src/prompts.js` with the format-aware template

### M1.7 Schemas package
- [ ] `packages/schemas/src/format.ts` — `FormatSchema`, `CreateFormatSchema`, `UpdateFormatSchema`
- [ ] Export from `index.ts`

### M1.8 Tests / verification
- [ ] `bun run dev --filter=api` boots; curl CRUD against `/api/formats` with a token; `/api/email/generate` with and without `formatId`
- [ ] Commit: `feat(api): add formats CRUD and format-aware email generation`

---

## M2 — Web dashboard: formats UI (apps/admin)

### M2.1 API client
- [ ] `lib/api.ts` — add `getFormats`, `createFormat`, `updateFormat`, `deleteFormat` (Bearer from session)

### M2.2 Components
- [ ] `components/word-counter.tsx` — live counter, blocks >500 words
- [ ] `components/custom-inputs.tsx` — textarea + counter
- [ ] `components/format-picker.tsx` — select from user formats
- [ ] `components/format-form.tsx` — shared create/edit form (name, mode toggle, tone dropdown, content + counter)
- [ ] `components/format-list.tsx` — list w/ mode badge, row actions

### M2.3 Pages
- [ ] `app/(app)/formats/page.tsx` — list + search box + mode filter chips + import/export JSON buttons (F10)
- [ ] `app/(app)/formats/new/page.tsx` — create form
- [ ] `app/(app)/formats/[id]/page.tsx` — edit form + delete + duplicate (F8)
- [ ] Add "Formats" link to `navbar.tsx`

### M2.4 Verification
- [ ] `next build` passes; manual CRUD + clone + search/filter + import/export
- [ ] Commit: `feat(admin): add formats dashboard with CRUD, clone, search, import/export`

---

## M3 — Web dashboard: generate with format (apps/admin)

- [ ] `/generate`: add "Use a saved format" picker + custom inputs textarea
- [ ] Pre-fill tone from selected format; allow override
- [ ] Submit `formatId` variant to API; render reply as before
- [ ] `next build`; manual flow (Flow A)
- [ ] Commit: `feat(admin): use saved formats in email generator`

---

## M4 — Extension: auth + background worker (apps/extension)

### M4.1 Manifest
- [ ] Add `"background": { "service_worker": "background.js" }`
- [ ] Add `"default_popup": "popup.html"` to `action`

### M4.2 background.js (MV3 service worker)
- [ ] Auth token storage in `chrome.storage.local` (`access_token`, `refresh_token`, `expires_at`)
- [ ] `refreshAccessToken()` — POST `/auth/v1/token?grant_type=refresh_token` (or via API `/api/auth` path)
- [ ] API proxy helper with Bearer injection + auto-refresh on 401
- [ ] Message router: handle `get-formats`, `generate`, `login`, `logout`
- [ ] Login message: POST `/api/auth/login`, persist tokens

### M4.3 Verification
- [ ] Load unpacked; login → tokens persist across popup close; expired token triggers refresh
- [ ] Commit: `feat(extension): add background service worker with token auth`

---

## M5 — Extension: toolbar popup (apps/extension)

### M5.1 popup.html / popup.css
- [x] Views: login, format list, compose (custom inputs), loading/error states
- [x] Style consistent with Gmail toolbar look (match existing `.T-I` button styles)

### M5.2 popup.js
- [x] On open: check/refresh token → login view or format list
- [x] `GET /api/formats` via background → render list (mode badge + tone dropdown default from format.tone)
- [x] Select format → custom inputs textarea (500-word counter)
- [x] Compose button → `generate` message → on reply, `insert-reply` to content script
- [x] Login form in popup → `login` message
- [x] Sign out button

### M5.3 Content script
- [x] Add `chrome.runtime.onMessage` handler for `insert-reply` (reuse existing insertText logic)
- [x] Add `get-email-content` responder (extract via existing selectors)

### M5.4 Verification
- [ ] Popup opens on any tab; full Flow B works; reply auto-inserts into Gmail compose
- [ ] Commit: `feat(extension): add toolbar popup with format selection and compose`

---

## M6 — Extension: reply mode + polish integration

- [ ] For `mode: 'reply'`: popup requests `emailContent` from content script, includes in generate payload
- [ ] Polish flow (`polish-reply`) wired to run from popup (optional action) and still available on compose toolbar
- [ ] Manual test Flow C
- [ ] Commit: `feat(extension): support reply-mode formats and polish integration`

---

## M7 — Verification + cleanup

- [ ] Full `bun install` + `turbo build` green
- [ ] Manual end-to-end: web dashboard CRUD → generate with format → popup compose → Gmail insert
- [ ] Update `AGENTS.md` if project layout changed
- [ ] Final commit: `chore: phase complete`

---

## Out of scope (later stage — admin/user dashboard)

- **F11** variable placeholders + structured custom-input fields
- **F12** usage analytics + admin dashboard
- These get their own plan + spec when scoped.

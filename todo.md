# FlashMail.ai — Todo / Task Tracker

> Feature spec: [`feature.md`](./feature.md) · Plan: [`plan.md`](./plan.md)
> Current effort: **Format-Based Email Generation + Bitwarden-style Toolbar Popup**

---

## ✅ Completed (Migrated monorepo)

- [x] **Phase 1** — Monorepo foundation (Bun + Turborepo, packages, app scaffolds, agents)
- [x] **Phase 2** — Express 5 backend aligned with Java (auth, email generation, validators, prompts)
- [x] **Phase 3** — Next.js frontend (Supabase SSR auth, login/signup, profile, generate page, shadcn/ui)
- [x] **Phase 4** — Extension updates (options page, icons, configurable API) + removed all legacy Spring Boot/Vite code

## ✅ Existing features (working today)

- [x] AI email reply generation with tone selection (14 tones)
- [x] Raw reply polish (`rawReply` input)
- [x] Auth: signup / login / profile
- [x] Gmail compose injection (extension content script)

---

## 🚧 In progress — Formats + Toolbar Popup

### M1 — Backend: formats API (apps/api)
- [ ] Database: `formats` table (id, user_id, name, mode email|reply, tone default Formal, content, timestamps) + RLS
- [ ] `packages/models/src/formats.ts` — CRUD query helpers
- [ ] `apps/api/src/validators/format.validators.js` — Zod (500-word content cap)
- [ ] `apps/api/src/services/format.service.js` — CRUD + ownership checks
- [ ] `apps/api/src/controllers/format.controller.js`
- [ ] `apps/api/src/routes/format.routes.js` — mounted at `/api/formats` (requireAuth)
- [ ] Extend `POST /api/email/generate` with `formatId` + `customInputs`
- [ ] Extend `packages/utils/src/prompts.js` with format-aware template
- [ ] `packages/schemas/src/format.ts` + export

### M2 — Web dashboard: formats UI (apps/admin)
- [ ] API client: getFormats / createFormat / updateFormat / deleteFormat
- [ ] `word-counter.tsx`, `custom-inputs.tsx`, `format-picker.tsx`
- [ ] `format-form.tsx` (create/edit shared form)
- [ ] `format-list.tsx` + search box + mode filter
- [ ] `/formats` list page (+ import/export JSON — F10)
- [ ] `/formats/new` + `/formats/[id]` pages (+ duplicate — F8)
- [ ] Navbar "Formats" link

### M3 — Web dashboard: generate with format
- [ ] `/generate` — "Use a saved format" picker + custom inputs textarea
- [ ] Tone pre-fill from format; override allowed
- [ ] Submit `formatId` variant; render reply

### M4 — Extension: auth + background worker
- [ ] Manifest: `background.service_worker` + `action.default_popup`
- [ ] `background.js` — token storage (`chrome.storage.local`), silent refresh, API proxy, message router
- [ ] Login / logout messages

### M5 — Extension: toolbar popup
- [ ] `popup.html` / `popup.css` — login view, format list view, compose view
- [ ] `popup.js` — token check → format list → tone select → custom inputs → Compose
- [ ] Content script: `insert-reply` message handler
- [ ] Content script: `get-email-content` responder

### M6 — Extension: reply mode + polish integration
- [ ] Reply-mode formats fetch original email from Gmail
- [ ] Polish flow wired to popup action

### M7 — Verification
- [ ] `bun install` + `turbo build` green
- [ ] Manual E2E: dashboard CRUD → generate w/ format → popup compose → Gmail insert
- [ ] Update AGENTS.md if layout changed

---

## 🔜 Later stage — Admin + user dashboard (separate plan)

- [ ] **F11** Variable placeholders (`{company_name}`, `{amount}`, …) + structured custom-input fields
- [ ] **F12** Usage analytics per format + admin dashboard

---

## 💡 Backlog / Ideas

- Keyboard shortcut to open popup (`chrome.commands`)
- Save generated replies as drafts
- Format templates marketplace / sharing
- Dark/light theme toggle for popup

# FlashMail.ai — Feature Specification

## Format-Based Email Generation + Bitwarden-Style Toolbar Popup

> Status: **Planned** — design approved 2026-07-31. Not yet implemented.

---

## 1. Overview

FlashMail.ai moves beyond single-shot AI replies into **saved, reusable formats**. A
user creates a *format* (a named prompt/template with a mode and default tone), then
uses it either from the web dashboard or from a **Bitwarden-style toolbar popup** that
works on any tab. The popup lets the user pick a format, type custom inputs, hit
**Compose**, and the AI-generated email/reply is inserted directly into the Gmail
compose window they have open.

### Feature map

| # | Capability | Surface | Stage |
|---|-----------|---------|-------|
| F1 | Create / edit / delete formats | Web dashboard | Now |
| F2 | List / view formats | Web dashboard + popup | Now |
| F3 | Toolbar popup (any tab) | Extension | Now |
| F4 | Popup → auto-insert into Gmail compose | Extension | Now |
| F5 | Generate using a format + custom inputs + tone | API / web / popup | Now |
| F6 | Reply modes (`email` vs `reply` formats) | API / web / popup | Now |
| F7 | Polish reply (existing feature, kept) | Extension + web | Now |
| F8 | Format cloning (duplicate) | Web dashboard | Now |
| F9 | Format search / filter | Web dashboard | Now |
| F10 | Format import / export (JSON) | Web dashboard | Now |
| F11 | Variable placeholders (`{company_name}`) | Admin + user dashboard | Later |
| F12 | Usage analytics per format | Admin + user dashboard | Later |

---

## 2. Data Model — `formats` table (Supabase PostgreSQL)

```sql
create table public.formats (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  mode        text not null check (mode in ('email', 'reply')),
  tone        text not null default 'Formal',
  content     text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index formats_user_id_idx on public.formats (user_id);
alter table public.formats enable row level security;
```

**Constraints**
- `content` is capped at **500 words** (validated server-side via Zod + enforced in UI with a word counter).
- `name` is required, trimmed, max ~120 chars.
- `mode` — `'email'` (compose a fresh email) or `'reply'` (reply to an existing email; AI also receives the original email content from Gmail).
- `tone` defaults to `'Formal'` but can be overridden at generation time.

**Row Level Security**
- `policy "users can manage own formats" on formats for all using (auth.uid() = user_id)`

---

## 3. API — Express 5 (apps/api)

### New routes — `routes/format.routes.js` (all require auth)

| Method | Endpoint | Body / Params | Purpose |
|---|---|---|---|
| GET | `/api/formats` | — | List current user's formats |
| GET | `/api/formats/:id` | `:id` | Get one format |
| POST | `/api/formats` | `{ name, mode, tone, content }` | Create format |
| PUT | `/api/formats/:id` | `{ name?, mode?, tone?, content? }` | Update format |
| DELETE | `/api/formats/:id` | `:id` | Delete format |

### Modified route — `routes/email.routes.js`

`POST /api/email/generate` accepts a new variant:

```json
{
  "formatId": "uuid",          // optional — resolves format.content
  "customInputs": "...",        // free text ≤ 500 words (company, amount, dates, ...)
  "tone": "Formal",             // optional override
  "emailContent": "...",        // required for mode='reply'
  "rawReply": "..."             // optional existing draft
}
```

If `formatId` is omitted, behavior stays as today (plain tone-based generation).
If `formatId` is supplied, the service loads the format, verifies ownership, and builds
the prompt from: `static instruction text + format.content + customInputs + tone + mode
(+ emailContent for reply mode)`.

### Layering (FLOBRIDGE convention)
```
routes/format.routes.js → controllers/format.controller.js
                          → services/format.service.js
                          → models/format.model.js (Supabase queries)
                          → validators/format.validators.js (Zod, 500-word rule)
```
Email service is extended, not replaced.

### Auth
Reuses existing `requireAuth` middleware (Bearer token → Supabase user lookup).

---

## 4. Web Dashboard (apps/admin — Next.js)

### New pages
| Route | Purpose |
|---|---|
| `/formats` | List formats — cards/table with name, mode badge, tone, word count; search box + mode filter (F9); clone button (F8); import/export JSON (F10); edit + delete |
| `/formats/new` | Create — name, mode toggle (email/reply), tone dropdown (default Formal), content textarea with live 500-word counter |
| `/formats/:id` | Edit — same form, pre-filled; delete + duplicate actions |

### Modified page
| Route | Change |
|---|---|
| `/generate` | Optional "Use a saved format" selector + custom inputs textarea (500-word counter). Selecting a format pre-fills tone; the form posts the `formatId` variant to the API. |

### Components (reusable)
- `format-form.tsx` — shared create/edit form
- `format-list.tsx` — list + search/filter + row actions
- `custom-inputs.tsx` — 500-word textarea w/ counter
- `word-counter.tsx` — shared live counter
- `format-picker.tsx` — used by both `/generate` and the API client

### Data access
- `lib/api.ts` — add `getFormats / createFormat / updateFormat / deleteFormat`
- Auth: existing Supabase SSR session; format routes require login.

---

## 5. Extension — Bitwarden-Style Toolbar Popup (apps/extension)

### 5.1 Manifest changes (`manifest.json`)
```json
"action": {
  "default_title": "FlashMail.ai",
  "default_popup": "popup.html",
  "default_icon": "icons/icon.svg"
},
"background": { "service_worker": "background.js" }
```
Per the Bitwarden reference doc: the browser itself opens `popup.html` in a native
popup on toolbar click — **no icon-click JS needed**. Works on any tab/page.

### 5.2 New files
| File | Purpose |
|---|---|
| `background.js` | MV3 service worker — owns auth token storage, proxies API calls, routes messages between popup and content script |
| `popup.html` / `popup.css` | Popup UI shell (login view, format list view, compose view) |
| `popup.js` | Popup logic — auth check, format list, tone select, custom inputs, Compose action |

### 5.3 Popup flow
```
Toolbar click → browser opens popup.html
  1. background checks token in chrome.storage.local
     ├─ no token / expired & refresh failed  → login view (email + password → POST /api/auth/login)
     └─ valid / refreshed                    → proceed
  2. GET /api/formats → render format list (mode badge + per-format tone dropdown, default from format.tone)
  3. User selects a format → custom inputs textarea (500-word counter)
  4. User clicks Compose
     ├─ POST /api/email/generate { formatId, customInputs, tone, emailContent? }
     └─ on success → chrome.runtime.sendMessage({ type: 'insert-reply', reply })
        → content script injects into the active Gmail compose box
  5. User reviews & sends in Gmail
```

### 5.4 Auth (extension)
- `access_token` + `refresh_token` stored in `chrome.storage.local` (not sync).
- On popup open: if access token near expiry → **silently refresh** using
  `refresh_token`; only if refresh fails → show login view.
- Matches the requirement: login once, stay authenticated until token expires.

### 5.5 Content script changes (`content.js`)
- Add `chrome.runtime.onMessage` listener for:
  - `{ type: 'insert-reply', reply }` → insert into Gmail compose (existing insert logic).
  - `{ type: 'polish-reply' }` → existing read-email/read-reply/polish/insert flow.
- For `mode: 'reply'` generation: popup/background asks content script for the original
  email text (via message `get-email-content`) and sends it to the API.

### 5.6 Message contract (content script ⇄ background ⇄ popup)
| Message | Sender | Receiver | Payload |
|---|---|---|---|
| `get-email-content` | popup | content script | → `{ emailContent }` |
| `insert-reply` | background | content script | `{ reply }` |
| `get-formats` | popup | background→API | → `{ formats }` |
| `generate` | popup | background→API | `{ formatId, customInputs, tone }` → `{ reply }` |

---

## 6. AI Prompt Flow

The API builds the final prompt for the HF model (Qwen) in this order:

```
[static instruction]  — define what to do with format + custom inputs + tone
[format.content]      — the user's saved template/instructions
[customInputs]        — the user's free-text data (company, amount, dates, product…)
[mode context]        — 'email': write a new email
                       'reply': original email content + any rawReply draft
[tone]                — e.g. "Write in a Formal tone."
```

The existing `prompts.js` template is extended, keeping the current plain-tone path
backwards-compatible.

---

## 7. Bonus Features

### Now (F8, F9, F10)
- **F8 Format cloning** — duplicate button copies a format (new name suffix " (copy)"); keeps tone/content/mode; sets `user_id` to current user.
- **F9 Search / filter** — text search over name, mode filter chips (All / Email / Reply) on `/formats`.
- **F10 Import / export** — export selected/all formats as a JSON file; import validates against the format schema and creates copies.

### Later stage — admin dashboard + user dashboard (F11, F12)
- **F11 Variable placeholders** — formats can contain `{company_name}`, `{amount}`, etc. The custom-inputs UI becomes structured fields derived from the format's declared placeholders. (Requires a `placeholders` column / field schema on formats.)
- **F12 Usage analytics** — track generation events per format (count, last used, avg tone) surfaced on an admin dashboard and the user dashboard. (Requires a `usage` log table.)

---

## 8. User Flows

### Flow A — Compose with a format (web)
1. User opens `/generate`, clicks "Use a saved format", picks "Quotation".
2. Custom inputs textarea appears (500 words). Tone pre-fills `Formal` (editable).
3. User pastes: company name, product, amount, delivery date.
4. Clicks Generate → reply appears → copy / edit / regenerate.

### Flow B — Compose with a format (Gmail + popup)
1. User has Gmail open, clicks Compose (blank).
2. Clicks the FlashMail.ai toolbar icon → popup opens (any tab).
3. Logs in (first time) → sees format list.
4. Picks "Quotation" → tone dropdown (Formal) + custom inputs textarea.
5. Pastes details → clicks Compose.
6. Reply is inserted into the open Gmail compose box automatically.
7. Reviews and sends.

### Flow C — Reply with a format (Gmail + popup)
1. User is reading an email in Gmail, clicks Compose.
2. Opens popup, picks a `mode: 'reply'` format (e.g. "Formal Rejection").
3. Custom inputs textarea + tone. Clicks Compose.
4. Content script reads the original email text, background sends it with the
   generation request, reply is inserted into compose.

### Flow D — Manage formats (web)
1. `/formats` shows all formats (search + mode filter).
2. "Add format" → form → save.
3. Edit, delete, duplicate, import/export from row actions.

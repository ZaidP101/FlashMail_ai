# FlashMail.ai — Production Deployment Design

> **Target topology**
>
> | Piece | Host | URL |
> |---|---|---|
> | Admin dashboard (Next.js) | **Vercel** (free tier) | `https://zaidp101.tech` |
> | API (Express 5) | **Oracle Cloud free-tier VM** via **Coolify** | `https://api.zaidp101.tech` |
> | Firefox extension | AMO **unlisted signing**, `.xpi` hosted on existing Vercel portfolio | download link on your site |
>
> **Branch flow:** develop on `flash` → merge/push to `main` → CI/CD auto-deploys admin (Vercel native) + API (Coolify webhook via GitHub Actions). Extension zips are built as GitHub Release artifacts on version tags.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [DNS Setup](#2-dns-setup)
3. [Repo Changes](#3-repo-changes)
   - [Fix apps/api/Dockerfile](#31-fix-appsapidockerfile)
   - [Make CORS configurable](#32-make-cors-configurable)
   - [Extension production API URL](#33-extension-production-api-url)
4. [Supabase Console Config](#4-supabase-console-config)
5. [Vercel Setup (Admin)](#5-vercel-setup-admin)
6. [Coolify Setup (API) — Sources vs Resources](#6-coolify-setup-api--sources-vs-resources)
7. [GitHub Actions CI/CD](#7-github-actions-cicd)
8. [Merge Flow: flash → main](#8-merge-flow-flash--main)
9. [Firefox Add-on (Unlisted Signing)](#9-firefox-add-on-unlisted-signing)
10. [Secrets & Env Matrix](#10-secrets--env-matrix)
11. [Verification Checklist](#11-verification-checklist)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Prerequisites

| Thing | Status needed |
|---|---|
| Oracle free-tier VM (Ampere A1 / E2.1.micro), Ubuntu 22.04+ | ✅ running |
| Coolify installed on VM with HTTPS proxy working | ✅ confirmed |
| Coolify reachable at its own domain (e.g. `coolify.zaidp101.tech`) | ✅ confirmed |
| Domain `zaidp101.tech` with DNS access (A/CNAME records) | ✅ owned |
| GitHub repo `ZaidP101/FlashMail.ai`, branches `flash` + `main` | ✅ exists |
| Supabase project | ✅ exists |
| Mozilla account for [Add-on Developer Hub](https://addons.mozilla.org/developers/) | sign up once, free |
| Vercel account connected to GitHub | sign up, free |

---

## 2. DNS Setup (Cloudflare)

DNS lives in **Cloudflare**, and your existing records are already the right shape:

| Type | Name | Content | Proxy status | Purpose |
|---|---|---|---|---|
| `CNAME` | `zaidp101.tech` (`@`) | Vercel target (e.g. `cname.vercel-dns.com`) | **DNS only** (grey cloud) | Admin → Vercel |
| `A` | `*.zaidp101.tech` (wildcard) | `<ORACLE_VM_PUBLIC_IP>` | **DNS only** (grey cloud) | All subdomains → Coolify VM |

What this means:

- **No separate `api` record needed** — the wildcard already resolves `api.zaidp101.tech` (and `coolify.zaidp101.tech`, plus any future subdomain) straight to the Oracle VM.
- **Apex goes to Vercel** via the CNAME (Cloudflare flattens apex CNAMEs automatically). Add `zaidp101.tech` in Vercel → Project → Settings → Domains. Want `www` too? Add one more record: `CNAME www → cname.vercel-dns.com`, or just redirect `www` → apex in Vercel.
- **Keep both records "DNS only" (grey cloud)** — do NOT enable the orange-cloud proxy:
  - Vercel verifies domains and serves its own edge certs; a proxied apex breaks that handshake.
  - Coolify's Traefik/Caddy requests its Let's Encrypt certificate for `api.zaidp101.tech` via HTTP-01 challenge on port 80 — that only works when traffic reaches the VM directly, not through Cloudflare's proxy.
  - Avoids double-proxy latency and WebSocket/streaming quirks.
- **Wildcard side-effect:** every subdomain you haven't configured also lands on the VM's reverse proxy. Unrecognized hosts get Traefik/Caddy's default 404 response — harmless, just expected behavior.
- **Oracle Cloud firewall:** besides Coolify's own settings, open ports in *two* places:
  1. OCI Console → Networking → Virtual Cloud Network → Security List → add Ingress Rule: source `0.0.0.0/0`, TCP ports `80`, `443`.
  2. On the VM itself: `sudo ufw allow 80/tcp && sudo ufw allow 443/tcp` (or iptables equivalent).

Once DNS has propagated and the API resource from [§6](#6-coolify-setup-api--sources-vs-resources) is deployed, `https://api.zaidp101.tech/api/health` should answer.

---

## 3. Repo Changes

All changes are made on `flash`, then merged to `main`.

### 3.1 Fix `apps/api/Dockerfile`

Current file is broken for the monorepo (wrong CMD path, no workspace resolution):

```dockerfile
FROM oven/bun:1.4 AS base
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
EXPOSE 8081
CMD ["bun", "src/server.js"]   # ❌ src/server.js doesn't exist at /app root
```

Replace with:

```dockerfile
FROM oven/bun:1.4 AS base
WORKDIR /app

# Install workspace deps from the lockfile first (better layer caching)
COPY package.json bun.lock ./
COPY packages/configs/package.json packages/configs/
COPY packages/models/package.json packages/models/
COPY packages/schemas/package.json packages/schemas/
COPY packages/utils/package.json packages/utils/
RUN bun install --frozen-lockfile

# Copy the rest of the workspace sources
COPY turbo.json ./
COPY packages ./packages
COPY apps/api ./apps/api

WORKDIR /app/apps/api
EXPOSE 8081
CMD ["bun", "src/server.js"]
```

**Why this shape:** the API imports workspace packages (`@flashmail/configs`, etc.), so `bun install` must run at the monorepo root where `workspaces` is defined. Build context in Coolify = **repository root** (set in step 6).

### 3.2 Make CORS configurable

`apps/api/src/server.js` currently hardcodes:

```js
app.use(cors({ origin: '*' }))
```

Change to:

```js
const corsOrigin = process.env.CORS_ORIGIN
app.use(
  cors({
    origin: corsOrigin ? corsOrigin.split(',').map((o) => o.trim()) : '*',
  }),
)
```

Then set `CORS_ORIGIN=https://zaidp101.tech` in Coolify. The admin never needs CORS anyway (Next.js rewrites proxy `/api/*` server-side), this is belt-and-suspenders for direct calls.

### 3.3 Extension production API URL

Two small edits so store builds talk to prod out of the box:

- `apps/extension/background.js` line 1:
  ```js
  const DEFAULT_API_URL = 'https://api.zaidp101.tech'  // was http://localhost:8081
  ```
- `apps/extension/options.js`: change the save fallback `'http://localhost:8081'` → `'https://api.zaidp101.tech'`, and update the placeholder text in `options.html`.

Users can still override per-install via the options page (stored in `chrome.storage.sync`).

Also confirm Firefox host permissions cover prod (already do): `manifests/manifest.firefox.json` has `"https://*/*"` in `host_permissions`.

---

## 4. Supabase Console Config

Dashboard → **Authentication → URL Configuration**:

| Setting | Value |
|---|---|
| Site URL | `https://zaidp101.tech` |
| Additional Redirect URLs | `https://zaidp101.tech/**`<br>`http://localhost:3000/**` (keep for dev)<br>`https://*.vercel.app/**` (preview deploys, optional) |

Without this, signup confirmation emails and password reset links point at the wrong origin and the admin auth flow breaks in production.

No DB changes needed — migrations were already applied to Supabase directly.

---

## 5. Vercel Setup (Admin)

1. Vercel Dashboard → **Add New… → Project** → import `ZaidP101/FlashMail.ai`.
2. Configure build:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `apps/admin`
   - **Build Command / Install Command:** leave defaults (Vercel detects Bun workspaces; if it complains, set Install = `bun install`)
3. Environment Variables (Production + Preview):

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key |
   | `API_URL` | `https://api.zaidp101.tech` |

   > `next.config.ts` already rewrites `/api/:path*` → `${API_URL}/api/:path*`, so the browser only ever talks same-origin with zero CORS.
4. Deploy once from `main` to verify, then add domains: Project → Settings → Domains → `zaidp101.tech` + `www.zaidp101.tech`.

From now on every push to `main` auto-deploys the admin. Nothing else to wire.

---

## 6. Coolify Setup (API) — Sources vs Resources

You asked whether to go through "sources or resources / push repo". Both are involved, one time each:

**Sources = the connection. Resources = the app.**

### One-time: connect the Source
1. Coolify → **Sources** → **GitHub App** (recommended over deploy key: supports webhooks, works with private repos, easy reinstall).
2. Install the Coolify GitHub App on the `ZaidP101/FlashMail.ai` repository (all repos or selected).
3. Back in Coolify the source shows as *Connected*.

### Create the Resource (the actual API service)
1. **+ New Resource** → pick your GitHub source → select repo `ZaidP101/FlashMail.ai` → branch **`main`**.
2. Build pack: **Dockerfile**. Set:
   - **Dockerfile location:** `/apps/api/Dockerfile`
   - **Docker Context (build context):** `/` ← critical, the Dockerfile expects repo root
   - **Port:** `8081`
   - **Health check path:** `/api/health`
3. **Environment Variables** (paste as bulk import):

   ```
   GROQ_API_KEY=gsk_...
   AI_MODEL=llama-3.3-70b-versatile
   SUPABASE_URL=https://qlimwizrubfwtmwsovie.supabase.co
   SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_KEY=eyJ...
   CORS_ORIGIN=https://zaidp101.tech
   ```

4. **Domains:** add `https://api.zaidp101.tech` in the service's Domains field → Coolify's proxy issues a Let's Encrypt cert after DNS propagates.
5. Click **Deploy** once manually to verify the image builds and `/api/health` returns `{"status":"ok"}`.

### Wire the webhook (single deploy trigger)
1. Service → **View → Deploy Webhook URLs** → copy the **Deploy** hook URL.
2. Disable Coolify's automatic GitHub webhooks for this resource (Settings → turn off "webhook trigger"/auto-deploy) so **GitHub Actions remains the single deploy trigger** — matches the chosen CI/CD shape.

---

## 7. GitHub Actions CI/CD

Create two workflow files.

### `.github/workflows/ci.yml` — fast feedback on `flash`

```yaml
name: CI

on:
  push:
    branches: [flash]
  pull_request:
    branches: [main, flash]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install deps
        run: bun install --frozen-lockfile

      - name: Typecheck admin
        working-directory: apps/admin
        run: bunx tsc --noEmit

      - name: Syntax-check extension JS
        run: |
          node --check apps/extension/background.js
          node --check apps/extension/content.js
          node --check apps/extension/popup.js
          node --check apps/extension/options.js

      - name: Build everything
        run: bun run build
        env:
          GROQ_API_KEY: ${{ secrets.CI_GROQ_API_KEY }}   # not needed for build; placeholder-safe
          NEXT_PUBLIC_SUPABASE_URL: https://placeholder.supabase.co
          NEXT_PUBLIC_SUPABASE_ANON_KEY: placeholder-anon-key

      - name: Build extension dists
        run: bun run build:extension
```

### `.github/workflows/deploy.yml` — production on `main`

```yaml
name: Deploy

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  api:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Coolify deploy
        run: |
          curl -fsS -X POST "${{ secrets.COOLIFY_WEBHOOK }}" \
            -H "Authorization: Bearer ${{ secrets.COOLIFY_TOKEN }}" || \
          curl -fsS -X POST "${{ secrets.COOLIFY_WEBHOOK }}"

  release-extension:
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2

      - name: Build extension
        run: bun install --frozen-lockfile && bun run build:extension

      - name: Zip Chrome dist
        working-directory: apps/extension/dist/chrome
        run: zip -r ../../../flashmail-chrome-${{ github.ref_name }}.zip .

      - name: Release
        uses: softprops/action-gh-release@v2
        with:
          files: |
            flashmail-chrome-${{ github.ref_name }}.zip
            apps/extension/flashmail-firefox.zip
```

**Secrets to add** (repo Settings → Secrets and variables → Actions):

| Secret | Where to get it |
|---|---|
| `COOLIFY_WEBHOOK` | Coolify service → View → Deploy Webhook URLs → "Deploy" |
| `COOLIFY_TOKEN` | Coolify → Keys & Tokens → API token (only needed if your webhook requires auth; plain deploy hooks often don't) |

Vercel needs **no Actions wiring** — its native Git integration watches `main`.

---

## 8. Merge Flow: flash → main

Because `main` is a strict ancestor of `flash` (the whole monorepo history was built on top of it), merging is always a clean fast-forward:

```bash
git checkout main
git pull origin main
git merge flash            # fast-forward, no conflicts possible
git push origin main       # 🚀 triggers: Vercel (admin) + Actions→Coolify (API)
```

Optional safety net — protect `main` (GitHub repo → Settings → Branches):
- Require a pull request before merging (optional, solo-dev friendly to skip)
- Require status checks: `verify` from ci.yml

To ship a new extension version:

```bash
# bump version in apps/extension/manifests/*.json first ("version": "2.0" → "2.1")
git commit -am "chore(extension): bump version to 2.1"
git tag v2.1
git push origin flash main --tags   # tag push creates GitHub Release with both zips
```

---

## 9. Firefox Add-on (Unlisted Signing)

Your chosen flow — sign yourself, self-host, no public AMO listing.

### One-time
1. Get AMO API credentials: [addons.mozilla.org → Developer Hub → Manage API Keys](https://addons.mozilla.org/developers/addon/api/key/) → generate **JWT issuer + secret** (used for automated signing later, optional).

### Per release
1. Take `flashmail-firefox.zip` from the GitHub Release (CI artifact of the tag) — or build locally: `bun run build:extension`.
2. Go to [Developer Hub](https://addons.mozilla.org/developers/) → **Submit a New Version** → upload the zip.
3. Choose **"On your own — unlisted"** → Mozilla scans (~minutes) → download the **signed `.xpi`**.
4. Upload the signed `.xpi` to your portfolio host (your Vercel site), e.g. `https://zaidp101.dev/downloads/flashmail-2.1.xpi`.
5. Serve it with MIME type `application/x-xpinstall`:
   - If hosted under a Next.js route on Vercel, add to `next.config.ts`:
     ```ts
     async headers() {
       return [{ source: '/downloads/:file*', headers: [
         { key: 'Content-Type', value: 'application/x-xpinstall' },
       ]}]
     }
     ```
   - Or serve from a static host/CDN where you control headers.
6. Add an install link/button on your page pointing at the `.xpi` URL.

**Install UX reality check (Firefox ≥ 102):** `InstallTrigger`/`AddonManager.installAddonFromURL` are removed from web pages. What works today:
- Clicking a link to the `.xpi` downloads the file; users double-click it (or drag into `about:addons`) → Firefox offers to install.
- Keep instructions next to the button: *"Download, then open with Firefox."*

**Update integrity:** keep the `gecko.id` stable (`zpatel044@gmail.com` baked in at build). Each submission must have an incremented `version` in the manifests or AMO rejects duplicates. For auto-updates you can later add an `update_url` update manifest hosted alongside the xpi — optional, not needed for v1.

---

## 10. Secrets & Env Matrix

| Variable | Vercel (admin) | Coolify (API) | GitHub Secrets |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | — | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | — | — |
| `API_URL` | ✅ `https://api.zaidp101.tech` | — | — |
| `GROQ_API_KEY` | — | ✅ | — |
| `AI_MODEL` | — | ✅ optional | — |
| `SUPABASE_URL` | — | ✅ | — |
| `SUPABASE_ANON_KEY` | — | ✅ | — |
| `SUPABASE_SERVICE_KEY` | — | ✅ | — |
| `CORS_ORIGIN` | — | ✅ `https://zaidp101.tech` | — |
| `COOLIFY_WEBHOOK` | — | — | ✅ |
| `COOLIFY_TOKEN` | — | — | ✅ (if required) |

Never commit real keys — `.env` stays local/gitignored.

---

## 11. Verification Checklist

Run through after first deploy:

- [ ] `curl https://api.zaidp101.tech/api/health` → `{"status":"ok"}`
- [ ] `https://zaidp101.tech` loads, login/signup works (email confirmation arrives with correct links)
- [ ] Admin Generate page returns a reply (proves Vercel rewrite → Coolify → Groq chain)
- [ ] Formats CRUD + export/import works against prod DB
- [ ] Fresh signup gets the 3 default formats (Supabase trigger fires)
- [ ] Push a trivial commit to `flash`, merge to `main` → both deployments update without manual steps
- [ ] Install signed `.xpi` in Firefox → options show prod API URL → popup login works → Gmail sparkle button generates + inserts
- [ ] Reply-mode insert keeps `Re:` subject untouched; compose-mode fills the subject box

---

## 12. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Coolify build fails at `bun install` | Docker Context not set to `/` — must be repo root, not `apps/api` |
| API container starts but 502 from proxy | Port mismatch — Coolify "Port exposes" must be `8081`; health check `/api/health` |
| `api.zaidp101.tech` cert pending | DNS not propagated yet, or OCI security list blocks 80 (Let's Encrypt HTTP-01 challenge) |
| Admin loads but API calls 404 | `API_URL` env missing/typo on Vercel (rewrites target it at build time → redeploy after changing) |
| Signup email goes to localhost | Supabase Site URL still localhost — fix URL Configuration |
| Extension popup says "Sign in failed" | Options page still points at `localhost:8081` — clear the override or reinstall fresh build |
| AMO signing rejected: "version already exists" | Bump `version` in both manifests before rebuilding the zip |
| Groq 401 from API | `GROQ_API_KEY` missing in Coolify env (server-side call happens there, not in the extension/admin) |

---

*End of deployment design.*

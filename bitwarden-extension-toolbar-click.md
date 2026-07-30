# How the Bitwarden Browser Extension Opens on a Toolbar Click

Repo: `bitwarden/clients` (monorepo) — relevant code lives under `apps/browser/`

This document explains, end to end, what actually happens the moment a user
clicks the Bitwarden icon in their browser's toolbar — on **any web page**,
in **any supported browser** (Chrome, Edge, Opera, Brave, Vivaldi, Firefox,
Safari).

---

## 1. The short answer

Clicking the toolbar icon does **not** run any Bitwarden JavaScript to "open
a dialog." It triggers a **native browser feature**: the extension declares
a popup HTML file in its manifest, and the browser itself opens that file in
a small floating window anchored under the icon. Bitwarden's code only takes
over *after* that window exists.

```
User clicks icon
      │
      ▼
Browser reads manifest.json → "default_popup": "popup/index.html"
      │
      ▼
Browser opens popup/index.html in a native popup window (OS/browser-owned)
      │
      ▼
popup/index.html loads Bitwarden's Angular app (popup bundle)
      │
      ▼
Angular app asks the background service worker for state
(locked/unlocked, current tab's URL, matching logins, etc.)
      │
      ▼
Popup renders vault UI for whatever page is currently active in that tab
```

The "any web page" part is handled by the background context, which always
knows the **active tab's URL** and hands matching results to the popup — the
popup itself never needs to inject anything into the page for this to work.

---

## 2. Where each piece lives in the repo

```
apps/browser/
├── src/
│   ├── manifest.json          # Manifest V2 definition (legacy / Firefox & Safari default)
│   ├── manifest.v3.json       # Manifest V3 definition (Chrome/Edge/Opera required)
│   ├── popup/                 # The UI you see in the toolbar popup (Angular app)
│   ├── background/            # Background service worker — business logic & state
│   ├── platform/
│   │   └── browser/
│   │       └── browser-api.ts # Cross-browser abstraction over chrome.* / browser.*
│   ├── autofill/               # Content scripts injected into web pages (separate flow)
│   └── vault/                  # Vault-related browser-specific glue code
├── package.json
└── webpack.config.js
```

| Concern | File / folder |
|---|---|
| Declares the toolbar icon + what opens on click | `apps/browser/src/manifest.json` (`browser_action`) and `manifest.v3.json` (`action`) |
| The popup's actual UI | `apps/browser/src/popup/` |
| Popup's Angular bootstrap entry point | `apps/browser/src/popup/main.ts` |
| Long-lived logic, state, message routing | `apps/browser/src/background/` (service worker file: `background.ts`) |
| Cross-browser API differences hidden here | `apps/browser/src/platform/browser/browser-api.ts` |

---

## 3. Step 1 — The manifest declares the popup

Manifest V2 (`apps/browser/src/manifest.json`), used by default in Firefox
and Safari:

```json
"browser_action": {
  "default_icon": {
    "19": "images/icon19.png",
    "38": "images/icon38.png"
  },
  "default_title": "Bitwarden",
  "default_popup": "popup/index.html"
}
```

Manifest V3, required by Chrome/Edge/Opera (and optional in Firefox 109+ and
Safari 15.4+):

```json
"action": {
  "default_icon": {
    "19": "images/icon19.png",
    "38": "images/icon38.png"
  },
  "default_title": "Bitwarden",
  "default_popup": "popup/index.html"
}
```

The **only functional difference** between the two is the JSON key
(`browser_action` vs `action`) and the corresponding runtime API
(`chrome.browserAction` vs `chrome.action`). Bitwarden never calls either API
directly — it goes through `BrowserApi.getBrowserAction()` in
`browser-api.ts`, which picks the right one based on which manifest version
is running.

Because `default_popup` is set, **the browser itself** — not Bitwarden's
code — is responsible for opening `popup/index.html` as a small chromeless
window the moment the icon is clicked. This is standard WebExtension
behavior and is identical in spirit across Chrome, Edge, Opera, Brave,
Vivaldi, Firefox, and Safari (Safari wraps it in a native Safari App
Extension, but the manifest contract is the same).

---

## 4. Step 2 — The popup boots as its own mini web app

`popup/index.html` loads a small Angular application whose entry point is:

```
apps/browser/src/popup/main.ts
```

This file bootstraps the Angular app the same way any Angular app boots in a
browser tab — the popup window is really just an isolated HTML page with its
own DOM, its own JS execution context, and (by default) no memory of
anything unless it asks for it.

The popup's layout is built from three shared shell components so it looks
and behaves the same whether it's a small dropdown or "popped out" into its
own resizable window:

- `PopupHeaderComponent`
- `PopupPageComponent`
- `PopupTabNavigationComponent`

("Popped out" refers to the user clicking "Pop out to a new window," which
re-opens the same `popup/index.html` inside a full browser window instead of
the small anchored dropdown — same code, different container.)

---

## 5. Step 3 — The popup asks the background for state

The popup process is short-lived: it's destroyed the instant the user clicks
elsewhere and the dropdown closes. So it can't hold state on its own — it
has to ask the **background context** for everything: is the vault
unlocked, what's the active tab's URL, which saved logins match this page,
etc.

```
apps/browser/src/background/     ← background service worker logic
```

Under Manifest V2 this was a persistent background page
(`"page": "background.html", "persistent": true"`) that stayed alive the
whole time the browser was open. Under Manifest V3 it's an
**event-driven service worker** that Chrome can terminate after ~30 seconds
of inactivity and restart on demand:

```json
// manifest.v3.json
"background": {
  "service_worker": "background.js"
}
```

Because of that, Bitwarden cannot rely on JavaScript globals staying alive
between popup opens. All communication between the popup and the background
goes through message passing rather than shared memory:

```typescript
// Popup asks background for data — works the same whether the
// service worker was already running or had to restart first
const ciphers = await BrowserApi.sendMessageWithResponse<Cipher[]>("getCiphers");
```

And any state the background needs to survive a restart is written to
`chrome.storage` (session or local) rather than kept in a plain variable.

---

## 6. How "any web page" is handled

The popup doesn't need to inject anything into the page you're looking at
just to open. The background context already tracks the **active tab**
(via `BrowserApi.tabsQuery({ active: true })` and related tab-change
listeners), so when the popup opens it simply asks the background "what tab
am I looking at, and what saved items match its URL?" The background
answers using its own tab-tracking state — no per-page setup is required
beforehand.

This is different from **autofill**, which *does* require code running
inside the page (a content script). That lives in a separate folder,
`apps/browser/src/autofill/`, and is a distinct mechanism from the toolbar
popup covered here — it's what draws the little Bitwarden icon/dropdown
directly inside a login field on the page itself, rather than the toolbar
popup.

---

## 7. Cross-browser differences worth knowing

| Browser | Manifest default | Notes |
|---|---|---|
| Chrome | V3 (required, 102+) | `chrome.action` |
| Edge | V3 (required) | Chromium-based, same as Chrome |
| Opera | V3 (required) | Chromium-based, same as Chrome |
| Brave / Vivaldi | V3 (Chrome Web Store build) | Chromium-based, same as Chrome |
| Firefox | V2 by default, V3 optional (109+) | `browser.*` namespace; also supports a sidebar action variant |
| Safari | V2 by default, V3 optional (15.4+) | Wrapped as a native Safari App Extension; has extra quirks (see below) |

Safari-specific notes called out in the codebase:
- Tab-query APIs can behave inconsistently across multiple Safari windows.
- Manual event-listener cleanup is required to avoid memory leaks (Safari
  doesn't always garbage-collect extension listeners the way Chromium does).
- `BrowserApi.createWindow()` includes a documented "Safari height fix" so
  popped-out windows close correctly when a new window is spawned.
- Clipboard operations lean on native messaging rather than the same
  offscreen-document approach used on Chromium.

---

## 8. Quick mental model to remember

- **The click itself** → handled entirely by the browser, via
  `default_popup` in the manifest. Bitwarden writes no code for "detect
  icon click."
- **What opens** → `apps/browser/src/popup/` (an Angular app), bootstrapped
  from `popup/main.ts`.
- **What powers it** → `apps/browser/src/background/`, a service worker
  (MV3) or persistent page (MV2) that tracks tab/vault state and answers
  the popup's questions over message passing.
- **What hides the cross-browser mess** → `BrowserApi` in
  `apps/browser/src/platform/browser/browser-api.ts`.

---

## Sources

- `apps/browser/src/manifest.json` (bitwarden/clients, GitHub)
- Bitwarden Contributing Documentation — Browser section
  (contributing.bitwarden.com)
- Community-maintained architecture references for `bitwarden/clients`
  (DeepWiki, Mintlify-hosted docs, readmex) — used for supplementary
  detail on file locations (`popup/main.ts`, `background/`,
  `browser-api.ts`) since these aren't spelled out in the official
  contributing docs. Treat these as secondary sources; verify exact line
  numbers against the current `main` branch if you need them for actual
  development.

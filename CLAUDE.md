# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

The actual project lives in [aepc-command-center/](aepc-command-center/). The repo root is otherwise empty — `cd aepc-command-center` (or run scripts with that as CWD) before doing anything else.

## Commands

Run from `aepc-command-center/`:

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server on `http://localhost:5173` |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the built bundle locally |
| `npm run lint` | ESLint over `src/` — runs with `--max-warnings 0`, so any warning fails CI/lint |

There is no test suite.

The `/api/*` serverless functions only run under `vercel dev` or in deployed Vercel environments — `npm run dev` alone does not serve them. The frontend handles their absence gracefully (see Storage fallback below), so plain `npm run dev` is fine for UI work.

## Architecture

### Auth model
Shared-password gate, no per-user identity. Threat model assumes anyone with the password is a legitimate operator.

1. [src/components/PasswordGate.jsx](aepc-command-center/src/components/PasswordGate.jsx) POSTs to `/api/verify-password`, which compares against `SHARED_PASSWORD` env var.
2. On success, the plaintext password is stored in `sessionStorage` under key `aepc:password`.
3. Every subsequent `/api/data` call sends it back in the `X-AEPC-Pass` header. [api/data.js](aepc-command-center/api/data.js) re-validates it against `SHARED_PASSWORD` on every request — there are no sessions/tokens.
4. Closing the browser clears auth (`sessionStorage` scope). Rotating the password = update the Vercel env var and redeploy.

### Data layer
Vercel KV is the source of truth. All operators read and write the same KV instance, so the dashboard is shared, not per-user.

- [src/lib/storage.js](aepc-command-center/src/lib/storage.js) is the only data path. It exposes `storage.get(key)` and `storage.set(key, value)`.
- **localStorage fallback is silent**: any KV failure (no `/api/data`, network error, 401, 500) falls back to `localStorage` without surfacing the error. This makes local `npm run dev` work without `vercel dev`, but it also means a broken auth header in production silently makes the app per-browser. When debugging "data isn't shared," check Network for `/api/data` failures.
- [api/data.js](aepc-command-center/api/data.js) enforces an `ALLOWED_KEYS` allowlist: `aepc:prospects`, `aepc:activities`, `aepc:monthlyGoal`, `aepc:eiosConfig`. Adding a new persisted key requires updating that set or writes will 400.

### UI structure
[src/CommandCenter.jsx](aepc-command-center/src/CommandCenter.jsx) is one ~1,800-line file holding the top-level `CommandCenter` component plus every helper (views, modals, drawer, viz). Switched between seven views via a single `view` state var: Overview, Pipeline, Targets, Jessica's Social, Past Clients, Activity, Settings. All app state (prospects, activities, monthlyGoal, eiosConfig, toasts, confirm-dialog state, detail-drawer prospect id) lives in this component and is persisted by `useEffect` hooks that fire `storage.set` on every change. Seed data (`SEED_PROSPECTS`, `SEED_ACTIVITIES`) is used when KV/localStorage returns empty.

The domain enums — `OWNERS`, `STAGES`, `TYPES`, `TOUCH_TYPES`, `STAGE_COLORS`, `TYPE_COLORS` — are defined at the top of CommandCenter.jsx and referenced throughout. Changes to stage/type vocabulary need to be made there.

Helper components defined further down the same file:
- `PipelineBoard` + `PipelineCard` — drag-and-drop kanban; HTML5 native DnD calls `onAdvance(id, newStage)` which routes through `advanceStage` and fires the `prospect.updated` webhook.
- `ProspectDetail` — right-side drawer with full activity timeline, stage-advance row, and EiOS link.
- `Sparkline` + `PipelineFunnel` — inline SVG viz on Overview (no chart library).
- `StalenessDot` — last-touch age indicator (green <10d, amber 10–20d, red ≥21d, dim red if never), surfaced on cards and list rows.
- `ToastStack` + `ConfirmDialog` + `ModalShell` — replace native `alert()` / `confirm()`. `pushToast(message, kind)` and `setConfirmState({...})` are the entry points.

### Keyboard shortcuts
Wired in a single `useEffect` on `CommandCenter`: `Cmd/Ctrl+K` and `N` open the add-prospect form; `/` jumps to Targets and focuses search; `Esc` closes whichever modal/drawer/dialog is on top. Shortcuts skip when the event target is an input/textarea/select.

### EiOS webhook (optional integration)
When `eiosConfig.enabled` is true, mutating actions best-effort POST to `eiosConfig.webhookUrl` via `fireWebhook(event, payload)` with `mode: 'no-cors'`. Errors are swallowed; webhook failures never block the UI. This is the integration seam for the future EiOS/Dynamics native build referenced in the README.

### Styling
Tailwind with two custom colors (`arbor-green`, `arbor-green-dark` = `#7CC142` / `#6BA838`) and three font families (`display` Cormorant Garamond, `mono` JetBrains Mono, `sans` Inter) defined in [tailwind.config.js](aepc-command-center/tailwind.config.js). Match the existing Arbor visual language (dark stone palette, mono uppercase tracking labels, single accent green) when adding UI.

## Deployment

Vercel project, auto-deploys on push to `main`; other branches get preview URLs. `vercel.json` rewrites all non-`/api` paths to `index.html` (SPA routing). Required env vars in the Vercel project: `SHARED_PASSWORD` plus the `KV_*` set (auto-injected when the Vercel KV store is attached). The Vercel KV store is named `aepc-kv` and must be attached to the project for shared storage to work.

## Build spec

The README references a `BUILD_SPEC.docx` delivered separately — it is not in the repo. If a task references behavior not in the code, ask the user for the spec rather than guessing.

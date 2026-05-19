# AEPC Command Center

Internal operating dashboard for the **Arbor Executive Partner Channel**. This
is a private tool — not customer-facing — used by Ryan O'Kane (CEO), David
Walters, Taylor Bowen, and Jessica Wendt to manage the AEPC referral source
pipeline.

> **Read the full build spec before changing anything.** It lives at
> `BUILD_SPEC.docx` (delivered separately). This README covers setup and
> deployment only.

---

## Quickstart

You should be able to clone, install, and have this running locally in under
ten minutes.

```bash
# 1. Clone and install
git clone <repo-url>
cd aepc-command-center
npm install

# 2. Set your local environment
cp .env.example .env.local
# Then edit .env.local — set SHARED_PASSWORD to anything for local dev

# 3. Run the dev server
npm run dev
```

The app opens at `http://localhost:5173`. Enter whatever password you set in
`.env.local` to pass the gate.

> **Local dev without Vercel KV:** the storage layer falls back to
> `localStorage` automatically when the `/api/data` endpoint isn't available.
> Data is per-browser and not shared between users in this mode — that's fine
> for development.

---

## Tech stack

- **Vite + React 18** — single-page app
- **Tailwind CSS** — styling, with the AEPC color palette extended in `tailwind.config.js`
- **Vercel Serverless Functions** — `/api/verify-password` and `/api/data` endpoints in the `api/` folder
- **Vercel KV** — shared storage so all operators see the same data

No backend server to run. Everything is static or serverless.

---

## Project structure

```
aepc-command-center/
├── api/                          # Vercel serverless functions
│   ├── verify-password.js        # Password gate auth check
│   └── data.js                   # Read/write shared storage (Vercel KV)
├── public/                       # Static assets
├── src/
│   ├── App.jsx                   # Top-level — wraps CommandCenter in PasswordGate
│   ├── CommandCenter.jsx         # Main dashboard (all 7 views)
│   ├── components/
│   │   └── PasswordGate.jsx      # Password entry screen
│   ├── lib/
│   │   └── storage.js            # Storage helper that calls /api/data
│   ├── index.css                 # Tailwind directives + base styles
│   └── main.jsx                  # React entry point
├── index.html                    # Vite HTML entry
├── package.json
├── tailwind.config.js
├── vercel.json                   # Vercel rewrite rules + build config
├── vite.config.js
└── .env.example                  # Required env vars (copy to .env.local)
```

---

## Deploying to Vercel

> The deployment target is **the same Vercel account that hosts
> `aepc-gamma.vercel.app` and `the-code-platform.vercel.app`**. Use the same
> account.

### First-time setup

1. **Create the Vercel project**
   ```bash
   npm install -g vercel
   vercel login
   vercel link
   ```
   Choose: link to existing scope (the Arbor account), create new project,
   project name suggested: `aepc-command-center`.

2. **Connect a Vercel KV store** for shared persistent storage:
   - In the Vercel dashboard for this project, go to **Storage → Create
     Database → KV**.
   - Name it `aepc-kv`.
   - When prompted, attach it to this project. Vercel auto-injects
     `KV_REST_API_URL`, `KV_REST_API_TOKEN`, etc.

3. **Set the team password** as a Vercel environment variable:
   - Project **Settings → Environment Variables → Add**.
   - Key: `SHARED_PASSWORD`
   - Value: pick something the team will remember but not guessable. Suggest
     a 4-word passphrase. Add for **Production, Preview, Development**.

4. **Deploy**
   ```bash
   vercel --prod
   ```

The first prod deploy gives you a URL like
`aepc-command-center.vercel.app`. Optionally attach a custom domain (e.g.
`desk.arborfg.com`) via project Settings → Domains.

### Subsequent deploys

Pushes to `main` auto-deploy to production. Pushes to other branches deploy
preview environments at branch-specific URLs.

```bash
git add .
git commit -m "your message"
git push
```

---

## Resetting the team password

Update the `SHARED_PASSWORD` env var in Vercel's project settings and redeploy.
All active sessions remain valid until the user closes their browser
(`sessionStorage` is the auth scope).

---

## Scripts

| Command           | Purpose                              |
|-------------------|--------------------------------------|
| `npm run dev`     | Start the Vite dev server (port 5173) |
| `npm run build`   | Production build to `dist/`           |
| `npm run preview` | Preview the production build locally  |
| `npm run lint`    | Run ESLint on the source              |

---

## Maintenance owners

- **Sponsor / decisions:** Ryan O'Kane
- **Daily steward / data hygiene:** Taylor Bowen
- **Code maintenance:** the developer assigned to this project (see Build Spec)

When the EiOS/Dynamics native build ships, the data export tools in **Settings
→ Export Data** will be used to migrate the dataset. See the EiOS PRD
(separate document) for the migration plan.

---

© 2026 Arbor Financial Group · Internal use only.

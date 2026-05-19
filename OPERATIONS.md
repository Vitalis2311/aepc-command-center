# AEPC Command Center — Operations Manual

**Last updated:** 2026-05-06
**Live URL:** https://aepc-command-center.vercel.app
**Repo:** https://github.com/rokane01/aepc-command-center (private)
**Vercel project:** https://vercel.com/arborfg/aepc-command-center

---

## 1. Quick reference card

| What | Where |
|---|---|
| Dashboard URL | https://aepc-command-center.vercel.app |
| Operators (4) | Ryan, Dave, Taylor, Jessica |
| Auth | Single team password — same for everyone |
| Source of truth | EiOS (Dynamics). This dashboard is operational, EiOS is system of record |
| Hosted on | Vercel (`arborfg` team) |
| Storage | Vercel KV (shared — all operators see the same data) |
| Webhook target | Power Automate / Zapier flow that writes back to EiOS |

---

## 2. First-time setup (only run once, per environment)

The site is deployed but **two things still need to happen** before the team can use it.

### 2.1 Set the team password

Open PowerShell, run these three commands:

```powershell
cd "C:\Users\RyanO'Kane\OneDrive - Arbor Financial Group\Claude Ryan Projects\AEPC Dashboard\aepc-command-center"

vercel env add SHARED_PASSWORD production

vercel --prod --yes
```

The middle command prompts for the password value — type it and press Enter. The third command redeploys so the new password takes effect (~30 seconds).

**Verify it worked:** open https://aepc-command-center.vercel.app, try the password.

### 2.2 Connect the KV store (shared storage)

Until this is done, each operator's browser shows only their own data — there's a silent fallback to local browser storage when KV is unreachable.

1. Go to https://vercel.com/arborfg/aepc-command-center
2. Click **Storage** tab → **Create Database**
3. Choose **KV (Redis)** — Upstash provides this on the free tier
4. Name it `aepc-kv` and attach it to this project
5. Vercel auto-injects the `KV_REST_API_URL` and `KV_REST_API_TOKEN` env vars
6. Back in PowerShell:
   ```powershell
   vercel --prod --yes
   ```

**Verify:** open the dashboard in two different browsers (or one normal + one incognito), enter the password in both, log a touch in browser A — it should appear in browser B after a refresh.

---

## 3. Day-to-day operator usage

### Logging in
- Visit https://aepc-command-center.vercel.app
- Type the team password
- Stays logged in for the browser session (close browser → log in again)

### Adding a prospect
- Click **Add Prospect** (top-right of any view) — or press `Cmd+K` / `Ctrl+K`
- Required: Name. Everything else is optional.
- The **EiOS Contact ID** field links this prospect to the matching contact in Dynamics. Once linked, every touch logged here will route through the webhook to a Note on that EiOS contact.

### Logging a touch
- Click **Log Touch** on any prospect (pipeline card, table row, or detail drawer)
- Fill the outcome — what was said, what happened
- Set a Next Action to keep the relationship moving
- Logging a **Zoom** or **In-Person** touch automatically advances the prospect to "Meeting Booked" stage

### Moving prospects through stages
Three ways:
- **Drag** a card across columns on the **Pipeline** view (mouse-and-drop)
- Click a prospect → use the **Advance Stage** row in the detail drawer
- Edit the prospect form and change the Stage dropdown

### The North Star metric
Top of the **Overview** page: **face-to-face meetings booked this month**, against the team goal. Goal is editable inline. Sparkline shows the trend over the last six months.

### Keyboard shortcuts
| Key | Action |
|---|---|
| `Cmd+K` or `Ctrl+K` | Quick-add prospect |
| `N` | Same as above |
| `/` | Jump to Targets and focus the search box |
| `Esc` | Close any open modal/drawer/dialog |

---

## 4. Admin tasks

### Rotating the team password

Two options. Either:

**Via PowerShell (faster):**
```powershell
cd "C:\Users\RyanO'Kane\OneDrive - Arbor Financial Group\Claude Ryan Projects\AEPC Dashboard\aepc-command-center"

vercel env rm SHARED_PASSWORD production --yes
vercel env add SHARED_PASSWORD production
vercel --prod --yes
```

**Via Vercel dashboard:**
1. https://vercel.com/arborfg/aepc-command-center → **Settings** → **Environment Variables**
2. Edit `SHARED_PASSWORD`, save the new value
3. Click **Deployments** → **...** on the latest production deploy → **Redeploy**

Active sessions stay valid until users close their browsers. Tell the team to use the new password on next login.

### Deploying changes

The repo is at https://github.com/rokane01/aepc-command-center.

Two ways to deploy:

**Auto-deploy (recommended):** push to `main` and Vercel deploys automatically.
```powershell
cd "C:\Users\RyanO'Kane\OneDrive - Arbor Financial Group\Claude Ryan Projects\AEPC Dashboard"
git add .
git commit -m "describe what changed"
git push
```

**Manual deploy** (if you want to skip GitHub):
```powershell
cd "C:\Users\RyanO'Kane\OneDrive - Arbor Financial Group\Claude Ryan Projects\AEPC Dashboard\aepc-command-center"
vercel --prod --yes
```

### Inviting new operators (Vercel project access)

Only needed if the new operator is also going to deploy or change settings. To use the dashboard itself, they just need the team password.

1. https://vercel.com/teams/arborfg/settings/members
2. **Invite Member** → enter their email
3. Choose the right role (Member is fine for code/deploy access)

### Looking at logs

If something breaks (the password gate stops working, KV times out, webhooks fail):

1. https://vercel.com/arborfg/aepc-command-center
2. Click the latest production deployment
3. **Functions** tab — shows logs for `/api/verify-password` and `/api/data`
4. **Logs** tab on a function shows recent invocations and any errors

---

## 5. Exporting / backing up data

In the dashboard: **Settings → Export Data**.

- **Prospects (CSV)** — for opening in Excel, sending to Taylor for review, or bulk-importing into EiOS
- **All Data (JSON)** — the full dataset (prospects + activities) for backup

Recommend downloading both monthly until the EiOS native build replaces this.

---

## 6. The EiOS sync (webhook → Power Automate → Dynamics)

Configured under **Settings → EiOS Integration**.

The dashboard fires a webhook on three events:
- `prospect.created` — when a new prospect is added
- `prospect.updated` — when one is edited or moves stage
- `activity.logged` — when a touch is recorded

Each event POSTs JSON to whatever URL is set as the **Webhook URL**. The Power Automate flow (or Zapier) on the receiving end is responsible for finding the matching EiOS contact (via the `eiosId` field) and writing a Note or Activity record on it.

Full payload reference is shown in the **Settings** view under "Payload Reference."

To turn the sync on:
1. Build the Power Automate flow in https://make.powerautomate.com (or a Zap)
2. Get its webhook trigger URL
3. Paste it into Settings → EiOS Integration → Webhook URL
4. Tick **Enable webhook sync to EiOS**, click **Save Settings**
5. Click **Test Webhook** — Power Automate run history will show the test ping

---

## 7. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| "Server not configured" on the gate | `SHARED_PASSWORD` env var not set | Section 2.1 |
| "Connection error. Try again." on the gate | Network issue, or Vercel function down | Check https://vercel.com/arborfg/aepc-command-center → latest deploy → Functions logs |
| "Incorrect password." | Password is wrong, or was rotated | Confirm current value in Vercel env vars |
| Dashboard loads but data doesn't sync between browsers | KV not connected, or `KV_*` env vars missing | Section 2.2; redeploy after attaching |
| EiOS sync isn't writing back | Webhook URL wrong, flow disabled, or `eiosId` not set on prospect | Settings → Test Webhook; check Power Automate run history; ensure prospect has an EiOS Contact ID |
| Pipeline cards not draggable on tablet/phone | HTML5 drag-and-drop is desktop-only | Use the **Advance Stage** row in the detail drawer instead |

---

## 8. Who owns what

| Role | Person | Scope |
|---|---|---|
| Sponsor / final calls | Ryan O'Kane | Strategy, password rotation, who has access |
| Daily steward / data hygiene | Taylor Bowen | Pipeline accuracy, weekly reviews, Jessica's coordination |
| Code maintenance | Dev assigned to project | Bug fixes, feature requests, deploys |
| EiOS / Power Automate flow | TBD (whoever builds the flow) | Webhook receiver, Dynamics writes |

Contact for help: **ryan@arborfg.com**.

---

## 9. When EiOS native ships

This dashboard exists to bridge the gap until the native EiOS/Dynamics build is ready. When that ships:

1. Use **Settings → Export Data → All Data (JSON)** to snapshot the dataset
2. Hand the JSON to whoever's running the EiOS migration
3. Stop using this dashboard; archive but don't delete the Vercel project for ~3 months in case anyone needs historical reference

---

*This document lives at `OPERATIONS.md` in the repo root. Update it whenever the deploy process, env vars, or operator workflow changes.*

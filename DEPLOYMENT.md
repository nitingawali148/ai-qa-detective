# Deploying AI QA Detective

This app is deployed as **two separate services**, because they have different hosting needs:

| Service | Where | Why |
|---|---|---|
| **Frontend** (`client/`) — static React/Vite build | **Vercel** | Vercel is purpose-built for static sites/SPAs — fast global CDN, zero-config Vite detection, instant redeploys on push. |
| **Backend** (`server/`) — Express API | **Render** (free tier) | The app keeps its demo failure history, dashboard counts, and release risk in memory in a normal Node process (`server/src/store/historyStore.ts`). That needs a **long-running server**, not stateless serverless functions — on Vercel serverless, that in-memory state would reset unpredictably between requests as function instances cycle. Render runs it as a regular always-on Node process, so it behaves exactly like it does locally. |

Both are free-tier friendly and both auto-redeploy whenever you push to `main` on GitHub.

---

## Step 1 — Deploy the backend to Render

1. Go to **[render.com](https://render.com)** and sign in with GitHub.
2. Click **New +** → **Web Service**.
3. Connect and select the `nitingawali148/ai-qa-detective` repository.
4. Configure the service:
   | Field | Value |
   |---|---|
   | Name | `ai-qa-detective-api` (or anything you like) |
   | Root Directory | `server` |
   | Runtime | `Node` |
   | Build Command | `npm install && npm run build` |
   | Start Command | `npm run start` |
   | Instance Type | `Free` |
5. Under **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `AI_PROVIDER` | `mock` (works with zero API keys) — or `anthropic`/`openai` if you have a key |
   | `ANTHROPIC_API_KEY` | *(only if using `anthropic`)* |
   | `OPENAI_API_KEY` | *(only if using `openai`)* |

   Leave `PORT` unset — Render sets it automatically and the app already reads `process.env.PORT`.
6. Click **Create Web Service**. Wait for the build/deploy to finish (a few minutes on the free tier).
7. Copy the URL Render gives you, e.g. `https://ai-qa-detective-api.onrender.com`.
8. Verify it's live:
   ```bash
   curl https://ai-qa-detective-api.onrender.com/api/health
   # {"status":"ok","aiProvider":"mock","visionSupported":false}
   ```

> A `render.yaml` blueprint is included at the repo root if you'd rather use **New + → Blueprint** instead of the manual form above — Render will read the config automatically and just prompt you for the secret values.

**Free tier note:** Render's free web services spin down after ~15 minutes of inactivity and take ~30–50 seconds to wake up on the next request. Hit the `/api/health` URL a minute before a live demo to warm it up, or upgrade to a paid instance to avoid this entirely.

---

## Step 2 — Deploy the frontend to Vercel

1. Go to **[vercel.com](https://vercel.com)** and sign in with GitHub.
2. Click **Add New...** → **Project**, and import the `nitingawali148/ai-qa-detective` repository.
3. In the project configuration screen:
   | Field | Value |
   |---|---|
   | Root Directory | `client` (click **Edit** next to Root Directory and select it) |
   | Framework Preset | `Vite` (auto-detected once Root Directory is set) |
   | Build Command | *(leave default — `npm run build`)* |
   | Output Directory | *(leave default — `dist`)* |
4. Expand **Environment Variables** and add:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://ai-qa-detective-api.onrender.com/api` — your Render URL from Step 1, **with `/api` appended** |
5. Click **Deploy**. Vercel builds and deploys in about a minute.
6. Open the URL Vercel gives you (e.g. `https://ai-qa-detective.vercel.app`) and confirm the full demo flow works: Dashboard loads data, Analyze Failure → Load Demo Failure → Analyze with AI all round-trip to the Render backend successfully.

`client/vercel.json` is already included in the repo — it rewrites all routes to `index.html` so React Router's client-side routes (`/analyze`, `/history`, `/risk`, etc.) don't 404 on a direct visit or page refresh.

---

## Step 3 (optional) — Lock down CORS

By default the backend allows requests from any origin (`cors()` with no options), which is fine for getting a demo live quickly. To restrict it to just your Vercel domain once you have it:

1. In Render, add an environment variable `CORS_ORIGIN` set to your Vercel URL, e.g. `https://ai-qa-detective.vercel.app`. (Comma-separate multiple origins if needed.)
2. Redeploy the Render service (or it will pick it up automatically if auto-deploy is on).

---

## Keeping both in sync

Both Vercel and Render auto-deploy on every push to `main` by default. If you change:

- **Frontend code only** → Vercel redeploys; Render is untouched.
- **Backend code only** → Render redeploys; Vercel is untouched.
- **The API contract** (new routes, changed response shapes) → both may need a fresh deploy; pushing to `main` triggers both automatically.

If you ever rotate the backend's URL (e.g. renamed the Render service), update `VITE_API_URL` in Vercel's project settings and redeploy the frontend — Vite bakes that value in at **build time**, so changing it requires a rebuild, not just a backend restart.

---

## Everything-on-Vercel alternative

If you'd rather run both frontend and backend on Vercel alone (single platform, no Render account needed), it's possible by wrapping the Express app as a single Vercel serverless function (an `api/index.ts` at the repo root exporting `createApp()`, plus a root `vercel.json` rewriting `/api/(.*)` to it). The tradeoff: Vercel serverless functions are stateless and can cold-start on a fresh instance at any time, so the in-memory dashboard/history/release-risk data can reset unpredictably between requests — fine for demonstrating a single "analyze → results" round trip live, less reliable for a persistent-feeling Dashboard/History over a longer session. This isn't set up in the repo by default; ask if you want it added.

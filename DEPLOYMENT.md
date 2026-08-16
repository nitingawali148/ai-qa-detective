# Deploying AI QA Detective

## Everything on Vercel (single project) — recommended if you want one platform

The whole app — the React frontend **and** the Express backend — deploys as **one Vercel project**:

- The frontend builds to static files (`client/dist`) served by Vercel's CDN.
- The backend runs as **one Vercel serverless function** (`api/index.js`), which wraps the entire Express app (`server/src/app.ts` → compiled to `server/dist/app.js`). An Express app instance is itself a valid `(req, res)` handler, so it drops into Vercel's Node.js runtime directly — no rewrite of the Express code needed.
- `vercel.json` at the repo root rewrites every `/api/*` request to that one function (preserving the original path, so Express's own routing still works exactly like it does locally) and falls back to `index.html` for every other route so React Router's client-side pages don't 404 on refresh.
- Frontend and backend share the **same domain**, so there's no CORS to configure and no `VITE_API_URL` to set — the frontend's default `/api` base URL just works, identical to local dev.

**Important caveat:** Vercel serverless functions are stateless between cold starts. This app keeps its demo failure history, dashboard counts, and release risk score **in memory** (`server/src/store/historyStore.ts`). That state persists for the lifetime of a *warm* function instance (fine for a single demo session — analyze a failure, then check the Dashboard a minute later, and it'll still be there), but a cold start (after a period of no traffic) reloads the module fresh, reseeding the original 13 sample failures and dropping anything analyzed since. If you need that data to reliably persist indefinitely, see the "Split deployment" option below instead.

### Steps

1. If you already created **separate** Vercel projects for `client` and `server` (root directory set to those subfolders), stop here and either:
   - **Repurpose your existing frontend project**: Project → Settings → General → **Root Directory** → clear it back to blank (repository root) → Save → redeploy. Then delete the separate `server`-only project — it's no longer needed.
   - **Or start fresh**: delete both old projects and import the repo once, as below.

2. Go to **[vercel.com](https://vercel.com)** → **Add New...** → **Project** → import `nitingawali148/ai-qa-detective`.

3. Leave **Root Directory** as the repository root (don't set it to `client` or `server`). Vercel will read `vercel.json` at the root, which already defines the build/output/rewrites — you shouldn't need to override any of the framework settings.

4. Environment Variables (Project Settings → Environment Variables) — none are required to get the demo running:
   | Key | Value | Required? |
   |---|---|---|
   | `AI_PROVIDER` | `mock` (default if unset) — or `anthropic`/`openai` | No — defaults to `mock`, works with zero keys |
   | `ANTHROPIC_API_KEY` | your key | Only if `AI_PROVIDER=anthropic` |
   | `OPENAI_API_KEY` | your key | Only if `AI_PROVIDER=openai` |

5. Click **Deploy**. Vercel runs `npm install`, then `npm run build -w server && npm run build -w client` (from `vercel.json`), publishes `client/dist` as the static site, and packages `api/index.js` as a serverless function.

6. Once deployed, verify:
   ```bash
   curl https://<your-project>.vercel.app/api/health
   # {"status":"ok","aiProvider":"mock","visionSupported":false}
   ```
   Then open the site and run through the demo flow (Dashboard → Analyze Failure → Load Demo Failure → Analyze with AI → Generate Defect / Regression Tests → Release Risk).

Every push to `main` redeploys automatically.

---

## Split deployment (Vercel frontend + Render backend) — more robust state

If the in-memory-state caveat above matters for your use case (e.g. you want the Dashboard/History numbers to survive indefinitely without resetting on a cold start), deploy the backend as a normal always-on Node process on **[Render](https://render.com)** instead, and only the frontend on Vercel:

1. **Render** → New + → Web Service → select this repo.
   - Root Directory: `server`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   - Env var: `AI_PROVIDER=mock` (or `anthropic`/`openai` + key)
   - Copy the resulting URL, e.g. `https://ai-qa-detective-api.onrender.com`
2. **Vercel** → import the repo → set **Root Directory** to `client` → add environment variable `VITE_API_URL` = `https://ai-qa-detective-api.onrender.com/api` (your Render URL + `/api`) → Deploy.
3. Optionally set `CORS_ORIGIN` on the Render service to your Vercel domain to restrict cross-origin access (comma-separate multiple origins). Left unset, all origins are allowed.

Note Render's free tier sleeps after ~15 minutes idle and takes 30–50s to wake on the next request — hit `/api/health` a minute before a live demo to warm it up, or upgrade to a paid instance to avoid this.

With this split setup, you'll need a `client/vercel.json` with a SPA fallback rewrite (`{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}`) if you set Root Directory to `client`, since the root-level `vercel.json` won't be read from that subdirectory context — ask if you want this re-added.

# Master Prompt — AI QA Detective

> **What this file is:** a complete, standalone specification of the AI QA Detective project as it actually exists today — not the original aspirational brief, but the as-built system, corrected and filled in with every real decision made along the way. Hand this file to an AI coding agent (or a developer) with an empty repository and nothing else, and the result should be this project: same features, same architecture, same file layout, same behavior. If you're picking this project back up from scratch, start here.

---

## 1. Role & Objective

Build **AI QA Detective** — *"Your AI Senior QA Engineer for Failed Tests."*

A full-stack web app that takes test failure evidence (logs, stack trace, API response, console output, expected/actual result, optionally a screenshot) and produces a structured, evidence-backed root cause analysis: failure classification, severity/priority, a confidence score with honest rationale, a Jira-ready defect, AI-generated regression tests, and a release risk score with a GO/NO-GO recommendation.

**Guiding product principle, stated explicitly in the UI:** *"AI identifies the most probable root cause based on available evidence"* — never *"AI always knows the root cause."* Every conclusion must be traceable to specific evidence. Low-confidence analyses must say so plainly rather than guess. This isn't a decoration — it shapes actual application logic (see §7, the mock rule engine's `insufficient_evidence` handling).

Built originally for a 12-hour AI hackathon; prioritize a polished, fully-working MVP over theoretical completeness.

---

## 2. Complete Feature List

1. **Dashboard** — tests analyzed, failed tests, critical failures, environment issues, application defects, flaky tests, average AI confidence, passed tests, a failure-distribution bar chart, a release-risk gauge, and a recent-investigations table.
2. **Analyze Failure** — the core page:
   - Test Information form (name, ID, application, environment, browser, build version, execution time)
   - Test Details form (description, steps, expected result, actual result)
   - Failure Evidence tabs: Logs, Stack Trace, API Response, Console Logs, Screenshot upload
   - **Load Demo Failure** button — one click loads a complete, realistic scenario
   - **Load Sample ▾** dropdown — loads any of 11 additional pre-built scenarios (see §8)
   - **Analyze with AI** button — triggers a cosmetic "investigation" checklist animation while the real API call runs underneath, then renders results
3. **AI Root Cause Analysis** — structured output (never free-form prose used for logic): failure summary, root cause, category, severity, priority, confidence (0-100) with a rationale sentence explaining *why* that confidence level, an `insufficient_evidence` flag, an evidence list (each item traceable to a literal line in the submitted input), a "why AI thinks this" bullet list (2-6 items), recommended actions, a developer hint, a test recommendation, a business impact statement, and optional screenshot findings.
4. **Failure Classification** into exactly six categories: `Application Defect`, `Test Automation Issue`, `Environment Issue`, `Configuration Issue`, `Data Issue`, `Flaky Test`.
5. **Confidence Scoring** — always shown with a qualitative label (Very High ≥85, High ≥65, Medium ≥45, Low <45) and an explicit "insufficient evidence" banner when evidence is thin, rather than a falsely confident guess.
6. **Evidence-Based Root Cause** — every evidence item is labeled with its source (`log`, `stack_trace`, `api_response`, `console`, `screenshot`, `test_data`) and quotes the actual submitted text, never fabricated content.
7. **AI Defect Generator** — produces a Jira-shaped defect (title, description, environment, preconditions, steps to reproduce, expected/actual result, root cause, severity, priority, business impact, evidence, suggested fix, regression recommendation) with Copy / Download / Export JSON / Export Markdown actions.
8. **Jira Integration** — a Settings page collects Jira URL/project key/email/API token (stored in browser `localStorage`, sent per-request, **never persisted server-side**). "Create Jira Defect" always shows a preview first. If full credentials are configured, it calls the real Jira REST API (v3, basic auth) and only reports success if Jira's response includes a real issue key. If credentials are absent, it runs a clearly-labeled **simulated** flow (`mode: "mock"` in the response) and never claims a real ticket was created.
9. **Screenshot Analysis** — sent as base64 to a vision-capable provider (Anthropic/OpenAI) when configured; the Mock provider honestly reports screenshot analysis is unavailable rather than pretending to see the image.
10. **AI Test Case Generator** — generates 4-6 regression test scenarios (ID, scenario, preconditions, steps, expected result, priority, automation recommendation) grounded in the confirmed root cause, plus on-demand **Generate Playwright Test** per scenario (real LLM generates actual TypeScript; Mock mode generates a clearly-labeled template with placeholder selectors).
11. **Release Risk Analyzer** — a 0-100 score computed from all unresolved failures (severity-weighted, boosted for confirmed application defects, discounted for flaky tests), a risk level (Low/Medium/High/Critical), a GO / GO_WITH_CAUTION / NO-GO recommendation, an explanation sentence, and a top-3 risks list.
12. **Failure History** — a filterable table (severity, category, application, environment, status) with inline status updates (Open/Investigating/Resolved) and an expandable row showing the root cause and metadata.
13. **Similar Failure Detection** — a lexical/category-weighted similarity comparison (NOT a trained embedding model — the UI says so explicitly) against failure history, surfacing the closest match, a similarity percentage, how many times that "family" of failure has occurred, and the last occurrence date.
14. **Ask AI QA Detective** — a floating chat widget grounded in the currently-analyzed failure's context, with suggested starter questions ("Why did this test fail?", "Should I create a P1 or P2?", etc.).
15. **Presentation Mode** — a judge-friendly one-screen summary: the 3-step story (Test Fails → AI Investigates → QA Gets The Answer) plus a live readout of the last analysis (or an "illustrative example" fallback if nothing has been analyzed yet).
16. **Demo Mode** — the single "Load Demo Failure" button; see §8 for the exact scenario.
17. **Dark/light mode** toggle (class-based, respects OS preference, persisted to `localStorage`).

---

## 3. Repository Layout (npm workspaces monorepo)

```
/
├── package.json              # root: "type": "module", workspaces: [client, server]
├── vercel.json                # unified deployment config (see §10)
├── api/
│   └── index.js                # Vercel serverless function wrapping the Express app
├── client/                    # React + TypeScript + Vite frontend (its own package.json)
│   ├── vite.config.ts          # dev-server proxy: /api -> http://localhost:4000
│   ├── vitest.config.ts
│   ├── tailwind.config.js
│   ├── .env.example
│   └── src/
│       ├── main.tsx, App.tsx, index.css
│       ├── api/client.ts        # single fetch wrapper, ApiError class
│       ├── types/index.ts       # hand-mirrored copies of the server's Zod-inferred types
│       ├── context/AnalysisContext.tsx   # shared "currently analyzed failure" state
│       ├── hooks/useLocalStorage.ts
│       ├── lib/{chartColors,defectExport,fileToBase64}.ts
│       ├── components/          # ui/ (Button,Card,Badge,Field,Progress,EmptyState,cn),
│       │                         # layout/ (AppShell,Sidebar,ThemeToggle,ProviderBadge),
│       │                         # charts/ (FailureDistributionChart,RiskGauge),
│       │                         # feature components (ResultsPanel, DefectCard,
│       │                         # JiraCreateModal, RegressionTestsList,
│       │                         # AnalysisAnimation, ConfidenceMeter, ChatAssistant,
│       │                         # StatCard, RecommendationBadge)
│       ├── pages/                # Dashboard, AnalyzeFailure, FailureHistory,
│       │                         # TestGenerator, ReleaseRisk, JiraDefects, Settings,
│       │                         # PresentationMode (+ .test.tsx for Dashboard, AnalyzeFailure)
│       └── test/                 # setup.ts, mockFetch.ts, fixtures.ts, renderWithProviders.tsx
├── server/                    # Node + Express + TypeScript backend (its own package.json)
│   ├── tsconfig.json            # module: ESNext, moduleResolution: Bundler
│   ├── vitest.config.ts
│   └── src/
│       ├── index.ts              # loads dotenv, calls createApp(), app.listen(PORT)
│       ├── app.ts                # createApp(): builds the Express app, NO app.listen — reused by both index.ts (local/Render) and api/index.js (Vercel)
│       ├── schemas/index.ts       # every Zod schema (see §6)
│       ├── ai/                    # llm-provider, prompts, structured-response,
│       │                          # failure-analyzer, mock-analyzer, defect-generator,
│       │                          # test-generator, risk-analyzer, chat-assistant, similarity
│       ├── routes/                # analyze, defect, testgen, risk, history, jira, chat, demo, dashboard
│       ├── store/historyStore.ts  # in-memory, seeded on module load
│       ├── data/sampleFailures.ts # demoScenario, sampleScenarios{}, seedHistory[]
│       ├── jira/jiraClient.ts     # real API + mock fallback
│       └── utils/validate.ts      # Express Zod-validation middleware factory
│   └── tests/                    # analyze, defect, structured-response, mock-analyzer (.test.ts)
├── docs/
│   ├── shopsphere/README.md      # profile of the fictional flagship demo company
│   └── screenshots/               # 9 PNGs, 3200x2000 (2x device scale), captured from the live app
├── test-data/README.md          # 6 cross-industry sample scenarios, documented
├── README.md                    # Problem/Solution/Tech Stack/How to Run/Demo/Screenshots
├── flow.md                       # mechanism walkthrough with Mermaid diagrams + real example data
├── DEPLOYMENT.md                 # unified-Vercel steps (primary) + split Vercel+Render (alternative)
├── .env.example                  # AI_PROVIDER, keys, PORT, CORS_ORIGIN, Jira vars
└── .gitignore                    # node_modules/, dist/, build/, .env, *.log, data/*.json
```

---

## 4. Tech Stack (exact)

**Frontend:** React 18.3, TypeScript 5.7, Vite 5.4, Tailwind CSS 3.4, Recharts 2.13, React Router 6.28, clsx. Test: Vitest 2.1 + React Testing Library 16 + jsdom.

**Backend:** Node.js, Express 4.21, TypeScript 5.7 (ESM, `"type": "module"`, `moduleResolution: "Bundler"`), Zod 3.23, `@anthropic-ai/sdk` 0.32, `openai` 4.73, `nanoid` 5, `dotenv` 16, `cors`. Test: Vitest 2.1 + Supertest 7.

**Monorepo:** npm workspaces (`client`, `server`), `concurrently` to run both dev servers together. Root `package.json` has `"type": "module"` (needed so the root-level `api/index.js` parses as ESM).

**Deployment:** Vercel (both frontend static build and backend serverless function, one project — see §10).

---

## 5. AI Architecture

All AI usage is centralized under `server/src/ai/` — no prompt text or LLM-SDK calls anywhere else in the codebase.

```
LLMProvider (server/src/ai/llm-provider.ts)
    ├── AnthropicProvider  — @anthropic-ai/sdk, supportsVision: true
    ├── OpenAIProvider     — openai SDK, supportsVision: true
    └── MockProvider       — supportsVision: false, complete() returns "" (never called directly;
                              callers check llmProvider.name === "mock" and branch to a
                              deterministic rule-based generator instead)
```

- Selected via `AI_PROVIDER` env var (`mock` default | `anthropic` | `openai`). If `anthropic`/`openai` is selected but the matching API key is missing, log a warning and fall back to `mock` — **never crash, never silently no-op**.
- `prompts.ts` holds every system/user prompt as exported constants/builder functions.
- `structured-response.ts`: calls the provider, extracts JSON from the raw text (handles markdown-fenced JSON defensively), validates with the relevant Zod schema, and **retries once with an appended correction prompt** if parsing/validation fails. Throws a typed `StructuredAIError` if it still fails after retry — routes catch this and return a friendly 502, never an unhandled crash or garbage rendered to the user.
- Each feature module (`failure-analyzer.ts`, `defect-generator.ts`, `test-generator.ts`, `risk-analyzer.ts`, `chat-assistant.ts`) has **two code paths**: a real-LLM path (calls `getStructuredCompletion` with its schema) and a deterministic mock path used when `llmProvider.name === "mock"`.

### 5a. The mock rule engine (`mock-analyzer.ts`) — this is the heart of the "AI quality" demo

A `Ctx` object combines `testDetails.expectedResult + actualResult + evidence.{logs,stackTrace,apiResponse,consoleLogs}` into one text blob (`combined`) plus a `lines[]` array, alongside the raw individual evidence fields. A `Rule = (ctx) => FailureAnalysis | null` function array is checked **in order, first match wins**:

| # | Rule | Condition | Result |
|---|---|---|---|
| 1 | `paymentNullPointerRule` | HTTP 5xx/"internal server error" **and** NullPointerException/"is null"/`transactionid...null` | Application Defect · Critical · P1 · 94% |
| 2 | `successApiButAutomationTimeoutRule` | `evidence.apiResponse` contains a success marker (`paymentStatus: SUCCESS`, `status: CONFIRMED`, "submitted/created successfully") **and** `combined` contains a UI timeout near "locator/element/banner/confirmation" | **Test Automation Issue** · Medium · P3 · 85% — the key "smart" rule: backend succeeded, UI didn't, blame the test not the app |
| 3 | `authServiceUnavailableRule` | "auth(entication)? (service\|server)" **and** unavailable/refused/503/timeout/down | Environment Issue · High · P2 · 88% |
| 4 | `authUnauthorizedAmbiguousRule` | 401/Unauthorized/invalid-token **and** an assertion-failure or `AUTH_TOKEN_INVALID` signal (but rule 3 didn't already match — i.e., no "service is down" phrasing) | Application Defect (tentative) · Medium · P3 · **45%, `insufficient_evidence: true`** — deliberately refuses to guess between app bug / stale credentials / env issue |
| 5 | `databaseConnectionRefusedRule` | database/postgresql/jdbc/mysql/mongodb **and** "connection refused"/`CannotGetJdbcConnectionException`/ECONNREFUSED | Environment Issue · Critical · P1 · 87% |
| 6 | `priceCalculationRule` | price/total/amount/subtotal word **and** `testDetails.expectedResult !== actualResult` with digits in both | Application Defect (pricing) · High · P2 · 72% |
| 7 | `businessLogicMismatchRule` | `combined` contains 200/201/202 **and** `expectedResult !== actualResult` | Application Defect (business logic) · High · P2 · 75% — "HTTP succeeded but the business state is wrong" |
| 8 | `apiTimeoutRule` | timeout **and** ("search"\|"/api/"\|"request") **and NOT** a UI-element wait (`waiting for (element\|locator\|selector)`, `element not visible`, `stale element` — deliberately narrow so a phrase like "...while waiting for /api/search" is NOT excluded) | Environment Issue · High · P2 · 80%, `is_flaky: true` |
| 9 | `flakyElementTimeoutRule` | "timed out waiting", "wait(ing)? for element", "element not visible", "stale element" | Flaky Test · Medium · P3 · 70% |
| 10 | `locatorNotFoundRule` | "no such element", "unable to locate element", "locator not found" | Test Automation Issue · Medium · P3 · 82% |
| — | `fallbackInsufficientEvidence` | none of the above matched | confidence 15 (no evidence at all) or 35 (some evidence, no recognizable signature); `insufficient_evidence: true`; explicitly recommends attaching more logs |

**Critical implementation detail:** rule 8's element-exclusion regex must be scoped to actual UI-wait phrasing (`waiting for (element|locator|selector)`), **not** a bare `waiting for` catch-all — a broad version of this regex is a real bug that was caught during development: it incorrectly excluded a legitimate API-timeout scenario ("...exceeded while waiting for /api/search") from its correct Environment Issue classification. Write a regression test for this specific case.

Every rule builds its `evidence[]` array from lines that literally appear in the input (regex-matched from `ctx.lines`) — never fabricated. `screenshot_findings` is only ever populated by a real vision-capable provider; the mock path always leaves it `undefined` and the UI shows an honest "unavailable in Demo Mode" note when a screenshot was attached but not analyzed.

---

## 6. Data Contracts (Zod schemas, `server/src/schemas/index.ts`)

```
RootCauseCategory = "Application Defect" | "Test Automation Issue" | "Environment Issue"
                   | "Configuration Issue" | "Data Issue" | "Flaky Test"
Severity  = "Critical" | "High" | "Medium" | "Low"
Priority  = "P1" | "P2" | "P3" | "P4"

FailureAnalysis {
  failure_summary, root_cause: string
  root_cause_category: RootCauseCategory
  severity: Severity, priority: Priority
  confidence: number (0-100), confidence_rationale: string
  is_flaky, environment_issue, application_defect: boolean
  evidence: { label, detail, source: "log"|"stack_trace"|"api_response"|"console"|"screenshot"|"test_data" }[]
  why_ai_thinks_this: string[] (1-6)
  recommended_actions: string[]
  developer_hint, test_recommendation, business_impact: string
  screenshot_findings?: string[]
  insufficient_evidence: boolean
}

Defect { title, description, environment, preconditions, steps_to_reproduce[],
         expected_result, actual_result, root_cause, severity, priority,
         business_impact, evidence[], suggested_fix, regression_recommendation }

RegressionTest { id, scenario, preconditions, steps[], expected_result, priority,
                  automation_recommendation }

ReleaseRisk { risk_score (0-100), risk_level: Low|Medium|High|Critical,
              recommendation: GO|GO_WITH_CAUTION|NO-GO, explanation,
              top_risks: { area, severity, reason }[] }

StoredFailure { id, createdAt, testInfo, testDetails, analysis: FailureAnalysis,
                status: Open|Investigating|Resolved, jiraKey? }
```

Request payloads (`AnalyzeFailureRequestSchema`, `GenerateDefectRequestSchema`, `GenerateTestsRequestSchema`, `ChatRequestSchema`, `CreateJiraDefectRequestSchema`, `JiraSettingsSchema`) all validate via a shared Express middleware (`validateBody(schema)`) that returns 400 with field-level messages on failure.

---

## 7. API Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | `{status, aiProvider, visionSupported}` |
| GET | `/api/dashboard` | aggregate metrics + failure distribution + release risk + recent investigations |
| POST | `/api/analyze` | run failure analysis, find similar failure, persist to history, return `{failureId, analysis, provider, screenshotAnalysisAvailable, similar}` |
| POST | `/api/defect` | generate a defect from a completed analysis |
| POST | `/api/tests/generate` | generate regression tests |
| POST | `/api/tests/playwright` | generate one Playwright test for one regression scenario |
| GET | `/api/risk` | compute release risk over all stored failures |
| GET | `/api/history` | list + filter (`severity`, `category`, `application`, `environment`, `status` query params) |
| GET | `/api/history/:id` | one record |
| PATCH | `/api/history/:id/status` | update status |
| POST | `/api/jira/create` | create (real or simulated) Jira defect |
| POST | `/api/jira/link/:failureId` | attach a Jira key to a history record |
| POST | `/api/chat` | grounded Q&A over the current analysis |
| GET | `/api/demo` | the flagship demo scenario |
| GET | `/api/demo/scenarios` | **all** entries of `sampleScenarios` — dynamically drives the "Load Sample ▾" dropdown; adding a new key to `sampleScenarios` is the *only* change needed to add a new dropdown option |

---

## 8. Demo / Seed Data

### Flagship scenario (`demoScenario`, loaded by "Load Demo Failure")

ShopSphere E-Commerce, `TC-CHECKOUT-014`, QA/Chrome/`2026.08.16.142`. Expected: payment completes, order confirmation shown. Actual: HTTP 500. Evidence: logs showing `POST /api/payment` → 500 → `PaymentService exception` → `NullPointerException` → `PaymentService.java:142` → `transactionId is null`; matching Java stack trace; a 500 API response body; a browser console error. → Application Defect · Critical · P1 · 94%.

### `sampleScenarios` object (populates "Load Sample ▾", 12 entries total)

**ShopSphere set (6):** `payment` (= demoScenario), `login` (ShopSphere Auth — ECONNREFUSED to auth host, 503), `productSearch` (ShopSphere Catalog — 15s timeout on `/api/search`), `cart` (ShopSphere Cart — discount not applied, 99.00 vs 90.00), `flaky` (ShopSphere E-Commerce — timeout waiting for `.order-confirmation-banner`, no API evidence), `automation` (ShopSphere Account — `NoSuchElementException` for `[data-testid='edit-address-btn']`).

**Cross-industry set (6, documented in `test-data/README.md`):** `ecommercePaymentAdvanced` (ShopSphere, richer NPE/500 variant), `bankingLoginFailure` (SecureBank Online — ambiguous 401), `warehouseInventoryTimeout` (SmartWarehouse — `SocketTimeoutException`/504), `rideBookingLogicFailure` (QuickRide — HTTP 201 but ride stuck `PENDING` not `CONFIRMED`), `healthcareDatabaseFailure` (MediCare Portal — `CannotGetJdbcConnectionException`, Postgres refused, 503), `playwrightAutomationFailure` (ShopSphere — **the API response explicitly confirms success (`orderStatus: CONFIRMED`, `paymentStatus: SUCCESS`) while the UI automation times out waiting for the confirmation banner** — the one scenario that proves the engine can tell a real defect apart from a broken test).

### `seedHistory` (13 `StoredFailure` records, loaded into the in-memory store on startup)

Gives the Dashboard/History/Release Risk/Similarity features real data with zero user interaction. Includes three related payment-defect recurrences (`PAY-142`, `PAY-098`, `PAY-051`, 2/9/21 days ago) specifically so **Similar Failure Detection** has a "family" of failures to find, plus a mix of Environment/Automation/Configuration/Flaky examples across all six ShopSphere modules (E-Commerce, Cart, Catalog, Auth, Account, Marketing). Dates are computed as `Date.now() - n*86400000` at module load, so they shift forward on every server restart — document this rather than treating it as a bug.

**ShopSphere itself is fictional** — a disclaimer belongs at the top of `docs/shopsphere/README.md` and should never be presented as a real company.

---

## 9. Frontend Architecture

- **`AnalysisContext`** (React Context) is the single source of truth for "the currently analyzed failure" (`testInfo`, `testDetails`, `evidence`, `result`, `defect`, `tests`) — shared across the Analyze Failure results panel, Test Generator, Jira Defects, Presentation Mode, and the Chat Assistant, with zero prop-drilling or refetching.
- **`api/client.ts`** is the only place that calls `fetch`. Base URL: `import.meta.env.VITE_API_URL || "/api"` — empty/unset resolves to same-origin `/api`, which is exactly right for both local dev (Vite proxy) and the unified Vercel deployment (same domain). A thrown `ApiError` carries the server's message or a generic fallback; every page catches it and shows a friendly inline message, never a blank screen.
- Charts use a **fixed categorical color assignment** (never re-cycled based on which categories are present in the current dataset) — see `lib/chartColors.ts`, using the standard 8-hue categorical/status palette (blue/orange/aqua/yellow/magenta/green + red/amber/serious/critical status colors), reserving distinct steps for status vs. category so they never collide visually.
- The "Analyze with AI" click shows a purely cosmetic investigation checklist (`AnalysisAnimation`) that ticks through 8 steps while the real request runs underneath — it does not gate or fake the actual result.
- Jira/localStorage: `useLocalStorage` hook persists Jira settings and the "created defects" history client-side only.

---

## 10. Deployment — Unified Single Vercel Project (primary)

This is the load-bearing architectural decision: **one Vercel project serves both the static frontend and the API**, sharing one domain, with zero CORS configuration needed.

- `api/index.js` (plain `.js`, ESM — root `package.json` has `"type": "module"` specifically so this parses correctly) imports `createApp` from **`server/dist/app.js`** (the *compiled* output, not the `.ts` source — sidesteps any ambiguity about whether the function bundler resolves TypeScript's `.js`-importing-`.ts` convention) and exports the resulting Express app instance as the default export. An Express app is itself a valid `(req, res)` handler, so no adapter code is needed.
- Root `vercel.json`:
  ```json
  {
    "installCommand": "npm install",
    "buildCommand": "npm run build -w server && npm run build -w client",
    "outputDirectory": "client/dist",
    "rewrites": [
      { "source": "/api/(.*)", "destination": "/api/index" },
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```
  The first rewrite sends every `/api/*` request to the one serverless function while Vercel preserves the original path in `req.url`, so Express's own `app.use("/api/dashboard", ...)`-style routing works unmodified. The second is the standard SPA fallback for React Router.
- **Root Directory in the Vercel project must be the repository root** — not `client`, not `server`. This is the #1 setup mistake: if Root Directory is scoped to a subfolder, Vercel never sees the sibling folder(s) or the root `vercel.json`/`api/` directory.
- No environment variables are required for the demo (`AI_PROVIDER` defaults to `mock`).
- **Known tradeoff, state clearly to the user:** serverless functions are stateless between cold starts. The in-memory `historyStore` persists for the life of a *warm* function instance (fine for a single demo session) but resets to the 13 seed records on a cold start. Document an alternative split deployment (Vercel frontend + Render backend, a normal always-on Node process) for anyone who needs that state to survive indefinitely — see `DEPLOYMENT.md`.
- Before wiring this up for real, **verify locally**: build the server, dynamically `import()` `api/index.js`, confirm the default export is a function, then actually serve it via `http.createServer(handler)` and curl `/api/health` and a few other routes. This exact local check caught zero issues here but is the right verification step before trusting a cold serverless deploy.

---

## 11. Testing Strategy

- **Backend** (Vitest + Supertest, 22 tests across 4 files): `tests/analyze.test.ts` (demo scenario end-to-end, validation 400s, insufficient-evidence path, flaky detection), `tests/defect.test.ts` (defect generation, regression test generation, release risk, dashboard, mock Jira creation), `tests/structured-response.test.ts` (JSON-extraction/validation/retry contract), `tests/mock-analyzer.test.ts` (one assertion per sample scenario locking in its exact classification — this is what catches rule-ordering regressions).
- **Frontend** (Vitest + React Testing Library, 5 tests across 2 files): `Dashboard.test.tsx` (loads metrics, handles a failed fetch), `AnalyzeFailure.test.tsx` (form renders, Load Demo Failure populates fields, full analyze → results → generate-defect flow against a mocked fetch). A `mockFetch` test helper routes by URL substring; `jsdom` needs a `ResizeObserver` polyfill for Recharts' `ResponsiveContainer` to render in tests.
- Run everything with `npm run test` from the root (runs both workspaces sequentially).
- Before trusting any deployment config or rule-engine change, **run it for real** — build the actual artifact and exercise it (serve `api/index.js` over real HTTP; run every sample scenario through `runMockAnalysis` and print the classification) rather than reasoning about regexes/bundler behavior by hand. Two real bugs were caught this way during development (an over-broad exclusion regex, and a duplicate-JSON-key issue in hand-authored sample data) that pure code review missed.

---

## 12. Security & Responsible-AI Requirements

- Never expose API keys to the frontend; never commit `.env`; never log secrets.
- Jira credentials live in the browser's `localStorage` only, sent per-request, never written to any server-side store or file.
- Never claim a real external action succeeded unless the external system's response actually confirms it (the Jira mock-vs-real distinction is the concrete instance of this rule — `mode: "mock"` must always be visually distinct from `mode: "real"` in the UI).
- Never let an unvalidated AI response reach application logic or the client — always schema-validate, with a bounded retry and a graceful typed error as the last resort.
- Never present confidence the evidence doesn't support — the `insufficient_evidence` flag and the deliberately-moderate-confidence ambiguous-auth-failure rule (§5a, rule 4) are the concrete instances of this.

---

## 13. Build Order (if starting from an empty repo)

1. Root workspace scaffold (`package.json` with workspaces, `.gitignore`, `.env.example`).
2. Server: Zod schemas → `LLMProvider` abstraction (Mock first, so the app is fully functional before touching any real SDK) → centralized prompts → `structured-response.ts` (parse/validate/retry) → mock rule engine → per-feature AI modules (analyzer, defect, tests, risk, chat, similarity) → in-memory store + seed data → Express routes → `app.ts`/`index.ts` split (so the app factory is reusable by both a normal server and a serverless function later).
3. Backend tests as each piece lands, not deferred to the end.
4. Client: Vite/Tailwind/TS scaffold → API client + shared types → `AnalysisContext` → layout shell (Sidebar/AppShell/theme) → UI primitives → Dashboard page → Analyze Failure page (the biggest one: form + evidence tabs + animation + results) → remaining pages (History, Test Generator, Release Risk, Jira Defects, Settings, Presentation Mode) → Chat Assistant.
5. Frontend tests for the two highest-value flows (Dashboard load, full Analyze→Results→Defect flow).
6. Full build + full test run; fix everything before moving on.
7. **Manually drive the actual running app** (not just unit tests) through the complete demo flow at least once — ideally with a real browser automation tool, screenshotting each step — before calling it done.
8. Documentation: README (Problem/Solution/Tech Stack/How to Run/Demo/Screenshots), `flow.md` (mechanism diagrams + real example data, verified against actual source), `docs/shopsphere/`, `test-data/`.
9. Deployment: build `api/index.js` + root `vercel.json`, verify locally via a real HTTP server before pushing, then deploy with Root Directory at the repo root.
10. Push to GitHub; confirm the live deployment actually works (health check, then the full click-through demo) before declaring done.

---

## 14. Acceptance Criteria

- [ ] App runs with zero API keys configured (`AI_PROVIDER=mock` default)
- [ ] Dashboard shows real seeded metrics on first load
- [ ] Load Demo Failure → Analyze with AI → root cause/category/severity/confidence/evidence all render, traceable to the input
- [ ] Generate Defect → Jira-ready defect renders with working Copy/Download/Export
- [ ] Create Jira Defect → preview shown first; mock vs. real clearly distinguished; never falsely claims a real ticket
- [ ] Generate Regression Tests → scenarios render; Generate Playwright Test produces code (or a clearly-labeled template in Mock mode)
- [ ] Release Risk → score/level/recommendation/top-risks all driven by actual stored failure data
- [ ] Failure History → filters work; status updates persist
- [ ] Similar Failure Detection fires on the flagship scenario (finds `PAY-142`) with an honest "lexical comparison, not embeddings" disclosure
- [ ] All 12 "Load Sample" scenarios classify to their documented category when run through the mock engine (this is a testable, not just visual, criterion — see `mock-analyzer.test.ts`)
- [ ] Chat Assistant answers using the current analysis as context
- [ ] Full test suite passes (backend + frontend)
- [ ] Live deployment reachable, `/api/health` returns 200, full demo flow works end-to-end in a real browser
- [ ] No secrets in the repo; `.env` gitignored; `.env.example` present and accurate
- [ ] README/flow.md/docs are accurate to the actual code, not aspirational

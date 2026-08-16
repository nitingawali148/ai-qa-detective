# AI QA Detective — Project Flow

This document walks a new contributor through **how the app actually works**, from a cold start to a fully analyzed failure — with the real ShopSphere demo data at each step. Read it top to bottom; each diagram builds on the one before it.

---

## 1. The big picture — what talks to what

Three layers: a React client, an Express API, and a swappable AI provider. The client never talks to an LLM directly — everything goes through the server, so API keys never reach the browser.

```mermaid
flowchart LR
    subgraph Browser["Browser (client/)"]
        UI["React Pages\n(Dashboard, Analyze Failure, ...)"]
        CTX["AnalysisContext\n(current failure, defect, tests)"]
        UI <-->|"read/write shared state"| CTX
    end

    subgraph API["Express API (server/)"]
        ROUTES["Routes\n/api/analyze, /api/defect,\n/api/tests, /api/risk, ..."]
        SCHEMAS["Zod Schemas\nvalidate every AI response"]
        SVC["AI Services\nfailure-analyzer, defect-generator,\ntest-generator, risk-analyzer"]
        STORE["In-memory Failure Store\n(seeded with 13 sample failures)"]
    end

    subgraph AI["LLMProvider (server/src/ai/llm-provider.ts)"]
        MOCK["Mock\n(rule-based, no API key)"]
        CLAUDE["Anthropic Claude"]
        OPENAI["OpenAI"]
    end

    UI -- "fetch('/api/...')" --> ROUTES
    ROUTES -- "validated request" --> SVC
    SVC -- "structured completion request" --> AI
    AI -- "raw text (JSON)" --> SVC
    SVC -- "parse + validate" --> SCHEMAS
    SCHEMAS -- "typed result" --> SVC
    SVC -- "record failure" --> STORE
    SVC -- "JSON response" --> ROUTES
    ROUTES -- "JSON response" --> UI

    style MOCK fill:#fef3c7,stroke:#d97706
```

**Which AI branch runs is one env var:** `AI_PROVIDER=mock` (default, no key needed) routes every AI service to its deterministic rule engine; `anthropic`/`openai` route to the real SDK call instead. Nothing else in the code changes — see `server/src/ai/llm-provider.ts`.

---

## 2. The demo, step by step

This is the exact path a new user takes, and what's actually happening behind each click.

```mermaid
flowchart TD
    A["Open http://localhost:5173"] --> B["Dashboard\nGET /api/dashboard"]
    B --> C["Click 'Analyze Failure' in sidebar"]
    C --> D["Click 'Load Demo Failure'\nGET /api/demo"]
    D --> E["Form fills with ShopSphere\ncheckout/payment scenario"]
    E --> F["Click 'Analyze with AI'\nPOST /api/analyze"]
    F --> G["Investigation animation plays\n(cosmetic, real request runs underneath)"]
    G --> H["Results render:\nRoot Cause, Category, Severity,\nConfidence, Evidence"]
    H --> I["Click 'Generate Defect'\nPOST /api/defect"]
    I --> J["Jira-ready Defect card renders"]
    J --> K["Click 'Create Jira Defect'\nPOST /api/jira/create"]
    K --> L{"Jira credentials\nconfigured in Settings?"}
    L -- "No (default)" --> M["Simulated ticket created\ne.g. DEMO-4821 — clearly labeled MOCK"]
    L -- "Yes" --> N["Real Jira REST API call\nticket only shown if Jira confirms it"]
    H --> O["Click 'Generate Regression Tests'\nPOST /api/tests/generate"]
    O --> P["5 regression scenarios render"]
    P --> Q["Optional: 'Generate Playwright Test'\nPOST /api/tests/playwright"]
    H --> R["Open 'Release Risk' page\nGET /api/risk"]
    R --> S["High risk score → NO-GO\n(driven by this + seeded failures)"]
```

---

## 3. What happens inside `POST /api/analyze` (the core mechanism)

This is the most important request in the app. It's the same code path whether you're running the free Mock engine or a real LLM — only the branch inside "AI Service" differs.

```mermaid
sequenceDiagram
    participant UI as Analyze Failure page
    participant Route as POST /api/analyze
    participant Zod as AnalyzeFailureRequestSchema
    participant Svc as failure-analyzer.ts
    participant Mock as mock-analyzer.ts
    participant LLM as Real LLM (Anthropic/OpenAI)
    participant Val as FailureAnalysisSchema
    participant Store as historyStore

    UI->>Route: testInfo + testDetails + evidence
    Route->>Zod: validate request shape
    Zod-->>Route: OK (or 400 with field errors)
    Route->>Svc: analyzeFailure(request)

    alt AI_PROVIDER=mock
        Svc->>Mock: runMockAnalysis(request)
        Mock->>Mock: scan evidence for known signatures\n(HTTP 5xx + NullPointerException,\nauth service down, locator not found, ...)
        Mock-->>Svc: FailureAnalysis object (already typed)
    else AI_PROVIDER=anthropic/openai
        Svc->>LLM: system prompt + evidence, "return JSON matching this shape"
        LLM-->>Svc: raw text response
        Svc->>Val: extract JSON, parse, validate
        alt invalid JSON/schema
            Svc->>LLM: retry once with correction prompt
            LLM-->>Svc: raw text response (attempt 2)
            Svc->>Val: parse + validate again
        end
        Val-->>Svc: FailureAnalysis object (or throws)
    end

    Svc->>Store: findSimilarFailure() against history
    Svc->>Store: add(record) — persists this failure
    Svc-->>Route: { analysis, provider, similar }
    Route-->>UI: 200 JSON
    UI->>UI: render ResultsPanel
```

**Why this matters for a new contributor:** the UI never sees an unvalidated AI response. If a real provider returns malformed JSON twice in a row, the route returns a 502 with a friendly message — it never crashes and never renders garbage.

---

## 4. Example run — the exact data, at every stage

Follow one real object as it moves through the system, using the built-in ShopSphere demo.

### 4.1 What the user submits (from "Load Demo Failure")

```json
{
  "testInfo": { "testName": "Verify successful checkout using credit card", "application": "ShopSphere E-Commerce", "environment": "QA" },
  "testDetails": { "expectedResult": "Payment should complete successfully.", "actualResult": "Checkout failed with HTTP 500." },
  "evidence": {
    "logs": "[ERROR] Response status: 500\n[ERROR] java.lang.NullPointerException\n[ERROR] PaymentService.java:142\n[ERROR] transactionId is null"
  }
}
```

### 4.2 How the Mock engine classifies it (`mock-analyzer.ts`)

Rules run **in this exact order** (first match wins — see the `RULES` array in `mock-analyzer.ts`). The set below was expanded to cover the cross-industry scenarios in [test-data/](../test-data/) as well as the original ShopSphere set:

```mermaid
flowchart TD
    Start["Combine testDetails + all evidence\ninto one text blob"] --> R1{"HTTP 5xx\nAND NullPointerException/null?"}
    R1 -- Yes --> Out1["Application Defect · Critical · P1\n~94%"]
    R1 -- No --> R2{"API response confirms success\nAND UI locator/element timeout?"}
    R2 -- Yes --> Out2["Test Automation Issue · Medium · P3\n~85%\n(backend succeeded, automation didn't)"]
    R2 -- No --> R3{"'auth service/server'\nAND unavailable/refused/timeout?"}
    R3 -- Yes --> Out3["Environment Issue · High · P2\n~88%"]
    R3 -- No --> R4{"401/Unauthorized\nAND an assertion/invalid-token signal?"}
    R4 -- Yes --> Out4["Application Defect (tentative)\nMedium · P3 · ~45%\ninsufficient_evidence: true"]
    R4 -- No --> R5{"Database/JDBC\nAND connection refused?"}
    R5 -- Yes --> Out5["Environment Issue · Critical · P1\n~87%"]
    R5 -- No --> R6{"Price/total field mismatch\nin expected vs actual?"}
    R6 -- Yes --> Out6["Application Defect (pricing) · High · P2\n~72%"]
    R6 -- No --> R7{"HTTP 2xx\nAND expected/actual state differs?"}
    R7 -- Yes --> Out7["Application Defect (business logic)\nHigh · P2 · ~75%"]
    R7 -- No --> R8{"Timeout AND /api/ call\n(and NOT about a UI element)?"}
    R8 -- Yes --> Out8["Environment Issue · High · P2\n~80%"]
    R8 -- No --> R9{"'waiting for element/locator'\nor 'stale element'?"}
    R9 -- Yes --> Out9["Flaky Test · Medium · P3\n~70%"]
    R9 -- No --> R10{"'no such element' /\n'locator not found'?"}
    R10 -- Yes --> Out10["Test Automation Issue · Medium · P3\n~82%"]
    R10 -- No --> Out11["Insufficient Evidence · Medium · P3\n15-35%\n'Additional logs recommended'"]

    style Out1 fill:#fee2e2,stroke:#dc2626
    style Out2 fill:#dcfce7,stroke:#16a34a
```

Rule **R2** (checked second, right after the payment defect) is the most interesting one: it specifically requires *both* a success signal in the API response *and* a UI timeout, so it correctly attributes scenario 6 in [test-data/](../test-data/) to the automation rather than the application — proving the engine reasons about the *relationship* between evidence, not just keyword presence. See `server/tests/mock-analyzer.test.ts` for the regression tests locking in every scenario's classification.

The ShopSphere payload hits rule **R1** first (rules are checked in order, most specific first — see `RULES` array in `mock-analyzer.ts`), producing:

```json
{
  "root_cause": "PaymentService fails to handle a missing transactionId from the payment response.",
  "root_cause_category": "Application Defect",
  "severity": "Critical",
  "priority": "P1",
  "confidence": 94,
  "confidence_rationale": "High confidence: the logs contain a direct HTTP 500 response, an explicit stack trace with file/line, and an explicit null-value message that together form a complete causal chain.",
  "evidence": [
    { "label": "HTTP Error Response", "detail": "Response status: 500", "source": "log" },
    { "label": "Exception / Null Reference", "detail": "PaymentService.java:142", "source": "log" }
  ]
}
```

Every rule builds its `evidence[]` array from lines that **literally appear** in the submitted logs (via regex matches) — nothing is invented. That's the "evidence-based root cause" principle from the product spec, enforced in code, not just in the prompt.

### 4.3 What the client does with the response

```mermaid
stateDiagram-v2
    [*] --> Idle: page loads
    Idle --> Analyzing: user clicks "Analyze with AI"
    Analyzing --> ResultsShown: /api/analyze resolves\n(AnalysisContext.setResult)
    ResultsShown --> DefectShown: user clicks "Generate Defect"\n(AnalysisContext.setDefect)
    ResultsShown --> TestsShown: user clicks "Generate Regression Tests"\n(AnalysisContext.setTests)
    DefectShown --> JiraCreated: user clicks "Create Jira Defect"
    Idle --> Idle: "Load Demo Failure" only fills the form,\ndoes not call /api/analyze
```

`AnalysisContext` (`client/src/context/AnalysisContext.tsx`) is the one shared piece of state — it's what lets the **Test Generator**, **Jira Defects**, and the floating **chat assistant** all reference "the failure you just analyzed" without re-fetching or prop-drilling across routes.

---

## 5. Release Risk — how the dashboard number is computed

```mermaid
flowchart LR
    A["All stored failures\n(historyStore.list())"] --> B["Filter: status != Resolved"]
    B --> C["For each: weight by severity\nCritical=26, High=15, Medium=7, Low=3"]
    C --> D["+15% if application_defect\n-50% if is_flaky"]
    D --> E["Sum, clamp 0-100"]
    E --> F{"score >= 75?"}
    F -- Yes --> G["Critical risk"]
    F -- No --> H{"score >= 50?"}
    H -- Yes --> I["High risk"]
    H -- No --> J{"score >= 25?"}
    J -- Yes --> K["Medium risk"]
    J -- No --> L["Low risk"]
    E --> M{"Any unresolved Critical item?\nOR score >= 60?"}
    M -- Yes --> N["Recommendation: NO-GO"]
    M -- No --> O{"score >= 30?"}
    O -- Yes --> P["Recommendation: GO_WITH_CAUTION"]
    O -- No --> Q["Recommendation: GO"]
```

With a real LLM provider configured, this same decision is instead made by an LLM given the same failure list (`buildRiskPrompt` in `prompts.ts`) — the mock version above is what runs by default so the number is explainable and deterministic.

---

## 6. Where to look in the code for each box

| Diagram box | File |
|---|---|
| Routes | `server/src/routes/*.ts` |
| Zod schemas | `server/src/schemas/index.ts` |
| LLMProvider (mock/anthropic/openai) | `server/src/ai/llm-provider.ts` |
| Mock rule engine | `server/src/ai/mock-analyzer.ts` |
| Real-provider prompt + retry logic | `server/src/ai/prompts.ts`, `server/src/ai/structured-response.ts` |
| Failure store + seed data | `server/src/store/historyStore.ts`, `server/src/data/sampleFailures.ts` |
| Release risk logic | `server/src/ai/risk-analyzer.ts` |
| Similarity detection | `server/src/ai/similarity.ts` |
| Shared frontend state | `client/src/context/AnalysisContext.tsx` |
| API client (all `fetch` calls) | `client/src/api/client.ts` |
| Results UI | `client/src/components/ResultsPanel.tsx` |

For setup/run instructions, see [README.md](README.md).

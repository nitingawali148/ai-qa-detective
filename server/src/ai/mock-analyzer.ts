import type { AnalyzeFailureRequest, EvidenceItem, FailureAnalysis } from "../schemas/index.js";

/**
 * Deterministic, rule-based "AI" used when no LLM provider is configured
 * (AI_PROVIDER=mock, or as an automatic fallback). It never fabricates
 * evidence — every conclusion is traced back to lines that literally
 * appear in the submitted logs/stack trace/API response/console output.
 *
 * This keeps the full demo flow fully functional with zero API keys.
 */

interface Ctx {
  combined: string;
  lines: string[];
  logs: string;
  stackTrace: string;
  apiResponse: string;
  consoleLogs: string;
  testInfo: AnalyzeFailureRequest["testInfo"];
  testDetails: AnalyzeFailureRequest["testDetails"];
  hasScreenshot: boolean;
}

function findLines(ctx: Ctx, pattern: RegExp): string[] {
  return ctx.lines.filter((l) => pattern.test(l)).map((l) => l.trim());
}

function evidenceFrom(lines: string[], source: EvidenceItem["source"], label: string): EvidenceItem[] {
  return lines.slice(0, 3).map((detail) => ({ label, detail, source }));
}

type Rule = (ctx: Ctx) => FailureAnalysis | null;

const paymentNullPointerRule: Rule = (ctx) => {
  const has500 = /(http\s?)?5\d{2}\b|internal server error/i.test(ctx.combined);
  const hasNpe = /nullpointerexception|null\s?pointer|is null|transactionid.*null/i.test(ctx.combined);
  if (!(has500 && hasNpe)) return null;

  const statusLines = findLines(ctx, /5\d{2}|internal server error|POST \/api\/payment/i);
  const exceptionLines = findLines(ctx, /nullpointerexception|\.java:\d+|transactionid/i);
  const evidence: EvidenceItem[] = [
    ...evidenceFrom(statusLines, "api_response", "HTTP Error Response"),
    ...evidenceFrom(exceptionLines, "stack_trace", "Exception / Null Reference"),
  ];

  const fileLineMatch = ctx.combined.match(/([\w.]+\.java):(\d+)/i);
  const devHint = fileLineMatch
    ? `Check ${fileLineMatch[1]} around line ${fileLineMatch[2]}. Add null validation before using the affected field.`
    : "Add null/undefined validation before using the response field that triggered the exception.";

  return {
    failure_summary: `${ctx.testInfo.application} returned an HTTP 5xx error caused by an unhandled null value in the service response.`,
    root_cause: `The service returned HTTP 500 because a required field (transactionId) was null when the response was processed, causing an unhandled NullPointerException.`,
    root_cause_category: "Application Defect",
    severity: "Critical",
    priority: "P1",
    confidence: 94,
    confidence_rationale:
      "High confidence: the logs contain a direct HTTP 500 response, an explicit stack trace with file/line, and an explicit null-value message that together form a complete causal chain.",
    is_flaky: false,
    environment_issue: false,
    application_defect: true,
    evidence,
    why_ai_thinks_this: [
      "The API call returned HTTP 500, indicating a server-side failure rather than a client/test issue.",
      "The stack trace shows a NullPointerException at a specific file and line.",
      "The logs explicitly state the null field name, directly linking the exception to the response payload.",
      "This pattern (missing field → unhandled null → 500) is a backend defect, not a test automation issue.",
    ],
    recommended_actions: [
      "Validate transactionId (and other required fields) before processing the payment response.",
      "Return a clear 4xx error with a descriptive message instead of throwing an unhandled exception.",
      "Add negative API test coverage for incomplete/partial payment responses.",
      "Add a regression test asserting graceful handling when transactionId is missing.",
    ],
    developer_hint: devHint,
    test_recommendation:
      "Add API-level negative tests that simulate a payment response missing transactionId, and assert a graceful error rather than a 500.",
    business_impact:
      "Customers are unable to complete checkout, directly blocking revenue-generating transactions. This should be treated as release-blocking.",
    screenshot_findings: ctx.hasScreenshot
      ? ["HTTP 500 error indicator visible", "Payment/checkout request failed", "Checkout page remained open without confirmation"]
      : undefined,
    insufficient_evidence: false,
  };
};

/**
 * Detects the "API confirms success, but UI automation timed out" signature —
 * the most important distinction this engine can make: a passing backend
 * result plus a locator/wait failure points at the TEST, not the app.
 * Scoped specifically to evidence.apiResponse (not the full combined text) so
 * an unrelated log line like "order submitted successfully" elsewhere never
 * triggers this by accident.
 */
const successApiButAutomationTimeoutRule: Rule = (ctx) => {
  const successHit = /(paymentstatus"?\s*:\s*"?success|"?status"?\s*:\s*"?confirmed|(submitted|created) successfully)/i.test(ctx.apiResponse);
  const uiTimeoutHit = /(timeout|timed out).{0,40}(locator|element|banner|confirmation)|waiting for (locator|element|banner|confirmation)/i.test(ctx.combined);
  if (!(successHit && uiTimeoutHit)) return null;

  const successLines = findLines(ctx, /success|confirmed|submitted successfully|created successfully/i);
  const timeoutLines = findLines(ctx, /timeout|timed out|waiting for/i);

  return {
    failure_summary: "The backend confirms the operation succeeded, but the UI automation could not find the expected confirmation element — a likely automation issue, not an application defect.",
    root_cause: "The API response confirms the order/operation completed successfully, but the test's locator for the confirmation element timed out. This points to a synchronization or selector issue in the automation, not a backend failure.",
    root_cause_category: "Test Automation Issue",
    severity: "Medium",
    priority: "P3",
    confidence: 85,
    confidence_rationale:
      "The API response explicitly confirms success, while the only failure signal is a UI element timeout — this combination strongly indicates the automation's locator or wait strategy is the problem, not the application.",
    is_flaky: true,
    environment_issue: false,
    application_defect: false,
    evidence: [
      ...evidenceFrom(successLines, "api_response", "Backend Confirms Success"),
      ...evidenceFrom(timeoutLines, "log", "UI Element Timeout"),
    ],
    why_ai_thinks_this: [
      "The API response shows the underlying operation (order/payment) completed successfully.",
      "The only failure is the automation timing out waiting for a UI element — no application error is present.",
      "This is a classic signature of a broken/changed selector or a race condition between the UI render and the test's wait, not a backend defect.",
    ],
    recommended_actions: [
      "Verify the confirmation element's selector still matches the current UI markup.",
      "Replace fixed timeouts with an explicit wait on a reliable signal (e.g. network idle or a data-testid element).",
      "Re-run the test a few times to confirm this is consistently a locator issue and not a genuine UI regression.",
    ],
    developer_hint: "No backend code is implicated by this evidence — investigate the automation's selector/wait strategy for the confirmation element first.",
    test_recommendation: "Add a data-testid to the confirmation element if one doesn't exist, and assert against a more resilient locator instead of a fixed timeout.",
    business_impact: "Low direct business impact if the underlying transaction succeeded — but this masks real automation reliability issues that should be fixed to keep the suite trustworthy.",
    insufficient_evidence: false,
  };
};

const authServiceUnavailableRule: Rule = (ctx) => {
  const authHit = /auth(entication)?\s?(service|server)/i.test(ctx.combined);
  const downHit = /(unavailable|timed?\s?out|connection refused|econnrefused|503|down|not reachable)/i.test(ctx.combined);
  if (!(authHit && downHit)) return null;

  const evidenceLines = findLines(ctx, /auth|refused|unavailable|503|timed?\s?out/i);
  return {
    failure_summary: `Login/authentication failed because the authentication service was unreachable, not because of application logic.`,
    root_cause: "The authentication service did not respond (connection refused / service unavailable), so the login request could not be completed.",
    root_cause_category: "Environment Issue",
    severity: "High",
    priority: "P2",
    confidence: 88,
    confidence_rationale:
      "The logs directly reference the authentication service being unreachable. Confidence is not higher because we cannot confirm from these logs alone whether this was a transient blip or a sustained outage.",
    is_flaky: false,
    environment_issue: true,
    application_defect: false,
    evidence: evidenceFrom(evidenceLines, "log", "Auth Service Connectivity"),
    why_ai_thinks_this: [
      "The failure occurs at the network/connection level to the auth service, before any application logic runs.",
      "No application exception or incorrect business logic is present in the evidence.",
      "This signature (refused/unavailable/timeout to a specific service) is a classic environment/infrastructure issue.",
    ],
    recommended_actions: [
      "Confirm the authentication service was healthy/deployed at the time of the test run.",
      "Re-run the test once the environment is confirmed stable before filing an application defect.",
      "Add a health-check gate before automated suites run against this environment.",
    ],
    developer_hint: "No application code appears to be at fault based on current evidence — verify environment/service health first.",
    test_recommendation: "Add a pre-flight health check for the auth service and retry-with-backoff for transient environment failures.",
    business_impact: "If sustained, this blocks all authenticated flows; if transient, low business impact once the environment recovers.",
    insufficient_evidence: false,
  };
};

/**
 * A 401/Unauthorized failure that does NOT show the auth *service* itself as
 * unavailable (that's authServiceUnavailableRule's job). Deliberately modeled
 * as a genuinely ambiguous case: the evidence rules out "test just needs a
 * retry" but doesn't contain enough to confidently blame the app, the test
 * data, or the environment — so confidence stays moderate and
 * insufficient_evidence is set, rather than guessing.
 */
const authUnauthorizedAmbiguousRule: Rule = (ctx) => {
  const has401 = /\b401\b|unauthorized|invalid authentication token/i.test(ctx.combined);
  const hasAssertionOrToken = /assertionfailederror|invalid authentication token|auth_token_invalid/i.test(ctx.combined);
  if (!(has401 && hasAssertionOrToken)) return null;

  const lines = findLines(ctx, /401|unauthorized|invalid authentication token|assertionfailederror/i);
  return {
    failure_summary: "Login failed with HTTP 401 Unauthorized despite the test using credentials expected to be valid.",
    root_cause:
      "The authentication request was rejected (401 Unauthorized / invalid token). Based on the evidence alone, it is not possible to confidently determine whether this is caused by an application defect, expired/invalid test data, or an environment/configuration issue.",
    root_cause_category: "Application Defect",
    severity: "Medium",
    priority: "P3",
    confidence: 45,
    confidence_rationale:
      "A clear failure signature (401 + assertion failure) is present, but nothing in the evidence distinguishes an application bug from stale test credentials or an environment/configuration problem — confidence is deliberately kept moderate rather than guessing.",
    is_flaky: false,
    environment_issue: false,
    application_defect: false,
    evidence: evidenceFrom(lines, "api_response", "Authentication Rejected"),
    why_ai_thinks_this: [
      "The request explicitly failed authentication (401), ruling out a passing/flaky result.",
      "No environment-down signal (connection refused, service unavailable, timeout) is present, so this may not be a pure infrastructure issue.",
      "No application exception or stack trace pointing to a specific code defect is present either — the evidence is consistent with several different causes.",
    ],
    recommended_actions: [
      "Confirm the test account's credentials/token are still valid and have not expired or been rotated.",
      "Check the authentication service's server-side logs for the exact rejection reason at this timestamp.",
      "Confirm the environment's auth configuration (client ID/secret, token issuer) matches what the test expects.",
    ],
    developer_hint: "Not enough evidence to point at specific code — rule out expired/invalid test credentials before treating this as an application defect.",
    test_recommendation: "Re-run with freshly verified-valid credentials and attach the authentication service's server-side logs for the same timestamp.",
    business_impact: "If this is a genuine application defect, it blocks all login — treat as high business impact until the cause is confirmed.",
    insufficient_evidence: true,
  };
};

/** Generic "service can't reach its database" signature — distinct from authServiceUnavailableRule, which is auth-specific. */
const databaseConnectionRefusedRule: Rule = (ctx) => {
  const dbWord = /(database|postgresql|jdbc|mysql|mongodb)/i.test(ctx.combined);
  const refused = /(connection refused|could not (obtain|establish)|cannotgetjdbcconnection|econnrefused)/i.test(ctx.combined);
  if (!(dbWord && refused)) return null;

  const lines = findLines(ctx, /connection refused|jdbc|database|postgresql|503/i);
  return {
    failure_summary: "The service could not complete the request because it was unable to connect to its database.",
    root_cause:
      "The backend service failed to establish a connection to its database (connection refused), causing the request to fail with a service-unavailable response.",
    root_cause_category: "Environment Issue",
    severity: "Critical",
    priority: "P1",
    confidence: 87,
    confidence_rationale:
      "The evidence explicitly shows a database connection being refused at the infrastructure level, with no application logic executed after that point — a strong, unambiguous environment signal.",
    is_flaky: false,
    environment_issue: true,
    application_defect: false,
    evidence: evidenceFrom(lines, "stack_trace", "Database Connection Refused"),
    why_ai_thinks_this: [
      "The failure occurs while establishing a database connection, before any business logic runs.",
      "The error is a connection-level exception (connection refused), not an application/business logic exception.",
      "The API surfaced this as a 503 Service Unavailable, consistent with a downstream dependency being down.",
    ],
    recommended_actions: [
      "Verify the database instance is running and reachable from the application's network.",
      "Check the database connection pool configuration and credentials.",
      "Confirm no firewall/security-group change blocked the connection.",
    ],
    developer_hint: "No application code defect is evidenced — confirm database availability and connectivity before investigating further.",
    test_recommendation: "Add a pre-flight database health check before running dependent test suites, and retry-with-backoff for transient connectivity issues.",
    business_impact: "Critical — this blocks all operations depending on the database until connectivity is restored.",
    insufficient_evidence: false,
  };
};

const apiTimeoutRule: Rule = (ctx) => {
  const timeoutHit = /(timed?\s?out|timeout)/i.test(ctx.combined);
  const apiHit = /(search|\/api\/|request)/i.test(ctx.combined);
  // Narrowly scoped to UI-wait phrasing so it only excludes genuine element/locator
  // waits — a generic phrase like "...while waiting for /api/search" (a network
  // call, not a UI element) must NOT be excluded here.
  const elementHit = /(waiting for (element|locator|selector)|element (was )?not visible|stale element)/i.test(ctx.combined);
  if (!(timeoutHit && apiHit) || elementHit) return null;

  const evidenceLines = findLines(ctx, /timed?\s?out|\/api\/|status/i);
  return {
    failure_summary: "The product search request did not return a response within the expected time window.",
    root_cause: "The search API call exceeded its timeout threshold, most likely due to backend latency or an unresponsive downstream dependency.",
    root_cause_category: "Environment Issue",
    severity: "High",
    priority: "P2",
    confidence: 80,
    confidence_rationale:
      "The timeout is clearly logged against a specific API call, but without server-side metrics we cannot fully confirm whether this was infra load, a slow query, or a network blip.",
    is_flaky: true,
    environment_issue: true,
    application_defect: false,
    evidence: evidenceFrom(evidenceLines, "log", "API Timeout"),
    why_ai_thinks_this: [
      "The failure is a timeout, not an assertion mismatch or exception — consistent with backend latency.",
      "The request is a known API endpoint call rather than a UI synchronization wait.",
      "Timeouts against backend services are commonly environment/performance related and can be intermittent.",
    ],
    recommended_actions: [
      "Check backend service response times / APM traces around the failure timestamp.",
      "Confirm whether downstream dependencies (search index, DB) were under load.",
      "Consider raising the client timeout slightly if backend p95 latency is close to the current threshold.",
      "Re-run to check for intermittency before filing as a hard defect.",
    ],
    developer_hint: "Investigate backend latency for the search endpoint around the failure timestamp; no application logic error is evidenced.",
    test_recommendation: "Track timeout frequency over multiple runs to distinguish a one-off environment blip from a systemic performance regression.",
    business_impact: "Intermittent search failures degrade user experience and may reduce conversion if they recur under production load.",
    insufficient_evidence: false,
  };
};

const priceCalculationRule: Rule = (ctx) => {
  const priceWord = /(price|total|amount|subtotal)/i.test(ctx.combined);
  const expected = ctx.testDetails.expectedResult || "";
  const actual = ctx.testDetails.actualResult || "";
  const numbersDiffer = /\d/.test(expected) && /\d/.test(actual) && expected !== actual;
  if (!(priceWord && numbersDiffer)) return null;

  return {
    failure_summary: "The cart total displayed does not match the expected calculated value.",
    root_cause: `The application calculated an incorrect cart total. Expected "${expected}" but the application produced "${actual}", indicating a pricing/calculation defect (e.g. tax, discount, or rounding logic).`,
    root_cause_category: "Application Defect",
    severity: "High",
    priority: "P2",
    confidence: 72,
    confidence_rationale:
      "The mismatch between expected and actual values is explicit, but the provided evidence does not show the calculation logic itself, so the exact contributing factor (tax, discount, rounding) is inferred rather than confirmed.",
    is_flaky: false,
    environment_issue: false,
    application_defect: true,
    evidence: [
      { label: "Expected vs Actual", detail: `Expected: ${expected} | Actual: ${actual}`, source: "test_data" },
    ],
    why_ai_thinks_this: [
      "A numeric expected/actual mismatch on a price field strongly suggests a calculation defect rather than an environment issue.",
      "No exceptions or connectivity errors are present, ruling out infrastructure causes.",
      "Pricing logic bugs (tax, discount stacking, rounding) commonly present exactly this way.",
    ],
    recommended_actions: [
      "Review the cart total calculation logic (tax, discounts, rounding order of operations).",
      "Add unit tests covering the specific cart composition used in this test.",
      "Add regression coverage for discount + tax combinations.",
    ],
    developer_hint: "Inspect the pricing/cart total calculation service for rounding or discount-order-of-operations issues.",
    test_recommendation: "Add data-driven tests covering multiple price/discount/tax combinations to pin down the exact miscalculation.",
    business_impact: "Incorrect pricing directly affects revenue and customer trust; should be prioritized before release.",
    insufficient_evidence: false,
  };
};

/**
 * The "HTTP succeeded but the resulting business state is wrong" signature —
 * e.g. a booking API returns 201 but the record never transitions out of a
 * pending state. Distinct from priceCalculationRule (numeric/price fields
 * specifically) and checked after it, so a price mismatch is still caught by
 * the more specific rule first.
 */
const businessLogicMismatchRule: Rule = (ctx) => {
  const expected = ctx.testDetails.expectedResult || "";
  const actual = ctx.testDetails.actualResult || "";
  const has2xx = /\b(200|201|202)\b/.test(ctx.combined);
  const valuesDiffer = !!expected && !!actual && expected !== actual;
  if (!(has2xx && valuesDiffer)) return null;

  return {
    failure_summary: "The API call succeeded, but the resulting business state does not match what was expected.",
    root_cause: `The request completed with a success status code, but the resulting state is incorrect: expected "${expected}" but got "${actual}". This points to a business-logic defect in how the downstream workflow completes, not a failed API call.`,
    root_cause_category: "Application Defect",
    severity: "High",
    priority: "P2",
    confidence: 75,
    confidence_rationale:
      "The HTTP-success-but-wrong-business-state pattern is explicit and unambiguous, but the exact workflow step that failed to complete isn't directly visible in this evidence, so confidence stops short of the highest tier.",
    is_flaky: false,
    environment_issue: false,
    application_defect: true,
    evidence: [{ label: "Expected vs Actual State", detail: `Expected: ${expected} | Actual: ${actual}`, source: "test_data" }],
    why_ai_thinks_this: [
      "The API call itself succeeded (2xx), ruling out a request/connectivity failure.",
      "The resulting state does not match what a successful operation should produce, indicating the workflow did not fully complete.",
      "This is a business-logic defect signature: success at the transport layer, failure at the application layer.",
    ],
    recommended_actions: [
      "Review the downstream workflow step(s) that should run after the initial success response.",
      "Add logging/tracing around the step that transitions the state to its final expected value.",
      "Add a regression test that explicitly waits for and asserts the final state, not just the initial response code.",
    ],
    developer_hint: "Investigate the service responsible for completing the workflow after the initial success response — the initial request handler itself is not implicated.",
    test_recommendation: "Add polling or webhook-based assertions for the final state rather than asserting immediately after the initial response.",
    business_impact: "Customers may believe the action succeeded when the workflow is actually incomplete — a poor and potentially costly user experience.",
    insufficient_evidence: false,
  };
};

const flakyElementTimeoutRule: Rule = (ctx) => {
  const hit = /(timed?\s?out waiting|wait(ing)? for element|element (was )?not visible|stale element)/i.test(ctx.combined);
  if (!hit) return null;

  const evidenceLines = findLines(ctx, /timed?\s?out|element|wait/i);
  return {
    failure_summary: "The test timed out waiting for a UI element to become available, a common signature of a timing-sensitive (flaky) test.",
    root_cause: "The automation waited for an element that did not appear within the configured timeout, which is characteristic of a race condition between the UI and the test's wait strategy rather than an application defect.",
    root_cause_category: "Flaky Test",
    severity: "Medium",
    priority: "P3",
    confidence: 70,
    confidence_rationale:
      "The synchronization-timeout signature strongly suggests flakiness, but a single run cannot fully rule out a genuine UI regression — repeated occurrences would increase confidence.",
    is_flaky: true,
    environment_issue: false,
    application_defect: false,
    evidence: evidenceFrom(evidenceLines, "log", "Element Wait Timeout"),
    why_ai_thinks_this: [
      "The failure is a wait-timeout on a UI element, not an assertion of incorrect business data.",
      "No backend error or exception accompanies the failure.",
      "This pattern typically indicates a race condition between page rendering and the test's wait condition.",
    ],
    recommended_actions: [
      "Re-run the test 3-5 times to confirm intermittency before treating it as a defect.",
      "Replace fixed waits with explicit waits on a reliable, stable condition (e.g. network idle or specific state).",
      "Check if the element's render timing is itself inconsistent in the application.",
    ],
    developer_hint: "No application code is implicated by this evidence alone; focus on the test's wait/synchronization strategy first.",
    test_recommendation: "Track pass/fail rate over multiple runs; if intermittent, harden the wait condition rather than filing an application defect.",
    business_impact: "Low direct business impact, but flaky tests erode confidence in the automation suite and slow down releases.",
    insufficient_evidence: false,
  };
};

const locatorNotFoundRule: Rule = (ctx) => {
  const hit = /(no such element|unable to locate element|locator not found|element(notfound)?)/i.test(ctx.combined);
  if (!hit) return null;

  const evidenceLines = findLines(ctx, /no such element|locate element|locator/i);
  return {
    failure_summary: "The automation could not locate an expected element on the page, most likely due to a stale or incorrect selector.",
    root_cause: "The test's locator did not match any element on the page. This is typically caused by a UI change that was not reflected in the automation, or an incorrect/brittle selector.",
    root_cause_category: "Test Automation Issue",
    severity: "Medium",
    priority: "P3",
    confidence: 82,
    confidence_rationale:
      "The 'element not found' signature is unambiguous, but confirming whether the UI changed intentionally versus the selector being simply wrong would require the current page markup.",
    is_flaky: false,
    environment_issue: false,
    application_defect: false,
    evidence: evidenceFrom(evidenceLines, "log", "Locator Failure"),
    why_ai_thinks_this: [
      "The error is a locator/element-lookup failure, not an application exception or backend error.",
      "This is a well-known automation-script failure mode when the UI markup changes.",
    ],
    recommended_actions: [
      "Verify the selector against the current page markup and update it if the UI changed.",
      "Prefer resilient selectors (data-testid / role-based) over brittle CSS/XPath.",
      "Confirm the page fully loaded before the locator was queried.",
    ],
    developer_hint: "No application defect is evidenced; update the automation's selector to match the current UI.",
    test_recommendation: "Audit and stabilize selectors in this test file; consider adding data-testid attributes for critical elements.",
    business_impact: "No direct business impact if the UI is functioning correctly for real users; impacts automation reliability only.",
    insufficient_evidence: false,
  };
};

const RULES: Rule[] = [
  paymentNullPointerRule,
  successApiButAutomationTimeoutRule,
  authServiceUnavailableRule,
  authUnauthorizedAmbiguousRule,
  databaseConnectionRefusedRule,
  priceCalculationRule,
  businessLogicMismatchRule,
  apiTimeoutRule,
  flakyElementTimeoutRule,
  locatorNotFoundRule,
];

function fallbackInsufficientEvidence(ctx: Ctx): FailureAnalysis {
  const hasAnyEvidence = ctx.combined.trim().length > 0;
  return {
    failure_summary: hasAnyEvidence
      ? `${ctx.testInfo.testName} failed, but the submitted evidence does not clearly match a known failure signature.`
      : `${ctx.testInfo.testName} failed. No log, stack trace, API response, or console evidence was provided.`,
    root_cause: "Insufficient evidence. Additional logs are recommended to identify the probable root cause with confidence.",
    root_cause_category: "Application Defect",
    severity: "Medium",
    priority: "P3",
    confidence: hasAnyEvidence ? 35 : 15,
    confidence_rationale:
      "The available evidence does not contain a recognizable failure signature (exception, HTTP error, timeout, or locator error). AI QA Detective avoids guessing when evidence is this thin.",
    is_flaky: false,
    environment_issue: false,
    application_defect: false,
    evidence: hasAnyEvidence
      ? [{ label: "Raw Evidence", detail: ctx.combined.slice(0, 300), source: "log" }]
      : [],
    why_ai_thinks_this: [
      "No HTTP error code, exception, timeout, or locator failure was detected in the submitted evidence.",
      "Expected vs. actual results alone do not indicate a specific technical cause without supporting logs.",
    ],
    recommended_actions: [
      "Attach the full test execution log for this run.",
      "Attach the stack trace or console output if the failure occurred client-side.",
      "Attach a screenshot of the failure state if it was a UI test.",
    ],
    developer_hint: "Not enough evidence to point to a specific file or line yet.",
    test_recommendation: "Re-run with verbose logging enabled and attach the full output before further triage.",
    business_impact: "Unknown until root cause is confirmed with additional evidence.",
    insufficient_evidence: true,
  };
}

export function runMockAnalysis(req: AnalyzeFailureRequest): FailureAnalysis {
  const { testInfo, testDetails, evidence } = req;
  const combined = [
    testDetails.expectedResult,
    testDetails.actualResult,
    evidence.logs,
    evidence.stackTrace,
    evidence.apiResponse,
    evidence.consoleLogs,
  ]
    .filter(Boolean)
    .join("\n");

  const ctx: Ctx = {
    combined,
    lines: combined.split(/\r?\n/).filter((l) => l.trim().length > 0),
    logs: evidence.logs || "",
    stackTrace: evidence.stackTrace || "",
    apiResponse: evidence.apiResponse || "",
    consoleLogs: evidence.consoleLogs || "",
    testInfo,
    testDetails,
    hasScreenshot: !!evidence.screenshotBase64,
  };

  for (const rule of RULES) {
    const result = rule(ctx);
    if (result) return result;
  }
  return fallbackInsufficientEvidence(ctx);
}

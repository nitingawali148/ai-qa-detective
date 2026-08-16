import type { AnalyzeResponse, DashboardData, Defect } from "../types";

export const HEALTH_MOCK = { status: "ok", aiProvider: "mock", visionSupported: false };

export const DASHBOARD_MOCK: DashboardData = {
  testsAnalyzed: 150,
  passedTests: 138,
  failedTests: 12,
  criticalFailures: 3,
  environmentIssues: 4,
  applicationDefects: 5,
  flakyTests: 3,
  avgConfidence: 82,
  failureDistribution: [
    { category: "Application Defect", count: 5 },
    { category: "Environment Issue", count: 4 },
    { category: "Flaky Test", count: 3 },
  ],
  releaseRisk: { risk_score: 82, risk_level: "High", recommendation: "NO-GO", explanation: "Critical payment failure.", top_risks: [] },
  recentInvestigations: [],
  aiProvider: "mock",
};

export const DEMO_SCENARIO_MOCK = {
  scenario: {
    testInfo: {
      testName: "Verify successful checkout using credit card",
      testId: "TC-CHECKOUT-014",
      application: "ShopSphere E-Commerce",
      environment: "QA",
      browser: "Chrome",
      buildVersion: "2026.08.16.142",
      executionTime: "2026-08-16T00:00:00.000Z",
    },
    testDetails: {
      description: "Checkout with credit card.",
      steps: "1. Add to cart\n2. Pay",
      expectedResult: "Payment should complete successfully.",
      actualResult: "Checkout failed with HTTP 500.",
    },
    evidence: {
      logs: "[ERROR] transactionId is null",
      stackTrace: "NullPointerException at PaymentService.java:142",
      apiResponse: "500 Internal Server Error",
      consoleLogs: "",
    },
  },
};

export const ANALYZE_RESPONSE_MOCK: AnalyzeResponse = {
  failureId: "abc123",
  provider: "mock",
  screenshotAnalysisAvailable: false,
  similar: null,
  analysis: {
    failure_summary: "Checkout failed with HTTP 500.",
    root_cause: "PaymentService threw a NullPointerException because transactionId was null.",
    root_cause_category: "Application Defect",
    severity: "Critical",
    priority: "P1",
    confidence: 94,
    confidence_rationale: "Strong evidence chain: HTTP 500, stack trace, and explicit null field.",
    is_flaky: false,
    environment_issue: false,
    application_defect: true,
    evidence: [{ label: "HTTP Error", detail: "500 Internal Server Error", source: "api_response" }],
    why_ai_thinks_this: ["HTTP 500 indicates a server-side failure.", "Stack trace shows a NullPointerException."],
    recommended_actions: ["Validate transactionId before use.", "Add negative API test coverage."],
    developer_hint: "Check PaymentService.java line 142.",
    test_recommendation: "Add negative tests for missing transactionId.",
    business_impact: "Blocks checkout revenue.",
    insufficient_evidence: false,
  },
};

export const DEFECT_MOCK: Defect = {
  title: "Checkout fails with HTTP 500 when transaction ID is missing",
  description: "PaymentService throws a NullPointerException when transactionId is missing from the payment response.",
  environment: "QA / Chrome / 2026.08.16.142",
  preconditions: "Cart contains at least one item.",
  steps_to_reproduce: ["Add product to cart", "Proceed to checkout", "Select CREDIT_CARD", "Submit payment"],
  expected_result: "Payment should complete successfully.",
  actual_result: "Checkout failed with HTTP 500.",
  root_cause: "PaymentService threw a NullPointerException because transactionId was null.",
  severity: "Critical",
  priority: "P1",
  business_impact: "Blocks checkout revenue.",
  evidence: ["500 Internal Server Error", "NullPointerException at PaymentService.java:142"],
  suggested_fix: "Validate transactionId before use.",
  regression_recommendation: "Add negative API coverage for incomplete payment responses.",
};

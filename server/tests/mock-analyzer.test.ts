import { describe, it, expect } from "vitest";
import { runMockAnalysis } from "../src/ai/mock-analyzer.js";
import { sampleScenarios, SAMPLE_SCENARIO_CATEGORY } from "../src/data/sampleFailures.js";

// Locks in the classification for every "Load Sample" scenario — both the
// original ShopSphere set and the cross-industry set added later — so a
// future rule-ordering change can't silently regress one of them.
describe("mock rule engine — all sample scenarios classify as intended", () => {
  it("payment: HTTP 500 + NullPointerException -> Application Defect / Critical / P1", () => {
    const r = runMockAnalysis(sampleScenarios.payment);
    expect(r.root_cause_category).toBe("Application Defect");
    expect(r.severity).toBe("Critical");
    expect(r.priority).toBe("P1");
    expect(r.confidence).toBeGreaterThanOrEqual(90);
  });

  it("login: auth service unreachable -> Environment Issue", () => {
    const r = runMockAnalysis(sampleScenarios.login);
    expect(r.root_cause_category).toBe("Environment Issue");
    expect(r.environment_issue).toBe(true);
  });

  it("productSearch: API timeout (not a UI element wait) -> Environment Issue, not insufficient evidence", () => {
    // Regression test for a bug where the generic "waiting for /api/search" phrase
    // was mistaken for a UI element wait, incorrectly excluding this from apiTimeoutRule.
    const r = runMockAnalysis(sampleScenarios.productSearch);
    expect(r.root_cause_category).toBe("Environment Issue");
    expect(r.insufficient_evidence).toBe(false);
  });

  it("cart: price mismatch -> Application Defect (pricing)", () => {
    const r = runMockAnalysis(sampleScenarios.cart);
    expect(r.root_cause_category).toBe("Application Defect");
    expect(r.application_defect).toBe(true);
  });

  it("flaky: element wait timeout with no API evidence -> Flaky Test (not Test Automation Issue)", () => {
    const r = runMockAnalysis(sampleScenarios.flaky);
    expect(r.root_cause_category).toBe("Flaky Test");
    expect(r.is_flaky).toBe(true);
  });

  it("automation: locator not found -> Test Automation Issue", () => {
    const r = runMockAnalysis(sampleScenarios.automation);
    expect(r.root_cause_category).toBe("Test Automation Issue");
  });

  it("bankingLoginFailure: 401 with no service-down or code-defect signal -> ambiguous, low-moderate confidence", () => {
    const r = runMockAnalysis(sampleScenarios.bankingLoginFailure);
    expect(r.insufficient_evidence).toBe(true);
    expect(r.confidence).toBeLessThan(60);
  });

  it("warehouseInventoryTimeout: SocketTimeoutException + 504 -> Environment Issue", () => {
    const r = runMockAnalysis(sampleScenarios.warehouseInventoryTimeout);
    expect(r.root_cause_category).toBe("Environment Issue");
  });

  it("rideBookingLogicFailure: HTTP 201 but wrong business state -> Application Defect, not Environment/Automation", () => {
    const r = runMockAnalysis(sampleScenarios.rideBookingLogicFailure);
    expect(r.root_cause_category).toBe("Application Defect");
    expect(r.application_defect).toBe(true);
  });

  it("healthcareDatabaseFailure: JDBC connection refused -> Environment Issue, Critical", () => {
    const r = runMockAnalysis(sampleScenarios.healthcareDatabaseFailure);
    expect(r.root_cause_category).toBe("Environment Issue");
    expect(r.severity).toBe("Critical");
  });

  it("playwrightAutomationFailure: API confirms success but UI locator times out -> Test Automation Issue, NOT Application Defect", () => {
    // The star scenario: proves the engine distinguishes a passing backend
    // result plus a broken locator from an actual application defect.
    const r = runMockAnalysis(sampleScenarios.playwrightAutomationFailure);
    expect(r.root_cause_category).toBe("Test Automation Issue");
    expect(r.application_defect).toBe(false);
    expect(r.confidence).toBeGreaterThanOrEqual(80);
  });
});

describe("SAMPLE_SCENARIO_CATEGORY stays in sync with the real engine", () => {
  // Powers the "Filter by Category" picker on Analyze Failure. If a rule change
  // ever shifts a sample scenario's classification, this fails loudly instead
  // of letting the filter silently lie about what a scenario will produce.
  for (const [key, expectedCategory] of Object.entries(SAMPLE_SCENARIO_CATEGORY)) {
    it(`${key} -> ${expectedCategory}`, () => {
      const scenario = sampleScenarios[key];
      expect(scenario, `sampleScenarios is missing a "${key}" entry`).toBeTruthy();
      const result = runMockAnalysis(scenario);
      expect(result.root_cause_category).toBe(expectedCategory);
    });
  }

  it("covers every entry in sampleScenarios (no scenario missing a category tag)", () => {
    expect(Object.keys(SAMPLE_SCENARIO_CATEGORY).sort()).toEqual(Object.keys(sampleScenarios).sort());
  });
});

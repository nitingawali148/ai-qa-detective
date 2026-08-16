import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { demoScenario } from "../src/data/sampleFailures.js";

const app = createApp();

describe("POST /api/defect", () => {
  it("generates a Jira-ready defect from a completed analysis", async () => {
    const analyzeRes = await request(app).post("/api/analyze").send(demoScenario);
    const defectRes = await request(app)
      .post("/api/defect")
      .send({ testInfo: demoScenario.testInfo, testDetails: demoScenario.testDetails, evidence: demoScenario.evidence, analysis: analyzeRes.body.analysis });

    expect(defectRes.status).toBe(200);
    const { defect } = defectRes.body;
    expect(defect.title).toBeTruthy();
    expect(defect.severity).toBe("Critical");
    expect(defect.priority).toBe("P1");
    expect(Array.isArray(defect.steps_to_reproduce)).toBe(true);
    expect(defect.root_cause).toContain("transactionId");
  });

  it("rejects an invalid defect request with 400", async () => {
    const res = await request(app).post("/api/defect").send({ testInfo: {} });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/tests/generate", () => {
  it("generates regression test scenarios from an analysis", async () => {
    const analyzeRes = await request(app).post("/api/analyze").send(demoScenario);
    const res = await request(app)
      .post("/api/tests/generate")
      .send({ testInfo: demoScenario.testInfo, testDetails: demoScenario.testDetails, analysis: analyzeRes.body.analysis });

    expect(res.status).toBe(200);
    expect(res.body.tests.length).toBeGreaterThanOrEqual(4);
    expect(res.body.tests[0].id).toMatch(/^TC-\d+$/);
  });
});

describe("GET /api/risk", () => {
  it("returns a NO-GO recommendation given the seeded critical payment failure", async () => {
    const res = await request(app).get("/api/risk");
    expect(res.status).toBe(200);
    expect(res.body.recommendation).toBe("NO-GO");
    expect(res.body.risk_score).toBeGreaterThan(0);
    expect(Array.isArray(res.body.top_risks)).toBe(true);
  });
});

describe("GET /api/dashboard", () => {
  it("returns aggregate metrics", async () => {
    const res = await request(app).get("/api/dashboard");
    expect(res.status).toBe(200);
    expect(res.body.testsAnalyzed).toBeGreaterThan(0);
    expect(res.body.failedTests).toBeGreaterThan(0);
    expect(res.body.releaseRisk).toBeTruthy();
  });
});

describe("POST /api/jira/create", () => {
  it("simulates a Jira defect when no Jira settings are configured", async () => {
    const res = await request(app)
      .post("/api/jira/create")
      .send({
        defect: {
          title: "Test", description: "d", environment: "QA", preconditions: "p",
          steps_to_reproduce: ["a"], expected_result: "e", actual_result: "a", root_cause: "r",
          severity: "Critical", priority: "P1", business_impact: "b", evidence: ["e"],
          suggested_fix: "f", regression_recommendation: "rr",
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.mode).toBe("mock");
    expect(res.body.success).toBe(true);
    expect(res.body.key).toBeTruthy();
  });
});

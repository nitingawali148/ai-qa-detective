import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { demoScenario } from "../src/data/sampleFailures.js";

const app = createApp();

describe("POST /api/analyze", () => {
  it("analyzes the demo payment failure and returns a structured, evidence-based result", async () => {
    const res = await request(app).post("/api/analyze").send(demoScenario);

    expect(res.status).toBe(200);
    expect(res.body.analysis.root_cause_category).toBe("Application Defect");
    expect(res.body.analysis.severity).toBe("Critical");
    expect(res.body.analysis.priority).toBe("P1");
    expect(res.body.analysis.confidence).toBeGreaterThanOrEqual(85);
    expect(Array.isArray(res.body.analysis.evidence)).toBe(true);
    expect(res.body.analysis.evidence.length).toBeGreaterThan(0);
    expect(res.body.failureId).toBeTruthy();
    expect(res.body.provider).toBe("mock");
  });

  it("rejects a request missing required fields with 400", async () => {
    const res = await request(app).post("/api/analyze").send({ testInfo: { application: "X" } });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it("reports low confidence and insufficient_evidence when no evidence is provided", async () => {
    const res = await request(app)
      .post("/api/analyze")
      .send({
        testInfo: { testName: "Some test", application: "SomeApp" },
        testDetails: { expectedResult: "Should pass", actualResult: "Did not pass" },
        evidence: {},
      });

    expect(res.status).toBe(200);
    expect(res.body.analysis.insufficient_evidence).toBe(true);
    expect(res.body.analysis.confidence).toBeLessThan(50);
  });

  it("detects the flaky element-timeout signature", async () => {
    const res = await request(app)
      .post("/api/analyze")
      .send({
        testInfo: { testName: "Verify banner", application: "ShopSphere" },
        testDetails: { expectedResult: "Banner visible", actualResult: "Timed out" },
        evidence: { logs: "Timed out waiting for element '.banner' after 5000ms" },
      });

    expect(res.status).toBe(200);
    expect(res.body.analysis.root_cause_category).toBe("Flaky Test");
    expect(res.body.analysis.is_flaky).toBe(true);
  });
});

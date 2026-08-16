import { Router } from "express";
import { demoScenario, sampleScenarios } from "../data/sampleFailures.js";

export const demoRouter = Router();

demoRouter.get("/", (_req, res) => {
  res.json({ scenario: demoScenario });
});

demoRouter.get("/scenarios", (_req, res) => {
  res.json({
    scenarios: Object.entries(sampleScenarios).map(([key, scenario]) => ({
      key,
      label: scenario.testInfo.testName,
      application: scenario.testInfo.application,
      scenario,
    })),
  });
});

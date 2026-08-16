import { Router } from "express";
import { GenerateTestsRequestSchema, GeneratePlaywrightRequestSchema } from "../schemas/index.js";
import { validateBody } from "../utils/validate.js";
import { generateRegressionTests, generatePlaywrightTest } from "../ai/test-generator.js";
import { StructuredAIError } from "../ai/structured-response.js";
import { LLMError } from "../ai/llm-provider.js";

export const testGenRouter = Router();

testGenRouter.post("/generate", validateBody(GenerateTestsRequestSchema), async (req, res) => {
  try {
    const result = await generateRegressionTests(req.body);
    res.json(result);
  } catch (err) {
    if (err instanceof LLMError || err instanceof StructuredAIError) {
      res.status(502).json({ error: err.message });
      return;
    }
    console.error("[testgen] Unexpected error:", err);
    res.status(500).json({ error: "Regression test generation failed. Please try again." });
  }
});

testGenRouter.post("/playwright", validateBody(GeneratePlaywrightRequestSchema), async (req, res) => {
  try {
    const result = await generatePlaywrightTest(req.body.testInfo, req.body.test);
    res.json(result);
  } catch (err) {
    if (err instanceof LLMError) {
      res.status(502).json({ error: err.message });
      return;
    }
    console.error("[playwright] Unexpected error:", err);
    res.status(500).json({ error: "Playwright test generation failed. Please try again." });
  }
});

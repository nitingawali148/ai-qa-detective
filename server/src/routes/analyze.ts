import { Router } from "express";
import { AnalyzeFailureRequestSchema } from "../schemas/index.js";
import { validateBody } from "../utils/validate.js";
import { analyzeFailure } from "../ai/failure-analyzer.js";
import { historyStore } from "../store/historyStore.js";
import { findSimilarFailure } from "../ai/similarity.js";
import { StructuredAIError } from "../ai/structured-response.js";
import { LLMError } from "../ai/llm-provider.js";

export const analyzeRouter = Router();

analyzeRouter.post("/", validateBody(AnalyzeFailureRequestSchema), async (req, res) => {
  try {
    const existingHistory = historyStore.list();
    const { analysis, provider, screenshotAnalysisAvailable } = await analyzeFailure(req.body);

    const similar = findSimilarFailure(analysis, existingHistory);

    const record = historyStore.add({
      testInfo: req.body.testInfo,
      testDetails: req.body.testDetails,
      analysis,
    });

    res.json({
      failureId: record.id,
      analysis,
      provider,
      screenshotAnalysisAvailable,
      similar,
    });
  } catch (err) {
    if (err instanceof LLMError || err instanceof StructuredAIError) {
      res.status(502).json({ error: err.message });
      return;
    }
    console.error("[analyze] Unexpected error:", err);
    res.status(500).json({ error: "AI analysis could not be completed. Please verify the configured AI provider and try again." });
  }
});

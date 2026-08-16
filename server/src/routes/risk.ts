import { Router } from "express";
import { historyStore } from "../store/historyStore.js";
import { analyzeReleaseRisk } from "../ai/risk-analyzer.js";

export const riskRouter = Router();

riskRouter.get("/", async (_req, res) => {
  try {
    const risk = await analyzeReleaseRisk(historyStore.list());
    res.json(risk);
  } catch (err) {
    console.error("[risk] Unexpected error:", err);
    res.status(500).json({ error: "Release risk could not be calculated. Please try again." });
  }
});

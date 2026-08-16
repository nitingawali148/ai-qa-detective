import { Router } from "express";
import { CreateJiraDefectRequestSchema } from "../schemas/index.js";
import { validateBody } from "../utils/validate.js";
import { createJiraDefect } from "../jira/jiraClient.js";
import { historyStore } from "../store/historyStore.js";

export const jiraRouter = Router();

jiraRouter.post("/create", validateBody(CreateJiraDefectRequestSchema), async (req, res) => {
  const { defect, settings } = req.body;
  try {
    const result = await createJiraDefect(defect, settings);
    res.json(result);
  } catch (err) {
    console.error("[jira] Unexpected error:", err);
    res.status(500).json({ mode: settings?.jiraUrl ? "real" : "mock", success: false, error: "Failed to create Jira defect." });
  }
});

jiraRouter.post("/link/:failureId", (req, res) => {
  const { jiraKey } = req.body || {};
  if (typeof jiraKey !== "string" || !jiraKey) {
    res.status(400).json({ error: "jiraKey is required." });
    return;
  }
  const record = historyStore.setJiraKey(req.params.failureId, jiraKey);
  if (!record) {
    res.status(404).json({ error: "Failure record not found." });
    return;
  }
  res.json({ failure: record });
});

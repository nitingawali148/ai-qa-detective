import { Router } from "express";
import { z } from "zod";
import { historyStore } from "../store/historyStore.js";

export const historyRouter = Router();

historyRouter.get("/", (req, res) => {
  let results = historyStore.list();

  const { severity, category, application, environment, status } = req.query;
  if (typeof severity === "string" && severity) results = results.filter((f) => f.analysis.severity === severity);
  if (typeof category === "string" && category) results = results.filter((f) => f.analysis.root_cause_category === category);
  if (typeof application === "string" && application) results = results.filter((f) => f.testInfo.application === application);
  if (typeof environment === "string" && environment) results = results.filter((f) => f.testInfo.environment === environment);
  if (typeof status === "string" && status) results = results.filter((f) => f.status === status);

  res.json({ failures: results });
});

historyRouter.get("/:id", (req, res) => {
  const record = historyStore.get(req.params.id);
  if (!record) {
    res.status(404).json({ error: "Failure record not found." });
    return;
  }
  res.json({ failure: record });
});

const StatusSchema = z.object({ status: z.enum(["Open", "Investigating", "Resolved"]) });

historyRouter.patch("/:id/status", (req, res) => {
  const parsed = StatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid status." });
    return;
  }
  const record = historyStore.updateStatus(req.params.id, parsed.data.status);
  if (!record) {
    res.status(404).json({ error: "Failure record not found." });
    return;
  }
  res.json({ failure: record });
});

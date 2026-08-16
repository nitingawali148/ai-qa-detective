import express from "express";
import cors from "cors";
import { analyzeRouter } from "./routes/analyze.js";
import { defectRouter } from "./routes/defect.js";
import { testGenRouter } from "./routes/testgen.js";
import { riskRouter } from "./routes/risk.js";
import { historyRouter } from "./routes/history.js";
import { jiraRouter } from "./routes/jira.js";
import { chatRouter } from "./routes/chat.js";
import { demoRouter } from "./routes/demo.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { llmProvider } from "./ai/llm-provider.js";

export function createApp() {
  const app = express();

  app.use(cors());
  // Screenshots arrive as base64 JSON — raise the default body limit to accommodate them.
  app.use(express.json({ limit: "15mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", aiProvider: llmProvider.name, visionSupported: llmProvider.supportsVision });
  });

  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/analyze", analyzeRouter);
  app.use("/api/defect", defectRouter);
  app.use("/api/tests", testGenRouter);
  app.use("/api/risk", riskRouter);
  app.use("/api/history", historyRouter);
  app.use("/api/jira", jiraRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/demo", demoRouter);

  // Central fallback error handler — no unhandled crash should ever reach the client.
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[unhandled]", err);
    res.status(500).json({ error: "An unexpected server error occurred." });
  });

  return app;
}

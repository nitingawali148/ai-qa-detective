import { Router } from "express";
import { historyStore } from "../store/historyStore.js";
import { TOTAL_TESTS_ANALYZED } from "../data/sampleFailures.js";
import { analyzeReleaseRisk } from "../ai/risk-analyzer.js";
import { llmProvider } from "../ai/llm-provider.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", async (_req, res) => {
  const failures = historyStore.list();
  const critical = failures.filter((f) => f.analysis.severity === "Critical").length;
  const environmentIssues = failures.filter((f) => f.analysis.environment_issue).length;
  const applicationDefects = failures.filter((f) => f.analysis.application_defect).length;
  const flaky = failures.filter((f) => f.analysis.is_flaky).length;
  const avgConfidence = failures.length
    ? Math.round(failures.reduce((sum, f) => sum + f.analysis.confidence, 0) / failures.length)
    : 0;

  const risk = await analyzeReleaseRisk(failures).catch(() => null);

  const byCategory: Record<string, number> = {};
  for (const f of failures) {
    byCategory[f.analysis.root_cause_category] = (byCategory[f.analysis.root_cause_category] ?? 0) + 1;
  }

  res.json({
    testsAnalyzed: TOTAL_TESTS_ANALYZED,
    passedTests: TOTAL_TESTS_ANALYZED - failures.length,
    failedTests: failures.length,
    criticalFailures: critical,
    environmentIssues,
    applicationDefects,
    flakyTests: flaky,
    avgConfidence,
    failureDistribution: Object.entries(byCategory).map(([category, count]) => ({ category, count })),
    releaseRisk: risk,
    recentInvestigations: failures.slice(0, 6),
    aiProvider: llmProvider.name,
  });
});

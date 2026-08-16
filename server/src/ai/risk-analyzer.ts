import { llmProvider } from "./llm-provider.js";
import { getStructuredCompletion } from "./structured-response.js";
import { ReleaseRiskSchema, type ReleaseRisk } from "../schemas/index.js";
import { RISK_ANALYST_SYSTEM, buildRiskPrompt } from "./prompts.js";
import type { StoredFailure } from "../store/historyStore.js";

const SEVERITY_WEIGHT: Record<string, number> = { Critical: 26, High: 15, Medium: 7, Low: 3 };

function computeMockRisk(failures: StoredFailure[]): ReleaseRisk {
  const active = failures.filter((f) => f.status !== "Resolved");

  let score = 0;
  for (const f of active) {
    let weight = SEVERITY_WEIGHT[f.analysis.severity] ?? 5;
    if (f.analysis.application_defect) weight *= 1.15;
    if (f.analysis.is_flaky) weight *= 0.5;
    score += weight;
  }
  score = Math.max(0, Math.min(100, Math.round(score)));

  const risk_level: ReleaseRisk["risk_level"] = score >= 75 ? "Critical" : score >= 50 ? "High" : score >= 25 ? "Medium" : "Low";
  const hasCriticalOpen = active.some((f) => f.analysis.severity === "Critical");
  const recommendation: ReleaseRisk["recommendation"] =
    hasCriticalOpen || score >= 60 ? "NO-GO" : score >= 30 ? "GO_WITH_CAUTION" : "GO";

  const topRisks = [...active]
    .sort((a, b) => (SEVERITY_WEIGHT[b.analysis.severity] ?? 0) - (SEVERITY_WEIGHT[a.analysis.severity] ?? 0))
    .slice(0, 3)
    .map((f) => ({
      area: f.testInfo.application,
      severity: f.analysis.severity,
      reason: f.analysis.failure_summary,
    }));

  const criticalArea = topRisks.find((r) => r.severity === "Critical")?.area;
  const explanation = hasCriticalOpen
    ? `Release is currently not recommended because a critical issue is unresolved in ${criticalArea ?? "a core workflow"}.`
    : score >= 30
      ? "Release carries moderate risk due to open high-severity issues; proceed only with mitigation or a fix confirmation."
      : "No unresolved critical or high-severity issues are currently blocking release.";

  return { risk_score: score, risk_level, recommendation, explanation, top_risks: topRisks };
}

export async function analyzeReleaseRisk(failures: StoredFailure[]): Promise<ReleaseRisk> {
  if (llmProvider.name === "mock") {
    return computeMockRisk(failures);
  }

  const recent = failures
    .filter((f) => f.status !== "Resolved")
    .slice(0, 15)
    .map((f) => ({
      application: f.testInfo.application,
      category: f.analysis.root_cause_category,
      severity: f.analysis.severity,
      is_flaky: f.analysis.is_flaky,
      status: f.status,
      summary: f.analysis.failure_summary,
    }));

  if (recent.length === 0) {
    return { risk_score: 5, risk_level: "Low", recommendation: "GO", explanation: "No unresolved failures are on record.", top_risks: [] };
  }

  return getStructuredCompletion<ReleaseRisk>({
    system: RISK_ANALYST_SYSTEM,
    prompt: buildRiskPrompt(recent),
    schema: ReleaseRiskSchema,
    maxTokens: 1500,
  });
}

import { llmProvider } from "./llm-provider.js";
import { getStructuredCompletion } from "./structured-response.js";
import { DefectSchema, type Defect, type GenerateDefectRequest } from "../schemas/index.js";
import { DEFECT_WRITER_SYSTEM, buildDefectPrompt } from "./prompts.js";

function buildMockDefect(req: GenerateDefectRequest): Defect {
  const { testInfo, testDetails, analysis } = req;
  const title = analysis.failure_summary.toLowerCase().includes(testInfo.application.toLowerCase())
    ? analysis.failure_summary
    : `${testInfo.application}: ${analysis.failure_summary}`;

  return {
    title: title.slice(0, 140),
    description: `While running "${testInfo.testName}" against ${testInfo.application} (${testInfo.environment || "N/A"}, build ${
      testInfo.buildVersion || "N/A"
    }), the test failed. AI QA Detective's root cause analysis (confidence ${analysis.confidence}%) attributes this to: ${analysis.root_cause}`,
    environment: [testInfo.environment, testInfo.browser, testInfo.buildVersion].filter(Boolean).join(" / ") || "N/A",
    preconditions: testDetails.description || "See test description.",
    steps_to_reproduce: testDetails.steps
      ? testDetails.steps.split(/\r?\n/).filter(Boolean)
      : ["Execute the test as described in the test case.", "Observe the failure described in Actual Result."],
    expected_result: testDetails.expectedResult,
    actual_result: testDetails.actualResult,
    root_cause: analysis.root_cause,
    severity: analysis.severity,
    priority: analysis.priority,
    business_impact: analysis.business_impact,
    evidence: analysis.evidence.map((e) => `${e.label}: ${e.detail}`),
    suggested_fix: analysis.recommended_actions.join(" "),
    regression_recommendation: analysis.test_recommendation,
  };
}

export async function generateDefect(req: GenerateDefectRequest): Promise<Defect> {
  if (llmProvider.name === "mock") {
    return buildMockDefect(req);
  }

  return getStructuredCompletion<Defect>({
    system: DEFECT_WRITER_SYSTEM,
    prompt: buildDefectPrompt(req.testInfo, req.testDetails, req.evidence, req.analysis),
    schema: DefectSchema,
    maxTokens: 2000,
  });
}

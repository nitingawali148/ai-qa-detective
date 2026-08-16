import { llmProvider } from "./llm-provider.js";
import { getStructuredCompletion } from "./structured-response.js";
import { FailureAnalysisSchema, type AnalyzeFailureRequest, type FailureAnalysis } from "../schemas/index.js";
import { FAILURE_ANALYST_SYSTEM, buildFailureAnalysisPrompt } from "./prompts.js";
import { runMockAnalysis } from "./mock-analyzer.js";

export interface AnalyzeResult {
  analysis: FailureAnalysis;
  provider: string;
  screenshotAnalysisAvailable: boolean;
}

export async function analyzeFailure(req: AnalyzeFailureRequest): Promise<AnalyzeResult> {
  const screenshotProvided = !!req.evidence.screenshotBase64;
  const screenshotAnalysisAvailable = screenshotProvided && llmProvider.supportsVision && llmProvider.name !== "mock";

  if (llmProvider.name === "mock") {
    const analysis = runMockAnalysis(req);
    if (screenshotProvided) {
      // Be honest: the rule-based mock provider cannot see images.
      analysis.screenshot_findings = undefined;
    }
    return { analysis, provider: llmProvider.name, screenshotAnalysisAvailable: false };
  }

  const images =
    screenshotProvided && llmProvider.supportsVision
      ? [{ base64: req.evidence.screenshotBase64!, mimeType: req.evidence.screenshotMimeType || "image/png" }]
      : undefined;

  const analysis = await getStructuredCompletion<FailureAnalysis>({
    system: FAILURE_ANALYST_SYSTEM,
    prompt: buildFailureAnalysisPrompt(req),
    schema: FailureAnalysisSchema,
    images,
    maxTokens: 3000,
  });

  if (screenshotProvided && !llmProvider.supportsVision) {
    analysis.screenshot_findings = undefined;
  }

  return { analysis, provider: llmProvider.name, screenshotAnalysisAvailable };
}

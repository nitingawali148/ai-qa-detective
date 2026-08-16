import type { AnalyzeFailureRequest, FailureAnalysis, GenerateTestsRequest, RegressionTest } from "../schemas/index.js";

/**
 * All prompt text lives here so nothing is scattered across routes/UI.
 */

export const FAILURE_ANALYST_SYSTEM = `You are a Senior QA Engineer investigating a failed automated test.
You are careful, evidence-driven, and never invent facts that are not supported by the provided test evidence.
If the evidence is thin, you say so honestly and lower your confidence score instead of guessing.
You always distinguish between: (1) evidence you were given, (2) your inference from that evidence, and (3) your recommendation.
You respond with ONLY a single valid JSON object matching the requested schema — no markdown fences, no commentary before or after.`;

export function buildFailureAnalysisPrompt(req: AnalyzeFailureRequest): string {
  const { testInfo, testDetails, evidence } = req;
  return `Investigate this failed test and produce a structured root cause analysis.

TEST INFORMATION
Test Name: ${testInfo.testName}
Test ID: ${testInfo.testId || "N/A"}
Application: ${testInfo.application}
Environment: ${testInfo.environment || "N/A"}
Browser: ${testInfo.browser || "N/A"}
Build Version: ${testInfo.buildVersion || "N/A"}
Execution Time: ${testInfo.executionTime || "N/A"}

TEST DETAILS
Description: ${testDetails.description || "N/A"}
Steps: ${testDetails.steps || "N/A"}
Expected Result: ${testDetails.expectedResult}
Actual Result: ${testDetails.actualResult}

FAILURE EVIDENCE
--- Logs ---
${evidence.logs || "(none provided)"}

--- Stack Trace ---
${evidence.stackTrace || "(none provided)"}

--- API Response ---
${evidence.apiResponse || "(none provided)"}

--- Console Logs ---
${evidence.consoleLogs || "(none provided)"}

${evidence.screenshotBase64 ? "A screenshot was attached — analyze it as additional visual evidence." : "No screenshot was provided."}

Return ONLY a JSON object with EXACTLY this shape:
{
  "failure_summary": string,
  "root_cause": string,
  "root_cause_category": "Application Defect" | "Test Automation Issue" | "Environment Issue" | "Configuration Issue" | "Data Issue" | "Flaky Test",
  "severity": "Critical" | "High" | "Medium" | "Low",
  "priority": "P1" | "P2" | "P3" | "P4",
  "confidence": number (0-100),
  "confidence_rationale": string explaining WHY the confidence is at this level,
  "is_flaky": boolean,
  "environment_issue": boolean,
  "application_defect": boolean,
  "evidence": [ { "label": string, "detail": string, "source": "log"|"stack_trace"|"api_response"|"console"|"screenshot"|"test_data" } ],
  "why_ai_thinks_this": string[] (2-4 short bullet explanations linking evidence to the conclusion),
  "recommended_actions": string[],
  "developer_hint": string (only reference files/lines that literally appear in the evidence; otherwise give a general hint),
  "test_recommendation": string,
  "business_impact": string,
  "screenshot_findings": string[] (only if a screenshot was described; omit otherwise),
  "insufficient_evidence": boolean (true if the provided evidence is too thin to support a confident conclusion)
}

If evidence is insufficient, set "insufficient_evidence": true, keep confidence low (below 50), and say so plainly in "failure_summary".`;
}

export const CORRECTION_SUFFIX = `

Your previous response could not be parsed as valid JSON matching the required schema. Respond again with ONLY the corrected, valid JSON object and nothing else — no markdown fences, no explanation.`;

export const DEFECT_WRITER_SYSTEM = `You are a Senior QA Engineer writing a professional, developer-ready Jira defect from a completed root cause analysis.
Be precise, concise, and only state facts backed by the given analysis and evidence. Respond with ONLY a single valid JSON object — no markdown, no commentary.`;

export function buildDefectPrompt(testInfo: any, testDetails: any, evidence: any, analysis: FailureAnalysis): string {
  return `Using the completed AI root cause analysis below, write a developer-ready defect.

TEST: ${testInfo.testName} (${testInfo.application}, ${testInfo.environment || "N/A"})
EXPECTED: ${testDetails.expectedResult}
ACTUAL: ${testDetails.actualResult}

ANALYSIS:
${JSON.stringify(analysis, null, 2)}

Return ONLY a JSON object with EXACTLY this shape:
{
  "title": string (concise, specific, mentions the symptom),
  "description": string,
  "environment": string,
  "preconditions": string,
  "steps_to_reproduce": string[],
  "expected_result": string,
  "actual_result": string,
  "root_cause": string,
  "severity": "Critical" | "High" | "Medium" | "Low",
  "priority": "P1" | "P2" | "P3" | "P4",
  "business_impact": string,
  "evidence": string[],
  "suggested_fix": string,
  "regression_recommendation": string
}`;
}

export const TEST_GENERATOR_SYSTEM = `You are a Senior SDET generating regression test scenarios that guard against a known failure recurring.
Only propose tests that are directly relevant to the root cause given. Respond with ONLY a single valid JSON object — no markdown, no commentary.`;

export function buildTestGenerationPrompt(req: GenerateTestsRequest): string {
  return `Based on this root cause analysis, generate 4-6 regression test scenarios that would catch this class of failure.

TEST: ${req.testInfo.testName} (${req.testInfo.application})
ROOT CAUSE: ${req.analysis.root_cause}
CATEGORY: ${req.analysis.root_cause_category}

Return ONLY a JSON object with EXACTLY this shape:
{
  "tests": [
    {
      "id": "TC-001",
      "scenario": string,
      "preconditions": string,
      "steps": string[],
      "expected_result": string,
      "priority": "P1"|"P2"|"P3"|"P4",
      "automation_recommendation": string
    }
  ]
}`;
}

export const PLAYWRIGHT_GENERATOR_SYSTEM = `You are a Senior SDET writing a Playwright (TypeScript) automated test.
Only use selectors/data that can reasonably be inferred from the given scenario. Prefer role-based and test-id selectors, and add a clear comment where a real selector would need to be supplied by the team.
Respond with ONLY the TypeScript code, no markdown fences, no commentary.`;

export function buildPlaywrightPrompt(testInfo: any, test: RegressionTest): string {
  return `Application: ${testInfo.application}
Scenario: ${test.scenario}
Preconditions: ${test.preconditions}
Steps:
${test.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}
Expected Result: ${test.expected_result}

Write a single Playwright test (TypeScript, @playwright/test) implementing this scenario.`;
}

export const RISK_ANALYST_SYSTEM = `You are a Release Manager assessing whether a build is safe to ship based on recent QA failures.
Weigh severity, category, business-critical areas (payments, auth, checkout), repeated/flaky failures, and count of failures.
Respond with ONLY a single valid JSON object — no markdown, no commentary.`;

export function buildRiskPrompt(failures: any[]): string {
  return `Recent analyzed test failures (most recent first):
${JSON.stringify(failures, null, 2)}

Return ONLY a JSON object with EXACTLY this shape:
{
  "risk_score": number (0-100, higher = riskier),
  "risk_level": "Low"|"Medium"|"High"|"Critical",
  "recommendation": "GO"|"GO_WITH_CAUTION"|"NO-GO",
  "explanation": string (1-3 sentences, plain language, reference the specific failing area),
  "top_risks": [ { "area": string, "severity": "Critical"|"High"|"Medium"|"Low", "reason": string } ]
}`;
}

export const CHAT_ASSISTANT_SYSTEM = `You are "AI QA Detective", a helpful senior QA engineering assistant embedded in a test-failure analysis tool.
Answer using ONLY the currently analyzed failure's context provided to you. If asked something the context can't support, say what additional information would be needed.
Be concise, practical, and confident but not overconfident — reflect the analysis's own confidence level when relevant.
Respond with ONLY a single valid JSON object — no markdown, no commentary.`;

export function buildChatPrompt(message: string, context: any, history: { role: string; content: string }[]): string {
  return `CURRENT FAILURE CONTEXT:
${context ? JSON.stringify(context, null, 2) : "(no failure has been analyzed yet)"}

CONVERSATION HISTORY:
${history.map((h) => `${h.role}: ${h.content}`).join("\n") || "(none)"}

USER QUESTION: ${message}

Return ONLY a JSON object with EXACTLY this shape:
{ "answer": string }`;
}

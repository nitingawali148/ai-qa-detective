import { z } from "zod";

/**
 * Central schema definitions for all structured AI outputs.
 * Nothing in the app trusts free-form LLM text for application logic —
 * every AI response is parsed and validated against one of these schemas.
 */

export const RootCauseCategory = z.enum([
  "Application Defect",
  "Test Automation Issue",
  "Environment Issue",
  "Configuration Issue",
  "Data Issue",
  "Flaky Test",
]);
export type RootCauseCategory = z.infer<typeof RootCauseCategory>;

export const Severity = z.enum(["Critical", "High", "Medium", "Low"]);
export type Severity = z.infer<typeof Severity>;

export const Priority = z.enum(["P1", "P2", "P3", "P4"]);
export type Priority = z.infer<typeof Priority>;

export const EvidenceItem = z.object({
  label: z.string(),
  detail: z.string(),
  source: z.enum(["log", "stack_trace", "api_response", "console", "screenshot", "test_data"]),
});
export type EvidenceItem = z.infer<typeof EvidenceItem>;

export const FailureAnalysisSchema = z.object({
  failure_summary: z.string(),
  root_cause: z.string(),
  root_cause_category: RootCauseCategory,
  severity: Severity,
  priority: Priority,
  confidence: z.number().min(0).max(100),
  confidence_rationale: z.string(),
  is_flaky: z.boolean(),
  environment_issue: z.boolean(),
  application_defect: z.boolean(),
  evidence: z.array(EvidenceItem),
  why_ai_thinks_this: z.array(z.string()).min(1).max(6),
  recommended_actions: z.array(z.string()),
  developer_hint: z.string(),
  test_recommendation: z.string(),
  business_impact: z.string(),
  screenshot_findings: z.array(z.string()).optional(),
  insufficient_evidence: z.boolean().default(false),
});
export type FailureAnalysis = z.infer<typeof FailureAnalysisSchema>;

export const DefectSchema = z.object({
  title: z.string(),
  description: z.string(),
  environment: z.string(),
  preconditions: z.string(),
  steps_to_reproduce: z.array(z.string()),
  expected_result: z.string(),
  actual_result: z.string(),
  root_cause: z.string(),
  severity: Severity,
  priority: Priority,
  business_impact: z.string(),
  evidence: z.array(z.string()),
  suggested_fix: z.string(),
  regression_recommendation: z.string(),
});
export type Defect = z.infer<typeof DefectSchema>;

export const RegressionTestSchema = z.object({
  id: z.string(),
  scenario: z.string(),
  preconditions: z.string(),
  steps: z.array(z.string()),
  expected_result: z.string(),
  priority: Priority,
  automation_recommendation: z.string(),
});
export type RegressionTest = z.infer<typeof RegressionTestSchema>;

export const TestGenerationSchema = z.object({
  tests: z.array(RegressionTestSchema),
});
export type TestGeneration = z.infer<typeof TestGenerationSchema>;

export const RiskFactorSchema = z.object({
  area: z.string(),
  severity: Severity,
  reason: z.string(),
});

export const ReleaseRiskSchema = z.object({
  risk_score: z.number().min(0).max(100),
  risk_level: z.enum(["Low", "Medium", "High", "Critical"]),
  recommendation: z.enum(["GO", "GO_WITH_CAUTION", "NO-GO"]),
  explanation: z.string(),
  top_risks: z.array(RiskFactorSchema),
});
export type ReleaseRisk = z.infer<typeof ReleaseRiskSchema>;

export const ChatReplySchema = z.object({
  answer: z.string(),
});
export type ChatReply = z.infer<typeof ChatReplySchema>;

// ── Request payloads ────────────────────────────────────────────────────

export const TestInfoSchema = z.object({
  testName: z.string().min(1, "Test name is required"),
  testId: z.string().optional().default(""),
  application: z.string().min(1, "Application is required"),
  environment: z.string().optional().default(""),
  browser: z.string().optional().default(""),
  buildVersion: z.string().optional().default(""),
  executionTime: z.string().optional().default(""),
});

export const TestDetailsSchema = z.object({
  description: z.string().optional().default(""),
  steps: z.string().optional().default(""),
  expectedResult: z.string().min(1, "Expected result is required"),
  actualResult: z.string().min(1, "Actual result is required"),
});

export const EvidenceInputSchema = z.object({
  logs: z.string().optional().default(""),
  stackTrace: z.string().optional().default(""),
  apiResponse: z.string().optional().default(""),
  consoleLogs: z.string().optional().default(""),
  screenshotBase64: z.string().optional(),
  screenshotMimeType: z.string().optional(),
});

export const AnalyzeFailureRequestSchema = z.object({
  testInfo: TestInfoSchema,
  testDetails: TestDetailsSchema,
  evidence: EvidenceInputSchema,
});
export type AnalyzeFailureRequest = z.infer<typeof AnalyzeFailureRequestSchema>;

export const GenerateDefectRequestSchema = z.object({
  failureId: z.string().optional(),
  testInfo: TestInfoSchema,
  testDetails: TestDetailsSchema,
  evidence: EvidenceInputSchema,
  analysis: FailureAnalysisSchema,
});
export type GenerateDefectRequest = z.infer<typeof GenerateDefectRequestSchema>;

export const GenerateTestsRequestSchema = z.object({
  testInfo: TestInfoSchema,
  testDetails: TestDetailsSchema,
  analysis: FailureAnalysisSchema,
});
export type GenerateTestsRequest = z.infer<typeof GenerateTestsRequestSchema>;

export const GeneratePlaywrightRequestSchema = z.object({
  testInfo: TestInfoSchema,
  test: RegressionTestSchema,
});

export const ChatRequestSchema = z.object({
  message: z.string().min(1),
  context: z
    .object({
      testInfo: TestInfoSchema.optional(),
      testDetails: TestDetailsSchema.optional(),
      analysis: FailureAnalysisSchema.optional(),
    })
    .optional(),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .optional()
    .default([]),
});

export const JiraSettingsSchema = z.object({
  jiraUrl: z.string().optional().default(""),
  projectKey: z.string().optional().default(""),
  email: z.string().optional().default(""),
  apiToken: z.string().optional().default(""),
});
export type JiraSettings = z.infer<typeof JiraSettingsSchema>;

export const CreateJiraDefectRequestSchema = z.object({
  defect: DefectSchema,
  settings: JiraSettingsSchema.optional(),
});

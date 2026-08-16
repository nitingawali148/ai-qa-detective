/**
 * Client-side mirror of the server's Zod-inferred types (server/src/schemas).
 * Kept as plain TS interfaces here since client and server are separate
 * npm workspaces without a shared package — this is the one place to update
 * if the server's response shape changes.
 */

export type RootCauseCategory =
  | "Application Defect"
  | "Test Automation Issue"
  | "Environment Issue"
  | "Configuration Issue"
  | "Data Issue"
  | "Flaky Test";

export type Severity = "Critical" | "High" | "Medium" | "Low";
export type Priority = "P1" | "P2" | "P3" | "P4";
export type FailureStatus = "Open" | "Investigating" | "Resolved";

export interface TestInfo {
  testName: string;
  testId?: string;
  application: string;
  environment?: string;
  browser?: string;
  buildVersion?: string;
  executionTime?: string;
}

export interface TestDetails {
  description?: string;
  steps?: string;
  expectedResult: string;
  actualResult: string;
}

export interface EvidenceInput {
  logs?: string;
  stackTrace?: string;
  apiResponse?: string;
  consoleLogs?: string;
  screenshotBase64?: string;
  screenshotMimeType?: string;
}

export interface EvidenceItem {
  label: string;
  detail: string;
  source: "log" | "stack_trace" | "api_response" | "console" | "screenshot" | "test_data";
}

export interface FailureAnalysis {
  failure_summary: string;
  root_cause: string;
  root_cause_category: RootCauseCategory;
  severity: Severity;
  priority: Priority;
  confidence: number;
  confidence_rationale: string;
  is_flaky: boolean;
  environment_issue: boolean;
  application_defect: boolean;
  evidence: EvidenceItem[];
  why_ai_thinks_this: string[];
  recommended_actions: string[];
  developer_hint: string;
  test_recommendation: string;
  business_impact: string;
  screenshot_findings?: string[];
  insufficient_evidence: boolean;
}

export interface SimilarFailureResult {
  matchId: string;
  matchLabel: string;
  similarityPercent: number;
  previouslyObserved: number;
  lastOccurrence: string;
}

export interface AnalyzeResponse {
  failureId: string;
  analysis: FailureAnalysis;
  provider: string;
  screenshotAnalysisAvailable: boolean;
  similar: SimilarFailureResult | null;
}

export interface Defect {
  title: string;
  description: string;
  environment: string;
  preconditions: string;
  steps_to_reproduce: string[];
  expected_result: string;
  actual_result: string;
  root_cause: string;
  severity: Severity;
  priority: Priority;
  business_impact: string;
  evidence: string[];
  suggested_fix: string;
  regression_recommendation: string;
}

export interface RegressionTest {
  id: string;
  scenario: string;
  preconditions: string;
  steps: string[];
  expected_result: string;
  priority: Priority;
  automation_recommendation: string;
}

export interface ReleaseRisk {
  risk_score: number;
  risk_level: "Low" | "Medium" | "High" | "Critical";
  recommendation: "GO" | "GO_WITH_CAUTION" | "NO-GO";
  explanation: string;
  top_risks: { area: string; severity: Severity; reason: string }[];
}

export interface StoredFailure {
  id: string;
  createdAt: string;
  testInfo: TestInfo;
  testDetails: TestDetails;
  analysis: FailureAnalysis;
  status: FailureStatus;
  jiraKey?: string;
}

export interface DashboardData {
  testsAnalyzed: number;
  passedTests: number;
  failedTests: number;
  criticalFailures: number;
  environmentIssues: number;
  applicationDefects: number;
  flakyTests: number;
  avgConfidence: number;
  failureDistribution: { category: string; count: number }[];
  releaseRisk: ReleaseRisk | null;
  recentInvestigations: StoredFailure[];
  aiProvider: string;
}

export interface JiraSettings {
  jiraUrl: string;
  projectKey: string;
  email: string;
  apiToken: string;
}

export interface JiraCreateResult {
  mode: "real" | "mock";
  success: boolean;
  key?: string;
  url?: string;
  error?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

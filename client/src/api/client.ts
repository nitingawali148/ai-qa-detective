import type {
  AnalyzeResponse,
  ChatMessage,
  DashboardData,
  Defect,
  FailureAnalysis,
  JiraCreateResult,
  JiraSettings,
  RegressionTest,
  StoredFailure,
  TestDetails,
  TestInfo,
} from "../types";

const BASE = import.meta.env.VITE_API_URL || "/api";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new ApiError("Could not reach the AI QA Detective server. Please confirm it is running.", 0);
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw new ApiError(body?.error || `Request failed with status ${response.status}.`, response.status);
  }
  return body as T;
}

export interface EvidenceInputPayload {
  logs?: string;
  stackTrace?: string;
  apiResponse?: string;
  consoleLogs?: string;
  screenshotBase64?: string;
  screenshotMimeType?: string;
}

export const api = {
  health: () => request<{ status: string; aiProvider: string; visionSupported: boolean }>("/health"),

  dashboard: () => request<DashboardData>("/dashboard"),

  loadDemo: () => request<{ scenario: { testInfo: TestInfo; testDetails: TestDetails; evidence: EvidenceInputPayload } }>("/demo"),

  loadScenarios: () =>
    request<{ scenarios: { key: string; label: string; application: string; scenario: { testInfo: TestInfo; testDetails: TestDetails; evidence: EvidenceInputPayload } }[] }>(
      "/demo/scenarios"
    ),

  analyze: (payload: { testInfo: TestInfo; testDetails: TestDetails; evidence: EvidenceInputPayload }) =>
    request<AnalyzeResponse>("/analyze", { method: "POST", body: JSON.stringify(payload) }),

  generateDefect: (payload: { testInfo: TestInfo; testDetails: TestDetails; evidence: EvidenceInputPayload; analysis: FailureAnalysis; failureId?: string }) =>
    request<{ defect: Defect }>("/defect", { method: "POST", body: JSON.stringify(payload) }),

  generateTests: (payload: { testInfo: TestInfo; testDetails: TestDetails; analysis: FailureAnalysis }) =>
    request<{ tests: RegressionTest[] }>("/tests/generate", { method: "POST", body: JSON.stringify(payload) }),

  generatePlaywright: (payload: { testInfo: TestInfo; test: RegressionTest }) =>
    request<{ code: string; isMock: boolean }>("/tests/playwright", { method: "POST", body: JSON.stringify(payload) }),

  releaseRisk: () => request<import("../types").ReleaseRisk>("/risk"),

  history: (filters?: Record<string, string>) => {
    const qs = filters ? "?" + new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v))) : "";
    return request<{ failures: StoredFailure[] }>(`/history${qs}`);
  },

  updateStatus: (id: string, status: StoredFailure["status"]) =>
    request<{ failure: StoredFailure }>(`/history/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  createJiraDefect: (defect: Defect, settings?: JiraSettings) =>
    request<JiraCreateResult>("/jira/create", { method: "POST", body: JSON.stringify({ defect, settings }) }),

  linkJira: (failureId: string, jiraKey: string) =>
    request<{ failure: StoredFailure }>(`/jira/link/${failureId}`, { method: "POST", body: JSON.stringify({ jiraKey }) }),

  chat: (message: string, context: unknown, history: ChatMessage[]) =>
    request<{ answer: string }>("/chat", { method: "POST", body: JSON.stringify({ message, context, history }) }),
};

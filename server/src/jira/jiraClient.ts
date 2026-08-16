import type { Defect, JiraSettings } from "../schemas/index.js";

/**
 * Real Jira integration is attempted only when full settings are provided.
 * Otherwise we run a clearly-labeled MOCK creation flow. We NEVER claim a
 * real ticket was created unless Jira's API actually confirms it with a
 * returned issue key (Section 11 / Rule 18).
 */

export interface JiraCreateResult {
  mode: "real" | "mock";
  success: boolean;
  key?: string;
  url?: string;
  error?: string;
}

function hasRealJiraConfig(settings?: JiraSettings): settings is Required<JiraSettings> {
  return !!(settings?.jiraUrl && settings?.projectKey && settings?.email && settings?.apiToken);
}

function severityToPriorityName(priority: Defect["priority"]): string {
  switch (priority) {
    case "P1":
      return "Highest";
    case "P2":
      return "High";
    case "P3":
      return "Medium";
    default:
      return "Low";
  }
}

function adfDescription(defect: Defect) {
  const section = (heading: string, body: string) => [
    { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: heading }] },
    { type: "paragraph", content: [{ type: "text", text: body || "N/A" }] },
  ];
  return {
    type: "doc",
    version: 1,
    content: [
      ...section("Description", defect.description),
      ...section("Environment", defect.environment),
      ...section("Preconditions", defect.preconditions),
      ...section("Steps to Reproduce", defect.steps_to_reproduce.map((s, i) => `${i + 1}. ${s}`).join("\n")),
      ...section("Expected Result", defect.expected_result),
      ...section("Actual Result", defect.actual_result),
      ...section("Root Cause (AI-Assisted)", defect.root_cause),
      ...section("Business Impact", defect.business_impact),
      ...section("Suggested Fix", defect.suggested_fix),
      ...section("Regression Recommendation", defect.regression_recommendation),
    ],
  };
}

async function createReal(settings: Required<JiraSettings>, defect: Defect): Promise<JiraCreateResult> {
  const auth = Buffer.from(`${settings.email}:${settings.apiToken}`).toString("base64");
  const url = `${settings.jiraUrl.replace(/\/$/, "")}/rest/api/3/issue`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        fields: {
          project: { key: settings.projectKey },
          summary: defect.title,
          issuetype: { name: "Bug" },
          description: adfDescription(defect),
          priority: { name: severityToPriorityName(defect.priority) },
        },
      }),
    });

    const body: any = await response.json().catch(() => ({}));

    if (!response.ok || !body?.key) {
      return {
        mode: "real",
        success: false,
        error: body?.errorMessages?.join(", ") || body?.errors ? JSON.stringify(body.errors) : `Jira API returned HTTP ${response.status}`,
      };
    }

    return {
      mode: "real",
      success: true,
      key: body.key,
      url: `${settings.jiraUrl.replace(/\/$/, "")}/browse/${body.key}`,
    };
  } catch (err) {
    return { mode: "real", success: false, error: err instanceof Error ? err.message : "Unknown error contacting Jira." };
  }
}

function createMock(defect: Defect, settings?: JiraSettings): JiraCreateResult {
  const projectKey = settings?.projectKey?.trim() || "DEMO";
  const seq = Math.floor(1000 + Math.random() * 8999);
  return {
    mode: "mock",
    success: true,
    key: `${projectKey}-${seq}`,
    url: undefined,
  };
}

export async function createJiraDefect(defect: Defect, settings?: JiraSettings): Promise<JiraCreateResult> {
  if (hasRealJiraConfig(settings)) {
    return createReal(settings, defect);
  }
  return createMock(defect, settings);
}

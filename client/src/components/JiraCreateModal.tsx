import { useState } from "react";
import { api, ApiError } from "../api/client";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type { Defect, JiraCreateResult, JiraSettings } from "../types";
import { Badge, priorityTone, severityTone } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Spinner } from "./ui/Progress";

const EMPTY_SETTINGS: JiraSettings = { jiraUrl: "", projectKey: "", email: "", apiToken: "" };

export function JiraCreateModal({ defect, onClose, onCreated }: { defect: Defect; onClose: () => void; onCreated?: (result: JiraCreateResult) => void }) {
  const [settings] = useLocalStorage<JiraSettings>("jira-settings", EMPTY_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JiraCreateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isRealConfigured = !!(settings.jiraUrl && settings.projectKey && settings.email && settings.apiToken);

  const create = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.createJiraDefect(defect, settings);
      setResult(res);
      onCreated?.(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create Jira defect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {isRealConfigured ? "Jira Defect Preview" : "Jira Defect Preview (Simulated)"}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isRealConfigured
              ? `Will be created in project "${settings.projectKey}" via the Jira API.`
              : "No Jira credentials configured — this will run a realistic MOCK creation flow. Configure Jira in Settings to create real tickets."}
          </p>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div>
            <p className="text-[11px] text-slate-400">Summary</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{defect.title}</p>
          </div>
          <div className="flex gap-4">
            <div>
              <p className="text-[11px] text-slate-400">Priority</p>
              <Badge tone={priorityTone(defect.priority)}>{defect.priority}</Badge>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Severity</p>
              <Badge tone={severityTone(defect.severity)}>{defect.severity}</Badge>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Environment</p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1">{defect.environment}</p>
            </div>
          </div>

          {result && (
            <div
              className={`rounded-lg border px-3 py-2.5 text-sm ${
                result.success
                  ? "border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                  : "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300"
              }`}
            >
              {result.success ? (
                <>
                  <p className="font-semibold">
                    {result.mode === "mock" ? "Simulated defect created: " : "Jira defect created: "}
                    {result.key}
                  </p>
                  <p className="text-xs mt-0.5">
                    {result.mode === "mock"
                      ? "This is a MOCK ticket for demo purposes — no real Jira issue was created."
                      : result.url
                        ? "Confirmed by the Jira API."
                        : "Confirmed by the Jira API."}
                  </p>
                  {result.url && (
                    <a href={result.url} target="_blank" rel="noreferrer" className="text-xs underline mt-1 inline-block">
                      Open in Jira →
                    </a>
                  )}
                </>
              ) : (
                <p>{result.error || "Failed to create the Jira defect."}</p>
              )}
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && (
            <Button onClick={create} disabled={loading}>
              {loading && <Spinner className="h-3.5 w-3.5" />}
              {isRealConfigured ? "Create Jira Defect" : "Create Simulated Defect"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

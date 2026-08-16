import { useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { FieldGroup, Input } from "../components/ui/Field";
import { Button } from "../components/ui/Button";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { api } from "../api/client";
import type { JiraSettings } from "../types";

const EMPTY_SETTINGS: JiraSettings = { jiraUrl: "", projectKey: "", email: "", apiToken: "" };

export function Settings() {
  const [settings, setSettings] = useLocalStorage<JiraSettings>("jira-settings", EMPTY_SETTINGS);
  const [draft, setDraft] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [health, setHealth] = useState<{ aiProvider: string; visionSupported: boolean } | null>(null);

  useEffect(() => {
    api.health().then(setHealth).catch(() => setHealth(null));
  }, []);

  const save = () => {
    setSettings(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const isConfigured = !!(draft.jiraUrl && draft.projectKey && draft.email && draft.apiToken);

  return (
    <AppShell title="Settings" subtitle="Configure Jira integration and review the active AI provider">
      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>AI Provider</CardTitle>
            <CardDescription>Configured server-side via environment variables — never exposed to the browser.</CardDescription>
          </CardHeader>
          <CardContent>
            {health ? (
              <div className="flex items-center gap-3">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${health.aiProvider === "mock" ? "bg-amber-500" : "bg-emerald-500"}`}
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {health.aiProvider === "mock" ? "Demo Mode (Rule-Based Mock AI)" : `Connected: ${health.aiProvider}`}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {health.aiProvider === "mock"
                      ? "No AI_PROVIDER / API key is configured on the server. All analysis uses a deterministic, evidence-based rule engine — fully functional, but not a general-purpose LLM."
                      : `Vision/screenshot analysis is ${health.visionSupported ? "available" : "not available"} with this provider.`}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-red-500">Could not reach the server to check AI provider status.</p>
            )}
            <p className="text-[11px] text-slate-400 mt-3">
              To use a real LLM, set <code className="font-mono">AI_PROVIDER=anthropic</code> (or <code className="font-mono">openai</code>) and the
              matching API key in the server's <code className="font-mono">.env</code> file, then restart the server.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jira Integration</CardTitle>
            <CardDescription>
              Stored only in this browser's local storage and sent per-request when creating a defect — never persisted on the server. Leave blank to
              use the simulated Jira flow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <FieldGroup label="Jira URL">
              <Input value={draft.jiraUrl} onChange={(e) => setDraft({ ...draft, jiraUrl: e.target.value })} placeholder="https://yourteam.atlassian.net" />
            </FieldGroup>
            <FieldGroup label="Project Key">
              <Input value={draft.projectKey} onChange={(e) => setDraft({ ...draft, projectKey: e.target.value })} placeholder="PAY" />
            </FieldGroup>
            <FieldGroup label="Email / Username">
              <Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="you@company.com" />
            </FieldGroup>
            <FieldGroup label="API Token">
              <Input type="password" value={draft.apiToken} onChange={(e) => setDraft({ ...draft, apiToken: e.target.value })} placeholder="••••••••••••" />
            </FieldGroup>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={save}>{saved ? "Saved ✓" : "Save Settings"}</Button>
              <span className={`text-xs font-medium ${isConfigured ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                {isConfigured ? "Real Jira integration will be used" : "Simulated Jira flow will be used (no credentials configured)"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

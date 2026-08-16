import { Link } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { DefectCard } from "../components/DefectCard";
import { useAnalysis } from "../context/AnalysisContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type { JiraCreateResult } from "../types";

interface CreatedDefectRecord extends JiraCreateResult {
  title: string;
  createdAt: string;
}

export function JiraDefects() {
  const { defect } = useAnalysis();
  const [createdDefects, setCreatedDefects] = useLocalStorage<CreatedDefectRecord[]>("jira-created-defects", []);

  const recordCreated = (result: JiraCreateResult) => {
    if (!defect) return;
    setCreatedDefects([{ ...result, title: defect.title, createdAt: new Date().toISOString() }, ...createdDefects].slice(0, 20));
  };

  return (
    <AppShell title="Jira Defects" subtitle="Review the AI-generated defect and create it in Jira (real or simulated)">
      <div className="space-y-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">Current Defect</p>
          {!defect ? (
            <EmptyState
              icon={<span className="text-4xl">🐞</span>}
              title="No defect generated yet"
              description='Analyze a failure and click "Generate Defect" to create a Jira-ready defect here.'
              action={
                <Link to="/analyze">
                  <Button size="sm">Go to Analyze Failure</Button>
                </Link>
              }
            />
          ) : (
            <DefectCard defect={defect} onJiraCreated={recordCreated} />
          )}
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">Created Defects (this session)</p>
          {createdDefects.length === 0 ? (
            <Card className="p-6">
              <p className="text-sm text-slate-400">No defects have been created yet.</p>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {createdDefects.map((d, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-800 p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{d.title}</p>
                      <p className="text-xs text-slate-400">{new Date(d.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{d.key}</p>
                      <p className={`text-[11px] font-medium ${d.mode === "mock" ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {d.mode === "mock" ? "Simulated" : "Created in Jira"}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}

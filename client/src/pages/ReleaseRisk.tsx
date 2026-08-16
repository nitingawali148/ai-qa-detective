import { useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge, severityTone } from "../components/ui/Badge";
import { RiskGauge } from "../components/charts/RiskGauge";
import { RecommendationBadge } from "../components/RecommendationBadge";
import { Spinner } from "../components/ui/Progress";
import { api, ApiError } from "../api/client";
import type { ReleaseRisk } from "../types";

export function ReleaseRiskPage() {
  const [risk, setRisk] = useState<ReleaseRisk | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .releaseRisk()
      .then(setRisk)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to calculate release risk."));
  }, []);

  return (
    <AppShell title="Release Risk" subtitle="AI-assisted go/no-go recommendation based on all unresolved failures">
      {error && <Card className="p-4 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-sm text-red-700">{error}</Card>}

      {!risk && !error && (
        <div className="flex items-center gap-2 text-sm text-slate-400 py-20 justify-center">
          <Spinner /> Calculating release risk…
        </div>
      )}

      {risk && (
        <div className="space-y-6 animate-fade-in">
          <Card className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <RiskGauge risk={risk} />
              <div className="flex-1 text-center md:text-left">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">AI Recommendation</p>
                <RecommendationBadge recommendation={risk.recommendation} size="lg" />
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-4 max-w-xl">{risk.explanation}</p>
                <p className="text-[11px] text-slate-400 mt-3 italic">
                  This reflects the most probable release risk based on currently unresolved failures — a recommendation, not a guarantee.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Risks</CardTitle>
            </CardHeader>
            <CardContent>
              {risk.top_risks.length === 0 ? (
                <p className="text-sm text-slate-400">No significant unresolved risks identified.</p>
              ) : (
                <ol className="space-y-3">
                  {risk.top_risks.map((r, i) => (
                    <li key={i} className="flex items-center gap-3 rounded-lg border border-slate-100 dark:border-slate-800 p-3">
                      <span className="text-lg font-bold text-slate-300 dark:text-slate-600 w-6">{i + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{r.area}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{r.reason}</p>
                      </div>
                      <Badge tone={severityTone(r.severity)}>{r.severity}</Badge>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

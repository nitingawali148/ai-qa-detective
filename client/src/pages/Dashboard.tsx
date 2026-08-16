import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { StatCard } from "../components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { FailureDistributionChart } from "../components/charts/FailureDistributionChart";
import { RiskGauge } from "../components/charts/RiskGauge";
import { RecommendationBadge } from "../components/RecommendationBadge";
import { Badge, categoryTone, severityTone } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Progress";
import { api, ApiError } from "../api/client";
import type { DashboardData } from "../types";

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .dashboard()
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load dashboard."));
  }, []);

  return (
    <AppShell title="AI QA Detective" subtitle="AI-powered test investigation and release intelligence">
      {error && (
        <Card className="p-4 mb-6 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-sm text-red-700 dark:text-red-300">
          {error}
        </Card>
      )}

      {!data && !error && (
        <div className="flex items-center gap-2 text-sm text-slate-400 py-20 justify-center">
          <Spinner /> Loading dashboard…
        </div>
      )}

      {data && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard label="Tests Analyzed" value={data.testsAnalyzed} icon="📈" />
            <StatCard label="Failed Tests" value={data.failedTests} tone="warning" icon="❌" />
            <StatCard label="Critical Failures" value={data.criticalFailures} tone="danger" icon="🔥" />
            <StatCard label="Environment Issues" value={data.environmentIssues} icon="🌐" />
            <StatCard label="Application Defects" value={data.applicationDefects} icon="🐞" />
            <StatCard label="Potential Flaky Tests" value={data.flakyTests} icon="🎲" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Failure Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <FailureDistributionChart data={data.failureDistribution} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Release Risk</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {data.releaseRisk ? (
                  <>
                    <RiskGauge risk={data.releaseRisk} />
                    <div className="mt-4">
                      <RecommendationBadge recommendation={data.releaseRisk.recommendation} />
                    </div>
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">{data.releaseRisk.explanation}</p>
                    <Link to="/risk" className="mt-3 text-xs font-medium text-brand-600 hover:underline">
                      View full risk analysis →
                    </Link>
                  </>
                ) : (
                  <p className="text-sm text-slate-400 py-8">No risk data available.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Average AI Confidence" value={`${data.avgConfidence}%`} icon="🎯" />
            <StatCard label="Passed Tests" value={data.passedTests} tone="success" icon="✅" />
            <Card className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Get started</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1">Investigate a failed test</p>
              </div>
              <Link to="/analyze">
                <Button size="sm">Analyze Failure</Button>
              </Link>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent AI Investigations</CardTitle>
              <Link to="/history" className="text-xs font-medium text-brand-600 hover:underline">
                View all →
              </Link>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      <th className="font-medium px-5 py-2">Test</th>
                      <th className="font-medium px-5 py-2">Application</th>
                      <th className="font-medium px-5 py-2">Category</th>
                      <th className="font-medium px-5 py-2">Severity</th>
                      <th className="font-medium px-5 py-2">Confidence</th>
                      <th className="font-medium px-5 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentInvestigations.map((f) => (
                      <tr key={f.id} className="border-b border-slate-50 dark:border-slate-900 last:border-0">
                        <td className="px-5 py-2.5 font-medium text-slate-700 dark:text-slate-200">{f.testInfo.testName}</td>
                        <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400">{f.testInfo.application}</td>
                        <td className="px-5 py-2.5">
                          <Badge tone={categoryTone(f.analysis.root_cause_category)}>{f.analysis.root_cause_category}</Badge>
                        </td>
                        <td className="px-5 py-2.5">
                          <Badge tone={severityTone(f.analysis.severity)}>{f.analysis.severity}</Badge>
                        </td>
                        <td className="px-5 py-2.5 tabular-nums text-slate-600 dark:text-slate-300">{f.analysis.confidence}%</td>
                        <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400">{f.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

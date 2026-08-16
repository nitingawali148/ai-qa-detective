import { Fragment, useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { Card, CardContent } from "../components/ui/Card";
import { Badge, categoryTone, severityTone } from "../components/ui/Badge";
import { Select } from "../components/ui/Field";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Progress";
import { api, ApiError } from "../api/client";
import type { FailureStatus, StoredFailure } from "../types";

const CATEGORIES = ["Application Defect", "Test Automation Issue", "Environment Issue", "Configuration Issue", "Data Issue", "Flaky Test"];
const SEVERITIES = ["Critical", "High", "Medium", "Low"];
const STATUSES: FailureStatus[] = ["Open", "Investigating", "Resolved"];

const STATUS_SELECT_CLASSES: Record<FailureStatus, string> = {
  Open: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  Investigating: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  Resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

export function FailureHistory() {
  const [failures, setFailures] = useState<StoredFailure[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filters, setFilters] = useState({ severity: "", category: "", application: "", environment: "", status: "" });

  const load = () => {
    api
      .history(filters)
      .then((res) => setFailures(res.failures))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load failure history."));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const applications = Array.from(new Set((failures ?? []).map((f) => f.testInfo.application))).sort();
  const environments = Array.from(new Set((failures ?? []).map((f) => f.testInfo.environment).filter(Boolean))).sort();

  const updateStatus = async (id: string, status: FailureStatus) => {
    try {
      await api.updateStatus(id, status);
      load();
    } catch {
      setError("Failed to update status.");
    }
  };

  return (
    <AppShell title="Failure History" subtitle="All AI-analyzed test failures, with filtering">
      <Card className="p-4 mb-5">
        <div className="flex flex-wrap gap-3">
          <Select value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })} className="w-auto min-w-[140px]">
            <option value="">All Severities</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="w-auto min-w-[170px]">
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select value={filters.application} onChange={(e) => setFilters({ ...filters, application: e.target.value })} className="w-auto min-w-[160px]">
            <option value="">All Applications</option>
            {applications.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
          <Select value={filters.environment} onChange={(e) => setFilters({ ...filters, environment: e.target.value })} className="w-auto min-w-[140px]">
            <option value="">All Environments</option>
            {environments.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </Select>
          <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="w-auto min-w-[140px]">
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {error && <Card className="p-4 mb-5 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-sm text-red-700">{error}</Card>}

      {!failures && !error && (
        <div className="flex items-center gap-2 text-sm text-slate-400 py-20 justify-center">
          <Spinner /> Loading failures…
        </div>
      )}

      {failures && failures.length === 0 && <EmptyState title="No failures match these filters" description="Try adjusting or clearing the filters above." />}

      {failures && failures.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <th className="font-medium px-5 py-3">Test</th>
                    <th className="font-medium px-5 py-3">Application</th>
                    <th className="font-medium px-5 py-3">Category</th>
                    <th className="font-medium px-5 py-3">Severity</th>
                    <th className="font-medium px-5 py-3">Confidence</th>
                    <th className="font-medium px-5 py-3">Date</th>
                    <th className="font-medium px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {failures.map((f) => (
                    <Fragment key={f.id}>
                      <tr
                        className="border-b border-slate-50 dark:border-slate-900 last:border-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/60"
                        onClick={() => setExpanded(expanded === f.id ? null : f.id)}
                      >
                        <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{f.testInfo.testName}</td>
                        <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{f.testInfo.application}</td>
                        <td className="px-5 py-3">
                          <Badge tone={categoryTone(f.analysis.root_cause_category)}>{f.analysis.root_cause_category}</Badge>
                        </td>
                        <td className="px-5 py-3">
                          <Badge tone={severityTone(f.analysis.severity)}>{f.analysis.severity}</Badge>
                        </td>
                        <td className="px-5 py-3 tabular-nums text-slate-600 dark:text-slate-300">{f.analysis.confidence}%</td>
                        <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{new Date(f.createdAt).toLocaleDateString()}</td>
                        <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={f.status}
                            onChange={(e) => updateStatus(f.id, e.target.value as FailureStatus)}
                            className={`text-xs font-medium rounded-full pl-2.5 pr-6 py-0.5 border-0 cursor-pointer appearance-none bg-no-repeat ${STATUS_SELECT_CLASSES[f.status]}`}
                            style={{
                              backgroundImage:
                                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E\")",
                              backgroundPosition: "right 6px center",
                              backgroundSize: "12px",
                            }}
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                      {expanded === f.id && (
                        <tr className="bg-slate-50 dark:bg-slate-900/60">
                          <td colSpan={7} className="px-5 py-4">
                            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Root Cause</p>
                            <p className="text-sm text-slate-700 dark:text-slate-200 mb-3">{f.analysis.root_cause}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-500 dark:text-slate-400">
                              <span>
                                <strong className="text-slate-700 dark:text-slate-200">ID:</strong> {f.id}
                              </span>
                              <span>
                                <strong className="text-slate-700 dark:text-slate-200">Priority:</strong> {f.analysis.priority}
                              </span>
                              <span>
                                <strong className="text-slate-700 dark:text-slate-200">Environment:</strong> {f.testInfo.environment || "N/A"}
                              </span>
                              {f.jiraKey && (
                                <span>
                                  <strong className="text-slate-700 dark:text-slate-200">Jira:</strong> {f.jiraKey}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}

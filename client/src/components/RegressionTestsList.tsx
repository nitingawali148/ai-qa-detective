import { useState } from "react";
import { api, ApiError } from "../api/client";
import type { RegressionTest, TestInfo } from "../types";
import { Badge, priorityTone } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Spinner } from "./ui/Progress";

export function RegressionTestsList({ tests, testInfo }: { tests: RegressionTest[]; testInfo: TestInfo }) {
  return (
    <div className="space-y-4 animate-fade-in">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Regression Tests ({tests.length})</p>
      {tests.map((t) => (
        <TestCard key={t.id} test={t} testInfo={testInfo} />
      ))}
    </div>
  );
}

function TestCard({ test, testInfo }: { test: RegressionTest; testInfo: TestInfo }) {
  const [code, setCode] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.generatePlaywright({ testInfo, test });
      setCode(res.code);
      setIsMock(res.isMock);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to generate Playwright test.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold text-brand-600 dark:text-brand-400">{test.id}</p>
          <CardTitle className="text-sm mt-0.5">{test.scenario}</CardTitle>
        </div>
        <Badge tone={priorityTone(test.priority)}>{test.priority}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-[11px] font-semibold uppercase text-slate-400">Preconditions</p>
          <p className="text-sm text-slate-700 dark:text-slate-200">{test.preconditions}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase text-slate-400">Steps</p>
          <ol className="list-decimal list-inside text-sm text-slate-700 dark:text-slate-200 space-y-0.5">
            {test.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase text-slate-400">Expected Result</p>
          <p className="text-sm text-slate-700 dark:text-slate-200">{test.expected_result}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase text-slate-400">Automation Recommendation</p>
          <p className="text-sm text-slate-700 dark:text-slate-200">{test.automation_recommendation}</p>
        </div>

        {code && (
          <div className="relative">
            {isMock && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mb-1">
                Demo Mode: this is a template with placeholder selectors, not AI-generated code.
              </p>
            )}
            <pre className="text-xs font-mono bg-slate-900 text-slate-100 rounded-lg p-3 overflow-x-auto scrollbar-thin max-h-72">{code}</pre>
            <Button size="sm" variant="secondary" className="absolute top-2 right-2" onClick={copy}>
              {copied ? "Copied ✓" : "Copy"}
            </Button>
          </div>
        )}
        {error && <p className="text-xs text-red-500">{error}</p>}

        {!code && (
          <Button size="sm" variant="outline" onClick={generate} disabled={loading}>
            {loading && <Spinner className="h-3.5 w-3.5" />}
            Generate Playwright Test
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

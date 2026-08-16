import { useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { RegressionTestsList } from "../components/RegressionTestsList";
import { useAnalysis } from "../context/AnalysisContext";
import { api, ApiError } from "../api/client";

export function TestGenerator() {
  const { result, testInfo, testDetails, tests, setTests } = useAnalysis();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!result || !testInfo || !testDetails) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.generateTests({ testInfo, testDetails, analysis: result.analysis });
      setTests(res.tests);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Regression test generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Test Generator" subtitle="AI-generated regression scenarios grounded in the last root cause analysis">
      {!result && (
        <EmptyState
          icon={<span className="text-4xl">🧪</span>}
          title="No analyzed failure yet"
          description="Analyze a failure first — regression tests are generated from its confirmed root cause, not invented independently."
          action={
            <Link to="/analyze">
              <Button size="sm">Go to Analyze Failure</Button>
            </Link>
          }
        />
      )}

      {result && !tests && (
        <Card className="p-8 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">
            Ready to generate regression tests for: <span className="font-semibold">{testInfo?.testName}</span>
          </p>
          <p className="text-xs text-slate-400 mb-4">Root cause: {result.analysis.root_cause}</p>
          <Button onClick={generate} disabled={loading}>
            {loading ? "Generating…" : "Generate Regression Tests"}
          </Button>
          {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
        </Card>
      )}

      {result && tests && testInfo && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={generate} disabled={loading}>
              {loading ? "Regenerating…" : "Regenerate"}
            </Button>
          </div>
          <RegressionTestsList tests={tests} testInfo={testInfo} />
        </div>
      )}
    </AppShell>
  );
}

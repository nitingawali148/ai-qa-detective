import { Badge, categoryTone, priorityTone, severityTone } from "./ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { ConfidenceMeter } from "./ConfidenceMeter";
import type { AnalyzeResponse } from "../types";

const SOURCE_LABEL: Record<string, string> = {
  log: "Log",
  stack_trace: "Stack Trace",
  api_response: "API Response",
  console: "Console",
  screenshot: "Screenshot",
  test_data: "Test Data",
};

export function ResultsPanel({ response, hasScreenshot }: { response: AnalyzeResponse; hasScreenshot?: boolean }) {
  const { analysis, similar, provider, screenshotAnalysisAvailable } = response;

  return (
    <div className="space-y-6 animate-fade-in">
      {similar && (
        <Card className="border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/30 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400 mb-1.5">🔗 Similar Failure Detected</p>
          <p className="text-sm text-slate-700 dark:text-slate-200">
            This failure is <span className="font-bold">{similar.similarityPercent}% similar</span> to{" "}
            <span className="font-semibold">{similar.matchId}</span> — {similar.matchLabel}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Previously observed <span className="font-medium">{similar.previouslyObserved}</span> time
            {similar.previouslyObserved === 1 ? "" : "s"} · Last occurrence{" "}
            {new Date(similar.lastOccurrence).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </p>
          <p className="text-[11px] text-slate-400 mt-2 italic">
            Similarity is calculated using AI-assisted keyword/category comparison, not a trained embedding model.
          </p>
        </Card>
      )}

      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge tone={categoryTone(analysis.root_cause_category)} size="md">
            {analysis.root_cause_category}
          </Badge>
          <Badge tone={severityTone(analysis.severity)} size="md">
            {analysis.severity}
          </Badge>
          <Badge tone={priorityTone(analysis.priority)} size="md">
            {analysis.priority}
          </Badge>
          {analysis.is_flaky && (
            <Badge tone="green" size="md">
              Possibly Flaky
            </Badge>
          )}
          <span className="ml-auto text-[11px] text-slate-400">
            Analyzed by: <span className="font-medium">{provider === "mock" ? "Rule-based demo engine" : provider}</span>
          </span>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Failure Summary</p>
        <p className="text-base text-slate-800 dark:text-slate-100 mb-5">{analysis.failure_summary}</p>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Root Cause</p>
        <p className="text-lg font-semibold text-slate-900 dark:text-white leading-snug">{analysis.root_cause}</p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <ConfidenceMeter confidence={analysis.confidence} rationale={analysis.confidence_rationale} insufficient={analysis.insufficient_evidence} />
        </Card>

        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Why AI Thinks This</p>
          <ul className="space-y-2">
            {analysis.why_ai_thinks_this.map((reason, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-slate-200">
                <span className="text-brand-500 font-bold">{i + 1}.</span>
                {reason}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evidence</CardTitle>
        </CardHeader>
        <CardContent>
          {analysis.evidence.length === 0 ? (
            <p className="text-sm text-slate-400">No structured evidence lines were identified from the submitted input.</p>
          ) : (
            <div className="space-y-3">
              {analysis.evidence.map((e, i) => (
                <div key={i} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Evidence {i + 1}</span>
                    <Badge tone="slate">{SOURCE_LABEL[e.source] ?? e.source}</Badge>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{e.label}</span>
                  </div>
                  <pre className="text-xs font-mono text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words">{e.detail}</pre>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {analysis.screenshot_findings && analysis.screenshot_findings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Screenshot Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {analysis.screenshot_findings.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <span className="text-emerald-500">✓</span> {f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      {hasScreenshot && !screenshotAnalysisAvailable && analysis.screenshot_findings === undefined && (
        <ScreenshotUnavailableNote provider={provider} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recommended Fix</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 list-decimal list-inside text-sm text-slate-700 dark:text-slate-200">
              {analysis.recommended_actions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Developer Hint</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 dark:text-slate-200 font-mono bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3">
              {analysis.developer_hint}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Recommendation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 dark:text-slate-200">{analysis.test_recommendation}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Business Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 dark:text-slate-200">{analysis.business_impact}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ScreenshotUnavailableNote({ provider }: { provider: string }) {
  return (
    <Card className="p-4 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-500 dark:text-slate-400">
      📷 Screenshot analysis is unavailable{" "}
      {provider === "mock"
        ? "in Demo Mode (the mock AI engine is rule-based and cannot see images). Configure a vision-capable provider (Anthropic/OpenAI) to enable it."
        : "for the currently configured AI provider."}
    </Card>
  );
}

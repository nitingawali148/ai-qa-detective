import { Link } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { RecommendationBadge } from "../components/RecommendationBadge";
import { useAnalysis } from "../context/AnalysisContext";

const STEPS = [
  { icon: "❌", title: "1. Test Fails", desc: "An automated test fails in CI with logs, a stack trace, and an API response." },
  { icon: "🕵️", title: "2. AI Investigates", desc: "AI QA Detective reads the evidence, classifies the failure, and scores its confidence." },
  { icon: "✅", title: "3. QA Gets The Answer", desc: "Root cause, severity, recommended fix, a Jira-ready defect, and regression tests." },
];

export function PresentationMode() {
  const { result } = useAnalysis();
  const analysis = result?.analysis;

  return (
    <AppShell title="Presentation Mode" subtitle="A judge-friendly, one-screen summary of AI QA Detective">
      <div className="max-w-4xl mx-auto space-y-10 py-6">
        <div className="text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white text-2xl font-bold mb-4">AI</div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">AI QA Detective</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 mt-2">From failed test to root cause in seconds.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STEPS.map((s) => (
            <Card key={s.title} className="p-6 text-center">
              <p className="text-4xl mb-3">{s.icon}</p>
              <p className="font-bold text-slate-900 dark:text-white">{s.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{s.desc}</p>
            </Card>
          ))}
        </div>

        <Card className="p-8">
          {analysis ? (
            <>
              <p className="text-xs text-center text-slate-400 mb-3 uppercase tracking-wide">Live result from your last analysis</p>
              <div className="text-center">
                <p className="text-6xl font-bold text-brand-600 dark:text-brand-400 tabular-nums">{analysis.confidence}%</p>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Root Cause Confidence</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-semibold">{analysis.root_cause_category}</span>
                <span className="rounded-lg bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 px-4 py-2 text-sm font-semibold">
                  {analysis.priority} {analysis.severity}
                </span>
              </div>
              <p className="text-center text-sm text-slate-600 dark:text-slate-300 mt-5 max-w-xl mx-auto">{analysis.root_cause}</p>
            </>
          ) : (
            <>
              <p className="text-xs text-center text-slate-400 mb-3 uppercase tracking-wide">Illustrative example — run the demo for a live result</p>
              <div className="text-center">
                <p className="text-6xl font-bold text-brand-600 dark:text-brand-400 tabular-nums">94%</p>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Root Cause Confidence</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-semibold">Application Defect</span>
                <span className="rounded-lg bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 px-4 py-2 text-sm font-semibold">P1 Critical</span>
              </div>
            </>
          )}

          <div className="flex justify-center mt-6">
            <RecommendationBadge recommendation="NO-GO" size="lg" />
          </div>
        </Card>

        {!analysis && (
          <div className="text-center">
            <Link to="/analyze">
              <Button size="lg">Run the Live Demo →</Button>
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}

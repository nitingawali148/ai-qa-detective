import { useEffect, useState } from "react";
import { Spinner } from "./ui/Progress";

const STEPS = [
  "Reading test execution",
  "Parsing logs",
  "Analyzing stack trace",
  "Checking expected vs actual",
  "Classifying failure",
  "Evaluating root cause",
  "Calculating confidence",
  "Generating recommendations",
];

/**
 * Purely cosmetic investigation checklist shown while the real /api/analyze
 * request is in flight — it does not gate or fake the actual AI call.
 */
export function AnalysisAnimation({ done }: { done: boolean }) {
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    if (done) {
      setVisibleCount(STEPS.length);
      return;
    }
    if (visibleCount >= STEPS.length - 1) return;
    const t = setTimeout(() => setVisibleCount((c) => c + 1), 550);
    return () => clearTimeout(t);
  }, [visibleCount, done]);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card p-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-600" />
        </span>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">AI QA Detective is investigating…</h3>
      </div>
      <ul className="space-y-2.5">
        {STEPS.slice(0, visibleCount).map((step, i) => {
          const isLast = i === visibleCount - 1;
          const complete = done || !isLast;
          return (
            <li key={step} className="flex items-center gap-2.5 text-sm">
              {complete ? (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px]">✓</span>
              ) : (
                <Spinner className="h-4 w-4 text-brand-600" />
              )}
              <span className={complete ? "text-slate-700 dark:text-slate-200" : "text-slate-400"}>{step}</span>
            </li>
          );
        })}
      </ul>
      {done && (
        <p className="mt-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
          <span>✓</span> Analysis Complete
        </p>
      )}
    </div>
  );
}

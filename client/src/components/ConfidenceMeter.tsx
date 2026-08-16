import { ProgressBar } from "./ui/Progress";

function confidenceLabel(confidence: number): { label: string; colorClass: string; textClass: string } {
  if (confidence >= 85) return { label: "Very High", colorClass: "bg-emerald-500", textClass: "text-emerald-600 dark:text-emerald-400" };
  if (confidence >= 65) return { label: "High", colorClass: "bg-blue-500", textClass: "text-blue-600 dark:text-blue-400" };
  if (confidence >= 45) return { label: "Medium", colorClass: "bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" };
  return { label: "Low", colorClass: "bg-red-500", textClass: "text-red-600 dark:text-red-400" };
}

export function ConfidenceMeter({ confidence, rationale, insufficient }: { confidence: number; rationale: string; insufficient: boolean }) {
  const { label, colorClass, textClass } = confidenceLabel(confidence);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">AI Root Cause Confidence</p>
      <div className="flex items-baseline gap-3">
        <span className={`text-4xl font-bold tabular-nums ${textClass}`}>{confidence}%</span>
        <span className={`text-sm font-semibold ${textClass}`}>{label}</span>
      </div>
      <ProgressBar value={confidence} colorClass={colorClass} className="mt-3" />
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">{rationale}</p>
      {insufficient && (
        <div className="mt-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
          ⚠ Insufficient evidence. Additional logs are recommended before treating this as a confirmed root cause.
        </div>
      )}
    </div>
  );
}

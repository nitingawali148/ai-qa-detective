const STYLES: Record<string, string> = {
  GO: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
  GO_WITH_CAUTION: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800",
  "NO-GO": "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300 dark:border-red-800",
};

const LABELS: Record<string, string> = {
  GO: "GO",
  GO_WITH_CAUTION: "GO WITH CAUTION",
  "NO-GO": "NO-GO",
};

export function RecommendationBadge({ recommendation, size = "md" }: { recommendation: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "text-lg px-5 py-2" : size === "sm" ? "text-xs px-2.5 py-1" : "text-sm px-3.5 py-1.5";
  return (
    <span className={`inline-flex items-center justify-center rounded-lg border font-bold tracking-wide ${sizeClass} ${STYLES[recommendation] ?? STYLES["GO_WITH_CAUTION"]}`}>
      {LABELS[recommendation] ?? recommendation}
    </span>
  );
}

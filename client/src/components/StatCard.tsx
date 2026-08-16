import type { ReactNode } from "react";
import { Card } from "./ui/Card";

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "danger" | "warning" | "success";
  icon?: ReactNode;
}) {
  const valueColor =
    tone === "danger"
      ? "text-red-600 dark:text-red-400"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : tone === "success"
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-slate-900 dark:text-white";

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        {icon && <span className="text-lg opacity-70">{icon}</span>}
      </div>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${valueColor}`}>{value}</p>
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </Card>
  );
}

import { cn } from "./cn";

export function ProgressBar({ value, className, colorClass = "bg-brand-600" }: { value: number; className?: string; colorClass?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden", className)}>
      <div className={cn("h-full rounded-full transition-all duration-700 ease-out", colorClass)} style={{ width: `${clamped}%` }} />
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin h-4 w-4", className)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

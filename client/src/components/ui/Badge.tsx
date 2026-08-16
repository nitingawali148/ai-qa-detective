import type { HTMLAttributes } from "react";
import { cn } from "./cn";

type Tone = "slate" | "red" | "orange" | "amber" | "green" | "blue" | "purple" | "indigo";

const toneClasses: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  red: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  size?: "sm" | "md";
}

const sizeClasses = {
  sm: "px-2.5 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
};

export function Badge({ className, tone = "slate", size = "sm", ...props }: BadgeProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full font-medium", sizeClasses[size], toneClasses[tone], className)}
      {...props}
    />
  );
}

export function severityTone(severity: string): Tone {
  switch (severity) {
    case "Critical":
      return "red";
    case "High":
      return "orange";
    case "Medium":
      return "amber";
    default:
      return "slate";
  }
}

export function categoryTone(category: string): Tone {
  switch (category) {
    case "Application Defect":
      return "red";
    case "Environment Issue":
      return "blue";
    case "Test Automation Issue":
      return "purple";
    case "Configuration Issue":
      return "indigo";
    case "Data Issue":
      return "amber";
    case "Flaky Test":
      return "green";
    default:
      return "slate";
  }
}

export function statusTone(status: string): Tone {
  switch (status) {
    case "Open":
      return "red";
    case "Investigating":
      return "amber";
    case "Resolved":
      return "green";
    default:
      return "slate";
  }
}

export function priorityTone(priority: string): Tone {
  switch (priority) {
    case "P1":
      return "red";
    case "P2":
      return "orange";
    case "P3":
      return "amber";
    default:
      return "slate";
  }
}

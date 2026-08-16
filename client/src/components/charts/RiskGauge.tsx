import { riskStatusColor } from "../../lib/chartColors";
import type { ReleaseRisk } from "../../types";

const SIZE = 160;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function RiskGauge({ risk }: { risk: Pick<ReleaseRisk, "risk_score" | "risk_level"> }) {
  const color = riskStatusColor(risk.risk_level);
  const progress = Math.max(0, Math.min(100, risk.risk_score)) / 100;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} strokeWidth={STROKE} fill="none" className="stroke-slate-100 dark:stroke-slate-800" />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            strokeWidth={STROKE}
            fill="none"
            stroke={color}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">{risk.risk_score}</span>
          <span className="text-[11px] text-slate-400">/ 100</span>
        </div>
      </div>
      <span
        className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
        style={{ backgroundColor: `${color}1a`, color }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
        {risk.risk_level.toUpperCase()} RISK
      </span>
    </div>
  );
}

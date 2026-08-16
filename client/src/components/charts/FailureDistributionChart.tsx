import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { categoryColor, getIsDarkMode } from "../../lib/chartColors";

interface Props {
  data: { category: string; count: number }[];
}

export function FailureDistributionChart({ data }: Props) {
  const isDark = getIsDarkMode();
  const gridColor = isDark ? "#2c2c2a" : "#e1e0d9";
  const inkColor = isDark ? "#c3c2b7" : "#52514e";
  const sorted = [...data].sort((a, b) => b.count - a.count);

  if (sorted.length === 0) {
    return <p className="text-sm text-slate-400 py-8 text-center">No failures recorded yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, sorted.length * 42)}>
      <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }} barSize={18}>
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: inkColor }} axisLine={{ stroke: gridColor }} tickLine={false} />
        <YAxis
          type="category"
          dataKey="category"
          width={150}
          tick={{ fontSize: 12, fill: inkColor }}
          axisLine={{ stroke: gridColor }}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
          contentStyle={{
            background: isDark ? "#1a1a19" : "#fcfcfb",
            border: `1px solid ${gridColor}`,
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: isDark ? "#ffffff" : "#0b0b0b", fontWeight: 600 }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} isAnimationActive={false}>
          {sorted.map((entry) => (
            <Cell key={entry.category} fill={categoryColor(entry.category, isDark)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

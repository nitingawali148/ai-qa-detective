import { useEffect, useState } from "react";
import { api } from "../../api/client";

export function ProviderBadge() {
  const [state, setState] = useState<{ provider: string; ok: boolean } | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .health()
      .then((h) => mounted && setState({ provider: h.aiProvider, ok: true }))
      .catch(() => mounted && setState({ provider: "unreachable", ok: false }));
    return () => {
      mounted = false;
    };
  }, []);

  if (!state) return null;

  const label = state.provider === "mock" ? "Demo Mode (Mock AI)" : state.provider === "unreachable" ? "Server unreachable" : `AI: ${state.provider}`;
  const dot = !state.ok ? "bg-red-500" : state.provider === "mock" ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs text-slate-500 dark:text-slate-400">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </div>
  );
}

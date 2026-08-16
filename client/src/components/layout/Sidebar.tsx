import { NavLink } from "react-router-dom";
import { cn } from "../ui/cn";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: "📊", end: true },
  { to: "/analyze", label: "Analyze Failure", icon: "🔍" },
  { to: "/history", label: "Failure History", icon: "🗂️" },
  { to: "/tests", label: "Test Generator", icon: "🧪" },
  { to: "/risk", label: "Release Risk", icon: "🚦" },
  { to: "/jira", label: "Jira Defects", icon: "🐞" },
  { to: "/present", label: "Presentation Mode", icon: "🎤" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
      <div className="px-5 py-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center text-white text-sm font-bold">AI</div>
          <div>
            <p className="text-sm font-bold leading-tight text-slate-900 dark:text-white">AI QA Detective</p>
            <p className="text-[10px] text-slate-400 leading-tight">Senior QA Engineer, on demand</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
              )
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 leading-relaxed">
        AI identifies the most probable root cause based on available evidence — not a guarantee.
      </div>
    </aside>
  );
}

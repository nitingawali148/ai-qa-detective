import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { ProviderBadge } from "./ProviderBadge";
import { ChatAssistant } from "../ChatAssistant";

export function AppShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur px-6 py-4 shrink-0">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h1>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            <ProviderBadge />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6">{children}</main>
      </div>
      <ChatAssistant />
    </div>
  );
}

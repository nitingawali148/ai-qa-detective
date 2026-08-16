import { useState } from "react";
import { api, ApiError } from "../api/client";
import { useAnalysis } from "../context/AnalysisContext";
import type { ChatMessage } from "../types";
import { Button } from "./ui/Button";
import { Spinner } from "./ui/Progress";

const SUGGESTED_QUESTIONS = [
  "Why did this test fail?",
  "Is this a product defect or test issue?",
  "Should I create a P1 or P2?",
  "What additional logs should I collect?",
  "What regression tests should I add?",
  "Should this block the release?",
];

export function ChatAssistant() {
  const { result, testInfo, testDetails } = useAnalysis();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const context = result ? { testInfo, testDetails, analysis: result.analysis } : undefined;
      const res = await api.chat(text, context, messages);
      setMessages([...nextMessages, { role: "assistant", content: res.answer }]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The assistant could not respond. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700 flex items-center justify-center text-xl transition-transform hover:scale-105"
        title="Ask AI QA Detective"
      >
        {open ? "✕" : "💬"}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-40 w-[22rem] max-w-[calc(100vw-2.5rem)] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-fade-in overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-brand-600 text-white">
            <p className="text-sm font-semibold">Ask AI QA Detective</p>
            <p className="text-[11px] text-brand-100">
              {result ? "Grounded in the currently analyzed failure" : "No failure analyzed yet — answers will be limited"}
            </p>
          </div>

          <div className="flex-1 max-h-80 overflow-y-auto scrollbar-thin px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-1.5">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="block w-full text-left text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <span
                  className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {m.content}
                </span>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Spinner className="h-3.5 w-3.5" /> Thinking…
              </div>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 p-2.5"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Button type="submit" size="sm" disabled={loading || !input.trim()}>
              Send
            </Button>
          </form>
        </div>
      )}
    </>
  );
}

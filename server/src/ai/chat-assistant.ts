import { llmProvider } from "./llm-provider.js";
import { getStructuredCompletion } from "./structured-response.js";
import { ChatReplySchema, type ChatReply } from "../schemas/index.js";
import { CHAT_ASSISTANT_SYSTEM, buildChatPrompt } from "./prompts.js";
import type { FailureAnalysis } from "../schemas/index.js";

interface ChatContext {
  testInfo?: any;
  testDetails?: any;
  analysis?: FailureAnalysis;
}

function mockAnswer(message: string, context?: ChatContext): string {
  const a = context?.analysis;
  const lower = message.toLowerCase();

  if (!a) {
    return "No failure has been analyzed yet. Run \"Analyze Failure\" first so I have evidence and a root cause to reason about.";
  }

  if (/why.*fail|root cause|what.*cause/.test(lower)) {
    return `Based on the analysis (${a.confidence}% confidence): ${a.root_cause}`;
  }
  if (/product defect|test issue|application issue|is this a (product|app)/.test(lower)) {
    return a.application_defect
      ? "This is classified as an Application Defect — the evidence points to the application/service itself, not the test automation."
      : a.environment_issue
        ? "This looks like an Environment Issue rather than an application defect — the failure signature points to infrastructure/service availability, not application logic."
        : `This is currently classified as "${a.root_cause_category}", which is not an application defect based on the available evidence.`;
  }
  if (/p1|p2|priority|severity/.test(lower)) {
    return `Recommended priority is ${a.priority} with ${a.severity} severity, based on: ${a.business_impact}`;
  }
  if (/logs|evidence|collect|additional/.test(lower)) {
    return a.insufficient_evidence
      ? "The current evidence is thin. Please attach the full execution log, stack trace, and (if UI-related) a screenshot to increase confidence."
      : "Current evidence was sufficient for this analysis. For deeper confirmation, server-side logs/APM traces around the failure timestamp would help.";
  }
  if (/regression test|what tests/.test(lower)) {
    return `Use "Generate Regression Tests" to get a full list — at minimum, cover the exact failure condition (${a.root_cause_category}) plus the happy path.`;
  }
  if (/flaky/.test(lower)) {
    return a.is_flaky
      ? "Yes — this analysis flags it as a likely flaky test. Re-run several times before filing an application defect."
      : "This does not currently look flaky based on the evidence — it presents a consistent, reproducible failure signature.";
  }
  if (/block|release|go.?no.?go/.test(lower)) {
    return a.severity === "Critical"
      ? "Given the Critical severity and confirmed application defect, this should block the release until fixed and verified."
      : "This alone may not need to block release, but check the Release Risk page for the full picture across all open failures.";
  }

  return `Here's what I know from the current analysis: ${a.failure_summary} (Category: ${a.root_cause_category}, Severity: ${a.severity}, Confidence: ${a.confidence}%). Ask me something more specific and I'll do my best with the available context.`;
}

export async function askAssistant(
  message: string,
  context: ChatContext | undefined,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<ChatReply> {
  if (llmProvider.name === "mock") {
    return { answer: mockAnswer(message, context) };
  }

  return getStructuredCompletion<ChatReply>({
    system: CHAT_ASSISTANT_SYSTEM,
    prompt: buildChatPrompt(message, context, history),
    schema: ChatReplySchema,
    maxTokens: 800,
  });
}

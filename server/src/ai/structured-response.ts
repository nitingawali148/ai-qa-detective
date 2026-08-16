import type { ZodSchema } from "zod";
import { llmProvider, LLMError } from "./llm-provider.js";
import { CORRECTION_SUFFIX } from "./prompts.js";

/**
 * Safely extracts a JSON object from raw LLM text. Handles the common case
 * of the model wrapping JSON in markdown fences despite instructions not to.
 */
function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  const jsonSlice = firstBrace !== -1 && lastBrace !== -1 ? candidate.slice(firstBrace, lastBrace + 1) : candidate;
  return JSON.parse(jsonSlice);
}

export class StructuredAIError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "StructuredAIError";
  }
}

interface GetStructuredOptions {
  system: string;
  prompt: string;
  schema: ZodSchema;
  images?: { base64: string; mimeType: string }[];
  maxTokens?: number;
}

/**
 * Calls the configured LLM, parses its JSON response, and validates it
 * against the given Zod schema. On failure, retries ONCE with a correction
 * prompt. If it still fails, throws a StructuredAIError for the caller to
 * handle gracefully (never lets an invalid AI response reach the client).
 */
export async function getStructuredCompletion<T>(opts: GetStructuredOptions): Promise<T> {
  const attempt = async (prompt: string) => {
    const result = await llmProvider.complete({
      system: opts.system,
      prompt,
      images: opts.images,
      maxTokens: opts.maxTokens,
    });
    const parsed = extractJson(result.text);
    return opts.schema.parse(parsed);
  };

  try {
    return (await attempt(opts.prompt)) as T;
  } catch (firstError) {
    try {
      return (await attempt(opts.prompt + CORRECTION_SUFFIX)) as T;
    } catch (secondError) {
      if (firstError instanceof LLMError) throw firstError;
      throw new StructuredAIError(
        "AI analysis could not be completed. The AI provider returned a response that could not be validated.",
        secondError
      );
    }
  }
}

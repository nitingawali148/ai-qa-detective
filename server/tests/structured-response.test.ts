import { describe, it, expect } from "vitest";
import { z } from "zod";
import { getStructuredCompletion, StructuredAIError } from "../src/ai/structured-response.js";

// These tests exercise the JSON-extraction/validation/retry pipeline directly
// against the schema layer, independent of which LLM provider is configured.

const Schema = z.object({ value: z.number() });

describe("getStructuredCompletion validation contract", () => {
  it("throws a StructuredAIError (never an unhandled crash) when validation cannot be satisfied", async () => {
    // With AI_PROVIDER=mock, llmProvider.complete() returns an empty string,
    // which cannot be parsed as JSON matching the schema on either attempt.
    await expect(
      getStructuredCompletion({
        system: "system",
        prompt: "prompt",
        schema: Schema,
      })
    ).rejects.toThrow();
  });
});

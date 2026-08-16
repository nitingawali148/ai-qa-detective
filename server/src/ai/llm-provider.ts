/**
 * LLMProvider abstraction.
 *
 *   LLMProvider
 *       ├── AnthropicProvider  (Claude)
 *       ├── OpenAIProvider
 *       └── MockProvider       (works with zero API keys, for demos)
 *
 * Every AI feature in this app talks to the LLM exclusively through this
 * interface, so swapping providers never touches prompt or business logic.
 */

export interface LLMMessageContentImage {
  type: "image";
  base64: string;
  mimeType: string;
}

export interface LLMMessageContentText {
  type: "text";
  text: string;
}

export type LLMMessageContent = LLMMessageContentText | LLMMessageContentImage;

export interface LLMCompletionRequest {
  system: string;
  prompt: string;
  images?: { base64: string; mimeType: string }[];
  maxTokens?: number;
}

export interface LLMCompletionResult {
  text: string;
  provider: string;
  model: string;
}

export interface LLMProvider {
  readonly name: string;
  readonly supportsVision: boolean;
  readonly isConfigured: boolean;
  complete(request: LLMCompletionRequest): Promise<LLMCompletionResult>;
}

export class LLMError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "LLMError";
  }
}

// ── Anthropic (Claude) ──────────────────────────────────────────────────

class AnthropicProvider implements LLMProvider {
  readonly name = "anthropic";
  readonly supportsVision = true;
  private model: string;
  private pendingKey?: string;

  constructor(apiKey: string | undefined, model: string) {
    this.model = model;
    this.pendingKey = apiKey;
  }

  get isConfigured(): boolean {
    return !!this.pendingKey;
  }

  async complete(request: LLMCompletionRequest): Promise<LLMCompletionResult> {
    if (!this.pendingKey) {
      throw new LLMError("Anthropic API key is not configured.");
    }
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: this.pendingKey });

    const content: any[] = [];
    if (request.images) {
      for (const img of request.images) {
        content.push({
          type: "image",
          source: { type: "base64", media_type: img.mimeType, data: img.base64 },
        });
      }
    }
    content.push({ type: "text", text: request.prompt });

    try {
      const response = await client.messages.create({
        model: this.model,
        max_tokens: request.maxTokens ?? 2048,
        system: request.system,
        messages: [{ role: "user", content }],
      });
      const text = response.content
        .filter((b): b is { type: "text"; text: string } => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      return { text, provider: this.name, model: this.model };
    } catch (err) {
      throw new LLMError("Anthropic API request failed.", err);
    }
  }
}

// ── OpenAI ───────────────────────────────────────────────────────────────

class OpenAIProvider implements LLMProvider {
  readonly name = "openai";
  readonly supportsVision = true;
  private apiKey?: string;
  private model: string;

  constructor(apiKey: string | undefined, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  get isConfigured(): boolean {
    return !!this.apiKey;
  }

  async complete(request: LLMCompletionRequest): Promise<LLMCompletionResult> {
    if (!this.apiKey) {
      throw new LLMError("OpenAI API key is not configured.");
    }
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: this.apiKey });

    const contentParts: any[] = [{ type: "text", text: request.prompt }];
    if (request.images) {
      for (const img of request.images) {
        contentParts.push({
          type: "image_url",
          image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
        });
      }
    }

    try {
      const response = await client.chat.completions.create({
        model: this.model,
        max_tokens: request.maxTokens ?? 2048,
        messages: [
          { role: "system", content: request.system },
          { role: "user", content: contentParts },
        ],
      });
      const text = response.choices[0]?.message?.content ?? "";
      return { text, provider: this.name, model: this.model };
    } catch (err) {
      throw new LLMError("OpenAI API request failed.", err);
    }
  }
}

// ── Mock provider ────────────────────────────────────────────────────────
// Deterministic, rule-based "AI" so the full app works with zero API keys.
// Used automatically when AI_PROVIDER=mock or no key is configured.

class MockProvider implements LLMProvider {
  readonly name = "mock";
  readonly supportsVision = false;
  readonly isConfigured = true;

  async complete(request: LLMCompletionRequest): Promise<LLMCompletionResult> {
    // The mock provider never guesses free text — callers detect provider
    // name === "mock" and use deterministic rule-based generators instead.
    return { text: "", provider: this.name, model: "rule-based-mock" };
  }
}

export function createLLMProvider(): LLMProvider {
  const configured = (process.env.AI_PROVIDER || "mock").toLowerCase();

  if (configured === "anthropic") {
    const provider = new AnthropicProvider(
      process.env.ANTHROPIC_API_KEY,
      process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5"
    );
    if (provider.isConfigured) return provider;
    console.warn("[AI QA Detective] AI_PROVIDER=anthropic but ANTHROPIC_API_KEY is missing. Falling back to mock.");
    return new MockProvider();
  }

  if (configured === "openai") {
    const provider = new OpenAIProvider(process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL || "gpt-4o");
    if (provider.isConfigured) return provider;
    console.warn("[AI QA Detective] AI_PROVIDER=openai but OPENAI_API_KEY is missing. Falling back to mock.");
    return new MockProvider();
  }

  return new MockProvider();
}

export const llmProvider = createLLMProvider();

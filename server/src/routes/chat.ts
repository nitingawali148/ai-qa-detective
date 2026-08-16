import { Router } from "express";
import { ChatRequestSchema } from "../schemas/index.js";
import { validateBody } from "../utils/validate.js";
import { askAssistant } from "../ai/chat-assistant.js";
import { StructuredAIError } from "../ai/structured-response.js";
import { LLMError } from "../ai/llm-provider.js";

export const chatRouter = Router();

chatRouter.post("/", validateBody(ChatRequestSchema), async (req, res) => {
  try {
    const reply = await askAssistant(req.body.message, req.body.context, req.body.history);
    res.json(reply);
  } catch (err) {
    if (err instanceof LLMError || err instanceof StructuredAIError) {
      res.status(502).json({ error: err.message });
      return;
    }
    console.error("[chat] Unexpected error:", err);
    res.status(500).json({ error: "The assistant could not respond right now. Please try again." });
  }
});

import { Router } from "express";
import { GenerateDefectRequestSchema } from "../schemas/index.js";
import { validateBody } from "../utils/validate.js";
import { generateDefect } from "../ai/defect-generator.js";
import { StructuredAIError } from "../ai/structured-response.js";
import { LLMError } from "../ai/llm-provider.js";

export const defectRouter = Router();

defectRouter.post("/", validateBody(GenerateDefectRequestSchema), async (req, res) => {
  try {
    const defect = await generateDefect(req.body);
    res.json({ defect });
  } catch (err) {
    if (err instanceof LLMError || err instanceof StructuredAIError) {
      res.status(502).json({ error: err.message });
      return;
    }
    console.error("[defect] Unexpected error:", err);
    res.status(500).json({ error: "Defect generation failed. Please try again." });
  }
});

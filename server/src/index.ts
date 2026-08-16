import "dotenv/config";
import { createApp } from "./app.js";
import { llmProvider } from "./ai/llm-provider.js";

const PORT = Number(process.env.PORT) || 4000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`AI QA Detective server listening on http://localhost:${PORT}`);
  console.log(`AI provider: ${llmProvider.name}${llmProvider.name === "mock" ? " (no API key configured — demo mode)" : ""}`);
});

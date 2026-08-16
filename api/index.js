// Vercel serverless function entry point.
//
// This wraps the entire Express app (server/src/app.ts, compiled to
// server/dist/app.js by the root build command — see vercel.json) as a
// single Node.js serverless function. An Express app instance is itself a
// valid (req, res) handler, so exporting it as the default export is all
// Vercel needs.
//
// vercel.json rewrites every /api/* request to this function while
// preserving the original path, so Express's own internal routing
// (app.use("/api/dashboard", ...), etc.) sees the exact same paths it does
// when running as a normal long-running server.
//
// Caveat: serverless functions are stateless between cold starts. The
// in-memory failure history (server/src/store/historyStore.ts) persists
// only for the lifetime of a warm function instance — fine for a live demo
// session, but don't expect it to behave like a persistent database.
import { createApp } from "../server/dist/app.js";

const app = createApp();

export default app;

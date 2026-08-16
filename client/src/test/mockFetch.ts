import { vi } from "vitest";

/**
 * Minimal fetch router for tests: maps a path substring to a JSON response.
 * Keeps component tests decoupled from real network calls / a running server.
 */
export function mockFetch(routes: Record<string, unknown>) {
  const fn = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    const match = Object.entries(routes).find(([path]) => url.includes(path));
    if (!match) {
      // Deliberately no content-type header so the API client falls back to its
      // generic "Request failed with status 404." message, matching a real 404.
      return new Response("Not Found", { status: 404 });
    }
    return new Response(JSON.stringify(match[1]), { status: 200, headers: { "content-type": "application/json" } });
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

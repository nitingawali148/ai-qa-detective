// Captures each slide of presentation.html as a 1920x1080 PNG for the PPTX
// export. Requires `playwright` (and a cached Chromium build) — install with
// `npm install --no-save playwright` if not already present.
import { chromium } from "playwright";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = "D:/POC/AI Test Failure Analyzer";
const file = pathToFileURL(path.resolve(`${root}/presentation/presentation.html`)).href;
const outDir = `${root}/presentation/slides`;

// Playwright's default headless mode expects a "headless shell" build that may not
// be installed even when a full Chromium build is cached (run `npx playwright install`
// to fix properly). Fall back to the full browser binary if the default launch fails.
let browser;
try {
  browser = await chromium.launch();
} catch {
  const fs = await import("node:fs");
  const fallback = `${process.env.LOCALAPPDATA}\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe`;
  if (!fs.existsSync(fallback)) throw new Error("Chromium not found. Run: npx playwright install chromium");
  browser = await chromium.launch({ executablePath: fallback });
}
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });

await page.goto(file);
await page.waitForTimeout(400);

const slideCount = await page.evaluate(() => document.querySelectorAll(".slide").length);
console.log("Slide count:", slideCount);

for (let i = 1; i <= slideCount; i++) {
  await page.evaluate((id) => document.getElementById(id).scrollIntoView(), `slide-${i}`);
  await page.waitForTimeout(300);
  const num = String(i).padStart(2, "0");
  await page.screenshot({ path: `${outDir}/slide-${num}.png` });
  console.log("Captured slide", num);
}

await browser.close();

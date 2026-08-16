// Builds a real, downloadable .pptx from the slide screenshots.
// Each screenshot becomes one full-bleed slide image — this preserves the
// exact case-file visual design (custom fonts/textures/stamps) which would
// be lost trying to recreate it with native, editable PowerPoint shapes.
//
// Usage:
//   node presentation/shoot-slides.mjs   (captures docs/screenshots-equivalent PNGs — see below)
//   node presentation/build-pptx.mjs     (assembles them into the .pptx)
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

// pptxgenjs's package.json is missing "type": "module", so Node mis-loads its
// ESM build (dist/pptxgen.es.js) as CommonJS and crashes on its `import`
// statements — and its "exports" map blocks importing the CJS build by
// subpath directly. Work around both by require()-ing it via an absolute
// path, which bypasses the package's "exports" restriction entirely.
const require = createRequire(import.meta.url);
const pptxgenPath = require.resolve("pptxgenjs").replace(/pptxgen\.es\.js$/, "pptxgen.cjs.js");
const pptxgen = require(pptxgenPath);

const root = "D:/POC/AI Test Failure Analyzer";
const slidesDir = `${root}/presentation/slides`;
const outFile = `${root}/presentation/AI-QA-Detective-Presentation.pptx`;

const files = fs
  .readdirSync(slidesDir)
  .filter((f) => f.endsWith(".png"))
  .sort();

if (files.length === 0) {
  console.error("No slide PNGs found in", slidesDir, "— run presentation/shoot-slides.mjs first.");
  process.exit(1);
}

const pptx = new pptxgen();
pptx.defineLayout({ name: "WIDESCREEN", width: 13.333, height: 7.5 });
pptx.layout = "WIDESCREEN";
pptx.author = "AI QA Detective";
pptx.title = "AI QA Detective — Case File Presentation";

for (const file of files) {
  const slide = pptx.addSlide();
  slide.background = { path: path.join(slidesDir, file) };
}

await pptx.writeFile({ fileName: outFile });
console.log("Wrote", outFile);

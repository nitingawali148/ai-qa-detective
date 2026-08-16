# Presentation

A case-file-styled slide deck for presenting AI QA Detective — dark investigation-board aesthetic, pinned "evidence" screenshots, rubber-stamp verdicts, 12 slides, keyboard/click navigable.

- **`template.html`** — the deck's actual markup/CSS/JS, with `{{IMG_*}}` placeholders where screenshots get embedded.
- **`build.mjs`** — reads `template.html`, inlines 3 screenshots from `docs/screenshots/` as base64 data URIs, writes `presentation.html`.
- **`presentation.html`** — the generated, fully self-contained deck (~1.6 MB). **Not committed** (gitignored) — it's a build artifact; regenerate it with the command below.
- **`shoot-slides.mjs`** — screenshots each slide of `presentation.html` at 1920×1080 into `presentation/slides/` (needs `npm install --no-save playwright`, and a cached Chromium — `npx playwright install chromium` if you don't have one).
- **`build-pptx.mjs`** — assembles those screenshots into a real, downloadable **`AI-QA-Detective-Presentation.pptx`** (needs `npm install --no-save pptxgenjs`). Each PowerPoint slide is one full-bleed slide image — this preserves the exact case-file visual design (custom fonts, textures, stamps) that would be lost trying to rebuild it with native, editable PowerPoint shapes.
- **`slides/`** and **`AI-QA-Detective-Presentation.pptx`** — generated, gitignored; regenerate with the commands below.

## Rebuild

```bash
node presentation/build.mjs           # HTML deck (presentation.html)
node presentation/shoot-slides.mjs    # screenshots -> presentation/slides/*.png
node presentation/build-pptx.mjs      # -> AI-QA-Detective-Presentation.pptx
```

Open `presentation/presentation.html` directly in a browser (or publish it as a Claude Artifact) for the interactive version, or open `AI-QA-Detective-Presentation.pptx` in PowerPoint/Keynote/Google Slides for the downloadable, editable-order version.

## Navigating the deck

- **↓ / PageDown / Space** — next slide
- **↑ / PageUp** — previous slide
- **Home / End** — jump to first/last slide
- Click a dot in the left rail, or the ↑/↓ buttons bottom-right

## Updating content

Edit `template.html` directly — each slide is a `<section class="slide" id="slide-N">`. To swap in a different screenshot, add a new `{{IMG_X}}` placeholder in the markup and a matching `.replace(...)` line in `build.mjs` pointing at a file under `docs/screenshots/`.

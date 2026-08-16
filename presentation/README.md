# Presentation

A case-file-styled slide deck for presenting AI QA Detective — dark investigation-board aesthetic, pinned "evidence" screenshots, rubber-stamp verdicts, 12 slides, keyboard/click navigable.

- **`template.html`** — the deck's actual markup/CSS/JS, with `{{IMG_*}}` placeholders where screenshots get embedded.
- **`build.mjs`** — reads `template.html`, inlines 3 screenshots from `docs/screenshots/` as base64 data URIs, writes `presentation.html`.
- **`presentation.html`** — the generated, fully self-contained deck (~1.6 MB). **Not committed** (gitignored) — it's a build artifact; regenerate it with the command below.

## Rebuild

```bash
node presentation/build.mjs
```

Then open `presentation/presentation.html` directly in a browser, or publish it as a Claude Artifact.

## Navigating the deck

- **↓ / PageDown / Space** — next slide
- **↑ / PageUp** — previous slide
- **Home / End** — jump to first/last slide
- Click a dot in the left rail, or the ↑/↓ buttons bottom-right

## Updating content

Edit `template.html` directly — each slide is a `<section class="slide" id="slide-N">`. To swap in a different screenshot, add a new `{{IMG_X}}` placeholder in the markup and a matching `.replace(...)` line in `build.mjs` pointing at a file under `docs/screenshots/`.

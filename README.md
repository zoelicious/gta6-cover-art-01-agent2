# Coral Dawn — GTA 6 Cover Art Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/zoelicious/gta6-cover-art-01-agent2/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/zoelicious/gta6-cover-art-01-agent2/reward.svg)](https://make.fun/c/gta6-cover-art-01)

A bright, coral-dawn cover-art studio: drop in your own photos and it turns
them into a GTA-style multi-panel movie poster — **CORAL DAWN**, set in
Peach Cove — and exports it as a PNG to share.

## What it does

- **Hero-top billboard poster** (default): a full-width dawn hero band cut at
  a diagonal seam, three asymmetric panels below, and the giant striped
  title printed over the seam — plus hero-left, hero-right, hero-centre,
  six-grid and tilted-snapshot layouts.
- **6 colour grades, one click:** Coral Dawn (default), Sunset, Neon Night,
  Golden Hour, Teal Dusk, Ultraviolet — with paint, halftone, grain and
  glow sliders and a poster-ink toggle, so the poster looks printed by hand.
- **Poster furniture, all toggleable:** press-quote bar with 5 gold stars,
  VOL. 02 ticket badge, slanted THE + role tags on every panel, tagline pill,
  gold ORIGINAL COVER ART seal, billing block, barcode, COMING SOON pill and
  a palm-and-sunrise strip along the bottom.
- **Any photo:** add your own (click, drag-drop or paste), crop and position
  each panel by dragging, scroll to zoom, double-click to reset, shift-drag
  to swap — or fill several panels with different crops of one photo.
- **Fast and easy:** 3 steps from photo to PNG — 1080×1080, 1080×1350 and
  1920×1080 — with an Export-all-three button. Everything runs offline in
  the browser; photos never leave your device.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

## Build the entry

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

All lettering, frames, seals and badges are original, drawn with CSS and
canvas. No Rockstar logo, artwork or fonts. The display face is Anton and
the script face is Great Vibes, both under the SIL Open Font License (see
`app/fonts/`).

---

<sub>Entered on [make.fun](https://make.fun/?ref=nmy46sr8&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>

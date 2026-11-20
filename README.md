# Coral Dawn — GTA 6 Cover Art Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/zoelicious/gta6-cover-art-01-agent2/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/zoelicious/gta6-cover-art-01-agent2/reward.svg)](https://make.fun/c/gta6-cover-art-01)

Turn your own photos into a GTA 6-style cover poster — **Coral Dawn**, one crew
chasing the first light at Peach Cove. A big hero panel on the left, three
smaller panels stacked on the right, neon lettering glowing cyan to magenta
over a coral dawn horizon.

## What it does

- **6 layouts** — hero-left (default), hero-right, hero-top, hero-centre,
  six-grid, and a tilted-snapshot collage.
- **6 colour grades** — Coral Dawn, Sunset, Neon Night, Golden Hour, Teal
  Dusk, Ultraviolet — plus sliders for paint strength, halftone/poster-ink,
  grain, and neon glow.
- **Real poster furniture** — five gold stars and a press quote (“A SUNRISE
  YOU CAN HANG ON YOUR WALL” — THE CORAL LEDGER), a DAWN EDITION ticket box,
  role tags on every panel (THE DRIVER / THE GETAWAY / THE CAPTAIN / THE
  LOOKOUT), a sunrise strip with palm silhouettes, a FIRST LIGHT seal,
  COMING SOON, billing line, and a barcode.
- **Big striped lettering** — CORAL DAWN in a coral → peach → lemon gradient
  with a hard offset shadow and sparkles, or a smooth cyan → magenta neon
  glow; the script subtitle “first light, last getaway” glows cyan over the
  title’s lower edge.
- **Your photos, your crops** — add photos by click, drag & drop, or paste;
  click a panel to select it, drag to pan, scroll to zoom, shift-drag to
  swap two panels, double-click to reset. Five sample photos are built in,
  so the studio is never empty.
- **One-click export** — full-resolution PNG re-rendered on canvas at
  1920 × 1080, 1080 × 1080, or 1080 × 1350, or all three at once.

Everything is original: no Rockstar logo, artwork, or fonts. The display
faces are Anton and Great Vibes (SIL Open Font License, under `app/fonts/`).
Photos are read on your own machine and never uploaded.

## How to use

1. Open `app/index.html` in a desktop browser (or run `node serve.ts` and
   open http://localhost:8080).
2. Add your photos, or use the built-in samples.
3. Pick a layout and a grade, edit the title, subtitle, ribbon, and roles.
4. Click **Export PNG** — or **Export all three sizes**.

## Entry

Built for the [make.fun GTA 6 cover art bounty](https://make.fun/c/gta6-cover-art-01).
`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
to the output directory and writes `dossier.json` with the vendored
`vendor/makefun-app.ts` library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE).

---

Made with [make.fun](https://make.fun/r/nmy46sr8) — build your own AI agents and programs, enter competitions, and get ranked in the open.

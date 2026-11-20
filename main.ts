// Coral Dawn — a GTA 6 cover art studio for make.fun's gta6-cover-art-01.
// Node 22, standard library only. This program hands the entry in: it copies
// the app/ and screenshots/ folders beside this file into the output
// directory and writes output/dossier.json with the vendored make.fun
// library (vendor/makefun-app.ts, the kit's copy, unchanged).
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The gate's own caps: dossier text is capped at 160 KiB; screenshots at
// most 4 files of 256 KiB each; app/ at most 993 files and 48 MiB in all,
// no path over 1000 bytes. Those caps sit beside /output's own cap of
// 1000 entries and 64 MiB, shared by app/, screenshots/ and dossier.json.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

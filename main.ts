/* Coral Dawn — entrypoint.
   Copies app/ and screenshots/ from this repository into the output
   directory and writes the dossier buildDossier produces from them.
   Standard library only; runs under Node 22 with no install step. */
import { buildDossier } from './vendor/makefun-app.ts';
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

mkdirSync(outDir, { recursive: true });

for (const name of ['app', 'screenshots']) {
  const from = join(repoRoot, name);
  const to = join(outDir, name);
  if (existsSync(from)) cpSync(from, to, { recursive: true });
}

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log('wrote ' + join(outDir, 'dossier.json') + ' (' + dossier.length + ' bytes)');
